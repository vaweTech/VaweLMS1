"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Clock, FileText, Phone, Mail, AlertCircle } from "lucide-react";

export default function CancellationPolicyPage() {
  const policySections = [
    {
      title: "Refund Policy",
      icon: Shield,
      content: [
        "Full refund available within 7 days of enrollment if no classes have been attended",
        "Partial refund (75%) available within 15 days if less than 25% of the course is completed",
        "No refund after 15 days or if more than 25% of the course content has been accessed",
        "Refund processing time: 7-10 business days after approval"
      ]
    },
    {
      title: "Cancellation Terms",
      icon: Clock,
      content: [
        "Course cancellation requests must be submitted in writing",
        "Cancellation is effective from the date of written request receipt",
        "Students can cancel enrollment up to 3 days before course start date for full refund",
        "Late cancellation (within 3 days of start) incurs 25% administrative fee"
      ]
    },
    {
      title: "Transfer Policy",
      icon: FileText,
      content: [
        "Students can transfer to a different batch within the same course",
        "Transfer requests must be made at least 7 days before current batch start",
        "Transfer to different course requires payment of fee difference",
        "Maximum 2 transfers allowed per enrollment"
      ]
    }
  ];

  const refundScenarios = [
    {
      scenario: "Within 7 days, no classes attended",
      refund: "100% Refund",
      processing: "3-5 business days",
      color: "green"
    },
    {
      scenario: "Within 15 days, <25% course completed",
      refund: "75% Refund",
      processing: "5-7 business days",
      color: "blue"
    },
    {
      scenario: "Within 15 days, >25% course completed",
      refund: "50% Refund",
      processing: "7-10 business days",
      color: "yellow"
    },
    {
      scenario: "After 15 days or course completion",
      refund: "No Refund",
      processing: "N/A",
      color: "red"
    }
  ];

  const exceptions = [
    {
      title: "Medical Emergency",
      description: "Full refund or course transfer available with valid medical certificate",
      icon: "🏥"
    },
    {
      title: "Military Service",
      description: "Full refund available for students called for active military service",
      icon: "🎖️"
    },
    {
      title: "Institute Closure",
      description: "Full refund or course completion guarantee if institute closes",
      icon: "🏢"
    },
    {
      title: "Technical Issues",
      description: "Refund or course extension if technical problems prevent learning",
      icon: "💻"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Cancellation & <span className="text-yellow-300">Refund Policy</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We understand that circumstances can change. Our transparent cancellation and refund policy 
              ensures you have flexibility while maintaining the quality of our educational services.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Policy Overview */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Commitment to You
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At VAWE Institutes, we believe in fair and transparent policies. We want you to be 
              completely satisfied with your learning experience, and we&apos;ve designed our policies 
              to protect both your interests and our educational standards.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {policySections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Refund Scenarios */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Refund Scenarios
            </h2>
            <p className="text-lg text-gray-600">
              Clear guidelines for different refund situations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {refundScenarios.map((scenario, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-6 rounded-xl border-l-4 ${
                  scenario.color === 'green' ? 'border-green-500 bg-green-50' :
                  scenario.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                  scenario.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                  'border-red-500 bg-red-50'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{scenario.scenario}</h3>
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${
                    scenario.color === 'green' ? 'text-green-600' :
                    scenario.color === 'blue' ? 'text-blue-600' :
                    scenario.color === 'yellow' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {scenario.refund}
                  </span>
                  <span className="text-sm text-gray-600">{scenario.processing}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Special Exceptions */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Special Circumstances
            </h2>
            <p className="text-lg text-gray-600">
              We understand that life can be unpredictable. Here are special cases where we offer additional flexibility.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {exceptions.map((exception, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{exception.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{exception.title}</h3>
                    <p className="text-gray-600">{exception.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to Request a Refund
            </h2>
            <p className="text-lg text-gray-600">
              Simple steps to process your refund request
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Contact Our Support Team",
                description: "Reach out to us via email, phone, or visit our office to initiate the refund process",
                details: ["Email: support@vaweinstitutes.com", "Phone: +91-XXXXXXXXXX", "Office: Visit our campus"]
              },
              {
                step: "2",
                title: "Submit Required Documents",
                description: "Provide necessary documentation to support your refund request",
                details: ["Enrollment receipt", "Identity proof", "Reason for cancellation", "Bank details for refund"]
              },
              {
                step: "3",
                title: "Review and Approval",
                description: "Our team will review your request and approve if it meets our policy criteria",
                details: ["Review within 2 business days", "Approval notification via email", "Refund amount calculation"]
              },
              {
                step: "4",
                title: "Refund Processing",
                description: "Once approved, your refund will be processed to your original payment method",
                details: ["Processing time: 7-10 business days", "Confirmation email sent", "Refund appears in your account"]
              }
            ].map((process, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start space-x-6"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {process.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{process.title}</h3>
                  <p className="text-gray-600 mb-3">{process.description}</p>
                  <ul className="space-y-1">
                    {process.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <span className="text-blue-500 mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="py-16 bg-yellow-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Important Notes</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3 mt-1">•</span>
                    <span>All refund requests are subject to approval based on our policy terms and conditions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3 mt-1">•</span>
                    <span>Refunds are processed only to the original payment method used during enrollment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3 mt-1">•</span>
                    <span>Course materials and certificates already issued cannot be refunded</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3 mt-1">•</span>
                    <span>Any discounts or offers applied during enrollment will be considered in refund calculations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3 mt-1">•</span>
                    <span>For EMI payments, refunds will be processed after clearing all pending installments</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Need Help with Refunds?
            </h2>
            <p className="text-lg text-gray-600">
              Our support team is here to help you with any questions about our cancellation and refund policy
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Email Support",
                description: "Send us your refund request with all details",
                contact: "support@vaweinstitutes.com",
                icon: Mail,
                action: "mailto:support@vaweinstitutes.com"
              },
              {
                title: "Phone Support",
                description: "Call us for immediate assistance",
                contact: "+91-XXXXXXXXXX",
                icon: Phone,
                action: "tel:+91-XXXXXXXXXX"
              },
              {
                title: "Visit Our Office",
                description: "Meet us in person for detailed discussion",
                contact: "VAWE Institutes, Vijayawada",
                icon: FileText,
                action: "/contact"
              }
            ].map((contact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <contact.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-gray-600 mb-4">{contact.description}</p>
                <p className="text-blue-600 font-semibold mb-4">{contact.contact}</p>
                <Link
                  href={contact.action}
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Now
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Policy Updates */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Policy Updates
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              This policy is effective from January 1, 2024. We reserve the right to update this policy 
              with 30 days notice to enrolled students.
            </p>
            <p className="text-sm text-gray-500">
              Last updated: January 1, 2024 | Version: 1.0
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
