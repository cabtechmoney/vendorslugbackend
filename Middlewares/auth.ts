import type { NextRequest } from 'next/server';

export function hasAuthToken(request: NextRequest) {
  return Boolean(request.cookies.get('auth_token')?.value);
}

export function isProtectedPath(pathname: string) {
  return pathname.startsWith('/admin');
}

export function isAuthPath(pathname: string) {
  return pathname === '/login' || pathname === '/signup';
}