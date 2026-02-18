/**
 * Sanitize a string to be used as a filename
 * @param {string} name - The string to sanitize
 * @returns {string} - Sanitized filename-safe string
 * 
 * Rules:
 * 1. Replace non-alphanumeric characters with hyphens
 * 2. Replace consecutive hyphens with a single hyphen
 * 3. Remove leading and trailing hyphens
 */
export function sanitizeFilename(name) {
  return name
    .replace(/[^a-z0-9]/gi, "-")  // Replace non-alphanumeric with hyphens
    .replace(/-+/g, "-")            // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, "");         // Remove leading/trailing hyphens
}
