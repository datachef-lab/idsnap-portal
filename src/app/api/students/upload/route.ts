import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { createStudent } from '@/lib/services/student-service';
import { Student } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        // Parse the multipart form data request
        const formData = await request.formData();
        const file = formData.get('file');

        // Check if file exists and is a Blob (more generic than File which is browser-specific)
        if (!file || !(file instanceof Blob)) {
            return NextResponse.json(
                { success: false, message: 'No valid file provided' },
                { status: 400 }
            );
        }

        // Get file name - formData files in Node environment might not have 'name' property directly
        const fileName = formData.get('fileName') as string || 'upload.xlsx';

        // Check file type based on fileName
        const lowerFileName = fileName.toLowerCase();
        if (!lowerFileName.endsWith('.xlsx') && !lowerFileName.endsWith('.xls')) {
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
                const requiredFields = ['Name', 'UID', 'Email', 'Phone', 'DOB', 'Semester', 'Course', 'Shift', 'Section', 'ABC Id'];
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

                // Validate DOB format and convert to YYYY-MM-DD for database
                const dobInput = String(row['DOB']);
                if (!isValidDateFormat(dobInput)) {
                    throw new Error(`Invalid DOB format: '${dobInput}'. Use DD-MM-YYYY or DD/MM/YYYY format.`);
                }

                // Convert from DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD for database storage
                const separator = dobInput.includes('-') ? '-' : '/';
                const [day, month, year] = dobInput.split(separator);
                const formattedDob = `${year}-${month}-${day}`;

                // Create student object
                const studentData: Student = {
                    name: String(row['Name']),
                    uid: String(row['UID']),
                    email: String(row['Email']),
                    phone: String(row['Phone']),
                    dob: formattedDob,
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

// Function to validate date format (DD-MM-YYYY or DD/MM/YYYY)
function isValidDateFormat(dateString: string): boolean {
    // Check for both dash and slash formats
    const dashRegex = /^\d{2}-\d{2}-\d{4}$/;
    const slashRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!dashRegex.test(dateString) && !slashRegex.test(dateString)) {
        return false;
    }

    // Extract day, month, and year using the appropriate separator
    const separator = dateString.includes('-') ? '-' : '/';
    const [day, month, year] = dateString.split(separator).map(Number);

    // Check if the date is valid
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
} 