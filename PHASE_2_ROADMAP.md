# Phase 2: CMDB Integration & Production Hardening

**Status:** Planning & Ready for Post-Phase-1-Validation  
**Estimated Duration:** 4-5 weeks  
**Dependencies:** Phase 1 ✅ validated in sprint tenant

---

## Executive Summary

Phase 2 pivots the application from tags-based (Phase 1) to CMDB-backed lookup table support, without changing any visualization code. This document outlines the complete implementation roadmap.

### Why Phase 2?

- ✅ Phase 1 proves scalability (adapter pattern works)
- ✅ Tags are great for PoC, but CMDB is source of truth for production
- ✅ Lookup tables enable periodic sync (not real-time tag changes)
- ✅ Foundation for Phase 3 (multi-tenant, advanced analytics)

---

## Phase 2 Roadmap (4 Weeks)

### Week 1: Lookup Adapter Full Implementation

**Goal:** Complete lookupAdapter with all three query types (overview, traceCandidates, healthReport)

#### Tasks:

1. **Implement traceCandidates Query**
   - Query: Find hosts in lookup table that are candidates for tracing
   - Pattern: Left join lookup table with dt.entity.host
   - Result: List of { app_id, app_name, host_id, monitoring_mode }
   
   ```dql
   fetch data from table "applications"
   | lookup [
       fetch dt.entity.host
       | fields id, entity.name
     ], sourceField: app_id, lookupField: ...?
   ```

2. **Implement healthReport Query**
   - Query: Coverage analysis (how many apps have DT hosts?)
   - Pattern: Group by tier, count DT vs lookup records
   - Result: { tier, cmdb_total, dt_monitored, coverage_pct }

3. **Update Setup.tsx**
   - Add "Lookup Table" option to data source selector
   - Add input field for lookup table name
   - Validate table exists in Dynatrace (optional)

4. **Test Adapter Swap**
   - Confirm Overview renders identically
   - Confirm tables match in row count and column structure
   - Document test results

5. **Commit:** "Phase 2 Week 1: Complete lookupAdapter with all query types"

---

### Week 2: CMDB Workflow Implementation

**Goal:** Deploy workflow that syncs CMDB API → Dynatrace lookup table

#### Prerequisites:

- CMDB API credentials available (ServiceNow, custom endpoint, etc.)
- Dynatrace lookup table created: `applications` with schema
  ```
  Key: app_id
  Columns: app_name, tier, owner, business_unit, last_sync
  ```

#### Tasks:

1. **Create Workflow**
   - Template: `workflows/cmdb-sync-workflow-phase2.yaml` (already created)
   - Customize CMDB API endpoint (ServiceNow vs custom)
   - Customize field mappings in transform step
   - Configure error handling & notifications

2. **Test Workflow**
   - Manual trigger: Verify CMDB data fetches correctly
   - Verify transformation: Check output matches lookup schema
   - Verify upload: Confirm lookup table has correct data
   - Monitor sync time: Should complete in < 60s

3. **Schedule & Monitor**
   - Set to hourly schedule
   - Add monitoring alerts if sync fails
   - Track data freshness (last_sync column)

4. **Documentation**
   - Document CMDB API requirements
   - Document schema mapping
   - Create runbook for troubleshooting

5. **Commit:** "Phase 2 Week 2: Deploy CMDB sync workflow (hourly)"

---

### Week 3: Multi-Query Results & Health Report

**Goal:** Implement useMultiQueryResults hook for parallel DQL execution and result merging

#### Tasks:

1. **Implement useMultiQueryResults Hook**
   ```typescript
   // ui/app/hooks/useMultiQueryResults.ts
   
   interface MultiQueryResults {
     overview: AppRow[];
     traceCandidates: TraceCandidate[];
     healthReport: HealthMetric[];
   }
   
   export const useMultiQueryResults = (queries: QuerySet) => {
     // Execute 3 DQL queries in parallel
     // Merge results by app_id
     // Return combined { overview, traceCandidates, healthReport }
   };
   ```

2. **Add Trace Candidates Page**
   - Show hosts eligible for tracing
   - Filter by monitoring status
   - Show gaps (apps without hosts)

