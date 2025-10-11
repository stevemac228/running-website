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

export default function UpcomingRaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const expandedFields = getExpandedFields(race);

  return (
    <div
      className="race-card race-card-clickable"
      onClick={toggleExpanded}
    >
      <div>
        <div className="race-card-collapsed">
          <div className="information-section">
            <h2>
              {/* Title - link to detail page (use id if available) */}
              <Link
                href={`/race/${encodeURIComponent(getRaceId(race))}`}
                className="race-card-link"
                onClick={(e) => e.stopPropagation()}
              >
                {race.name}
              </Link>{" "}
              <span className="race-card-distance-weight"> {race.distance}km</span>
              <span className="race-card-spacer"></span>
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
            <button
              className="chevron-toggle"
              aria-label={expanded ? "Hide details" : "Show details"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                className={`race-card-chevron-svg ${expanded ? 'race-card-chevron-expanded' : 'race-card-chevron-collapsed'}`}
              >
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="race-card-expanded-content">
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
