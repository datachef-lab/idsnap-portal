import db from "@/lib/db";
import { User, usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createUser(user: User) {
    // Check if the user already exists by email
    const existingUser = await getUserByEmail(user.email);
    if (existingUser) {
        return null;
    }
    const [newUser] = await db.insert(usersTable).values(user).returning();
    return newUser;
}

export async function getUserByEmail(email: string) {
    const [foundUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return foundUser;
}   

export async function getUserById(id: number) {
    const [foundUser] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return foundUser;
}

export async function getUsers() {
    const users = await db.select().from(usersTable);
    return users;
}

export async function updateUser(user: User) {
    const [updatedUser] = 
        await db.update(usersTable)
            .set(user)
            .where(eq(usersTable.id, user.id as number))
            .returning();
            
    return updatedUser;
}

export async function deleteUser(id: number) {
    await db.delete(usersTable).where(eq(usersTable.id, id));
}   