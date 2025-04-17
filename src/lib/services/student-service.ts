import db from "@/lib/db";
import { Student, studentTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createStudent(student: Student) {
    // Check if the student already exists
    const existingStudent = await getStudentByUid(student.uid);
    if (existingStudent) {
        return null;
    }

    // Trim all the strings
    const trimmedStudent: Student = {
        ...student,
        name: student.name.trim(),
        email: student.email.trim(),
        phone: student.phone.trim(),
        uid: student.uid.trim(),
        shift: student.shift?.trim().toUpperCase() as "DAY" | "MORNING" | "AFTERNOON" | "EVENING",
        semester: student.semester.trim(),
        course: student.course.trim(),
        section: student.section.trim(),
        registrationNumber: student.registrationNumber?.trim(),
        rollNumber: student.rollNumber?.trim(),
        abcId: student.abcId.trim(),
    };
    const [newStudent] =
        await db.insert(studentTable)
            .values(trimmedStudent)
            .returning();

    return newStudent;
}

export async function getStudentByUid(uid: string) {
    const [foundStudent] =
        await db.select()
            .from(studentTable)
            .where(eq(studentTable.uid, uid.trim()));
    return foundStudent;
}

export async function getStudentByEmail(email: string | null | undefined): Promise<Student | null> {
    // If email is undefined or null, return null
    if (!email) {
        return null;
    }

    const [foundStudent] =
        await db.select()
            .from(studentTable)
            .where(eq(studentTable.email, email.trim()));

    return foundStudent;
}

export async function getStudentById(id: number) {
    const [foundStudent] =
        await db.select()
            .from(studentTable)
            .where(eq(studentTable.id, id));
    return foundStudent;
}

export async function getStudents() {
    const students = await db.select().from(studentTable);
    return students;
}

export async function updateStudent(student: Student) {
    const [updatedStudent] =
        await db.update(studentTable)
            .set(student)
            .where(eq(studentTable.id, student.id as number))
            .returning();
    return updatedStudent;
}

export async function deleteStudent(id: number) {
    await db.delete(studentTable).where(eq(studentTable.id, id));
}