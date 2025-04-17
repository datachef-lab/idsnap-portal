import { ReactNode } from "react";
import StudentIdClientLayout from "./client-layout";

export default function StudentIdLayout({ children }: { children: ReactNode }) {
  return <StudentIdClientLayout>{children}</StudentIdClientLayout>;
}
