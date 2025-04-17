import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStudentByUid, updateStudent } from '@/lib/services/student-service';
import { Student } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        // Parse the multipart form data request
        const formData = await request.formData();
        const file = formData.get('file');
        const abcId = formData.get('abcId') as string;
        const uid = formData.get('uid') as string;

        // Validate required data
        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        if (!uid) {
            return NextResponse.json(
                { success: false, message: 'Student UID is required' },
                { status: 400 }
            );
        }

        if (!abcId) {
            return NextResponse.json(
                { success: false, message: 'ABC ID is required' },
                { status: 400 }
            );
        }

        // Get the student from database
        const student = await getStudentByUid(uid);

        if (!student) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        // Determine file type and extension
        const fileType = file.type;
        let fileExtension = '';

        if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
            fileExtension = '.jpg';
        } else if (fileType === 'image/png') {
            fileExtension = '.png';
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Only JPEG, JPG and PNG files are allowed.' },
                { status: 400 }
            );
        }

        // Create upload directory if it doesn't exist
        const uploadBasePath = process.env.FILE_UPLOAD_BASE_PATH || path.join(process.cwd(), 'data', 'file-uploads');
        const verificationDir = path.join(uploadBasePath, 'verifications');

        if (!fs.existsSync(verificationDir)) {
            fs.mkdirSync(verificationDir, { recursive: true });
        }

        // Create the file path - using UID as filename
        const filePath = path.join(verificationDir, `${uid}${fileExtension}`);

        // Convert file to buffer and save it
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, fileBuffer);

        // Update student record with the new ABC ID and mark as verified
        const updatedStudent: Student = {
            ...student,
            abcId: abcId.trim(),
            verifiedAt: new Date()
        };

        const result = await updateStudent(updatedStudent);

        if (!result) {
            return NextResponse.json(
                { success: false, message: 'Failed to update student record' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification submitted successfully',
            data: {
                student: result,
                filePath: `/verifications/${uid}${fileExtension}`
            }
        });

    } catch (error) {
        console.error('Error processing verification:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process verification' },
            { status: 500 }
        );
    }
} 