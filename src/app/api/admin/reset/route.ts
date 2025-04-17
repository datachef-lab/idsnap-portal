import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { studentTable } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const UPLOADS_BASE_PATH = process.env.FILE_UPLOAD_BASE_PATH || path.join(process.cwd(), 'data', 'file-uploads');
const VERIFICATIONS_DIR = path.join(UPLOADS_BASE_PATH, 'verifications');

export async function POST() {
    try {
        // Check if we're in production to prevent accidental resets
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_RESET !== 'true') {
            return NextResponse.json(
                { success: false, message: 'Database reset is not allowed in production' },
                { status: 403 }
            );
        }

        // Use raw SQL to truncate the student table
        await db.execute(sql`TRUNCATE TABLE ${studentTable}`);

        // Delete all verification images
        try {
            if (fs.existsSync(VERIFICATIONS_DIR)) {
                // Get all files in the verification directory
                const files = fs.readdirSync(VERIFICATIONS_DIR);

                // Delete each file
                for (const file of files) {
                    const filePath = path.join(VERIFICATIONS_DIR, file);
                    // Only delete if it's a file (not a directory)
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting verification images:', error);
            // Continue with the response even if image deletion fails
        }

        return NextResponse.json({
            success: true,
            message: 'Student data has been reset successfully'
        });
    } catch (error) {
        console.error('Error resetting student data:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reset student data: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
} 