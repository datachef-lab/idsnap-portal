import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { studentTable } from '@/lib/db/schema';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';

const fileUploadBasePath = process.env.FILE_UPLOAD_BASE_PATH || './data/file-uploads';

// Ensure upload directory exists
export function ensureUploadDirectoryExists() {
    if (!fs.existsSync(fileUploadBasePath)) {
        fs.mkdirSync(fileUploadBasePath, { recursive: true });
    }

    const studentUploadsPath = path.join(fileUploadBasePath, 'abc-id-uploads');
    if (!fs.existsSync(studentUploadsPath)) {
        fs.mkdirSync(studentUploadsPath, { recursive: true });
    }
}

// Upload ABC ID screenshot
export async function uploadAbcIdScreenshot(studentId: number, fileBuffer: Buffer, fileName: string) {
    ensureUploadDirectoryExists();

    // Generate a unique filename
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${studentId}-${uuidv4()}${fileExt}`;
    const studentUploadsPath = path.join(fileUploadBasePath, 'abc-id-uploads');
    const filePath = path.join(studentUploadsPath, uniqueFileName);

    // Write file to disk
    fs.writeFileSync(filePath, fileBuffer);

    // Update student record to mark as verified
    await db.update(studentTable)
        .set({
            verifiedAt: new Date()
        })
        .where(eq(studentTable.id, studentId));

    return {
        fileName: uniqueFileName,
        filePath
    };
}

// Get file path for a student's ABC ID screenshot
export function getAbcIdScreenshotPath(fileName: string) {
    const studentUploadsPath = path.join(fileUploadBasePath, 'abc-id-uploads');
    return path.join(studentUploadsPath, fileName);
}

// Check if file exists
export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

// Get all ABC ID screenshots
export function getAllAbcIdScreenshots() {
    ensureUploadDirectoryExists();
    const studentUploadsPath = path.join(fileUploadBasePath, 'abc-id-uploads');
    return fs.readdirSync(studentUploadsPath);
} 