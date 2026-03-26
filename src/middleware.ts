import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login', '/register', '/'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => path === route);

  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Role based protection
  if (isProtectedRoute && token && userRole) {
    if (path.startsWith('/dashboard/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.nextUrl));
    }
    if (path.startsWith('/dashboard/student') && userRole !== 'student') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.nextUrl));
    }
    if (path.startsWith('/dashboard/tutor') && userRole !== 'tutor') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.nextUrl));
    }
    if (path.startsWith('/dashboard/coordinator') && userRole !== 'coordinator') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.nextUrl));
    }
    // Accessing just /dashboard usually redirects to role specific dashboard?
    if (path === '/dashboard' || path === '/dashboard/') {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
