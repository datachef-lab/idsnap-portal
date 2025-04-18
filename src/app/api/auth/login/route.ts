import { NextRequest, NextResponse } from 'next/server';
import { generateTokens } from '@/lib/services/auth-service';
import { Student } from '@/lib/db/schema';
import { getStudentByUidAndDob } from '@/lib/services/student-service';

export async function POST(req: NextRequest) {
    try {
        const { uid, dob } = await req.json();

        if (!uid || !dob) {
            return NextResponse.json({ error: 'UID and Date of Birth are required' }, { status: 400 });
        }

        console.log(`Login attempt for UID: ${uid}`);

        // Format dob to ISO string if it's not already
        // Convert from DD-MM-YYYY to YYYY-MM-DD for database comparison
        let formattedDob;

        if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
            // Split the DD-MM-YYYY format
            const [day, month, year] = dob.split('-');
            formattedDob = `${year}-${month}-${day}`;
        } else {
            // Fallback - try to use the provided date directly
            formattedDob = new Date(dob).toISOString().split('T')[0];
        }

        // Login flow using UID and DOB
        try {
            const student: Student | null = await getStudentByUidAndDob(uid, formattedDob);
            console.log(`Student found for UID ${uid} and DOB:`, student ? "Yes" : "No");

            if (!student) {
                return NextResponse.json({ error: 'Invalid UID or Date of Birth' }, { status: 401 });
            }

            console.log("Login successful for student:", student.name);
            // Generate auth tokens using the proper JWT function
            const { accessToken, refreshToken } = generateTokens(student);

            // Normalize the UID for redirect - remove ST prefix if present
            const normalizedUid = student.uid.startsWith('ST') ? student.uid.substring(2) : student.uid;
            // Determine redirect URL based on user type using the normalized UID
            const redirectUrl = `/${normalizedUid}`;

            console.log(`Redirecting to: ${redirectUrl}, Original UID: ${student.uid}, Normalized UID: ${normalizedUid}`);

            // Create response with cookies
            const response = NextResponse.json({
                success: true,
                message: 'Login successfully',
                data: {
                    accessToken,
                    refreshToken,
                    uid: student.uid,
                    userType: "student",
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
            response.cookies.set('uid', student.uid, {
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            response.cookies.set('userType', "student", {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            return response;
        } catch (error) {
            console.error("Error during student lookup:", error);
            return NextResponse.json({ error: 'Student lookup failed' }, { status: 500 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
    }
}