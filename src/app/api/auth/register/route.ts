import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';
import { OtpModel } from '@/models/Otp';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, fullName, password } = await req.json();

    if (!email || !fullName || !password) {
      return NextResponse.json({ error: 'Email, full name and password are required' }, { status: 400 });
    }

    if (fullName.length < 3 || fullName.length > 50) {
      return NextResponse.json({ error: 'Full name must be between 3 and 50 characters' }, { status: 400 });
    }

    if (password.length < 6 || password.length > 30) {
      return NextResponse.json({ error: 'Password must be between 6 and 30 characters' }, { status: 400 });
    }

    await dbConnect();

    const otpDoc = await OtpModel.findOne({ email: email.toLowerCase() });

    if (!otpDoc) {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 400 });
    }

    if (!otpDoc.otpVerified) {
      return NextResponse.json({ error: 'OTP not verified' }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    await UserModel.create({
      email: email.toLowerCase(),
      fullName: fullName.trim(),
      password,
      isVerified: true,
    });

    // Clean up OTP record
    await OtpModel.deleteOne({ email: email.toLowerCase() });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
