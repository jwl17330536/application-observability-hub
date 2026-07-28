# Application Observability Hub

A configurable, reusable Dynatrace Hub App for multi-tenant application observability with flexible data source support (tags, lookups, or custom DQL).

## Overview

**Application Observability Hub** enables organizations to define how their application metadata maps to Dynatrace observability data. Once configured, the app renders a unified dashboard showing all applications with tier, owner, and monitoring status.

## Current Phase

**Phase 1 MVP (Tags-Based)** — Simplest approach for sprint validation
- Query Dynatrace entities with user-defined tags
- 4-field mapping (appTag, appName, tier, owner)
- Setup wizard: Enter tag names → Rendered table
- Built-in Document Store persistence
- Foundation for Phase 2 lookup/CMDB pivot (zero UI code changes)

## Key Features

✅ **Flexible, Scalable Architecture**
- Data source adapter pattern: swap tags ↔ lookup ↔ DQL without changing visualization code
- Phase 1: Tags (3 min setup)
- Phase 1.5: Lookup validation (1 hr to prove pattern works)
- Phase 2: CMDB sync via workflow (production ready)

✅ **Simple User Onboarding**
- No file uploads (tags) or complex CSV validation
- Just 4 text inputs: "What tag keys contain app name, tier, owner?"
- Auto-save to Document Store with localStorage fallback

✅ **Multi-Tenant Support**
- Per-tenant config in Document Store
- Tenant selector in UI (if needed)
- Same Hub App code runs everywhere

✅ **Validation & Error Handling**
- Helpful errors: "Field 'app.missing' not found. Available tags: [app.tag, app.name, app.tier, app.owner]"
- Test Query button before saving config
- Debug panel shows query structure

## Getting Started (5 minutes)

### 1. Tag Some Hosts in Dynatrace

```bash
# In Dynatrace UI:
# Infrastructure → Hosts → [Select a host] → Edit tags

# Add these tags:
app.tag=myapp1
app.name=My Application
app.tier=Business Critical
app.owner=Platform Team
```

### 2. Deploy the Hub App

```bash
git clone <repo>
cd application-observability-hub
npm install
npm run build
# Deploy to your Dynatrace tenant via dt-app or UI upload
```

### 3. Configure via Setup Wizard

- Open Hub App
- Click "Setup" (if config missing)
- Enter tag names: `app.tag`, `app.name`, `app.tier`, `app.owner`
- Click "Save & Continue"
- View Overview table with tagged hosts

## Architecture

### Data Flow (Phase 1: Tags)

```
User tags 5-10 hosts with: app.tag, app.name, app.tier, app.owner
    ↓
Setup wizard collects tag names
    ↓
Config saved to Document Store
    ↓
Overview page:
  1. Fetch config from Document Store
  2. Build DQL: fetch dt.entity.host | filter tags["app.tag"] != null | fields tags[*]
  3. Execute query
  4. Render generic table from results
```

### Phase 2: Lookup Adapter (Zero UI Changes)

Same table, different query:
```
fetch data from table "applications"
| fields appTag = this["app_id"], appName = this["app_name"], tier = this["tier"], owner = this["owner"]
```

**See [PHASE_2_ARCHITECTURE.md](./PHASE_2_ARCHITECTURE.md) for details on how to extend to CMDB lookups.**

## Configuration

### Setup Wizard

**Step 1: Choose Data Source**
- Currently: Tags (Phase 1 MVP)
- Future: Lookup Table, Custom DQL

**Step 2: Map 4 Fields**
- Application Tag (unique identifier) → e.g., `app.tag`
- Application Name → e.g., `app.name`
- Tier → e.g., `app.tier`
- Owner → e.g., `app.owner`

**Step 3: Save & View Overview**
- Config persisted to Document Store
- Table shows all entities with those tags

## Project Structure

```
application-observability-hub/
├── ui/app/
│   ├── pages/
│   │   ├── Home.tsx              # Entry point → Setup or Overview
│   │   ├── Setup.tsx             # Configuration wizard (tags-only)
│   │   ├── Overview.tsx          # Generic table from tag/lookup data
│   │   └── ...
│   ├── hooks/
│   │   ├── useMappingConfig.ts   # Fetch config from Document Store
│   │   └── useMultiQueryResults.ts # Execute 3 DQL queries in parallel (Phase 2)
│   ├── utils/
│   │   ├── documentStore.ts      # Document Store API + localStorage fallback
│   │   └── adapters/
│   │       ├── tagsAdapter.ts    # Phase 1: Convert tags to DQL
│   │       ├── lookupAdapter.ts  # Phase 2: Convert lookups to DQL (not yet active)
│   │       └── dqlAdapter.ts     # Phase 2+: Custom DQL support
│   └── App.tsx                   # Router
├── app.config.json               # Hub App manifest
├── package.json
├── IMPLEMENTATION_PLAN.md        # Execution roadmap
├── PHASE_2_ARCHITECTURE.md       # How to extend to lookups
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests (if added)
npm test

# Lint code
npm run lint
```

