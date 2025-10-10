//Format time from 12:00 AM -> 12 AM and 12:12AM to 12:12AM
export function formatTime(timeStr) {
  if (!timeStr) return "";

  const input = String(timeStr).trim().toUpperCase();

  // Match "H", "HH", "H AM", "HH:MMAM", "HH:MM AM", etc.
  const m = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return input; // fallback to original normalized string

  const hour = String(parseInt(m[1], 10)); // removes leading zero
  const minutes = m[2] || "";
  const period = (m[3] || "").toUpperCase();

  if (!period) {
    // no AM/PM provided, return hour[:minutes]
    return minutes ? `${hour}:${minutes}` : hour;
  }

  if (!minutes || minutes === "00") {
    return `${hour}${period}`;
  }

  return `${hour}:${minutes}${period}`;
}