import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokens, getUserByEmail } from '@/lib/services/auth-service';

export async function GET() {
    try {
        // Get refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        console.log("REFRESH endpoint - Cookie check:", {
            refreshToken: refreshToken ? "present" : "missing"
        });

        // No refresh token, return error
        if (!refreshToken) {
            // Clear any malformed cookies
            cookieStore.delete('refreshToken');

            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        console.log("REFRESH endpoint - Token payload:", payload);

        if (!payload) {
            // Clear the invalid token
            cookieStore.delete('refreshToken');
            cookieStore.delete('uid');
            cookieStore.delete('userType');

            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        const user = await getUserByEmail(payload.email);
        if (!user) {
            cookieStore.delete('refreshToken');
            cookieStore.delete('uid');
            cookieStore.delete('userType');

            return NextResponse.json(
                { error: 'Failed to get user data' },
                { status: 500 }
            );
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Build the response
        const response = NextResponse.json({
            accessToken: tokens.accessToken,
            user: user,
        });

        // Set new refresh token cookie in the response
        response.cookies.set({
            name: 'refreshToken',
            value: tokens.refreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        });

        // Also set the uid and userType cookies to ensure consistency
        response.cookies.set({
            name: 'uid',
            value: 'uid' in user ? user.uid : 'admin-user',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        });

        response.cookies.set({
            name: 'userType',
            value: 'uid' in user ? 'student' : 'admin',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);

        // Clear any problematic cookies
        const cookieStore = await cookies();
        cookieStore.delete('refreshToken');
        cookieStore.delete('uid');
        cookieStore.delete('userType');

        return NextResponse.json(
            { error: 'An error occurred during token refresh' },
            { status: 500 }
        );
    }
} 