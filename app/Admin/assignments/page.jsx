"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { mcqDb } from "../../../lib/firebaseMCQs";
import { collection, getDocs, query, where } from "firebase/firestore";
import CheckAdminAuth from "../../../lib/CheckAdminAuth";

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // First, get all unique course IDs from unlocks collection
      const unlocksSnap = await getDocs(collection(db, "unlocks"));
      const unlockedCourseIds = new Set();
      
      unlocksSnap.docs.forEach(doc => {
        const data = doc.data();
        // Extract courseId from unlocks that have it
        if (data.courseId) {
          unlockedCourseIds.add(data.courseId);
        }
      });

      // If no courses are unlocked, show empty state
      if (unlockedCourseIds.size === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Fetch only unlocked courses from primary Firebase
      const coursesSnap = await getDocs(collection(db, "courses"));
      const coursesData = [];
      
      for (const courseDoc of coursesSnap.docs) {
        // Only include courses that have been unlocked
        if (!unlockedCourseIds.has(courseDoc.id)) {
          continue;
        }

        const courseData = { id: courseDoc.id, ...courseDoc.data() };
        
        // Fetch assignments for each unlocked course from MCQ Firebase
        const assignmentsSnap = await getDocs(collection(mcqDb, "courses", courseDoc.id, "assignments"));
        courseData.assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Only add courses that have assignments
        if (courseData.assignments.length > 0) {
          coursesData.push(courseData);
        }
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (courseId, assignmentId) => {
    try {
      // Fetch submissions from MCQ Firebase
      const submissionsSnap = await getDocs(
        collection(mcqDb, "courses", courseId, "assignments", assignmentId, "submissions")
      );
      
      const submissionsData = submissionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.() || new Date()
      }));
      
      // Sort by submission date (newest first)
      submissionsData.sort((a, b) => b.submittedAt - a.submittedAt);
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleAssignmentSelect = async (course, assignment) => {
    setSelectedCourse(course);
    setSelectedAssignment(assignment);
    await fetchSubmissions(course.id, assignment.id);
  };

  // Grading UI and handlers removed per requirements

  const calculateMCQScore = (submission, assignment) => {
    if (assignment.type !== 'mcq' || !submission.mcqAnswers) return null;
    
    let correctAnswers = 0;
    let totalQuestions = assignment.questions?.length || 0;
    
    assignment.questions?.forEach((question, index) => {
      if (submission.mcqAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    return totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  };

  if (loading) return (
    <CheckAdminAuth>
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unlocked courses...</p>
        </div>
      </div>
    </CheckAdminAuth>
  );

  return (
    <CheckAdminAuth>
      <div className="min-h-screen bg-gray-50 p-6">
      <button
          onClick={() => router.back()}
          className={`mb-4 px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white`}
        >
          ⬅ Back
        </button>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Progress Test Submissions</h1>
            {courses.length > 0 && (
              <p className="text-gray-600 mt-2">
                {courses.length} unlocked {courses.length === 1 ? 'course' : 'courses'} with progress tests
              </p>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only courses with unlocked chapters are shown here. Progress tests become available when trainers unlock the corresponding chapters.
              </p>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Unlocked Courses Yet</h3>
              <p className="text-gray-500">
                Progress test submissions will appear here once trainers unlock course chapters and students submit their tests.
              </p>
            </div>
          ) : (
            <>
              {/* Course and Progress Test Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Course Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Select Course</h2>
              <select
                id="courseSelect"
                name="courseSelect"
                value={selectedCourse?.id || ""}
                onChange={(e) => {
                  const course = courses.find(c => c.id === e.target.value);
                  setSelectedCourse(course);
                  setSelectedAssignment(null);
                  setSubmissions([]);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Test Selection */}
            {selectedCourse && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Select Progress Test</h2>
                <select
                  id="assignmentSelect"
                  name="assignmentSelect"
                  value={selectedAssignment?.id || ""}
                  onChange={(e) => {
                    const assignment = selectedCourse.assignments.find(a => a.id === e.target.value);
                    handleAssignmentSelect(selectedCourse, assignment);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">Choose a progress test...</option>
                  {selectedCourse.assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title} ({assignment.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Submissions List */}
          {selectedAssignment && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Submissions for: {selectedAssignment.title}
                </h2>
                <p className="text-gray-600 mt-2">
                  Course: {selectedCourse.title} | Type: {selectedAssignment.type.toUpperCase()}
                </p>
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No submissions yet for this assignment.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {submissions.map((submission) => {
                    const mcqScore = selectedAssignment.type === 'mcq'
                      ? calculateMCQScore(submission, selectedAssignment)
                      : null;
                    const codingScore = selectedAssignment.type === 'coding'
                      ? (typeof submission.autoScore === 'number' ? submission.autoScore : (submission.testSummary && submission.testSummary.totalCount ? Math.round((submission.testSummary.passCount / submission.testSummary.totalCount) * 100) : null))
                      : null;
                    const displayAutoScore = selectedAssignment.type === 'mcq'
                      ? (mcqScore !== null && mcqScore !== undefined ? `${mcqScore.toFixed(1)}%` : 'N/A')
                      : (codingScore !== null && codingScore !== undefined ? `${codingScore}%` : 'N/A');
                    return (
                      <div key={submission.id} className="p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">
                              {submission.studentName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {submission.submittedAt.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Auto Score</p>
                            <p className="text-xl font-semibold text-gray-800">{displayAutoScore}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </CheckAdminAuth>
  );
}
