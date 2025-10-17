import { NextResponse } from "next/server";
import { verifyOtp, toE164, peekOtp } from "@/lib/otpStore";

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || otp === undefined || otp === null) {
      console.log("❌ Verify OTP: Missing phone or otp");
      return NextResponse.json({ error: "phone and otp are required" }, { status: 400 });
    }

    const phoneE164 = toE164(phone);
    const otpString = String(otp).trim();
    
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔍 Verifying OTP for phone: ${phoneE164}, OTP: ${otpString}`);
    }
    
    const result = await verifyOtp(phoneE164, otpString);

    if (!result.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`❌ OTP verification failed. Reason: ${result.reason}`);
      }
      
      // Determine HTTP status code based on error reason
      let status = 400; // default: bad request
      if (result.reason === "expired") status = 410; // gone
      else if (result.reason === "locked_out") status = 429; // too many requests
      else if (result.reason === "too_many_attempts") status = 429;
      
      let debug = {};
      if (process.env.NODE_ENV !== "production") {
        const expected = await peekOtp(phoneE164);
        debug = { debugExpectedOtp: expected || null };
        console.log(`🔍 Expected OTP: ${expected}`);
      }
      
      return NextResponse.json({ 
        ok: false, 
        reason: result.reason, 
        attemptsLeft: result.attemptsLeft,
        lockoutUntil: result.lockoutUntil,
        remainingMinutes: result.remainingMinutes,
        ...debug 
      }, { status });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ OTP verified successfully");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}


