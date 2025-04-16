"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { VerifyForm } from "@/components/student/verifyForm";
import Cookies from "js-cookie";

interface PageParams {
  uid: string;
}

export default function StudentProfile({ params }: { params: PageParams }) {
  const router = useRouter();
  const { uid } = params;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState({
    id: 0,
    name: "",
    email: "",
    uid: "",
    abcId: "",
  });

  // Check authentication and redirect if not logged in
  useEffect(() => {
    const token = Cookies.get("refreshToken");
    const cookieUid = Cookies.get("uid");

    // Redirect if not logged in or if UIDs don't match
    if (!token || cookieUid !== uid) {
      router.push("/");
      return;
    }

    // Fetch student data (simulated)
    fetchStudentData(uid);
  }, [uid, router]);

  const fetchStudentData = async (studentUid: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock student data
    setStudent({
      id: 1,
      name: "Student " + studentUid,
      email: `${studentUid.toLowerCase()}@example.com`,
      uid: studentUid,
      abcId: `ABC${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setLoading(false);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      // This would be an API call in a real app
      console.log("Uploading file:", formData.get("file"));
      console.log("ABC ID:", formData.get("abcId"));
      console.log("Student UID:", uid);

      // Simulate API call
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      return Promise.resolve();
    } catch (error) {
      console.error("Error uploading file:", error);
      return Promise.reject(error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call the logout API to clear server-side cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Clear client-side cookies and localStorage
      Cookies.remove("refreshToken");
      Cookies.remove("uid");
      Cookies.remove("userType");

      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("uid");

      // Navigate to logout page
      window.location.href = "/logout";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to direct navigation if API call fails
      window.location.href = "/logout";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
        <Header title={`Student Profile: ${uid}`} onLogout={handleLogout} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-pulse p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-md w-full max-w-md">
            <div className="h-8 bg-indigo-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-indigo-200 rounded mb-6 w-1/2"></div>
            <div className="h-64 bg-indigo-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
      <Header title={`Student Profile: ${uid}`} onLogout={handleLogout} />

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-indigo-700">
            Welcome, {student.name}
          </h1>
          <p className="text-purple-600">
            Please verify your ABC ID by uploading a screenshot.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6">
          <VerifyForm student={student} onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}
