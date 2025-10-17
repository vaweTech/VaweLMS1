// OTP store that is in-memory in development and Firestore-backed in production
import { adminDb } from "./firebaseAdmin";

// Use global to persist the Map across Next.js hot-reloads in development
const otpStore = global.otpStore || new Map();
if (!global.otpStore) {
  global.otpStore = otpStore;
  if (process.env.NODE_ENV !== "production") {
    console.log(`📦 Initialized persistent in-memory OTP store`);
  }
}
// Use Firestore only in production, or in development if not on Windows
// Windows has SSL/decoder issues with Firebase Admin SDK, so we use in-memory for dev
const isWindowsDev = process.platform === 'win32' && process.env.NODE_ENV !== "production";
let USE_FIRESTORE = !isWindowsDev && (!!adminDb || process.env.NODE_ENV === "production");
const MAX_ATTEMPTS = 3; // Reduced to 3 attempts before lockout
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes lockout
let firestoreFailureCount = 0;
const MAX_FIRESTORE_FAILURES = 3;

// Log storage method on first load
if (process.env.NODE_ENV !== "production") {
  console.log(`💾 OTP Storage: ${USE_FIRESTORE ? 'Firestore (with fallback)' : 'In-Memory'}`);
  if (isWindowsDev) {
    console.log(`🪟 Using in-memory storage on Windows to avoid SSL/decoder issues`);
  }
}

// Function to disable Firestore and fall back to in-memory
function fallbackToMemory(error) {
  firestoreFailureCount++;
  console.error(`❌ Firestore error (${firestoreFailureCount}/${MAX_FIRESTORE_FAILURES}):`, error.message);
  
  if (firestoreFailureCount >= MAX_FIRESTORE_FAILURES) {
    console.warn('⚠️  Too many Firestore failures. Falling back to in-memory storage.');
    USE_FIRESTORE = false;
    return true; // Fallback activated
  }
  return false; // Still trying Firestore
}

function normalizeOtp(value) {
  const str = String(value ?? "").trim();
  const digits = str.replace(/\D/g, "");
  return digits.length ? digits : str;
}

/**
 * Save OTP for a phone number with expiry timestamp
 * @param {string} phoneE164 - E.164 formatted phone like +919703589296
 * @param {string} otp - 6 digit OTP
 * @param {number} ttlMs - time to live in milliseconds
 */
