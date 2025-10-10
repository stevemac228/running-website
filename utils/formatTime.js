//Format time from 12:00 AM -> 12 AM and 12:12AM to 12:12AM
export function formatTime(timeStr) {
  if (!timeStr) return "";

  // Normalize spacing and case (e.g. "12:00 am" → "12:00 AM")
  const clean = timeStr.trim().toUpperCase();

  // Split into [time, period]
  const [timePart, period] = clean.split(" ");

  // If no minutes, just return
  if (!timePart || !period) return clean;

  // Separate hour and minute
  const [hour, minute] = timePart.split(":");

  // If minutes are 00, return only hour + AM/PM
  if (!minute || minute === "00") {
    return `${parseInt(hour, 10)}${period}`;
  }

  // Otherwise include minutes
  return `${hour}:${minute}${period}`;
}