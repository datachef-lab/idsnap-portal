"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { LogOut, Upload, Home } from "lucide-react";
import Cookies from "js-cookie";

interface HeaderProps {
  title: string;
  onLogout?: () => void;
}

export function Header({ title, onLogout }: HeaderProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    // If an external logout handler is provided, call it
    if (onLogout) {
      onLogout();
      return;
    }

    // Otherwise perform default logout
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("uid");
    localStorage.removeItem("userType");

    // Clear cookies
    Cookies.remove("refreshToken");
    Cookies.remove("uid");
    Cookies.remove("userType");

    // Force redirect to root
    window.location.href = "/";
  };

  return (
    <header className="w-full bg-white shadow-md border-b border-gray-200 text-gray-800 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-indigo-700">{title}</h1>
        <nav className="hidden md:flex space-x-4 ml-8">
          <Link
            href="/home"
            className={`text-gray-600 hover:text-indigo-600 transition-colors flex items-center ${
              pathname === "/home" ? "font-semibold text-indigo-600" : ""
            }`}
          >
            <Home size={16} className="mr-1" />
            Dashboard
          </Link>
          <Link
            href="/home/upload"
            className={`text-gray-600 hover:text-indigo-600 transition-colors flex items-center ${
              pathname === "/home/upload" ? "font-semibold text-indigo-600" : ""
            }`}
          >
            <Upload size={16} className="mr-1" />
            Upload Students
          </Link>
        </nav>
      </div>
      <div className="flex space-x-2 items-center">
       
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={16} className="mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
}
