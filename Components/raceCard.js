import { useState } from "react";

export default function RaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);

  const keyFields = ["city", "distance", "raceDate", "registrationStart", "registrationEnd", "type"];
  const extraFields = Object.keys(race).filter(f => !["id", "name", ...keyFields].includes(f));

  // Color coding for race type
  const typeColors = {
    road: "bg-blue-500",
    trail: "bg-green-500",
    "fun run": "bg-orange-500",
  };

  // Determine if registration is upcoming (within next 14 days)
  const today = new Date();
  const regStart = new Date(race.registrationStart);
  const regEnd = new Date(race.registrationEnd);
  let regBadge = "";
  if (today < regStart && (regStart - today) / (1000 * 60 * 60 * 24) <= 14) {
    regBadge = "Registration opens soon";
  } else if (today >= regStart && today <= regEnd) {
    regBadge = "Registration open";
  }

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition mb-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <h2 className="text-xl font-bold">{race.name}</h2>
          <p>
            {race.city} — {race.distance} — {race.type}
          </p>
          <p>Race Date: {race.raceDate}</p>
          {regBadge && (
            <span className={`text-white px-2 py-1 rounded ${typeColors[race.type] || "bg-gray-500"} text-sm`}>
              {regBadge}
            </span>
          )}
        </div>
        <button className="ml-4 text-blue-500 underline">
          {expanded ? "Hide details" : "Show details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t pt-2 space-y-1">
          {extraFields.map(field => (
            <p key={field}>
              <span className="font-semibold">{field.replace(/([A-Z])/g, ' $1')}:</span> {race[field]}
            </p>
          ))}
          {race.website && (
            <p>
              <a href={race.website} target="_blank" className="text-blue-500 underline">
                Official Website
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}