"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";

function SecurePDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pdfUrl = searchParams.get("url");
  const title = searchParams.get("title") || "Document";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push("/auth/login");
      } else {
        // User is authenticated
        setIsAuthenticated(true);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Convert Google Drive sharing URL to embed URL
  const convertToEmbedUrl = useCallback(async (url) => {
    if (!url) return null;
    
    try {
      const response = await fetch(`/api/secure-pdf?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          embedUrl: data.embedUrl,
          fileId: data.fileId,
          method: 'api'
        };
      }
    } catch (error) {
      console.error('Error fetching secure PDF URL:', error);
    }
    
    // Fallback: Extract file ID from Google Drive URL directly
    let fileId = null;
    
    // Handle different Google Drive URL formats
    const patterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,  // Standard /d/FILE_ID/ format
      /[?&]id=([a-zA-Z0-9-_]+)/, // ?id=FILE_ID format
      /\/file\/d\/([a-zA-Z0-9-_]+)/, // /file/d/FILE_ID format
    ];
    
    // Convert edit URLs to view URLs automatically
    let processedUrl = url;
    if (url.includes('/edit')) {
      processedUrl = url.replace('/edit', '/view');
      console.log('Converted edit URL to view URL:', processedUrl);
    }
    
    for (const pattern of patterns) {
      const match = processedUrl.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }
    
    if (fileId) {
      // Use Google Drive preview with enhanced security parameters
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview?usp=sharing&rm=minimal&ui=1&chrome=false&toolbar=0&navpanes=0&scrollbar=0&download=0&print=0`,
        fallbackUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing&rm=minimal&ui=1`,
        fileId,
        method: 'direct'
      };
    }
    
    return null;
  }, [title]);

  const [embedData, setEmbedData] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const fetchEmbedUrl = async () => {
      try {
        const data = await convertToEmbedUrl(pdfUrl);
        if (data) {
          setEmbedData(data);
          setLoading(false);
        } else {
          setError("Invalid Google Drive URL format. Please ensure the file is shared publicly.");
          setLoading(false);
        }
      } catch (error) {
        setError("Failed to load document URL");
        setLoading(false);
      }
    };

    if (pdfUrl) {
      fetchEmbedUrl();
    } else {
      setLoading(false);
    }
  }, [pdfUrl, title, convertToEmbedUrl]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-4 sm:p-6">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">No PDF URL provided</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm sm:text-base mx-auto"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-4 sm:p-6">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Error Loading Document</h2>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
          <div className="flex flex-col gap-2 sm:gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm sm:text-base"
            >
              Go Back
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Open Original Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition text-sm sm:text-base flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> 
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <FileText className="text-red-600 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
              <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate">
                {title}
              </h1>
              <span className="text-xs sm:text-sm text-gray-500 bg-red-100 text-red-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                PDF
              </span>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 hidden md:block">
            Secure Viewer
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto p-2 sm:p-3 lg:p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className="w-full aspect-square min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] relative overflow-auto"
            style={{
              transform: 'scale(1.3)',
              transformOrigin: 'center center'
            }}
          >
            <iframe
              src={showFallback && embedData?.fallbackUrl ? embedData.fallbackUrl : embedData?.embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="fullscreen"
              loading="lazy"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none'
              }}
              onLoad={() => console.log('PDF iframe loaded successfully')}
              onError={() => {
                console.log('Primary embed failed, trying fallback');
                if (embedData?.fallbackUrl && !showFallback) {
                  setShowFallback(true);
                } else {
                  setError("Failed to load document. The file may not be publicly accessible or the URL format is incorrect.");
                }
              }}
            />
          </div>
          
          {/* Help section for common issues */}
          <div className="p-3 sm:p-4 bg-blue-50 border-t border-blue-200">
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-medium mb-2">Having trouble viewing the document?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li className="text-xs sm:text-sm">Document is displayed at 130% zoom for better mobile readability</li>
                <li className="text-xs sm:text-sm">Scroll within the viewer to navigate the document</li>
                <li className="text-xs sm:text-sm">Ensure the Google Drive file is set to &quot;Anyone with the link can view&quot;</li>
                <li className="hidden sm:list-item text-xs sm:text-sm">Check that the file is a PDF format</li>
                <li className="hidden sm:list-item text-xs sm:text-sm">Try refreshing the page if the document doesn&apos;t load</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for responsive zoom */}
      <style jsx>{`
        @media (min-width: 640px) {
          .w-full.aspect-square {
            transform: scale(1.15) !important;
          }
        }
        @media (min-width: 1024px) {
          .w-full.aspect-square {
            transform: scale(1.1) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SecurePDFViewer() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600 mx-auto mb-3 sm:mb-4"></div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <SecurePDFViewerContent />
    </Suspense>
  );
}
