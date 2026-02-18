/**
 * Generate an iCalendar (.ics) file content for a deadline
 * @param {string} title - Event title
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} description - Event description
 * @returns {string} - iCalendar formatted string
 */
export function generateICS(title, dateString, description = "") {
  // Parse the date string (YYYY-MM-DD) explicitly to avoid timezone issues
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in Date
  const day = parseInt(parts[2], 10);
  
  // Format date for ICS (YYYYMMDD)
  const icsDate = `${parts[0]}${parts[1]}${parts[2]}`;
  
  // Get current timestamp for DTSTAMP
  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const nowMonth = String(now.getUTCMonth() + 1).padStart(2, "0");
  const nowDay = String(now.getUTCDate()).padStart(2, "0");
  const nowHour = String(now.getUTCHours()).padStart(2, "0");
  const nowMinute = String(now.getUTCMinutes()).padStart(2, "0");
  const nowSecond = String(now.getUTCSeconds()).padStart(2, "0");
  const timestamp = `${nowYear}${nowMonth}${nowDay}T${nowHour}${nowMinute}${nowSecond}Z`;
  
  // Generate unique ID
  const uid = `${timestamp}-${Math.random().toString(36).slice(2, 11)}@runnl.ca`;
  
  // Build ICS content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Run NL//Registration Deadline//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART;VALUE=DATE:${icsDate}`,
    `DTEND;VALUE=DATE:${icsDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  
  return icsContent;
}

/**
 * Download an ICS file
 * @param {string} content - ICS file content
 * @param {string} filename - Filename for the download
 */
export function downloadICS(content, filename) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
