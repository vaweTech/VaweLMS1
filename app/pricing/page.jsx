"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Star, Users, Award, Clock, BookOpen } from "lucide-react";

export default function PricingPage() {
  const pricingPlans = [
    {
      name: "Basic Plan",
      price: "₹15,000",
      duration: "3 Months",
      description: "Perfect for beginners starting their programming journey",
      features: [
        "Python Programming Fundamentals",
        "Basic Web Development (HTML, CSS, JS)",
        "Database Concepts (MySQL)",
        "2 Live Projects",
        "Basic Placement Assistance",
        "Certificate of Completion",
        "3 Months Access to LMS"
      ],
      popular: false,
      color: "blue"
    },
    {
      name: "Professional Plan",
      price: "₹25,000",
      duration: "6 Months",
      description: "Most popular choice for comprehensive software development training",
      features: [
        "Full Stack Web Development",
        "Python + Django/Flask",
        "JavaScript + React.js",
        "Database Design & Management",
        "5 Live Projects + Portfolio",
        "Advanced Placement Assistance",
        "Industry Certification",
        "6 Months Access to LMS",
        "Mock Interviews",
        "Resume Building Support"
      ],
      popular: true,
      color: "purple"
    },
    {
      name: "Premium Plan",
      price: "₹40,000",
      duration: "12 Months",
      description: "Complete career transformation with advanced technologies",
      features: [
        "Full Stack Development + DevOps",
        "Python + Django + React + Node.js",
        "Cloud Computing (AWS/Azure)",
        "Docker & Kubernetes",
        "10+ Live Projects + Portfolio",
        "Premium Placement Assistance",
        "Industry Expert Mentorship",
        "12 Months Access to LMS",
        "1-on-1 Career Counseling",
        "Job Guarantee Program",
        "Lifetime Support"
      ],
      popular: false,
      color: "green"
    }
  ];

  const additionalServices = [
    {
      title: "Corporate Training",
      description: "Customized training programs for companies and organizations",
      price: "Contact for Quote",
      features: ["Customized Curriculum", "On-site Training", "Flexible Schedules", "Team Building"]
    },
    {
      title: "Weekend Batches",
      description: "Special weekend programs for working professionals",
      price: "+₹5,000",
      features: ["Saturday & Sunday Classes", "Flexible Timing", "Same Curriculum", "Extended Support"]
    },
    {
      title: "Online Training",
      description: "Remote learning with live instructor sessions",
      price: "20% Discount",
      features: ["Live Online Classes", "Recorded Sessions", "Online Support", "Digital Materials"]
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
              Pricing <span className="text-yellow-300">Details</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Choose the perfect plan for your software development journey. 
              All our courses come with industry-recognized certifications and placement assistance.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Learning Path
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Flexible pricing options designed to fit your budget and career goals. 
              All plans include access to our state-of-the-art LMS platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{plan.price}</div>
                    <div className="text-gray-600 mb-4">{plan.duration}</div>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className={`w-full block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Enroll Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Additional Services
            </h2>
            <p className="text-lg text-gray-600">
              Specialized training options to meet your specific needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {additionalServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="text-2xl font-bold text-blue-600 mb-4">{service.price}</div>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Flexible Payment Options
            </h2>
            <p className="text-lg text-gray-600">
              Choose the payment method that works best for you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Full Payment",
                description: "Pay the complete course fee upfront",
                discount: "5% Discount",
                icon: "💰"
              },
              {
                title: "EMI Options",
                description: "Pay in easy monthly installments",
                discount: "0% Interest",
                icon: "📅"
              },
              {
                title: "Scholarship",
                description: "Merit-based financial assistance",
                discount: "Up to 50%",
                icon: "🎓"
              },
              {
                title: "Corporate",
                description: "Special rates for bulk enrollments",
                discount: "Contact Us",
                icon: "🏢"
              }
            ].map((option, index) => (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg text-center"
              >
                <div className="text-4xl mb-4">{option.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 mb-3">{option.description}</p>
                <div className="text-lg font-bold text-green-600">{option.discount}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Our Pricing */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Our Pricing is Worth It
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Award,
                    title: "Industry Recognition",
                    description: "Our certifications are recognized by top IT companies across India"
                  },
                  {
                    icon: Users,
                    title: "95% Placement Rate",
                    description: "Proven track record of placing students in leading tech companies"
                  },
                  {
                    icon: Clock,
                    title: "Lifetime Support",
                    description: "Get career guidance and support even after course completion"
                  },
                  {
                    icon: BookOpen,
                    title: "Updated Curriculum",
                    description: "Learn the latest technologies and industry best practices"
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl text-white"
            >
              <h3 className="text-2xl font-bold mb-6">Ready to Start?</h3>
              <p className="text-blue-100 mb-6">
                Join thousands of successful students who have transformed their careers with VAWE Institutes.
              </p>
              <div className="space-y-4">
                <Link
                  href="/contact"
                  className="block w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors"
                >
                  Get Free Consultation
                </Link>
                <Link
                  href="/courses"
                  className="block w-full border-2 border-white text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-white hover:text-blue-600 transition-colors"
                >
                  View All Courses
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Common questions about our pricing and courses
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                question: "Are there any hidden fees?",
                answer: "No, our pricing is completely transparent. The course fee includes all materials, LMS access, and placement assistance. No hidden charges."
              },
              {
                question: "Can I change my plan after enrollment?",
                answer: "Yes, you can upgrade your plan anytime during the course. The difference in fee will be calculated and you can pay the remaining amount."
              },
              {
                question: "What if I can't afford the full fee?",
                answer: "We offer EMI options, scholarships for meritorious students, and flexible payment plans. Contact our admission team to discuss your options."
              },
              {
                question: "Is there a money-back guarantee?",
                answer: "We offer a 7-day money-back guarantee if you're not satisfied with the course content within the first week of enrollment."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
