/**
 * Validates CSV files against CMDB lookup schema
 * Ensures user-provided files match the required structure
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recordCount: number;
}

/**
 * CMDB Lookup Schemas
 * Defines required and optional fields for each lookup table
 */
const LOOKUP_SCHEMAS = {
  cmdb_businessapp: {
    displayName: "Business Applications",
    lookupKey: "cmdb_ci_key",
    requiredFields: ["cmdb_ci_key", "name"],
    optionalFields: [
      "short_name",
      "owned_by",
      "business_criticality",
      "dv_business_unit",
      "dv_operational_status",
      "application_type",
      "rum_expected",
      "rum_domains",
    ],
    fieldValidation: {
      cmdb_ci_key: { pattern: /^.{1,255}$/, description: "Non-empty, max 255 chars" },
      name: { pattern: /^.{1,255}$/, description: "Non-empty, max 255 chars" },
      business_criticality: {
        allowedValues: [
          "Business Essential",
          "Business Important",
          "Business Moderate",
          "Non-Business Essential",
        ],
        description: "One of: Business Essential, Business Important, Business Moderate, Non-Business Essential",
      },
      rum_expected: {
        pattern: /^[01]$/,
        description: "0 or 1",
      },
    },
  },
  cmdb_server: {
    displayName: "Servers",
    lookupKey: "cmdb_ci_key",
    requiredFields: ["cmdb_ci_key", "name", "busapp_cmdb_ci_key"],
    optionalFields: ["fully_qualified_domain_name", "location"],
    fieldValidation: {
      cmdb_ci_key: { pattern: /^.{1,255}$/, description: "Non-empty, max 255 chars" },
      name: { pattern: /^.{1,255}$/, description: "Non-empty, max 255 chars" },
      busapp_cmdb_ci_key: { pattern: /^.{1,255}$/, description: "Non-empty, max 255 chars (must match cmdb_businessapp.cmdb_ci_key)" },
      fully_qualified_domain_name: { pattern: /^.{1,255}$/, description: "FQDN for host matching" },
    },
  },
  cmdb_app_frontend_mapping: {
    displayName: "App-to-Frontend Mappings",
    lookupKey: "mapping_key",
    requiredFields: ["mapping_key", "app_cmdb_ci_key"],
    optionalFields: [
      "app_short_name",
      "frontend_entity_id",
      "frontend_name",
      "frontend_type",
      "rum_expected",
      "rum_enabled",
      "rum_domains",
      "mapping_method",
      "mapping_confidence",
      "user_event_count_24h",
      "session_count_24h",
      "last_seen_user_event",
      "notes",
    ],
    fieldValidation: {
      mapping_key: { pattern: /^.{1,255}$/, description: "Unique key" },
      app_cmdb_ci_key: { pattern: /^.{1,255}$/, description: "Must match cmdb_businessapp.cmdb_ci_key" },
      rum_expected: { pattern: /^[01]$/, description: "0 or 1" },
      rum_enabled: { pattern: /^[01]$/, description: "0 or 1" },
    },
  },
};

type LookupName = keyof typeof LOOKUP_SCHEMAS;

/**
 * Parse CSV string into records
 * Handles quoted fields and escaping
 */
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split("\n");
  const records: string[][] = [];

  for (const line of lines) {
    // Skip comments (lines starting with #)
    if (line.trim().startsWith("#")) {
      continue;
    }

    // Skip empty lines
    if (line.trim().length === 0) {
      continue;
    }

    // Simple CSV parsing (handles quoted fields)
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }

    fields.push(current.trim().replace(/^"|"$/g, ""));
    records.push(fields);
  }

  return records;
}

/**
 * Validate CSV file against lookup schema
 */
