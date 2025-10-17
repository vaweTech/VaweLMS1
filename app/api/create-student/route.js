// app/api/create-student/route.js
import { adminDb } from "@/lib/firebaseAdmin";
import admin from 'firebase-admin';
import { withAdminAuth, withRateLimit, validateInput } from "@/lib/apiAuth";
import { z } from 'zod';
import crypto from 'crypto';

// Input validation schema
const createStudentSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  classId: z.string().min(1, 'Class ID is required'),
  regdNo: z.string().min(1, 'Registration number is required'),
  fatherName: z.string().optional(),
  address: z.string().optional(),
  phones: z.string().optional(),
  education: z.string().optional(),
  fees: z.number().optional(),
  courseTitle: z.string().optional()
}).passthrough();

// Minimal server-side normalization to E.164 (defaults to IN for 10-digit numbers)
function normalizeToE164(phoneRaw) {
  if (!phoneRaw) return undefined;
  const raw = String(phoneRaw).trim();
  if (/^\+\d{7,15}$/.test(raw)) return raw;
  let digits = raw.replace(/\D/g, "");
  while (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return `+91${digits}`; // assume IN default
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return undefined;
}

function normalizeEmail(rawEmail) {
  const email = (rawEmail || "").trim().toLowerCase();
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  // Apply Gmail normalization rules
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plusIndex = local.indexOf("+");
    const withoutPlus = plusIndex === -1 ? local : local.slice(0, plusIndex);
    const withoutDots = withoutPlus.replace(/\./g, "");
    return `${withoutDots}@gmail.com`;
  }
  return `${local}@${domain}`;
}

// Use fixed default password as requested
const DEFAULT_STUDENT_PASSWORD = 'Vawe@2025';

async function createStudentHandler(req) {
  const body = req.validatedBody;
  const { email, name, classId, regdNo } = body;
  
  // Use fixed default password for new student accounts
  const defaultPassword = DEFAULT_STUDENT_PASSWORD;

  try {
    let userRecord;
    
    // Check if user already exists in Firebase Auth
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log("User already exists in Firebase Auth:", userRecord.uid);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        // User doesn't exist, create new one
        // Prefer normalized phone over raw
        const phoneNormalized = normalizeToE164(body.phone || body.phone1);
        const createPayload = {
          email,
          password: defaultPassword,
          displayName: name,
        };
        if (phoneNormalized) {
          createPayload.phoneNumber = phoneNormalized;
        }
        userRecord = await admin.auth().createUser(createPayload);
        console.log("Created new Firebase Auth user:", userRecord.uid);
      } else {
        throw authError;
      }
    }

    // Backfill phone on existing auth user if missing and provided
    const phoneNormalized = normalizeToE164(body.phone || body.phone1);
    if (phoneNormalized && !userRecord.phoneNumber) {
      try {
        await admin.auth().updateUser(userRecord.uid, { phoneNumber: phoneNormalized });
        userRecord = await admin.auth().getUser(userRecord.uid);
      } catch (e) {
        console.warn('Unable to set phoneNumber on user:', e?.message || e);
      }
    }

    // Check if student already exists in Firestore (normalized email)
    const studentsRef = adminDb.collection("students");
    const emailNormalized = normalizeEmail(email);
    const existingStudent = await studentsRef
      .where("emailNormalized", "==", emailNormalized)
      .get();
    
    if (!existingStudent.empty) {
      return new Response(
        JSON.stringify({ error: "Student with this email already exists in the system" }),
        { status: 400 }
      );
    }

    // Check if registration number already exists
    const existingRegdNo = await studentsRef
      .where("regdNo", "==", regdNo)
      .get();
    
    if (!existingRegdNo.empty) {
      return new Response(
        JSON.stringify({ error: "Registration number already exists in the system" }),
        { status: 400 }
      );
    }

    // Save student in Firestore - persist all provided form fields
    await adminDb.collection("students").add({
      ...body, // regdNo, fatherName, address, phones, education, fees, etc.
      email,
      emailNormalized,
      name,
      classId,
      uid: userRecord.uid,
      role: "student",
      // Store default password for admin visibility in Student Info (note: security trade-off as requested)
      password: DEFAULT_STUDENT_PASSWORD,
      // Store phone fields for UI/searching
      phone1: body.phone1 || '',
      phone: phoneNormalized || body.phone || body.phone1 || '',
      coursesTitle: body.courseTitle ? [body.courseTitle] : [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid, // Track who created this student
    });

    // Log the default password for admin reference (consider sending via email instead)
    console.log(`Student created with default password: ${DEFAULT_STUDENT_PASSWORD}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        uid: userRecord.uid,
        message: "Student created successfully. Default password is Vawe@2025",
        defaultPassword: DEFAULT_STUDENT_PASSWORD
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

// Apply security middleware: Admin auth + Rate limiting + Input validation
export async function POST(request) {
  return await withAdminAuth(request, (req1) =>
    withRateLimit(30, 15 * 60 * 1000)(req1, (req2) =>
      validateInput(createStudentSchema)(req2, createStudentHandler)
    )
  );
}
