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
    <header className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <nav className="hidden md:flex space-x-4 ml-8">
          <Link
            href="/home"
            className={`text-white hover:text-white/80 transition-colors flex items-center ${
              pathname === "/home" ? "font-semibold" : ""
            }`}
          >
            <Home size={16} className="mr-1" />
            Dashboard
          </Link>
          <Link
            href="/home/upload"
            className={`text-white hover:text-white/80 transition-colors flex items-center ${
              pathname === "/home/upload" ? "font-semibold" : ""
            }`}
          >
            <Upload size={16} className="mr-1" />
            Upload Students
          </Link>
        </nav>
      </div>
      <div className="flex space-x-2 items-center">
        {pathname !== "/home/upload" && (
          <Link href="/home/upload">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Upload size={16} className="mr-1" />
              Upload
            </Button>
          </Link>
        )}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-white/20 text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} className="mr-1" />
          Logout
        </Button>
        <Link
          href="/logout"
          className="text-white hover:text-white/80 ml-2 text-sm"
        >
          Force Logout
        </Link>
      </div>
    </header>
  );
}
