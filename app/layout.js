import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: {
    default: 'VAWE LMS - Best Software Training Institute in Vijayawada | Programming Courses & LMS Platform',
    template: '%s | VAWE LMS - Best Software Training Institute in Vijayawada'
  },
  description: 'VAWE LMS is the best software training institute in Vijayawada offering comprehensive programming courses in Python, Java, Web Development, and React. Our advanced LMS platform provides interactive learning experiences with 95% placement assistance.',
  keywords: [
    'software training institutes in vijayawada',
    'best software training institute in vijayawada',
    'software courses in vijayawada',
    'software training and placement institutes in vijayawada',
    'learning management system',
    'LMS software for colleges',
    'training management software vijayawada',
    'e-learning software for institutes',
    'corporate LMS solutions in india',
    'programming courses vijayawada',
    'web development training vijayawada',
    'software coaching in vijayawada'
  ],
  authors: [{ name: 'VAWE Institutes' }],
  creator: 'VAWE Institutes',
  publisher: 'VAWE Institutes',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://skillwins.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'VAWE Institutes - Best Software Training Institute in Vijayawada',
    description: 'Leading software training institute in Vijayawada offering comprehensive programming courses, web development training, and advanced LMS solutions for students and professionals.',
    url: 'https://skillwins.in',
    siteName: 'VAWE Institutes',
    images: [
      {
        url: '/LmsImg.jpg',
        width: 1200,
        height: 630,
        alt: 'VAWE Institutes - Software Training & LMS Platform',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VAWE Institutes - Best Software Training Institute in Vijayawada',
    description: 'Leading software training institute in Vijayawada with advanced LMS platform for programming and web development courses.',
    images: ['/LmsImg.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="canonical" href="https://skillwins.in" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo1.png" />
        <link rel="shortcut icon" href="/logo1.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="geo.region" content="IN-AP" />
        <meta name="geo.placename" content="Vijayawada" />
        <meta name="geo.position" content="16.5062;80.6480" />
        <meta name="ICBM" content="16.5062, 80.6480" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "VAWE LMS",
              "alternateName": "VAWE Software Training Institute",
              "description": "Best software training institute in Vijayawada offering comprehensive programming courses and advanced LMS solutions",
              "url": "https://skillwins.in",
              "logo": "https://skillwins.in/logo1.png",
              "image": "https://skillwins.in/LmsImg.jpg",
              "telephone": "+91-XXXXXXXXXX",
              "email": "info@skillwins.in",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Your Street Address",
                "addressLocality": "Vijayawada",
                "addressRegion": "Andhra Pradesh",
                "postalCode": "520001",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "16.5062",
                "longitude": "80.6480"
              },
              "openingHours": "Mo-Fr 09:00-18:00, Sa 09:00-14:00",
              "sameAs": [
                "https://www.facebook.com/skillwins",
                "https://www.linkedin.com/company/skillwins",
                "https://twitter.com/skillwins",
                "https://www.instagram.com/skillwins",
                "https://www.youtube.com/skillwins"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Software Training Courses",
                "itemListElement": [
                  {
                    "@type": "Course",
                    "name": "Full Stack Web Development",
                    "description": "Comprehensive web development course covering frontend and backend technologies",
                    "provider": {
                      "@type": "EducationalOrganization",
                      "name": "VAWE LMS"
                    }
                  },
                  {
                    "@type": "Course",
                    "name": "Python Programming",
                    "description": "Complete Python programming course for beginners to advanced",
                    "provider": {
                      "@type": "EducationalOrganization",
                      "name": "VAWE LMS"
                    }
                  },
                  {
                    "@type": "Course",
                    "name": "Java Programming",
                    "description": "Java programming course with OOP concepts and frameworks",
                    "provider": {
                      "@type": "EducationalOrganization",
                      "name": "VAWE LMS"
                    }
                  }
                ]
              }
            })
          }}
        />
        
        {/* Additional Structured Data for Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "VAWE LMS",
              "description": "Advanced Learning Management System for software training institutes",
              "url": "https://skillwins.in",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "publisher": {
                "@type": "Organization",
                "name": "VAWE LMS"
              }
            })
          }}
        />
      </head>
      <body className="bg-white min-h-screen flex flex-col">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
