import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import nodemailer from 'nodemailer';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function POST(request) {
  return withAdminAuth(request, async (req) => {
    const body = await request.json();
    const { groupId, demoLink, group: groupPayload } = body;

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Use provided group payload when available to avoid Windows Admin SDK issues
    let groupData = groupPayload || null;
    try {
      if (!groupData) {
        const groupDoc = await adminDb.collection('demoGroups').doc(groupId).get();
        if (groupDoc.exists) {
          groupData = groupDoc.data();
        }
      }
    } catch (_e) {
      // Ignore Admin SDK errors on Windows; rely on client payload instead
    }

    if (!groupData) {
      return NextResponse.json(
        { success: false, error: 'Group data unavailable. Please retry.' },
        { status: 500 }
      );
    }

    const students = groupData.enrolledStudents || [];

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No students in this group' },
        { status: 400 }
      );
    }

    // Configure email transporter
    // Supports two modes:
    // 1) Gmail (EMAIL_USER + EMAIL_PASSWORD)
    // 2) Custom SMTP (EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD)
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM
    } = process.env;

    if (!SMTP_USER || !SMTP_PASS) {
      return NextResponse.json(
        { success: false, error: 'Email credentials missing. Set SMTP_USER and SMTP_PASS in .env.local' },
        { status: 500 }
      );
    }

    const useCustomSmtp = !!SMTP_HOST;
    const transporter = nodemailer.createTransport(
      useCustomSmtp
        ? {
            host: SMTP_HOST,
            port: parseInt(SMTP_PORT || '587', 10),
            secure: String(SMTP_SECURE).toLowerCase() === 'true',
            auth: { user: SMTP_USER, pass: SMTP_PASS }
          }
        : {
            service: 'gmail',
            auth: { user: SMTP_USER, pass: SMTP_PASS }
          }
    );

    // Format start date
    const startDate = new Date(groupData.startDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Create email content
    const emailSubject = `Demo Session Invitation - ${groupData.course} | Vawe Institute`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .demo-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      font-weight: bold;
      color: #667eea;
      min-width: 120px;
    }
    .demo-link {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #333;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 10px 10px;
      font-size: 12px;
    }
    .highlight {
      color: #667eea;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 Welcome to Vawe Institute</h1>
    <p>Demo Session Invitation</p>
  </div>
  
  <div class="content">
    <p>Dear Student,</p>
    
    <p>Greetings from <strong>Vawe Institute</strong>! 🌟</p>
    
    <p>We are excited to invite you to join our upcoming <span class="highlight">Demo Session</span>. This is a great opportunity to experience our teaching methodology and explore the course content.</p>
    
    <div class="demo-details">
      <h3 style="color: #667eea; margin-top: 0;">📋 Demo Session Details</h3>
      
      <div class="detail-row">
        <span class="detail-label">Group Name:</span>
        <span>${groupData.name}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Course:</span>
        <span>${groupData.course}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Start Date:</span>
        <span>${startDate}</span>
      </div>
      
      ${groupData.schedule ? `
      <div class="detail-row">
        <span class="detail-label">Schedule:</span>
        <span>${groupData.schedule}</span>
      </div>
      ` : ''}
      
      ${groupData.description ? `
      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Description:</span>
        <span>${groupData.description}</span>
      </div>
      ` : ''}
    </div>
    
    ${demoLink ? `
    <div style="text-align: center;">
      <a href="${demoLink}" class="demo-link" style="color: white;">
        🎥 Join Demo Class
      </a>
      <p style="font-size: 12px; color: #666;">
        Or copy this link: <br/>
        <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-size: 11px;">${demoLink}</code>
      </p>
    </div>
    ` : ''}
    
    <h3 style="color: #667eea;">📝 What to Expect:</h3>
    <ul>
      <li>Live interactive session with our expert trainer</li>
      <li>Introduction to course curriculum and learning outcomes</li>
      <li>Q&A session to address your queries</li>
      <li>Overview of our teaching methodology</li>
      <li>Information about career opportunities</li>
    </ul>
    
    <h3 style="color: #667eea;">📌 Important Notes:</h3>
    <ul>
      <li>Please join the session 5 minutes before the scheduled time</li>
      <li>Ensure you have a stable internet connection</li>
      <li>Keep your microphone muted unless asking questions</li>
      <li>Feel free to use the chat for questions</li>
    </ul>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
    
    <p><strong>Looking forward to seeing you in the demo session! 🚀</strong></p>
    
    <p>Best Regards,<br/>
    <strong>Vawe Institute Team</strong></p>
  </div>
  
  <div class="footer">
    <p><strong>Vawe Institute</strong></p>
    <p>📧 Email: Vawe.info@gmail.com | 📱 Phone:+91-8142112333</p>
    <p>🌐 Website: www.vaweinstitute.com</p>
    <p style="margin-top: 15px; color: #999;">
      This email was sent to you as part of the demo group: ${groupData.name}<br/>
      © ${new Date().getFullYear()} Vawe Institute. All rights reserved.
    </p>
  </div>
</body>
</html>
    `;

    // Plain text version for email clients that don't support HTML
    const emailText = `
Demo Session Invitation - ${groupData.course}

Dear Student,

Greetings from Vawe Institute!

We are excited to invite you to join our upcoming Demo Session for ${groupData.course}.

Demo Session Details:
- Group Name: ${groupData.name}
- Course: ${groupData.course}
- Start Date: ${startDate}
${groupData.schedule ? `- Schedule: ${groupData.schedule}` : ''}
${groupData.description ? `- Description: ${groupData.description}` : ''}

${demoLink ? `Demo Class Link: ${demoLink}` : ''}

What to Expect:
- Live interactive session with our expert trainer
- Introduction to course curriculum and learning outcomes
- Q&A session to address your queries
- Overview of our teaching methodology
- Information about career opportunities

Important Notes:
- Please join the session 5 minutes before the scheduled time
- Ensure you have a stable internet connection
- Keep your microphone muted unless asking questions
- Feel free to use the chat for questions

If you have any questions or need assistance, please don't hesitate to contact us.

Looking forward to seeing you in the demo session!

Best Regards,
Vawe Institute Team

---
Vawe Institute
Email: contact@vaweinstitute.com
Phone: +91-XXXXXXXXXX
Website: www.vaweinstitute.com
`;

    // Extract email addresses
    const emailAddresses = students.map(s => s.email).filter(email => email);

    if (emailAddresses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid email addresses found' },
        { status: 400 }
      );
    }

    // Send email with BCC for privacy
    const mailOptions = {
      from: {
        name: 'Vawe Institute',
        address: SMTP_FROM || SMTP_USER
      },
      to: SMTP_FROM || SMTP_USER, // Send to yourself as primary recipient
      bcc: emailAddresses, // Use BCC for privacy - recipients won't see each other
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Log the email activity (best-effort). On Windows, Admin SDK can fail – ignore errors.
    try {
      await adminDb.collection('emailLogs').add({
        groupId: groupId,
        groupName: groupData.name,
        course: groupData.course,
        recipientCount: emailAddresses.length,
        sentBy: req.user?.uid || 'unknown',
        sentAt: new Date().toISOString(),
        subject: emailSubject,
        demoLink: demoLink || 'Not provided',
        status: 'sent'
      });
    } catch (logErr) {
      console.warn('Email log write skipped:', logErr?.message || logErr);
      // proceed without failing the request
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${emailAddresses.length} students using BCC`,
      recipientCount: emailAddresses.length,
      groupName: groupData.name
    });

  });
}

