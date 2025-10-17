"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../../lib/firebase";
import { mcqDb } from "../../../../../lib/firebaseMCQs";
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import CheckAuth from "../../../../../lib/CheckAuth";
import dynamic from "next/dynamic";
import { parseCourseUrl, createSlug } from "../../../../../lib/urlUtils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Stateless helpers
const getDefaultStarter = (language) => {
  if (language === "java") return `public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n    System.out.println("Hello, World!");\n  }\n}`;
  if (language === "python") return `# Write your solution here\nprint("Hello, World!")`;
  if (language === "c") return `#include <stdio.h>\nint main(){\n  // Write your solution here\n  printf("Hello, World!\\n");\n  return 0;\n}`;
  if (language === "cpp") return `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your solution here\n  cout << "Hello, World!" << endl;\n  return 0;\n}`;
  if (language === "javascript") return `// Write your solution here\nconsole.log("Hello, World!");`;
  if (language === "r") return `# Write your solution here\nprint("Hello, World!")\n\n# Simple calculation\nx <- c(1, 2, 3, 4, 5)\nmean_value <- mean(x)\ncat("Mean:", mean_value, "\\n")`;
  if (language === "mysql") return `-- Write your MySQL query here\nSELECT 'Hello, World!' AS message;\n\n-- Create and query a sample table\nCREATE TABLE IF NOT EXISTS users (\n  id INT PRIMARY KEY,\n  name VARCHAR(50)\n);\n\nINSERT INTO users VALUES (1, 'John Doe');\nSELECT * FROM users;`;
  if (language === "sql") return `-- Write your SQL query here\nSELECT 'Hello, World!' AS message;\n\n-- Create and query a sample table\nCREATE TABLE IF NOT EXISTS products (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  price DECIMAL(10,2)\n);\n\nINSERT INTO products VALUES (1, 'Product A', 99.99);\nSELECT * FROM products;`;
  return "";
};

const mapLanguage = (lang) => {
  if (lang === "java") return "java";
  if (lang === "python") return "python";
  if (lang === "c") return "c";
  if (lang === "cpp") return "cpp";
  if (lang === "javascript") return "javascript";
  if (lang === "r") return "r";
  if (lang === "mysql" || lang === "sql") return "sql";
  return "plaintext";
};

