"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Shield, Calendar } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"otp" | "dob">("otp");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
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
        body: JSON.stringify({ username }),
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
        body: JSON.stringify({ username, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify OTP");
      }

      // Handle successful verification
      if (data.data) {
        const { accessToken, refreshToken, uid, userType, redirectUrl } =
          data.data;

        console.log("OTP verification successful - Received data:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          uid,
          userType,
          redirectUrl,
        });

        // Store tokens and user info in localStorage for client-side access
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("uid", uid || "");
        localStorage.setItem("userType", userType);

        // Set cookies for middleware
        document.cookie = `refreshToken=${refreshToken}; path=/;`;
        document.cookie = `uid=${uid}; path=/;`;
        document.cookie = `userType=${userType}; path=/;`;

        console.log("OTP verification successful");
        console.log("Redirecting to", redirectUrl);

        // Navigate to the redirect URL provided by the API
        router.push(redirectUrl);
      }
    } catch (error) {
      setError((error as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle DOB-based login
  const handleDobLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: username,
          dob: dob,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens in localStorage for client-side usage
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("uid", data.data.uid);
        localStorage.setItem("userType", data.data.userType);

        console.log("Login successful, redirecting to:", data.data.redirectUrl);
        // Redirect to the appropriate page
        router.push(data.data.redirectUrl);
      } else {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
      setLoading(false);
    }
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
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-indigo-400 via-violet-500 to-purple-600">
      {/* Header at top */}
      <div className="w-full text-center py-8">
        <h2 className="text-lg font-medium text-white/90">
          The Bhawanipur Education Society College
        </h2>
      </div>

      {/* Form in center */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
        <div className="w-full text-center py-8">
          <h1 className="text-2xl font-bold mt-2 mb-2 text-white">
            Portal for APAAR ID (ABC ID) confirmation portal
          </h1>
          <p className="text-white/90 text-lg">ABC ID Verification System</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-auto">
          {/* Login method toggle tabs */}
          <div className="flex border-b">
            <button
              onClick={() => {
                setLoginMethod("otp");
                setOtpSent(false);
                setError("");
              }}
              className={`flex-1 py-3 font-medium text-sm ${
                loginMethod === "otp"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
            >
              Login with OTP
            </button>
            <button
              onClick={() => {
                setLoginMethod("dob");
                setOtpSent(false);
                setError("");
              }}
              className={`flex-1 py-3 font-medium text-sm ${
                loginMethod === "dob"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
            >
              Login with DOB
            </button>
          </div>

          {/* Form container with fixed height to prevent layout shifting */}
          <div className="min-h-[400px] flex flex-col">
            {/* OTP Login Method */}
            {loginMethod === "otp" && !otpSent && (
              <div className="p-6 flex-1 flex flex-col h-full">
                <div className="flex justify-center mb-5">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Login with OTP
                </h3>
                <p className="text-center text-gray-600 text-sm mb-6">
                  Verify your UID to continue with ABC ID verification
                </p>

                <form
                  onSubmit={handleSendOtp}
                  className="space-y-4 flex flex-col flex-1"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Enter your 10-digit UID
                    </label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your UID"
                      required
                      className="w-full"
                    />
                  </div>

                  {error && (
                    <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* OTP Verification */}
            {loginMethod === "otp" && otpSent && (
              <div className="p-6 flex-1 flex flex-col h-full">
                <div className="flex justify-center mb-5">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <Shield className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Verify Your Account
                </h3>
                <p className="text-center text-gray-600 text-sm mb-6">
                  Enter the OTP sent to your username address
                </p>

                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-4 flex flex-col flex-1"
                >
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
                        OTP expires in {remainingTime} (valid for 2 minutes)
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="text-center text-sm text-gray-500 mb-2">
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>

                  <div className="flex space-x-2 mt-auto">
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
                      className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* DOB Login Method */}
            {loginMethod === "dob" && (
              <div className="p-6 flex-1 flex flex-col h-full">
                <div className="flex justify-center mb-5">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Login with DOB
                </h3>
                <p className="text-center text-gray-600 text-sm mb-6">
                  Enter your UID and Date of Birth to continue
                </p>

                <form
                  onSubmit={handleDobLogin}
                  className="space-y-4 flex flex-col flex-1"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Enter your UID
                    </label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your UID"
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                      className="w-full"
                      placeholder="DD-MM-YYYY"
                    />
                  </div>

                  {error && (
                    <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-6">
        <p className="text-white text-sm">
          © {new Date().getFullYear()} The Bhawanipur Education Society College.
          All rights reserved.
        </p>
      </footer>
    </main>
  );
}
