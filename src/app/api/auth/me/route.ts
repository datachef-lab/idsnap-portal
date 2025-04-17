import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, verifyRefreshToken, generateTokens } from "@/lib/services/auth-service";

export async function GET() {
    try {
        // Get the refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        console.log("ME endpoint - Cookie check:", {
            refreshToken: refreshToken ? "present" : "missing"
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

        // Get user details
        const user = await getUserByEmail(email);
        console.log("ME endpoint - User:", user);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
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