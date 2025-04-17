import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { getStudentByEmail, getStudentByUid } from './student-service';
import { getUserByEmail as getUserByEmailFromService } from './user-service';
import { User, Student, studentTable } from "@/lib/db/schema";
import db from '../db';
import { eq } from 'drizzle-orm';

// JWT Secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Interface for token payloads
export interface TokenPayload {
    userId: number;
    email: string;
    name: string;
}

// Interface for auth tokens
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

// Generate hash for password
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Verify password against hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT tokens
export function generateTokens(user: User | Student): AuthTokens {
    // Handle different user types
    const payload: TokenPayload = {
        userId: user.id as number,
        email: user.email,
        name: user.name,
    };

    // Create proper JWT tokens with the jsonwebtoken library
    // @ts-expect-error - ignore type issues with jwt library
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY
    });

    // @ts-expect-error - ignore type issues with jwt library
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    });

    return { accessToken, refreshToken };
}

// Verify JWT access token
export const verifyAccessToken = async (token: string) => {
    try {
        if (!token) return null;
        const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return verified;
    } catch (error) {
        console.log("Error verifying access token:", error);
        return null;
    }
}

// Verify JWT refresh token
export const verifyRefreshToken = async (token: string) => {
    try {
        if (!token) return null;
        const verified = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
        return verified;
    } catch (error) {
        console.log("Error verifying refresh token:", error);
        return null;
    }
}

// Set auth cookies
export function setAuthCookies(tokens: AuthTokens) {
    const response = new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

    response.cookies.set({
        name: 'refreshToken',
        value: tokens.refreshToken,
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
    });

    return response;
}

// Clear auth cookies
export async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | Student | null> {
    let user: User | Student | null = null;

    // First try to find a student with this email
    user = await getStudentByEmail(email);
    if (user) {
        await db.update(studentTable)
            .set({ checkedAt: new Date() })
            .where(eq(studentTable.id, user.id as number));

        return user;
    }

    // Then try to find a user with this email
    user = await getUserByEmailFromService(email);
    if (user) {
        return user;
    }

    // If no result is found, return null
    return null;
}

// Get user by uid
export async function getUserByUid(uid: string): Promise<Student | null> {
    const user = await getStudentByUid(uid);
    return user;
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) return null;

    const user = await getUserByEmail(payload.email);
    if (!user) return null;

    const { accessToken } = generateTokens(user);
    return accessToken;
}