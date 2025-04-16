import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Skip middleware completely for these paths
    if (pathname === '/logout') {
        return NextResponse.next();
    }

    // Get authentication token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const uid = request.cookies.get('uid')?.value;
    const userType = request.cookies.get('userType')?.value;

    console.log("in middleware, ", refreshToken, uid, userType);

    // Check if user is authenticated
    const isAuthenticated = !!refreshToken && !!uid;
    console.log("isAuthenticated", isAuthenticated);
    // For the root path / (login page)
    if (pathname === '/') {
        // Always allow access to the root path, regardless of authentication status
        return NextResponse.next();
    }

    // Check if path is a dynamic student profile path (e.g., /ST12345)
    const isStudentPath = /^\/ST\d+$/.test(pathname);

    // Protected routes - student profiles
    if (isStudentPath) {
        // If not authenticated or UID doesn't match, redirect to login
        if (!isAuthenticated || pathname.slice(1) !== uid) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // User is authenticated with matching UID, allow access
        return NextResponse.next();
    }

    // For home routes, check if user is admin
    if (pathname.startsWith('/home')) {
        if (!isAuthenticated || userType !== 'admin') {
            console.log("redirecting to login");
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    }

    // For all other routes, allow access
    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/ST:uid*', '/logout', '/home', '/home/:path*'],
}; 