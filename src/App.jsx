import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./components/Login";
import Layout from "./components/Layout";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import CheckIn from "./pages/employee/CheckIn";
import Report from "./pages/employee/Report";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees";
import AttendanceReport from "./pages/admin/AttendanceReport";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<Layout />}>

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/checkin"
              element={
                <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                  <CheckIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/report"
              element={
                <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                  <Report />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AttendanceReport />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
