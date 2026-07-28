/**
 * Lookup Verification Utilities
 * Test that lookup tables exist and contain data
 */

export interface LookupStatus {
  name: string;
  exists: boolean;
  recordCount: number;
  error?: string;
}

/**
 * Generate DQL query to test a lookup table
 * Returns record count if table exists and has data
 */
export function generateLookupTestQuery(lookupName: string): string {
  return `load "${lookupName}" | limit 1 | fields record_count = count() | append [fetch dt.entity.host | limit 0]`;
}

/**
 * Generate comprehensive lookup verification query
 * Tests all three lookup tables and returns record counts
 */
export function generateAllLookupsTestQuery(): string {
  return `
    fetch dt.entity.host
    | fields
        ba_count = 0, srv_count = 0, fm_count = 0
    | append [
        load "/lookups/cmdb_businessapp"
        | fields ba_count = count()
      ]
    | append [
        load "/lookups/cmdb_server"
        | fields srv_count = count()
      ]
    | append [
        load "/lookups/cmdb_app_frontend_mapping"
        | fields fm_count = count()
      ]
    | summarize {
        total_ba = max(ba_count),
        total_srv = max(srv_count),
        total_fm = max(fm_count)
      }
  `;
}

/**
 * Parse DQL query results to extract lookup counts
 */
export function parseLookupVerificationResults(
  result: any
): LookupStatus[] {
  const statuses: LookupStatus[] = [
    { name: "cmdb_businessapp", exists: false, recordCount: 0 },
    { name: "cmdb_server", exists: false, recordCount: 0 },
    { name: "cmdb_app_frontend_mapping", exists: false, recordCount: 0 },
  ];

  try {
    if (Array.isArray(result?.records)) {
      const record = result.records[0];
      if (record) {
        statuses[0].recordCount = record.total_ba || 0;
        statuses[0].exists = statuses[0].recordCount > 0;
        statuses[1].recordCount = record.total_srv || 0;
        statuses[1].exists = statuses[1].recordCount > 0;
        statuses[2].recordCount = record.total_fm || 0;
        statuses[2].exists = statuses[2].recordCount > 0;
      }
    }
  } catch (error) {
    return statuses.map((s) => ({
      ...s,
      error: "Failed to parse verification results",
    }));
  }

  return statuses;
}

/**
 * Verify lookup tables via Dynatrace Query API
 * Requires valid Dynatrace token in environment
 */
export async function verifyLookupsViaAPI(
  tenant: string,
  token: string
): Promise<LookupStatus[]> {
  const query = generateAllLookupsTestQuery();

  try {
    const response = await fetch(`${tenant}/api/v2/dql/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Token ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`DQL query failed: ${response.statusText}`);
    }

    const result = await response.json();
    return parseLookupVerificationResults(result);
  } catch (error) {
    console.error("Lookup verification failed:", error);
    return [
      {
        name: "cmdb_businessapp",
        exists: false,
        recordCount: 0,
        error: String(error),
      },
      {
        name: "cmdb_server",
        exists: false,
        recordCount: 0,
        error: String(error),
      },
      {
        name: "cmdb_app_frontend_mapping",
        exists: false,
        recordCount: 0,
        error: String(error),
      },
    ];
  }
}
