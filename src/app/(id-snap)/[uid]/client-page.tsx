"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { VerifyForm } from "@/components/student/verifyForm";
import { useAuth } from "@/hooks/use-auth";
import { Student } from "@/lib/db/schema";

export default function StudentProfileClient() {
  const { user } = useAuth();
  // Type assertion with optional chaining for safety
  const [studentData, setStudentData] = useState<Student | null>(
    user as Student | null
  );

  // Extract UID from pathname
  const pathname = usePathname();
  const uid = pathname.split("/").pop() || "";

  console.log(
    `Client page - pathname: ${pathname}, extracted UID: ${uid}, user.uid: ${
      (user as Student)?.uid || "unknown"
    }`
  );

  // Keep loading state for future use
  const [loading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      // Get the UID from auth context or URL pathname
      // Use the full UID with ST prefix if available in the user object
      const authUid = (user as Student)?.uid || uid;

      console.log(`Submitting verification with UID: ${authUid}`);

      // Add UID to the form data
      formData.append("uid", authUid);

      // Call the verify API
      const response = await fetch("/api/students/verify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify");
      }

      console.log("Verification successful:", data);

      // Update local student data if successful
      if (data.success && data.data.student) {
        setStudentData(data.data.student);
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Error uploading file:", error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="p-6 flex items-center justify-center">
          <div className="animate-pulse p-4 rounded-lg shadow-md w-full max-w-md">
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  // If student is not available, show error
  if (!studentData) {
    return (
      <div className="min-h-screen">
        <main className="p-6 flex items-center justify-center">
          <div className="p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading Profile
            </h2>
            <p className="mb-4">
              Unable to load student data. Please try logging in again.
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Return to Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Extract student information
  const { name, semester, course, section } = studentData;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md px-4 py-6">
        {/* Simple student info banner */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-gray-500 text-sm">
            UID: {uid.startsWith("ST") ? uid.substring(2) : uid}
          </p>
          <div className="flex justify-center mt-2 text-sm">
            <span className="px-2 border-r border-gray-300">{course}</span>
            <span className="px-2 border-r border-gray-300">{section}</span>
            <span className="px-2">{semester}</span>
          </div>
        </div>

        {/* Verification Form */}
        <VerifyForm student={studentData} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
