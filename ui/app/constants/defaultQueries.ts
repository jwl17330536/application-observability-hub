/**
 * Default/example configuration values
 * Used for development and testing
 */

export const DEFAULT_TAG_MAPPINGS = {
  appTag: "app.tag",
  appName: "app.name",
  tier: "app.tier",
  owner: "app.owner",
};

export const DEFAULT_LOOKUP_MAPPINGS = {
  appTag: "CentralID",
  appName: "AppName",
  tier: "BIA",
  owner: "UnitCIO",
};

export const EXAMPLE_AVAILABLE_TAGS = [
  "app.tag",
  "app.name",
  "app.tier",
  "app.owner",
  "cost.center",
  "environment",
];

export const EXAMPLE_AVAILABLE_LOOKUP_COLUMNS = [
  "CentralID",
  "AppName",
  "BIA",
  "UnitCIO",
  "Location",
  "Status",
];
