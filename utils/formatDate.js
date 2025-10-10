// src/utils/formatDate.js
export function formatDate(isoStr, type = "default") {
  if (!isoStr) return "";

  const [year, month, day] = isoStr.split("-").map(Number);
  if (!year || !month || !day) return isoStr;

  // Create a date in UTC to avoid timezone shifts
  const date = new Date(Date.UTC(year, month - 1, day));

  const options =
    type === "registration"
      ? { month: "short", day: "numeric" } // e.g., "Oct 8"
      : { weekday: "short", month: "short", day: "numeric", year: "numeric" }; // e.g., "Wed, Oct 8, 2025"

  return date.toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}
