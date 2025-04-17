import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/store/otp-store';
import { createOtp } from '@/lib/services/otp-service';
import { getUserByEmail } from '@/lib/services/user-service';
import { getStudentByUid } from '@/lib/services/student-service';
import { Student, User } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        // Get email from request body
        const body = await request.json();
        const { username } = body;

        // Validate email
        if (!username) {
            return NextResponse.json(
                { success: false, message: 'Valid email is required' },
                { status: 400 }
            );
        }

        let user: User | Student | null = null;
        user = await getUserByEmail(username);

        if (!user) {
            user = await getStudentByUid(`${username.trim()}`);
        }

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Generate a 6-digit OTP
        const otp = await createOtp(user.email, null);

        // For testing purposes, generate a fixed OTP if the external service fails
        const otpValue = otp?.otp || Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 2-minute expiration
        const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes
        otpStore[user.email] = { otp: otpValue, expiresAt };

        // In a real app, you would send the OTP via email or SMS
        console.log(`OTP for ${user.email}: ${otpValue}`);

        // Return success response (without sending the actual OTP in response)
        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            expiresAt
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send OTP' },
            { status: 500 }
        );
    }
} 