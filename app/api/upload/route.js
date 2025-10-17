import { NextResponse } from "next/server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp, getApps } from "firebase/app";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent multiple initializations)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);

export async function POST(request) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      console.error('Missing Firebase Storage Bucket configuration');
      return NextResponse.json({ 
        error: 'Firebase Storage not configured properly' 
      }, { status: 500 });
    }

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
    const filePath = `uploads/${courseId}/${fileName}`;

    console.log('Uploading file:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type
    });

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const bytes = await file.arrayBuffer();
    
    console.log('Starting upload...');
    const uploadResult = await uploadBytes(storageRef, bytes);
    console.log('Upload completed:', uploadResult);

    // Get download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);

    return NextResponse.json({ 
      success: true, 
      downloadURL,
      filePath 
    });

  } catch (error) {
    console.error('Upload error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed';
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Upload unauthorized - check Firebase Storage rules';
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage = 'Storage quota exceeded';
    } else if (error.code === 'storage/unauthenticated') {
      errorMessage = 'User not authenticated';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
