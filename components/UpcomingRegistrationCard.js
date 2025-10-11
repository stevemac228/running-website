import Link from "next/link";
import { formatDate } from "../utils/formatDate";
import {
  getTerrainBadgeClass,
  getFormatBadgeClass,
} from "../utils/renderBadges";
import { getRaceId } from "../utils/getRaceId";

export default function UpcomingRegistrationCard({ race }) {
  return (
    <Link
      href={`/race/${encodeURIComponent(getRaceId(race))}`}
      className="registration-card-vertical-carousel"
    >
      {/* Image section with badges overlay */}
      <div className="registration-card-image-wrapper">
        <div className="registration-card-image">
          <svg
            viewBox="0 0 400 200"
            xmlns="http://www.w3.org/2000/svg"
            className="registration-card-placeholder"
          >
            <defs>
              <linearGradient id={`sky-${getRaceId(race)}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#87CEEB', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#E0F6FF', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id={`road-${getRaceId(race)}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#696969', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#505050', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            
            {/* Sky */}
            <rect width="400" height="120" fill={`url(#sky-${getRaceId(race)})`} />
            
            {/* Sun */}
            <circle cx="340" cy="40" r="25" fill="#FFD700" opacity="0.9" />
            <circle cx="340" cy="40" r="30" fill="#FFD700" opacity="0.3" />
            
            {/* Mountains/Hills */}
            <path
              d="M0 100 L80 60 L160 90 L240 50 L320 80 L400 70 L400 120 L0 120 Z"
              fill="#2F5233"
              opacity="0.6"
            />
            <path
              d="M0 110 L100 80 L200 95 L300 70 L400 85 L400 120 L0 120 Z"
              fill="#3A6B3F"
              opacity="0.7"
            />
            
            {/* Ground/Grass */}
            <rect y="120" width="400" height="80" fill="#4A7C4E" />
            
            {/* Road */}
            <path
              d="M 150 200 Q 180 160, 200 120 Q 220 160, 250 200 Z"
              fill={`url(#road-${getRaceId(race)})`}
            />
            
            {/* Road lines */}
            <path
              d="M 195 200 L 200 175 M 200 165 L 205 140 M 205 130 L 210 120"
              stroke="#FFF"
              strokeWidth="2"
              strokeDasharray="8,8"
              opacity="0.8"
            />
            
            {/* Trees */}
            <ellipse cx="60" cy="150" rx="15" ry="25" fill="#2D5016" />
            <rect x="55" y="150" width="10" height="20" fill="#5C4033" />
            
            <ellipse cx="340" cy="145" rx="18" ry="28" fill="#2D5016" />
            <rect x="334" y="145" width="12" height="25" fill="#5C4033" />
            
            {/* Runner silhouette */}
            <g transform="translate(200, 140)">
              <circle cx="0" cy="-20" r="8" fill="#0f5c5b" />
              <line x1="0" y1="-12" x2="0" y2="10" stroke="#0f5c5b" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="-5" x2="-12" y2="5" stroke="#0f5c5b" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="-5" x2="10" y2="-8" stroke="#0f5c5b" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="10" x2="-8" y2="25" stroke="#0f5c5b" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="10" x2="10" y2="22" stroke="#0f5c5b" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
        </div>
        
        {/* Badges overlay on image */}
        <div className="registration-card-image-badges-vertical">
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

      {/* Content section */}
      <div className="registration-card-content-vertical">
        <h2 className="registration-card-title-vertical">
          {race.name}
          <span className="registration-card-distance-vertical">
            {race.distance === "∞" ? race.distance : `${race.distance}km`}
          </span>
        </h2>
        
        {/* Icons */}
        <div className="registration-card-icons-vertical">
          {race.medal && (
            <div className="tooltip-container">
              <svg
                className="racecard-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.9201 12.8959L19.2583 8.89003C19.533 8.5604 19.6704 8.39557 19.7681 8.21065C19.8548 8.0466 19.9183 7.87128 19.9567 7.68973C20 7.48508 20 7.27053 20 6.84144V6.2C20 5.07989 20 4.51984 19.782 4.09202C19.5903 3.71569 19.2843 3.40973 18.908 3.21799C18.4802 3 17.9201 3 16.8 3H7.2C6.0799 3 5.51984 3 5.09202 3.21799C4.71569 3.40973 4.40973 3.71569 4.21799 4.09202C4 4.51984 4 5.07989 4 6.2V6.84144C4 7.27053 4 7.48508 4.04328 7.68973C4.08168 7.87128 4.14515 8.0466 4.23188 8.21065C4.32964 8.39557 4.467 8.5604 4.74169 8.89003L8.07995 12.8959M13.4009 11.1989L19.3668 3.53988M10.5991 11.1989L4.6394 3.53414M6.55673 6H17.4505M17 16C17 18.7614 14.7614 21 12 21C9.23858 21 7 18.7614 7 16C7 13.2386 9.23858 11 12 11C14.7614 11 17 13.2386 17 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tooltip-text">Medal</span>
            </div>
          )}
          {race.shirt && (
            <div className="tooltip-container">
              <svg
                className="racecard-icon"
                width="14"
                height="14"
                viewBox="0 0 470.381 470.381"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M462.158,96.555L294.402,47.959c-1.033-0.3-2.098-0.45-3.17-0.45H179.155c-1.074,0-2.142,0.15-3.171,0.45L8.224,96.555C3.355,97.968,0,102.425,0,107.499v97.198c0,3.511,1.619,6.833,4.396,8.991c2.771,2.159,6.376,2.927,9.787,2.059l73.95-18.65v214.38c0,6.293,5.103,11.395,11.396,11.395h271.329c6.293,0,11.396-5.102,11.396-11.395V197.096l73.943,18.65c3.41,0.868,7.021,0.1,9.793-2.059s4.391-5.48,4.391-8.991v-97.198C470.381,102.424,467.031,97.968,462.158,96.555z M283.236,70.298c-3.311,23.586-23.564,41.808-48.045,41.808c-24.482,0-44.734-18.222-48.045-41.808H283.236z M447.592,190.069l-73.945-18.65c-3.406-0.868-7.023-0.095-9.793,2.059c-2.771,2.159-4.391,5.48-4.391,8.991v217.614H110.924V182.468c0-3.511-1.619-6.833-4.396-8.991c-2.771-2.153-6.376-2.927-9.787-2.059l-73.951,18.65v-74.007l142.032-41.146c5.481,33.945,34.903,59.98,70.368,59.98c35.47,0,64.886-26.035,70.369-59.98l142.033,41.147V190.069z" />
              </svg>
              <span className="tooltip-text">T-shirt</span>
            </div>
          )}
          {race.reception && (
            <div className="tooltip-container">
              <svg
                className="racecard-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.5713 14.5L9.46583 18.4141M18.9996 3.60975C17.4044 3.59505 16.6658 4.33233 16.4236 5.07743C16.2103 5.73354 16.4052 7.07735 15.896 8.0727C15.4091 9.02443 14.1204 9.5617 12.6571 9.60697M20 7.6104L20.01 7.61049M19 15.96L19.01 15.9601M7.00001 3.94926L7.01001 3.94936M19 11.1094C17.5 11.1094 16.5 11.6094 15.5949 12.5447M10.2377 7.18796C11 6.10991 11.5 5.10991 11.0082 3.52734M3.53577 20.4645L7.0713 9.85791L14.1424 16.929L3.53577 20.4645Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tooltip-text">Reception</span>
            </div>
          )}
        </div>

        {/* Registration Information */}
        <div className="registration-card-info-vertical">
          <p className="registration-card-race-date-vertical">
            <strong>Race Date:</strong> {formatDate(race.date)}
          </p>
          
          {race.earlyBirdCost && (
            <p className="registration-card-price-vertical">
              <strong>Early Bird:</strong> <span className="race-card-registration-cost">{race.earlyBirdCost}</span>
              <br />
              <small>{formatDate(race.registrationStart, "registration") || "N/A"} → {formatDate(race.earlyBirdDeadline, "registration") || "N/A"}</small>
            </p>
          )}
          
          {(race.registrationStart || race.registrationDeadline) && (
            <p className="registration-card-price-vertical">
              <strong>Regular:</strong> <span className="race-card-registration-cost">{race.registrationCost}</span>
              <br />
              <small>
                {(() => {
                  let iso = null;
                  if (race.earlyBirdDeadline) {
                    const d = new Date(race.earlyBirdDeadline);
                    if (!isNaN(d)) {
                      d.setDate(d.getDate() + 1);
                      iso = d.toISOString().split("T")[0];
                    }
                  }
                  if (!iso && race.registrationStart) {
                    iso = String(race.registrationStart);
                  }
                  return formatDate(iso, "registration") || "N/A";
                })()} → {formatDate(race.registrationDeadline, "registration") || "N/A"}
              </small>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
