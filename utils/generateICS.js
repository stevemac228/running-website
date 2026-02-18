/**
 * Generate an iCalendar (.ics) file content for a deadline
 * @param {string} title - Event title
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} description - Event description
 * @returns {string} - iCalendar formatted string
 */
export function generateICS(title, dateString, description = "") {
  // Parse the date string (YYYY-MM-DD)
  const date = new Date(dateString + "T00:00:00");
  
  // Format date for ICS (YYYYMMDD)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const icsDate = `${year}${month}${day}`;
  
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
