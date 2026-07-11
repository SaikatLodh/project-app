import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

// Routes that require authentication
const PROTECTED_ROUTES = ['/', '/document'];

// API routes that require authentication
const PROTECTED_API_ROUTES = ['/api/documents'];

// Auth pages – redirect away if already logged in
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get access token from cookies
  const accessToken = req.cookies.get('accessToken')?.value;
  const isAuthenticated = accessToken ? !!verifyAccessToken(accessToken) : false;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Protect dashboard and document pages
  const isProtectedPage = PROTECTED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  if (isProtectedPage && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Protect API routes
  const isProtectedApi = PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtectedApi && !isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     * - /api/auth/** (auth endpoints are public by design)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
