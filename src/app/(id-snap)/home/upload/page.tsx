"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, File, CheckCircle, XCircle } from "lucide-react";
import Cookies from "js-cookie";

export default function UploadStudentDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
  });

  // Check authentication and redirect if not logged in
  useEffect(() => {
    const token = Cookies.get("refreshToken");

    // Redirect if not logged in
    if (!token) {
      router.push("/");
      return;
    }

    setLoading(false);
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus("uploading");
    setProgress(0);

    // Simulate file upload with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Simulate API call for file processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Simulate successful upload
      setResults({
        total: 50,
        successful: 45,
        failed: 5,
        errors: [
          "Row 12: Invalid email format",
          "Row 18: Missing required field 'ABC ID'",
          "Row 23: Duplicate student UID",
          "Row 37: Invalid semester value",
          "Row 42: Missing required field 'Phone'",
        ],
      });
      setUploadStatus("success");
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("error");
    } finally {
      clearInterval(interval);
      setProgress(100);
    }
  };

  const handleNavigateToHome = () => {
    router.push("/home");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("uid");
    Cookies.remove("refreshToken");
    Cookies.remove("uid");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
        <Header title="Upload Student Data" onLogout={handleLogout} />
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
      <Header title="Upload Student Data" onLogout={handleLogout} />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-indigo-700">
            Bulk Upload Students
          </h1>
          <Button
            variant="outline"
            onClick={handleNavigateToHome}
            className="bg-white/70 text-indigo-700 hover:bg-white hover:text-indigo-800 border-indigo-300"
          >
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-md">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="text-indigo-700">
              Upload Student CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {uploadStatus === "success" || uploadStatus === "error" ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    uploadStatus === "success" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {uploadStatus === "success" ? (
                      <CheckCircle className="text-green-500 mr-2" size={24} />
                    ) : (
                      <XCircle className="text-red-500 mr-2" size={24} />
                    )}
                    <h3 className="text-lg font-medium">
                      {uploadStatus === "success"
                        ? "Upload Successful"
                        : "Upload Failed"}
                    </h3>
                  </div>

                  {uploadStatus === "success" && (
                    <div className="ml-8">
                      <p>Total records: {results.total}</p>
                      <p>Successfully processed: {results.successful}</p>
                      <p>Failed records: {results.failed}</p>

                      {results.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Errors:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {results.errors.map((error, index) => (
                              <li key={index} className="text-red-600">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setFile(null);
                    setUploadStatus("idle");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Upload Another File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    file ? "border-indigo-400" : "border-indigo-200"
                  }`}
                >
                  {file ? (
                    <div>
                      <File
                        className="mx-auto mb-2 text-indigo-500"
                        size={32}
                      />
                      <p className="font-medium text-lg mb-1 text-indigo-700">
                        {file.name}
                      </p>
                      <p className="text-sm text-indigo-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload
                        className="mx-auto mb-2 text-indigo-400"
                        size={32}
                      />
                      <p className="text-sm text-indigo-600 mb-2">
                        Click or drag file to upload
                      </p>
                      <p className="text-xs text-indigo-400">
                        Upload CSV file with student data
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {uploadStatus === "uploading" && (
                  <div className="space-y-2">
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-center text-indigo-600">
                      {progress}% Uploaded
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!file || uploadStatus === "uploading"}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {uploadStatus === "uploading"
                    ? "Uploading..."
                    : "Upload Students"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-indigo-50/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-indigo-100">
          <h3 className="text-xl font-medium mb-3 text-indigo-700">
            CSV Format Requirements
          </h3>
          <p className="mb-3 text-indigo-600">
            The CSV file should include the following columns:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-indigo-700">
            <li>Name (required)</li>
            <li>Email (required)</li>
            <li>Phone (required)</li>
            <li>UID (required, must be unique)</li>
            <li>ABC ID (required)</li>
            <li>Semester (required)</li>
            <li>Course (required)</li>
            <li>Section (required)</li>
            <li>Registration Number (optional)</li>
            <li>Roll Number (optional)</li>
          </ul>
          <p className="mt-3 text-sm">
            <a
              href="#"
              className="text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Download a sample template
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
