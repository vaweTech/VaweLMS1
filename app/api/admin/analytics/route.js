import { NextResponse } from 'next/server';
import { withSuperAdminAuth } from '@/lib/apiAuth';
import admin from '@/lib/firebaseAdmin';
const adminDb = admin.firestore();

async function getAnalyticsHandler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';
    
    // Calculate date range
    const now = new Date();
    let periodDays;
    if (period === '7d') periodDays = 7;
    else if (period === '15d') periodDays = 15;
    else if (period === '30d') periodDays = 30;
    else if (period === '60d') periodDays = 60;
    else if (period === '90d') periodDays = 90;
    else if (period === 'all') periodDays = 365 * 10; // 10 years for all time
    else periodDays = 30; // default to 30 days
    
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    // Fetch students data
    const studentsSnapshot = await adminDb.collection('students').get();
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Calculate metrics
    const totalStudents = students.length;
    
    // Filter new joiners based on period and sort by most recent first
    const newJoiners = students
      .filter(student => {
        const createdAt = student.createdAt;
        return createdAt && createdAt >= startDate;
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });

    // Calculate revenue
    const totalRevenue = students.reduce((sum, student) => {
      return sum + (Number(student.PayedFee) || 0);
    }, 0);

    // Calculate pending payments
    const pendingPayments = students.reduce((sum, student) => {
      const totalFee = Number(student.totalFee) || 0;
      const paidFee = Number(student.PayedFee) || 0;
      return sum + Math.max(0, totalFee - paidFee);
    }, 0);

    // Fetch enquiries
    const enquiriesSnapshot = await adminDb.collection('enquiries')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const enquiries = enquiriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Fetch demo sessions
    const demoSessionsSnapshot = await adminDb.collection('demoSessions')
      .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .orderBy('scheduledDate', 'desc')
      .limit(50)
      .get();
    
    const demoSessions = demoSessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledDate: doc.data().scheduledDate?.toDate?.() || doc.data().scheduledDate,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Calculate payment stats (day-wise)
    const paymentStats = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Get payments for this day from students collection
      let dayAmount = 0;
      let dayTransactions = 0;

      students.forEach(student => {
        if (student.lastPaymentDate) {
          const paymentDate = new Date(student.lastPaymentDate);
          if (paymentDate >= dayStart && paymentDate <= dayEnd) {
            dayAmount += Number(student.lastPaymentAmount) || 0;
            dayTransactions += 1;
          }
        }
      });

      paymentStats.push({
        date: date.toISOString().split('T')[0],
        amount: dayAmount,
        transactions: dayTransactions
      });
    }

    // Calculate attendance stats
    const attendanceStats = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Count demo sessions for this day
      const daySessions = demoSessions.filter(session => {
        const sessionDate = session.scheduledDate;
        return sessionDate && sessionDate >= dayStart && sessionDate <= dayEnd;
      });

      const totalSessions = daySessions.length;
      const attendedSessions = daySessions.filter(session => session.attendance === 'present').length;
      const attendance = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      attendanceStats.push({
        date: date.toISOString().split('T')[0],
        totalSessions,
        attendance
      });
    }

    // Calculate course-wise statistics
    const courseStats = {};
    students.forEach(student => {
      const courses = student.coursesTitle || [];
      courses.forEach(course => {
        if (!courseStats[course]) {
          courseStats[course] = { enrolled: 0, revenue: 0 };
        }
        courseStats[course].enrolled += 1;
        courseStats[course].revenue += Number(student.PayedFee) || 0;
      });
    });

    // Calculate status-wise enquiry counts
    const enquiryStats = {
      pending: enquiries.filter(e => e.status === 'pending').length,
      contacted: enquiries.filter(e => e.status === 'contacted').length,
      demo_scheduled: enquiries.filter(e => e.status === 'demo_scheduled').length,
      enrolled: enquiries.filter(e => e.status === 'enrolled').length,
      closed: enquiries.filter(e => e.status === 'closed').length
    };

    // Calculate demo session statistics
    const demoStats = {
      scheduled: demoSessions.filter(d => d.status === 'scheduled').length,
      completed: demoSessions.filter(d => d.status === 'completed').length,
      cancelled: demoSessions.filter(d => d.status === 'cancelled').length,
      attendance: demoSessions.length > 0 ? 
        Math.round((demoSessions.filter(d => d.attendance === 'present').length / demoSessions.length) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      analytics: {
        totalStudents,
        newJoiners: newJoiners.slice(0, 10), // Limit to 10 for dashboard
        totalRevenue,
        pendingPayments,
        enquiries: enquiries.slice(0, 10), // Limit to 10 for dashboard
        demoSessions: demoSessions.slice(0, 10), // Limit to 10 for dashboard
        paymentStats,
        attendanceStats,
        courseStats,
        enquiryStats,
        demoStats,
        period,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return await withSuperAdminAuth(req, getAnalyticsHandler);
}
