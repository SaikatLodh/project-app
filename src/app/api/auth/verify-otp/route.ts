import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { OtpModel } from '@/models/Otp';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    await dbConnect();

    const otpDoc = await OtpModel.findOne({ email: email.toLowerCase() });

    if (!otpDoc) {
      return NextResponse.json({ error: 'OTP not found for this email' }, { status: 400 });
    }

    if (!otpDoc.isotpsend) {
      return NextResponse.json({ error: 'OTP has not been sent yet' }, { status: 400 });
    }

    if (otpDoc.otp !== Number(otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (otpDoc.otpExpire && otpDoc.otpExpire.getTime() < Date.now()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    otpDoc.isotpsend = false;
    otpDoc.otpVerified = true;
    await otpDoc.save({ validateBeforeSave: false });

    return NextResponse.json({ message: 'OTP verified successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
