import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    console.log(`Middleware processing path: ${pathname}`);

    // Skip middleware completely for these paths
    if (pathname === '/logout') {
        return NextResponse.next();
    }

    // Get authentication token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const uid = request.cookies.get('uid')?.value;
    const userType = request.cookies.get('userType')?.value;

    console.log(`Auth cookies - uid: ${uid}, userType: ${userType}, hasToken: ${!!refreshToken}`);

    // Check if user is authenticated
    const isAuthenticated = !!refreshToken && !!uid;
    console.log(`isAuthenticated: ${isAuthenticated}`);

    // For the root path / (login page) and auth API endpoints
    if (pathname === '/' ||
        pathname.startsWith('/api/auth/send-otp') ||
        pathname.startsWith('/api/auth/verify-otp') ||
        pathname.startsWith('/api/auth/login')) {
        // Always allow access to the root path and auth endpoints, regardless of authentication status
        console.log('Access allowed to auth route');
        return NextResponse.next();
    }

    // Check if path is a dynamic student profile path (any non-empty string that isn't a reserved path)
    // Exclude known paths like /home, /admin, /api, /logout
    const isReservedPath = pathname.startsWith('/home') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api') ||
        pathname === '/logout';

    // Student paths are numeric UIDs
    const isNumericUid = /^\d+$/.test(pathname.slice(1));
    const isStudentPath = pathname.length > 1 && !isReservedPath && isNumericUid;
    console.log(`Is student path: ${isStudentPath}, path: ${pathname}, isNumeric: ${isNumericUid}`);

    // Protected routes - student profiles
    if (isStudentPath) {
        // Extract UID from the path (remove the leading slash)
        const pathUid = pathname.slice(1);

        // Normalize UIDs for comparison
        // The uid cookie might have "ST" prefix, we need to normalize both sides
        const normalizedCookieUid = uid?.startsWith('ST') ? uid.substring(2) : uid;
        const normalizedPathUid = pathUid.startsWith('ST') ? pathUid.substring(2) : pathUid;

        console.log(`Student path check - normalized path UID: ${normalizedPathUid}, normalized cookie UID: ${normalizedCookieUid}`);

        // If not authenticated or UID doesn't match, redirect to login
        if (!isAuthenticated || normalizedPathUid !== normalizedCookieUid) {
            console.log(`Student auth failed, redirecting to login. Auth: ${isAuthenticated}, UIDs match: ${normalizedPathUid === normalizedCookieUid}`);
            return NextResponse.redirect(new URL('/', request.url));
        }

        // User is authenticated with matching UID, allow access
        console.log("Student auth passed, allowing access");
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

    // For API routes other than auth, ensure user is authenticated
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        if (!isAuthenticated) {
            console.log("Unauthenticated API access, returning 401");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.next();
    }

    // For all other routes, allow access
    return NextResponse.next();
}

export const config = {
    // Make sure to include all routes that need middleware protection
    matcher: [
        '/',
        '/:uid+', // Match any non-empty string for uid
        '/logout',
        '/home',
        '/home/upload',
        '/home/:path*',
        '/admin',
        '/api/:path*'
    ],
}; 