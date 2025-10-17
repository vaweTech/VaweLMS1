import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const courseId = formData.get('courseId');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: 'No course ID provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      return NextResponse.json({ 
        error: 'Only PDF and document files are allowed' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size must be less than 10MB' 
      }, { status: 400 });
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create uploads directory structure
    const uploadsDir = join(process.cwd(), 'public', 'uploads', courseId);
    await mkdir(uploadsDir, { recursive: true });
    
    // Save file locally
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return the public URL
    const downloadURL = `/uploads/${courseId}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      downloadURL,
      filePath: downloadURL
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
