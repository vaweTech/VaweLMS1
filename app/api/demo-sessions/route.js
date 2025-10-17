import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

async function getDemoSessionsHandler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limitParam = searchParams.get('limit') || '50';
    const limit = parseInt(limitParam);

    let query = adminDb.collection('demoSessions').orderBy('scheduledDate', 'desc');
    
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const demoSessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledDate: doc.data().scheduledDate?.toDate?.() || doc.data().scheduledDate,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    return NextResponse.json({
      success: true,
      demoSessions,
      total: demoSessions.length
    });
  } catch (error) {
    console.error('Error fetching demo sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo sessions' },
      { status: 500 }
    );
  }
}

async function createDemoSessionHandler(req) {
  try {
    const body = await req.json();
    const { 
      studentName, 
      email, 
      phone, 
      course, 
      scheduledDate, 
      trainerId,
      notes = '',
      source = 'manual'
    } = body;

    if (!studentName || !email || !phone || !course || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields: studentName, email, phone, course, scheduledDate' },
        { status: 400 }
      );
    }

    const demoSessionData = {
      studentName,
      email,
      phone,
      course,
      scheduledDate: new Date(scheduledDate),
      trainerId: trainerId || null,
      notes,
      source,
      status: 'scheduled',
      attendance: null,
      feedback: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: null,
      reminderSent: false,
      reminderSentAt: null
    };

    const docRef = await adminDb.collection('demoSessions').add(demoSessionData);

    return NextResponse.json({
      success: true,
      demoSessionId: docRef.id,
      message: 'Demo session scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating demo session:', error);
    return NextResponse.json(
      { error: 'Failed to create demo session' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return await withAdminAuth(req, getDemoSessionsHandler);
}

export async function POST(req) {
  return await withAdminAuth(req, createDemoSessionHandler);
}
