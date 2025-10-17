"use client";

export default function SitemapPage() {
  const pages = [
    { title: "Home", url: "/", description: "Main landing page" },
    { title: "About Us", url: "/about", description: "About VAWE Institutes" },
    { title: "Courses", url: "/courses", description: "Programming courses" },
    { title: "Contact", url: "/contact", description: "Contact information" },
    { title: "Blog", url: "/blog", description: "Learning blog and tips" },
    { title: "Placement", url: "/placement", description: "Placement assistance" },
    { title: "Privacy Policy", url: "/privacy", description: "Privacy policy" },
    { title: "Terms of Service", url: "/terms", description: "Terms of service" },
  ];

  const coursePages = [
    { title: "Python Programming", url: "/courses/python" },
    { title: "Java Development", url: "/courses/java" },
    { title: "Web Development", url: "/courses/web-development" },
    { title: "React Training", url: "/courses/react" },
    { title: "Data Science", url: "/courses/data-science" },
    { title: "Full Stack Development", url: "/courses/full-stack" },
  ];

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Sitemap</h1>
        <p className="text-lg text-gray-600 mb-8">
          Find all pages and sections of VAWE Institutes website organized by category.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Pages */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Main Pages</h2>
            <ul className="space-y-2">
              {pages.map((page) => (
                <li key={page.url}>
                  <a 
                    href={page.url}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {page.title}
                  </a>
                  <p className="text-sm text-gray-500">{page.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Course Pages */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Course Pages</h2>
            <ul className="space-y-2">
              {coursePages.map((course) => (
                <li key={course.url}>
                  <a 
                    href={course.url}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {course.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">XML Sitemap</h3>
          <p className="text-gray-600 mb-4">
            For search engines, you can access our XML sitemap at:
          </p>
          <a 
            href="/sitemap.xml"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            https://skillwins.in/sitemap.xml
          </a>
        </div>
      </div>
    </div>
  );
}
