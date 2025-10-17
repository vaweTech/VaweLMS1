"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { mcqDb } from "../../../lib/firebaseMCQs";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import CheckAuth from "../../../lib/CheckAuth";
import Image from "next/image";
import { parseCourseUrl, createSlug } from "../../../lib/urlUtils";
import {
  PlayCircle,
  FileText,
  Radio,
  BookOpen,
  FileDown,
  FileArchive,
  Video,
  AlertCircle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  Circle,
  Star,
} from "lucide-react";

// Function to convert URLs to embed URLs (YouTube and Google Drive)
const getEmbedUrl = (url) => {
  if (!url) return "";
  
  // Handle YouTube URLs
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // If it's already a YouTube embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Handle Google Drive URLs
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveMatch = url.match(driveRegex);
  
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  
  // If it's already a Google Drive embed URL, return as is
  if (url.includes('drive.google.com/file/d/') && url.includes('/preview')) {
    return url;
  }
  
  return url;
};

export default function CourseDetailsPage() {
  const { id: urlSlug } = useParams();
  const router = useRouter();
  
  // Parse the URL to get the course slug
  const { slug } = parseCourseUrl(urlSlug);
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progressTests, setProgressTests] = useState([]);
  const [accessibleChapters, setAccessibleChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrainerUser, setIsTrainerUser] = useState(false);

  const [openDay, setOpenDay] = useState(null);
  const [openVideoDay, setOpenVideoDay] = useState(null);
  const [showProgressTestModal, setShowProgressTestModal] = useState(false);
  const [selectedDayProgressTests, setSelectedDayProgressTests] = useState([]);
  const [progressTestSubmissions, setProgressTestSubmissions] = useState({});
  // Inline player for external links (live/recorded)
  const [customVideoDay, setCustomVideoDay] = useState(null);
  const [customVideoUrl, setCustomVideoUrl] = useState("");

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedChapterForFeedback, setSelectedChapterForFeedback] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackTrainer, setFeedbackTrainer] = useState(0);
  const [feedbackPractical, setFeedbackPractical] = useState(0);
  const [feedbackAdmin, setFeedbackAdmin] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [existingFeedbackLoaded, setExistingFeedbackLoaded] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [courseIdState, setCourseIdState] = useState(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);

  const fetchData = useCallback(async (user) => {
    try {
      setError(null);
      let allowedChapters = [];
      let trainerAllowedChapters = [];
      let courseId = null;

      // OPTIMIZATION 1: Parallel fetch of student data, user role, and all courses
      const [studentDataResult, userRoleResult, coursesSnap] = await Promise.all([
        // Get student data
        (async () => {
          const directRef = doc(db, "students", user.uid);
          const directSnap = await getDoc(directRef);
          
          if (directSnap.exists()) {
            return directSnap.data();
          } else {
            const q = query(
              collection(db, "students"),
              where("uid", "==", user.uid)
            );
            const qSnap = await getDocs(q);
            return qSnap.empty ? null : qSnap.docs[0].data();
          }
        })(),
        
        // Get user role
        (async () => {
          try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            return userSnap.exists() ? userSnap.data().role : undefined;
          } catch (_) {
            return undefined;
          }
        })(),
        
        // Get all courses (only once)
        getDocs(collection(db, "courses"))
      ]);

      const studentData = studentDataResult;
      const userRole = userRoleResult;
      const isSuperAdmin = userRole === "superadmin";
      const isTrainer = userRole === "trainer" || userRole === "admin" || userRole === "superadmin";
      setIsTrainerUser(isTrainer);

      // Find course by title/slug
      const allCourses = coursesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const matchingCourse = allCourses.find(course => {
        const courseSlug = createSlug(course.title);
        return courseSlug === slug;
      });

      if (!matchingCourse) {
        setError("Course not found");
        return;
      }

      courseId = matchingCourse.id;
      setCourse(matchingCourse);
      setCourseIdState(matchingCourse.id);

      if (studentData?.chapterAccess && studentData.chapterAccess[courseId]) {
        allowedChapters = studentData.chapterAccess[courseId];
      }

      // OPTIMIZATION 2: Parallel fetch of chapters and progress tests
      const [chapterSnap, progressTestSnap] = await Promise.all([
        getDocs(query(collection(db, "courses", courseId, "chapters"), orderBy("order", "asc"))),
        getDocs(collection(mcqDb, "courses", courseId, "assignments"))
      ]);

      const chapterData = chapterSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChapters(chapterData);

      const progressTestsData = progressTestSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProgressTests(progressTestsData);

      // OPTIMIZATION 3: Parallel fetch of trainer unlocks and all submissions
      const today = new Date();
      const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      
      const [trainerUnlockResult, submissionsResults] = await Promise.all([
        // Trainer unlocks
        (async () => {
          try {
            const trainerDayRef = doc(db, "unlocks", `trainer:${user.uid}|course:${courseId}|${ymd}`);
            const daySnap = await getDoc(trainerDayRef);
            if (daySnap.exists()) {
              return chapterData.map((c) => c.id);
            } else {
              // OPTIMIZATION: Parallel check of per-chapter trainer unlocks
              const unlockChecks = chapterData.map(ch =>
                getDoc(doc(db, "unlocks", `trainer:${user.uid}|course:${courseId}|chapter:${ch.id}|${ymd}`))
                  .then(snap => snap.exists() ? ch.id : null)
                  .catch(() => null)
              );
              const results = await Promise.all(unlockChecks);
              return results.filter(id => id !== null);
            }
          } catch (e) {
            return [];
          }
        })(),
        
        // OPTIMIZATION 4: Parallel fetch of submissions with WHERE query instead of fetching all
        Promise.all(
          progressTestsData.map(async (progressTest) => {
            try {
              const submissionsRef = collection(mcqDb, "courses", courseId, "assignments", progressTest.id, "submissions");
              const submissionQuery = query(submissionsRef, where("studentId", "==", user.uid));
              const submissionSnap = await getDocs(submissionQuery);
              
              if (!submissionSnap.empty) {
                const userSubmission = submissionSnap.docs[0];
                return {
                  progressTestId: progressTest.id,
                  submission: {
                    id: userSubmission.id,
                    ...userSubmission.data(),
                    submittedAt: userSubmission.data().submittedAt?.toDate?.() || new Date()
                  }
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching submission for progress test ${progressTest.id}:`, error);
              return null;
            }
          })
        )
      ]);

      trainerAllowedChapters = trainerUnlockResult;

      // Build submissions map
      const submissionsMap = {};
      submissionsResults.forEach(result => {
        if (result && result.submission) {
          submissionsMap[result.progressTestId] = result.submission;
        }
      });
      setProgressTestSubmissions(submissionsMap);

      // Merge student and trainer access, or grant all chapters to superadmin
      let merged;
      if (isSuperAdmin) {
        // Superadmin gets access to all chapters
        merged = chapterData.map((c) => c.id);
      } else {
        merged = Array.from(new Set([...(allowedChapters || []), ...(trainerAllowedChapters || [])]));
      }
      setAccessibleChapters(merged);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Failed to load course details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchData(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchData]);

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return "No due date";
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  const handleProgressTestClick = (dayIndex) => {
    const dayProgressTests = progressTests.filter(a => a.day === dayIndex + 1);
    
    if (dayProgressTests.length === 1) {
      // Single progress test - navigate directly
      router.push(`/courses/${urlSlug}/assignments/${dayProgressTests[0].id}`);
    } else if (dayProgressTests.length > 1) {
      // Multiple progress tests - show modal
      setSelectedDayProgressTests(dayProgressTests);
      setShowProgressTestModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowProgressTestModal(false);
    setSelectedDayProgressTests([]);
  };

  const getSubmissionStatus = (progressTestId) => {
    return progressTestSubmissions[progressTestId] || null;
  };

  const getStatusColor = (submission) => {
    if (!submission) return "bg-gray-100 text-gray-800";
    
    switch (submission.resultStatus) {
      case 'success': return "bg-green-100 text-green-800";
      case 'partial': return "bg-yellow-100 text-yellow-800";
      case 'fail': return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (submission) => {
    if (!submission) return <Circle size={16} className="text-gray-500" />;
    
    switch (submission.resultStatus) {
      case 'success': return <CheckCircle size={16} className="text-green-600" />;
      case 'partial': return <Clock size={16} className="text-yellow-600" />;
      case 'fail': return <X size={16} className="text-red-600" />;
      default: return <CheckCircle size={16} className="text-blue-600" />;
    }
  };

  function toggleCustomVideo(chapterId, url) {
    // If same chapter and same URL is open, close it; otherwise open it
    if (customVideoDay === chapterId && customVideoUrl === url) {
      setCustomVideoDay(null);
      setCustomVideoUrl("");
    } else {
      setCustomVideoDay(chapterId);
      setCustomVideoUrl(url || "");
      // always collapse the default chapter video when opening custom
      setOpenVideoDay(null);
    }
  }

  const openFeedback = async (chapter) => {
    setSelectedChapterForFeedback(chapter);
    setShowFeedbackModal(true);
    setExistingFeedbackLoaded(false);
    try {
      if (!currentUser || !courseIdState) return;
      const feedbackRef = doc(
        db,
        "courses",
        courseIdState,
        "chapters",
        chapter.id,
        "feedback",
        currentUser.uid
      );
      const snap = await getDoc(feedbackRef);
      if (snap.exists()) {
        const data = snap.data();
        setFeedbackRating(data.rating || 0);
        setFeedbackTrainer((data.trainer ?? data.understanding) || 0);
        setFeedbackPractical((data.practicalOriented ?? data.pace) || 0);
        setFeedbackAdmin((data.admin ?? data.clarity) || 0);
        setFeedbackComments(data.comments || "");
      } else {
        setFeedbackRating(0);
        setFeedbackTrainer(0);
        setFeedbackPractical(0);
        setFeedbackAdmin(0);
        setFeedbackComments("");
      }
    } catch (e) {
      console.error("Error loading feedback:", e);
    } finally {
      setExistingFeedbackLoaded(true);
    }
  };

  const closeFeedback = () => {
    setShowFeedbackModal(false);
    setSelectedChapterForFeedback(null);
  };

  const submitFeedback = async () => {
    if (!currentUser || !courseIdState || !selectedChapterForFeedback) return;
    if (feedbackRating <= 0) return; // minimal validation
    setSubmittingFeedback(true);
    try {
      const feedbackRef = doc(
        db,
        "courses",
        courseIdState,
        "chapters",
        selectedChapterForFeedback.id,
        "feedback",
        currentUser.uid
      );
      await setDoc(
        feedbackRef,
        {
          rating: feedbackRating,
          trainer: feedbackTrainer,
          practicalOriented: feedbackPractical,
          admin: feedbackAdmin,
          comments: feedbackComments,
          userId: currentUser.uid,
          userEmail: currentUser.email || null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      closeFeedback();
    } catch (e) {
      console.error("Error submitting feedback:", e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Fullscreen functions
  const openFullscreen = (chapter) => {
    setFullscreenVideo(chapter);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenVideo(null);
  };

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Animated loader */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 bg-cyan-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Loading text with animation */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-gray-800 animate-pulse">
              Loading Course
            </h3>
            <p className="text-gray-600 text-sm">
              Fetching chapters, assignments, and progress data...
            </p>
          </div>
          
          {/* Skeleton loader */}
          <div className="mt-8 space-y-3">
            <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded animate-pulse w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    <CheckAuth>
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 text-gray-800 p-4 sm:p-6 lg:p-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-10 lg:mb-12">
          {course.image && (
            <div className="w-full max-h-48 sm:max-h-60 lg:max-h-72 rounded-lg sm:rounded-xl mb-4 sm:mb-5 lg:mb-6 shadow-lg overflow-hidden">
              <Image
                src={course.image}
                alt={course.title}
                width={800}
                height={288}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent px-4">
            {course.title}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 line-clamp-2 px-4">
            {course.description}
          </p>
        </div>

        {/* Syllabus Overview */}
        {course.syllabus && (
          <div className="max-w-3xl mx-auto mb-8 sm:mb-10 px-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-cyan-600 flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              Syllabus Overview
            </h2>
            <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-lg shadow-md border">
              <ul className="list-disc list-inside text-gray-700 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                {typeof course.syllabus === 'string' 
                  ? course.syllabus
                      .split('$').filter(item => item.trim().length > 0)
                      .map(
                        (item, idx) => (
                          <li key={idx} className="mb-1">
                            {item.trim()}
                          </li>
                        )
                      )
                  : Array.isArray(course.syllabus)
                  ? course.syllabus.map((item, idx) => (
                      <li key={idx} className="mb-1">{item}</li>
                    ))
                  : <li>{String(course.syllabus)}</li>
                }
              </ul>
            </div>
          </div>
        )}

        {/* Chapters (Programme) */}
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-5 lg:mb-6 text-cyan-600 flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            Programme
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {chapters.map((chapter, index) => {
              const hasAccess = accessibleChapters.includes(chapter.id);
              const isOpen = openDay === chapter.id;
              const hasVideo = chapter.video;
              const isVideoOpen = openVideoDay === chapter.id;

              return (
                <div
                  key={chapter.id}
                  className="border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Accordion Header */}
                  <button
                    disabled={!hasAccess}
                    onClick={() =>
                      setOpenDay(openDay === chapter.id ? null : chapter.id)
                    }
                    className={`w-full flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 ${
                      hasAccess
                        ? "bg-gray-200 hover:bg-gray-300 transition-colors"
                        : "bg-gray-100 cursor-not-allowed text-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-medium text-sm sm:text-base lg:text-lg text-left">
                        Day {index + 1}: {chapter.title}
                      </span>
                      {!hasAccess && (
                        <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                          Locked
                        </span>
                      )}
                    </div>
                    <span className="text-xl flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </span>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="p-3 sm:p-4 lg:p-5 bg-white flex flex-col gap-3 sm:gap-4">
                      {/* Topics */}
                      {chapter.topics && (
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-cyan-600 flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> Topics
                          </h3>
                          <ul className="list-disc list-inside text-gray-700 space-y-1 text-xs sm:text-sm lg:text-base">
                            {typeof chapter.topics === 'string' 
                              ? chapter.topics
                                  .split(".")
                                  .map(
                                    (topic, idx) =>
                                      topic.trim() && (
                                        <li key={idx}>{topic.trim()}</li>
                                      )
                                  )
                              : Array.isArray(chapter.topics)
                              ? chapter.topics.map((topic, idx) => (
                                  <li key={idx}>{topic}</li>
                                ))
                              : <li>{String(chapter.topics)}</li>
                            }
                          </ul>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                        {chapter.liveClassLink && (
                          <a
                            href={chapter.liveClassLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-400 hover:bg-rose-500 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                            <span className="hidden sm:inline">Live Class</span>
                            <span className="sm:hidden">Live</span>
                          </a>
                        )}

                        {chapter.recordedClassLink && (
                          <button
                            onClick={() => toggleCustomVideo(chapter.id, chapter.recordedClassLink)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                            <span className="hidden sm:inline">{customVideoDay === chapter.id && customVideoUrl === chapter.recordedClassLink ? "Hide Recorded" : "Recorded"}</span>
                            <span className="sm:hidden">Record</span>
                          </button>
                        )}

                        {hasVideo && (
                          <button
                            onClick={() => {
                              // close any custom video first to ensure only one is visible
                              setCustomVideoDay(null);
                              setCustomVideoUrl("");
                              setOpenVideoDay(isVideoOpen ? null : chapter.id);
                            }}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {isVideoOpen ? "Hide" : "Video"}
                          </button>
                        )}

                        {chapter.assessment && (
                          <a
                            href={chapter.assessment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                            <span className="hidden sm:inline">Assessment</span>
                            <span className="sm:hidden">Test</span>
                          </a>
                        )}

                        {chapter.pdfDocument && (
                          <button
                            onClick={() => router.push(`/view-pdf-secure?url=${encodeURIComponent(chapter.pdfDocument)}&title=${encodeURIComponent(chapter.title + ' - PDF')}`)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> PDF
                          </button>
                        )}

                        {chapter.classDocs && (
                          <button
                            onClick={() => router.push(`/view-ppt?url=${encodeURIComponent(chapter.classDocs)}&title=${encodeURIComponent(chapter.title + ' - PPTs')}`)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <FileArchive className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> PPT
                          </button>
                        )}

                        {/* Progress Test Button - Only show if user has access to this chapter */}
                        {hasAccess && (() => {
                          const dayProgressTests = progressTests.filter(a => a.day === index + 1);
                          return dayProgressTests.length > 0 ? (
                            <button
                              onClick={() => handleProgressTestClick(index)}
                              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                            >
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                              <span className="hidden sm:inline">Progress Test ({dayProgressTests.length})</span>
                              <span className="sm:hidden">Test</span>
                            </button>
                          ) : null;
                        })()}
               {/* Feedback Button */}
               {hasAccess && (
                          <button
                            onClick={() => openFeedback(chapter)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow-md transition text-xs sm:text-sm lg:text-base"
                          >
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                            <span className="hidden sm:inline">Feedback</span>
                            <span className="sm:hidden">Rate</span>
                          </button>
                        )}


                      </div>

                      {/* Video */}
                        {isVideoOpen && hasVideo && (
                          <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md border border-gray-300 bg-gray-100 relative group">
                            <div className="w-full h-full scale-100 origin-center">
                              <iframe
                                src={getEmbedUrl(chapter.video)}
                                title={chapter.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen={false}
                                loading="lazy"
                                sandbox="allow-scripts allow-same-origin allow-presentation"
                                referrerPolicy="no-referrer"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                style={{
                                  pointerEvents: 'auto',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none'
                                }}
                              />
                            </div>
                            
                            {/* Fullscreen Button Overlay */}
                            <button
                              onClick={() => openFullscreen(chapter)}
                              className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                              title="Enter Fullscreen"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                              </svg>
                            </button>
                            
                            {/* Overlay to prevent right-click and text selection */}
                            <div 
                              className="absolute inset-0 pointer-events-none select-none"
                              onContextMenu={(e) => e.preventDefault()}
                              style={{
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none'
                              }}
                            />
                          </div>
                        )}

                        {/* Custom inline player for Live/Recorded links */}
                        {customVideoDay === chapter.id && customVideoUrl && (
                          <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md border border-gray-300 bg-gray-100 relative group">
                            <div className="w-full h-full scale-100 origin-center">
                              <iframe
                                src={getEmbedUrl(customVideoUrl)}
                                title={`${chapter.title} — external video`}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen={false}
                                loading="lazy"
                                sandbox="allow-scripts allow-same-origin allow-presentation"
                                referrerPolicy="no-referrer"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                style={{
                                  pointerEvents: 'auto',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none'
                                }}
                              />
                            </div>
                            {/* Fullscreen button overlay */}
                            <button
                              onClick={() => openFullscreen({ ...chapter, video: customVideoUrl })}
                              className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                              title="Enter Fullscreen"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                              </svg>
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Test Modal */}
        {showProgressTestModal && (
          <div className="fixed inset-0 bg-white-100/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                  Day {selectedDayProgressTests[0]?.day || 1} Progress Tests
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  {selectedDayProgressTests.map((progressTest, idx) => {
                    const submission = getSubmissionStatus(progressTest.id);
                    const isSubmitted = !!submission;
                    
                    return (
                      <div
                        key={progressTest.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-800 mb-1 truncate">
                              {progressTest.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {progressTest.type === 'mcq' ? 'MCQ' : 'Coding'}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">Due: {progressTest.dueDate || 'No due date'}</span>
                                <span className="sm:hidden">{progressTest.dueDate || 'No due'}</span>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                {getStatusIcon(submission)}
                                <span className="hidden sm:inline">{isSubmitted ? 'Submitted' : 'Not Submitted'}</span>
                                <span className="sm:hidden">{isSubmitted ? 'Done' : 'Pending'}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(submission)} whitespace-nowrap flex-shrink-0`}>
                            {isSubmitted ? (
                              submission.resultStatus === 'success' ? 'Completed' :
                              submission.resultStatus === 'partial' ? 'Partial' :
                              submission.resultStatus === 'fail' ? 'Failed' : 'Submitted'
                            ) : 'Pending'}
                          </span>
                        </div>

                        {/* Submission Details */}
                        {isSubmitted && (
                          <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 mb-2 sm:mb-3">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">
                                Submitted: {submission.submittedAt.toLocaleDateString()}
                              </span>
                              {typeof submission.autoScore === 'number' && (
                                <span className="font-medium text-gray-800">
                                  Score: {submission.autoScore}%
                                </span>
                              )}
                            </div>
                            {submission.testSummary && (
                              <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600">
                                Tests: {submission.testSummary.passCount}/{submission.testSummary.totalCount} passed
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            handleCloseModal();
                            router.push(`/courses/${urlSlug}/assignments/${progressTest.id}`);
                          }}
                          className={`w-full px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            isSubmitted
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isSubmitted ? 'View Submission' : 'Take Progress Test'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-4 sm:p-5 lg:p-6 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-white-100/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                  {selectedChapterForFeedback ? `Day ${chapters.findIndex(c => c.id === selectedChapterForFeedback.id) + 1}: ${selectedChapterForFeedback.title}` : "Class Feedback"}
                </h2>
                <button onClick={closeFeedback} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {!existingFeedbackLoaded ? (
                  <div className="text-center text-gray-600 text-sm sm:text-base">Loading...</div>
                ) : (
                  <div className="space-y-4 sm:space-y-5">
                    {/* Overall 5-star rating */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Overall rating for trainer (1-5)</label>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setFeedbackRating(n)}
                            className="p-0.5 sm:p-1"
                            aria-label={`Rate ${n}`}
                          >
                            <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${n <= feedbackRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category ratings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-700 mb-1">Trainer</label>
                        <div className="flex gap-0.5 sm:gap-1">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button" onClick={() => setFeedbackTrainer(n)} className="p-0.5">
                              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${n <= feedbackTrainer ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-700 mb-1">Practical Oriented</label>
                        <div className="flex gap-0.5 sm:gap-1">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button" onClick={() => setFeedbackPractical(n)} className="p-0.5">
                              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${n <= feedbackPractical ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-700 mb-1">Admin Support</label>
                        <div className="flex gap-0.5 sm:gap-1">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button" onClick={() => setFeedbackAdmin(n)} className="p-0.5">
                              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${n <= feedbackAdmin ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Comments for trainer (optional)</label>
                      <textarea
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                        placeholder="What went well? What can be improved?"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-5 lg:p-6 border-t border-gray-200">
                <button onClick={closeFeedback} className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">Cancel</button>
                <button
                  onClick={submitFeedback}
                  disabled={submittingFeedback || feedbackRating === 0}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-sm sm:text-base ${submittingFeedback || feedbackRating === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"}`}
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Video Modal */}
        {isFullscreen && fullscreenVideo && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="w-full h-full relative">
              {/* Close Button */}
              <button
                onClick={closeFullscreen}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              {/* Video Title */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-black/50 text-white px-2 sm:px-3 py-1 rounded-lg">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold">
                  Day {chapters.findIndex(c => c.id === fullscreenVideo.id) + 1}: {fullscreenVideo.title}
                </h3>
              </div>

              {/* Video Container */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-7xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={getEmbedUrl(fullscreenVideo.video)}
                    title={fullscreenVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={true}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    referrerPolicy="no-referrer"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm">
                Press ESC or click the X button to exit fullscreen
              </div>
            </div>
          </div>
        )}
      </div>
    </CheckAuth>
  );
}

