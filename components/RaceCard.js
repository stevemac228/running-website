import { useState } from "react";

export default function RaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);

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
      <h2>{race.name} <span style={{ fontSize: "16px" }}> {race.distance}km</span></h2>
      <p>{race.location}</p>
      <p>{displayDate}</p>
      <p>Registration: {race.registrationStart} → {race.registrationDeadline}</p>
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
      {/* Expand Button */}
      <div>
        <button className="toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide details" : "Show details"}
        </button>
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
