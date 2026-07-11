import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';
import { getTokenFromRequest, verifyAccessToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        await dbConnect();
        await UserModel.findByIdAndUpdate(payload.id, { refreshToken: null });
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });

    response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
    response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
