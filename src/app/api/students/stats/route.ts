import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { studentTable } from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import { eq, isNotNull, isNull, and } from 'drizzle-orm';

export async function GET() {
    try {
        // Get total students count
        const [totalCount] = await db.select({ value: count() }).from(studentTable);

        // Get checked-in students count (students who have checkedAt not null BUT verifiedAt is null)
        const [checkedCount] = await db.select({ value: count() })
            .from(studentTable)
            .where(
                and(
                    isNotNull(studentTable.checkedAt),
                    isNull(studentTable.verifiedAt)
                )
            );

        // Get verified students count (students who have verifiedAt not null)
        const [verifiedCount] = await db.select({ value: count() })
            .from(studentTable)
            .where(isNotNull(studentTable.verifiedAt));

        // Get approved students count
        const [approvedCount] = await db.select({ value: count() })
            .from(studentTable)
            .where(eq(studentTable.approvedAt, true));

        // Return statistics
        return NextResponse.json({
            success: true,
            data: {
                total: totalCount.value,
                checked: checkedCount.value,
                verified: verifiedCount.value,
                approved: approvedCount.value
            }
        });
    } catch (error) {
        console.error('Error fetching student statistics:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch student statistics' },
            { status: 500 }
        );
    }
} 