"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";


const blogPosts = [
  {
    id: 'software-training-institutes-vijayawada',
    title: 'Top 5 Software Training Institutes in Vijayawada - Why VAWE Leads',
    excerpt: 'Discover the best software training institutes in Vijayawada and learn why VAWE Institutes stands out with our comprehensive programming courses and placement assistance.',
    image: '/LmsImg.jpg',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Institute Guide'
  },
  {
    id: 'best-programming-courses-vijayawada',
    title: 'Best Programming Courses in Vijayawada for 2024',
    excerpt: 'Explore the most in-demand programming courses in Vijayawada. From Python to React, discover which technologies will boost your career in 2024.',
    image: '/pythonimge.jpeg',
    date: '2024-01-12',
    readTime: '7 min read',
    category: 'Course Guide'
  },
  {
    id: 'lms-software-for-colleges-india',
    title: 'Best LMS Software for Colleges in India - Complete Guide',
    excerpt: 'Learn about the top Learning Management System solutions for educational institutions in India. Features, pricing, and implementation guide.',
    image: '/crtimage.jpeg',
    date: '2024-01-10',
    readTime: '8 min read',
    category: 'Technology'
  },
  {
    id: 'python-vs-java-career-opportunities',
    title: 'Python vs Java: Which Programming Language Offers Better Career Opportunities?',
    excerpt: 'Compare Python and Java programming languages for career growth. Market demand, salary prospects, and job opportunities in India.',
    image: '/javaimage.jpg',
    date: '2024-01-08',
    readTime: '6 min read',
    category: 'Career Guide'
  },
  {
    id: 'web-development-trends-2024',
    title: 'Web Development Trends to Watch in 2024',
    excerpt: 'Stay ahead with the latest web development trends. From React 18 to Next.js 14, discover technologies that will shape the future.',
    image: '/react.jpg',
    date: '2024-01-05',
    readTime: '9 min read',
    category: 'Technology'
  },
  {
    id: 'placement-preparation-software-jobs',
    title: 'How to Prepare for Software Job Placements in 2024',
    excerpt: 'Complete guide to landing your dream software job. Interview tips, coding preparation, and portfolio building strategies.',
    image: '/workshopimg.jpg',
    date: '2024-01-03',
    readTime: '10 min read',
    category: 'Career Guide'
  }
];

const categories = ['All', 'Institute Guide', 'Course Guide', 'Technology', 'Career Guide'];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Learning <span className="text-yellow-300">Blog</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl">
              Expert insights, programming tips, and career guidance from VAWE Institutes 
              to help you succeed in your learning journey.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link href={`/blog/${post.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={`VAWE LMS - ${post.title}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* SEO Content */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Why Choose VAWE Institutes for Your Learning Journey?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Expertise</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 10+ years of experience in software training</li>
                <li>• Industry-expert instructors</li>
                <li>• Hands-on project-based learning</li>
                <li>• 95% placement success rate</li>
                <li>• Modern curriculum aligned with industry needs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Popular Courses</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Python Programming Course</li>
                <li>• Java Development Training</li>
                <li>• Full Stack Web Development</li>
                <li>• React & Node.js Training</li>
                <li>• Data Science & Machine Learning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
