/**
 * Generate an AddEvent.com URL for adding an event to calendar
 * @param {string} title - Event title
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} description - Event description
 * @returns {string} - AddEvent.com URL
 */
export function generateAddEventURL(title, dateString, description = "") {
  // Validate and parse the date string (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.error("Invalid date format. Expected YYYY-MM-DD, got:", dateString);
    return "#";
  }
  
  const parts = dateString.split("-");
  const startDate = `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY format for AddEvent
  const endDate = startDate; // Same day event
  
  // URL encode parameters - AddEvent.com expects string "true" for allday parameter
  const params = new URLSearchParams({
    title: title,
    start: startDate,
    end: endDate,
    description: description,
    allday: "true"
  });
  
  return `https://www.addevent.com/event/create?${params.toString()}`;
}
