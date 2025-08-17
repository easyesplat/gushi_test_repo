import React from "react";

interface ButtonProps {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ loading = false }) => {
  return (
    <button disabled={loading}>
      {loading ? (
        <div
          style={{
            border: "2px solid #f3f3f3", /* Light grey */
            borderTop: "2px solid #3498db", /* Blue */
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            display: "inline-block",
            verticalAlign: "middle" /* Align spinner vertically with text area */
          }}
        ></div>
      ) : (
        "Submit"
      )}
    </button>
  );
};
