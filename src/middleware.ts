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

    // console.log("in middleware, ", refreshToken, uid, userType);

    // Check if user is authenticated
    const isAuthenticated = !!refreshToken && !!uid;
    // console.log("isAuthenticated", isAuthenticated);

    // For the root path / (login page)
    if (pathname === '/' || pathname === '/api/auth/send-otp' || pathname === '/api/auth/verify-otp') {
        // Always allow access to the root path and auth endpoints, regardless of authentication status
        return NextResponse.next();
    }

    // Check if path is a dynamic student profile path (e.g., /ST12345)
    const studentUidMatch = pathname.match(/^\/ST\d+$/);
    const isStudentPath = !!studentUidMatch;

    // Protected routes - student profiles
    if (isStudentPath) {
        // Extract UID from the path (remove the leading slash)
        const pathUid = pathname.slice(1);

        // console.log(`Checking student path: path=${pathUid}, cookie=${uid}`);

        // If not authenticated or UID doesn't match, redirect to login
        if (!isAuthenticated || pathUid !== uid) {
            console.log("Student auth failed, redirecting to login");
            return NextResponse.redirect(new URL('/', request.url));
        }

        // User is authenticated with matching UID, allow access
        // console.log("Student auth passed");
        return NextResponse.next();
    }

    // For home routes, check if user is admin
    if (pathname.startsWith('/home')) {
        if (!isAuthenticated || userType !== 'admin') {
            console.log("redirecting to login - not admin");
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    }

    // Skip middleware for API routes except auth
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // For all other routes, allow access
    return NextResponse.next();
}

export const config = {
    // Make sure to include all routes that need middleware protection
    matcher: [
        '/',
        '/ST:uid*',
        '/logout',
        '/home',
        '/home/upload',
        '/home/:path*',
        '/admin',
        '/api/:path*'
    ],
}; 