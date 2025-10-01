import { useState } from "react";

export default function RaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);

  const keyFields = ["Location", "Kms", "Date", "registrationStart", "registrationDeadline", "Terrain"];
  const extraFields = Object.keys(race).filter(f => !["id", "name", ...keyFields].includes(f));

  const dateTimeStr = `${race.date} ${race.startTime}`; // "12/06/2025 10:00 AM"
  const raceDate = new Date(dateTimeStr);
  const displayDate = raceDate.toLocaleDateString("en-US", {
    month: "long",    // full month name
    day: "numeric",
    year: "numeric"
  }) + ` @ ${raceDate.toLocaleTimeString("en-US", { hour: "numeric", minute: undefined })}`;

  return (
    <div className="race-card">
      <div className="race-card-collapsed">
        <div className="information-section">
        <h2>
          {/* Title */}
          {race.name} <span style={{ fontSize: "16px"}}> {race.distance}km</span><span style={{ marginRight: "0.5rem"}}></span>

          {/* Terrain Badge */}
          {race.terrain && (
            <span
              className={
                race.terrain.toLowerCase() === "road"
                  ? "badge badge-road"
                  : race.terrain.toLowerCase() === "trail"
                  ? "badge badge-trail"
                  : "badge"
              }
            >
            {race.terrain}
            </span>
          )}

          {/* Format Badge */}
          {race.format && (
            <span
              className={
                race.format.toLowerCase() === "competitive"
                  ? "badge badge-competitive"
                  : race.format.toLowerCase() === "fun"
                  ? "badge badge-funrun"
                  : "badge"
              }
              style={{ marginLeft: "0.5rem" }} // small spacing between badges
            >
            {race.format}
            </span>
          )}

          {/* Medal Icon */}
          {race.medal === rrrrke && (
            <span
              className={
                race.medal === true
                  ? "medal-icon"
                  : race.medal === false
                  ? ''
              }
            >
            </span>
          )}

          <img src="/icons/medal-svgrepo-com.svg" alt="medal" className="medal-icon" />

        </h2>

        {/* Additional Information */}
        <p>{race.location} - {displayDate} </p>
        <p>Registration: {race.registrationStart} → {race.registrationDeadline}</p>
        </div>

        <div className="chevron-container">
        {/* Chevron toggle */}
        <button 
          onClick={toggleExpanded} 
          className="chevron-toggle"
          aria-label={expanded ? "Hide details" : "Show details"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" height="32" 
            viewBox="0 0 24 24"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
          >
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        </div>
      </div>


      {expanded && (
        <div style={{ marginTop: "0.5rem" }}>
          {extraFields.map(field => (
            <p key={field}>
              <strong>{field.replace(/([A-Z])/g, ' $1')}:</strong> {race[field]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
