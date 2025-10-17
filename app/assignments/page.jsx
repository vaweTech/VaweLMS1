"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { mcqDb } from "../../lib/firebaseMCQs";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import CheckAuth from "../../lib/CheckAuth";
import { useRouter } from "next/navigation";
import { createSlug } from "../../lib/urlUtils";
import { 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter,
  Search,
  SortAsc,
  SortDesc
} from "lucide-react";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Memoized filtered and sorted assignments
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(assignment => assignment.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'course':
          aValue = a.courseTitle.toLowerCase();
          bValue = b.courseTitle.toLowerCase();
          break;
        case 'status':
          aValue = getStatusPriority(a);
          bValue = getStatusPriority(b);
          break;
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [assignments, filterType, sortBy, sortOrder, searchTerm]);

  // Get status priority for sorting
  const getStatusPriority = (assignment) => {
    if (!assignment.submission) {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      return dueDate < now ? 0 : 1; // Overdue first, then pending
    }
    if (assignment.submission.grade !== undefined) return 3; // Graded
    return 2; // Submitted
  };

  const fetchAssignments = useCallback(async (user, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      // First, get the student's accessible courses from their chapterAccess
      const directRef = doc(db, "students", user.uid);
      const directSnap = await getDoc(directRef);
      let studentData = null;

      if (directSnap.exists()) {
        studentData = directSnap.data();
      } else {
        const q = query(
          collection(db, "students"),
          where("uid", "==", user.uid)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          studentData = qSnap.docs[0].data();
        }
      }

      // Get list of courses the student has access to
      const accessibleCourseIds = studentData?.chapterAccess 
        ? Object.keys(studentData.chapterAccess).filter(courseId => 
            studentData.chapterAccess[courseId]?.length > 0
          )
        : [];

      // If student has no accessible courses, return empty
      if (accessibleCourseIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get all courses
      const coursesSnap = await getDocs(collection(db, "courses"));
      const allAssignments = [];

      // Process only accessible courses in batches for better performance
      const accessibleCourses = coursesSnap.docs.filter(doc => 
        accessibleCourseIds.includes(doc.id)
      );

      const batchSize = 5;
      for (let i = 0; i < accessibleCourses.length; i += batchSize) {
        const batch = accessibleCourses.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (courseDoc) => {
        const courseData = courseDoc.data();
        
          try {
        // Get assignments for this course from MCQ Firebase
            const assignmentsSnap = await getDocs(
              collection(mcqDb, "courses", courseDoc.id, "assignments")
            );
        
            // Process assignments in parallel
            await Promise.all(assignmentsSnap.docs.map(async (assignmentDoc) => {
          const assignmentData = assignmentDoc.data();
          
              try {
          // Check if student has submitted this assignment from MCQ Firebase
          const submissionsSnap = await getDocs(
            collection(mcqDb, "courses", courseDoc.id, "assignments", assignmentDoc.id, "submissions")
          );
          
          const userSubmission = submissionsSnap.docs.find(doc => doc.data().studentId === user.uid);
          
          allAssignments.push({
            id: assignmentDoc.id,
            courseId: courseDoc.id,
            courseTitle: courseData.title,
            ...assignmentData,
            submission: userSubmission ? {
              id: userSubmission.id,
              ...userSubmission.data(),
              submittedAt: userSubmission.data().submittedAt?.toDate?.() || new Date()
            } : null
          });
              } catch (error) {
                console.error(`Error processing assignment ${assignmentDoc.id}:`, error);
              }
            }));
          } catch (error) {
            console.error(`Error processing course ${courseDoc.id}:`, error);
          }
        }));
      }

      setAssignments(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError("Failed to load assignments. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!auth.currentUser) return;
    setRefreshing(true);
    await fetchAssignments(auth.currentUser, false);
  }, [fetchAssignments]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAssignments(user);
      } else {
      setLoading(false);
    }
    });
    return () => unsubscribe();
  }, [fetchAssignments]);

  const calculateMCQScore = (submission, assignment) => {
    if (assignment.type !== 'mcq' || !submission.mcqAnswers) return null;
    
    let correctAnswers = 0;
    let totalQuestions = assignment.questions?.length || 0;
    
    assignment.questions?.forEach((question, index) => {
      const studentAnswer = submission.mcqAnswers[index];
      
      // Handle multiple correct answers
      if (Array.isArray(question.correctAnswers)) {
        // Student answer should be an array for multiple choice
        if (Array.isArray(studentAnswer)) {
          // Check if arrays match (same elements, order doesn't matter)
          const sortedCorrect = [...question.correctAnswers].sort((a, b) => a - b);
          const sortedStudent = [...studentAnswer].sort((a, b) => a - b);
          
          if (JSON.stringify(sortedCorrect) === JSON.stringify(sortedStudent)) {
            correctAnswers++;
          }
        }
      } 
      // Handle legacy single correct answer (backward compatibility)
      else if (question.correctAnswer !== undefined) {
        if (studentAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      }
      // Handle new format single correct answer (array with one element)
      else if (Array.isArray(question.correctAnswers) && question.correctAnswers.length === 1) {
        if (studentAnswer === question.correctAnswers[0]) {
          correctAnswers++;
        }
      }
    });
    
    return totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  };

  const getStatusColor = (assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (!assignment.submission) {
      return dueDate < now ? "text-red-600" : "text-yellow-600";
    }
    
    if (assignment.submission.grade !== undefined) {
      return "text-green-600";
    }
    
    return "text-blue-600";
  };

  const getStatusText = (assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (!assignment.submission) {
      return dueDate < now ? "Overdue" : "Pending";
    }
    
    if (assignment.submission.grade !== undefined) {
      return `Graded (${assignment.submission.grade}/100)`;
    }
    
    return "Submitted";
  };

  const getStatusIcon = (assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (!assignment.submission) {
      return dueDate < now ? <AlertCircle size={16} /> : <Clock size={16} />;
    }
    
    if (assignment.submission.grade !== undefined) {
      return <CheckCircle size={16} />;
    }
    
    return <BookOpen size={16} />;
  };

  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress tests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Progress Tests</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckAuth>
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 text-gray-800 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">My Progress Tests</h1>
              <p className="text-gray-600">
                {filteredAssignments.length} of {assignments.length} progress tests
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can only see progress tests from courses where your trainer has unlocked chapters for you. Progress test due dates are automatically set to 3 days after the chapter is unlocked.
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search progress tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
                <option value="course">Course</option>
                <option value="status">Status</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent flex items-center justify-center gap-2"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          </div>

          {/* Progress Tests List */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              {searchTerm || filterType !== 'all' ? (
                <>
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No progress tests found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No progress tests available</h3>
                  <p className="text-gray-500">Progress tests will appear here once your trainer unlocks course chapters for you</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-transparent hover:border-l-cyan-500"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(assignment)}
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {assignment.title}
                      </h2>
                      </div>
                      <p className="text-gray-600 mb-1 text-sm sm:text-base flex items-center gap-2">
                        <BookOpen size={14} />
                        {assignment.courseTitle}
                      </p>
                      <p className="text-gray-600 mb-1 text-sm sm:text-base">
                        Type: {assignment.type === 'mcq' ? 'Multiple Choice Questions' : 'Coding Test'}
                      </p>
                      <p className="text-gray-600 text-sm sm:text-base flex items-center gap-2">
                        <Calendar size={14} />
                        {getDaysUntilDue(assignment.dueDate)}
                      </p>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(assignment)} bg-opacity-10 border border-current`}>
                        {getStatusText(assignment)}
                      </span>
                    </div>
                  </div>

                  {/* Submission Details */}
                  {assignment.submission && (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <h3 className="font-medium text-gray-800 mb-3 text-sm sm:text-base flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        Submission Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="mb-1"><strong>Submitted:</strong> {assignment.submission.submittedAt.toLocaleString()}</p>
                          {assignment.type === 'coding' && (
                            <p className="mb-1"><strong>Language:</strong> {assignment.submission.language}</p>
                          )}
                        </div>
                        <div>
                          {assignment.submission.grade !== undefined && (
                            <p className="mb-1"><strong>Grade:</strong> {assignment.submission.grade}/100</p>
                          )}
                          {assignment.type === 'mcq' && (
                            <p className="mb-1"><strong>Auto Score:</strong> {calculateMCQScore(assignment.submission, assignment)?.toFixed(1)}%</p>
                          )}
                        </div>
                      </div>
                      
                      {assignment.submission.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-xs sm:text-sm"><strong>Feedback:</strong> {assignment.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {!assignment.submission ? (
                      <button
                        onClick={() => router.push(`/courses/${createSlug(assignment.courseTitle)}/assignments/${assignment.id}`)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <BookOpen size={16} />
                        Take Progress Test
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/courses/${createSlug(assignment.courseTitle)}/assignments/${assignment.id}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        View Submission
                      </button>
                    )}
                    
                    <button
                      onClick={() => router.push(`/courses/${createSlug(assignment.courseTitle)}`)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <BookOpen size={16} />
                      View Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CheckAuth>
  );
}
