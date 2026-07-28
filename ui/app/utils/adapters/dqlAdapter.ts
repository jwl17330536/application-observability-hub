/**
 * DQL Adapter - Converts field mappings to custom DQL queries
 * Advanced mode: users provide DQL templates
 */

import { QuerySet } from "../queryBuilder";
import { substitutePlaceholders } from "../queryPlaceholders";

interface FieldMappings {
  appTag: string;
  appName: string;
  tier: string;
  owner: string;
}

// Default DQL templates (users can override)
const DQL_OVERVIEW_TEMPLATE = `
APPLICATION
| fieldsAdd
    app_tag = "$APP_TAG_FIELD",
    app_name = "$APP_NAME_FIELD",
    tier = "$TIER_FIELD",
    owner = "$OWNER_FIELD"
| limit 500
`;

const DQL_TRACE_CANDIDATES_TEMPLATE = `
smartscapeNodes "HOST"
| fieldsAdd
    tier = "$TIER_FIELD",
    owner = "$OWNER_FIELD"
| limit 100
`;

const DQL_HEALTH_REPORT_TEMPLATE = `
APPLICATION
| fieldsAdd tier = "$TIER_FIELD"
| groupBy tier, collect(applicationId = id)
| limit 10
`;

export const dqlAdapter = {
  buildQueries(mappings: FieldMappings): QuerySet {
    const allMappings = {
      app_tag_field: mappings.appTag,
      app_name_field: mappings.appName,
      tier_field: mappings.tier,
      owner_field: mappings.owner,
    };

    return {
      overview: substitutePlaceholders(DQL_OVERVIEW_TEMPLATE, allMappings),
      traceCandidates: substitutePlaceholders(DQL_TRACE_CANDIDATES_TEMPLATE, allMappings),
      healthReport: substitutePlaceholders(DQL_HEALTH_REPORT_TEMPLATE, allMappings),
    };
  },
};