// Helper functions for input transformation
const transformForCompiler = (input) => {
  // Transform each line separately to preserve line breaks
  return input
    .split('\n')                    // Split by lines
    .map(line => 
      line
        .replace(/\[/g, '')         // Remove [ brackets
        .replace(/\]/g, '')         // Remove ] brackets  
        .replace(/,/g, ' ')         // Convert commas to spaces
        .replace(/#/g, '')          // Remove # prefix
        .replace(/\s+/g, ' ')       // Normalize multiple spaces to single space
        .trim()                     // Remove leading/trailing spaces
    )
    .join('\n');                    // Join lines back with line breaks
};

const transformForDisplay = (input) => {
  // Only transform # to " " for display, keep everything else as-is
  return input.replace(/#/g, '" "');
};

export default function AssignmentSubmissionPage() {
  const { id: urlSlug, assignmentId } = useParams();
  const router = useRouter();
  
  // Parse the URL to get the course slug
  const { slug } = parseCourseUrl(urlSlug);
  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState({
    mcqAnswers: {},
    codingSolution: "",
    language: "cpp"
  });
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [runningHidden, setRunningHidden] = useState(false);
  const [hiddenSummary, setHiddenSummary] = useState(null);
  const [hiddenStats, setHiddenStats] = useState(null); // { passCount, totalCount }
  const [testResults, setTestResults] = useState([]); // Array of test case results with outputs
  const [sampleTestResults, setSampleTestResults] = useState({}); // Object keyed by questionIndex for sample test results
  const [runningSampleTests, setRunningSampleTests] = useState({}); // Track which sample tests are running

  // Memoized progress computation (replaces repeated inline IIFEs)
  const answeredProgress = useMemo(() => {
    if (!assignment) return { answered: 0, total: 0 };
    if (assignment.type === 'mcq') {
      const totalQuestions = assignment.questions?.length || 0;
      // Count questions that have been answered (considering both single and multiple answer questions)
      let answeredCount = 0;
      for (let i = 0; i < totalQuestions; i++) {
        const answer = submission.mcqAnswers[i];
        if (answer !== undefined && answer !== null) {
          // For array answers (multiple choice), check if at least one option is selected
          if (Array.isArray(answer)) {
            if (answer.length > 0) answeredCount++;
          } else {
            // For single answer
            answeredCount++;
          }
        }
      }
      return { answered: answeredCount, total: totalQuestions };
    }
    // For coding assignments, count questions that have meaningful code
    const totalQuestions = assignment.questions?.length || 0;
    if (totalQuestions === 0) return { answered: 0, total: 0 };
    
    // Check if the coding solution is meaningful (not empty and not just the starter code)
    const hasMeaningfulCode = Boolean(
      submission.codingSolution &&
      submission.codingSolution.trim() !== '' &&
      submission.codingSolution !== getDefaultStarter(submission.language)
    );
    
    // For coding, if there's meaningful code, consider all questions as potentially answered
    // since coding solutions typically address all problems in the assignment
    return { answered: hasMeaningfulCode ? totalQuestions : 0, total: totalQuestions };
  }, [assignment, submission]);

  const fetchData = useCallback(async (user) => {
    try {
      let foundCourseId = null;

      // OPTIMIZATION: Parallel fetch of course data, assignment, student data, and user role
      const [coursesSnap, studentDataResult, userRoleResult] = await Promise.all([
        getDocs(collection(db, "courses")),
        
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
        })()
      ]);

      // Find course that matches the URL slug
      const allCourses = coursesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const matchingCourse = allCourses.find(course => {
        const courseSlug = createSlug(course.title);
        return courseSlug === slug;
      });

      if (!matchingCourse) {
        router.push(`/courses`);
        return;
      }

      foundCourseId = matchingCourse.id;
      setCourse(matchingCourse);
      setCourseId(matchingCourse.id);

      const studentData = studentDataResult;
      const userRole = userRoleResult;
      const isSuperAdmin = userRole === "superadmin";

      // Parallel fetch of assignment and existing submission
      const [assignmentSnap, submissionQuerySnap] = await Promise.all([
        getDoc(doc(mcqDb, "courses", foundCourseId, "assignments", assignmentId)),
        getDocs(query(
          collection(mcqDb, "courses", foundCourseId, "assignments", assignmentId, "submissions"),
          where("studentId", "==", user.uid)
        ))
      ]);
      
      if (!assignmentSnap.exists()) {
        router.push(`/courses/${urlSlug}`);
        return;
      }

      const assignmentData = assignmentSnap.data();
      setAssignment({ id: assignmentSnap.id, ...assignmentData });

      // Superadmin gets access to all assignments
      if (isSuperAdmin) {
        setHasAccess(true);
      } 
      // Check if user has access to the chapter corresponding to the assignment day
      else if (studentData?.chapterAccess && studentData.chapterAccess[foundCourseId]) {
        const allowedChapters = studentData.chapterAccess[foundCourseId];
        const assignmentDay = assignmentData.day || 1;
        
        // Get chapters to find the chapter ID for this day
        const chapterSnap = await getDocs(query(collection(db, "courses", foundCourseId, "chapters"), orderBy("order", "asc")));
        const chapters = chapterSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Check if the chapter for this day is accessible
        const targetChapter = chapters[assignmentDay - 1]; // Day 1 = index 0
        if (targetChapter && allowedChapters.includes(targetChapter.id)) {
          setHasAccess(true);
        }
      }

      // Process existing submission
      const userSubmission = submissionQuerySnap.empty ? null : submissionQuerySnap.docs[0];
      
      if (userSubmission) {
        const submissionData = userSubmission.data();
        setExistingSubmission({ id: userSubmission.id, ...submissionData });
        setSubmission({
          mcqAnswers: submissionData.mcqAnswers || {},
          codingSolution: submissionData.codingSolution || "",
          language: submissionData.language || "cpp"
        });
      }

    } catch (error) {
      console.error("Error fetching assignment:", error);
    } finally {
      setLoading(false);
    }
  }, [slug, assignmentId, router, urlSlug]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchData(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchData]);

  const handleMCQAnswer = (questionIndex, answerIndex) => {
    const question = assignment?.questions?.[questionIndex];
    const hasMultipleAnswers = Array.isArray(question?.correctAnswers) && question.correctAnswers.length > 1;
    
    if (hasMultipleAnswers) {
      // Handle checkbox (multiple selection)
      setSubmission(prev => {
        const currentAnswers = Array.isArray(prev.mcqAnswers[questionIndex]) 
          ? prev.mcqAnswers[questionIndex] 
          : [];
        
        const updatedAnswers = currentAnswers.includes(answerIndex)
          ? currentAnswers.filter(idx => idx !== answerIndex) // Remove if already selected
          : [...currentAnswers, answerIndex]; // Add if not selected
        
        return {
          ...prev,
          mcqAnswers: {
            ...prev.mcqAnswers,
            [questionIndex]: updatedAnswers
          }
        };
      });
    } else {
      // Handle radio button (single selection)
      setSubmission(prev => ({
        ...prev,
        mcqAnswers: {
          ...prev.mcqAnswers,
          [questionIndex]: answerIndex
        }
      }));
    }
  };

  const handleCodingChange = (value) => {
    setSubmission(prev => ({
      ...prev,
      codingSolution: value || ""
    }));
  };

  const handleLanguageChange = (language) => {
    setSubmission(prev => ({
      ...prev,
      language
    }));
  };

  const handleSubmitClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!auth.currentUser) return;

    setShowConfirmDialog(false);
    setSubmitting(true);
    try {
      // If coding assignment, run all test cases (visible + hidden) again before submitting
      let resultStatus = null;
      let testSummary = null;
      if (assignment?.type === 'coding') {
        const allTestCases = (assignment.questions || [])
          .flatMap((q) => Array.isArray(q.testCases) ? q.testCases : [])
          .filter(Boolean);
        let passCount = 0;
        let totalCount = allTestCases.length;
        let hadCompilerError = false;
        if (totalCount > 0) {
           for (const tc of allTestCases) {
             try {
               const res = await fetch('/api/compile', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   language: submission.language,
                   source: submission.codingSolution,
                   stdin: transformForCompiler(tc.input), // Transform input for compiler
                 }),
               });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              const actual = (data.stdout || '').trim();
              const expected = (tc.expectedOutput || tc.output || '').trim();
              const stderr = (data.stderr || '').trim();
              if (stderr) hadCompilerError = true;
              if (actual.toLowerCase() === expected.toLowerCase()) {
                passCount += 1;
              }
            } catch (_) {
              // Treat as failed test
            }
          }
        }
        // Determine result status
        if (totalCount > 0 && passCount === totalCount) {
          resultStatus = 'success';
        } else if (passCount > 0 && !hadCompilerError) {
          resultStatus = 'partial';
        } else {
          resultStatus = 'fail';
        }
        testSummary = { passCount, totalCount };
      } else if (assignment?.type === 'mcq') {
        const questions = assignment.questions || [];
        const totalCount = questions.length;
        let passCount = 0;
        if (totalCount > 0) {
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const userAnswer = submission.mcqAnswers?.[i];
            
            // Handle multiple correct answers
            if (Array.isArray(q.correctAnswers)) {
              if (Array.isArray(userAnswer)) {
                // Compare arrays (order doesn't matter)
                const sortedCorrect = [...q.correctAnswers].sort((a, b) => a - b);
                const sortedUser = [...userAnswer].sort((a, b) => a - b);
                if (JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser)) {
                  passCount += 1;
                }
              }
            } 
            // Handle legacy single correct answer
            else if (typeof q.correctAnswer === 'number') {
              if (userAnswer === q.correctAnswer) {
                passCount += 1;
              }
            }
          }
        }
        if (totalCount > 0 && passCount === totalCount) {
          resultStatus = 'success';
        } else if (passCount > 0) {
          resultStatus = 'partial';
        } else {
          resultStatus = 'fail';
        }
        testSummary = { passCount, totalCount };
      }

      const baseData = {
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || auth.currentUser.email,
        submittedAt: serverTimestamp(),
        resultStatus,
        testSummary,
        ...submission,
      };

      const autoScore = testSummary?.totalCount
        ? Math.round((testSummary.passCount / testSummary.totalCount) * 100)
        : null;

      const submissionData = autoScore !== null ? { ...baseData, autoScore } : baseData;

      if (existingSubmission) {
        // Update existing submission in MCQ Firebase
        await updateDoc(
          doc(mcqDb, "courses", courseId || course?.id, "assignments", assignmentId, "submissions", existingSubmission.id),
          submissionData
        );
      } else {
        // Create new submission in MCQ Firebase
        await addDoc(
          collection(mcqDb, "courses", courseId || course?.id, "assignments", assignmentId, "submissions"),
          submissionData
        );
      }

      if (assignment?.type === 'coding') {
        if (submissionData.resultStatus === 'success') {
          alert('Submission result: Success - All tests passed');
        } else if (submissionData.resultStatus === 'partial') {
          alert(`Submission result: Partial - ${submissionData.testSummary?.passCount || 0}/${submissionData.testSummary?.totalCount || 0} tests passed`);
        } else {
          alert('Submission result: Fail - 0 tests passed or compiler error');
        }
      } else {
        const scorePct = typeof submissionData.autoScore === 'number' ? `${submissionData.autoScore}%` : 'N/A';
        alert(`Assignment submitted! MCQ Score: ${scorePct}`);
      }
      router.push(`/courses/${urlSlug}`);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Error submitting assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = () => {
    setShowConfirmDialog(false);
  };

  const runSampleTestsForQuestion = async (questionIndex, question) => {
    if (!submission.codingSolution || submission.codingSolution.trim() === '') {
      alert('Please write some code before running tests.');
      return;
    }

    const testCases = question.testCases || [];
    if (testCases.length === 0) {
      alert('No test cases available for this question.');
      return;
    }

    try {
      setRunningSampleTests(prev => ({ ...prev, [questionIndex]: true }));
      
      const results = [];
      let passCount = 0;
      
       for (const tc of testCases) {
         try {
           const res = await fetch('/api/compile', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               language: submission.language,
               source: submission.codingSolution,
               stdin: transformForCompiler(tc.input), // Transform input for compiler
             }),
           });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const data = await res.json();
          const actual = (data.stdout || '').trim();
          const expected = (tc.expectedOutput || tc.output || '').trim();
          const stderr = (data.stderr || '').trim();
          const passed = actual.toLowerCase() === expected.toLowerCase();
          
          if (passed) passCount += 1;
          
          results.push({
            input: tc.input,
            expectedOutput: expected,
            actualOutput: actual,
            stderr: stderr,
            passed: passed,
            error: null
          });
        } catch (err) {
          results.push({
            input: tc.input,
            expectedOutput: tc.expectedOutput || tc.output || '',
            actualOutput: '',
            stderr: '',
            passed: false,
            error: err.message || 'Test execution failed'
          });
        }
      }
      
      setSampleTestResults(prev => ({
        ...prev,
        [questionIndex]: {
          results,
          passCount,
          totalCount: testCases.length
        }
      }));
      
      alert(`Sample Tests: ${passCount}/${testCases.length} passed`);
    } catch (e) {
      console.error('Sample tests run failed:', e);
      alert('Failed to run sample tests. Please try again.');
    } finally {
      setRunningSampleTests(prev => ({ ...prev, [questionIndex]: false }));
    }
  };

  // getDefaultStarter and mapLanguage are hoisted as stateless helpers above

  if (loading) return <div className="p-8">Loading assignment...</div>;
  if (!assignment) return <div className="p-8">Assignment not found.</div>;
  if (!hasAccess) return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don&apos;t have access to this assignment yet. Please complete the previous chapters first.
        </p>
        <button
          onClick={() => router.push(`/courses/${urlSlug}`)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
        >
          Back to Course
        </button>
      </div>
    </div>
  );

  return (
    <CheckAuth>
      <div className=" bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 text-gray-800 p-6">
        <div className=" mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/courses/${urlSlug}`)}
              className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Course
            </button>
            
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{assignment.title}</h1>
              <span className="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-800">
                {assignment.type === 'mcq' ? 'MCQ' : 'Coding'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/></svg>
                Day {assignment.day || 1}
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 19h14"/></svg>
                Due: {assignment.dueDate || '—'}
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/></svg>
                Course: {course?.title}
              </span>
            </div>
            
            {/* Progress Indicator */}
            {(() => {
              const { answered, total } = answeredProgress;
              const progressPercentage = total > 0 ? (answered / total) * 100 : 0;
              return (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">
                      Progress: {answered} of {total} questions answered
                    </span>
                    <span className="text-sm text-blue-600">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}
            
            {/* Submission Status */}
            {existingSubmission && (
              <div className="mt-4 p-4 rounded-lg border flex flex-wrap items-center justify-between gap-3 "
                style={{ borderColor: existingSubmission.resultStatus === 'success' ? '#bbf7d0' : existingSubmission.resultStatus === 'partial' ? '#fef08a' : '#fecaca', background: existingSubmission.resultStatus === 'success' ? '#f0fdf4' : existingSubmission.resultStatus === 'partial' ? '#fefce8' : '#fef2f2' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    existingSubmission.resultStatus === 'success' ? 'bg-green-100 text-green-800' : existingSubmission.resultStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {existingSubmission.resultStatus === 'success' ? 'Success' : existingSubmission.resultStatus === 'partial' ? 'Partial' : 'Fail'}
                  </span>
                  <p className={`font-medium ${existingSubmission.resultStatus === 'success' ? 'text-green-800' : existingSubmission.resultStatus === 'partial' ? 'text-yellow-800' : 'text-red-800'}`}>
                    Submitted on {existingSubmission.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                  </p>
                </div>
                {typeof existingSubmission.autoScore === 'number' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Auto Score</span>
                    <span className="text-sm font-semibold text-gray-900">{existingSubmission.autoScore}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assignment Content */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {assignment.type === 'mcq' ? (
              // MCQ Assignment
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-cyan-600">Multiple Choice Questions</h2>
                {assignment.questions && assignment.questions.map((question, qIndex) => {
                  const hasMultipleAnswers = Array.isArray(question.correctAnswers) && question.correctAnswers.length > 1;
                  const userAnswer = submission.mcqAnswers[qIndex];
                  
                  return (
                    <div key={qIndex} className="mb-8 p-4 border rounded-lg">
                      <h3 className="text-lg font-medium mb-4">
                        Question {qIndex + 1}: {question.question}
                      </h3>
                      {hasMultipleAnswers && (
                        <p className="text-sm text-blue-600 italic mb-3">
                          ✓ Select all correct answers
                        </p>
                      )}
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => {
                          const isChecked = hasMultipleAnswers 
                            ? (Array.isArray(userAnswer) && userAnswer.includes(oIndex))
                            : (userAnswer === oIndex);
                          
                          return (
                            <label key={oIndex} className={`flex items-center space-x-3 ${existingSubmission ? 'cursor-default' : 'cursor-pointer'}`}>
                              <input
                                type={hasMultipleAnswers ? "checkbox" : "radio"}
                                name={hasMultipleAnswers ? undefined : `question-${qIndex}`}
                                value={oIndex}
                                checked={isChecked}
                                onChange={existingSubmission ? undefined : () => handleMCQAnswer(qIndex, oIndex)}
                                disabled={existingSubmission}
                                className={`${hasMultipleAnswers ? 'w-4 h-4 rounded' : ''} text-cyan-600 focus:ring-cyan-500 ${existingSubmission ? 'opacity-50' : ''}`}
                              />
                              <span className={`text-gray-700 ${existingSubmission ? 'opacity-75' : ''}`}>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Coding Assignment
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-cyan-600">Coding Assignment</h2>
                  {hiddenStats && (
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          hiddenStats.passCount === hiddenStats.totalCount
                            ? 'bg-green-100 text-green-800'
                            : hiddenStats.passCount === 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {hiddenStats.passCount}/{hiddenStats.totalCount} tests passed
                      </span>
                      <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`${
                            hiddenStats.passCount === hiddenStats.totalCount ? 'bg-green-600' : 'bg-yellow-500'
                          } h-2`}
                          style={{ width: `${Math.round((hiddenStats.passCount / hiddenStats.totalCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Problem Description */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                {assignment.questions && assignment.questions.map((question, qIndex) => (
                  <div key={qIndex} className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">Problem {qIndex + 1}</h3>
                      <span className="text-xs text-gray-500">Test cases: {question.testCases?.length || 0}</span>
                    </div>
                    <div className="text-gray-700 mb-4 leading-7 whitespace-pre-wrap">{question.question}</div>
                    {question.description && (
                      <div className="mb-4 p-3 bg-white rounded border">
                        <h4 className="font-medium text-gray-800 font-semibold mb-2">Description</h4>
                        <div className="text-gray-700 leading-7 whitespace-pre-wrap">{question.description}</div>
                      </div>
                    )}
                    {question.testCases && question.testCases.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">Sample Test Cases</h4>
                          {!existingSubmission && (
                            <button
                              onClick={() => runSampleTestsForQuestion(qIndex, question)}
                              disabled={runningSampleTests[qIndex]}
                              className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-md shadow"
                            >
                              {runningSampleTests[qIndex] ? 'Running...' : 'Run Tests'}
                            </button>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 mb-4">
                          {question.testCases.map((testCase, tIndex) => (
                            <div key={tIndex} className="text-sm bg-white p-3 rounded border">
                              <p className="font-medium text-gray-800 font-semibold mb-1">Input</p>
                               <div className="bg-gray-100 rounded p-2 overflow-x-auto text-gray-700 whitespace-pre-wrap font-mono">{transformForDisplay(testCase.input)}</div>
                               <p className="font-medium text-gray-800 font-semibold mt-2 mb-1">Expected Output</p>
                               <div className="bg-gray-100 rounded p-2 overflow-x-auto text-gray-700 whitespace-pre-wrap font-mono">{transformForDisplay(testCase.expectedOutput || testCase.output)}</div>
                            </div>
                          ))}
                        </div>

                        {/* Display Sample Test Results */}
                        {sampleTestResults[qIndex] && (
                          <div className="mt-4">
                            <div className="flex items-center gap-3 mb-3">
                              <h5 className="font-semibold text-gray-800">Test Results</h5>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  sampleTestResults[qIndex].passCount === sampleTestResults[qIndex].totalCount
                                    ? 'bg-green-100 text-green-800'
                                    : sampleTestResults[qIndex].passCount === 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {sampleTestResults[qIndex].passCount}/{sampleTestResults[qIndex].totalCount} passed
                              </span>
                            </div>
                            <div className="space-y-3">
                              {sampleTestResults[qIndex].results.map((result, rIndex) => (
                                <div
                                  key={rIndex}
                                  className={`p-3 rounded-lg border-2 ${
                                    result.passed
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-red-50 border-red-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-800">
                                      Test Case {rIndex + 1}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                        result.passed
                                          ? 'bg-green-200 text-green-800'
                                          : 'bg-red-200 text-red-800'
                                      }`}
                                    >
                                      {result.passed ? '✓ PASSED' : '✗ FAILED'}
                                    </span>
                                  </div>

                                  <div className="grid gap-2 text-xs">
                                    {/* Input */}
                                    <div>
                                      <p className="font-medium text-gray-700 mb-1">Input:</p>
                                       <div className="bg-white border border-gray-300 rounded p-2 overflow-x-auto text-gray-800 whitespace-pre-wrap font-mono">
                                         {transformForDisplay(result.input || '(empty)')}
                                       </div>
                                     </div>

                                     {/* Expected Output */}
                                     <div>
                                       <p className="font-medium text-gray-700 mb-1">Expected Output:</p>
                                       <div className="bg-white border border-gray-300 rounded p-2 overflow-x-auto text-gray-800 whitespace-pre-wrap font-mono">
                                         {transformForDisplay(result.expectedOutput || '(empty)')}
                                       </div>
                                     </div>

                                     {/* Actual Output */}
                                     <div>
                                       <p className="font-medium text-gray-700 mb-1">Your Output:</p>
                                       <div
                                         className={`bg-white border rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono ${
                                           result.passed
                                             ? 'border-green-300 text-gray-800'
                                             : 'border-red-300 text-red-800'
                                         }`}
                                       >
                                         {transformForDisplay(result.actualOutput || '(empty)')}
                                       </div>
                                    </div>

                                    {/* Error or stderr if present */}
                                    {(result.error || result.stderr) && (
                                      <div>
                                        <p className="font-medium text-red-700 mb-1">
                                          {result.error ? 'Error:' : 'Standard Error:'}
                                        </p>
                                        <pre className="bg-red-100 border border-red-300 rounded p-2 overflow-x-auto text-red-800">
                                          {result.error || result.stderr}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                  </div>
                  {/* Language Selection */}
                  <div>
                <div className="mb-4">
                  <label className="block font-semibold text-sm font-medium text-gray-700 mb-2">
                    Programming Language:
                  </label>
                  <select
                    value={submission.language}
                    onChange={existingSubmission ? undefined : (e) => handleLanguageChange(e.target.value)}
                    disabled={existingSubmission}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 ${existingSubmission ? 'bg-gray-100 opacity-75' : ''}`}
                  >
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                    <option value="r">R</option>
                    <option value="mysql">MySQL</option>
                    <option value="sql">SQL (SQLite)</option>
                  </select>
                </div>

                {/* Code Editor */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {existingSubmission ? 'Your Submitted Solution:' : 'Your Solution:'}
                  </label>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <MonacoEditor
                      height="400px"
                      language={mapLanguage(submission.language)}
                      value={submission.codingSolution || getDefaultStarter(submission.language)}
                      onChange={existingSubmission ? undefined : handleCodingChange}
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        readOnly: existingSubmission,
                      }}
                    />
                  </div>
                </div>

                {/* Run Hidden Tests (no details shown) */}
                {!existingSubmission && (
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={async () => {
                        if (!submission.codingSolution || submission.codingSolution.trim() === '') {
                          alert('Please write some code before running tests.');
                          return;
                        }
                        try {
                          setRunningHidden(true);
                          setHiddenSummary(null);
                          setTestResults([]);
                          // Collect test cases across all coding questions
                          const allTestCases = (assignment.questions || [])
                            .flatMap((q) => Array.isArray(q.testCases) ? q.testCases : [])
                            .filter(Boolean);
                          // Detect hidden by multiple conventions
                          const hiddenTests = allTestCases.filter((tc) => tc && (tc.hidden === true || tc.isHidden === true || tc.visibility === 'hidden'));
                          const testsToRun = hiddenTests.length > 0 ? hiddenTests : allTestCases;
                          if (testsToRun.length === 0) {
                            alert('No tests configured.');
                            setRunningHidden(false);
                            return;
                          }
                          let passCount = 0;
                          const results = [];
                           for (const tc of testsToRun) {
                             try {
                               const res = await fetch('/api/compile', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({
                                   language: submission.language,
                                   source: submission.codingSolution,
                                   stdin: transformForCompiler(tc.input), // Transform input for compiler
                                 }),
                               });
                              if (!res.ok) throw new Error(`HTTP ${res.status}`);
                              const data = await res.json();
                              const actual = (data.stdout || '').trim();
                              const expected = (tc.expectedOutput || tc.output || '').trim();
                              const stderr = (data.stderr || '').trim();
                              const passed = actual.toLowerCase() === expected.toLowerCase();
                              if (passed) passCount += 1;
                              
                              // Store result details
                              results.push({
                                input: tc.input,
                                expectedOutput: expected,
                                actualOutput: actual,
                                stderr: stderr,
                                passed: passed,
                                error: null
                              });
                            } catch (err) {
                              // Treat error as failed test
                              results.push({
                                input: tc.input,
                                expectedOutput: tc.expectedOutput || tc.output || '',
                                actualOutput: '',
                                stderr: '',
                                passed: false,
                                error: err.message || 'Test execution failed'
                              });
                            }
                          }
                          const label = hiddenTests.length > 0 ? 'hidden tests' : 'tests';
                          const summary = `${passCount}/${testsToRun.length} ${label} passed`;
                          setHiddenSummary(summary);
                          setHiddenStats({ passCount, totalCount: testsToRun.length });
                          setTestResults(results);
                          alert(summary);
                        } catch (e) {
                          console.error('Hidden tests run failed:', e);
                          alert('Failed to run hidden tests. Please try again.');
                        } finally {
                          setRunningHidden(false);
                        }
                      }}
                      disabled={runningHidden}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md shadow"
                    >
                      {runningHidden ? 'Running Hidden Tests...' : 'Run Hidden Tests'}
                    </button>
                    {hiddenStats && (
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            hiddenStats.passCount === hiddenStats.totalCount
                              ? 'bg-green-100 text-green-800'
                              : hiddenStats.passCount === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {hiddenStats.passCount}/{hiddenStats.totalCount} tests passed
                        </span>
                        <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`${
                              hiddenStats.passCount === hiddenStats.totalCount
                                ? 'bg-green-600'
                                : 'bg-yellow-500'
                            } h-2`}
                            style={{ width: `${Math.round((hiddenStats.passCount / hiddenStats.totalCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Test Results Display */}
                {testResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Test Results</h3>
                    <div className="space-y-4">
                      {testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${
                            result.passed
                              ? 'bg-green-50 border-green-300'
                              : 'bg-red-50 border-red-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800">
                              Test Case {index + 1}
                            </h4>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                result.passed
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-red-200 text-red-800'
                              }`}
                            >
                              {result.passed ? '✓ PASSED' : '✗ FAILED'}
                            </span>
                          </div>

                          <div className="grid gap-3">
                            {/* Input */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Input:</p>
                               <div className="bg-white border border-gray-300 rounded p-2 text-sm overflow-x-auto text-gray-800 whitespace-pre-wrap font-mono">
                                 {transformForDisplay(result.input || '(empty)')}
                               </div>
                             </div>

                             {/* Expected Output */}
                             <div>
                               <p className="text-sm font-medium text-gray-700 mb-1">Expected Output:</p>
                               <div className="bg-white border border-gray-300 rounded p-2 text-sm overflow-x-auto text-gray-800 whitespace-pre-wrap font-mono">
                                 {transformForDisplay(result.expectedOutput || '(empty)')}
                               </div>
                             </div>

                             {/* Actual Output */}
                             <div>
                               <p className="text-sm font-medium text-gray-700 mb-1">Your Output:</p>
                               <div
                                 className={`bg-white border rounded p-2 text-sm overflow-x-auto whitespace-pre-wrap font-mono ${
                                   result.passed
                                     ? 'border-green-300 text-gray-800'
                                     : 'border-red-300 text-red-800'
                                 }`}
                               >
                                 {transformForDisplay(result.actualOutput || '(empty)')}
                               </div>
                            </div>

                            {/* Error or stderr if present */}
                            {(result.error || result.stderr) && (
                              <div>
                                <p className="text-sm font-medium text-red-700 mb-1">
                                  {result.error ? 'Error:' : 'Standard Error:'}
                                </p>
                                <pre className="bg-red-100 border border-red-300 rounded p-2 text-sm overflow-x-auto text-red-800">
                                  {result.error || result.stderr}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button - Only show if no existing submission */}
          {!existingSubmission && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmitClick}
                disabled={submitting}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-md transition"
              >
                {submitting ? "Submitting..." : "Submit Assignment"}
              </button>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">
                    Confirm Submission
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                     <strong>Alert:</strong> Once you submit this assignment, you cannot edit it anymore.
                  </p>
                  
                  {/* Progress Summary */}
                  {(() => {
                    const { answered, total } = answeredProgress;
                    const progressPercentage = total > 0 ? (answered / total) * 100 : 0;
                    return (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Questions Answered: {answered} out of {total}
                          </span>
                          <span className="text-sm text-gray-600">
                            {Math.round(progressPercentage)}% Complete
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <p className="text-sm text-gray-600 mt-4">
                    Are you sure you want to submit your assignment?
                  </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleReview}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Review
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-400"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CheckAuth>
  );
}