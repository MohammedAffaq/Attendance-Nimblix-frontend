import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
    const { role } = useContext(AuthContext);

    const linkClass = ({ isActive }) =>
        "sidebar-link" + (isActive ? " active" : "");

    return (
        <>
            {/* Backdrop overlay for mobile/tablet */}
            <div
                className={`sidebar-overlay${isOpen ? " open" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside className={`sidebar${isOpen ? " open" : ""}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="sidebar-logo-icon">🕐</span>
                        <span>AttendanceApp</span>
                    </div>
                    <button
                        className="sidebar-close-btn"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {role === "EMPLOYEE" && (
                        <>
                            <div className="sidebar-section-label">Employee</div>
                            <NavLink
                                to="/employee/dashboard"
                                className={linkClass}
                                onClick={onClose}
                            >
                                <span className="sidebar-link-icon">🏠</span>
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/employee/checkin"
                                className={linkClass}
                                onClick={onClose}
                            >
                                <span className="sidebar-link-icon">✅</span>
                                Check In / Out
                            </NavLink>
                            <NavLink
                                to="/employee/report"
                                className={linkClass}
                                onClick={onClose}
                            >
                                <span className="sidebar-link-icon">📊</span>
                                My Report
                            </NavLink>
                        </>
                    )}

                    {role === "ADMIN" && (
                        <>
                            <div className="sidebar-section-label">Admin</div>
                            <NavLink
                                to="/admin/dashboard"
                                className={linkClass}
                                onClick={onClose}
                            >
                                <span className="sidebar-link-icon">🏠</span>
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/admin/employees"
                                className={linkClass}
                                onClick={onClose}
                            >
                                <span className="sidebar-link-icon">👥</span>
                                Employees
                            </NavLink>
                            <NavLink
                                to="/admin/attendance"
                                className={linkClass}
                                onClick={onClose}
                            >
                                <span className="sidebar-link-icon">📋</span>
                                Attendance Report
                            </NavLink>
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}
