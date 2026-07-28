/**
 * Tags Adapter - Converts field mappings to tag-based DQL queries
 * Phase 1 implementation
 */

import { QuerySet } from "../queryBuilder";
import { substitutePlaceholders } from "../queryPlaceholders";

interface FieldMappings {
  appTag: string;
  appName: string;
  tier: string;
  owner: string;
}

// Query templates with placeholders
const TAGS_OVERVIEW_TEMPLATE = `
APPLICATION
| fieldsAdd
    app_tag = toString(getTagValue(id, "$APP_TAG_FIELD")),
    app_name = toString(getTagValue(id, "$APP_NAME_FIELD")),
    tier = toString(getTagValue(id, "$TIER_FIELD")),
    owner = toString(getTagValue(id, "$OWNER_FIELD"))
| fieldsAdd
    has_traces = countIf(toString(getTagValue(id, "instrumentedWithDtTrace")) == "true") > 0,
    metric_count = 0,
    log_count = 0,
    has_rum = countIf(toString(getTagValue(id, "rum.enabled")) == "true") > 0
| sort app_name asc
| limit 500
`;

const TAGS_TRACE_CANDIDATES_TEMPLATE = `
smartscapeNodes "HOST"
| fieldsAdd
    tier = toString(getNodeField(id, "$TIER_FIELD")),
    owner = toString(getNodeField(id, "$OWNER_FIELD")),
    process_count = 0,
    candidate_type = "host"
| filter getNodeField(id, "monitoring.mode") != "OFF"
| sort process_count desc
| limit 100
`;

const TAGS_HEALTH_REPORT_TEMPLATE = `
APPLICATION
| fieldsAdd
    tier = toString(getTagValue(id, "$TIER_FIELD")),
    owner = toString(getTagValue(id, "$OWNER_FIELD")),
    has_traces = countIf(toString(getTagValue(id, "instrumentedWithDtTrace")) == "true") > 0
| groupBy tier, collect(has_traces)
| limit 10
`;

export const tagsAdapter = {
  buildQueries(mappings: FieldMappings): QuerySet {
    const overviewMappings = {
      app_tag_field: mappings.appTag,
      app_name_field: mappings.appName,
      tier_field: mappings.tier,
      owner_field: mappings.owner,
    };

    const traceMappings = {
      tier_field: mappings.tier,
      owner_field: mappings.owner,
    };

    const healthMappings = {
      tier_field: mappings.tier,
      owner_field: mappings.owner,
    };

    return {
      overview: substitutePlaceholders(TAGS_OVERVIEW_TEMPLATE, overviewMappings),
      traceCandidates: substitutePlaceholders(TAGS_TRACE_CANDIDATES_TEMPLATE, traceMappings),
      healthReport: substitutePlaceholders(TAGS_HEALTH_REPORT_TEMPLATE, healthMappings),
    };
  },
};
