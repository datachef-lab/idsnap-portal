import { AuthProvider } from "@/providers/auth-provider";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
