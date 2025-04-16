"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Search, Check, X, ExternalLink } from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  uid: string;
  abcId: string;
  verifiedAt: Date | null;
  approvedAt: boolean;
}

interface StudentListProps {
  students: Student[];
  loading: boolean;
  onApprove: (studentId: number) => Promise<void>;
  onViewStudent?: (uid: string) => void;
}

export function StudentList({
  students,
  loading,
  onApprove,
  onViewStudent,
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "approved">("all");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (studentId: number) => {
    setProcessingId(studentId);
    try {
      await onApprove(studentId);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    // Apply search filter
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.abcId.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply status filter
    let matchesFilter = true;
    if (filter === "verified") {
      matchesFilter = !!student.verifiedAt && !student.approvedAt;
    } else if (filter === "approved") {
      matchesFilter = !!student.approvedAt;
    }

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="h-12 bg-gray-100 animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search students..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "verified" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("verified")}
          >
            Verified
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("approved")}
          >
            Approved
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ABC ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.uid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.abcId || "Not set"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.approvedAt ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Approved
                      </span>
                    ) : student.verifiedAt ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {student.verifiedAt && !student.approvedAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(student.id)}
                        disabled={processingId === student.id}
                        className="mr-2"
                      >
                        {processingId === student.id ? (
                          "Processing..."
                        ) : (
                          <>
                            Approve
                            <Check size={16} className="ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                    {student.verifiedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                        onClick={() =>
                          onViewStudent && onViewStudent(student.uid)
                        }
                      >
                        <ExternalLink size={16} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
