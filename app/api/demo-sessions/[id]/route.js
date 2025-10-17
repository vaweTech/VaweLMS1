import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

async function updateDemoSessionHandler(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { 
      status, 
      attendance, 
      feedback, 
      notes, 
      scheduledDate,
      trainerId,
      reminderSent
    } = body;

    const demoSessionRef = adminDb.collection('demoSessions').doc(id);
    const demoSessionDoc = await demoSessionRef.get();

    if (!demoSessionDoc.exists) {
      return NextResponse.json(
        { error: 'Demo session not found' },
        { status: 404 }
      );
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status) updateData.status = status;
    if (attendance !== undefined) updateData.attendance = attendance;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
    if (trainerId !== undefined) updateData.trainerId = trainerId;
    if (reminderSent !== undefined) {
      updateData.reminderSent = reminderSent;
      if (reminderSent) {
        updateData.reminderSentAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    // If marking as completed, set completedAt
    if (status === 'completed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await demoSessionRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Demo session updated successfully'
    });
  } catch (error) {
    console.error('Error updating demo session:', error);
    return NextResponse.json(
      { error: 'Failed to update demo session' },
      { status: 500 }
    );
  }
}

async function deleteDemoSessionHandler(req, { params }) {
  try {
    const { id } = params;

    const demoSessionRef = adminDb.collection('demoSessions').doc(id);
    const demoSessionDoc = await demoSessionRef.get();

    if (!demoSessionDoc.exists) {
      return NextResponse.json(
        { error: 'Demo session not found' },
        { status: 404 }
      );
    }

    await demoSessionRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Demo session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting demo session:', error);
    return NextResponse.json(
      { error: 'Failed to delete demo session' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  return await withAdminAuth(req, (req) => updateDemoSessionHandler(req, { params }));
}

export async function DELETE(req, { params }) {
  return await withAdminAuth(req, (req) => deleteDemoSessionHandler(req, { params }));
}
