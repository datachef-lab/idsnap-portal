import { NextResponse } from 'next/server';
import { isNotNull, desc } from 'drizzle-orm';
import db from '@/lib/db';
import { studentTable } from '@/lib/db/schema';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import type { Student } from '@/lib/db/schema';

const UPLOADS_BASE_PATH = process.env.FILE_UPLOAD_BASE_PATH || path.join(process.cwd(), 'data', 'file-uploads');
const VERIFICATIONS_DIR = path.join(UPLOADS_BASE_PATH, 'verifications');

/**
 * Find the image file path for a student
 */
function findImagePath(uid: string): string | null {
    try {
        // Try different possible file extensions
        const possibleExtensions = ['.jpg', '.jpeg', '.png'];

        for (const ext of possibleExtensions) {
            const testPath = path.join(VERIFICATIONS_DIR, `${uid}${ext}`);
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        }

        return null;
    } catch (error) {
        console.error(`Error finding image for student ${uid}:`, error);
        return null;
    }
}

export async function GET() {
    try {
        // Fetch verified students (verifiedAt is not null)
        const verifiedStudents = await db
            .select()
            .from(studentTable)
            .where(isNotNull(studentTable.verifiedAt)) as Student[];

        // Fetch students who have checked in (checkedAt is not null)
        const checkedInStudents = await db
            .select()
            .from(studentTable)
            .where(isNotNull(studentTable.checkedAt)) as Student[];

        // Fetch all students for the "All" sheet
        const allStudents = await db
            .select()
            .from(studentTable)
            .orderBy(desc(studentTable.name)) as Student[];

        // Create a new ExcelJS workbook for proper image embedding
        const workbook = new ExcelJS.Workbook();

        // Create worksheets
        const allSheet = workbook.addWorksheet('All Students');
        const verifiedSheet = workbook.addWorksheet('ABC ID Verified');
        const checkedInSheet = workbook.addWorksheet('Checked In');

        // Set columns for all students sheet
        allSheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'UID', key: 'uid', width: 10 },
            { header: 'ABC ID', key: 'abcId', width: 12 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Course', key: 'course', width: 20 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Shift', key: 'shift', width: 10 },
            { header: 'Verified', key: 'verified', width: 10 },
            { header: 'Approved', key: 'approved', width: 10 },
        ];

        // Set columns for verified students sheet
        verifiedSheet.columns = [
            { header: 'Name', key: 'name', width: 25 },
            { header: 'UID', key: 'uid', width: 12 },
            { header: 'Course', key: 'course', width: 30 },
            { header: 'ABC ID', key: 'abcId', width: 15 },
            { header: 'Verification Image', key: 'image', width: 35 },
        ];

        // Set columns for checked in students sheet
        checkedInSheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'UID', key: 'uid', width: 10 },
            { header: 'ABC ID', key: 'abcId', width: 12 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Course', key: 'course', width: 20 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Shift', key: 'shift', width: 10 },
            { header: 'Checked In At', key: 'checkedAt', width: 20 },
        ];

        // Make the headers bold
        [allSheet, verifiedSheet, checkedInSheet].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
        });

        // Add data for all students
        allStudents.forEach((student) => {
            allSheet.addRow({
                name: student.name,
                uid: student.uid.includes('ST') ? student.uid.substring(2) : student.uid,
                abcId: student.abcId,
                email: student.email,
                phone: student.phone,
                course: student.course,
                semester: student.semester,
                section: student.section,
                shift: student.shift,
                verified: student.verifiedAt ? 'Yes' : 'No',
                approved: student.approvedAt ? 'Yes' : 'No',
            });
        });

        // Add data for verified students
        for (let i = 0; i < verifiedStudents.length; i++) {
            const student = verifiedStudents[i];
            const rowIndex = i + 2; // Adding 2 because row 1 is header

            // Add student data
            verifiedSheet.addRow({
                name: student.name,
                uid: student.uid.includes('ST') ? student.uid.substring(2) : student.uid,
                course: student.course,
                abcId: student.abcId,
            });

            // Find and add image if it exists
            const imagePath = findImagePath(student.uid);
            if (imagePath) {
                try {
                    // Read image
                    const imageBuffer = fs.readFileSync(imagePath);

                    // Get the image extension
                    const extension = path.extname(imagePath).toLowerCase();
                    const extensionWithoutDot = extension.substring(1); // remove the dot

                    // Determine the image type
                    let imageExtension: "jpeg" | "png" = "jpeg";
                    if (extensionWithoutDot === "png") {
                        imageExtension = "png";
                    }

                    // Create image in cell - cast the buffer to satisfy TypeScript
                    const imageId = workbook.addImage({
                        buffer: imageBuffer as Buffer,
                        extension: imageExtension,
                    });

                    // Calculate the position in the sheet (column E = 5)
                    verifiedSheet.addImage(imageId, {
                        tl: { col: 4, row: rowIndex - 1 },
                        ext: { width: 150, height: 100 },
                    });

                    // Add some spacing to the row to accommodate the image
                    verifiedSheet.getRow(rowIndex).height = 80;
                } catch (error) {
                    console.error(`Error adding image for student ${student.uid}:`, error);
                }
            }
        }

        // Add data for checked in students
        checkedInStudents.forEach((student) => {
            checkedInSheet.addRow({
                name: student.name,
                uid: student.uid.includes('ST') ? student.uid.substring(2) : student.uid,
                abcId: student.abcId,
                email: student.email,
                phone: student.phone,
                course: student.course,
                semester: student.semester,
                section: student.section,
                shift: student.shift,
                checkedAt: student.checkedAt ? new Date(student.checkedAt).toLocaleString() : '',
            });
        });

        // Set autofilter for all sheets
        allSheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: 11 }
        };

        verifiedSheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: 4 }
        };

        checkedInSheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: 10 }
        };

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Create a response with the Excel file
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', 'attachment; filename="student_verification_data.xlsx"');
        headers.set('Content-Length', String(buffer.byteLength));

        return new NextResponse(buffer, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('Error generating Excel export:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to generate Excel export: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
} 