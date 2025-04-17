"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/ui/header";
import { StatCards } from "@/components/admin/statCards";
import { StudentList } from "@/components/admin/studentList";
import Cookies from "js-cookie";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    checked: 0,
    verified: 0,
    approved: 0,
  });

  // Initial data loading
  useEffect(() => {
    // Fetch data
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      // Fetch stats from API
      const statsResponse = await fetch("/api/students/stats");

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (
    studentId: number,
    abcId?: string
  ): Promise<void> => {
    try {
      // Call API to approve student
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          approve: true,
          ...(abcId !== undefined && { abcId }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update stats after approval
          setStats((prev) => ({
            ...prev,
            approved: prev.approved + 1,
            verified: prev.verified > 0 ? prev.verified - 1 : 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error approving student:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call the server-side logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Clear client-side storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("uid");
      localStorage.removeItem("userType");

      // Clear cookies
      Cookies.remove("refreshToken");
      Cookies.remove("uid");
      Cookies.remove("userType");

      // Redirect directly to the root page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
      <Header title="IDSnap" onLogout={handleLogout} />

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
            Student Management
          </h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4">
            <StudentList
              initialLoading={loading}
              onApprove={handleApprove}
              onRefreshStats={fetchStats}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
