import { useState } from "react";

export default function UpcomingRaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);

  const keyFields = ["Location", "Kms", "Date", "registrationStart", "registrationDeadline", "Terrain"];
  const extraFields = Object.keys(race).filter(f => !["id", "name", ...keyFields].includes(f));
  const fieldLabels = {
    day: "Day",
    earlyBirdDeadline: "Early Bird Deadline",
    earlyBirdCost: "Early Bird Cost",
    registrationCost: "Registration Cost",
    fundraiser: "Fundraiser",
    reception: "Reception",
    location: "Location",
    startLinelocation: "Start Line Location",
    organization: "Organization",
    nLAACertified: "N.L.A.A Certified",
  };

  const dateTimeStr = `${race.date} ${race.startTime}`; // "12/06/2025 10:00 AM"
  const raceDate = new Date(dateTimeStr);
  const displayDate = raceDate.toLocaleDateString("en-US", {
    month: "long",    // full month name
    day: "numeric",
    year: "numeric"
  }) + ` @ ${raceDate.toLocaleTimeString("en-US", { hour: "numeric", minute: undefined })}`;

  return (
  <div 
  className="race-card" 
  onClick={toggleExpanded} 
  style={{ cursor: "pointer" }}
  >
    <div>
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
                  : race.terrain.toLowerCase() === "track"
                  ? "badge badge-track"
                  : race.terrain.toLowerCase() === "gravel"
                  ? "badge badge-gravel"
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
          {race.medal && (
            <img src="/icons/medal.svg" alt="Medal available" className="medal-icon" />
          )}

          {/* Tshirt Icon */}
          {race.shirt && (
            <img src="/icons/tshirt.svg" alt="Tshirt available" className="tshirt-icon" />
          )}

        </h2>

        {/* Additional Information */}
        <p>{race.location} - {displayDate} </p>
        <p>Registration: {race.registrationStart} → {race.registrationDeadline}</p>
        </div>

        <div className="chevron-container">
        {/* Chevron toggle */}
        <button 
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
          {extraFields
            .filter(field => fieldLabels[field]) // only keep fields that have a label defined
            .map(field => {
              const value = typeof race[field] === "boolean"
                ? (race[field] ? "Yes" : "No")
                : race[field];

              return (
                <p key={field}>
                  <strong>{fieldLabels[field]}:</strong> {value ?? "N/A"}
                </p>
              );
            })}
        </div>
      )}
    </div>
  </div>

  );
}
