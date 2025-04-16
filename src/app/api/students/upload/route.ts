import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/services/auth-service';
import { getStudentByEmail } from '@/lib/services/student-service';
import { uploadAbcIdScreenshot } from '@/lib/services/file-service';
import { sendEmail } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
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

        // Get student from token payload
        const student = await getStudentByEmail(payload.email);
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Handle file upload
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, JPG and PNG are allowed.' },
                { status: 400 }
            );
        }

        // Get file as buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload file
        const fileInfo = await uploadAbcIdScreenshot(student.id as number, fileBuffer, file.name);

        // Update student's ABC ID if provided
        const abcId = formData.get('abcId') as string;
        if (abcId && abcId !== student.abcId) {
            // We would update the ABC ID here if it's changed
            // This would be implemented in a student service
        }

        // Send notification email
        await sendEmail(
            student.email,
            'ABC ID Verification Queued',
            `
            <h1>Your ABC ID verification has been queued</h1>
            <p>Hello ${student.name},</p>
            <p>Your ABC ID verification request has been received and is now in the queue for review.</p>
            <p>You will be notified once your ID is approved by the administrators.</p>
            <p>Thank you for your patience.</p>
            `
        );

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully and verification queued',
            fileName: fileInfo.fileName
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 