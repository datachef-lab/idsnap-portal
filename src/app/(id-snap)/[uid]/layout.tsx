import { ReactNode } from "react";
import StudentIdClientLayout from "./client-layout";
import { AuthProvider } from "@/providers/auth-provider";

export default function StudentIdLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StudentIdClientLayout>{children}</StudentIdClientLayout>;
    </AuthProvider>
  );
}
