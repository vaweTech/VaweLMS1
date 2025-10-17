export const runtime = "nodejs";

import Razorpay from "razorpay";
import { withAuth, withRateLimit, validateInput } from "@/lib/apiAuth";
import { z } from 'zod';

// Input validation schema
const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'), // in paise
  currency: z.string().default('INR'),
  receipt: z.string().min(1, 'Receipt is required')
});

async function createOrderHandler(request) {
  try {
    const { amount, currency = "INR", receipt } = request.validatedBody;

    // Any authenticated Firebase user can create an order

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Server payment keys not configured" }),
        { status: 500 }
      );
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({ amount, currency, receipt });

    console.log(`User order created by ${request.user.email} for amount ${amount}`);

    return new Response(JSON.stringify(order), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Razorpay user order error:", e);
    return new Response(
      JSON.stringify({ error: e?.error?.description || e.message || "Order creation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request) {
  // Authenticated users can create orders
  return await withAuth(request, (req1) =>
    withRateLimit(20, 10 * 60 * 1000)(req1, (req2) =>
      validateInput(createOrderSchema)(req2, createOrderHandler)
    )
  );
}


