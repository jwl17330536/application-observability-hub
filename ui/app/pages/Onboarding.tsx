import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MappingForm } from "@components/MappingForm";

/**
 * Onboarding Page - Setup flow
 * 1. Select data source (tags, lookup, dql)
 * 2. Map standard fields to user's field names
 * 3. Test and save configuration
 */
export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [dataSourceType, setDataSourceType] = useState<"tags" | "lookup" | "dql">(
    "tags"
  );
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleComplete = () => {
    navigate("/overview");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Welcome to Application Observability Hub</h1>
      <p>Let's get you set up. Choose your data source:</p>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <input
            type="radio"
            value="tags"
            checked={dataSourceType === "tags"}
            onChange={(e) => setDataSourceType(e.target.value as "tags")}
          />
          Dynatrace Tags (fastest, recommended)
        </label>
        <br />
        <label>
          <input
            type="radio"
            value="lookup"
            checked={dataSourceType === "lookup"}
            onChange={(e) => setDataSourceType(e.target.value as "lookup")}
          />
          CMDB Lookup Table
        </label>
        <br />
        <label>
          <input
            type="radio"
            value="dql"
            checked={dataSourceType === "dql"}
            onChange={(e) => setDataSourceType(e.target.value as "dql")}
          />
          Custom DQL (advanced)
        </label>
      </div>

      <MappingForm
        dataSourceType={dataSourceType}
        onComplete={handleComplete}
        onTestResult={setTestResult}
      />

      {testResult && (
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#e8f5e9" }}>
          <p>
            <strong>Test Result:</strong> {testResult}
          </p>
        </div>
      )}
    </div>
  );
};
