/**
 * Setup Page — Tags-Based Configuration (Phase 1 MVP)
 * 
 * Users define 4 tag field mappings:
 * - Application Tag → unique app identifier tag key (e.g., "app.tag")
 * - Application Name → display name tag key (e.g., "app.name")
 * - Tier → tier/criticality tag key (e.g., "app.tier")
 * - Owner → responsible team/person tag key (e.g., "app.owner")
 * 
 * Config saved to Document Store with localStorage fallback.
 * Phase 2 pivot to lookups requires ZERO changes to this page (adapter pattern).
 */

import React, { useState } from "react";
import { Heading, Paragraph, Button } from "@dynatrace/strato-components";
import { saveConfig, MappingConfig } from "@utils/documentStore";


interface FormState {
  appTag: string;
  appName: string;
  tier: string;
  owner: string;
}

interface SetupState {
  formData: FormState;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

const EXAMPLE_TAGS = {
  appTag: "app.tag",
  appName: "app.name",
  tier: "app.tier",
  owner: "app.owner",
};

export const Setup: React.FC = () => {
  const [state, setState] = useState<SetupState>({
    formData: {
      appTag: "",
      appName: "",
      tier: "",
      owner: "",
    },
    isLoading: false,
    error: null,
    success: false,
  });

  const handleInputChange = (field: keyof FormState, value: string) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      error: null,
    }));
  };

  const handleSaveConfig = async () => {
    const { appTag, appName, tier, owner } = state.formData;

    if (!appTag.trim() || !appName.trim() || !tier.trim() || !owner.trim()) {
      setState((prev) => ({
        ...prev,
        error: "All four fields are required",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const config: MappingConfig = {
        dataSourceType: "tags",
        fieldMappings: {
          appTag: appTag.trim(),
          appName: appName.trim(),
          tier: tier.trim(),
          owner: owner.trim(),
        },
      };

      await saveConfig(config);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
      }));

      // Redirect to overview after 1 second
      setTimeout(() => {
        window.location.href = "/overview";
      }, 1000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Failed to save configuration: ${error}`,
      }));
    }
  };

  if (state.success) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
        <Heading level={1}>✓ Configuration Saved!</Heading>
        <Paragraph style={{ marginTop: "16px" }}>
          Your tag mappings have been saved. Redirecting to Overview...
        </Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px" }}>
      <Heading level={1}>Application Observability Hub Setup</Heading>

      <div style={{ marginTop: "32px", backgroundColor: "#f5f5f5", padding: "24px", borderRadius: "4px" }}>
        <Heading level={2}>Configure Tag Mappings</Heading>
        <Paragraph>
          Define which Dynatrace entity tags contain your application metadata. The Hub App will query entities
          tagged with these keys to build your observability dashboard.
        </Paragraph>

        <div style={{ marginTop: "24px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Application Tag (Unique Identifier)
          </label>
          <input
            type="text"
            placeholder={EXAMPLE_TAGS.appTag}
            value={state.formData.appTag}
            onChange={(e) => handleInputChange("appTag", e.target.value)}
            disabled={state.isLoading}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            Tag key used as unique application identifier (e.g., "app.tag", "jira", "mail")
          </small>
        </div>

        <div style={{ marginTop: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Application Name
          </label>
          <input
            type="text"
            placeholder={EXAMPLE_TAGS.appName}
            value={state.formData.appName}
            onChange={(e) => handleInputChange("appName", e.target.value)}
            disabled={state.isLoading}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            Tag key for application display name (e.g., "app.name", "app.displayName")
          </small>
        </div>

        <div style={{ marginTop: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Tier / Business Criticality
          </label>
          <input
            type="text"
            placeholder={EXAMPLE_TAGS.tier}
            value={state.formData.tier}
            onChange={(e) => handleInputChange("tier", e.target.value)}
            disabled={state.isLoading}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            Tag key for application tier (e.g., "app.tier", "app.criticality", "env.tier")
          </small>
        </div>

        <div style={{ marginTop: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Owner / Team
          </label>
          <input
            type="text"
            placeholder={EXAMPLE_TAGS.owner}
            value={state.formData.owner}
            onChange={(e) => handleInputChange("owner", e.target.value)}
            disabled={state.isLoading}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            Tag key for responsible team/person (e.g., "app.owner", "team.name", "owner")
          </small>
        </div>

        {state.error && (
          <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#ffe6e6", borderRadius: "4px" }}>
            <p style={{ color: "#c62828", margin: "0", fontSize: "14px" }}>❌ {state.error}</p>
          </div>
        )}

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <Button
            onClick={handleSaveConfig}
            variant="emphasized"
            disabled={state.isLoading}
          >
            {state.isLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </div>

      <div style={{ marginTop: "32px", padding: "16px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
        <Heading level={3}>💡 Tip: Getting Started</Heading>
        <p style={{ margin: "8px 0", fontSize: "14px" }}>
          <strong>No tags yet?</strong> Tag a few hosts in Dynatrace first:
        </p>
        <ul style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
          <li>Go to Infrastructure → Hosts (or Services)</li>
          <li>Click a host → Edit tags</li>
          <li>Add: <code>app.tag=myapp</code>, <code>app.name=My App</code>, etc.</li>
          <li>Come back and fill out the fields above with those tag keys</li>
        </ul>
      </div>
    </div>
  );
};

export default Setup;
