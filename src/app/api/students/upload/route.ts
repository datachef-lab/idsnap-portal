import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { createStudent } from '@/lib/services/student-service';
import { Student } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        // Parse the multipart form data request
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file type
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' },
                { status: 400 }
            );
        }

        // Read the Excel file
        const fileBuffer = await file.arrayBuffer();
        const workbook = xlsx.read(fileBuffer, { type: 'array' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const data = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        // Process each row
        const results = {
            total: data.length,
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel rows start at 1, plus header row

            try {
                // Validate required fields
                const requiredFields = ['Name', 'UID', 'Email', 'Phone', 'Semester', 'Course', 'Shift', 'Section', 'ABC Id'];
                for (const field of requiredFields) {
                    if (!row[field]) {
                        throw new Error(`Missing required field '${field}'`);
                    }
                }

                // Validate email format
                const email = String(row['Email']);
                if (!isValidEmail(email)) {
                    throw new Error(`Invalid email format: '${email}'`);
                }

                // Create student object
                const studentData: Student = {
                    name: String(row['Name']),
                    uid: String(row['UID']),
                    email: String(row['Email']),
                    phone: String(row['Phone']),
                    semester: String(row['Semester']),
                    course: String(row['Course']),
                    shift: validateShift(String(row['Shift']).toUpperCase()),
                    section: String(row['Section']),
                    registrationNumber: row['Reg. No.'] ? String(row['Reg. No.']) : undefined,
                    rollNumber: row['Roll No.'] ? String(row['Roll No.']) : undefined,
                    abcId: String(row['ABC Id'])
                };

                // Create student in database
                const newStudent = await createStudent(studentData);

                if (newStudent) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push(`Row ${rowNum}: Duplicate student UID '${studentData.uid}'`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: ${(error as Error).message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Students processed successfully',
            data: results
        });
    } catch (error) {
        console.error('Error processing student upload:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process student upload' },
            { status: 500 }
        );
    }
}

// Function to validate shift values
function validateShift(shiftValue: string): "DAY" | "MORNING" | "AFTERNOON" | "EVENING" {
    const validShifts = ["DAY", "MORNING", "AFTERNOON", "EVENING"];
    if (validShifts.includes(shiftValue)) {
        return shiftValue as "DAY" | "MORNING" | "AFTERNOON" | "EVENING";
    }
    throw new Error(`Invalid Shift value '${shiftValue}'. Valid values are: ${validShifts.join(", ")}`);
}

// Function to validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
} 