import { useEffect, useState, useMemo } from "react";
import { useDql } from "@dynatrace-sdk/react-hooks";
import { useMappingConfig } from "./useMappingConfig";
import { buildQueriesForDataSource } from "@utils/queryBuilder";

export interface QueryResults {
  overview: Record<string, any>[];
  traceCandidates: Record<string, any>[];
  healthReport: Record<string, any>[];
}

/**
 * useMultiQueryResults Hook - Parallel DQL execution & merge
 * Executes three queries in parallel and merges results
 */
export const useMultiQueryResults = () => {
  const { config, isLoading: configLoading } = useMappingConfig();
  const [queries, setQueries] = useState<{
    overview: string;
    traceCandidates: string;
    healthReport: string;
  } | null>(null);

  // Build queries when config changes
  useEffect(() => {
    if (config) {
      const builtQueries = buildQueriesForDataSource(config);
      setQueries(builtQueries);
    }
  }, [config]);

  // Execute all three queries in parallel
  const overview = useDql({
    query: queries?.overview || "",
  });
  const traceCandidates = useDql({
    query: queries?.traceCandidates || "",
  });
  const healthReport = useDql({
    query: queries?.healthReport || "",
  });

  // Merge results
  const results = useMemo<QueryResults>(
    () => ({
      overview: overview.data?.records ?? [],
      traceCandidates: traceCandidates.data?.records ?? [],
      healthReport: healthReport.data?.records ?? [],
    }),
    [overview.data, traceCandidates.data, healthReport.data]
  );

  const isLoading = configLoading || overview.isLoading || traceCandidates.isLoading || healthReport.isLoading;
  const error = overview.error?.message || traceCandidates.error?.message || healthReport.error?.message || null;

  return { results, isLoading, error };
};
