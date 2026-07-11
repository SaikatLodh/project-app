import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';
import sendEmail from '@/lib/sendEmail';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;

    const message = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Password Reset</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f4;">
    <tr><td align="center" style="padding:20px;">
      <table width="600" cellspacing="0" cellpadding="0" border="0"
        style="background:#fff;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="padding:30px;">
          <h1 style="color:#4f46e5;text-align:center;">CollabDocs</h1>
          <h2 style="color:#333;text-align:center;">Password Reset</h2>
          <p style="color:#666;font-size:16px;">Hello ${user.fullName},</p>
          <p style="color:#666;font-size:16px;">We received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align:center;padding:30px 0;">
            <a href="${resetUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:16px;font-weight:bold;">
              Reset Password
            </a>
          </div>
          <p style="color:#666;font-size:14px;">This link expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
          <p style="color:#999;font-size:13px;word-break:break-all;">${resetUrl}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await sendEmail({ email: user.email, subject: 'CollabDocs – Password Reset', message });
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' });
    } catch {
      user.forgotPasswordToken = null;
      user.forgotPasswordExpiry = null;
      await user.save({ validateBeforeSave: false });
      return NextResponse.json({ error: 'Failed to send email. Try again later.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
