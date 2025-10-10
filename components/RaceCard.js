import { useState } from "react";
import Link from "next/link";
import { formatDate } from "../utils/formatDate";
import { getExpandedFields } from "../utils/getExpandedFields";
import { formatTime } from "../utils/formatTime";
import {
  getTerrainBadgeClass,
  getFormatBadgeClass,
} from "../utils/renderBadges";
import { getRaceId } from "../utils/getRaceId";

export default function RaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const expandedFields = getExpandedFields(race);

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
              {/* Title - link by id when available */}
              <Link
                href={`/race/${encodeURIComponent(getRaceId(race))}`}
                style={{ color: "inherit", textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}
              >
                {race.name}
              </Link>{" "}
              <span style={{ fontSize: "16px" }}> {race.distance}km</span>
              <span style={{ marginRight: "0.5rem" }}></span>
              {/* Terrain Badge */}
              {race.terrain && (
                <span className={getTerrainBadgeClass(race.terrain)}>
                  {race.terrain}
                </span>
              )}
              {/* Format Badge */}
              {race.format && (
                <span className={getFormatBadgeClass(race.format)}>
                  {race.format}
                </span>
              )}
              {/* Medal Icon */}
              {race.medal && (
                <div className="tooltip-container">
                  <img
                    src="/icons/medal.svg"
                    alt="Medal available"
                    className="racecard-icon"
                  />
                  <span className="tooltip-text">This race has a medal!</span>
                </div>
              )}
              {/* Tshirt Icon */}
              {race.shirt && (
                <div className="tooltip-container">
                  <img
                    src="/icons/tshirt.svg"
                    alt="Medal available"
                    className="racecard-icon"
                  />
                  <span className="tooltip-text">This race has a tshirt!</span>
                </div>
              )}
              {/* reception Icon */}
              {race.reception && (
                <div className="tooltip-container">
                  <img
                    src="/icons/reception.svg"
                    alt="Medal available"
                    className="racecard-icon"
                  />
                  <span className="tooltip-text">
                    This race has a reception!
                  </span>
                </div>
              )}
            </h2>

            {/* Additional Information */}
            <p>
              {race.location} - {formatDate(race.date)}
              {race.startTime ? ` @ ${formatTime(race.startTime)}` : ""}
            </p>
          </div>

          <div className="chevron-container">
            {/* Chevron toggle */}
            <button
              className="chevron-toggle"
              aria-label={expanded ? "Hide details" : "Show details"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                }}
              >
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: "0.5rem" }}>
            {expandedFields.map(({ label, value }) => (
              <p key={label}>
                <strong>{label}:</strong> {value}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
