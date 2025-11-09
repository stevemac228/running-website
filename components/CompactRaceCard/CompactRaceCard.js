import { useState } from "react";
import Link from "next/link";
import { formatDate } from "../../utils/formatDate";
import { getExpandedFields } from "../../utils/getExpandedFields";
import { formatTime } from "../../utils/formatTime";
import {
  getTerrainBadgeClass,
  getFormatBadgeClass,
} from "../../utils/renderBadges";
import { getRaceId } from "../../utils/getRaceId";

export default function CompactRaceCard({ race }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const expandedFields = getExpandedFields(race);

  return (
    <div className="compact-race-card" onClick={toggleExpanded}>
      <div className="compact-race-card-main">
        {/* Left section - Name, distance, icons, and badges */}
        <div className="compact-race-info">
          <div className="compact-race-header">
            <Link
              href={`/race/${encodeURIComponent(getRaceId(race))}`}
              className="compact-race-name"
              onClick={(e) => e.stopPropagation()}
            >
              {race.name}
            </Link>
            <span className="compact-race-distance">
              {race.distance === "∞" ? race.distance : `${race.distance}km`}
            </span>
            {/* Icons moved here after name and distance */}
            <div className="compact-race-icons-inline">
              {race.medal && (
                <div className="tooltip-container">
                  <img
                    src="/icons/medal.svg"
                    alt="Medal"
                    className="racecard-icon"
                  />
                  <span className="tooltip-text">This race has a medal!</span>
                </div>
              )}
              {race.shirt && (
                <div className="tooltip-container">
                  <img
                    src="/icons/tshirt.svg"
                    alt="T-Shirt"
                    className="racecard-icon"
                  />
                  <span className="tooltip-text">This race has a tshirt!</span>
                </div>
              )}
              {race.reception && (
                <div className="tooltip-container">
                  <img
                    src="/icons/reception.svg"
                    alt="Reception"
                    className="racecard-icon reception-icon"
                  />
                  <span className="tooltip-text">This race has a reception!</span>
                </div>
              )}
            </div>
          </div>
          <div className="compact-race-badges">
            {race.terrain && (
              <span className={getTerrainBadgeClass(race.terrain)}>
                {race.terrain}
              </span>
            )}
            {race.format && (
              <span className={getFormatBadgeClass(race.format)}>
                {race.format}
              </span>
            )}
          </div>
        </div>

        {/* Middle section - Location and date */}
        <div className="compact-race-details">
          <div className="compact-race-location">{race.location}</div>
          <div className="compact-race-date">
            {formatDate(race.date)}
            {race.startTime && <span> • {formatTime(race.startTime)}</span>}
          </div>
        </div>

        {/* Right section - Chevron only */}
        <div className="compact-race-actions">
          <button
            className="chevron-toggle"
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className={`race-card-chevron-svg ${expanded ? 'race-card-chevron-expanded' : 'race-card-chevron-collapsed'}`}
            >
              <path fill="currentColor" d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="compact-race-expanded">
          {expandedFields.map(({ label, value }) => (
            <div key={label} className="compact-race-field">
              <strong>{label}:</strong> {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
