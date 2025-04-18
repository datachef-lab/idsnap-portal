ALTER TABLE "students" RENAME COLUMN "approved_at" TO "is_approved";--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "dob" date DEFAULT '2025-04-18T06:25:00.420Z';