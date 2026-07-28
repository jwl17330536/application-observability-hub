import React, { useState } from "react";

interface QueryBuilderProps {
  query: string;
}

/**
 * QueryBuilder Component - Debug/test tool for queries
 * Shows query and allows copying/testing
 */
export const QueryBuilder: React.FC<QueryBuilderProps> = ({ query }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
      <div style={{ marginBottom: "10px" }}>
        <strong>Query:</strong>
        <button
          onClick={handleCopy}
          style={{
            marginLeft: "10px",
            padding: "5px 10px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{ overflow: "auto", fontSize: "12px" }}>{query}</pre>
    </div>
  );
};
