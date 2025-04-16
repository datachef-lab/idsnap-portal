import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/services/auth-service';
import db from '@/lib/db';
import { studentTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStudentById } from '@/lib/services/student-service';
import { sendEmail } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }

        // Update student status to approved
        await db.update(studentTable)
            .set({ approvedAt: true })
            .where(eq(studentTable.id, studentId));

        // Get student details for notification
        const student = await getStudentById(studentId);
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Send approval notification
        await sendEmail(
            student.email,
            'ABC ID Verification Approved',
            `
            <h1>Your ABC ID has been approved</h1>
            <p>Hello ${student.name},</p>
            <p>We're pleased to inform you that your ABC ID has been verified and approved by our administrators.</p>
            <p>Thank you for your patience during this process.</p>
            `
        );

        return NextResponse.json({
            success: true,
            message: 'Student ABC ID approved successfully'
        });
    } catch (error) {
        console.error('Error approving student:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 