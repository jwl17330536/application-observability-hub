import React from "react";
import { useMultiQueryResults } from "@hooks/useMultiQueryResults";

/**
 * HealthReport Page - Observability coverage metrics
 * Compares CMDB inventory to monitored applications
 * Shows KPI cards and tier breakdown
 */
export const HealthReport: React.FC = () => {
  const { results, isLoading, error } = useMultiQueryResults();

  if (isLoading) return <div>Loading health report...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Observability Health Report</h1>
      <p>Coverage metrics: CMDB inventory vs monitored applications</p>

      {/* TODO: Render KPI cards and tier breakdown chart */}
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};
