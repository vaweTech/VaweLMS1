"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptance of Terms</h2>
          <p className="text-gray-600 mb-6">
            By accessing and using VAWE Institutes services, you accept and agree to be bound by 
            the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Use License</h2>
          <p className="text-gray-600 mb-6">
            Permission is granted to temporarily download one copy of the materials on VAWE Institutes&apos; 
            website for personal, non-commercial transitory viewing only.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Course Enrollment</h2>
          <p className="text-gray-600 mb-6">
            Enrollment in our courses is subject to availability and completion of required prerequisites. 
            Course fees are non-refundable except as specified in our refund policy.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Responsibilities</h2>
          <p className="text-gray-600 mb-6">
            Students are responsible for maintaining the confidentiality of their account information 
            and for all activities that occur under their account.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Limitation of Liability</h2>
          <p className="text-gray-600 mb-6">
            In no event shall VAWE Institutes be liable for any damages arising out of the use or 
            inability to use the materials on our website.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
          <p className="text-gray-600">
            For questions regarding these Terms of Service, please contact us at 
            <a href="mailto:legal@vaweinstitutes.com" className="text-blue-600 hover:underline ml-1">
              legal@vaweinstitutes.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
