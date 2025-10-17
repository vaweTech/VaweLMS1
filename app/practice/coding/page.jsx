"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import CheckAuth from "../../../lib/CheckAuth";

export default function CodingQuestionsPage() {
  const difficulties = ["easy", "medium", "hard"];
  const [difficulty, setDifficulty] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [solvedQuestions, setSolvedQuestions] = useState(new Set());

  useEffect(() => {
    async function fetchQuestions() {
      let q = collection(db, "questions");

      if (difficulty !== "all") {
        q = query(
          collection(db, "questions"),
          where("category", "==", difficulty.charAt(0).toUpperCase() + difficulty.slice(1))
        );
      }

      const snap = await getDocs(q);
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    fetchQuestions();
  }, [difficulty]);

  // Check which questions the current user has solved
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkSolvedQuestions(user.uid);
      } else {
        setSolvedQuestions(new Set());
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkSolvedQuestions(userId) {
    try {
      if (!userId) return;

      const userSolversRef = collection(db, "userSolutions");
      const q = query(userSolversRef, where("userId", "==", userId));
      const snap = await getDocs(q);
      
      const solvedIds = new Set();
      snap.docs.forEach(doc => {
        solvedIds.add(doc.data().questionId);
      });
      
      setSolvedQuestions(solvedIds);
    } catch (error) {
      console.error("Error checking solved questions:", error);
    }
  }

  return (
    <CheckAuth>
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 p-4 sm:p-6 lg:p-10 text-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Coding <span className="text-cyan-600">Questions</span>
          </h1>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
          >
            <option value="all">All</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {questions.length === 0 ? (
          <p className="text-gray-600 text-sm sm:text-base">No questions available.</p>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 p-4 rounded-lg shadow-md hover:shadow-lg transition gap-3"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {q.title}
                  </h2>
                  {solvedQuestions.has(q.id) && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                       Solved
                    </span>
                  )}
                </div>
                <Link href={`/practice/coding/${q.id}`}>
                                     <button className={`px-4 py-2 rounded-lg text-white shadow-md text-sm sm:text-base font-medium ${
                     solvedQuestions.has(q.id) 
                       ? "bg-green-500 hover:bg-green-600" 
                       : "bg-cyan-600 hover:bg-cyan-700"
                   }`}>
                     {solvedQuestions.has(q.id) ? "📋 View Solution" : "Solve"}
                   </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </CheckAuth>
  );
}
