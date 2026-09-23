import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAuthToken, isAuthPath, isProtectedPath } from '@/Middlewares/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = hasAuthToken(request);

  if (isProtectedPath(pathname) && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPath(pathname) && hasToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/login', '/signup'] };
