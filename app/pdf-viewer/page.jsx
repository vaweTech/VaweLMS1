"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Download, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pdfUrl = searchParams.get("url");
  const title = searchParams.get("title") || "Document";

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No document URL provided</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get file extension to determine document type
  const fileExtension = pdfUrl.split('.').pop()?.toLowerCase();
  const isPDF = fileExtension === 'pdf';
  const isWordDoc = ['doc', 'docx'].includes(fileExtension);
  const isExcel = ['xls', 'xlsx'].includes(fileExtension);
  const isPowerPoint = ['ppt', 'pptx'].includes(fileExtension);

  // Create the view URL using our API route
  const viewUrl = pdfUrl.startsWith('/uploads/') 
    ? `/api/view-pdf?path=${encodeURIComponent(pdfUrl)}`
    : pdfUrl;
  
  // Create Google Docs viewer URL as fallback
  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + pdfUrl)}&embedded=true`;

  return (
    <div className="min-h-screen bg-gray-100">
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
            <h1 className="text-lg font-semibold text-gray-800 truncate">
              {title}
            </h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {fileExtension?.toUpperCase() || 'FILE'}
            </span>
          </div>
                     <div className="flex items-center gap-2">
             <a
               href={viewUrl}
               target="_blank"
               className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
             >
               <Eye size={14} /> View
             </a>
             <a
               href={googleDocsUrl}
               target="_blank"
               className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
             >
               <ExternalLink size={14} /> Google Docs
             </a>
           </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                     {isPDF ? (
             // For PDF files, try iframe first, then object as fallback
             <div className="w-full h-[calc(100vh-120px)] min-h-[600px]">
               <iframe
                 src={`${viewUrl}#toolbar=0&navpanes=0&scrollbar=0&download=0&print=0&view=FitH`}
                 title={title}
                 className="w-full h-full border-0"
                 onError={() => {
                   // If iframe fails, show fallback
                   console.log('Iframe failed, showing fallback');
                 }}
               />
               <div className="p-8 text-center bg-gray-50 border-t">
                 <p className="text-gray-600 mb-4">PDF viewer - Download and print options are disabled for content protection.</p>
                 <div className="flex gap-2 justify-center">
                   <a
                     href={viewUrl}
                     target="_blank"
                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                   >
                     <Eye size={16} /> Open in New Tab
                   </a>
                   <a
                     href={googleDocsUrl}
                     target="_blank"
                     className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                   >
                     <ExternalLink size={16} /> Google Docs
                   </a>
                 </div>
               </div>
             </div>
          ) : (
            // For other document types, show info and options
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4 text-gray-400">
                  {isWordDoc && "📄"}
                  {isExcel && "📊"}
                  {isPowerPoint && "📈"}
                  {!isWordDoc && !isExcel && !isPowerPoint && "📁"}
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {title}
                </h2>
                <p className="text-gray-600 mb-6">
                  This {fileExtension?.toUpperCase()} file cannot be previewed directly in the browser.
                  Please use one of the options below to view or download the document.
                </p>
                                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <a
                     href={viewUrl}
                     target="_blank"
                     className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                   >
                     <Eye size={18} /> Open in New Tab
                   </a>
                   <a
                     href={pdfUrl}
                     download
                     className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                   >
                     <Download size={18} /> Download File
                   </a>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PDFViewer() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <PDFViewerContent />
    </Suspense>
  );
}
