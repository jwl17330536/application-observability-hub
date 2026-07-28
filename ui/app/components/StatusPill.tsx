import React from "react";

interface StatusPillProps {
  tone: "success" | "warning" | "critical";
  label: string;
}

/**
 * StatusPill Component - Health/state indicator
 */
export const StatusPill: React.FC<StatusPillProps> = ({ tone, label }) => {
  const colors = {
    success: { bg: "#4CAF50", text: "white" },
    warning: { bg: "#FFC107", text: "black" },
    critical: { bg: "#f44336", text: "white" },
  };

  const style = colors[tone];

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      {label}
    </span>
  );
};
