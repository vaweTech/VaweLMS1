


"use client";

import CheckAuth from "../../lib/CheckAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function PracticePage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to create URL-friendly slug from course title
  const createSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Function to get the appropriate image based on course title
  const getCourseImage = (courseTitle) => {
    const title = courseTitle.toLowerCase();
    
    // Search Engine Marketing
    if (title.includes('search engine marketing') || title.includes('sem')) {
      return '/assets/SEM.jpg';
    }
    // AI Device Installation Operator
    else if (title.includes('ai device') || title.includes('installation operator') || title.includes('ai devices') || title.includes('al devices')) {
      return '/assets/AI Device Installation Operator.jpg';
    }
    // Aptitude
    else if (title.includes('aptitude')) {
      return '/assets/Aptitude.jpg';
    }
    // C Programming
    else if (title.includes('c programming') || title.includes('c++') || title.includes('c plus plus')) {
      return '/assets/c++.png';
    }
    // C Programming (alternative image)
    else if (title.includes('c language') && !title.includes('c++')) {
      return '/assets/cimage.jpg';
    }
    // Broadband Technician
    else if (title.includes('broadband') || title.includes('technician')) {
      return '/assets/Broadband Technician.jpg';
    }
    // CSS
    else if (title.includes('css') || title.includes('cascading style sheets')) {
      return '/assets/CSS.png';
    }
    // Coding/Programming
    else if (title.includes('coding') || title.includes('programming') || title.includes('code')) {
      return '/assets/codingimage.jpg';
    }
    // Generative AI
    else if (title.includes('generative ai') || title.includes('gen ai') || title.includes('artificial intelligence')) {
      return '/assets/Generative AI.jpg';
    }
    // Data Structures & Algorithms
    else if (title.includes('data structures') || title.includes('algorithms') || title.includes('dsa')) {
      return '/assets/DSA.jpg';
    }
    // JavaScript (must come before Java to avoid conflict)
    else if (title.includes('javascript') || title.includes('js') || title.includes('java script')) {
      return '/assets/javaScript.png';
    }
    // General Duty Assistant
    else if (title.includes('general duty') || title.includes('assistant')) {
      return '/assets/General Duty Assistant.jpg';
    }
    // HTML
    else if (title.includes('html')) {
      return '/assets/HTML (1).png';
    }
    // MongoDB
    else if (title.includes('mongodb') || title.includes('mongo')) {
      return '/assets/Mango DB.png';
    }
    // MySQL
    else if (title.includes('mysql') || title.includes('MY SQL')) {
      return '/assets/mysql.png';
    }
    // Microsoft
    else if (title.includes('microsoft') || title.includes('office')) {
      return '/assets/Microsoft.webp';
    }
    // Power BI
    else if (title.includes('power bi') || title.includes('powerbi') || title.includes('business intelligence')) {
      return '/assets/Power Bi.png';
    }
    // React
    else if (title.includes('react')) {
      return '/assets/react.jpg';
    }
    // Python Full Stack
    else if (title.includes('python') || title.includes('full stack')) {
      return '/assets/pythonimge.jpeg';
    }
    // R Programming
    else if (title.includes('r programming') || title.includes('r language')) {
      return '/assets/R-Programming.jpg';
    }
    // Django Framework
    else if (title.includes('django') || title.includes('django framework')) {
      return '/assets/Django FrameWork.jpg';
    }
    // Telegram Customer Care Executive
    else if (title.includes('telegram') || title.includes('customer care') || title.includes('executive') || title.includes('telecomm')) {
      return '/assets/Telegram customer care Executive.jpg';
    }
    // Advanced Java
    else if (title.includes('advanced java') || title.includes('java advanced')) {
      return '/assets/Advanced Java.jpg';
    }
    // SQL
    else if (title.includes('sql')) {
      return '/assets/mysql.png';
    }
    // Machine Learning, Deep Learning
    else if (title.includes('machine learning') || title.includes('deep learning') || title.includes('ml') || title.includes('dl')) {
      return '/assets/ML & DL.jpg';
    }
    // Java (general) - must come after JavaScript
    else if (title.includes('java')) {
      return '/assets/java.jpg';
    }
    // Certificate
    else if (title.includes('crt') || title.includes('certificate')) {
      return '/crtimage.jpeg';
    }
    // Workshop
    else if (title.includes('workshop')) {
      return '/workshopimg.jpg';
    }
    // Default fallback image
    else {
      return '/LmsImg.jpg';
    }
  };

  // Load courses from Firestore
  useEffect(() => {
    async function fetchCourses() {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const coursesList = coursesSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          slug: createSlug(doc.data().title),
          description: doc.data().description || "Test your knowledge with MCQs.",
          image: getCourseImage(doc.data().title)
        }));
        setCourses(coursesList);
        console.log("Loaded courses for practice:", coursesList);
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <CheckAuth>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 px-3 py-6 sm:p-6 lg:p-10 text-white">
        {/* Header Section with Animation */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center space-y-3 sm:space-y-4 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-2 sm:mb-4 leading-tight">
              Practice <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Session</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              Master your skills through interactive practice sessions and coding challenges
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col justify-center items-center py-12 sm:py-20 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-b-4 border-cyan-400"></div>
              <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-cyan-400 opacity-20"></div>
            </div>
            <p className="text-gray-400 animate-pulse text-sm sm:text-base">Loading practice sessions...</p>
          </div>
        )}

        {!loading && (
          <div className="mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Dynamic Course MCQ Cards */}
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/30 hover:border-cyan-400/50 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      width={400}
                      height={200}
                      className="h-32 sm:h-40 md:h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-cyan-500/90 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm">
                      MCQ
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2 leading-tight">
                      {course.title}
                    </h2>
                    <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                    <button
                      onClick={() => router.push(`/practice/${course.slug}`)}
                      className="w-full mt-3 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg shadow-lg hover:shadow-cyan-500/50 text-white font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group"
                    >
                      Start Practice
                      <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Coding Questions Card */}
              <div
                className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/30 hover:border-cyan-400/50 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${courses.length * 50}ms` }}
              >
                <div className="relative overflow-hidden">
                  <Image
                    src="/codingimage.jpg"
                    alt="Coding Questions"
                    width={400}
                    height={200}
                    className="h-32 sm:h-40 md:h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm animate-pulse">
                    CODING
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 group-hover:text-cyan-400 transition-colors duration-300 leading-tight">
                    Coding Questions
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed">
                    Solve coding challenges and improve your problem-solving skills.
                  </p>
                  <button
                    onClick={() => router.push("/practice/coding")}
                    className="w-full mt-3 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg shadow-lg hover:shadow-cyan-500/50 text-white font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group"
                  >
                    Start Coding
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-12 sm:py-20 max-w-md mx-auto px-4">
            <div className="bg-white/5 border border-gray-700/50 rounded-xl sm:rounded-2xl p-8 sm:p-12 backdrop-blur-sm">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📚</div>
              <p className="text-gray-400 text-base sm:text-lg mb-2">No practice topics available yet</p>
              <p className="text-gray-500 text-sm">Check back soon for new practice sessions!</p>
            </div>
          </div>
        )}
      </div>
    </CheckAuth>
  );
}
