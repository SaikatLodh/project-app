import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { password, confirmPassword } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    if (!password || !confirmPassword) {
      return NextResponse.json({ error: 'Password and confirmation are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await dbConnect();

    const user = await UserModel.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Reset token is invalid or has expired' }, { status: 400 });
    }

    user.password = password;
    user.forgotPasswordToken = null;
    user.forgotPasswordExpiry = null;
    await user.save({ validateBeforeSave: false });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
