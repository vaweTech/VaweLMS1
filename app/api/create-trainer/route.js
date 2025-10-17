import { NextResponse } from "next/server";
import admin, { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { name, email } = await req.json();
    if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

    // Create Firebase Auth user with default password
    const defaultPassword = "VaweTrainer@2025";
    const userRecord = await admin.auth().createUser({ email, password: defaultPassword, displayName: name });

    // Create/merge Firestore user doc with trainer role
    await adminDb.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role: "trainer",
      trainerPassword: defaultPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (e) {
    console.error("create-trainer error", e);
    return NextResponse.json({ error: e.message || "Failed to create trainer" }, { status: 500 });
  }
}


