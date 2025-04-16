"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { StatCards } from "@/components/admin/statCards";
import { StudentList } from "@/components/admin/studentList";
import Cookies from "js-cookie";

// Define the Student interface
interface Student {
  id: number;
  name: string;
  email: string;
  uid: string;
  abcId: string;
  verifiedAt: Date | null;
  approvedAt: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    checked: 0,
    verified: 0,
    approved: 0,
  });

  // Fix the type error by providing the correct type
  const [students, setStudents] = useState<Student[]>([]);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    // Fetch data
    fetchData();
  }, [router]);

  const fetchData = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate API response
    setStats({
      total: 120,
      checked: 85,
      verified: 42,
      approved: 28,
    });

    setStudents([
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        uid: "ST12345",
        abcId: "ABC123456",
        verifiedAt: new Date(),
        approvedAt: true,
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        uid: "ST12346",
        abcId: "ABC123457",
        verifiedAt: new Date(),
        approvedAt: false,
      },
      {
        id: 3,
        name: "Robert Johnson",
        email: "robert.johnson@example.com",
        uid: "ST12347",
        abcId: "ABC123458",
        verifiedAt: null,
        approvedAt: false,
      },
      {
        id: 4,
        name: "Emily Davis",
        email: "emily.davis@example.com",
        uid: "ST12348",
        abcId: "ABC123459",
        verifiedAt: new Date(),
        approvedAt: true,
      },
      {
        id: 5,
        name: "Michael Brown",
        email: "michael.brown@example.com",
        uid: "ST12349",
        abcId: "ABC123460",
        verifiedAt: new Date(),
        approvedAt: false,
      },
    ]);

    setLoading(false);
  };

  const handleApprove = async (studentId: number) => {
    // This would call the API in a real app
    console.log("Approving student:", studentId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Update local state
    setStudents(
      students.map((student) =>
        student.id === studentId ? { ...student, approvedAt: true } : student
      )
    );

    // Update stats
    setStats((prev) => ({
      ...prev,
      approved: prev.approved + 1,
    }));
  };

  const handleViewStudent = (uid: string) => {
    router.push(`/${uid}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("uid");
    Cookies.remove("refreshToken");
    Cookies.remove("uid");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
      <Header title="Dashboard" onLogout={handleLogout} />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-indigo-700">Dashboard</h1>
          <p className="text-purple-600 mb-6">
            Overview of student verification status
          </p>

          <StatCards stats={stats} loading={loading} />
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4 text-indigo-700">
            Recent Students
          </h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4">
            <StudentList
              students={students}
              loading={loading}
              onApprove={handleApprove}
              onViewStudent={handleViewStudent}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
