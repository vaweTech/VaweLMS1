"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase";

function ReceiptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [printedAt, setPrintedAt] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push("/auth/login");
      } else {
        // User is authenticated
        setIsAuthenticated(true);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const data = useMemo(() => {
    const amountPaise = Number(searchParams.get("amount") || 0);
    const addAmount = Math.round(amountPaise) / 100;
    const totalFeePaise = Number(searchParams.get("totalFee") || 0);
    const totalFee = Math.round(totalFeePaise) / 100;
    const paidFeePaise = Number(searchParams.get("paidFee") || 0);
    const paidFee = Math.round(paidFeePaise) / 100;
    const nextPaid = paidFee + addAmount;
    const dueAmount = Math.max(totalFee - paidFee, 0);
    
    // Debug logging
    console.log('Receipt received params:', {
      amount: searchParams.get("amount"),
      totalFee: searchParams.get("totalFee"),
      paidFee: searchParams.get("paidFee"),
      phone: searchParams.get("phone"),
      course: searchParams.get("course"),
      calculated: { addAmount, paidFee, totalFee, nextPaid, dueAmount }
    });
    
    return {
      payment_id: searchParams.get("payment_id") || "",
      order_id: searchParams.get("order_id") || "",
      studentId: searchParams.get("studentId") || "",
      name: searchParams.get("name") || "",
      email: searchParams.get("email") || "",
      phone: searchParams.get("phone") || "",
      course: searchParams.get("course") || "",
      date: searchParams.get("date") || new Date().toISOString(),
      paymentMethod: searchParams.get("paymentMethod") || "",
      paymentType: searchParams.get("type") || "",
      addAmount,
      paidFee,
      totalFee,
      nextPaid,
      dueAmount,
    };
  }, [searchParams]);

  // Avoid hydration mismatches: format dates on client only
  useEffect(() => {
    setPrintedAt(new Date().toLocaleString());
    try {
      setDisplayDate(new Date(data.date).toLocaleString());
    } catch {
      setDisplayDate(data.date);
    }
  }, [data.date]);

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div id="receipt-root" className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border print:shadow-none print:border-0">
        {/* Header with Logo and Institute Name */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/vawe-logo.png" alt="Institute Logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-wide text-gray-900">VAWE</h1>
                <p className="text-xs text-gray-500 -mt-1">Payment Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <div className="hidden print:block text-sm text-gray-500">Printed on {printedAt}</div>
              <div className="text-xs text-gray-500">Receipt Date: {displayDate}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Payer Name</p>
              <p className="font-medium">{data.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium break-all">{data.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone Number</p>
              <p className="font-medium">{data.phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Student ID</p>
              <p className="font-medium">{data.studentId || "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500">Course Name</p>
              <p className="font-medium">{data.course || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium">{displayDate}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-gray-50">
                  <td className="p-3 text-gray-600">Total Course Fee</td>
                  <td className="p-3 font-semibold">₹{data.totalFee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-600">Previously Paid</td>
                  <td className="p-3 font-medium">₹{data.paidFee.toFixed(2)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 text-gray-600">Due Amount</td>
                  <td className="p-3 font-medium">₹{data.dueAmount.toFixed(2)}</td>
                </tr>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="p-3 text-gray-800 font-semibold">Amount Paid Now</td>
                  <td className="p-3 font-bold text-blue-700">₹{data.addAmount.toFixed(2)}</td>
                </tr>
                <tr className="bg-green-50 border-t border-green-200">
                  <td className="p-3 text-gray-800 font-semibold">Total Paid After This Payment</td>
                  <td className="p-3 font-bold text-green-700">₹{data.nextPaid.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-600">Payment Method</td>
                  <td className="p-3 font-medium capitalize">{data.paymentMethod || '-'}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 text-gray-600">Payment Type</td>
                  <td className="p-3 font-medium capitalize">{data.paymentType || 'fee_payment'}</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-600">Razorpay Payment ID</td>
                  <td className="p-3 font-mono text-xs break-all">{data.payment_id}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 text-gray-600">Razorpay Order ID</td>
                  <td className="p-3 font-mono text-xs break-all">{data.order_id}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-500">
            Note: This is a system-generated receipt for your records. For any corrections, please contact support.
          </div>
        </div>

        {/* Footer with Stamp/Signature */}
        <div className="px-6 pb-6">
          <div className="mt-10 flex items-end justify-between">
            <div className="text-xs text-gray-500">Thank you for choosing VAWE.</div>
            <div className="text-center">
              <Image src="/vawe-logo.png" alt="Institute Stamp" width={96} height={96} className="w-24 h-24 object-contain mx-auto opacity-90" />
              <div className="mt-1 text-sm text-gray-700">Authorized Signatory</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex items-center gap-2 print:hidden">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Print / Save PDF
          </button>
        </div>
      </div>
      {/* Print-only styles: hide everything except the receipt */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-root, #receipt-root * { visibility: visible !important; }
          #receipt-root { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}


