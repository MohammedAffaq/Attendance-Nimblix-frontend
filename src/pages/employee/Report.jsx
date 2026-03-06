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

export default function Report() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReport = async () => {
        try {
            const now = new Date();
            const end = now.toISOString().split("T")[0];
            const start = new Date(now.setDate(now.getDate() - 30)).toISOString().split("T")[0];
            const res = await api.get(`/api/employee/my-report?start=${start}&end=${end}&page=0&size=20`);
            setRecords(res.data.content || res.data);
        } catch (err) {
            setError("Failed to load report.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    if (loading) return (
        <div style={loadingStyle}>
            <span style={{ fontSize: "2rem" }}>⏳</span>
            <p>Loading report...</p>
        </div>
    );

    if (error) return (
        <div style={errorBannerStyle}>⚠️ {error}</div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>My Attendance Report</h2>
                <span style={periodBadgeStyle}>Last 30 days</span>
            </div>

            {records.length === 0 ? (
                <div style={emptyStyle}>
                    <span style={{ fontSize: "2.5rem" }}>📊</span>
                    <p>No records found for the last 30 days.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table style={tableStyle}>
                        <thead>
                            <tr style={theadRowStyle}>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Check In</th>
                                <th style={thStyle}>Check Out</th>
                                <th style={thStyle}>Work Mode</th>
                                <th style={thStyle}>Duration</th>
                                <th style={thStyle}>Late</th>
                                <th style={thStyle}>Early Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r, idx) => (
                                <tr key={idx} style={idx % 2 === 0 ? {} : trOddStyle}>
                                    <td style={{ ...tdStyle, fontWeight: "500" }}>{r.date}</td>
                                    <td style={tdStyle}>{formatTime(r.checkInTime)}</td>
                                    <td style={tdStyle}>{formatTime(r.checkOutTime) || "-"}</td>
                                    <td style={tdStyle}><WorkModeBadge mode={r.workMode} /></td>
                                    <td style={tdStyle}>{formatDuration(r.totalWorkMinutes)}</td>
                                    <td style={tdStyle}>
                                        <span style={r.late ? lateStyle : okStyle}>{r.late ? "Late" : "On Time"}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={r.earlyCheckout ? earlyStyle : okStyle}>{r.earlyCheckout ? "Early" : "–"}</span>
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

// ── Styles ─────────────────────────────────────────────────────────────────────

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    fontSize: "0.875rem",
};

const theadRowStyle = { background: "#f8fafc" };

const thStyle = {
    padding: "12px 14px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.75rem",
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

const trOddStyle = { background: "#fafafa" };

const badgeBase = {
    padding: "2px 8px",
    borderRadius: "100px",
    fontSize: "0.72rem",
    fontWeight: "600",
    display: "inline-block",
};

const lateStyle = { ...badgeBase, background: "#fee2e2", color: "#991b1b" };
const earlyStyle = { ...badgeBase, background: "#fef3c7", color: "#92400e" };
const okStyle = { ...badgeBase, background: "#f1f5f9", color: "#475569" };

const loadingStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem",
    gap: "0.75rem",
    color: "#94a3b8",
};

const emptyStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 1rem",
    gap: "0.75rem",
    color: "#94a3b8",
    textAlign: "center",
};

const errorBannerStyle = {
    padding: "12px 16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "0.875rem",
};

const periodBadgeStyle = {
    padding: "4px 12px",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "100px",
    fontSize: "0.78rem",
    fontWeight: "600",
};
