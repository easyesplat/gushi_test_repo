import React from "react";
import { withExperiment } from "../../../probat/runtime";
import { PROBAT_COMPONENTS, PROBAT_REGISTRIES } from "../../../probat";

// You can hardcode or have your GitHub App auto-insert this
const __PROBAT_KEY__ = "react-test-repo/src/components/Button.tsx";

interface ButtonProps {
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ loading = false }) => {
  return (
    <button
      disabled={loading}
      style={{
        backgroundColor: "#F44336",
        color: "#ffffff",
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
        "SUBMIT"
      )}
    </button>
  );
};

// Probat Generate Lines.
export default (() => {
  const meta = PROBAT_COMPONENTS[__PROBAT_KEY__];
  const reg  = PROBAT_REGISTRIES[__PROBAT_KEY__] as Record<string, React.ComponentType<any>> | undefined;
  return (meta?.proposalId && reg)
    ? withExperiment<typeof Button>(Button as any, { proposalId: meta.proposalId, registry: reg })
    : Button;
})();

