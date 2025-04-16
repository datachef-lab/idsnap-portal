import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SignJWT } from "jose";
import { getUserByEmail, verifyRefreshToken } from "@/lib/services/auth-service";

export async function GET() {
    try {
        // Get the refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "No refresh token found" },
                { status: 401 }
            );
        }

        // Verify the refresh token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const payload = await verifyRefreshToken(refreshToken);
        console.log("in refresh, payload:", payload);
        const email = payload?.email as string;

        // Get user details
        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Generate new access token
        const accessToken = await new SignJWT({ userId: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret);

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