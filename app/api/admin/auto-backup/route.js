import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

// This endpoint can be called by a cron job (e.g., Vercel Cron, external service)
// to automatically create weekly backups
export async function GET(req) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7); // Last 7 days
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Check if backup already exists for this week
    const existingBackup = await adminDb.collection('weekly_enquiry_backups')
      .where('weekStart', '>=', admin.firestore.Timestamp.fromDate(weekStart))
      .limit(1)
      .get();

    if (!existingBackup.empty) {
      return NextResponse.json({
        success: true,
        message: 'Backup already exists for this week',
        skipped: true
      });
    }

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
      backupType: 'automatic',
      
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
      { error: 'Failed to create weekly backup: ' + error.message },
      { status: 500 }
    );
  }
}