export async function saveOtp(phoneE164, otp, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  const otpString = normalizeOtp(otp);
  if (USE_FIRESTORE) {
    try {
      const ref = adminDb.collection("otp").doc(phoneE164);
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const existing = snap.exists ? snap.data() : {};
        const otps = Array.isArray(existing.otps) ? existing.otps : [];
        otps.push({ code: otpString, createdAt: Date.now() });
        // keep last 5
        const pruned = otps.slice(-5);
        // Reset attempts and clear lockout when new OTP is sent
        tx.set(ref, { otps: pruned, expiresAt, attempts: 0, lockoutUntil: null }, { merge: true });
      });
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ OTP saved to Firestore for ${phoneE164}`);
      }
      // Reset failure count on success
      firestoreFailureCount = 0;
      return;
    } catch (error) {
      console.error(`❌ Failed to save OTP to Firestore:`, error);
      const fallbackActivated = fallbackToMemory(error);
      // If fallback is activated or we're still trying, continue to in-memory storage
      if (!fallbackActivated && process.env.NODE_ENV === "production") {
        // In production, throw the error if we haven't exceeded max failures
        throw error;
      }
      // Fall through to in-memory storage
    }
  }
  // In-memory storage (either as primary or fallback)
  const existing = otpStore.get(phoneE164);
  const otps = existing?.otps ? existing.otps.slice() : [];
  otps.push({ code: otpString, createdAt: Date.now() });
  const pruned = otps.slice(-5);
  // Reset attempts and clear lockout when new OTP is sent
  otpStore.set(phoneE164, { otps: pruned, expiresAt, attempts: 0, lockoutUntil: null });
  if (process.env.NODE_ENV !== "production") {
    console.log(`✅ OTP saved to in-memory store for ${phoneE164}`);
    console.log(`🔐 OTP Code: ${otpString} (expires in ${Math.round(ttlMs / 60000)} minutes)`);
  }
}

/**
 * Verify an OTP. Returns { ok: boolean, reason?: string, lockoutUntil?: number }
 */
export async function verifyOtp(phoneE164, otp) {
  let record;
  const now = Date.now();
  
  if (USE_FIRESTORE) {
    let ref; // Declare ref outside try block so it's accessible throughout
    try {
      ref = adminDb.collection("otp").doc(phoneE164);
      const snap = await ref.get();
      record = snap.exists ? snap.data() : null;
      
      if (process.env.NODE_ENV !== "production") {
        console.log(`🔍 Firestore lookup for ${phoneE164}: ${record ? 'Found' : 'Not Found'}`);
        if (record) {
          console.log(`📝 Record details:`, { 
            hasOtps: !!record.otps, 
            otpsCount: record.otps?.length || 0,
            expiresAt: new Date(record.expiresAt).toISOString(),
            attempts: record.attempts || 0
          });
        }
      }
      
      // Reset failure count on success
      firestoreFailureCount = 0;
      
      if (!record) {
        // Check in-memory as fallback
        if (process.env.NODE_ENV !== "production" && otpStore.has(phoneE164)) {
          console.log('📦 Falling back to in-memory storage for verification');
          record = otpStore.get(phoneE164);
        } else {
          return { ok: false, reason: "not_found" };
        }
      }
    } catch (error) {
      console.error(`❌ Firestore verification error:`, error);
      fallbackToMemory(error);
      // Try in-memory storage
      record = otpStore.get(phoneE164);
      if (!record) {
        return { ok: false, reason: "not_found" };
      }
      console.log('📦 Using in-memory storage for verification (Firestore failed)');
    }
    
    // Check if user is currently locked out (lockout hasn't expired yet)
    if (record.lockoutUntil && now < record.lockoutUntil) {
      const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
      return { 
        ok: false, 
        reason: "locked_out", 
        lockoutUntil: record.lockoutUntil,
        remainingMinutes 
      };
    }
    
    // If lockout has expired, clear it and reset attempts
    if (record.lockoutUntil && now >= record.lockoutUntil) {
      await ref.set({ lockoutUntil: null, attempts: 0 }, { merge: true }).catch(() => {});
      record.attempts = 0;
      record.lockoutUntil = null;
    }
    
    // Check if OTP has expired
    if (now > record.expiresAt) {
      await ref.delete().catch(() => {});
      return { ok: false, reason: "expired" };
    }
    
    const provided = normalizeOtp(otp);
    const codes = [
      ...((record.otps || []).map((x) => normalizeOtp(x.code))),
      record.otp ? normalizeOtp(record.otp) : undefined,
    ].filter(Boolean);
    const matched = codes.includes(provided);
    
    if (!matched) {
      const attempts = (record.attempts || 0) + 1;
      const attemptsLeft = MAX_ATTEMPTS - attempts;
      
      if (attempts >= MAX_ATTEMPTS) {
        // Lock out the user for 10 minutes
        const lockoutUntil = now + LOCKOUT_DURATION_MS;
        await ref.set({ attempts, lockoutUntil }, { merge: true }).catch(() => {});
        return { 
          ok: false, 
          reason: "locked_out", 
          lockoutUntil,
          remainingMinutes: 10 
        };
      }
      
      await ref.set({ attempts }, { merge: true }).catch(() => {});
      return { ok: false, reason: "mismatch", attemptsLeft };
    }
    
    await ref.delete().catch(() => {});
    return { ok: true };
  }

  // In-memory store (development)
  record = otpStore.get(phoneE164);
  if (process.env.NODE_ENV !== "production") {
    console.log(`🔍 In-memory lookup for ${phoneE164}: ${record ? 'Found' : 'Not Found'}`);
    if (record) {
      console.log(`📝 Record details:`, { 
        hasOtps: !!record.otps, 
        otpsCount: record.otps?.length || 0,
        expiresAt: new Date(record.expiresAt).toISOString(),
        attempts: record.attempts || 0,
        codes: record.otps?.map(o => o.code) || []
      });
    }
  }
  if (!record) return { ok: false, reason: "not_found" };
  
  // Check if user is currently locked out (lockout hasn't expired yet)
  if (record.lockoutUntil && now < record.lockoutUntil) {
    const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
    return { 
      ok: false, 
      reason: "locked_out", 
      lockoutUntil: record.lockoutUntil,
      remainingMinutes 
    };
  }
  
  // If lockout has expired, clear it and reset attempts
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    record.lockoutUntil = null;
    record.attempts = 0;
  }
  
  // Check if OTP has expired
  if (now > record.expiresAt) {
    otpStore.delete(phoneE164);
    return { ok: false, reason: "expired" };
  }
  
  const provided = normalizeOtp(otp);
  const codes = [
    ...((record.otps || []).map((x) => normalizeOtp(x.code))),
    record.otp ? normalizeOtp(record.otp) : undefined,
  ].filter(Boolean);
  const matched = codes.includes(provided);
  
  if (!matched) {
    record.attempts = (record.attempts || 0) + 1;
    const attemptsLeft = MAX_ATTEMPTS - record.attempts;
    
    if (record.attempts >= MAX_ATTEMPTS) {
      // Lock out the user for 10 minutes
      const lockoutUntil = now + LOCKOUT_DURATION_MS;
      record.lockoutUntil = lockoutUntil;
      return { 
        ok: false, 
        reason: "locked_out", 
        lockoutUntil,
        remainingMinutes: 10 
      };
    }
    
    return { ok: false, reason: "mismatch", attemptsLeft };
  }
  
  otpStore.delete(phoneE164);
  return { ok: true };
}

// DEV helper to peek the currently stored OTP (do NOT use in production responses)
export async function peekOtp(phoneE164) {
  if (USE_FIRESTORE) {
    const snap = await adminDb.collection("otp").doc(phoneE164).get();
    if (!snap.exists) return null;
    const record = snap.data();
    if (Date.now() > record.expiresAt) return null;
    // Return the most recent OTP from the otps array, or fallback to direct otp field
    if (Array.isArray(record.otps) && record.otps.length > 0) {
      return record.otps[record.otps.length - 1].code;
    }
    return record.otp;
  }
  const record = otpStore.get(phoneE164);
  if (!record) return null;
  if (Date.now() > record.expiresAt) return null;
  // Return the most recent OTP from the otps array, or fallback to direct otp field
  if (Array.isArray(record.otps) && record.otps.length > 0) {
    return record.otps[record.otps.length - 1].code;
  }
  return record.otp;
}

/** Clean up expired entries periodically */
// Cleanup timer only needed for in-memory dev store
if (!USE_FIRESTORE && !global.otpCleanupTimer) {
  global.otpCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        otpStore.delete(key);
        if (process.env.NODE_ENV !== "production") {
          console.log(`🗑️  Cleaned up expired OTP for ${key}`);
        }
      }
    }
  }, 60 * 1000);
  global.otpCleanupTimer.unref?.();
  if (process.env.NODE_ENV !== "production") {
    console.log(`⏰ OTP cleanup timer started`);
  }
}

/**
 * Normalize Indian phone numbers to E.164. If already looks E.164, pass through.
 */
export function toE164(phone) {
  const raw = String(phone).trim();
  // Handle 00 prefix (international) and leading +
  let cleaned = raw.startsWith("+") ? raw.slice(1) : raw;
  cleaned = cleaned.replace(/^00+/, "");
  cleaned = cleaned.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return "+" + cleaned;
  // Default to India if 10 digits
  if (cleaned.length === 10) return "+91" + cleaned;
  return "+" + cleaned;
}


