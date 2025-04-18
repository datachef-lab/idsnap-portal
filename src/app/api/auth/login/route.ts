import { NextRequest, NextResponse } from 'next/server';
import { generateTokens } from '@/lib/services/auth-service';
import { Student } from '@/lib/db/schema';
import { getStudentByUidAndDob } from '@/lib/services/student-service';
import { getStudentByEmail } from '@/lib/services/student-service';

export async function POST(req: NextRequest) {
    try {
        const { uid, dob, isEmail } = await req.json();
        console.log("DOB Login request:", { uid, dob, isEmail });

        if (!uid || !dob) {
            return NextResponse.json({ error: 'UID/Email and Date of Birth are required' }, { status: 400 });
        }

        // For DOB login, we only accept UIDs, not emails
        if (isEmail) {
            console.log(`Email login attempt rejected for DOB method: ${uid}`);
            return NextResponse.json({ error: 'DOB login must use a 10-digit UID, not email' }, { status: 400 });
        }

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

        console.log("Formatted DOB:", formattedDob);

        // Login flow using UID/Email and DOB
        try {
            let student: Student | null = null;

            if (isEmail) {
                // If input is an email, lookup by email
                console.log(`Looking up student by email: ${uid}`);
                student = await getStudentByEmail(uid);

                // If student found, check DOB
                if (student && student.dob !== formattedDob) {
                    console.log(`DOB mismatch for email ${uid}. Expected: ${student.dob}, Got: ${formattedDob}`);
                    student = null;
                }
            } else {
                // If input is a UID, normalize it
                const normalizedUid = normalizeUid(uid);
                console.log(`Looking up student by UID: ${normalizedUid}`);

                // Look up by UID and DOB
                student = await getStudentByUidAndDob(normalizedUid, formattedDob);
            }

            console.log(`Student found:`, student ? "Yes" : "No");

            if (!student) {
                return NextResponse.json({ error: 'Invalid UID/Email or Date of Birth' }, { status: 401 });
            }

            console.log("Login successful for student:", student.name);
            // Generate auth tokens using the proper JWT function
            const { accessToken, refreshToken } = generateTokens(student);

            // Normalize the UID for redirect - remove ST prefix if present
            const redirectUid = student.uid.startsWith('ST') ? student.uid.substring(2) : student.uid;
            // Determine redirect URL based on user type using the normalized UID
            const redirectUrl = `/${redirectUid}`;

            console.log(`Redirecting to: ${redirectUrl}, Original UID: ${student.uid}, Redirect UID: ${redirectUid}`);

            // Create response with cookies
            const response = NextResponse.json({
                success: true,
                message: 'Login successful',
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

// Normalize UID by removing any non-numeric characters
function normalizeUid(uid: string): string {
    // Remove any non-numeric characters
    return uid.replace(/\D/g, '');
}