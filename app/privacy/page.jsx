"use client";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information We Collect</h2>
          <p className="text-gray-600 mb-6">
            VAWE Institutes collects information you provide directly to us, such as when you create an account, 
            enroll in courses, or contact us for support.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How We Use Your Information</h2>
          <p className="text-gray-600 mb-6">
            We use the information we collect to provide, maintain, and improve our services, 
            process transactions, and communicate with you.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information Sharing</h2>
          <p className="text-gray-600 mb-6">
            We do not sell, trade, or otherwise transfer your personal information to third parties 
            without your consent, except as described in this policy.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Security</h2>
          <p className="text-gray-600 mb-6">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy, please contact us at 
            <a href="mailto:privacy@vaweinstitutes.com" className="text-blue-600 hover:underline ml-1">
              privacy@vaweinstitutes.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
