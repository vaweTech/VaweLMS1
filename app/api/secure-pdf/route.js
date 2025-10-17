import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const title = searchParams.get('title') || 'Document';

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate that it's a Google Drive URL
    if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
      return NextResponse.json(
        { error: 'Only Google Drive URLs are allowed' },
        { status: 400 }
      );
    }

    // Convert edit URLs to view URLs automatically
    let processedUrl = url;
    if (url.includes('/edit')) {
      processedUrl = url.replace('/edit', '/view');
      console.log('API: Converted edit URL to view URL:', processedUrl);
    }

    // Extract file ID from Google Drive URL - handle multiple formats
    let fileId = null;
    const patterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,  // Standard /d/FILE_ID/ format
      /[?&]id=([a-zA-Z0-9-_]+)/, // ?id=FILE_ID format
      /\/file\/d\/([a-zA-Z0-9-_]+)/, // /file/d/FILE_ID format
    ];
    
    for (const pattern of patterns) {
      const match = processedUrl.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Invalid Google Drive URL format. Please use a proper Google Drive sharing link.' },
        { status: 400 }
      );
    }
    
    // Create secure embed URL using Google Drive preview with enhanced security
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?usp=sharing&rm=minimal&ui=1&chrome=false&toolbar=0&navpanes=0&scrollbar=0&download=0&print=0`;
    const fallbackUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing&rm=minimal&ui=1`;

    // Return the secure embed URL and metadata
    return NextResponse.json({
      embedUrl,
      fallbackUrl,
      fileId,
      title,
      secure: true,
      downloadDisabled: true,
      message: 'Secure PDF viewer URL generated successfully'
    });

  } catch (error) {
    console.error('Error in secure-pdf API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, title } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required in request body' },
        { status: 400 }
      );
    }

    // Validate Google Drive URL
    if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
      return NextResponse.json(
        { error: 'Only Google Drive URLs are allowed' },
        { status: 400 }
      );
    }

    // Convert edit URLs to view URLs automatically
    let processedUrl = url;
    if (url.includes('/edit')) {
      processedUrl = url.replace('/edit', '/view');
      console.log('API POST: Converted edit URL to view URL:', processedUrl);
    }

    // Extract file ID - handle multiple formats
    let fileId = null;
    const patterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,  // Standard /d/FILE_ID/ format
      /[?&]id=([a-zA-Z0-9-_]+)/, // ?id=FILE_ID format
      /\/file\/d\/([a-zA-Z0-9-_]+)/, // /file/d/FILE_ID format
    ];
    
    for (const pattern of patterns) {
      const match = processedUrl.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Invalid Google Drive URL format. Please use a proper Google Drive sharing link.' },
        { status: 400 }
      );
    }
    
    // Create secure embed URL using Google Drive preview with enhanced security
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?usp=sharing&rm=minimal&ui=1&chrome=false&toolbar=0&navpanes=0&scrollbar=0&download=0&print=0`;
    const fallbackUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing&rm=minimal&ui=1`;

    return NextResponse.json({
      success: true,
      embedUrl,
      fallbackUrl,
      fileId,
      title: title || 'Document',
      secure: true,
      downloadDisabled: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in secure-pdf POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
