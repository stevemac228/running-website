export function isPreviousYear(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  // ISO yyyy-mm-dd -> construct UTC date (matches formatDate logic)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(String(dateStr).trim())) {
    const [y, m, d] = String(dateStr).split("-").map(Number);
    if (!y || !m || !d) return false;
    const dateUTC = Date.UTC(y, m - 1, d);
    if (Number.isNaN(dateUTC)) return false;
    return dateUTC < todayUTC;
  }

  // Fallback: try Date parsing (best-effort)
  const parsed = new Date(String(dateStr));
  if (!isNaN(parsed)) {
    const parsedUTC = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
    return parsedUTC < todayUTC;
  }

  // Last resort: if only a year is available, treat prior years as past
  const yearMatch = String(dateStr).match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const y = Number(yearMatch[0]);
    return y < today.getUTCFullYear();
  }

  return false;
}
