export default function WorkModeBadge({ mode }) {
    const getStyle = () => {
        switch (mode) {
            case "WORK_FROM_OFFICE":
                return { backgroundColor: "#2ecc71", color: "white" }; // Green
            case "WORK_FROM_HOME":
                return { backgroundColor: "#3498db", color: "white" }; // Blue
            default:
                return { backgroundColor: "#95a5a6", color: "white" }; // Grey
        }
    };

    const style = {
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "0.8rem",
        fontWeight: "bold",
        ...getStyle(),
    };

    return <span style={style}>{mode ? mode.replace(/_/g, " ") : "UNKNOWN"}</span>;
}
