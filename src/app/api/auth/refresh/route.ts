import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokens, getUserByEmail } from '@/lib/services/auth-service';

export async function GET() {
    try {
        // Get refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        // No refresh token, return error
        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        const user = await getUserByEmail(payload.email);

        

        if (!user) {
            return NextResponse.json(
                { error: 'Failed to get user data' },
                { status: 500 }
            );
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Set new refresh token cookie
        cookieStore.set('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        });

        // Return new access token
        return NextResponse.json({
            accessToken: tokens.accessToken,
            user: user,
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'An error occurred during token refresh' },
            { status: 500 }
        );
    }
} 