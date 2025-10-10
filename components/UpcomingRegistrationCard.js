import { useState } from "react";
import { formatDate } from "../utils/formatDate";
import { getExpandedFields } from "../utils/getExpandedFields";
import { formatTime } from "../utils/formatTime";
import {
  getTerrainBadgeClass,
  getFormatBadgeClass,
} from "../utils/renderBadges";

export default function UpcomingRegistrationCard({ race }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const expandedFields = getExpandedFields(race, "registration");

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
              {race.name}{" "}
              <span style={{ fontSize: "16px", fontWeight: "1" }}>
                {" "}
                {race.distance}km
              </span>
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
              <span style={{ fontWeight: "500" }}>Race Date:</span>{" "}
              {formatDate(race.date)}
            </p>
            {/* Early Bird Info */}
            {race.earlyBirdCost && (
              <p>
                <span style={{ fontWeight: "500" }}>
                  Early Bird Registration:
                </span>{" "}
                <span style={{ color: "green" }}>{race.earlyBirdCost}</span>{" "}
                {formatDate(race.registrationStart, "registration") || "N/A"}{" "}
                <img
                  src="/icons/right-arrow.svg"
                  alt="to"
                  style={{
                    width: "16px",
                    height: "16px",
                    verticalAlign: "middle",
                    margin: "0 0.25rem",
                  }}
                />{" "}
                {formatDate(race.earlyBirdDeadline, "registration") || "N/A"}
              </p>
            )}
            {/* Registration Info */}
            {(race.registrationStart || race.registrationDeadline) && (
              <p>
                <span style={{ fontWeight: "500" }}>
                  General Price Registration:
                </span>{" "}
                <span style={{ color: "green" }}>{race.registrationCost}</span>{" "}
                <span>
                  {formatDate(
                    new Date(
                      new Date(race.earlyBirdDeadline).setDate(
                        new Date(race.earlyBirdDeadline).getDate() + 1
                      )
                    )
                      .toISOString()
                      .split("T")[0],
                    "registration"
                  )}{" "}
                  <img
                    src="/icons/right-arrow.svg"
                    alt="to"
                    style={{
                      width: "16px",
                      height: "16px",
                      verticalAlign: "middle",
                      margin: "0 0.25rem",
                    }}
                  />
                </span>
                {formatDate(race.registrationDeadline, "registration") || "N/A"}
              </p>
            )}
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
