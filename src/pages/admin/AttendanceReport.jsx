import { useState, useEffect } from "react";
import api from "../../api/api";
import WorkModeBadge from "../../components/WorkModeBadge";

function formatTime(isoString) {
    if (!isoString) return "-";
    try {
        // Backend now returns localized or proper time formatting.
        // We parse it as-is without artificially enforcing 'Z' to avoid time-zone drifting locally.
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
        return isoString;
    }
}

function formatDuration(minutes) {
    if (minutes == null || minutes < 0) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AttendanceReport() {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/admin/attendance")
            .then(res => {
                console.log("Attendance API response:", res.data);
                const content = res.data?.content;
                setReport(Array.isArray(content) ? content : []);
            })
            .catch(err => {
                console.error("Failed to fetch attendance report:", err);
                setReport([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header">
                <h2>Attendance Report — All Employees</h2>
            </div>

            {loading ? (
                <p style={{ color: "#6b7280", padding: "1rem 0" }}>Loading...</p>
            ) : report.length === 0 ? (
                <div style={emptyStyle}>
                    <span style={{ fontSize: "2.5rem" }}>📋</span>
                    <p>No attendance records found.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table style={tableStyle}>
                        <thead>
                            <tr style={theadRowStyle}>
                                <th style={thStyle}>Emp ID</th>
                                <th style={thStyle}>Employee Name</th>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Check In</th>
                                <th style={thStyle}>Check Out</th>
                                <th style={thStyle}>Total Time</th>
                                <th style={thStyle}>Work Mode</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.map((r, idx) => (
                                <tr key={idx} style={idx % 2 === 0 ? trEvenStyle : trOddStyle}>
                                    <td style={tdStyle}>{r.employeeId ?? "-"}</td>
                                    <td style={{ ...tdStyle, fontWeight: "500" }}>{r.employeeName || "-"}</td>
                                    <td style={tdStyle}>{r.date}</td>
                                    <td style={tdStyle}>{formatTime(r.checkInTime)}</td>
                                    <td style={tdStyle}>{formatTime(r.checkOutTime)}</td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>{formatDuration(r.totalWorkMinutes)}</td>
                                    <td style={tdStyle}><WorkModeBadge mode={r.workMode} /></td>
                                    <td style={tdStyle}>
                                        <span style={getStatusStyle(r.status)}>{r.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function getStatusStyle(status) {
    const base = {
        padding: "3px 10px",
        borderRadius: "100px",
        fontSize: "0.75rem",
        fontWeight: "600",
        display: "inline-block",
    };
    if (status === "PRESENT") return { ...base, background: "#d1fae5", color: "#065f46" };
    if (status === "ABSENT") return { ...base, background: "#fee2e2", color: "#991b1b" };
    return { ...base, background: "#f3f4f6", color: "#374151" };
}

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    fontSize: "0.88rem",
};

const theadRowStyle = {
    background: "#f8fafc",
};

const thStyle = {
    padding: "12px 14px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.78rem",
    color: "#475569",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "11px 14px",
    borderBottom: "1px solid #f1f5f9",
    color: "#374151",
    whiteSpace: "nowrap",
};

const trEvenStyle = {};
const trOddStyle = { background: "#fafafa" };

const emptyStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 1rem",
    gap: "0.75rem",
    color: "#94a3b8",
    textAlign: "center",
};
