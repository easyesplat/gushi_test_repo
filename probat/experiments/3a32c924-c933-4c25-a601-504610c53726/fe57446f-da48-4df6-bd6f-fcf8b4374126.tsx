import React from "react";

interface ButtonProps {
  loading?: boolean;
  label?: string;
  onClick?: () => void;
}

const ButtonControl: React.FC<ButtonProps> = ({ loading = false, label, onClick }) => {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      style={{
        backgroundColor: "#F44336",
        color: "#ffffff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "25px", // More rounded, pill-like shape
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "100px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        transition: "background-color 0.3s ease",
      }}
    >
      {loading ? (
        <>
          <div
            style={{
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderTop: "2px solid #ffffff",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "inline-block",
              verticalAlign: "middle",
            }}
          ></div>
          <span style={{ marginLeft: "8px" }}>Loading...</span>
        </>
      ) : (
        label || "SUBMIT"
      )}
    </button>
  );
};

export default ButtonControl;