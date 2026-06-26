/**
 * Generate event data attributes for AddEvent.com button
 * @param {string} title - Event title
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} description - Event description
 * @returns {object} - Data attributes for AddEvent button
 */
export function generateAddEventData(title, dateString, description = "") {
  // Validate the date string (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.error("Invalid date format. Expected YYYY-MM-DD, got:", dateString);
    return {};
  }
  
  // AddEvent.com expects dates in YYYY-MM-DD format
  return {
    "data-title": title,
    "data-start": dateString,
    "data-end": dateString,
    "data-description": description,
    "data-allday": "true"
  };
}


