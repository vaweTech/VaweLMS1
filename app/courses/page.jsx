"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db, firestoreHelpers } from "../../lib/firebase";
import CheckAuth from "../../lib/CheckAuth";
import Image from "next/image";
import { createCourseUrl } from "../../lib/urlUtils";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";


export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);

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
      return '/assets/Mysql.png';
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

  useEffect(() => {
    async function fetchCourses() {
      try {
        const snap = await firestoreHelpers.getDocs(
          firestoreHelpers.collection(db, "courses")
        );
        const coursesData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (err) {
        console.error("❌ Error fetching courses:", err);
      }
    }
    fetchCourses();
  }, []);

  // Filter courses based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <CheckAuth>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-700 to-blue-800 p-4 sm:p-6 lg:p-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-4 sm:mb-6 lg:mb-8 text-white tracking-wide px-4">
          Choose Your <span className="text-cyan-400">Learning Path</span>
        </h1>
        <p className="text-center text-gray-300 mb-6 sm:mb-8 px-4 max-w-3xl mx-auto">
          Explore our comprehensive programming courses designed to help you build a successful career in software development.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 sm:py-4 bg-white/10 backdrop-blur-lg border border-white/20 
                         rounded-xl sm:rounded-2xl text-white placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
                         transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-3 text-center text-gray-300 text-sm">
              Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-gray-300">No courses available.</p>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg mb-2">No courses found matching &quot;{searchQuery}&quot;</p>
            <button
              onClick={handleClearSearch}
              className="text-cyan-400 hover:text-cyan-300 underline text-sm"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => router.push(`/courses/${createCourseUrl(course.title)}`)}
                className="relative group backdrop-blur-lg bg-white/10 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden 
                           border border-white/20 shadow-lg cursor-pointer 
                           hover:border-cyan-400 hover:shadow-cyan-500/50 transition-all duration-300
                           transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Course Image - Optimized for mobile */}
                <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl aspect-video">
                  <Image
                    src={getCourseImage(course.title)}
                    alt={`VAWE LMS - ${course.title}`}
                    width={600}
                    height={338}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    priority={false}
                    onError={(e) => {
                      e.target.src = "/LmsImg.jpg";
                    }}
                  />
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 lg:p-6 text-white">
                  <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold mb-2 sm:mb-3 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                    {course.description}
                  </p>

                  {/* Button with neon glow */}
                  <button className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 
                                     rounded-lg text-xs sm:text-sm font-medium 
                                     group-hover:bg-cyan-500/40 group-hover:text-white
                                     shadow-md group-hover:shadow-cyan-400/60 transition-all duration-300
                                     flex items-center justify-center gap-2">
                    <span>View Course</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Neon border effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400 rounded-xl sm:rounded-2xl lg:rounded-3xl transition-all duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CheckAuth>
  );
}

//-------------------------------------------------------------------

