import React from "react";

interface ButtonProps {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ loading = false }) => {
  return (
    <button
      disabled={loading}
      style={{
        backgroundColor: "#4CAF50", // Changed to a calming green
        color: "#ffffff", // White text for contrast
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "100px", // Ensure a consistent width for better aesthetics
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
        transition: "background-color 0.3s ease", // Smooth transition for hover/active states
      }}
    >
      {loading ? (
        <>
          <div
            style={{
              border: "2px solid rgba(255, 255, 255, 0.3)", /* Transparent white for base */
              borderTop: "2px solid #ffffff", /* White for spinner top */
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
        "SUBMIT"
      )}
    </button>
  );
};
