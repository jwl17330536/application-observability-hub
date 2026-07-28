import React from "react";
import { useMappingConfig } from "@hooks/useMappingConfig";

/**
 * Settings Page - Configuration management
 * View/edit mapping configuration and data source selection
 */
export const Settings: React.FC = () => {
  const { config, isLoading, error } = useMappingConfig();

  if (isLoading) return <div>Loading settings...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Settings</h1>
      <p>Manage your configuration and data source mappings</p>

      <h3>Current Configuration</h3>
      <pre>{JSON.stringify(config, null, 2)}</pre>

      {/* TODO: Add edit buttons/forms */}
    </div>
  );
};
