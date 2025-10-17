"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";

function SecurePPTViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pptUrl = searchParams.get("url");
  const title = searchParams.get("title") || "Presentation";
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

  // Convert Google Drive sharing URL to embed URL using secure API
  const convertToEmbedUrl = useCallback(async (url) => {
    if (!url) return null;
    
    try {
      const response = await fetch(`/api/secure-ppt?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          embedUrl: data.embedUrl,
          fileId: data.fileId,
          method: 'api'
        };
      }
    } catch (error) {
      console.error('Error fetching secure PPT URL:', error);
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
      // Try multiple embed formats for better compatibility
      return {
        embedUrl: `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000&rm=minimal&ui=1&chrome=false&toolbar=0&navpanes=0&scrollbar=0`,
        fallbackUrl: `https://docs.google.com/presentation/d/${fileId}/preview?rm=minimal&ui=1`,
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
        const data = await convertToEmbedUrl(pptUrl);
        if (data) {
          setEmbedData(data);
          setLoading(false);
        } else {
          setError("Invalid Google Drive URL format. Please ensure the file is shared publicly.");
          setLoading(false);
        }
      } catch (error) {
        setError("Failed to load presentation URL");
        setLoading(false);
      }
    };

    if (pptUrl) {
      fetchEmbedUrl();
    } else {
      setLoading(false);
    }
  }, [pptUrl, title, convertToEmbedUrl]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (!pptUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No PPT URL provided</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Presentation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
            >
              Go Back
            </button>
            <a
              href={pptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <div className="flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              <h1 className="text-lg font-semibold text-gray-800 truncate">
                {title}
              </h1>
              <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                PPT
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Secure Presentation Viewer
          </div>
        </div>
      </div>

      {/* PPT Viewer */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="w-full aspect-video min-h-[600px]">
            <iframe
              src={showFallback && embedData?.fallbackUrl ? embedData.fallbackUrl : embedData?.embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="fullscreen"
              loading="lazy"
              onLoad={() => console.log('PPT iframe loaded successfully')}
              onError={() => {
                console.log('Primary embed failed, trying fallback');
                if (embedData?.fallbackUrl && !showFallback) {
                  setShowFallback(true);
                } else {
                  setError("Failed to load presentation. The file may not be publicly accessible or the URL format is incorrect.");
                }
              }}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span>Secure presentation viewer</span>
              </div>
              <div className="flex items-center gap-4">
                {embedData?.fallbackUrl && !showFallback && (
                  <button
                    onClick={() => setShowFallback(true)}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    Try alternative view
                  </button>
                )}
                <span>Content protection enabled</span>
              </div>
            </div>
          </div>
          
          {/* Help section for common issues */}
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Having trouble viewing the presentation?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Ensure the Google Drive file is set to &quot;Anyone with the link can view&quot;</li>
                <li>Check that the file is a PowerPoint (.ppt or .pptx) format</li>
                <li>Try refreshing the page or using the alternative view option above</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SecurePPTViewer() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <SecurePPTViewerContent />
    </Suspense>
  );
}
