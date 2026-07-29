import { MappingConfig } from "@utils/documentStore";
import { tagsAdapter } from "./adapters/tagsAdapter";
import { lookupAdapter } from "./adapters/lookupAdapter";
import { dqlAdapter } from "./adapters/dqlAdapter";

export interface QuerySet {
  overview: string;
  traceCandidates: string;
  healthReport: string;
}

/**
 * Build DQL queries based on data source type and field mappings
 * Routes to appropriate adapter
 */
export function buildQueriesForDataSource(config: MappingConfig): QuerySet {
  switch (config.dataSourceType) {
    case "tags":
      return tagsAdapter.buildQueries(config.fieldMappings);
    case "lookup":
      return lookupAdapter.buildQueries(
        config.fieldMappings,
        config.lookupTableName || "applications"
      );
    case "dql":
      return dqlAdapter.buildQueries(config.fieldMappings);
    default:
      throw new Error(`Unknown data source type: ${config.dataSourceType}`);
  }
}
