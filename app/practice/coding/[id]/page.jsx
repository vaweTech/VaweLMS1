"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { mcqDb } from "@/lib/firebaseMCQs";
import { doc, getDoc, runTransaction, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import Link from "next/link";

export default function SolveQuestionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Write your code here");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSolved, setIsSolved] = useState(false);
  const [userSubmission, setUserSubmission] = useState(null);

  const docRef = useMemo(() => (id ? doc(mcqDb, "codingQuestions", id) : null), [id]);

  // Check if the current user has already solved this question
  const checkIfSolved = useCallback(async () => {
    try {
      // Get current user from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // If no user found, wait a bit and try again (for cases where auth hasn't loaded yet)
        setTimeout(() => checkIfSolved(), 1000);
        return;
      }

      // Check if user exists in solvers list
      const userSolversRef = collection(mcqDb, "userSolutions");
      const q = query(
        userSolversRef,
        where("questionId", "==", id),
        where("userId", "==", currentUser.uid)
      );
      
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsSolved(true);
        // Fetch the specific user's submission
        const userSubmissionSnap = snap.docs[0];
        setUserSubmission({
          id: userSubmissionSnap.id,
          questionId: userSubmissionSnap.data().questionId,
          userId: userSubmissionSnap.data().userId,
          solvedAt: userSubmissionSnap.data().solvedAt,
          language: userSubmissionSnap.data().language,
          code: userSubmissionSnap.data().code,
        });
        // Set the code editor to show the submitted solution
        setCode(userSubmissionSnap.data().code);
        setLanguage(userSubmissionSnap.data().language);
      }
    } catch (error) {
      console.error("Error checking if solved:", error);
    }
  }, [id]);

  // Fetch question and check if user has solved it
  useEffect(() => {
    async function fetchQuestion() {
      if (!docRef) return;
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setQuestion({ id: snap.id, ...snap.data() });
        if (snap.data().starterCode) setCode(snap.data().starterCode);
      } else {
        setQuestion(undefined);
      }
    }
    fetchQuestion();
  }, [docRef]);

  // Listen for auth state changes and check if solved
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && question) {
        checkIfSolved();
      }
    });

    return () => unsubscribe();
  }, [question, checkIfSolved]);

  const judgeLanguages = {
    javascript: "javascript",
    python: "python",
    java: "java",
    c: "c",
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

  async function runCode(testCases) {
    if (!testCases?.length) return [];

    setLoading(true);
    const allResults = [];

    for (let tc of testCases) {
      try {
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: judgeLanguages[language],
            source: code,
            stdin: transformForCompiler(tc.input), // Transform input for compiler
          }),
        });

        const data = await res.json();
        const actual = (data.stdout || "").trim();
        const expected = (tc.output || "").trim();

        allResults.push({
          input: tc.input,
          expected,
          actual,
          status: data.status || "Error",
          pass: actual.toLowerCase() === expected.toLowerCase(),
        });
      } catch {
        allResults.push({
          input: tc.input,
          expected: tc.output,
          actual: "Error",
          status: "Error",
          pass: false,
        });
      }
    }

    setResults(allResults);
    setLoading(false);
    return allResults;
  }

  async function handleRun() {
    if (!question) return;
    await runCode(question.testCases.filter((tc) => !tc.hidden));
  }

  async function handleSubmit() {
    if (!question || !docRef) return;
    setSubmitting(true);
    try {
      const res = await runCode(question.testCases);
      if (res.every((r) => r.pass)) {
        // Record user solution and update question stats
        await runTransaction(mcqDb, async (tx) => {
          const snap = await tx.get(docRef);
          if (!snap.exists()) throw new Error("Question not found");
          tx.update(docRef, { solvers: (snap.data().solvers || 0) + 1 });
        });

        // Record that this user has solved this question
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const userSolversRef = collection(mcqDb, "userSolutions");
            await addDoc(userSolversRef, {
              questionId: id,
              userId: currentUser.uid,
              solvedAt: new Date(),
              language: language,
              code: code
            });
          }
        } catch (error) {
          console.error("Error recording user solution:", error);
        }

        // Mark as solved in UI
        setIsSolved(true);
        setToast({ type: "success", msg: "✅ All test cases passed! Question marked as solved!" });
      } else {
        setToast({ type: "error", msg: "❌ Some test cases failed!" });
      }
    } catch {
      setToast({ type: "error", msg: "Submission failed!" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (question === undefined)
    return (
      <div className="p-4 sm:p-6 lg:p-10">
        <p className="text-sm sm:text-base">❌ Question not found.</p>
        <Link href="practice/coding" className="text-cyan-700 underline text-sm sm:text-base">
          Back to list
        </Link>
      </div>
    );

  if (!question) return <div className="p-4 sm:p-6 lg:p-10 text-sm sm:text-base">Loading...</div>;

  const passedCount = results.filter((r) => r.pass).length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 gap-4">
        <Link href="/practice/coding">
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow text-sm sm:text-base">
            Back
          </button>
        </Link>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>

          <button
            onClick={handleRun}
            disabled={loading}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow text-white text-sm sm:text-base font-medium ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Running..." : "Run Code"}
          </button>

          {isSolved && (
            <button
              onClick={() => {
                // Scroll to submission details
                document.querySelector('.bg-green-50')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow text-white text-sm sm:text-base font-medium bg-blue-600 hover:bg-blue-700"
            >
              📋 View Submission
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || isSolved}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow text-white text-sm sm:text-base font-medium ${
              submitting ? "bg-gray-400" : isSolved ? "bg-green-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? "Submitting..." : isSolved ? "Solved" : "Submit"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-6 rounded p-3 text-white text-center font-medium text-sm sm:text-base ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Left: Question & Test Cases */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">{question.title}</h2>
            {isSolved && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                 Solved
              </span>
            )}
          </div>
          <div className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base whitespace-pre-wrap">{question.description}</div>

          <h3 className="text-base sm:text-lg font-semibold text-cyan-600 mb-3">Sample Test Cases</h3>
          <ul className="space-y-3">
            {question.testCases
              .filter((tc) => !tc.hidden)
              .map((tc, idx) => (
                <li key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm sm:text-base">
                    <span className="font-semibold">Input:</span>
                  </p>
                   <div className="text-sm sm:text-base whitespace-pre-wrap bg-white p-2 rounded border mb-2 font-mono">{transformForDisplay(tc.input)}</div>
                   <p className="text-sm sm:text-base">
                     <span className="font-semibold">Output:</span>
                   </p>
                   <div className="text-sm sm:text-base whitespace-pre-wrap bg-white p-2 rounded border font-mono">{transformForDisplay(tc.output)}</div>
                </li>
              ))}
          </ul>
        </div>

        {/* Right: Code Editor & Results */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Submission Details - Show when solved */}
          {isSolved && userSubmission && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                 Your Solution
              </h3>
              <div className="space-y-2 text-sm sm:text-base">
                <p className="text-green-700">
                  <span className="font-semibold">Solved on:</span> {userSubmission.solvedAt?.toDate ? 
                    userSubmission.solvedAt.toDate().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 
                    new Date(userSubmission.solvedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                </p>
                <p className="text-green-700">
                  <span className="font-semibold">Language:</span> {userSubmission.language.charAt(0).toUpperCase() + userSubmission.language.slice(1)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
              {isSolved ? "Your Submitted Code" : "Code Editor"}
            </h3>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              disabled={isSolved}
              className={`w-full border border-gray-300 rounded p-3 font-mono text-xs sm:text-sm ${
                isSolved 
                  ? "bg-gray-50 text-gray-600 cursor-not-allowed" 
                  : "focus:outline-none focus:ring-2 focus:ring-cyan-400"
              }`}
            />
            {isSolved && (
              <p className="text-sm text-gray-500 mt-2 italic">
                This question has been solved. You can view your submission above.
              </p>
            )}
          </div>

          {results.length > 0 && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Results ({passedCount}/{totalCount} Passed)
              </h3>
              <div className="space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border text-xs sm:text-sm ${
                      r.pass ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                    }`}
                  >
                    <p className="font-semibold">Input:</p>
                     <div className="whitespace-pre-wrap bg-white p-2 rounded border mb-2 font-mono text-xs sm:text-sm">{transformForDisplay(r.input)}</div>
                     <p className="font-semibold">Expected:</p>
                     <div className="whitespace-pre-wrap bg-white p-2 rounded border mb-2 font-mono text-xs sm:text-sm">{transformForDisplay(r.expected)}</div>
                     <p className="font-semibold">Actual:</p>
                     <div className="whitespace-pre-wrap bg-white p-2 rounded border font-mono text-xs sm:text-sm">{transformForDisplay(r.actual)}</div>
                    <p>
                      <span className="font-semibold">Status:</span> {r.status}
                    </p>
                    <p className="font-semibold">{r.pass ? "✅ Passed" : "❌ Failed"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
