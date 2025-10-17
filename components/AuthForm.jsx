"use client";
import { useState } from "react";

export default function AuthForm({ onSubmit, submitLabel }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(String(identifier || "").trim(), password);
      }}
      className="bg-white p-4 sm:p-6 rounded shadow space-y-3 sm:space-y-4 max-w-md mx-auto"
      autoComplete="off"
    >
      <div className="flex gap-2">
        <button
          type="button"
          className={`bg-blue-600 text-white px-3 py-1 rounded text-sm`}
        >
          Email / Password
        </button>
      </div>

      <>
          <div>
            <label className="block font-medium text-sm sm:text-base">Email</label>
            <input
              type="email"
              autoComplete="off"
              name="email"
              className="border p-2 sm:p-3 w-full rounded text-sm sm:text-base"
              placeholder="you@institute.edu"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.replace(/\s+/g, ""))}
            />
          </div>

          <div>
            <label className="block font-medium text-sm sm:text-base">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              name="current-password"
              className="border p-2 sm:p-3 w-full rounded text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 sm:py-3 rounded w-full text-sm sm:text-base font-medium">
            {submitLabel}
          </button>
        </>
    </form>
  );
}

