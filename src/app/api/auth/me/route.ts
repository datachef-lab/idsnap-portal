import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken, generateTokens } from "@/lib/services/auth-service";
import { getStudentByEmail, getStudentByUid } from "@/lib/services/student-service";
import { getUserByEmail } from "@/lib/services/user-service";
import { Student, User } from "@/lib/db/schema";

export async function GET() {
    try {
        // Get the refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;
        const uidFromCookie = cookieStore.get("uid")?.value;
        const userType = cookieStore.get("userType")?.value;

        console.log("ME endpoint - Cookie check:", {
            refreshToken: refreshToken ? "present" : "missing",
            uid: uidFromCookie,
            userType
        });

        if (!refreshToken) {
            return NextResponse.json(
                { error: "No refresh token found" },
                { status: 401 }
            );
        }

        // Verify the refresh token
        const payload = await verifyRefreshToken(refreshToken);
        console.log("ME endpoint - Token payload:", payload);

        // If payload is null, the token is invalid
        if (!payload || !payload.email) {
            // Clear the invalid token
            cookieStore.delete("refreshToken");
            cookieStore.delete("uid");
            cookieStore.delete("userType");

            return NextResponse.json(
                { error: "Invalid refresh token" },
                { status: 401 }
            );
        }

        const email = payload.email;

        // Get user details based on cookies
        let user: User | Student | null = null;

        // Determine user type from cookies directly when available
        if (uidFromCookie && userType === "student") {
            // Student case: Use UID from cookie for lookup
            console.log("ME endpoint - Identified as student from cookies, attempting to find by UID:", uidFromCookie);
            user = await getStudentByUid(uidFromCookie);

            if (user) {
                console.log("ME endpoint - Found student by UID from cookie");
            } else {
                console.log("ME endpoint - Student not found with UID from cookie, possible cookie mismatch");
            }
        } else if (userType === "admin") {
            // Admin case: Look up by email from token
            console.log("ME endpoint - Identified as admin from cookies, looking up by email:", email);
            user = await getUserByEmail(email);

            if (user) {
                console.log("ME endpoint - Found admin user by email");
            } else {
                console.log("ME endpoint - Admin not found with email, possible cookie mismatch");
            }
        } else {
            // Fallback case when cookies don't clearly indicate type
            console.log("ME endpoint - User type unclear from cookies, attempting both lookups");

            // Try admin first
            user = await getUserByEmail(email);

            if (!user) {
                // Try finding student by email as last resort
                console.log("ME endpoint - Not an admin, trying student lookup by email:", email);
                user = await getStudentByEmail(email.trim());
            }
        }

        console.log("ME endpoint - User lookup result:", user ? "Found user" : "No user found");

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Add extra log for student data
        if ("uid" in user) {
            console.log("ME endpoint - Student data:", {
                uid: user.uid,
                email: user.email,
                hasUid: !!user.uid
            });
        }

        // Generate new tokens using our consistent method
        const { accessToken } = generateTokens(user);

        // Return user data and token
        return NextResponse.json({
            accessToken,
            user,
        });
    } catch (error) {
        console.error("Error in /api/auth/me:", error);
        return NextResponse.json(
            { error: "Failed to verify session" },
            { status: 500 }
        );
    }
} 