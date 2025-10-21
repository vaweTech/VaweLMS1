"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/blog" className="text-yellow-200 hover:text-white transition-colors mb-4 inline-block">
              ← Back to Blog
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Best Software Training Institutes in Amaravati 2024
            </h1>
            <p className="text-xl text-yellow-100 mb-6">
              Complete Guide to Top Software Institutes in AP Capital City
            </p>
            <div className="flex items-center space-x-4 text-sm text-yellow-200">
              <span>January 15, 2024</span>
              <span>•</span>
              <span>7 min read</span>
              <span>•</span>
              <span>Institute Guide</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg max-w-none"
        >
          <div className="mb-8">
            <Image
              src="/react.jpg"
              alt="Best Software Training Institutes in Amaravati AP Capital - VAWE"
              width={800}
              height={400}
              className="rounded-xl shadow-lg w-full"
            />
          </div>

          <p className="text-xl text-gray-600 mb-8">
            Amaravati, the capital city of Andhra Pradesh, is being developed as a world-class smart city with 
            focus on technology and innovation. As the city grows, the demand for skilled software professionals 
            is increasing rapidly. Finding the <strong>best software training institute in Amaravati</strong> is crucial 
            for students and professionals looking to build careers in this emerging IT hub.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Amaravati: The Smart Capital City</h2>
          
          <p className="text-gray-600 mb-6">
            Amaravati is being designed as India&apos;s most modern capital city with emphasis on smart infrastructure, 
            sustainable development, and technology integration. The government&apos;s vision includes making Amaravati 
            a major IT and startup hub, creating tremendous opportunities for software professionals. The capital 
            region encompasses Vijayawada, Guntur, and surrounding areas, forming a mega urban development zone.
          </p>

          <div className="bg-yellow-50 p-6 rounded-xl mb-8 border-l-4 border-yellow-500">
            <h3 className="text-2xl font-bold text-yellow-900 mb-4">🏆 VAWE Institutes - Leading Choice in Amaravati</h3>
            <p className="text-gray-700 mb-4">
              <strong>Why VAWE is the best software training institute in Amaravati capital region:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Strategic presence in the capital region</li>
              <li>Modern curriculum aligned with smart city requirements</li>
              <li>95% placement success rate across India</li>
              <li>Expert trainers from top tech companies</li>
              <li>Focus on emerging technologies and innovation</li>
              <li>Cloud-based learning management system</li>
              <li>Government-recognized certifications</li>
              <li>Strong industry partnerships for placements</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">IT Opportunities in Amaravati Capital Region</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">🏢 Startup Ecosystem</h4>
              <p className="text-gray-700">
                Amaravati is fostering a vibrant startup ecosystem with incubation centers, funding support, and 
                government initiatives to attract tech entrepreneurs.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">🌐 Smart City Projects</h4>
              <p className="text-gray-700">
                The smart city development requires professionals skilled in IoT, cloud computing, AI, and 
                data analytics - creating diverse job opportunities.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">💼 Government IT Projects</h4>
              <p className="text-gray-700">
                As the capital, Amaravati will host numerous e-governance and digital transformation projects 
                requiring skilled IT professionals.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">🎯 Future Growth</h4>
              <p className="text-gray-700">
                Early career establishment in Amaravati positions you advantageously as the city develops into 
                a major IT destination.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Top Software Courses for Amaravati Students</h2>

          <div className="space-y-6 mb-8">
            <div className="bg-white border-2 border-blue-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 font-bold mr-4">1</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cloud Computing & DevOps</h3>
                  <p className="text-gray-600 mb-3">
                    Essential for smart city infrastructure. Learn AWS, Azure, Docker, Kubernetes, and CI/CD pipelines. 
                    High demand in government and enterprise projects.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">AWS</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Azure</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Kubernetes</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">DevOps</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-green-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="bg-green-600 text-white rounded-lg px-4 py-2 font-bold mr-4">2</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Full Stack Web Development</h3>
                  <p className="text-gray-600 mb-3">
                    Build modern web applications with MERN/MEAN stack. Perfect for startup ecosystem and 
                    e-governance projects in Amaravati.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">React</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Node.js</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">MongoDB</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Express</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-purple-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="bg-purple-600 text-white rounded-lg px-4 py-2 font-bold mr-4">3</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Data Science & Analytics</h3>
                  <p className="text-gray-600 mb-3">
                    Crucial for smart city data analysis and decision-making. Learn Python, ML, AI, and big data 
                    technologies for high-paying roles.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Python</span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">ML/AI</span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Big Data</span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Analytics</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="bg-orange-600 text-white rounded-lg px-4 py-2 font-bold mr-4">4</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile App Development</h3>
                  <p className="text-gray-600 mb-3">
                    Develop apps for smart city services. Learn React Native, Flutter for cross-platform 
                    development with high market demand.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">React Native</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">Flutter</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">Android</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">iOS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why VAWE Stands Out in Amaravati</h2>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-8 rounded-xl mb-8">
            <h3 className="text-2xl font-bold mb-6">Complete Career Transformation Program</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-xl text-yellow-100 mb-3">Technical Excellence</h4>
                <ul className="space-y-2 text-orange-100">
                  <li>✓ Latest technology stack training</li>
                  <li>✓ Cloud-based LMS platform</li>
                  <li>✓ Real-world project portfolio</li>
                  <li>✓ Industry-standard best practices</li>
                  <li>✓ Coding standards & documentation</li>
                  <li>✓ Version control (Git/GitHub)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-xl text-yellow-100 mb-3">Career Growth</h4>
                <ul className="space-y-2 text-orange-100">
                  <li>✓ Placement assistance & job fairs</li>
                  <li>✓ Resume & LinkedIn optimization</li>
                  <li>✓ Mock interviews & feedback</li>
                  <li>✓ Soft skills development</li>
                  <li>✓ Industry networking events</li>
                  <li>✓ Lifetime career support</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Career Opportunities & Salary Expectations</h2>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💰 IT Salary Trends in Amaravati Region</h3>
            <p className="text-gray-600 mb-4">
              As Amaravati develops, IT salaries are competitive with other metro cities:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-400">
                <p className="font-semibold text-gray-900 mb-1">Fresher Developer</p>
                <p className="text-2xl font-bold text-green-600">₹3.5-7 LPA</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-400">
                <p className="font-semibold text-gray-900 mb-1">Cloud Engineer</p>
                <p className="text-2xl font-bold text-green-600">₹8-15 LPA</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-400">
                <p className="font-semibold text-gray-900 mb-1">Full Stack Developer</p>
                <p className="text-2xl font-bold text-green-600">₹6-14 LPA</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-orange-400">
                <p className="font-semibold text-gray-900 mb-1">Data Scientist</p>
                <p className="text-2xl font-bold text-green-600">₹10-20 LPA</p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Success Stories from Amaravati Region</h2>

          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="text-4xl mr-4">👨‍💻</div>
                <div>
                  <div className="text-yellow-500 text-xl mb-2">⭐⭐⭐⭐⭐</div>
                  <p className="text-gray-700 italic mb-3">
                    &quot;Being from the Amaravati region, I wanted quality training without relocating. VAWE&apos;s 
                    Full Stack course exceeded my expectations. Got placed at a Hyderabad startup with ₹8 LPA package!&quot;
                  </p>
                  <p className="font-semibold text-gray-900">Kiran Kumar</p>
                  <p className="text-sm text-gray-600">Full Stack Developer at Tech Startup, Hyderabad</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
              <div className="flex items-start">
                <div className="text-4xl mr-4">👩‍💻</div>
                <div>
                  <div className="text-yellow-500 text-xl mb-2">⭐⭐⭐⭐⭐</div>
                  <p className="text-gray-700 italic mb-3">
                    &quot;VAWE&apos;s Data Science course in Amaravati region was excellent. The practical projects and 
                    placement support helped me transition from civil engineering to data analytics successfully.&quot;
                  </p>
                  <p className="font-semibold text-gray-900">Divya Sree</p>
                  <p className="text-sm text-gray-600">Data Analyst at Government Project, Amaravati</p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Advantages of Training in Amaravati Capital Region</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🌟 Early Mover Advantage</h4>
              <p className="text-gray-600">
                Establish your career in the capital city before it becomes a major IT hub. Early professionals 
                will have growth opportunities as the city develops.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🏛️ Government Projects</h4>
              <p className="text-gray-600">
                Access to numerous e-governance and smart city projects that will be implemented in the capital, 
                offering stable career opportunities.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-500">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">💰 Cost Effective</h4>
              <p className="text-gray-600">
                Lower cost of living compared to established IT cities while getting competitive salaries and 
                quality training from institutes like VAWE.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🚀 Modern Infrastructure</h4>
              <p className="text-gray-600">
                World-class infrastructure being developed from scratch provides excellent quality of life and 
                work environment for tech professionals.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl mb-8">
            <h3 className="text-2xl font-bold mb-4">🎓 Be Part of Amaravati&apos;s IT Revolution!</h3>
            <p className="text-blue-100 mb-6">
              Join VAWE Institutes and be among the first professionals to establish successful IT careers in 
              Andhra Pradesh&apos;s capital city. Learn cutting-edge technologies and contribute to building the 
              smart city of the future!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/courses" 
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Explore Courses
              </Link>
              <Link 
                href="/contact" 
                className="inline-block bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Schedule Counseling
              </Link>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                Q: Which is the best software institute in Amaravati?
              </h4>
              <p className="text-gray-600">
                VAWE Institutes is the leading software training institute serving the Amaravati capital region 
                with comprehensive courses, expert faculty, and excellent placement support.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                Q: What job opportunities are available in Amaravati for IT professionals?
              </h4>
              <p className="text-gray-600">
                Amaravati offers opportunities in smart city projects, e-governance, startups, and with companies 
                setting up offices in the capital region. The IT sector is expected to grow significantly.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                Q: Which courses are most relevant for Amaravati&apos;s smart city development?
              </h4>
              <p className="text-gray-600">
                Cloud Computing, IoT, Data Science, Full Stack Development, and Mobile App Development are highly 
                relevant for smart city projects and have excellent career prospects.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                Q: Does VAWE provide placement assistance in Amaravati region?
              </h4>
              <p className="text-gray-600">
                Yes, VAWE provides comprehensive placement assistance including opportunities in Amaravati, 
                Vijayawada, Guntur, and across India with 95% placement success rate.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Conclusion</h2>
          
          <p className="text-gray-600 mb-6">
            Amaravati represents a unique opportunity for IT professionals to be part of building a world-class 
            smart capital city from the ground up. Choosing the right software training institute is crucial, and 
            <strong> VAWE Institutes provides the perfect foundation</strong> for success in this emerging IT destination.
          </p>

          <p className="text-gray-600">
            With focus on modern technologies, expert training, and strong industry connections, VAWE prepares 
            you not just for current job opportunities but for the future of technology in Amaravati and beyond. 
            Take the first step toward your IT career in AP&apos;s capital city today!
          </p>
        </motion.article>

        {/* Related Posts */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/blog/best-software-institutes-andhra-pradesh" className="group">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  Best Institutes in AP
                </h4>
                <p className="text-gray-600">
                  Complete guide to top institutes across Andhra Pradesh
                </p>
              </div>
            </Link>
            <Link href="/blog/software-training-institutes-vijayawada" className="group">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  Best Institutes in Vijayawada
                </h4>
                <p className="text-gray-600">
                  Top software training in nearby Vijayawada
                </p>
              </div>
            </Link>
            <Link href="/blog/top-software-institutes-guntur" className="group">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  Best Institutes in Guntur
                </h4>
                <p className="text-gray-600">
                  Quality software institutes in Guntur district
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

