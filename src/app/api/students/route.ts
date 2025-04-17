import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { studentTable } from '@/lib/db/schema';
import { and, eq, isNotNull, desc, like, sql, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Parse pagination parameters
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        // Parse filter parameters
        const filterType = searchParams.get("filter") || "all"; // all, verified, checked_in, done
        const searchTerm = searchParams.get("search") || "";

        // Build filter conditions
        const whereConditions = [];

        // Add filter condition based on filter type
        if (filterType === "verified") {
            whereConditions.push(and(
                isNotNull(studentTable.verifiedAt),
                eq(studentTable.approvedAt, false)
            ));
        } else if (filterType === "checked_in") {
            whereConditions.push(isNotNull(studentTable.checkedAt));
        } else if (filterType === "done") {
            // "Done" means approved by admin
            whereConditions.push(eq(studentTable.approvedAt, true));
        }

        // Add search condition if search term is provided
        if (searchTerm) {
            const searchPattern = `%${searchTerm}%`;
            whereConditions.push(
                or(
                    like(studentTable.name, searchPattern),
                    like(studentTable.email, searchPattern),
                    like(studentTable.uid, searchPattern),
                    like(studentTable.abcId || '', searchPattern)
                )
            );
        }

        // Combine conditions
        const whereClause = whereConditions.length > 0
            ? and(...whereConditions)
            : undefined;

        // Build and execute the query with pagination
        const students = await db
            .select()
            .from(studentTable)
            .where(whereClause)
            .orderBy(desc(studentTable.updatedAt))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination using direct SQL count function
        const countResult = await db
            .select({ count: sql`count(*)` })
            .from(studentTable)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count || 0);
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            success: true,
            data: {
                students,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages,
                    hasMore: page < totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch students' },
            { status: 500 }
        );
    }
}

// API endpoint for approving a student
export async function PATCH(request: NextRequest) {
    try {
        const { studentId, approve, abcId } = await request.json();

        if (!studentId) {
            return NextResponse.json(
                { success: false, message: 'Student ID is required' },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        let isApproving = false;
        let isUpdatingAbcId = false;

        if (approve !== undefined) {
            updateData.approvedAt = approve;
            isApproving = true;
        }

        if (abcId !== undefined) {
            updateData.abcId = abcId;
            isUpdatingAbcId = true;
        }

        // Update student
        await db
            .update(studentTable)
            .set(updateData)
            .where(eq(studentTable.id, studentId));

        // Prepare response message based on what was updated
        let message = 'Student updated successfully';
        if (isApproving && isUpdatingAbcId) {
            message = 'Student ABC ID updated and approved successfully';
        } else if (isApproving) {
            message = 'Student approved successfully';
        } else if (isUpdatingAbcId) {
            message = 'ABC ID saved successfully';
        }

        return NextResponse.json({
            success: true,
            message,
        });
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update student' },
            { status: 500 }
        );
    }
} 