## Deployment
   - **Application Tag** (lookup key, e.g., `app.tag` or `CentralID`)
   - **Application Name** (display name, e.g., `app.name` or `AppName`)
   - **Tier** (criticality, e.g., `app.tier` or `BIA`)
   - **Owner** (responsible team, e.g., `app.owner` or `UnitCIO`)

3. **Test & Save**
   - Click "Test Query" to validate
   - Configuration stored in Document Store (shared across org)

### Data Source Examples

**Tags-Based (Fastest)**
```
HOST (or APPLICATION)
  - app.tag: "jira"
  - app.name: "Jira Production"
  - app.tier: "Business Critical"
  - app.owner: "Platform Team"
```

**Lookup-Based (Enterprise)**
```
Table: cmdb_apps
Columns: CentralID, AppName, BIA, UnitCIO
```

**DQL-Based (Advanced)**
```dql
APPLICATION
| fieldsAdd tier = tostring(getTagValue(id, "app.tier"))
| fieldsAdd owner = tostring(getTagValue(id, "app.owner"))
```

## Architecture

### Data Source Adapters

All visualizations use the same query output schema, enabling swappable data sources:

```
User Config (data_source_type + field_mappings)
    ↓
Adapter (tags / lookup / dql) converts to DQL
    ↓
Parallel Query Execution (3 queries)
    ↓
Result Merge & Validation
    ↓
Visualizations (no adapter awareness)
```

### Folder Structure

```
application-observability-hub/
├── ui/app/
│   ├── pages/
│   │   ├── Home.tsx                    (app entry point)
│   │   ├── Onboarding.tsx              (setup flow)
│   │   ├── Overview.tsx                (app table visualization)
│   │   ├── TraceCandidates.tsx         (tracing analysis)
│   │   ├── HealthReport.tsx            (coverage metrics)
│   │   └── Settings.tsx                (config management)
│   ├── components/
│   │   ├── MappingForm.tsx             (field mapping UI)
│   │   ├── TenantSelector.tsx          (multi-tenant dropdown)
│   │   ├── QueryBuilder.tsx            (debug/test tool)
│   │   └── StatusPill.tsx              (health indicators)
│   ├── queries/
│   │   ├── overviewQuery.ts            (query template)
│   │   ├── traceCandidatesQuery.ts
│   │   ├── healthReportQuery.ts
│   │   └── querySubstitution.ts        (placeholder logic)
│   ├── hooks/
│   │   ├── useMappingConfig.ts         (fetch/cache config)
│   │   └── useMultiQueryResults.ts     (parallel execution)
│   ├── utils/
│   │   ├── adapters/
│   │   │   ├── tagsAdapter.ts
│   │   │   ├── lookupAdapter.ts
│   │   │   └── dqlAdapter.ts
│   │   ├── documentStore.ts            (config persistence)
│   │   └── entityLinks.ts              (OneAgent navigation)
│   └── constants/
│       ├── mappingSchema.ts            (field definitions)
│       └── defaultQueries.ts
├── scripts/
├── package.json
├── app.config.json
├── tsconfig.json
└── README.md
```

## Development

### Local Development

```bash
npm run dev
# Opens dev server at http://localhost:3000
```

### Building

```bash
npm run build
# Output in dist/
```

### Linting & Type Checking

```bash
npm run lint
npm run type-check
```

## Token Validation

The app validates your Dynatrace platform token at startup:

- ✅ Checks Document Store access (read/write)
- ✅ Verifies required scopes
- ✅ Falls back to localStorage if Document Store unavailable
- ⚠️ Shows helpful errors if token issues detected

## Troubleshooting

### "Field 'X' not found"
The field you entered in the mapping doesn't exist in your data source. Check:
- Tag name is correct (e.g., `app.tier` not `app.tier_level`)
- Tag exists on your entities (via Host/App detail pages)
- Lookup column name is spelled correctly

### Document Store unavailable
Configuration falls back to browser localStorage. Mappings will be lost if you clear your browser cache or use a different browser/device.

### No data in visualizations
- Verify entities are tagged with all 4 required fields
- Check field mappings in Settings
- Use "Test Query" button to debug

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

Apache 2.0 — See [LICENSE](./LICENSE)

## Support

For issues, questions, or feature requests, open an issue on GitHub.
