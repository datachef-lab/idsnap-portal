CREATE TYPE "public"."shift_type" AS ENUM('DAY', 'MORNING', 'AFTERNOON', 'EVENING');--> statement-breakpoint
CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(255) NOT NULL,
	"otp" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"uid" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(255) NOT NULL,
	"semester" varchar(255) NOT NULL,
	"course" varchar(500) NOT NULL,
	"shift" "shift_type" DEFAULT 'DAY' NOT NULL,
	"section" varchar(10) NOT NULL,
	"registration_number" varchar(255),
	"roll_number" varchar(255),
	"abc_id" varchar(255) NOT NULL,
	"checked_in_at" timestamp,
	"verified_at" timestamp,
	"approved_at" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "students_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
