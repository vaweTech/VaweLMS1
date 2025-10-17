// app/api/get-last-registration/route.js
import { adminDb } from "@/lib/firebaseAdmin";
import admin from 'firebase-admin';

export async function GET() {
  try {
    // Get all students and sort by registration number
    const studentsRef = adminDb.collection("students");
    const snapshot = await studentsRef.orderBy("regdNo", "desc").limit(1).get();
    
    if (snapshot.empty) {
      return new Response(
        JSON.stringify({ lastRegdNo: "0" }),
        { status: 200 }
      );
    }

    const lastStudent = snapshot.docs[0].data();
    const lastRegdNo = lastStudent.regdNo || "0";

    return new Response(
      JSON.stringify({ lastRegdNo }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting last registration number:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
