import { adminDb } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { withAdminAuth, withRateLimit, validateInput } from "@/lib/apiAuth";
import { z } from 'zod';

// Input validation schema
const deleteStudentSchema = z.object({
  id: z.string().optional(),
  uid: z.string().optional(),
  email: z.string().email().optional()
}).refine(data => data.id || data.uid || data.email, {
  message: "At least one identifier (id, uid, or email) is required"
});

async function deleteStudentHandler(request) {
  try {
    const { id, uid: uidFromClient, email: emailFromClient } = request.validatedBody;
    // Input validation is now handled by middleware

    const studentsCol = adminDb.collection("students");
    let docRef = id ? studentsCol.doc(id) : null;
    let snap = docRef ? await docRef.get() : null;

    // If not found by id, try by uid
    if (!snap || !snap.exists) {
      if (uidFromClient) {
        const byUid = await studentsCol.where("uid", "==", uidFromClient).limit(1).get();
        if (!byUid.empty) {
          docRef = byUid.docs[0].ref;
          snap = byUid.docs[0];
        }
      }
    }

    // If still not found, try by normalized email
    if (!snap || !snap.exists) {
      if (emailFromClient) {
        const email = String(emailFromClient).trim().toLowerCase();
        const [local, domain] = email.split("@");
        let normalized = email;
        if (local && domain) {
          if (domain === "gmail.com" || domain === "googlemail.com") {
            const plusIndex = local.indexOf("+");
            const withoutPlus = plusIndex === -1 ? local : local.slice(0, plusIndex);
            const withoutDots = withoutPlus.replace(/\./g, "");
            normalized = `${withoutDots}@gmail.com`;
          } else {
            normalized = `${local}@${domain}`;
          }
        }
        const byEmail = await studentsCol.where("emailNormalized", "==", normalized).limit(1).get();
        if (!byEmail.empty) {
          docRef = byEmail.docs[0].ref;
          snap = byEmail.docs[0];
        }
      }
    }

    if (!snap || !snap.exists) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = snap.data();
    const uid = data?.uid || uidFromClient || null;

    if (uid) {
      try {
        await admin.auth().deleteUser(uid);
      } catch (authErr) {
        if (authErr?.code !== "auth/user-not-found") {
          console.warn("Failed to delete auth user:", authErr);
        }
      }
    }

    try {
      const paymentsRef = docRef.collection("payments");
      const paymentsSnap = await paymentsRef.get();
      const batch = adminDb.batch();
      paymentsSnap.forEach((p) => batch.delete(p.ref));
      await batch.commit();
    } catch (subErr) {
      console.warn("Failed to delete subcollections:", subErr);
    }

    await docRef.delete();

    // Add audit trail
    console.log(`Student deleted by ${request.user.email}: ${id || uid || emailFromClient}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedId: id, 
        deletedUid: uid || null,
        deletedBy: request.user.email
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Delete student error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to delete student" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Apply security middleware: Admin auth + Rate limiting + Input validation
export async function POST(request) {
  return await withAdminAuth(request, (req1) =>
    withRateLimit(30, 15 * 60 * 1000)(req1, (req2) =>
      validateInput(deleteStudentSchema)(req2, deleteStudentHandler)
    )
  );
}
