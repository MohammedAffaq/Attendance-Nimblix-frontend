import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../api/api";

export default function CheckIn() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");

    // Camera states
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedBlob, setCapturedBlob] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const showMessage = (type, text) => { setStatus(type); setMessage(text); };

    // ── Camera controls ────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;
            setCapturedImage(null);
            setCapturedBlob(null);
            setCameraActive(true);
        } catch (err) {
            showMessage("error", "❌ Could not access camera: " + err.message);
        }
    }, []);

    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraActive]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
        canvas.toBlob((blob) => { setCapturedBlob(blob); }, "image/jpeg", 0.85);
        stopCamera();
    }, [stopCamera]);

    const retake = useCallback(() => {
        setCapturedImage(null);
        setCapturedBlob(null);
        startCamera();
    }, [startCamera]);

    useEffect(() => () => stopCamera(), [stopCamera]);

    // ── Submit attendance ──────────────────────────────────────────────────────
    const handleAttendance = async (type) => {
        showMessage("", "");
        setLoading(true);

        if (!navigator.geolocation) {
            showMessage("error", "Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                if (!capturedBlob) {
                    showMessage("error", "Please capture a selfie photo first.");
                    setLoading(false);
                    return;
                }

                const formData = new FormData();
                formData.append("photo", capturedBlob, "selfie.jpg");
                formData.append("lat", latitude);
                formData.append("lng", longitude);

                try {
                    const endpoint = type === "checkin"
                        ? "/api/employee/checkin"
                        : "/api/employee/checkout";

                    const res = await api.post(endpoint, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    const data = res.data;

                    if (data.alreadyMarked) {
                        showMessage("warning", `⚠️ ${data.message || "Attendance already marked for today."}`);
                        return;
                    }
                    if (data.message && data.checkInTime && !data.checkOutTime) {
                        showMessage("warning", `ℹ️ ${data.message}`);
                        return;
                    }

                    const workModeLabel =
                        data.workMode === "WORK_FROM_OFFICE" ? "🏢 Work From Office"
                            : data.workMode === "WORK_FROM_HOME" ? "🏠 Work From Home"
                                : "";

                    const action = type === "checkin" ? "Checked In" : "Checked Out";
                    showMessage("success", `✅ ${action} successfully! ${workModeLabel}`);
                } catch (error) {
                    console.error("Attendance error", error);
                    showMessage("error", `❌ ${error.response?.data?.message || "Failed to mark attendance. Please try again."}`);
                } finally {
                    setLoading(false);
                }
            },
            (geoError) => {
                showMessage("error", `Geolocation error: ${geoError.message}`);
                setLoading(false);
            }
        );
    };

    const messageBg = {
        success: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
        warning: { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" },
        error: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
    }[status] || {};

    return (
        <div style={pageStyle}>
            <div className="page-header">
                <h2>Mark Attendance</h2>
            </div>

            <div style={cardStyle}>
                {/* ── Selfie Section ── */}
                <div style={sectionStyle}>
                    <label style={sectionLabelStyle}>
                        📷 Selfie Photo <span style={{ color: "red" }}>*</span>
                    </label>

                    {/* Hidden canvas */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    {/* Captured preview */}
                    {capturedImage && (
                        <div style={cameraBoxStyle}>
                            <img
                                src={capturedImage}
                                alt="Captured selfie"
                                style={captureImgStyle}
                            />
                            <button onClick={retake} style={retakeBtnStyle}>
                                🔄 Retake Photo
                            </button>
                        </div>
                    )}

                    {/* Live camera feed */}
                    {cameraActive && (
                        <div style={cameraBoxStyle}>
                            <video
                                ref={videoRef}
                                autoPlay playsInline muted
                                style={videoStyle}
                            />
                            <div style={cameraBtnsStyle}>
                                <button onClick={capturePhoto} style={captureBtnStyle}>
                                    📸 Capture
                                </button>
                                <button onClick={stopCamera} style={cancelCamBtnStyle}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Open camera button */}
                    {!cameraActive && !capturedImage && (
                        <button onClick={startCamera} style={openCamBtnStyle}>
                            📷 Open Camera
                        </button>
                    )}
                </div>

                {/* ── Check In / Check Out Buttons ── */}
                <div style={actionRowStyle}>
                    <button
                        onClick={() => handleAttendance("checkin")}
                        disabled={loading}
                        style={{
                            ...actionBtnBase,
                            background: loading ? "#a7f3d0" : "#059669",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Processing..." : "✅ Check In"}
                    </button>

                    <button
                        onClick={() => handleAttendance("checkout")}
                        disabled={loading}
                        style={{
                            ...actionBtnBase,
                            background: loading ? "#fecaca" : "#dc2626",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Processing..." : "🚪 Check Out"}
                    </button>
                </div>

                {/* ── Status message ── */}
                {message && (
                    <div style={{ ...messageBannerStyle, ...messageBg }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const pageStyle = {
    maxWidth: "560px",
    width: "100%",
    margin: "0 auto",
};

const cardStyle = {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
};

const sectionStyle = { marginBottom: "1.5rem" };

const sectionLabelStyle = {
    display: "block",
    fontWeight: "600",
    fontSize: "0.9rem",
    marginBottom: "12px",
    color: "#374151",
};

const cameraBoxStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
};

const captureImgStyle = {
    width: "100%",
    maxWidth: "360px",
    borderRadius: "10px",
    border: "2px solid #059669",
    display: "block",
};

const videoStyle = {
    width: "100%",
    maxWidth: "360px",
    borderRadius: "10px",
    border: "2px solid #3b82f6",
    display: "block",
    transform: "scaleX(-1)",
};

const cameraBtnsStyle = {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
};

const captureBtnStyle = {
    padding: "10px 24px",
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "0.95rem",
    minWidth: "120px",
};

const cancelCamBtnStyle = {
    padding: "10px 20px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
};

const retakeBtnStyle = {
    padding: "8px 20px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.875rem",
};

const openCamBtnStyle = {
    padding: "12px 24px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
};

const actionRowStyle = {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
};

const actionBtnBase = {
    flex: "1 1 140px",
    padding: "14px 12px",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "1rem",
    transition: "opacity 0.2s",
    minWidth: "140px",
};

const messageBannerStyle = {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "0.875rem",
};
