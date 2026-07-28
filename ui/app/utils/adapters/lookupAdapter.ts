/**
 * Lookup Adapter - Converts field mappings to lookup-based DQL queries
 * Uses CMDB lookup tables synced via observability-health-cmdb-lookup-sync-workflow-v2.yaml
 * 
 * Lookup tables (deployed by dynatrace-cmdb-app):
 * - /lookups/cmdb_businessapp (key: cmdb_ci_key)
 * - /lookups/cmdb_server (key: cmdb_ci_key, join via busapp_cmdb_ci_key)
 * - /lookups/cmdb_app_frontend_mapping (key: mapping_key, join via app_cmdb_ci_key)
 * 
 * Synced hourly from CMDB simulator (cmdb.lindleyhome.com:8088)
 */

import { QuerySet } from "../queryBuilder";
import { substitutePlaceholders } from "../queryPlaceholders";

interface FieldMappings {
  appTag: string;
  appName: string;
  tier: string;
  owner: string;
}

/**
 * Overview query: Application Inventory with Dynatrace coverage.
 * Pattern from Observability Health Dashboard v9 Tile 4.
 */
const LOOKUP_OVERVIEW_TEMPLATE = `
load "/lookups/cmdb_businessapp"
| fields
    app_key = cmdb_ci_key,
    \`Application\` = name,
    AppShortName = short_name,
    owner = owned_by,
    tier = business_criticality,
    \`Business Unit\` = dv_business_unit,
    Status = dv_operational_status
| lookup [
    load "/lookups/cmdb_server"
    | fields app_key = busapp_cmdb_ci_key, server_name = lower(name), server_location = location
    | lookup [
        fetch dt.entity.host
        | fields id, entity.name, monitoringMode, paasVendorType, isMonitoringCandidate
        | fieldsAdd monitoringMode = if(isNotNull(paasVendorType), then:"APP_ONLY", else:if(isMonitoringCandidate == true, then:"CANDIDATE", else:monitoringMode))
        | parse entity.name, """LD:hostname ('.' LD:domain)? EOS"""
        | fieldsAdd server_name = lower(hostname)
        | fields server_name, monitoringMode
      ], sourceField:server_name, lookupField:server_name, fields:{monitoringMode}
  ], sourceField:app_key, lookupField:app_key, fields:{server_name, server_location, monitoringMode}
| fieldsAdd monitoringMode = coalesce(monitoringMode, "Not Monitored")
| summarize
    cmdb_count = countDistinct(server_name),
    dt_count = sum(if(isNotNull(monitoringMode) AND monitoringMode != "Not Monitored", then:1, else:0)),
    by:{app_key, \`Application\`, AppShortName, owner, tier, Status, \`Business Unit\`}
| fieldsAdd
    dt_count = coalesce(dt_count, 0),
    cmdb_count = coalesce(cmdb_count, 0),
    \`Gap\` = cmdb_count - dt_count,
    \`Coverage %\` = if(cmdb_count == 0, then:0, else:round(100.0 * dt_count / cmdb_count))
| fieldsAdd
    \`Traces %\` = 0,
    \`Metrics %\` = 0,
    \`Logs %\` = 0,
    \`Signal Health\` = if(\`Coverage %\` == 100, then:"🟢", else:if(\`Coverage %\` >= 50, then:"🟡", else:"🔴"))
| sort \`Gap\` desc, \`Application\` asc
| fields \`Application\`, tier, owner, Status, \`CMDB Servers\` = cmdb_count, \`Monitored\` = dt_count, \`Gap\`, \`Coverage %\`, \`Traces %\`, \`Metrics %\`, \`Logs %\`, \`Signal Health\`
`;

/**
 * Trace candidates query: Hosts in CMDB with Dynatrace monitoring readiness.
 * Pattern from Observability Health Dashboard v9 Tile 7.
 */
