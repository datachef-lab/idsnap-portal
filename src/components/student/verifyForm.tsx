"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Upload, Camera, Check, X } from "lucide-react";

interface VerifyFormProps {
  student: {
    id: number;
    name: string;
    email: string;
    uid: string;
    abcId: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
}

export function VerifyForm({ student, onSubmit }: VerifyFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [abcId, setAbcId] = useState<string>(student.abcId || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      await onSubmit(formData);
      setSuccess(true);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="text-green-500" />
            Verification Submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            Your ABC ID verification has been submitted successfully. You will
            receive an email once it is approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your ABC ID</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Your ABC ID
            </label>
            <input
              type="text"
              value={abcId}
              onChange={(e) => setAbcId(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your ABC ID"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Upload ID Screenshot
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center ${
                previewUrl ? "border-primary" : "border-gray-300"
              }`}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <Camera className="mx-auto mb-2 text-gray-400" size={48} />
                  <p className="text-sm text-gray-500 mb-2">
                    Click or drag file to upload
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, JPEG or PNG (max. 5MB)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-500 rounded text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !file} className="w-full">
            {loading ? "Uploading..." : "Submit for Verification"}
            {!loading && <Upload size={16} />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
