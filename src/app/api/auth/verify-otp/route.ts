import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/store/otp-store';
import { verifyOtp } from '@/lib/services/otp-service';
import { generateTokens } from '@/lib/services/auth-service';
import { Student, studentTable, User } from '@/lib/db/schema';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getUserByEmail } from '@/lib/services/user-service';
import { getStudentByUid } from '@/lib/services/student-service';

export async function POST(request: NextRequest) {
    try {
        // Get email and OTP from request body
        const body = await request.json();
        const { username, otp } = body;

        let user: User | Student | null = null;

        user = await getUserByEmail(username);

        if (!user) {
            user = await getStudentByUid(`${username.trim()}`);
        }



        // Validate input
        if (!username || !otp) {
            return NextResponse.json(
                { success: false, message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Check if OTP exists and is valid using the service
        const otpData = await verifyOtp(user.email, otp);
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
            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'User not found' },
                    { status: 404 }
                );
            }

            // Determine if user is student type (has uid property)
            const isStudent = 'uid' in user;
            await db.update(studentTable)
                .set({ checkedAt: new Date() })
                .where(eq(studentTable.email, user.email as string));

            // Get UID for student redirect (use the full UID with prefix)
            const studentUid = isStudent ? (user as Student).uid : null;

            // Extract numeric UID without the ST prefix for the URL
            const numericUid = isStudent && studentUid?.startsWith('ST')
                ? studentUid.substring(2)
                : studentUid;

            // Determine redirect URL based on user type - use numeric UID without ST prefix
            const redirectUrl = isStudent ? `/${numericUid}` : '/home';

            console.log(`Auth successful, redirecting to: ${redirectUrl}, Full UID: ${studentUid}, Numeric UID: ${numericUid}`);

            // Generate auth tokens using the proper JWT function
            const { accessToken, refreshToken } = generateTokens(user);

            // Determine user type based on email
            const userType = isStudent ? "student" : "admin";

            // Create response with cookies
            const response = NextResponse.json({
                success: true,
                message: 'OTP verified successfully',
                data: {
                    accessToken,
                    refreshToken,
                    uid: studentUid,
                    userType,
                    redirectUrl
                }
            });

            // Set cookies using response
            response.cookies.set('refreshToken', refreshToken, {
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            // For admin users, set a uid that won't match a URL path
            response.cookies.set('uid', isStudent ? (user as Student).uid : 'admin-user', {
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            response.cookies.set('userType', userType, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            return response;
        }

        // Fallback to in-memory OTP store if service validation didn't succeed
        const storedData = otpStore[user.email];
        if (!storedData) {
            return NextResponse.json(
                { success: false, message: 'No OTP found for this email' },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        if (Date.now() > storedData.expiresAt) {
            // Clean up expired OTP
            delete otpStore[user.email];
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
        delete otpStore[user.email];

        // Create a dummy user for this demo scenario
        // Normally, you'd retrieve or create a real user in your database
        const dummyUser: User | Student = {
            id: 999,
            name: user.email.split('@')[0],
            email: user.email,
            uid: `ST${Math.floor(10000 + Math.random() * 90000)}`,
            phone: '',
            semester: '1',
            course: 'Computer Science',
            shift: 'DAY',
            section: 'A',
            abcId: 'ABC123456'
        };

        // Get UID for student redirect (use the full UID with prefix)
        const studentUid = 'uid' in dummyUser ? dummyUser.uid : null;

        // Extract numeric UID without the ST prefix for the URL
        const numericUid = 'uid' in dummyUser && studentUid?.startsWith('ST')
            ? studentUid.substring(2)
            : studentUid;

        // Determine redirect URL based on user type - use numeric UID without ST prefix
        const redirectUrl = 'uid' in dummyUser ? `/${numericUid}` : '/home';

        console.log(`Fallback auth successful, redirecting to: ${redirectUrl}, Full UID: ${studentUid}, Numeric UID: ${numericUid}`);

        // Generate auth tokens using the proper JWT function
        const { accessToken, refreshToken } = generateTokens(dummyUser);

        // Determine user type based on presence of uid property
        const userType = "student";
        const uid = dummyUser.uid;

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
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        // Set user's uid in the cookie
        response.cookies.set('uid', uid, {
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'lax',

            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        response.cookies.set('userType', userType, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
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