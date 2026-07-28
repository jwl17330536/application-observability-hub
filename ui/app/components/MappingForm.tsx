import React, { useState, useEffect } from "react";
import { saveConfig, validateConfig } from "@utils/documentStore";

interface MappingFormProps {
  dataSourceType: "tags" | "lookup" | "dql";
  onComplete: () => void;
  onTestResult: (result: string) => void;
}

/**
 * MappingForm Component - User input for field mappings
 * Displays form based on data source type
 * Validates and saves configuration
 */
export const MappingForm: React.FC<MappingFormProps> = ({
  dataSourceType,
  onComplete,
  onTestResult,
}) => {
  const [mappings, setMappings] = useState({
    appTag: "",
    appName: "",
    tier: "",
    owner: "",
  });
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load available fields for current data source
  useEffect(() => {
    // TODO: Fetch available fields based on data source type
    setAvailableFields(["app.tag", "app.name", "app.tier", "app.owner"]);
  }, [dataSourceType]);

  const handleChange = (field: string, value: string) => {
    setMappings((prev) => ({ ...prev, [field]: value }));

    // Validate field exists
    if (value && !availableFields.includes(value)) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: `❌ Field '${value}' not found. Available: [${availableFields.join(", ")}]`,
      }));
    } else {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleTestQuery = async () => {
    try {
      const validation = validateConfig({ dataSourceType, fieldMappings: mappings });
      if (validation.valid) {
        onTestResult("✅ Query validation passed! Configuration is ready.");
      } else {
        onTestResult(`❌ Validation failed: ${validation.errors?.join(", ")}`);
      }
    } catch (err) {
      onTestResult(`Error testing query: ${err}`);
    }
  };

  const handleSave = async () => {
    if (Object.keys(validationErrors).length > 0) {
      alert("Please fix validation errors before saving");
      return;
    }
    try {
      await saveConfig({ dataSourceType, fieldMappings: mappings });
      onComplete();
    } catch (err) {
      alert(`Failed to save configuration: ${err}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Application Tag Field</strong>
          <input
            type="text"
            placeholder="e.g., app.tag or CentralID"
            value={mappings.appTag}
            onChange={(e) => handleChange("appTag", e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          {validationErrors.appTag && (
            <p style={{ color: "red", fontSize: "12px" }}>{validationErrors.appTag}</p>
          )}
        </label>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Application Name Field</strong>
          <input
            type="text"
            placeholder="e.g., app.name or AppName"
            value={mappings.appName}
            onChange={(e) => handleChange("appName", e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          {validationErrors.appName && (
            <p style={{ color: "red", fontSize: "12px" }}>{validationErrors.appName}</p>
          )}
        </label>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Tier Field</strong>
          <input
            type="text"
            placeholder="e.g., app.tier or BIA"
            value={mappings.tier}
            onChange={(e) => handleChange("tier", e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          {validationErrors.tier && (
            <p style={{ color: "red", fontSize: "12px" }}>{validationErrors.tier}</p>
          )}
        </label>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Owner Field</strong>
          <input
            type="text"
            placeholder="e.g., app.owner or UnitCIO"
            value={mappings.owner}
            onChange={(e) => handleChange("owner", e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          {validationErrors.owner && (
            <p style={{ color: "red", fontSize: "12px" }}>{validationErrors.owner}</p>
          )}
        </label>
      </div>

      <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
        <button
          onClick={handleTestQuery}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Query
        </button>
        <button
          onClick={handleSave}
          disabled={Object.keys(validationErrors).length > 0}
          style={{
            padding: "10px 20px",
            backgroundColor: Object.keys(validationErrors).length > 0 ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              Object.keys(validationErrors).length > 0 ? "not-allowed" : "pointer",
          }}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
};
