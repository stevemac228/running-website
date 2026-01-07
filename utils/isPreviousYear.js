export function isPreviousYear(dateStr) {
  if (!dateStr) return false;

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  // ISO yyyy-mm-dd -> construct UTC date (matches formatDate logic)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(String(dateStr).trim())) {
    const [y, m, d] = String(dateStr).split("-").map(Number);
    if (!y || !m || !d) return false;
    const dUTC = new Date(Date.UTC(y, m - 1, d));
    if (isNaN(dUTC)) return false;
    return dUTC.getUTCFullYear() === prevYear;
  }

  // If the string already contains a 4-digit year (formatted output from formatDate), use it
  const yearMatch = String(dateStr).match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const y = Number(yearMatch[0]);
    return y === prevYear;
  }

  // Fallback: try Date parsing (best-effort)
  const parsed = new Date(String(dateStr));
  if (!isNaN(parsed)) {
    return parsed.getFullYear() === prevYear;
  }

  return false;
}