3. **Add Health Report Page**
   - Coverage table: tier breakdown
   - CMDB vs DT counts
   - Graphs: Coverage % by tier

4. **Update Navigation**
   - Add Trace Candidates link (optional for Phase 2)
   - Add Health Report link (optional for Phase 2)
   - Keep Overview as default

5. **Commit:** "Phase 2 Week 3: Add traceCandidates and health reports"

---

### Week 4: Production Hardening & Deployment

**Goal:** Make Phase 2 production-ready with error handling, performance optimization, monitoring

#### Tasks:

1. **Error Handling & Validation**
   - Handle missing lookup table gracefully
   - Handle CMDB API failures
   - Validate data integrity before upload
   - Retry logic with exponential backoff

2. **Performance Optimization**
   - Profile DQL query execution time
   - Add query result caching (30s TTL)
   - Optimize lookup table indexes
   - Measure memory usage

3. **Monitoring & Alerts**
   - Add metrics: Query execution time, error rate, cache hit rate
   - Create Dynatrace dashboard for hub app health
   - Set SLOs: 99% availability, <2s query time
   - Configure alerts for failures

4. **Documentation**
   - Update README.md with Phase 2 features
   - Create troubleshooting guide
   - Document limits and known issues
   - Create runbook for operators

5. **Security Review**
   - Audit API token usage
   - Verify data access controls
   - Check for data leaks
   - Review error messages (no sensitive info)

6. **Final Testing**
   - End-to-end test on sprint tenant
   - Load test: 1000 rows, 100 concurrent users
   - Failover test: CMDB API down → graceful degradation
   - Cleanup test: Old data purged after 90 days

7. **Commit & Release**
   - "Phase 2 Release: Production-ready CMDB integration"
   - Tag: v0.2.0

---

## Phase 2 Technical Architecture

### Data Flow

```
┌─────────────────────┐
│   CMDB System       │
│  (ServiceNow, etc)  │
└──────────┬──────────┘
           │
           │ REST API
           │ (Hourly via Workflow)
           ↓
┌──────────────────────────────┐
│  Dynatrace Lookup Table       │
│  "applications"              │
│  Key: app_id                 │
│  Columns:                    │
│  - app_name                  │
│  - tier                      │
│  - owner                     │
│  - business_unit             │
│  - last_sync                 │
└──────────┬───────────────────┘
           │
           │ DQL Query
           │
           ↓
┌──────────────────────────────┐
│   Hub App Setup              │
│   (Select Lookup Table)      │
│   - Table: applications      │
│   - Map columns to fields    │
└──────────┬───────────────────┘
           │
           │ Config saved to
           │ Document Store
           │
           ↓
┌──────────────────────────────┐
│   Overview Page              │
│   - Query adapter selects    │
│   - lookupAdapter.buildQ...  │
│   - Renders table (same code)│
│   - Result: App list with    │
│     coverage, traces, health │
└──────────────────────────────┘
```

### Query Pattern

**Phase 1 (Tags):**
```dql
fetch dt.entity.host
| filter tags["app.tag"] != null
| fields appTag = tags["app.tag"], ...
```

**Phase 2 (Lookup):**
```dql
fetch data from table "applications"
| fields appTag = this["app_id"], ...
```

**Key:** Both return identical result structure, same visualization code works for both.

---

## Phase 2 Success Criteria

### Code Quality
- [  ] npm run build passes (0 errors)
- [  ] All TypeScript types correct
- [  ] No import cycles
- [  ] 80%+ test coverage

### Functionality
- [  ] Setup wizard supports both tags and lookup
- [  ] Lookup table queries work correctly
- [  ] healthReport page shows coverage stats
- [  ] Trace candidates page shows eligible hosts
- [  ] Error messages are helpful and actionable

### Performance
- [  ] Overview query: < 2 seconds
- [  ] Health report: < 5 seconds
- [  ] Trace candidates: < 3 seconds
- [  ] Lookup table sync: < 60 seconds
- [  ] Memory usage: < 100MB

### Reliability
- [  ] 99% uptime (measured weekly)
- [  ] CMDB sync: 99% success rate
- [  ] Graceful degradation if CMDB unavailable
- [  ] Data integrity checks pass

