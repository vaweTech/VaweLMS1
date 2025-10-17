"use client";
import AuthForm from "../../../components/AuthForm";
import { firebaseAuth } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
 

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(email, password) {
    try {
      await firebaseAuth.login(email, password);
      router.push("/dashboard");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  }

  // No OTP state in email-only page

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Login</h1>

      {/* Email/password only */}
      <AuthForm
        onSubmit={handleLogin}
        submitLabel="Sign in"
      />
      
    </div>
  );
}
