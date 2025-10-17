"use client";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    const passRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>/?]).{8,}$/;

    if (!passRegex.test(password)) {
      setMessage("❌ Password must be 8+ chars, 1 uppercase, 1 number, 1 special character.");
      return;
    }

    if (password !== confirm) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    // Normally call API to update password here
    setMessage("✅ Password reset successfully! You can now login.");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Reset Password</h1>
        <form onSubmit={handleReset} className="space-y-4">
          {/* New password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-200 text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Confirm password */}
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-200 text-sm sm:text-base"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium">
            Reset Password
          </button>
        </form>

        {message && <p className="mt-4 text-xs sm:text-sm font-semibold">{message}</p>}
      </div>
    </div>
  );
}
