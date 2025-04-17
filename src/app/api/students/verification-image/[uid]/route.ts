import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStudentByUid } from '@/lib/services/student-service';

type Props = {
    params: {
        uid: string;
    };
};

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const uid = params.uid;

        if (!uid) {
            return NextResponse.json(
                { success: false, message: 'Student UID is required' },
                { status: 400 }
            );
        }

        // Get the student from database to verify they exist
        const student = await getStudentByUid(uid);

        if (!student) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        // Check if student has been verified
        if (!student.verifiedAt) {
            return NextResponse.json(
                { success: false, message: 'No verification image found for this student' },
                { status: 404 }
            );
        }

        // Define the upload base path and verification directory
        const uploadBasePath = process.env.FILE_UPLOAD_BASE_PATH || path.join(process.cwd(), 'data', 'file-uploads');
        const verificationDir = path.join(uploadBasePath, 'verifications');

        // Try different possible file extensions
        const possibleExtensions = ['.jpg', '.jpeg', '.png'];
        let imagePath = null;
        let imageFound = false;

        for (const ext of possibleExtensions) {
            const testPath = path.join(verificationDir, `${uid}${ext}`);
            if (fs.existsSync(testPath)) {
                imagePath = testPath;
                imageFound = true;
                break;
            }
        }

        if (!imageFound || !imagePath) {
            return NextResponse.json(
                { success: false, message: 'Verification image file not found' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = fs.readFileSync(imagePath);

        // Determine content type based on file extension
        const fileExtension = path.extname(imagePath).toLowerCase();
        let contentType = 'image/jpeg'; // Default

        if (fileExtension === '.png') {
            contentType = 'image/png';
        } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
            contentType = 'image/jpeg';
        }

        // Create a response with the image
        const response = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            }
        });

        return response;
    } catch (error) {
        console.error('Error fetching verification image:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch verification image' },
            { status: 500 }
        );
    }
} 