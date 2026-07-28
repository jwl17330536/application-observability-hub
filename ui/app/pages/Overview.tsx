/**
 * Overview Page — Tags-Based Application Table (Phase 1 MVP)
 *
 * Shows all entities tagged with the user-configured tag keys.
 * Generic table that works with any tag names (not CMDB-specific).
 * 
 * Phase 2 pivot: Replace query with lookupAdapter query, table renders identically.
 */

import React from "react";
import { Heading, Paragraph } from "@dynatrace/strato-components";
import { useMappingConfig } from "@hooks/useMappingConfig";
import { useDql } from "@dynatrace-sdk/react-hooks";

interface AppRow {
  [key: string]: string | number;
}

export const Overview: React.FC = () => {
  const { config, isLoading: configLoading, error: configError } = useMappingConfig();

  // Build DQL query from tag mappings
  const query = React.useMemo(() => {
    if (!config) return null;
    
    const { appTag, appName, tier, owner } = config.fieldMappings;
    
    // Query: Fetch all hosts/services with the specified tags
    return `fetch dt.entity.host
    | filter (tags["${appTag}"] != null OR tags["${appName}"] != null OR tags["${tier}"] != null OR tags["${owner}"] != null)
    | fields 
        appTag = tags["${appTag}"],
        appName = tags["${appName}"],
        tier = tags["${tier}"],
        owner = tags["${owner}"],
        entity_id = id
    | sort by appTag
    `;
  }, [config]);

  const { data, isLoading: queryLoading, error: queryError } = useDql({ query: query || "" });

  const isLoading = configLoading || queryLoading;
  const error = configError || queryError;

  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <Heading level={1}>Application Overview</Heading>
        <Paragraph>Loading applications from your tags...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <Heading level={1}>Application Overview</Heading>
        <Paragraph style={{ color: "red" }}>
          Error loading applications: {typeof error === "string" ? error : String(error)}
        </Paragraph>
        <details style={{ marginTop: "20px" }}>
          <summary>Debug Info</summary>
          <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", fontSize: "12px" }}>
            Config loaded: {config ? "Yes" : "No"}
            {config && `\nTag mappings: appTag="${config.fieldMappings.appTag}", appName="${config.fieldMappings.appName}", tier="${config.fieldMappings.tier}", owner="${config.fieldMappings.owner}"`}
            {"\n"}
            Query: {query}
          </pre>
        </details>
        <a href="/setup" style={{ marginTop: "20px", display: "inline-block", color: "#0051ba" }}>
          ← Go back to Setup
        </a>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: "20px" }}>
        <Heading level={1}>Application Overview</Heading>
        <Paragraph>
          No configuration found. Please complete the setup wizard to define your tag mappings.
        </Paragraph>
        <a href="/setup" style={{ marginTop: "20px", display: "inline-block", color: "#0051ba" }}>
          Go to Setup →
        </a>
      </div>
    );
  }

  const applicationData: AppRow[] = (data?.records || []) as AppRow[];
  const { appTag, appName, tier, owner } = config.fieldMappings;

  return (
    <div style={{ padding: "20px" }}>
      <Heading level={1}>Application Overview</Heading>
      <Paragraph>
        Applications tagged with <code>{appTag}</code>, <code>{appName}</code>, <code>{tier}</code>, <code>{owner}</code>.
        Found {applicationData.length} entities.
      </Paragraph>

      {applicationData.length === 0 ? (
        <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#fff3cd", borderRadius: "4px" }}>
          <p style={{ margin: "0", color: "#856404" }}>
            ⚠️ No entities found with these tag keys. Try:
          </p>
          <ul style={{ margin: "8px 0 0 0", color: "#856404" }}>
            <li>Tag a few hosts in Dynatrace (Infrastructure → Hosts → Edit tags)</li>
            <li>Use the exact tag keys you defined: {appTag}, {appName}, {tier}, {owner}</li>
            <li>Return here after tagging (the page auto-refreshes every 30 seconds)</li>
          </ul>
        </div>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              border: "1px solid #ddd",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "12px", textAlign: "left", borderRight: "1px solid #ddd", fontWeight: "bold" }}>
                  {appName}
                </th>
                <th style={{ padding: "12px", textAlign: "left", borderRight: "1px solid #ddd", fontWeight: "bold" }}>
                  {tier}
                </th>
                <th style={{ padding: "12px", textAlign: "left", borderRight: "1px solid #ddd", fontWeight: "bold" }}>
                  {owner}
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>
                  App Tag
                </th>
              </tr>
            </thead>
            <tbody>
              {applicationData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px", borderRight: "1px solid #ddd" }}>{row.appName || "-"}</td>
                  <td style={{ padding: "12px", borderRight: "1px solid #ddd" }}>{row.tier || "-"}</td>
                  <td style={{ padding: "12px", borderRight: "1px solid #ddd" }}>{row.owner || "-"}</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px", color: "#666" }}>
                    {row.appTag || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "40px", padding: "16px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
        <Heading level={3}>💡 Phase 1 to Phase 2</Heading>
        <p style={{ margin: "8px 0", fontSize: "14px" }}>
          This table currently shows entities with <strong>tags</strong>. In Phase 2, you can swap to a <strong>lookup table</strong> (for CMDB data) by:
        </p>
        <ol style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
          <li>Creating a lookup table in Dynatrace (via workflow sync from your CMDB)</li>
          <li>Updating config to use <code>dataSourceType: "lookup"</code></li>
          <li><strong>This page renders identically</strong> — no UI changes needed</li>
        </ol>
      </div>
    </div>
  );
};

export default Overview;
