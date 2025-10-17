import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // Security: Only allow access to files in the uploads directory
    if (!filePath.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }

    // Remove the leading slash and construct the full path
    const fullPath = join(process.cwd(), 'public', filePath.substring(1));

    // Check if file exists
    if (!existsSync(fullPath)) {
      console.error('File not found at path:', fullPath);
      return NextResponse.json({ error: 'File not found', path: fullPath }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);

    // Determine content type based on file extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (fileExtension === 'pdf') {
      contentType = 'application/pdf';
    } else if (fileExtension === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileExtension === 'doc') {
      contentType = 'application/msword';
    } else if (fileExtension === 'xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileExtension === 'xls') {
      contentType = 'application/vnd.ms-excel';
    } else if (fileExtension === 'pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (fileExtension === 'ppt') {
      contentType = 'application/vnd.ms-powerpoint';
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`, // This tells the browser to display the file instead of downloading
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff', // Prevent MIME type sniffing
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
