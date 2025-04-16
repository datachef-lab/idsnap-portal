import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/store/otp-store';
import { verifyOtp } from '@/lib/services/otp-service';
import { getUserByEmail } from '@/lib/services/auth-service';
import { Student, User } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        // Get email and OTP from request body
        const body = await request.json();
        const { email, otp } = body;

        let user: User | Student | null = null;

        // Validate input
        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Check if OTP exists and is valid using the service
        const otpData = await verifyOtp(email, otp);
        if (otpData === -1) {
            return NextResponse.json(
                { success: false, message: 'OTP expired' },
                { status: 400 }
            );
        }

        if (otpData === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // If OTP is valid from the service
        if (otpData === 1) {
            user = await getUserByEmail(email);
            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'User not found' },
                    { status: 404 }
                );
            }

            // Determine if user is student type (has uid property)
            const isStudent = 'uid' in user;
            // Determine redirect URL based on user type
            const redirectUrl = isStudent ? `/${(user as Student).uid}` : '/home';

            // Generate auth tokens
            const accessToken = generateToken();
            const refreshToken = generateToken();

            // Determine user type based on email
            const userType = isStudent ? "student" : "admin";

            // Create response with cookies
            const response = NextResponse.json({
                success: true,
                message: 'OTP verified successfully',
                data: {
                    accessToken,
                    refreshToken,
                    uid: isStudent ? (user as Student).uid : null,
                    userType,
                    redirectUrl
                }
            });

            // Set cookies using response
            response.cookies.set('refreshToken', refreshToken, {
                path: '/',
                httpOnly: true,
                sameSite: false,
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            // For admin users, set a uid that won't match a URL path
            response.cookies.set('uid', isStudent ? (user as Student).uid : 'admin-user', {
                path: '/',
                httpOnly: true,
                sameSite: false,
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            response.cookies.set('userType', userType, {
                path: '/',
                httpOnly: true,
                sameSite: false,
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            return response;
        }

        // Fallback to in-memory OTP store if service validation didn't succeed
        const storedData = otpStore[email];
        if (!storedData) {
            return NextResponse.json(
                { success: false, message: 'No OTP found for this email' },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        if (Date.now() > storedData.expiresAt) {
            // Clean up expired OTP
            delete otpStore[email];
            return NextResponse.json(
                { success: false, message: 'OTP has expired' },
                { status: 400 }
            );
        }

        // Check if OTP matches
        if (storedData.otp !== otp) {
            // For debugging
            console.log(`OTP mismatch: Expected ${storedData.otp}, Received ${otp}`);

            return NextResponse.json(
                { success: false, message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // OTP is valid, clean it up
        delete otpStore[email];

        // Generate UID based on email (for demo purposes)
        // In a real app, you would get this from your database
        const uid = `ST${Math.floor(10000 + Math.random() * 90000)}`;

        // Generate auth tokens
        const accessToken = generateToken();
        const refreshToken = generateToken();

        // Determine user type based on email
        const userType = "uid" in user! ? "student" : "admin";

        // Determine redirect URL based on user type
        const redirectUrl = userType === "student" ? `/${uid}` : "/home";

        // Create response with cookies
        const response = NextResponse.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                accessToken,
                refreshToken,
                uid,
                userType,
                redirectUrl
            }
        });

        // Set cookies using response
        response.cookies.set('refreshToken', refreshToken, {
            path: '/',
            httpOnly: true,
            sameSite: false,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        // For admin users, set a uid that won't match a URL path
        response.cookies.set('uid', userType === "student" ? uid : 'admin-user', {
            path: '/',
            httpOnly: true,
            sameSite: false,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        response.cookies.set('userType', userType, {
            path: '/',
            httpOnly: true,
            sameSite: false,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        return response;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}

// Function to generate a random token (simplified for demo)
function generateToken() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
} 