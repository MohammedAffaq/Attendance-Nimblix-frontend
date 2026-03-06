import { useState, useEffect, useRef } from "react";
import { Edit, Upload, Trash2 } from "lucide-react";
import api from "../../api/api";

const INITIAL_FORM = {
    employeeId: "",
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    photo: null,
};

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [brokenPhotos, setBrokenPhotos] = useState(new Set());
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const xlsxInputRef = useRef(null);
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

    const handleXlsxUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            alert("Please select a valid .xlsx file.");
            return;
        }
        setUploading(true);
        setUploadResult(null);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await api.post("/api/admin/employees/upload", formData);
            setUploadResult(res.data);
            fetchEmployees();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || "Upload failed";
            setUploadResult({ error: typeof msg === "string" ? msg : JSON.stringify(msg) });
        } finally {
            setUploading(false);
            if (xlsxInputRef.current) xlsxInputRef.current.value = "";
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setForm(INITIAL_FORM);
        setPhotoPreview(null);
        setError("");
        setShowModal(true);
    };

    const openEditModal = (emp) => {
        setIsEditing(true);
        setEditingId(emp.id);
        setForm({
            employeeId: emp.employeeId || "",
            name: emp.name || "",
            email: emp.email || "",
            password: "",
            role: emp.role || "EMPLOYEE",
            photo: null,
        });
        setPhotoPreview(emp.photoPath ? `${import.meta.env.VITE_API_BASE_URL || ""}${emp.photoPath}` : null);
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setEditingId(null);
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
        if (!isEditing && !form.password.trim()) return "Password is required.";
        if (form.password && form.password.length < 6) return "Password must be at least 6 characters.";
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
                role: form.role,
            };
            if (form.password) data.password = form.password;

            formData.append("data", JSON.stringify(data));
            if (form.photo) formData.append("photo", form.photo);

            if (isEditing) {
                await api.put(`/api/admin/employees/${editingId}`, formData);
                setSuccess("Employee updated successfully!");
            } else {
                await api.post("/api/admin/employees", formData);
                setSuccess("Employee created successfully!");
            }

            closeModal();
            fetchEmployees();
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data ||
                (isEditing ? "Failed to update employee." : "Failed to create employee.");
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete employee "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/api/admin/employees/${id}`);
            setSuccess("Employee deleted successfully!");
            fetchEmployees();
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || "Failed to delete employee.";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
            window.scrollTo(0, 0);
            setTimeout(() => setError(""), 4000);
        }
    };

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="page-header">
                <h2>Employee Management</h2>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Excel Upload */}
                    <button
                        style={uploadBtnStyle}
                        onClick={() => xlsxInputRef.current?.click()}
                        disabled={uploading}
                        title="Upload employees from Excel (.xlsx)"
                    >
                        <Upload size={15} />
                        {uploading ? "Uploading..." : "Upload Excel"}
                    </button>
                    <input
                        ref={xlsxInputRef}
                        type="file"
                        accept=".xlsx"
                        style={{ display: "none" }}
                        onChange={handleXlsxUpload}
                    />
                    <button style={addBtnStyle} onClick={openAddModal}>
                        ＋ Add Employee
                    </button>
                </div>
            </div>

            {/* ── Upload Result Panel ── */}
            {uploadResult && (
                <div style={uploadResult.error ? errorResultStyle : uploadResultStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{uploadResult.error ? "❌ Upload Failed" : "📊 Upload Summary"}</strong>
                        <button style={closeSummaryBtnStyle} onClick={() => setUploadResult(null)}>✕</button>
                    </div>
                    {uploadResult.error ? (
                        <p style={{ margin: "6px 0 0" }}>{uploadResult.error}</p>
                    ) : (
                        <>
                            <div style={summaryRowStyle}>
                                <span>📋 Total rows processed:</span> <strong>{uploadResult.totalRows}</strong>
                            </div>
                            <div style={summaryRowStyle}>
                                <span>✅ Successfully created:</span> <strong style={{ color: "#065f46" }}>{uploadResult.successCount}</strong>
                            </div>
                            <div style={summaryRowStyle}>
                                <span>⚠️ Skipped / failed:</span> <strong style={{ color: "#991b1b" }}>{uploadResult.failCount}</strong>
                            </div>
                            {uploadResult.errors?.length > 0 && (
                                <details style={{ marginTop: "8px" }}>
                                    <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#6b7280" }}>View {uploadResult.errors.length} error(s)</summary>
                                    <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "0.78rem", color: "#7f1d1d" }}>
                                        {uploadResult.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                                    </ul>
                                </details>
                            )}
                        </>
                    )}
                </div>
            )}

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
                                    {emp.photoPath && !brokenPhotos.has(emp.id) ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_BASE_URL || ""}${emp.photoPath}`}
                                            alt={emp.name}
                                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                            onError={() => setBrokenPhotos(prev => new Set(prev).add(emp.id))}
                                        />
                                    ) : (
                                        emp.name ? emp.name.charAt(0).toUpperCase() : "?"
                                    )}
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
                                <button style={editIconBtnStyle} onClick={() => openEditModal(emp)} title="Edit Employee">
                                    <Edit size={18} />
                                </button>
                                <button style={trashIconBtnStyle} onClick={() => handleDelete(emp.id, emp.name)} title="Delete Employee">
                                    <Trash2 size={18} />
                                </button>
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
                                {isEditing ? "Edit Employee" : "Add New Employee"}
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
                                    Password {isEditing ? <span style={{ color: "#6b7280", fontWeight: "normal" }}>(leave blank to keep unchanged)</span> : <span style={{ color: "red" }}>*</span>}
                                </label>
                                <input
                                    id="password" name="password" type="password"
                                    placeholder="Min. 6 characters" value={form.password}
                                    onChange={handleChange} style={inputStyle}
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle} htmlFor="role">
                                    Role <span style={{ color: "red" }}>*</span>
                                </label>
                                <select
                                    id="role" name="role" value={form.role}
                                    onChange={handleChange} style={inputStyle}
                                >
                                    <option value="EMPLOYEE">EMPLOYEE</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
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
                                {submitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Save Changes" : "Create Employee")}
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

const uploadBtnStyle = {
    padding: "10px 16px",
    background: "#fff",
    color: "#374151",
    border: "1.5px solid #d1d5db",
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

const uploadResultStyle = {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    fontSize: "0.875rem",
    color: "#14532d",
};

const errorResultStyle = {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    fontSize: "0.875rem",
    color: "#7f1d1d",
};

const summaryRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "6px",
    fontSize: "0.84rem",
};

const closeSummaryBtnStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#6b7280",
    lineHeight: 1,
};

const editIconBtnStyle = {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    marginLeft: "8px",
};

const trashIconBtnStyle = {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    marginLeft: "4px",
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
