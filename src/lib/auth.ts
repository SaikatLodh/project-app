import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export interface JWTPayload {
  id: string;
  email: string;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: Pick<JWTPayload, 'id'>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string };
  } catch {
    return null;
  }
}

/** Reads the access token from request cookies or Authorization header */
export function getTokenFromRequest(req: Request): string | null {
  // 1. Check Authorization header (for API / socket clients)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Cookie-based (browser clients)
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

/** Server-component helper: reads cookie store directly */
export async function getCurrentUserFromCookies(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export const cookieOptions = {
  isProduction: process.env.NODE_ENV === 'production',
  access() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true as const,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/',
    };
  },
  refresh() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true as const,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    };
  },
};
