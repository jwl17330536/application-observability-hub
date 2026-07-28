import { useEffect, useState } from "react";
import { fetchConfigFromDocumentStore, MappingConfig } from "@utils/documentStore";

/**
 * useMappingConfig Hook - Fetch/cache mapping configuration
 * Reads from Document Store (or localStorage fallback)
 */
export const useMappingConfig = () => {
  const [config, setConfig] = useState<MappingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const fetchedConfig = await fetchConfigFromDocumentStore();
        setConfig(fetchedConfig);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, isLoading, error };
};
