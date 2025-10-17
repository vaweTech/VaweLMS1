"use client";
import AuthForm from "../../../components/AuthForm";
import { firebaseAuth } from "../../../lib/firebase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  async function handleRegister(email, password) {
    try {
      await firebaseAuth.register(email, password);
      router.push("/dashboard");
    } catch (err) {
      alert(err.message || "Registration failed");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Register</h1>
      <AuthForm onSubmit={handleRegister} submitLabel="Register" />
    </div>
  );
}
