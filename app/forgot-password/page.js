"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showRedirectMsg, setShowRedirectMsg] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  useEffect(() => {
    if (submitted) {
      // Show redirect message after 1 second
      const msgTimer = setTimeout(() => {
        setShowRedirectMsg(true);
      }, 1000);

      // Redirect after 5 seconds
      const redirectTimer = setTimeout(() => {
        router.push("/");
      }, 3000);

      return () => {
        clearTimeout(msgTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [submitted, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Forgot Password</h1>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your registered email"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-200 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium">
              Send Reset Link
            </button>
          </form>
        ) : (
          <p className="text-green-600 font-semibold text-sm sm:text-base">
            ✅ A reset link has been sent to your email.
            {showRedirectMsg && (
              <span className="block mt-2 text-gray-600 text-xs sm:text-sm">
                Redirecting to login in 3 seconds...
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
