"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth as emailAuth, firebaseAuth as emailFirebaseAuth } from "../lib/firebase";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
 


export default function LoginPage() {
  const router = useRouter();

  // States
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Email-only mode
  const [loginMode] = useState("email");

  // If already logged in, redirect to /main
  useEffect(() => {
    const unsub = emailFirebaseAuth.onAuthStateChanged(emailAuth, (user) => {
      if (user) {
        router.replace("/main");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => {
      unsub();
    };
  }, [router]);

  // reCAPTCHA will be created lazily when sending OTP

  // ---------------- LOGIN (Email) ----------------
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (loginMode === "phone") return; // safety guard
    setLoading(true);

    try {
      await emailFirebaseAuth.login(identifier, password);
      router.push("/main");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        alert("❌ You don't have institute credentials.");
      } else if (err.code === "auth/wrong-password") {
        alert("❌ Incorrect password.");
      } else {
        alert(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // No phone OTP code in email-only mode

  if (checkingAuth) {
    return (
      <div className="relative flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-200 p-4">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/10 blur-3xl animate-pulse [animation-delay:2s]" />
        </div>

        {/* Main loading container */}
        <div className="relative flex w-full max-w-md flex-col items-center rounded-3xl bg-white/90 px-8 py-12 shadow-2xl backdrop-blur-md border border-white/20">
          {/* Logo/Brand section */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-full w-full text-white">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V17a1 1 0 11-2 0v-.07a8.001 8.001 0 01-5.929-5.93H5a1 1 0 110-2h.07A8.001 8.001 0 0111 5.07V5a1 1 0 112 0v.07a8.001 8.001 0 015.93 5.93H19a1 1 0 110 2h-.07A8.001 8.001 0 0113 16.93z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">VAWE Institutes</h2>
            <p className="text-sm text-gray-600">Learning Management System</p>
          </div>

          {/* Modern loading animation */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative">
              {/* Outer rotating ring */}
              <div className="h-16 w-16 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
              
              {/* Inner pulsing dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loading text with typewriter effect */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              <span className="inline-block animate-pulse">Initializing</span>
              <span className="inline-block animate-bounce ml-1">.</span>
              <span className="inline-block animate-bounce ml-1 [animation-delay:0.2s]">.</span>
              <span className="inline-block animate-bounce ml-1 [animation-delay:0.4s]">.</span>
            </h3>
            <p className="text-sm text-gray-600">Setting up your learning environment</p>
          </div>

          {/* Progress indicator */}
          <div className="w-full max-w-xs">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>Loading</span>
              <span>Please wait</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-0 animate-[progress_2s_ease-in-out_infinite] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-2 gap-3 w-full">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Secure Access</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.5s]"></div>
              <span>Modern Platform</span>
            </div>
          </div>
        </div>

        {/* Custom CSS for progress animation */}
        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ---------------- RENDER ----------------
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-200 p-4 sm:p-6">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white/70 shadow-2xl backdrop-blur-md md:grid-cols-2">
        {/* Left visual panel */}
        <div className="relative hidden md:block">
          <Image
            src="/LmsImg.jpg"
            alt="VAWE LMS - Learning Platform"
            width={900}
            height={1200}
            className="h-full w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/5 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              
            </div>
        </div>

        {/* Right form panel */}
        <div className="flex w-full flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-blue-600/10 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-full w-full text-blue-600">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V17a1 1 0 11-2 0v-.07a8.001 8.001 0 01-5.929-5.93H5a1 1 0 110-2h.07A8.001 8.001 0 0111 5.07V5a1 1 0 112 0v.07a8.001 8.001 0 015.93 5.93H19a1 1 0 110 2h-.07A8.001 8.001 0 0113 16.93z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Welcome to VAWE Institutes</h1>
              <p className="mt-1 text-sm text-gray-500">Login with your institute credentials</p>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Email / Password
              </button>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4 sm:space-y-5">
              {/* Identifier: Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="identifier">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M2.25 4.5A2.25 2.25 0 014.5 2.25h15a2.25 2.25 0 012.25 2.25v15a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 19.5v-15zM4.5 6l7.5 6 7.5-6"/></svg>
                  </span>
                  <input
                    id="identifier"
                    type="email"
                    placeholder="you@institute.edu"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 pl-10 pr-3 py-3 text-sm sm:text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 1.5a5.25 5.25 0 00-5.25 5.25V9H6a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 006 21h12a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0018 9h-.75V6.75A5.25 5.25 0 0012 1.5zm-3.75 7.5V6.75a3.75 3.75 0 117.5 0V9h-7.5z"/></svg>
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-gray-300 bg-white/80 pl-10 pr-10 py-3 text-sm sm:text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition group-hover:translate-x-0" />
                    {loading ? "Logging in..." : "Sign in"}
                  </button>
                </>
              
            </form>
            
            
            {/* Welcome Message */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Welcome to VAWE Institutes
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your gateway to professional programming education. 
                  Learn, practice, and excel in software development.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <span className="bg-blue-50 px-2 py-1 rounded">Interactive Learning</span>
                  <span className="bg-blue-50 px-2 py-1 rounded">Expert Guidance</span>
                  <span className="bg-blue-50 px-2 py-1 rounded">Career Support</span>
                  <span className="bg-blue-50 px-2 py-1 rounded">Modern Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional SEO Content for Search Engines */}
      <div className="hidden">
        <h1>VAWE Institutes - Best Software Training Institute in Vijayawada</h1>
        <h2>Software Training Institutes in Vijayawada</h2>
        <h3>Programming Courses in Vijayawada</h3>
        <p>VAWE Institutes is the best software training institute in Vijayawada, offering comprehensive programming courses and advanced LMS solutions. We provide training in Python, Java, Web Development, React, and other modern technologies with placement assistance.</p>
        <p>Our software training and placement institute in Vijayawada has helped hundreds of students secure jobs in top IT companies. Join the leading software coaching center in Vijayawada today.</p>
        <ul>
          <li>Python Programming Course</li>
          <li>Java Programming Training</li>
          <li>Full Stack Web Development</li>
          <li>React Development Course</li>
          <li>Advanced LMS Platform</li>
          <li>Placement Assistance</li>
        </ul>
      </div>
    </div>
  );
}
