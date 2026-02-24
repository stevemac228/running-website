/**
 * Generate event data attributes for AddEvent.com button
 * @param {string} title - Event title
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} description - Event description
 * @returns {object} - Data attributes for AddEvent button
 */
export function generateAddEventData(title, dateString, description = "") {
  // Validate and parse the date string (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.error("Invalid date format. Expected YYYY-MM-DD, got:", dateString);
    return {};
  }
  
  const parts = dateString.split("-");
  // Format: MM/DD/YYYY
  const formattedDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
  
  return {
    "data-id": "addevent-button",
    "data-title": title,
    "data-start": formattedDate,
    "data-end": formattedDate,
    "data-description": description,
    "data-allday": "true"
  };
}


