import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/store/otp-store';
import { createOtp } from '@/lib/services/otp-service';

export async function POST(request: NextRequest) {
    try {
        // Get email from request body
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { success: false, message: 'Valid email is required' },
                { status: 400 }
            );
        }

        // Generate a 6-digit OTP
        const otp = await createOtp(email, null);

        // For testing purposes, generate a fixed OTP if the external service fails
        const otpValue = otp?.otp || Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 10-minute expiration
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        otpStore[email] = { otp: otpValue, expiresAt };

        // In a real app, you would send the OTP via email or SMS
        console.log(`OTP for ${email}: ${otpValue}`);

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