import crypto from 'crypto';
import { withAuth, withRateLimit, validateInput } from "@/lib/apiAuth";
import { z } from 'zod';
import admin from 'firebase-admin';

// Input validation schema
const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  amount: z.number().positive('Amount must be positive'),
  studentId: z.string().min(1, 'Student ID is required')
});

async function verifyPaymentHandler(request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      amount,
      studentId
    } = request.validatedBody;

    // Input validation is now handled by middleware

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update student's payment record in Firestore (Admin SDK)
    try {
      const db = admin.firestore();
      const docRef = db.collection('students').doc(studentId);
      const snap = await docRef.get();
      if (!snap.exists) {
        return new Response(
          JSON.stringify({ error: 'Student not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = snap.data();
      const currentPaid = Number(data.PayedFee ?? data.payedFee ?? 0);
      const totalFee = Number(data.totalFee ?? 0);
      const addAmount = Math.round(amount) / 100; // convert paise -> rupees
      const nextPaid = currentPaid + addAmount;

      if (nextPaid > totalFee) {
        return new Response(
          JSON.stringify({ error: 'Payment exceeds total fee' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await docRef.update({
        PayedFee: nextPaid,
        lastPaymentDate: new Date().toISOString(),
        lastPaymentAmount: addAmount,
        lastPaymentMethod: 'online'
      });

      try {
        await docRef.collection('payments').add({
          amount: addAmount,
          paymentMethod: 'online',
          paymentDate: new Date().toISOString(),
          status: 'completed',
          type: 'fee_payment',
          processedBy: request.user.uid,
          processedByEmail: request.user.email,
          razorpay_payment_id,
          razorpay_order_id
        });
      } catch (_) {}

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified and fee updated',
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount,
          studentId,
          newPaid: nextPaid,
          totalFee
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error('Fee update after verify failed:', dbError);
      return new Response(
        JSON.stringify({ error: 'Payment verified but fee update failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: "Payment verification failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Apply security middleware: User auth + Rate limiting + Input validation
export async function POST(request) {
  return await withAuth(request, (req1) =>
    withRateLimit(30, 15 * 60 * 1000)(req1, (req2) =>
      validateInput(verifyPaymentSchema)(req2, verifyPaymentHandler)
    )
  );
}
