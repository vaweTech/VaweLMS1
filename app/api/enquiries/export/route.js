import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

async function exportEnquiriesHandler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'emails'; // 'emails', 'json', or 'csv'

    const snapshot = await adminDb.collection('enquiries')
      .orderBy('createdAt', 'desc')
      .get();
    
    const enquiries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || ''
    }));

    if (format === 'emails') {
      // Export as comma-separated email list
      const emails = enquiries.map(e => e.email).filter(Boolean);
      const emailList = emails.join(', ');
      
      return NextResponse.json({
        success: true,
        format: 'emails',
        count: emails.length,
        emails: emailList,
        emailArray: emails
      });
    } else if (format === 'csv') {
      // Export as CSV with all fields
      const csvHeader = 'Name,Email,Phone,Gender,Qualification,College,Year of Passing,Work Exp,Company,Course,Timings Preferred,Reference,Status,Remarks,Created At\n';
      const csvRows = enquiries.map(e => 
        `"${e.name || ''}","${e.email || ''}","${e.phone || ''}","${e.gender || ''}","${e.qualification || ''}","${e.college || ''}","${e.yearOfPassing || ''}","${e.workExp || ''}","${e.company || ''}","${e.course || ''}","${e.timingsPreferred || ''}","${e.reference || ''}","${e.status || ''}","${(e.remarks || '').replace(/"/g, '""')}","${e.createdAt || ''}"`
      ).join('\n');
      
      return new Response(csvHeader + csvRows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="enquiries-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Export as JSON
      return NextResponse.json({
        success: true,
        format: 'json',
        count: enquiries.length,
        enquiries
      });
    }
  } catch (error) {
    console.error('Error exporting enquiries:', error);
    return NextResponse.json(
      { error: 'Failed to export enquiries' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return await withAdminAuth(req, exportEnquiriesHandler);
}
