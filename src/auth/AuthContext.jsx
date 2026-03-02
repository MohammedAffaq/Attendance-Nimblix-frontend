import { createContext, useEffect, useState } from "react";
import api from "../api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Check local storage for existing session
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (token) {
      setIsAuthenticated(true);
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });

      const { token, role: userRole } = res.data;

      // Token is required; role is optional until backend adds it
      if (!token) {
        throw new Error("Invalid response from server: missing token");
      }

      localStorage.setItem("token", token);
      // Store role if present; if backend hasn't added it yet, store empty string
      localStorage.setItem("role", userRole || "");

      setIsAuthenticated(true);
      setRole(userRole || null);

      return { success: true, role: userRole || null };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setRole(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
