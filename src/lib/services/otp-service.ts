import db from "@/lib/db";
import { Otp, otpTable, Student, User } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUserByEmail, getUserByUid } from "./auth-service";
import { sendEmail, sendWhatsAppMessage } from "./notification-service";

export async function createOtp(email: string | null, uid: string | null) {
    if (!email && !uid) {
        return null;
    }

    let user: User | Student | null = null;

    if (email) {
        user = await getUserByEmail(email);
    }
    else if (uid) {
        user = await getUserByUid(uid);
    }

    // Create randome 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const [newOtp] = await db.insert(otpTable).values({
        phone: user?.phone as string,
        email: user?.email as string,
        otp: otp,
        createdAt: new Date(),
    }).returning();

    // Send OTO in whatsapp
    await sendWhatsAppMessage(user?.phone as string, [otp]);

    // Send email
    await sendEmail(user?.email as string, "OTP for login", otp);

    return newOtp;
}

export async function verifyOtp(email: string, otp: string) {
    const foundOtp = await getOtpByEmailAndOtp(email.trim(), otp.trim());
    if (!foundOtp) {
        return 0; // Invalid OTP
    }
    else if (foundOtp.createdAt && new Date().getTime() - new Date(foundOtp.createdAt).getTime() > 1000 * 60 * 2) {
        return -1; // OTP expired
    }

    return 1; // OTP verified
}

export async function getOtpByPhone(phone: string) {
    const [foundOtp] = 
        await db.select()
            .from(otpTable)
            .where(eq(otpTable.phone, phone.trim()))
            .orderBy(desc(otpTable.createdAt))
            .limit(1);
    return foundOtp;
}   

export async function getOtpByPhoneAndOtp(phone: string, otp: string) {
    const [foundOtp] = 
            await db.select()
            .from(otpTable)
            .where(
                and(
                    eq(otpTable.phone, phone.trim()), 
                    eq(otpTable.otp, otp.trim()
                )
            ))
            .orderBy(desc(otpTable.createdAt))
            .limit(1);

    return foundOtp;
}   

export async function getOtpByEmailAndOtp(email: string, otp: string) {
    const [foundOtp] = 
            await db.select()
            .from(otpTable)
            .where(
                and(
                    eq(otpTable.email, email.trim()), 
                    eq(otpTable.otp, otp.trim()
                )
            ))
            .orderBy(desc(otpTable.createdAt))
            .limit(1);

    return foundOtp;
}   

export async function getOtps() {
    const otps = await db.select().from(otpTable);
    return otps;
}

export async function updateOtp(otp: Otp) {
    const [updatedOtp] = 
        await db.update(otpTable)
            .set(otp)
            .where(eq(otpTable.id, otp.id as number)).returning();
    return updatedOtp;
}

export async function deleteOtp(id: number) {
    await db.delete(otpTable).where(eq(otpTable.id, id));
}