import { NextResponse } from 'next/server';
import { withSuperAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

async function createWeeklyBackupHandler(req) {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7); // Last 7 days
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch ONLY enquiries for the week
    const enquiriesSnapshot = await adminDb.collection('enquiries')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(weekStart))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(weekEnd))
      .get();
    
    const enquiries = enquiriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || ''
    }));

    // Create weekly enquiry backup document
    const backupData = {
      weekStart: admin.firestore.Timestamp.fromDate(weekStart),
      weekEnd: admin.firestore.Timestamp.fromDate(weekEnd),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      backupType: 'weekly',
      
      // Summary
      summary: {
        totalEnquiries: enquiries.length,
        enquiryByStatus: {
          pending: enquiries.filter(e => e.status === 'pending').length,
          contacted: enquiries.filter(e => e.status === 'contacted').length,
          demo_scheduled: enquiries.filter(e => e.status === 'demo_scheduled').length,
          enrolled: enquiries.filter(e => e.status === 'enrolled').length,
          closed: enquiries.filter(e => e.status === 'closed').length
        },
        enquiryByCourse: {}
      },
      
      // Full enquiry data
      enquiries,
      
      // Email list for easy access
      emailList: enquiries.map(e => e.email).filter(Boolean).join(', ')
    };

    // Calculate enquiries by course
    enquiries.forEach(e => {
      if (e.course) {
        backupData.summary.enquiryByCourse[e.course] = 
          (backupData.summary.enquiryByCourse[e.course] || 0) + 1;
      }
    });

    // Save to weekly_enquiry_backups collection
    const backupRef = await adminDb.collection('weekly_enquiry_backups').add(backupData);

    return NextResponse.json({
      success: true,
      backupId: backupRef.id,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      summary: backupData.summary,
      message: 'Weekly enquiry backup created successfully'
    });
  } catch (error) {
    console.error('Error creating weekly backup:', error);
    return NextResponse.json(
      { error: 'Failed to create weekly backup' },
      { status: 500 }
    );
  }
}

async function getWeeklyBackupsHandler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '10';
    const limit = parseInt(limitParam);

    const snapshot = await adminDb.collection('weekly_backups')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const backups = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        weekStart: data.weekStart?.toDate?.()?.toISOString() || '',
        weekEnd: data.weekEnd?.toDate?.()?.toISOString() || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
        summary: data.summary,
        emailLists: data.emailLists
      };
    });

    return NextResponse.json({
      success: true,
      backups,
      total: backups.length
    });
  } catch (error) {
    console.error('Error fetching weekly backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly backups' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return await withSuperAdminAuth(req, createWeeklyBackupHandler);
}

export async function GET(req) {
  return await withSuperAdminAuth(req, getWeeklyBackupsHandler);
}
