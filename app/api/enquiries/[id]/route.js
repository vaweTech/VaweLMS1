import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

async function deleteEnquiryHandler(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Enquiry ID is required' },
        { status: 400 }
      );
    }

    // Check if enquiry exists
    const enquiryRef = adminDb.collection('enquiries').doc(id);
    const enquiryDoc = await enquiryRef.get();

    if (!enquiryDoc.exists) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      );
    }

    // Delete the enquiry
    await enquiryRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to delete enquiry' },
      { status: 500 }
    );
  }
}

async function getEnquiryHandler(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Enquiry ID is required' },
        { status: 400 }
      );
    }

    const enquiryRef = adminDb.collection('enquiries').doc(id);
    const enquiryDoc = await enquiryRef.get();

    if (!enquiryDoc.exists) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      );
    }

    const enquiry = {
      id: enquiryDoc.id,
      ...enquiryDoc.data(),
      createdAt: enquiryDoc.data().createdAt?.toDate?.() || enquiryDoc.data().createdAt
    };

    return NextResponse.json({
      success: true,
      enquiry
    });
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enquiry' },
      { status: 500 }
    );
  }
}

async function updateEnquiryHandler(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Enquiry ID is required' },
        { status: 400 }
      );
    }

    const enquiryRef = adminDb.collection('enquiries').doc(id);
    const enquiryDoc = await enquiryRef.get();

    if (!enquiryDoc.exists) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      );
    }

    // Update enquiry with provided fields
    const updateData = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await enquiryRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Enquiry updated successfully'
    });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to update enquiry' },
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  return await withAdminAuth(req, (req) => getEnquiryHandler(req, context));
}

export async function PUT(req, context) {
  return await withAdminAuth(req, (req) => updateEnquiryHandler(req, context));
}

export async function PATCH(req, context) {
  return await withAdminAuth(req, (req) => updateEnquiryHandler(req, context));
}

export async function DELETE(req, context) {
  return await withAdminAuth(req, (req) => deleteEnquiryHandler(req, context));
}
