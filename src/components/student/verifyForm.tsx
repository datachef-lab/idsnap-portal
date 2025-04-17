"use client";

import { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Upload, Camera, Check, X, CheckCircle, Edit } from "lucide-react";
import { Student } from "@/lib/db/schema";
import Image from "next/image";

interface VerifyFormProps {
  student: Student | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function VerifyForm({ student, onSubmit }: VerifyFormProps) {
  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ABC ID management
  const [abcId, setAbcId] = useState<string>(student?.abcId || "");
  const [originalAbcId, setOriginalAbcId] = useState<string>(
    student?.abcId || ""
  );
  const [isEditingAbcId, setIsEditingAbcId] = useState<boolean>(false);

  // File upload management
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abcIdInputRef = useRef<HTMLInputElement>(null);

  // Check if already verified
  const isVerified =
    student?.verifiedAt !== null && student?.verifiedAt !== undefined;

  // Update ABC ID field when student data changes from parent
  useEffect(() => {
    if (student?.abcId) {
      setAbcId(student.abcId);
      setOriginalAbcId(student.abcId);
    }
  }, [student]);

  // Focus the ABC ID input field when editing mode is enabled
  useEffect(() => {
    if (isEditingAbcId && abcIdInputRef.current) {
      // Set a small timeout to ensure the input is rendered
      setTimeout(() => {
        abcIdInputRef.current?.focus();
      }, 50);
    }
  }, [isEditingAbcId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (
        !["image/jpeg", "image/png", "image/jpg"].includes(selectedFile.type)
      ) {
        setError("Only JPEG, JPG and PNG files are allowed");
        return;
      }

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setFile(selectedFile);
      setError(null);

      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  // Function to trigger file input click
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("abcId", abcId);

      // Add file metadata to help server-side processing
      formData.append("fileName", file.name);
      formData.append("fileType", file.type);

      await onSubmit(formData);
      setSuccess(true);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAbcId = (isCorrect: boolean) => {
    if (isCorrect) {
      // If ABC ID is correct, move to the upload step
      setStep(2);
    } else {
      // If ABC ID is incorrect, enable editing
      // Save current value as original before editing
      setOriginalAbcId(abcId);
      setIsEditingAbcId(true);
    }
  };

  const handleContinueAfterEdit = () => {
    setIsEditingAbcId(false);
    setStep(2);
  };

  // Handle logout and redirect to root page
  const handleOkay = async () => {
    try {
      // Call the logout API to clear server-side cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Clear localStorage
      localStorage.clear();

      // Redirect to root page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to direct navigation if API call fails
      window.location.href = "/";
    }
  };

  // Show acknowledgment if either submission successful or already verified
  if (success || isVerified) {
    // Generate image URL for verified students
    const verificationImageUrl =
      isVerified && student?.uid
        ? `/api/students/verification-image/${student.uid}`
        : null;

    return (
      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="flex items-center justify-center gap-2 text-indigo-700">
            <Check className="text-green-500" />
            Verification Submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-50 to-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle className="text-green-500 w-10 h-10" />
            </div>

            <h3 className="text-2xl font-semibold mb-3 text-indigo-800">
              Thank You!
            </h3>

            <p className="text-gray-600 mb-4">
              Your ABC ID{" "}
              <span className="font-medium text-indigo-600">{abcId}</span> has
              been submitted successfully.
            </p>

            {/* Show the preview if available (just uploaded) */}
            {previewUrl && (
              <div className="mt-5 border border-indigo-100 rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm">
                <p className="text-sm font-medium text-indigo-700 mb-3">
                  Your uploaded verification image:
                </p>
                <div className="bg-white p-2 rounded shadow-sm">
                  <Image
                    src={previewUrl}
                    alt="Verification"
                    width={192}
                    height={192}
                    className="max-h-48 mx-auto rounded"
                  />
                </div>
              </div>
            )}

            {/* Show the stored verification image if already verified */}
            {!previewUrl && verificationImageUrl && (
              <div className="mt-5 border border-indigo-100 rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm">
                <p className="text-sm font-medium text-indigo-700 mb-3">
                  Your verification image:
                </p>
                <div className="bg-white p-2 rounded shadow-sm">
                  <Image
                    src={verificationImageUrl}
                    alt="Verification"
                    width={192}
                    height={192}
                    className="max-h-48 mx-auto rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pb-6">
          <Button
            onClick={handleOkay}
            className="w-full text-white font-medium bg-indigo-600 hover:bg-indigo-700"
          >
            Okay
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Multi-step form implementation
  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-4 border-b border-indigo-50">
        <CardTitle className="text-center text-indigo-700">
          {step === 1
            ? "Confirm Your ABC ID"
            : step === 2
            ? "Upload Verification Image"
            : "Submit Verification"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <>
          {/* Step 1: Confirm ABC ID */}
          {step === 1 && (
            <div>
              <div className="p-5 border border-indigo-100 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 mb-6 shadow-sm">
                {/* <p className="font-medium text-lg mb-2 text-indigo-700">
                  Your ABC ID
                </p> */}
                {isEditingAbcId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-700 mb-2">
                        Your earlier Appar Id (ABC Id) was:
                      </p>
                      <p className="font-mono font-medium text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {originalAbcId || "Not provided"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-gray-700 mb-2">
                        Enter correct Apaar Id(ABC ID):
                      </p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={abcId}
                          onChange={(e) => setAbcId(e.target.value)}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter your ABC ID"
                          autoFocus
                          ref={abcIdInputRef}
                          required
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleContinueAfterEdit}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-semibold text-indigo-600 bg-white px-3 py-2 rounded shadow-sm inline-block">
                    {abcId || "Not provided"}
                  </p>
                )}
              </div>

              {!isEditingAbcId && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center mb-2">
                    Is this ABC ID correct?
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => handleConfirmAbcId(true)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Yes, it&apos;s correct
                      <Check size={16} className="ml-2" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleConfirmAbcId(false)}
                      className="flex-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      No, edit it
                      <Edit size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <div>
              <div className="p-5 border border-indigo-100 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 mb-6 shadow-sm">
                <p className="font-medium text-indigo-700 mb-1">Your ABC ID</p>
                <p className="text-xl font-semibold text-indigo-600 bg-white px-3 py-2 rounded shadow-sm inline-block">
                  {abcId}
                </p>
              </div>

              <div className="mb-6">
                <p className="font-medium text-indigo-700 mb-3 text-center">
                  Upload ID Screenshot
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* File upload container */}
                <div
                  onClick={handleSelectFile}
                  className={`border-2 border-dashed rounded-lg p-5 text-center ${
                    previewUrl
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50"
                  } cursor-pointer transition-all duration-200 shadow-sm`}
                >
                  {previewUrl ? (
                    <div className="relative">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={192}
                        height={192}
                        className="max-h-48 mx-auto rounded shadow-sm"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Camera
                        className="mx-auto mb-3 text-indigo-400"
                        size={48}
                      />
                      <p className="text-sm text-indigo-600 mb-2 font-medium">
                        Click or drag file to upload
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, JPEG or PNG (max. 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm border border-red-100 shadow-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </>
      </CardContent>
      <CardFooter className="flex justify-between py-5 pt-2">
        {step === 2 && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 mr-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !file}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? "Submitting..." : "Submit Verification"}
              {!loading && <Upload size={16} className="ml-2" />}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
