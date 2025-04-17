"use client"; // Ensures this runs only on the client side

import React, {
  useState,
  useCallback,
  useEffect,
  ReactNode,
  createContext,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { User, Student } from "@/lib/db/schema";

const axiosInstance = axios.create({
  baseURL: "", // Use relative URLs
  withCredentials: true, // ✅ Ensures cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});

export interface AuthContextType {
  user: User | Student | null;
  login: (accessToken: string, userData: Student) => void;
  logout: () => void;
  accessToken: string | null;
  displayFlag: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [displayFlag, setDisplayFlag] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Get the current route

  // Check if the current path is a dynamic student ID route (path is a number)
  const isStudentRoute = /^\/\d+/.test(pathname);

  const isProtectedRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/settings") ||
    isStudentRoute;

  const login = (accessToken: string, userData: Student) => {
    setAccessToken(accessToken);
    setUser(userData);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const logout = useCallback(async () => {
    if (
      pathname.startsWith("/home") ||
      pathname.startsWith("/settings") ||
      isStudentRoute
    ) {
      try {
        await axiosInstance.post("/api/auth/logout");
        setAccessToken(null);
        setUser(null);
      } catch (error) {
        console.error("Error during logout:", error);
        setAccessToken(null);
        setUser(null);
      } finally {
        router.push("/");
      }
    }
  }, [router, pathname, isStudentRoute]);

  const generateNewToken = useCallback(async (): Promise<string | null> => {
    if (!isProtectedRoute) return null; // ✅ Skip request if not on protected route

    try {
      const response = await axiosInstance.get<{
        accessToken: string;
        user: Student;
      }>("/api/auth/refresh", { withCredentials: true });

      console.log("Token refresh response:", response.data);
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      return response.data.accessToken;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Don't call logout directly here, set a flag for invalid token instead
      // to prevent infinite loop
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
      return null;
    }
  }, [isProtectedRoute]); // Removed logout from dependencies to break the cycle

  useEffect(() => {
    if (!isProtectedRoute) {
      setIsLoading(false);
      return;
    } // ✅ Skip request if not on protected route

    let isMounted = true;

    const checkSession = async () => {
      try {
        console.log("Checking existing session with API...");
        const response = await axiosInstance.get<{
          accessToken: string;
          user: Student;
        }>("/api/auth/me", { withCredentials: true });

        if (isMounted) {
          console.log("Session check response:", response.data);
          setAccessToken(response.data.accessToken);

          if (response.data.user) {
            setUser({ ...response.data.user });
          }
        }
      } catch (error) {
        console.log(
          "No existing session found, will try to refresh token,",
          error
        );
        // Only attempt token refresh once
        if (accessToken === null && isMounted) {
          try {
            await generateNewToken();
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [generateNewToken, isProtectedRoute, accessToken]);

  useEffect(() => {
    if (!isProtectedRoute) return; // ✅ Skip request if not on protected route

    // Set a maximum number of refresh attempts
    const MAX_REFRESH_ATTEMPTS = 1;
    let refreshAttempts = 0;

    const attemptTokenRefresh = async () => {
      if (
        accessToken === null &&
        !isLoading &&
        refreshAttempts < MAX_REFRESH_ATTEMPTS
      ) {
        console.log(
          `Generating accessToken (attempt ${refreshAttempts + 1})...`
        );
        refreshAttempts++;
        try {
          await generateNewToken();
        } catch (error) {
          console.error("Failed to generate token:", error);
        }
      }
    };

    attemptTokenRefresh();

    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshAttempts < MAX_REFRESH_ATTEMPTS
        ) {
          originalRequest._retry = true;
          refreshAttempts++;

          try {
            const newAccessToken = await generateNewToken();
            if (newAccessToken) {
              originalRequest.headers[
                "Authorization"
              ] = `Bearer ${newAccessToken}`;
              return axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            // If refresh fails, redirect to login or show error
            if (isProtectedRoute) {
              router.push("/");
            }
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, generateNewToken, isLoading, isProtectedRoute, router]);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    accessToken,
    displayFlag,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
