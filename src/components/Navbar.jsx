import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

export default function Navbar({ onMenuClick }) {
    const { logout, role } = useContext(AuthContext);

    return (
        <nav className="navbar">
            <div className="navbar-left">
                {/* Hamburger button – only visible on tablet/mobile via CSS */}
                <button
                    className="hamburger-btn"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar menu"
                >
                    ☰
                </button>
                <span className="navbar-title">Attendance System</span>
            </div>

            <div className="navbar-right">
                <span className="navbar-role-badge">{role}</span>
                <button className="logout-btn" onClick={logout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}
