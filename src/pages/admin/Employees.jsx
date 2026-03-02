import { useState, useEffect, useRef } from "react";
import api from "../../api/api";

const INITIAL_FORM = {
    employeeId: "",
    name: "",
    email: "",
    password: "",
    photo: null,
};

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef(null);

    const fetchEmployees = () => {
        setLoading(true);
        api
            .get("/api/admin/employees")
            .then((res) => setEmployees(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEmployees(); }, []);

    const openModal = () => {
        setForm(INITIAL_FORM);
        setPhotoPreview(null);
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm(INITIAL_FORM);
        setPhotoPreview(null);
        setError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm((prev) => ({ ...prev, photo: file }));
        setPhotoPreview(URL.createObjectURL(file));
    };

    const validate = () => {
        if (!form.employeeId.trim()) return "Employee ID is required.";
        if (!form.name.trim()) return "Name is required.";
        if (!form.email.trim()) return "Email is required.";
        if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address.";
        if (!form.password.trim()) return "Password is required.";
        if (form.password.length < 6) return "Password must be at least 6 characters.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setError("");
        setSubmitting(true);

        try {
            const formData = new FormData();
            const data = {
                employeeId: form.employeeId,
                name: form.name,
                email: form.email,
                password: form.password,
            };
            formData.append("data", JSON.stringify(data));
            if (form.photo) formData.append("photo", form.photo);

            await api.post("/api/admin/employees", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSuccess("Employee created successfully!");
            closeModal();
            fetchEmployees();
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data ||
                "Failed to create employee. Please try again.";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="page-header">
                <h2>Employee Management</h2>
                <button style={addBtnStyle} onClick={openModal}>
                    ＋ Add Employee
                </button>
            </div>

            {/* ── Success Banner ── */}
            {success && <div style={successBannerStyle}>✅ {success}</div>}

            {/* ── Employee List ── */}
            {loading ? (
                <p style={{ color: "#6b7280", padding: "1rem 0" }}>Loading...</p>
            ) : employees.length === 0 ? (
                <div style={emptyStyle}>
                    <span style={{ fontSize: "2.5rem" }}>👥</span>
                    <p>No employees found. Add your first employee.</p>
                </div>
            ) : (
                <div style={cardStyle}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {employees.map((emp) => (
                            <li key={emp.id} style={listItemStyle}>
                                <div style={avatarStyle}>
                                    {emp.name ? emp.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.9rem" }}>
                                        {emp.name}
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {emp.email}
                                    </div>
                                </div>
                                {emp.employeeId && (
                                    <span style={empIdBadgeStyle}>{emp.employeeId}</span>
                                )}
                                <span style={roleBadgeStyle}>{emp.role}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Add Employee Modal ── */}
            {showModal && (
                <div
                    style={overlayStyle}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div style={modalStyle}>
                        {/* Modal header */}
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                                Add New Employee
                            </h3>
                            <button style={closeBtnStyle} onClick={closeModal} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            {error && <div style={errorMsgStyle}>⚠️ {error}</div>}

                            <div style={formGroupStyle}>
                                <label style={labelStyle} htmlFor="employeeId">
                                    Employee ID <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    id="employeeId" name="employeeId" type="text"
                                    placeholder="e.g. EMP001" value={form.employeeId}
                                    onChange={handleChange} style={inputStyle}
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle} htmlFor="name">
                                    Employee Name <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    id="name" name="name" type="text"
                                    placeholder="Full name" value={form.name}
                                    onChange={handleChange} style={inputStyle}
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle} htmlFor="email">
                                    Email Address <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    id="email" name="email" type="email"
                                    placeholder="employee@example.com" value={form.email}
                                    onChange={handleChange} style={inputStyle}
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle} htmlFor="password">
                                    Password <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    id="password" name="password" type="password"
                                    placeholder="Min. 6 characters" value={form.password}
                                    onChange={handleChange} style={inputStyle}
                                />
                            </div>

                            {/* Photo Upload */}
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Profile Photo (optional)</label>
                                <div
                                    style={photoAreaStyle}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {photoPreview ? (
                                        <>
                                            <img src={photoPreview} alt="Preview" style={photoPreviewStyle} />
                                            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                Click to change
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: "2rem", marginBottom: "4px" }}>📷</div>
                                            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                Click to upload a profile photo
                                            </span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef} type="file" accept="image/*"
                                    style={{ display: "none" }} onChange={handlePhotoChange}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    ...submitBtnStyle,
                                    opacity: submitting ? 0.7 : 1,
                                    cursor: submitting ? "not-allowed" : "pointer",
                                }}
                                disabled={submitting}
                            >
                                {submitting ? "Creating..." : "Create Employee"}
                            </button>
                            <button
                                type="button" style={cancelBtnStyle}
                                onClick={closeModal} disabled={submitting}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const addBtnStyle = {
    padding: "10px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.875rem",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
    flexShrink: 0,
};

const successBannerStyle = {
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #6ee7b7",
    padding: "10px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontWeight: "500",
    fontSize: "0.875rem",
};

const cardStyle = {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    overflow: "hidden",
};

const listItemStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "12px",
};

const avatarStyle = {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "#1d4ed8",
    fontSize: "1rem",
    flexShrink: 0,
};

const roleBadgeStyle = {
    padding: "3px 10px",
    borderRadius: "100px",
    fontSize: "0.72rem",
    fontWeight: "600",
    background: "#ede9fe",
    color: "#6d28d9",
    whiteSpace: "nowrap",
    flexShrink: 0,
};

const empIdBadgeStyle = {
    padding: "3px 10px",
    borderRadius: "100px",
    fontSize: "0.72rem",
    fontWeight: "700",
    background: "#dcfce7",
    color: "#166534",
    whiteSpace: "nowrap",
    flexShrink: 0,
    letterSpacing: "0.03em",
};

const emptyStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    padding: "3rem 1rem",
    color: "#94a3b8",
    textAlign: "center",
};

// Modal styles
const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
    overflowY: "auto",
};

const modalStyle = {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    maxHeight: "90vh",
    overflowY: "auto",
    margin: "auto",
};

const modalHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
};

const closeBtnStyle = {
    background: "none",
    border: "none",
    fontSize: "1.1rem",
    cursor: "pointer",
    color: "#6b7280",
    lineHeight: 1,
    padding: "4px 6px",
    borderRadius: "6px",
};

const formGroupStyle = { marginBottom: "16px" };

const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "0.8rem",
    color: "#374151",
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.875rem",
    boxSizing: "border-box",
    outline: "none",
};

const photoAreaStyle = {
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center",
    cursor: "pointer",
};

const photoPreviewStyle = {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    margin: "0 auto 8px",
    display: "block",
};

const errorMsgStyle = {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "0.8rem",
};

const submitBtnStyle = {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    marginTop: "4px",
};

const cancelBtnStyle = {
    width: "100%",
    padding: "10px",
    background: "none",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "0.875rem",
    cursor: "pointer",
    marginTop: "8px",
};
