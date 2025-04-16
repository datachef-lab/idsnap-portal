"use client";

import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Mail, ArrowRight } from "lucide-react";

interface LoginFormProps {
  onSubmit: (email: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(email);
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();

    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    setVerifyingOtp(true);
    setError(null);

    try {
      // In a real app, this would be an API call to verify the OTP
      // For demo purposes, we'll simulate success
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Call the parent submit function again to trigger the redirect
      await onSubmit(email);
    } catch (err) {
      setError("Invalid OTP. Please try again.");
      console.error(err);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {otpSent ? "Enter OTP" : "Login to IDSnap Portal"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!otpSent ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your.email@example.com"
                  required
                />
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-500 rounded text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending OTP..." : "Get OTP"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Enter OTP sent to {email}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your OTP"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                OTP is valid for 2 minutes. Didn't receive?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }}
                >
                  Resend
                </button>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-500 rounded text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={verifyingOtp} className="w-full">
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
              {!verifyingOtp && <ArrowRight size={16} />}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          {otpSent
            ? "Check your email for the OTP"
            : "You'll receive a one-time password on your email"}
        </p>
      </CardFooter>
    </Card>
  );
}
