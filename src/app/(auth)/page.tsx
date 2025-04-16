"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  // Function to handle sending OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the send-otp API
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // OTP sent successfully
      setOtpSent(true);
      setExpiresAt(data.expiresAt);

      // Focus OTP input
      setTimeout(() => {
        const otpInput = document.getElementById("otp-input");
        if (otpInput) otpInput.focus();
      }, 100);
    } catch (error) {
      setError((error as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the verify-otp API
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify OTP");
      }

      // Navigate to the redirect URL provided by the API
      router.push(data.data.redirectUrl);
    } catch (error) {
      setError((error as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Function to clear browser data
  const clearAllData = () => {
    // Clear cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    // Reload the page to ensure a clean state
    window.location.reload();
  };

  // Update timer every second
  useEffect(() => {
    if (!expiresAt) return;

    const updateRemainingTime = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      if (remaining <= 0) {
        setRemainingTime("Expired");
        clearInterval(interval);
      } else {
        setRemainingTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    // Update immediately
    updateRemainingTime();

    // Then update every second
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-400 to-purple-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">IDSnap Portal</h1>
        <p className="text-indigo-100 text-lg">ABC ID Verification System</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full">
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Enter OTP
              </label>
              <Input
                id="otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit OTP"
                required
                maxLength={6}
                className="w-full text-center tracking-widest text-lg"
              />
              {remainingTime && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  OTP expires in {remainingTime}
                </p>
              )}
            </div>

            {error && (
              <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                type="button"
                className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-700"
                disabled={loading}
                onClick={() => setOtpSent(false)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="w-2/3 bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-800"
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-indigo-100 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Having trouble logging in?
          </p>
          <Button
            variant="outline"
            onClick={clearAllData}
            className="text-sm text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 size={14} className="mr-1" />
            Clear Browser Data
          </Button>
        </div>
      </div>
    </main>
  );
}
