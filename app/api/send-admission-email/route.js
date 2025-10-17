import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

    if (!host || !user || !pass) {
      return NextResponse.json({ error: "SMTP is not configured on server" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    // Verify connection configuration to surface auth/connection issues early
    await transporter.verify();

    const siteUrl = "https://www.skillwins.in/";
    const logoUrl = `${siteUrl}logo1.png`;
    const subject = "Welcome to VAWE LMS – Your Account Is Ready";
    const plainText = `Hello ${name || "Student"},\n\nWelcome to VAWE LMS! Your account has been created successfully.\n\nLogin Email: ${email}\nDefault Password: Vawe@2025\nWebsite: ${siteUrl}\n\nAfter login, to change your password:\n1) Click the left-side menu (☰).\n2) Open Settings.\n3) Follow the Change Password instructions.\n\nTip: Please change your password on first login.\n\nThank you,\nVAWE LMS`;

    const html = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f9fc;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
              <tr>
                <td style="background:#0ea5e9;padding:16px 24px;" align="left">
                  <img src="${logoUrl}" alt="VAWE LMS" height="36" style="display:block;height:36px;"/>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                  <h2 style="margin:0 0 8px 0;font-size:22px;line-height:28px;">Welcome to VAWE LMS</h2>
                  <p style="margin:0;color:#334155;">Hello <strong>${name || "Student"}</strong>, your account has been created successfully.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;color:#334155;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 6px 0;"><strong>Login Email:</strong> ${email}</p>
                    <p style="margin:0 0 6px 0;"><strong>Default Password:</strong> Vawe@2025</p>
                    <p style="margin:0;">
                      <a href="${siteUrl}" style="display:inline-block;margin-top:8px;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;">Go to VAWE LMS</a>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                  <h3 style="margin:0 0 8px 0;font-size:16px;">How to change your password</h3>
                  <ol style="margin:0;padding-left:18px;color:#334155;">
                    <li style="margin:0 0 6px 0;">Log in at <a href="${siteUrl}" style="color:#0ea5e9;text-decoration:none;">${siteUrl}</a></li>
                    <li style="margin:0 0 6px 0;">Click the left-side menu button (☰)</li>
                    <li style="margin:0 0 6px 0;">Open <strong>Settings</strong></li>
                    <li style="margin:0;">Follow the <strong>Change Password</strong> instructions</li>
                  </ol>
                  <p style="margin:10px 0 0 0;color:#64748b;">Tip: Change your password on first login to keep your account secure.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px 24px 24px;font-family:Arial,Helvetica,sans-serif;color:#64748b;font-size:12px;">
                  <p style="margin:0;">If you didn’t request this account, you can ignore this email.</p>
                  <p style="margin:6px 0 0 0;">© ${new Date().getFullYear()} VAWE LMS</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const info = await transporter.sendMail({
      from: `VAWE LMS <${user}>`,
      to: email,
      subject,
      text: plainText,
      html,
    });
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("send-admission-email error:", err);
    return NextResponse.json({ error: String(err && err.message ? err.message : err) }, { status: 500 });
  }
}


