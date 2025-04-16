import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/services/auth-service';
import db from '@/lib/db';
import { studentTable } from '@/lib/db/schema';
import { count, isNotNull, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

        // Get student counts for different statuses
        const [totalStudents] = await db.select({ count: count() }).from(studentTable);

        const [checkedStudents] = await db
            .select({ count: count() })
            .from(studentTable)
            .where(isNotNull(studentTable.checkedAt));

        const [verifiedStudents] = await db
            .select({ count: count() })
            .from(studentTable)
            .where(isNotNull(studentTable.verifiedAt));

        const [approvedStudents] = await db
            .select({ count: count() })
            .from(studentTable)
            .where(eq(studentTable.approvedAt, true));

        return NextResponse.json({
            success: true,
            stats: {
                total: totalStudents.count,
                checked: checkedStudents.count,
                verified: verifiedStudents.count,
                approved: approvedStudents.count
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 