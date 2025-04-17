"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface StudentIdClientLayoutProps {
  children: React.ReactNode;
}

export default function StudentIdClientLayout({
  children,
}: StudentIdClientLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Extract UID from the pathname
  const uid = pathname.split("/").pop() || "";

  // Check authentication on client side for extra security
  useEffect(() => {
    // Only redirect if we're sure authentication has been checked
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/");
      } else if (!("uid" in user) || user.uid !== uid) {
        console.log(
          `UID mismatch or user is not a student, redirecting to login`
        );
        router.push("/");
      }
    }
  }, [user, isLoading, router, uid]);

  // Show a loader while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <h2 className="mt-2 text-xl font-medium text-indigo-900">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {children}
    </div>
  );
}
