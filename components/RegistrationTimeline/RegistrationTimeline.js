import { formatDate } from "../../utils/formatDate";
import { generateAddEventData } from "../../utils/generateAddEventURL";
import { useEffect } from "react";

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

  // Load AddEvent.com script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="addevent.com"]')) {
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://cdn.addevent.com/libs/atc/1.6.1/atc.min.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup is optional - script can persist
    };
  }, []);

  // Function to get AddEvent.com data attributes for a deadline
  const getAddEventData = (item) => {
    const raceName = race.name || "Race";
    const title = `${raceName} - ${item.label}`;
    const description = `${item.label} for ${raceName}${item.cost ? ` - ${item.cost}` : ""}`;
    return generateAddEventData(title, item.date, description);
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
            <a
              href="#"
              className="registration-timeline-calendar-btn addeventatc"
              title="Add to calendar"
              aria-label={`Add ${item.label} to calendar`}
              {...getAddEventData(item)}
            >
              Add to Calendar
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
