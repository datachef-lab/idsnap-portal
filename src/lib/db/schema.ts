import { boolean, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const shiftEnum = pgEnum("shift_type", [
    "DAY",
    "MORNING",
    "AFTERNOON",
    "EVENING",
]);

export const studentTable = pgTable("students", {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    uid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    semester: varchar({ length: 255 }).notNull(),
    course: varchar({ length: 500 }).notNull(),
    shift: shiftEnum().notNull().default("DAY"),
    section: varchar({ length: 10 }).notNull(),
    registrationNumber: varchar("registration_number", { length: 255 }),
    rollNumber: varchar("roll_number", { length: 255 }),
    abcId: varchar("abc_id", { length: 255 }).notNull(),
    checkedAt: timestamp("checked_in_at"),
    verifiedAt: timestamp("verified_at"),
    approvedAt: boolean("approved_at").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersTable = pgTable("users", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const otpTable = pgTable("otps", {
    id: serial().primaryKey(),
    email: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    otp: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});


export const createStudentSchema = createInsertSchema(studentTable);
export const createUserSchema = createInsertSchema(usersTable);
export const createOtpSchema = createInsertSchema(otpTable);

export type Student = z.infer<typeof createStudentSchema>;
export type User = z.infer<typeof createUserSchema>;
export type Otp = z.infer<typeof createOtpSchema>;