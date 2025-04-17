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
  const pathUid = pathname.split("/").pop() || "";

  // Check authentication on client side for extra security
  useEffect(() => {
    // Only redirect if we're sure authentication has been checked
    if (!isLoading) {
      console.log("Authentication check completed:", {
        userExists: !!user,
        pathUid,
        userUid: user && "uid" in user ? user.uid : undefined,
        isStudent: user && "uid" in user,
        userData: user ? JSON.stringify(user) : "null",
      });

      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/");
      } else if (!("uid" in user)) {
        console.log("User is not a student, redirecting to login");
        router.push("/");
      } else {
        // Now we can safely use user.uid since we've checked it exists
        // TypeScript understands this is a Student type after the 'uid' in user check
        const normalizedUserUid = user.uid?.startsWith("ST")
          ? user.uid.substring(2)
          : user.uid;
        const normalizedPathUid = pathUid?.startsWith("ST")
          ? pathUid.substring(2)
          : pathUid;

        console.log(
          `Comparing UIDs - User: ${normalizedUserUid} (${user.uid}), Path: ${normalizedPathUid} (${pathUid})`
        );

        if (normalizedUserUid !== normalizedPathUid) {
          console.log(`UID mismatch, redirecting to login`);
          router.push("/");
        } else {
          console.log("UID match confirmed, allowing access");
        }
      }
    }
  }, [user, isLoading, router, pathUid]);

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
