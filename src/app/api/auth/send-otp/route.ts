import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { OtpModel } from '@/models/Otp';
import { UserModel } from '@/models/User';
import sendEmail from '@/lib/sendEmail';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Remove any old OTP for this email
    await OtpModel.deleteOne({ email: email.toLowerCase() });

    const generateOtp = Math.floor(1000 + Math.random() * 9000);

    const otpDoc = await OtpModel.create({
      email: email.toLowerCase(),
      otp: generateOtp,
      otpExpire: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
    });

    const mailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>OTP Verification</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr><td align="center" style="padding: 20px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
        style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="padding: 30px;">
          <h1 style="color: #4f46e5; text-align:center; margin:0 0 8px;">CollabDocs</h1>
          <h2 style="color: #333; text-align:center; margin:0 0 20px;">Email Verification</h2>
          <p style="color:#666; font-size:16px;">Hello, you are one step away from creating your account. Use the OTP below to verify your email.</p>
          <div style="text-align:center; padding: 20px 0;">
            <div style="background:#f0f0f0; border:1px solid #e0e0e0; border-radius:4px; display:inline-block; padding:15px 30px;">
              <h2 style="color:#4f46e5; margin:0; font-size:32px; letter-spacing:5px;">${generateOtp}</h2>
            </div>
          </div>
          <p style="color:#666; font-size:16px;">This OTP is valid for <strong>2 minutes</strong>. Do not share it with anyone.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({ email: email.toLowerCase(), subject: 'CollabDocs – Email Verification OTP', message: mailHtml });

    otpDoc.isotpsend = true;
    await otpDoc.save({ validateBeforeSave: false });

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
