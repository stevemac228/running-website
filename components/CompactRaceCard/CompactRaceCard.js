import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "../../utils/formatDate";
import { getExpandedFields } from "../../utils/getExpandedFields";
import { formatTime } from "../../utils/formatTime";
import {
  getTerrainBadgeClass,
  getFormatBadgeClass,
} from "../../utils/renderBadges";
import { getRaceId } from "../../utils/getRaceId";
import { isPreviousYear } from "../../utils/isPreviousYear";

const CompactRaceCard = forwardRef(({ race, onExpanded, isExpanded }, ref) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);

  // Sync internal state with external isExpanded prop
  useEffect(() => {
    if (isExpanded !== undefined && isExpanded !== expanded) {
      setExpanded(isExpanded);
    }
  }, [isExpanded]);

  useImperativeHandle(ref, () => ({
    scrollIntoView: () => {
      if (cardRef.current) {
        // Find the scrollable parent (.races-list-column)
        const scrollParent = cardRef.current.closest('.races-list-column');
        if (scrollParent) {
          const cardTop = cardRef.current.offsetTop;
          const cardHeight = cardRef.current.offsetHeight;
          const parentHeight = scrollParent.clientHeight;
          const scrollPosition = cardTop - (parentHeight / 2) + (cardHeight / 2);
          
          scrollParent.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    },
    expand: () => {
      if (!expanded) {
        setExpanded(true);
        if (onExpanded) {
          onExpanded(true);
        }
      }
    },
    collapse: () => {
      if (expanded) {
        setExpanded(false);
        if (onExpanded) {
          onExpanded(false);
        }
      } else {
        // Force update even if already collapsed to ensure state is clean
        setExpanded(false);
      }
    }
  }));

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (onExpanded) {
      onExpanded(newExpanded);
    }
  };
  const expandedFields = getExpandedFields(race);

  return (
    <div ref={cardRef} className={`compact-race-card ${expanded ? 'expanded' : ''}`} onClick={toggleExpanded}>
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
          {/* Row containing location/date on the left and the chevron on the right
              so there is no extra space underneath on mobile. */}
          <div className="compact-race-details-row">
            <div className="compact-race-left">
              <div className="compact-race-location">{race.location}</div>
              <div className="compact-race-date">
                <span className="tooltip-text">This race has a reception!</span>
                <span className={isPreviousYear(race.date) ? "race-date-previous-year" : ""}>
                  {formatDate(race.date)}
                </span>
                {race.startTime && <span> • {formatTime(race.startTime)}</span>}
              </div>
            </div>

            <div className="compact-race-chev-mobile">
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
});

CompactRaceCard.displayName = 'CompactRaceCard';

export default CompactRaceCard;
