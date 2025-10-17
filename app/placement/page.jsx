"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";


export default function PlacementPage() {
  const companies = [
    { name: "TCS", logo: "/tcs-logo.png", alt: "TCS Logo" },
    { name: "Infosys", logo: "/infosys-logo.png", alt: "Infosys Logo" },
    { name: "Wipro", logo: "/wipro-logo.png", alt: "Wipro Logo" },
    { name: "Accenture", logo: "/accenture-logo.png", alt: "Accenture Logo" },
    { name: "Cognizant", logo: "/cognizant-logo.png", alt: "Cognizant Logo" },
    { name: "HCL", logo: "/hcl-logo.png", alt: "HCL Logo" }
  ];

  const successStories = [
    {
      name: "Rajesh Kumar",
      course: "Python Programming",
      company: "TCS",
      salary: "₹6.5 LPA",
      image: "/profile.jpg",
      quote: "VAWE Institutes transformed my career. The hands-on training and placement support helped me land my dream job at TCS."
    },
    {
      name: "Priya Sharma",
      course: "Full Stack Web Development",
      company: "Infosys",
      salary: "₹7.2 LPA",
      image: "/profile.jpg",
      quote: "The comprehensive curriculum and expert faculty at VAWE Institutes prepared me perfectly for the industry challenges."
    },
    {
      name: "Amit Patel",
      course: "Java Programming",
      company: "Wipro",
      salary: "₹5.8 LPA",
      image: "/profile.jpg",
      quote: "From zero programming knowledge to a successful software developer - VAWE Institutes made it possible."
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
              Placement <span className="text-yellow-300">Success</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Join our institute and benefit from our excellent placement record. 
              Our 95% placement success rate speaks for itself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">95%</div>
                <div className="text-blue-100">Placement Rate</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">₹6.5L</div>
                <div className="text-blue-100">Average Salary</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-100">Partner Companies</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Why Our Placement Success */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why VAWE Institutes Has Excellent Placement Record
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our comprehensive approach to training and placement ensures every student 
              is job-ready and industry-prepared.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Industry-Ready Curriculum",
                description: "Our courses are designed in collaboration with industry experts to ensure students learn exactly what companies need.",
                icon: "📚"
              },
              {
                title: "Mock Interviews",
                description: "Regular mock interviews and technical assessments prepare students for real job interviews.",
                icon: "🎯"
              },
              {
                title: "Resume Building",
                description: "Expert guidance in creating professional resumes and LinkedIn profiles that stand out.",
                icon: "📄"
              },
              {
                title: "Soft Skills Training",
                description: "Communication, teamwork, and problem-solving skills essential for workplace success.",
                icon: "🤝"
              },
              {
                title: "Company Partnerships",
                description: "Strong relationships with top IT companies ensure regular placement opportunities.",
                icon: "🏢"
              },
              {
                title: "Career Guidance",
                description: "One-on-one career counseling to help students choose the right path and opportunities.",
                icon: "💼"
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

      {/* Partner Companies */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Students Work at Top Companies
            </h2>
            <p className="text-lg text-gray-600">
              Join the ranks of successful graduates working at leading IT companies
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {companies.map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-600 font-semibold text-sm">{company.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{company.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success Stories from Our Students
            </h2>
            <p className="text-lg text-gray-600">
              Real stories from students who transformed their careers with VAWE Institutes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="text-center mb-4">
                  <Image
                    src={story.image}
                    alt={`VAWE LMS - ${story.name}`}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-semibold text-gray-900">{story.name}</h3>
                  <p className="text-blue-600 font-medium">{story.course}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-semibold text-gray-900">{story.company}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Salary:</span>
                    <span className="font-semibold text-green-600">{story.salary}</span>
                  </div>
                </div>
                
                <blockquote className="text-gray-600 italic">
                  &ldquo;{story.quote}&rdquo;
                </blockquote>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Placement Process */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Placement Process
            </h2>
            <p className="text-lg text-gray-600">
              A systematic approach to ensure every student gets the best placement opportunities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Skill Assessment",
                description: "Comprehensive evaluation of technical and soft skills to identify strengths and areas for improvement."
              },
              {
                step: "02",
                title: "Training & Development",
                description: "Intensive training in technical skills, interview preparation, and professional development."
              },
              {
                step: "03",
                title: "Company Matching",
                description: "Matching students with suitable companies based on skills, interests, and career goals."
              },
              {
                step: "04",
                title: "Placement Support",
                description: "Ongoing support throughout the interview process and post-placement assistance."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
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
            <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Dream Job?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join VAWE Institutes and let us help you build a successful career 
              in software development with our proven placement assistance.
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
                Get Career Guidance
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