export function validateLookupCSV(
  csvContent: string,
  lookupName: LookupName
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const schema = LOOKUP_SCHEMAS[lookupName];
  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown lookup table: ${lookupName}`],
      warnings: [],
      recordCount: 0,
    };
  }

  // Parse CSV
  const records = parseCSV(csvContent);
  if (records.length === 0) {
    return {
      valid: false,
      errors: ["CSV is empty (no header row)"],
      warnings: [],
      recordCount: 0,
    };
  }

  // Extract header
  const header = records[0];
  const headerSet = new Set(header);

  // Validate required fields exist
  for (const requiredField of schema.requiredFields) {
    if (!headerSet.has(requiredField)) {
      errors.push(`Missing required field: "${requiredField}"`);
    }
  }

  // Warn about unknown fields
  const allAllowedFields = new Set([...schema.requiredFields, ...schema.optionalFields]);
  for (const field of header) {
    if (!allAllowedFields.has(field)) {
      warnings.push(`Unknown field: "${field}" (will be ignored)`);
    }
  }

  // Create field index for efficient lookup
  const fieldIndex: Record<string, number> = {};
  for (let i = 0; i < header.length; i++) {
    fieldIndex[header[i]] = i;
  }

  // Validate data rows
  const seenKeys = new Set<string>();
  const dataRecords = records.slice(1); // Skip header

  for (let rowNum = 2; rowNum <= records.length; rowNum++) {
    const record = records[rowNum - 1];
    if (record.length === 0 || (record.length === 1 && record[0].trim() === "")) {
      continue; // Skip empty rows
    }

    // Pad record to match header length
    while (record.length < header.length) {
      record.push("");
    }

    // Create record object
    const recordObj: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      recordObj[header[i]] = record[i] || "";
    }

    // Validate required fields are non-empty
    for (const requiredField of schema.requiredFields) {
      if (!recordObj[requiredField] || recordObj[requiredField].trim() === "") {
        errors.push(`Row ${rowNum}: Required field "${requiredField}" is empty`);
      }
    }

    // Validate lookup key uniqueness
    const keyValue = recordObj[schema.lookupKey];
    if (keyValue && seenKeys.has(keyValue)) {
      errors.push(`Row ${rowNum}: Duplicate ${schema.lookupKey} value: "${keyValue}"`);
    } else if (keyValue) {
      seenKeys.add(keyValue);
    }

    // Validate field patterns
    for (const [fieldName, validation] of Object.entries(schema.fieldValidation)) {
      const value = recordObj[fieldName];
      if (!value || value.trim() === "") {
        continue; // Optional field
      }

      if ("pattern" in validation) {
        if (!validation.pattern.test(value)) {
          errors.push(
            `Row ${rowNum}, field "${fieldName}": Invalid format. Expected: ${validation.description}`
          );
        }
      }

      if ("allowedValues" in validation) {
        if (!validation.allowedValues.includes(value)) {
          errors.push(
            `Row ${rowNum}, field "${fieldName}": Invalid value "${value}". Expected one of: ${validation.allowedValues.join(", ")}`
          );
        }
      }
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    warnings,
    recordCount: dataRecords.length,
  };
}

/**
 * Validate all three CSV files together
 * Checks foreign key relationships
 */
export function validateLookupSet(
  csvFiles: {
    businessapp: string;
    server: string;
    frontend_mapping: string;
  }
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate individual files
  const baResult = validateLookupCSV(csvFiles.businessapp, "cmdb_businessapp");
  const srvResult = validateLookupCSV(csvFiles.server, "cmdb_server");
  const fmResult = validateLookupCSV(csvFiles.frontend_mapping, "cmdb_app_frontend_mapping");

  if (!baResult.valid) {
    errors.push(`cmdb_businessapp: ${baResult.errors.join("; ")}`);
  }
  if (!srvResult.valid) {
    errors.push(`cmdb_server: ${srvResult.errors.join("; ")}`);
  }
  if (!fmResult.valid) {
    errors.push(`cmdb_app_frontend_mapping: ${fmResult.errors.join("; ")}`);
  }

  warnings.push(...baResult.warnings, ...srvResult.warnings, ...fmResult.warnings);

  // Build key sets for foreign key validation
  const baRecords = parseCSV(csvFiles.businessapp);
  const baKeySet = new Set<string>();
  if (baRecords.length > 1) {
    const keyIdx = baRecords[0].indexOf("cmdb_ci_key");
    if (keyIdx >= 0) {
      for (let i = 1; i < baRecords.length; i++) {
        const key = baRecords[i][keyIdx];
        if (key && key.trim()) {
          baKeySet.add(key.trim());
        }
      }
    }
  }

  // Validate cmdb_server.busapp_cmdb_ci_key references
  const srvRecords = parseCSV(csvFiles.server);
  if (srvRecords.length > 1) {
    const appKeyIdx = srvRecords[0].indexOf("busapp_cmdb_ci_key");
    if (appKeyIdx >= 0) {
      for (let i = 1; i < srvRecords.length; i++) {
        const appKey = srvRecords[i][appKeyIdx];
        if (appKey && appKey.trim() && !baKeySet.has(appKey.trim())) {
          errors.push(
            `cmdb_server row ${i + 1}: busapp_cmdb_ci_key "${appKey}" not found in cmdb_businessapp`
          );
        }
      }
    }
  }

  // Validate cmdb_app_frontend_mapping.app_cmdb_ci_key references
  const fmRecords = parseCSV(csvFiles.frontend_mapping);
  if (fmRecords.length > 1) {
    const appKeyIdx = fmRecords[0].indexOf("app_cmdb_ci_key");
    if (appKeyIdx >= 0) {
      for (let i = 1; i < fmRecords.length; i++) {
        const appKey = fmRecords[i][appKeyIdx];
        if (appKey && appKey.trim() && !baKeySet.has(appKey.trim())) {
          errors.push(
            `cmdb_app_frontend_mapping row ${i + 1}: app_cmdb_ci_key "${appKey}" not found in cmdb_businessapp`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
