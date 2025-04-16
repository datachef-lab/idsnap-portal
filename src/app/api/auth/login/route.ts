import { NextRequest, NextResponse } from 'next/server';
import { generateTokens, setAuthCookies, getUserByEmail } from '@/lib/services/auth-service';
import { Student, User } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
    try {
        const { uid, password } = await req.json();

        if (!uid || !password) {
            return NextResponse.json({ error: 'UID and password are required' }, { status: 400 });
        }

        console.log(`Login attempt for UID: ${uid}`);

        // Normal login flow
        try {
            const user: User | Student | null = await getUserByEmail(uid);
            console.log(`User found for UID ${uid}:`, user ? "Yes" : "No");

            if (!user) {
                return NextResponse.json({ error: 'Invalid UID or password' }, { status: 401 });
            }

            console.log("Login successful for user:", user.name);
            const tokens = generateTokens(user);

            // Determine redirect URL based on user type
            // Check if user object has a uid property (indicating it's a Student)
            const redirectUrl = 'uid' in user ? `/${user.uid}` : '/home';

            const response = setAuthCookies(tokens);
            return NextResponse.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                accessToken: tokens.accessToken,
                redirectUrl
            }, response);
        } catch (error) {
            console.error("Error during getUserByUid:", error);
            return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
    }
}