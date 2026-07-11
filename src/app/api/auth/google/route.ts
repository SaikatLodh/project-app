import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import dbConnect from '@/lib/db';
import { UserModel } from '@/models/User';
import { generateAccessToken, generateRefreshToken, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/** POST /api/auth/google  – body: { code, mode: 'signup' | 'signin' } */
export async function POST(req: Request) {
  try {
    const { code, mode = 'signin' } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Google authorization code is required' }, { status: 400 });
    }

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch user info
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`
    );
    const data = (await res.json()) as { id: string; email: string; name: string; picture: string };

    if (!data.email) {
      return NextResponse.json({ error: 'Could not retrieve Google account info' }, { status: 400 });
    }

    await dbConnect();

    let user = await UserModel.findOne({ email: data.email.toLowerCase() });

    if (mode === 'signup') {
      if (user) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      user = await UserModel.create({
        fullName: data.name,
        email: data.email.toLowerCase(),
        password: data.id, // treated as random credential; bcrypt will hash it
        googleAvatar: data.picture,
        isVerified: true,
      });
    } else {
      // signin
      if (!user) {
        return NextResponse.json({ error: 'No account found. Please sign up first.' }, { status: 404 });
      }
    }

    const accessToken = generateAccessToken({ id: user!._id.toString(), email: user!.email });
    const refreshToken = generateRefreshToken({ id: user!._id.toString() });

    user!.refreshToken = refreshToken;
    await user!.save({ validateBeforeSave: false });

    const response = NextResponse.json({
      message: 'Google auth successful',
      user: { id: user!._id, email: user!.email, fullName: user!.fullName },
      accessToken,
    });

    response.cookies.set('accessToken', accessToken, cookieOptions.access());
    response.cookies.set('refreshToken', refreshToken, cookieOptions.refresh());

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
