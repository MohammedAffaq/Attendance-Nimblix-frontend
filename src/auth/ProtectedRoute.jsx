import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // Simple loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard if role doesn't match
    if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (role === "EMPLOYEE") return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
