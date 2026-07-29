/**
 * Document Store API helper
 * Reads/writes configuration to Dynatrace Document Store
 * Falls back to localStorage if unavailable
 */

export interface MappingConfig {
  dataSourceType: "tags" | "lookup" | "dql";
  fieldMappings: {
    appTag: string;
    appName: string;
    tier: string;
    owner: string;
  };
  lookupTableName?: string; // For dataSourceType: "lookup" (Phase 2)
}

const DOCUMENT_STORE_KEY = "observability-hub-app-config-v1";
const USE_LOCAL_STORAGE = !sessionStorage.getItem("DOCUMENT_STORE_AVAILABLE");

export async function validateDocumentStoreAccess(): Promise<boolean> {
  try {
    const response = await fetch("/platform/storage/resource-store/v1/files/test-key", {
      method: "GET",
    });

    if (response.status === 404 || response.status === 200) {
      sessionStorage.setItem("DOCUMENT_STORE_AVAILABLE", "true");
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Document Store unavailable, using localStorage fallback:", error);
    return false;
  }
}

export async function fetchConfigFromDocumentStore(): Promise<MappingConfig | null> {
  if (USE_LOCAL_STORAGE) {
    const cached = localStorage.getItem(DOCUMENT_STORE_KEY);
    return cached ? JSON.parse(cached) : null;
  }

  try {
    const response = await fetch(`/platform/storage/resource-store/v1/files/${DOCUMENT_STORE_KEY}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Error fetching from Document Store, falling back to localStorage:", error);
    const cached = localStorage.getItem(DOCUMENT_STORE_KEY);
    return cached ? JSON.parse(cached) : null;
  }
}

export async function saveConfig(config: MappingConfig): Promise<void> {
  // Always save to localStorage as fallback
  localStorage.setItem(DOCUMENT_STORE_KEY, JSON.stringify(config));

  if (USE_LOCAL_STORAGE) {
    return;
  }

  try {
    const response = await fetch(`/platform/storage/resource-store/v1/files/${DOCUMENT_STORE_KEY}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Failed to save config: ${response.statusText}`);
    }
  } catch (error) {
    console.warn("Error saving to Document Store, config saved to localStorage only:", error);
    throw error;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateConfig(config: MappingConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.dataSourceType) {
    errors.push("Data source type is required");
  }

  const { fieldMappings } = config;
  if (!fieldMappings.appTag) {
    errors.push("Application Tag field is required");
  }
  if (!fieldMappings.appName) {
    errors.push("Application Name field is required");
  }
  if (!fieldMappings.tier) {
    errors.push("Tier field is required");
  }
  if (!fieldMappings.owner) {
    errors.push("Owner field is required");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
