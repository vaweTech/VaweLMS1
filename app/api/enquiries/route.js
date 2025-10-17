import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

async function getEnquiriesHandler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limitParam = searchParams.get('limit') || '50';
    const limit = parseInt(limitParam);

    let query = adminDb.collection('enquiries').orderBy('createdAt', 'desc');
    
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const enquiries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    return NextResponse.json({
      success: true,
      enquiries,
      total: enquiries.length
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}

async function createEnquiryHandler(req) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      gender,
      qualification,
      college,
      yearOfPassing,
      workExp,
      company,
      course,
      timingsPreferred,
      reference,
      remarks,
      message, 
      source = 'admin_dashboard' 
    } = body;

    if (!name || !email || !phone || !course) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, course' },
        { status: 400 }
      );
    }

    const enquiryData = {
      name,
      email,
      phone,
      gender: gender || '',
      qualification: qualification || '',
      college: college || '',
      yearOfPassing: yearOfPassing || '',
      workExp: workExp || '',
      company: company || '',
      course,
      timingsPreferred: timingsPreferred || '',
      reference: reference || '',
      remarks: remarks || '',
      message: message || '',
      source,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedTo: null,
      notes: '',
      followUpDate: null
    };

    const docRef = await adminDb.collection('enquiries').add(enquiryData);

    return NextResponse.json({
      success: true,
      enquiryId: docRef.id,
      message: 'Enquiry created successfully'
    });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to create enquiry' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return await withAdminAuth(req, getEnquiriesHandler);
}

export async function POST(req) {
  return await withAdminAuth(req, createEnquiryHandler);
}
