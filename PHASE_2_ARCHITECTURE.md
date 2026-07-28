# Phase 2 Architecture: Lookup Pivot (No UI Changes)

**Goal:** Validate that the adapter pattern works—swap from tags to lookups with zero visualization code changes.

---

## How the Adapter Pattern Works

### Current (Phase 1): Tags Adapter

```typescript
// ui/app/utils/adapters/tagsAdapter.ts
export const tagsAdapter = {
  buildQueries(fieldMappings: FieldMappings): QuerySet {
    return {
      overview: `
        fetch dt.entity.host
        | filter tags["${fieldMappings.appTag}"] != null
        | fields 
            appTag = tags["${fieldMappings.appTag}"],
            appName = tags["${fieldMappings.appName}"],
            tier = tags["${fieldMappings.tier}"],
            owner = tags["${fieldMappings.owner}"]
      `
    };
  }
};
```

### Phase 2: Lookup Adapter (Identical Interface)

```typescript
// ui/app/utils/adapters/lookupAdapter.ts
export const lookupAdapter = {
  buildQueries(fieldMappings: FieldMappings, lookupTableName: string): QuerySet {
    return {
      overview: `
        fetch data from table "${lookupTableName}"
        | fields 
            appTag = this["${fieldMappings.appTag}"],
            appName = this["${fieldMappings.appName}"],
            tier = this["${fieldMappings.tier}"],
            owner = this["${fieldMappings.owner}"]
      `
    };
  }
};
```

### Visualization Code (Same for Both)

```tsx
// ui/app/pages/Overview.tsx (unchanged between Phase 1 & 2)
const query = useMemo(() => {
  if (!config) return null;
  
  const adapter = config.dataSourceType === "tags" 
    ? tagsAdapter 
    : lookupAdapter;
  
  return adapter.buildQueries(config.fieldMappings).overview;
}, [config]);

const { result } = useDql({ query: query || "" });
// Render table from result.records
```

**Key:** The table rendering **never changes**. Only the underlying query changes.

---

## Phase 1.5: Validation Steps

### Step 1: Create Lookup Table

In Dynatrace, manually create a lookup table `applications` with columns:
- `app_id` (key)
- `app_name`
- `tier`
- `owner`

Or via Document Store JSON:
```json
{
  "key": "data/table/applications",
  "data": [
    { "app_id": "app1", "app_name": "Jira", "tier": "Business Critical", "owner": "Platform Team" },
    { "app_id": "app2", "app_name": "Mail", "tier": "Business Essential", "owner": "Ops Team" }
  ]
}
```

### Step 2: Create `lookupAdapter.ts`

```typescript
// ui/app/utils/adapters/lookupAdapter.ts (NEW FILE)

export interface FieldMappings {
  appTag: string;
  appName: string;
  tier: string;
  owner: string;
}

export interface QuerySet {
  overview: string;
}

export const lookupAdapter = {
  buildQueries(
    fieldMappings: FieldMappings,
    lookupTableName: string = "applications"
  ): QuerySet {
    return {
      overview: `
        fetch data from table "${lookupTableName}"
        | fields 
            appTag = this["${fieldMappings.appTag}"],
            appName = this["${fieldMappings.appName}"],
            tier = this["${fieldMappings.tier}"],
            owner = this["${fieldMappings.owner}"]
        | sort by appTag
      `,
    };
  },
};
```

### Step 3: Update Setup.tsx

Add new option in Setup wizard (optional for Phase 1.5, required for Phase 2):
```tsx
// Step: Select Data Source
<div>
  <label>Data Source Type:</label>
  <select value={state.formData.dataSourceType} onChange={(e) => handleInputChange("dataSourceType", e.target.value)}>
    <option value="tags">Dynatrace Tags (Phase 1)</option>
    <option value="lookup">Lookup Table (Phase 2)</option>
  </select>
</div>

// If lookup selected, show additional field
{formData.dataSourceType === "lookup" && (
  <div>
    <label>Lookup Table Name:</label>
    <input type="text" placeholder="applications" />
  </div>
)}
```

