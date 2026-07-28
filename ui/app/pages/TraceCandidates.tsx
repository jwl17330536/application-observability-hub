import React from "react";
import { useMultiQueryResults } from "@hooks/useMultiQueryResults";

/**
 * TraceCandidates Page - Identifies hosts eligible for distributed tracing
 * Shows candidate hosts with process count, technologies, and tracing readiness
 */
export const TraceCandidates: React.FC = () => {
  const { results, isLoading, error } = useMultiQueryResults();

  if (isLoading) return <div>Loading trace candidates...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trace Candidate Analysis</h1>
      <p>Hosts eligible for distributed tracing instrumentation</p>

      {/* TODO: Render DataTable with candidate hosts */}
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};
