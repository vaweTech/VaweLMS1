"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";


export default function AboutPage() {
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
              About <span className="text-yellow-300">VAWE Institutes</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Leading the way in software training and education in Vijayawada since our inception. 
              We&apos;re committed to transforming careers through quality programming education.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                To provide world-class software training and education that empowers students 
                to excel in the rapidly evolving technology landscape. We believe in making 
                quality programming education accessible to everyone in Vijayawada and beyond.
              </p>
              <p className="text-gray-600">
                Our mission is to bridge the gap between academic learning and industry 
                requirements, ensuring our students are job-ready and equipped with the 
                latest skills demanded by top IT companies.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
              <p className="text-lg text-gray-600 mb-6">
                To be recognized as the premier software training institute in Vijayawada, 
                setting the standard for excellence in programming education and student success.
              </p>
              <p className="text-gray-600">
                We envision a future where every student who walks through our doors 
                becomes a successful software professional, contributing to India&apos;s 
                growing IT ecosystem.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose VAWE Institutes
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our commitment to excellence and student success sets us apart as a leading 
              educational institution in the region.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Expert Faculty",
                description: "Industry-experienced instructors with real-world expertise in modern programming languages and frameworks.",
                icon: "👨‍🏫"
              },
              {
                title: "Modern Curriculum",
                description: "Up-to-date courses covering Python, Java, React, and other in-demand technologies.",
                icon: "📚"
              },
              {
                title: "Advanced LMS Platform",
                description: "State-of-the-art learning management system with interactive content and progress tracking.",
                icon: "💻"
              },
              {
                title: "95% Placement Rate",
                description: "Proven track record of placing students in top IT companies with competitive salaries.",
                icon: "🎯"
              },
              {
                title: "Hands-on Learning",
                description: "Project-based approach with real-world applications and industry-relevant assignments.",
                icon: "🛠️"
              },
              {
                title: "Flexible Schedules",
                description: "Multiple batch timings to accommodate working professionals and students.",
                icon: "⏰"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="py-16 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Impact in Numbers</h2>
            <p className="text-blue-100">
              Transforming careers and shaping the future of software development in Vijayawada
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: "1000+", label: "Students Trained" },
              { number: "95%", label: "Placement Success Rate" },
              { number: "50+", label: "Partner Companies" },
              { number: "10+", label: "Years of Excellence" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Modern Infrastructure</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our state-of-the-art facilities provide the perfect environment for learning 
                and innovation. From high-speed internet to modern computer labs, we ensure 
                students have access to the best resources.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  High-speed internet connectivity
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Modern computer labs with latest hardware
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Air-conditioned classrooms
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Library with technical books and resources
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Project presentation facilities
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Image
                src="/LmsImg.jpg"
                alt="VAWE LMS Infrastructure"
                width={600}
                height={400}
                className="rounded-xl shadow-lg w-full"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Software Development Journey?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join VAWE Institutes and transform your career with our comprehensive 
              programming courses and expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/courses" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Explore Courses
              </Link>
              <Link 
                href="/contact" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