const LOOKUP_TRACE_CANDIDATES_TEMPLATE = `
load "/lookups/cmdb_businessapp"
| fields app_key = cmdb_ci_key, \`Application\` = name
| lookup [
    load "/lookups/cmdb_server"
    | fields app_key = busapp_cmdb_ci_key, server_name = lower(name)
    | lookup [
        fetch dt.entity.host
        | fields id, entity.name, monitoringMode, paasVendorType, isMonitoringCandidate
        | fieldsAdd monitoringMode = if(isNotNull(paasVendorType), then:"APP_ONLY", else:if(isMonitoringCandidate == true, then:"CANDIDATE", else:monitoringMode))
        | parse entity.name, """LD:hostname ('.' LD:domain)? EOS"""
        | fieldsAdd server_name = lower(hostname)
      ], sourceField:server_name, lookupField:server_name, fields:{monitoringMode}
  ], sourceField:app_key, lookupField:app_key, fields:{server_name, monitoringMode}
| fieldsAdd monitoringMode = coalesce(monitoringMode, "Not Monitored")
| filter monitoringMode != "Not Monitored"
| fields \`Application\`, \`Server\` = server_name, \`Monitoring Mode\` = monitoringMode
| sort \`Server\` asc
`;

/**
 * Health report query: CMDB vs Dynatrace coverage by tier.
 * Aggregated view for KPI dashboard.
 */
const LOOKUP_HEALTH_REPORT_TEMPLATE = `
load "/lookups/cmdb_businessapp"
| fields app_key = cmdb_ci_key, \`Application\` = name, tier = business_criticality
| summarize
    cmdb_total = countDistinct(\`Application\`),
    by:{tier}
| lookup [
    load "/lookups/cmdb_businessapp"
    | fields app_key = cmdb_ci_key, tier = business_criticality
    | lookup [
        load "/lookups/cmdb_server"
        | fields app_key = busapp_cmdb_ci_key, server_name = lower(name)
        | lookup [
            fetch dt.entity.host
            | fields id, entity.name, monitoringMode, paasVendorType, isMonitoringCandidate
            | fieldsAdd monitoringMode = if(isNotNull(paasVendorType), then:"APP_ONLY", else:if(isMonitoringCandidate == true, then:"CANDIDATE", else:monitoringMode))
            | parse entity.name, """LD:hostname ('.' LD:domain)? EOS"""
            | fieldsAdd server_name = lower(hostname)
            | fields server_name, monitoringMode
          ], sourceField:server_name, lookupField:server_name, fields:{monitoringMode}
      ], sourceField:app_key, lookupField:app_key, fields:{server_name, monitoringMode}
    | fieldsAdd monitoringMode = coalesce(monitoringMode, "Not Monitored")
    | filter monitoringMode != "Not Monitored"
    | summarize dt_count = countDistinct(\`Application\`), by:{tier}
  ], sourceField:tier, lookupField:tier, fields:{dt_count}
| fieldsAdd dt_count = coalesce(dt_count, 0)
| fieldsAdd coverage_pct = if(cmdb_total == 0, then:0, else:round(100.0 * dt_count / cmdb_total))
| fields tier, \`CMDB Total\` = cmdb_total, \`Monitored in DT\` = dt_count, \`Coverage %\` = coverage_pct
| sort tier asc
`;

export const lookupAdapter = {
  buildQueries(mappings: FieldMappings): QuerySet {
    // Note: Field mappings are for flexibility; lookup adapter uses fixed CMDB field names
    // Placeholders are substituted but queries use canonical CMDB schema
    const mappingsRecord = mappings as unknown as Record<string, string>;
    return {
      overview: substitutePlaceholders(LOOKUP_OVERVIEW_TEMPLATE, mappingsRecord),
      traceCandidates: substitutePlaceholders(LOOKUP_TRACE_CANDIDATES_TEMPLATE, mappingsRecord),
      healthReport: substitutePlaceholders(LOOKUP_HEALTH_REPORT_TEMPLATE, mappingsRecord),
    };
  },
};
