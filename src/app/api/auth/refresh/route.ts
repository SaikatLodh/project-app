import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';
import { verifyRefreshToken, generateAccessToken, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
    const refreshToken = match ? decodeURIComponent(match[1]) : null;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    await dbConnect();
    const user = await UserModel.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ error: 'Token mismatch – please log in again' }, { status: 401 });
    }

    const newAccessToken = generateAccessToken({ id: user._id.toString(), email: user.email });

    const response = NextResponse.json({
      message: 'Token refreshed',
      accessToken: newAccessToken,
    });

    response.cookies.set('accessToken', newAccessToken, cookieOptions.access());

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
