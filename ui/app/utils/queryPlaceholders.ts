/**
 * Query placeholder substitution engine
 * Replaces placeholders like $APP_TAG_FIELD with actual field names
 */

export function substitutePlaceholders(
  template: string,
  mappings: Record<string, string>
): string {
  let result = template;

  Object.entries(mappings).forEach(([key, value]) => {
    const placeholder = `$${key.toUpperCase()}_FIELD`;
    result = result.replace(new RegExp(placeholder, "g"), value);
  });

  return result;
}

/**
 * Validate placeholder substitution
 * Ensures all required placeholders are replaced
 */
export function validatePlaceholders(query: string): boolean {
  // Check if any unreplaced placeholders remain
  const unreplacedPattern = /\$[A-Z_]+_FIELD/g;
  const unreplaced = query.match(unreplacedPattern);
  return !unreplaced || unreplaced.length === 0;
}