### Step 4: Update Config Structure

```typescript
// ui/app/utils/documentStore.ts

export interface MappingConfig {
  dataSourceType: "tags" | "lookup" | "dql";
  fieldMappings: {
    appTag: string;
    appName: string;
    tier: string;
    owner: string;
  };
  lookupTableName?: string; // Only if dataSourceType === "lookup"
}
```

### Step 5: Update Overview.tsx Query Logic

```tsx
// In useMemo that builds query:
const query = useMemo(() => {
  if (!config) return null;
  
  const { appTag, appName, tier, owner } = config.fieldMappings;
  
  if (config.dataSourceType === "tags") {
    return `
      fetch dt.entity.host
      | filter tags["${appTag}"] != null
      | fields appTag = tags["${appTag}"], appName = tags["${appName}"], tier = tags["${tier}"], owner = tags["${owner}"]
    `;
  } else if (config.dataSourceType === "lookup") {
    const tableName = config.lookupTableName || "applications";
    return `
      fetch data from table "${tableName}"
      | fields appTag = this["${appTag}"], appName = this["${appName}"], tier = this["${tier}"], owner = this["${owner}"]
    `;
  }
  
  return null;
}, [config]);
```

### Step 6: Test

1. **Phase 1 baseline:** Tag 5 hosts, run Setup with tags data source, verify Overview shows 5 rows
2. **Lookup config:** Manually create lookup table with 5 rows, update Setup config to `dataSourceType: "lookup"`, point to lookup table
3. **Validate:** Overview should show **identical 5 rows, same format, no UI changes**

---

## Production Readiness (Phase 2)

Once Phase 1.5 validation passes:

1. **Automate CMDB Sync:**
   - Create Dynatrace workflow that fetches from CMDB API
   - Transforms into lookup table format: `{ app_id, app_name, tier, owner }`
   - Uploads to lookup table `cmdb_applications` (production)

2. **Update Hub App Config:**
   - `dataSourceType: "lookup"`
   - `lookupTableName: "cmdb_applications"`
   - `fieldMappings: { appTag: "app_id", appName: "app_name", tier: "tier", owner: "owner" }`

3. **Deploy to Amex Production:**
   - Same Hub App code (built once in Phase 1)
   - Different config per tenant (different lookup table names, field mappings)
   - Config stored in Document Store, shareable across users

---

## Benefits of This Architecture

| Phase | Data Source | Setup Time | Scalability | Multi-Tenant |
|-------|-------------|------------|-------------|--------------|
| **Phase 1 (Current)** | Tags | 5 min | Limited (tag-based only) | Yes (per tenant's tags) |
| **Phase 1.5** | Single Lookup | 1 hr | High (any CMDB structure) | Yes (upload different CSVs per tenant) |
| **Phase 2** | Automated CMDB Lookup | 1 hr setup | High (hourly sync) | Yes (different CMDB URLs per tenant) |

**UI Code:** Identical across all phases. Only adapters and config change.

---

## Files to Create/Modify for Phase 1.5

- ✅ `ui/app/utils/adapters/lookupAdapter.ts` — NEW
- ⚠️ `ui/app/pages/Setup.tsx` — EXTEND (add "Data Source" selector)
- ⚠️ `ui/app/pages/Overview.tsx` — MODIFY (add lookup query logic)
- ⚠️ `ui/app/utils/documentStore.ts` — EXTEND (add lookupTableName to config)

**Test:** Create lookup table → Change config → Verify Overview renders identically

---

## Next Steps

1. **Phase 1 MVP Validation:** Deploy tags version to sprint tenant, test with tagged hosts
2. **Phase 1.5 Validation:** Build lookupAdapter, test with manual lookup table (proves pattern works)
3. **Phase 2 Production:** Wire CMDB sync workflow, activate for Amex production rollout
