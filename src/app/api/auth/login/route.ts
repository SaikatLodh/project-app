import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';
import { generateAccessToken, generateRefreshToken, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'Please verify your email before logging in' }, { status: 401 });
    }

    if (user.isDeleted) {
      return NextResponse.json({ error: 'Account has been deactivated' }, { status: 401 });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const accessToken = generateAccessToken({ id: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id.toString() });

    // Persist hashed refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, fullName: user.fullName },
      accessToken,
    });

    response.cookies.set('accessToken', accessToken, cookieOptions.access());
    response.cookies.set('refreshToken', refreshToken, cookieOptions.refresh());

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
