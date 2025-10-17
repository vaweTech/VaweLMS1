export const runtime = "nodejs";

import Razorpay from "razorpay";
import { withAdminAuth, withRateLimit, validateInput } from "@/lib/apiAuth";
import { z } from 'zod';

// Input validation schema
const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  receipt: z.string().min(1, 'Receipt is required')
});

async function createOrderHandler(request) {
  try {
    const { amount, currency = "INR", receipt } = request.validatedBody;
    if (!amount) {
      return new Response(JSON.stringify({ error: "Amount required" }), { status: 400 });
    }

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
    
    // Add audit trail
    console.log(`Order created by ${request.user.email} for amount ${amount}`);
    
    return new Response(JSON.stringify(order), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Razorpay order error:", e);
    return new Response(
      JSON.stringify({ error: e?.error?.description || e.message || "Order creation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Simplified admin authentication
export async function POST(request) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Import shared Firebase Admin instance
    const { default: admin } = await import('@/lib/firebaseAdmin');

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified for user:', decodedToken.email);

    // Check admin role in Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    if (!userDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'User not found in system' }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required. Your role: ' + (userData.role || 'none') }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('Admin access granted to:', decodedToken.email);

    // Validate input
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Execute handler
    const mockRequest = {
      ...request,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role
      },
      validatedBody: validated
    };

    return await createOrderHandler(mockRequest);

  } catch (error) {
    console.error('Razorpay order API error:', error);
    
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


