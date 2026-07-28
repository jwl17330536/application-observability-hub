/**
 * Standard field mapping schema
 * Defines the 4 core fields all data sources must support
 */

export interface StandardFieldMapping {
  appTag: {
    name: "appTag";
    label: "Application Tag";
    description: "Unique identifier for the application (e.g., CentralID, app_id)";
    placeholder: "e.g., app.tag or CentralID";
  };
  appName: {
    name: "appName";
    label: "Application Name";
    description: "Display name for the application";
    placeholder: "e.g., app.name or AppName";
  };
  tier: {
    name: "tier";
    label: "Tier";
    description: "Business criticality tier (e.g., Business Critical, Business Essential)";
    placeholder: "e.g., app.tier or BIA";
  };
  owner: {
    name: "owner";
    label: "Owner";
    description: "Owner or responsible team for the application";
    placeholder: "e.g., app.owner or UnitCIO";
  };
}

export const STANDARD_FIELDS: StandardFieldMapping = {
  appTag: {
    name: "appTag",
    label: "Application Tag",
    description: "Unique identifier for the application (e.g., CentralID, app_id)",
    placeholder: "e.g., app.tag or CentralID",
  },
  appName: {
    name: "appName",
    label: "Application Name",
    description: "Display name for the application",
    placeholder: "e.g., app.name or AppName",
  },
  tier: {
    name: "tier",
    label: "Tier",
    description: "Business criticality tier (e.g., Business Critical, Business Essential)",
    placeholder: "e.g., app.tier or BIA",
  },
  owner: {
    name: "owner",
    label: "Owner",
    description: "Owner or responsible team for the application",
    placeholder: "e.g., app.owner or UnitCIO",
  },
};
