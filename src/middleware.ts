import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_SEGMENTS = ['admin', 'coordinator', 'student', 'tutor'] as const;
type RoleSegment = typeof ROLE_SEGMENTS[number];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.get('firebase_session')?.value === '1';

  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Role-based route guard: /dashboard/<role>/...
  const segments = path.split('/');
  const routeRole = segments[2] as RoleSegment | undefined;

  if (routeRole && ROLE_SEGMENTS.includes(routeRole)) {
    const sessionRole = request.cookies.get('sigta_role')?.value as RoleSegment | undefined;
    if (sessionRole && sessionRole !== routeRole) {
      return NextResponse.redirect(new URL(`/dashboard/${sessionRole}`, request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