### Deployment
- [  ] App deploys without errors
- [  ] Workflow deploys and runs on schedule
- [  ] Configuration migrates from Phase 1 → Phase 2
- [  ] Rollback procedure documented

### Documentation
- [  ] README updated (Phase 2 features)
- [  ] Runbook created (operations)
- [  ] Architecture doc updated
- [  ] FAQ added to SETUP_GUIDE.md

---

## Phase 2 Implementation Checklist

### Week 1: Lookup Adapter
- [  ] Implement traceCandidates query in lookupAdapter
- [  ] Implement healthReport query in lookupAdapter
- [  ] Update Setup.tsx UI for "Lookup Table" option
- [  ] Test adapter swap (Overview identical output)
- [  ] Commit & verify build passes

### Week 2: CMDB Workflow
- [  ] Customize cmdb-sync-workflow-phase2.yaml
- [  ] Test CMDB API connection
- [  ] Create/verify lookup table schema in Dynatrace
- [  ] Deploy workflow to production
- [  ] Verify first sync completes successfully
- [  ] Monitor sync metrics (time, record count, errors)

### Week 3: Multi-Query & Pages
- [  ] Implement useMultiQueryResults hook
- [  ] Add Trace Candidates page
- [  ] Add Health Report page
- [  ] Wire up navigation
- [  ] Test all three pages load correctly
- [  ] Verify results match expectations

### Week 4: Hardening & Release
- [  ] Add error handling & validation
- [  ] Optimize performance (profiling, caching)
- [  ] Add monitoring & alerts
- [  ] Security review & audit
- [  ] Load testing (1000 rows, 100 users)
- [  ] End-to-end testing
- [  ] Final documentation
- [  ] Tag v0.2.0 release

---

## Risk Mitigation

### Risk: CMDB API Unavailable
- **Mitigation:** Workflow handles failures, lookup table retains old data
- **User Experience:** App still works with stale data (shows last sync time)
- **Alert:** Slack/email notification if sync fails 3x in a row

### Risk: Lookup Table Schema Mismatch
- **Mitigation:** Validation in transform step checks all fields present
- **User Experience:** Sync fails safely, no partial data uploaded
- **Resolution:** Runbook guide for fixing schema

### Risk: Performance Degradation
- **Mitigation:** Query caching (30s TTL), index optimization
- **Threshold:** Alert if query > 5s
- **Resolution:** Add pagination if needed for large lookups (> 10k rows)

### Risk: Data Loss During Migration
- **Mitigation:** Phase 1 (tags) config remains valid
- **Strategy:** Users can switch back to tags if needed
- **Rollback:** Simple: Select "Dynatrace Tags" in Setup wizard

---

## Phase 3 Vision (Post-Phase-2)

After Phase 2 is solid, consider:

1. **Multi-Tenant Support** — Separate lookups per tenant
2. **Advanced Analytics** — ML-based monitoring recommendations
3. **Custom Attributes** — User-defined lookup columns
4. **Integration APIs** — REST endpoint for other apps to read data
5. **Periodic Health Checks** — Automated alerts for monitoring gaps

---

## Communication Plan

### When Phase 1 Validated ✅
- [ ] Announce Phase 2 start to stakeholders
- [ ] Share roadmap & timeline
- [ ] Collect feedback on CMDB integration requirements

### Mid-Phase 2 (Week 2)
- [ ] Demo CMDB workflow to platform team
- [ ] Share query samples & performance data
- [ ] Get sign-off on schema design

### Phase 2 Complete ✅
- [ ] Announce v0.2.0 release
- [ ] Share changelog & new features
- [ ] Schedule training for users

---

## Next Action

**Immediate (After Phase 1 Validation):**
1. Collect CMDB API details (endpoint, auth, fields)
2. Verify Dynatrace lookup table support in tenant
3. Create preliminary lookup table schema
4. Start Week 1 of Phase 2: lookupAdapter implementation

**Timeline:**
- Phase 1 complete: Now ✅
- Phase 1.5 validation: Sprint tenant (manual)
- Phase 2 start: After Phase 1 validation sign-off
- Phase 2 complete: 4-5 weeks from start
- Release v0.2.0: End of Phase 2 week 4

---

**Ready to proceed with Phase 2 after Phase 1 validation? Contact platform team for CMDB API credentials and schema details.**
