"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LogoutPage() {
  const [logoutComplete, setLogoutComplete] = useState(false);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call the server-side logout API
        await fetch("/api/auth/logout", {
          method: "POST",
        });

        // Clear all local storage
        localStorage.clear();

        // Clear all client-side cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie =
            name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }

      // Set logout as complete after a short delay
      setTimeout(() => {
        setLogoutComplete(true);
      }, 1500);
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-400 to-purple-500">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {logoutComplete ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-indigo-700">
              Logout Complete
            </h1>
            <p className="text-indigo-600 mb-6">
              You have been successfully logged out.
            </p>
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
              >
                Go to Login Page
              </Link>
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md"
              >
                Force Navigate to Login
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4 text-indigo-700">
              Logging out...
            </h1>
            <p className="text-indigo-600 mb-4">
              Please wait while we sign you out.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
