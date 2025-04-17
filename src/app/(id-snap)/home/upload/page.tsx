"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Upload,
  File,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  // Check authentication and redirect if not logged in
  useEffect(() => {
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

    // Create form data to send to the API
    const formData = new FormData();
    formData.append("file", file);

    // Add file metadata to help server-side processing
    formData.append("fileName", file.name);
    formData.append("fileType", file.type);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    try {
      // Call the API to upload and process the file
      const response = await fetch("/api/students/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload students");
      }

      // Set progress to 100% when complete
      setProgress(100);

      // Set results from the API response
      setResults({
        total: data.data.total,
        successful: data.data.successful,
        failed: data.data.failed,
        errors: data.data.errors,
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

  const handleResetStudentData = async () => {
    setResetting(true);
    setResetResult(null);

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset student data");
      }

      setResetResult({
        status: "success",
        message: data.message || "Student data has been reset successfully",
      });
    } catch (error) {
      console.error("Error resetting student data:", error);
      setResetResult({
        status: "error",
        message: (error as Error).message || "Failed to reset student data",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleNavigateToHome = () => {
    router.push("/home");
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

      // Clear cookies
      Cookies.remove("refreshToken");
      Cookies.remove("uid");
      Cookies.remove("userType");

      // Redirect to logout page
      window.location.href = "/logout";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback
      window.location.href = "/logout";
    }
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
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(true)}
              className="bg-white/70 text-red-700 hover:bg-red-50 hover:text-red-800 border-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Reset Student Data
            </Button>
            <Button
              variant="outline"
              onClick={handleNavigateToHome}
              className="bg-white/70 text-indigo-700 hover:bg-white hover:text-indigo-800 border-indigo-300"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-md">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="text-indigo-700">
              Upload Student Excel File
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
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
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
                      <p className="text-sm text-indigo-500 mb-3">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <label
                        htmlFor="file-upload-change"
                        className="cursor-pointer"
                      >
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs hover:bg-indigo-200 transition-colors">
                          Change File
                        </span>
                        <input
                          id="file-upload-change"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
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
                        Upload Excel file with student data
                      </p>
                      <label
                        htmlFor="file-upload"
                        className="mt-4 inline-block cursor-pointer"
                      >
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 transition-colors">
                          Select Excel File
                        </span>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
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
            Excel Format Requirements
          </h3>
          <p className="mb-3 text-indigo-600">
            The Excel file should include the following columns:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="space-y-1">
              <h4 className="font-medium text-indigo-800 mt-2">
                Required Fields:
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-indigo-700">
                <li>
                  Name{" "}
                  <span className="text-xs text-indigo-500">
                    (Full name of the student)
                  </span>
                </li>
                <li>
                  UID{" "}
                  <span className="text-xs text-indigo-500">
                    (Unique ID, must be unique, format: ST12345)
                  </span>
                </li>
                <li>
                  Email{" "}
                  <span className="text-xs text-indigo-500">
                    (Valid email address)
                  </span>
                </li>
                <li>
                  Phone{" "}
                  <span className="text-xs text-indigo-500">
                    (10-digit number)
                  </span>
                </li>
                <li>
                  Semester{" "}
                  <span className="text-xs text-indigo-500">
                    (Current semester number)
                  </span>
                </li>
                <li>
                  Course{" "}
                  <span className="text-xs text-indigo-500">
                    (Full course name, e.g., &ldquo;B.Tech Computer
                    Science&rdquo;)
                  </span>
                </li>
                <li>
                  Shift{" "}
                  <span className="text-xs text-indigo-500">
                    (Only: DAY, MORNING, AFTERNOON, EVENING)
                  </span>
                </li>
                <li>
                  Section{" "}
                  <span className="text-xs text-indigo-500">
                    (Class section, e.g., &ldquo;A&rdquo;, &ldquo;B&rdquo;)
                  </span>
                </li>
                <li>
                  ABC Id{" "}
                  <span className="text-xs text-indigo-500">
                    (Academic Bank of Credits ID)
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-indigo-800 mt-2">
                Optional Fields:
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-indigo-700">
                <li>
                  Reg. No.{" "}
                  <span className="text-xs text-indigo-500">
                    (Registration number if available)
                  </span>
                </li>
                <li>
                  Roll No.{" "}
                  <span className="text-xs text-indigo-500">
                    (Roll number if available)
                  </span>
                </li>
              </ul>

              <h4 className="font-medium text-indigo-800 mt-4">
                Download Template:
              </h4>
              <p className="text-indigo-600 mt-1">
                Download our pre-formatted Excel template with sample data to
                ensure your data follows the correct format.
              </p>
              <a
                href="/templates/student-upload-template.xlsx"
                download
                className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors duration-200"
              >
                Download Template
              </a>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
            <h4 className="font-medium text-yellow-700">Important Notes:</h4>
            <ul className="list-disc pl-5 mt-1 text-sm text-yellow-700">
              <li>
                The first row must contain the column headers exactly as
                specified above.
              </li>
              <li>UID must be unique for each student.</li>
              <li>All required fields must be filled for each row.</li>
              <li>
                Shift values must be one of: DAY, MORNING, AFTERNOON, EVENING
                (case insensitive).
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog for Reset */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Reset Student Data
            </DialogTitle>
            <DialogDescription className="pt-4">
              {resetResult ? (
                <div
                  className={`p-4 rounded-lg ${
                    resetResult.status === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {resetResult.status === "success" ? (
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 mr-2" size={20} />
                      <span>{resetResult.message}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="text-red-500 mr-2" size={20} />
                      <span>{resetResult.message}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-red-500 font-medium">
                    Warning: This action cannot be undone!
                  </p>
                  <p className="mt-2">
                    This will permanently delete all student records and
                    verification images from the database.
                  </p>
                  <p className="mt-2">
                    Are you sure you want to reset all student data?
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {!resetResult && (
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetStudentData}
                disabled={resetting}
                className="bg-red-600 hover:bg-red-700"
              >
                {resetting ? "Resetting..." : "Yes, Reset All Data"}
              </Button>
            </DialogFooter>
          )}
          {resetResult && (
            <DialogFooter>
              <Button
                onClick={() => {
                  setResetDialogOpen(false);
                  setResetResult(null);
                  if (resetResult.status === "success") {
                    // Refresh the page if reset was successful
                    window.location.reload();
                  }
                }}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
