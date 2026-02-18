import { formatDate } from "../../utils/formatDate";
import { generateICS, downloadICS } from "../../utils/generateICS";

export default function RegistrationTimeline({ race }) {
  if (!race) return null;

  // Extract registration information
  const {
    registrationStart,
    earlyBirdDeadline,
    earlyBirdCost,
    registrationDeadline,
    registrationCost,
  } = race;

  // Check if we have any registration data to display
  const hasRegistrationData = registrationStart || earlyBirdDeadline || registrationDeadline;
  
  if (!hasRegistrationData) return null;

  // Function to handle adding deadline to calendar
  const handleAddToCalendar = (item) => {
    const raceName = race.name || "Race";
    const title = `${raceName} - ${item.label}`;
    const description = `${item.label} for ${raceName}${item.cost ? ` - ${item.cost}` : ""}`;
    const icsContent = generateICS(title, item.date, description);
    const filename = `${raceName.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}-${item.type}.ics`;
    downloadICS(icsContent, filename);
  };

  // Build timeline items
  const timelineItems = [];

  if (registrationStart) {
    timelineItems.push({
      date: registrationStart,
      label: "Registration Opens",
      type: "start",
    });
  }

  if (earlyBirdDeadline) {
    timelineItems.push({
      date: earlyBirdDeadline,
      label: "Early Bird Deadline",
      cost: earlyBirdCost,
      type: "earlybird",
    });
  }

  if (registrationDeadline) {
    timelineItems.push({
      date: registrationDeadline,
      label: "Registration Closes",
      cost: registrationCost,
      type: "deadline",
    });
  }

  return (
    <div className="registration-timeline-container">
      {timelineItems.map((item, index) => (
        <div key={`${item.type}-${item.date}`} className="registration-timeline-item">
          <div className="registration-timeline-marker">
            <div className={`registration-timeline-dot registration-timeline-dot-${item.type}`}></div>
            {index < timelineItems.length - 1 && (
              <div className="registration-timeline-line"></div>
            )}
          </div>
          <div className="registration-timeline-content">
            <div className="registration-timeline-label">{item.label}</div>
            <div className="registration-timeline-date">{formatDate(item.date)}</div>
            {item.cost && (
              <div className="registration-timeline-cost">{item.cost}</div>
            )}
            <button
              className="registration-timeline-calendar-btn"
              onClick={() => handleAddToCalendar(item)}
              title="Add to calendar"
              aria-label={`Add ${item.label} to calendar`}
            >
              📅 Add to Calendar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
