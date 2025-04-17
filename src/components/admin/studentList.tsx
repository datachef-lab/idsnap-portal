"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import {
  Search,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import Image from "next/image";
import { ExportButton } from "./exportButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

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
  initialStudents?: Student[];
  initialLoading?: boolean;
  onApprove: (studentId: number, abcId?: string) => Promise<void>;
  onRefreshStats?: () => Promise<void>;
}

// Toast notification component
const Toast = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded shadow-md flex items-center space-x-2 z-50">
      <Check size={16} className="text-green-600" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-green-600 hover:text-green-800"
      >
        ×
      </button>
    </div>
  );
};

export function StudentList({
  initialStudents = [],
  initialLoading = false,
  onApprove,
  onRefreshStats,
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "all" | "verified" | "checked_in" | "done"
  >("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [abcIdValues, setAbcIdValues] = useState<Record<number, string>>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // Students data state
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [loading, setLoading] = useState(initialLoading);

  // Define fetchStudents as useCallback to avoid re-creation on each render
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (filter !== "all") {
        params.append("filter", filter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      // Fetch students from API
      const response = await fetch(`/api/students?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStudents(data.data.students);
          setPagination(data.data.pagination);
        } else {
          console.error("Error fetching students:", data.message);
        }
      } else {
        console.error("Error fetching students:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchTerm, limit]);

  // Fetch students when filter or pagination changes
  useEffect(() => {
    fetchStudents();
  }, [filter, page, fetchStudents]);

  // Handle search term changes with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      // Reset to page 1 when search term changes
      setPage(1);
      // Don't call fetchStudents here, the page change will trigger it
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]); // Remove page and fetchStudents from dependencies

  // Initialize ABC ID values for each student
  useEffect(() => {
    const initialValues: Record<number, string> = {};
    students.forEach((student) => {
      initialValues[student.id] = student.abcId || "";
    });
    setAbcIdValues(initialValues);
  }, [students]);

  const handleAbcIdChange = (studentId: number, value: string) => {
    setAbcIdValues((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  // Function to save ABC ID and approve
  const handleSaveAbcId = async (studentId: number) => {
    setProcessingId(studentId);
    try {
      // Get the ABC ID value for this student
      const abcId = abcIdValues[studentId];

      // Call API to update ABC ID and approve at the same time
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          abcId,
          approve: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the local state
        setStudents(
          students.map((s) =>
            s.id === studentId ? { ...s, abcId, approvedAt: true } : s
          )
        );

        // Show success toast
        setToastMessage(
          data.message || "ABC ID saved and approved successfully"
        );

        // Call onApprove to update parent component stats
        await onApprove(studentId, abcId);

        // Refresh the data
        fetchStudents();

        // Refresh stats in parent component if function exists
        if (onRefreshStats) {
          await onRefreshStats();
        }
      }
    } catch (error) {
      console.error("Error saving ABC ID:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const openImageModal = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!pagination || newPage <= pagination.totalPages)) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (
    newFilter: "all" | "verified" | "checked_in" | "done"
  ) => {
    if (filter !== newFilter) {
      setFilter(newFilter);
      setPage(1); // Reset to page 1 when filter changes
    }
  };

  if (loading && students.length === 0) {
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
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Image Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          {selectedStudent && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-xl">
                  {selectedStudent.name} ({selectedStudent.uid})
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 pt-2 h-[calc(90vh-80px)] flex items-center justify-center">
                <div className="w-full h-full flex justify-center">
                  <div className="rounded-md overflow-hidden shadow-lg h-full max-w-full">
                    <Image
                      src={`/api/students/verification-image/${selectedStudent.uid}`}
                      alt={`Verification image for ${selectedStudent.name}`}
                      width={2000}
                      height={2000}
                      className="object-contain h-full max-w-full"
                      unoptimized
                      onError={() => {
                        console.error("Image failed to load");
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "verified" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("verified")}
            >
              Verified
            </Button>
            <Button
              variant={filter === "checked_in" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("checked_in")}
            >
              Checked In
            </Button>
            <Button
              variant={filter === "done" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("done")}
            >
              Done
            </Button>
            <ExportButton />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ABC ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {loading ? "Loading students..." : "No students found"}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
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
                      {student.uid.includes("ST")
                        ? student.uid.substring(2)
                        : student.uid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.verifiedAt ? (
                        <div
                          className="h-16 w-16 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openImageModal(student)}
                        >
                          <div className="h-full w-full relative border rounded overflow-hidden">
                            <Image
                              src={`/api/students/verification-image/${student.uid}`}
                              alt={`Verification for ${student.name}`}
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.png";
                              }}
                            />
                            <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs p-0.5">
                              <ExternalLink size={12} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex mx-auto px-2 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={abcIdValues[student.id] || ""}
                        onChange={(e) =>
                          handleAbcIdChange(student.id, e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm w-full max-w-[140px] mx-auto block"
                        placeholder="Enter ABC ID"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {student.approvedAt ? (
                        <span className="inline-flex px-2 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Done
                        </span>
                      ) : student.verifiedAt ? (
                        <span className="inline-flex px-2 text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex px-2 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        {!student.approvedAt && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveAbcId(student.id)}
                            disabled={
                              processingId === student.id ||
                              !abcIdValues[student.id]
                            }
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            {processingId === student.id ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <div className="flex items-center">
                                <Save size={16} className="mr-1" />
                                Save
                              </div>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
              >
                <ChevronLeft size={16} />
                <span className="ml-1">Previous</span>
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 3 }, (_, i) => {
                  const pageNumber = page - 1 + i;
                  return pageNumber > 0 &&
                    pageNumber <= pagination.totalPages ? (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  ) : null;
                })}
                {pagination.totalPages > 3 &&
                  page < pagination.totalPages - 1 && (
                    <>
                      <span className="px-1">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasMore || loading}
              >
                <span className="mr-1">Next</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
