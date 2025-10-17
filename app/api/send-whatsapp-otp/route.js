import { NextResponse } from "next/server";
import { saveOtp, toE164 } from "@/lib/otpStore";

// Expect env vars for WhatsApp Cloud API
const WABA_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN; // Permanent/long-lived token
const WABA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // e.g. 726985100509267

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    // Check environment variables
    if (!WABA_TOKEN || !WABA_PHONE_NUMBER_ID) {
      console.error("❌ WhatsApp API not configured");
      console.error("Missing:", {
        hasToken: !!WABA_TOKEN,
        hasPhoneNumberId: !!WABA_PHONE_NUMBER_ID
      });
      return NextResponse.json({ 
        error: "Server not configured for WhatsApp API",
        details: "Please set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables"
      }, { status: 500 });
    }

    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "phone is required" }, { status: 400 });

    const phoneE164 = toE164(phone);
    const otp = generateOtp();

    console.log(`📤 Sending OTP to phone: ${phoneE164}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔐 Generated OTP: ${otp}`);
    }

    // Save OTP for 10 minutes
    const tenMinutesMs = 10 * 60 * 1000;
    await saveOtp(phoneE164, otp, tenMinutesMs);
    
    console.log(`✅ OTP saved successfully for ${phoneE164}`);

    // Prepare payload per provided template
    const payload = {
      messaging_product: "whatsapp",
      to: phoneE164.replace("+", ""), // WhatsApp expects country code without +
      type: "template",
      template: {
        name: "verifiaction_code", // template name as provided
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: otp },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: otp },
            ],
          },
        ],
      },
    };

    const url = `https://graph.facebook.com/v23.0/${WABA_PHONE_NUMBER_ID}/messages`;
    
    console.log(`📞 Calling WhatsApp API: ${url}`);
    
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WABA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("❌ WhatsApp API Error:", {
        status: res.status,
        statusText: res.statusText,
        error: data
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to send WhatsApp message";
      if (data.error?.message) {
        errorMessage = data.error.message;
      }
      
      // Common errors
      if (data.error?.code === 100) {
        errorMessage = "Invalid template or template not approved. Please check your WhatsApp Business template.";
      } else if (data.error?.code === 131031) {
        errorMessage = "Template does not exist or has not been approved yet.";
      } else if (data.error?.code === 131047) {
        errorMessage = "Invalid template parameters. Check OTP placeholder in template.";
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: data,
        hint: "Check WhatsApp Business Manager for template approval status"
      }, { status: 500 });
    }

    console.log(`✅ WhatsApp message sent successfully:`, data);

    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json({ 
      ok: true, 
      debugOtp: isProd ? undefined : otp,
      messageId: data.messages?.[0]?.id
    });
  } catch (err) {
    console.error("❌ Unexpected error in send-whatsapp-otp:", err);
    return NextResponse.json({ 
      error: err.message || "Unexpected error",
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
    }, { status: 500 });
  }
}


