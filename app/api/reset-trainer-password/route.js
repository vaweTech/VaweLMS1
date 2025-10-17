import { NextResponse } from "next/server";
import admin, { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { uid, newPassword } = await req.json();
    if (!uid || !newPassword) return NextResponse.json({ error: "uid and newPassword required" }, { status: 400 });
    await admin.auth().updateUser(uid, { password: newPassword });
    await adminDb.collection('users').doc(uid).set({ trainerPassword: newPassword }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('reset-trainer-password error', e);
    return NextResponse.json({ error: e.message || 'Failed to reset password' }, { status: 500 });
  }
}


