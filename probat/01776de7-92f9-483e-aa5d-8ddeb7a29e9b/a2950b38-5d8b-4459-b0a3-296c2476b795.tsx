import React from "react";


interface ButtonProps {
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ loading = false }) => {
  return (
    <button
      disabled={loading}
      style={{
        backgroundColor: "#764BA2",
        color: "#242424",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
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
              border: "2px solid rgba(36, 36, 36, 0.3)",
              borderTop: "2px solid #242424",
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
export default Button;