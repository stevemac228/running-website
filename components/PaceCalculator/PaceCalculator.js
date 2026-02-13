import { useState, useEffect } from "react";

export default function PaceCalculator({ distance }) {
  const [distanceValue, setDistanceValue] = useState(distance || "");
  const [paceMinutes, setPaceMinutes] = useState("");
  const [paceSeconds, setPaceSeconds] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");
  const [unit, setUnit] = useState("km"); // "km" or "mi"
  const [lastEdited, setLastEdited] = useState(null); // "pace" or "time"

  // Update distance when prop changes
  useEffect(() => {
    if (distance) {
      setDistanceValue(distance);
    }
  }, [distance]);

  // Calculate time from pace
  const calculateTimeFromPace = (dist, paceMin, paceSec, currentUnit) => {
    if (!dist || (!paceMin && !paceSec)) return;

    const distNum = parseFloat(dist);
    const paceInSeconds = (parseInt(paceMin) || 0) * 60 + (parseInt(paceSec) || 0);

    if (distNum <= 0 || paceInSeconds <= 0) return;

    // Convert distance to km if in miles
    const distInKm = currentUnit === "mi" ? distNum * 1.60934 : distNum;

    const totalSeconds = distInKm * paceInSeconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    setTimeHours(hours.toString());
    setTimeMinutes(minutes.toString());
    setTimeSeconds(seconds.toString());
  };

  // Calculate pace from time
  const calculatePaceFromTime = (dist, hrs, mins, secs, currentUnit) => {
    if (!dist || (!hrs && !mins && !secs)) return;

    const distNum = parseFloat(dist);
    const totalTimeSeconds = (parseInt(hrs) || 0) * 3600 + (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);

    if (distNum <= 0 || totalTimeSeconds <= 0) return;

    // Convert distance to km if in miles
    const distInKm = currentUnit === "mi" ? distNum * 1.60934 : distNum;

    const paceInSeconds = totalTimeSeconds / distInKm;
    const paceMin = Math.floor(paceInSeconds / 60);
    const paceSec = Math.floor(paceInSeconds % 60);

    setPaceMinutes(paceMin.toString());
    setPaceSeconds(paceSec.toString());
  };

  // Handle distance change
  const handleDistanceChange = (e) => {
    const value = e.target.value;
    setDistanceValue(value);

    if (lastEdited === "pace" && paceMinutes) {
      calculateTimeFromPace(value, paceMinutes, paceSeconds, unit);
    } else if (lastEdited === "time" && timeMinutes) {
      calculatePaceFromTime(value, timeHours, timeMinutes, timeSeconds, unit);
    }
  };

  // Handle pace changes
  const handlePaceChange = (field, value) => {
    setLastEdited("pace");

    if (field === "minutes") {
      setPaceMinutes(value);
      calculateTimeFromPace(distanceValue, value, paceSeconds, unit);
    } else {
      setPaceSeconds(value);
      calculateTimeFromPace(distanceValue, paceMinutes, value, unit);
    }
  };

  // Handle time changes
  const handleTimeChange = (field, value) => {
    setLastEdited("time");

    if (field === "hours") {
      setTimeHours(value);
      calculatePaceFromTime(distanceValue, value, timeMinutes, timeSeconds, unit);
    } else if (field === "minutes") {
      setTimeMinutes(value);
      calculatePaceFromTime(distanceValue, timeHours, value, timeSeconds, unit);
    } else {
      setTimeSeconds(value);
      calculatePaceFromTime(distanceValue, timeHours, timeMinutes, value, unit);
    }
  };

  // Handle unit toggle
  const handleUnitToggle = () => {
    const newUnit = unit === "km" ? "mi" : "km";
    setUnit(newUnit);

    // Recalculate based on last edited field
    if (lastEdited === "pace" && paceMinutes) {
      calculateTimeFromPace(distanceValue, paceMinutes, paceSeconds, newUnit);
    } else if (lastEdited === "time" && timeMinutes) {
      calculatePaceFromTime(distanceValue, timeHours, timeMinutes, timeSeconds, newUnit);
    }
  };

  // Clear all fields
  const handleClear = () => {
    setPaceMinutes("");
    setPaceSeconds("");
    setTimeHours("");
    setTimeMinutes("");
    setTimeSeconds("");
    setLastEdited(null);
  };

  return (
    <div className="pace-calculator">
      <h2 className="pace-calculator-title">Pace / Time Calculator</h2>

      <div className="pace-calculator-grid">
        {/* Distance */}
        <div className="pace-calculator-field">
          <label className="pace-calculator-label">
            Distance ({unit})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={distanceValue}
            onChange={handleDistanceChange}
            className="pace-calculator-input"
            placeholder="10"
          />
        </div>

        {/* Pace */}
        <div className="pace-calculator-field">
          <label className="pace-calculator-label">
            Pace (per {unit})
            <button
              onClick={handleUnitToggle}
              className="pace-calculator-unit-toggle"
              type="button"
            >
              Switch to {unit === "km" ? "mi" : "km"}
            </button>
          </label>
          <div className="pace-calculator-time-inputs">
            <div className="pace-calculator-time-input-group">
              <input
                type="number"
                min="0"
                max="59"
                value={paceMinutes}
                onChange={(e) => handlePaceChange("minutes", e.target.value)}
                className="pace-calculator-input pace-calculator-input-small"
                placeholder="5"
              />
              <span className="pace-calculator-time-unit">min</span>
            </div>
            <span className="pace-calculator-time-separator">:</span>
            <div className="pace-calculator-time-input-group">
              <input
                type="number"
                min="0"
                max="59"
                value={paceSeconds}
                onChange={(e) => handlePaceChange("seconds", e.target.value)}
                className="pace-calculator-input pace-calculator-input-small"
                placeholder="30"
              />
              <span className="pace-calculator-time-unit">sec</span>
            </div>
          </div>
        </div>

        {/* Elapsed Time */}
        <div className="pace-calculator-field">
          <label className="pace-calculator-label">Elapsed Time</label>
          <div className="pace-calculator-time-inputs">
            <div className="pace-calculator-time-input-group">
              <input
                type="number"
                min="0"
                value={timeHours}
                onChange={(e) => handleTimeChange("hours", e.target.value)}
                className="pace-calculator-input pace-calculator-input-small"
                placeholder="0"
              />
              <span className="pace-calculator-time-unit">hr</span>
            </div>
            <span className="pace-calculator-time-separator">:</span>
            <div className="pace-calculator-time-input-group">
              <input
                type="number"
                min="0"
                max="59"
                value={timeMinutes}
                onChange={(e) => handleTimeChange("minutes", e.target.value)}
                className="pace-calculator-input pace-calculator-input-small"
                placeholder="55"
              />
              <span className="pace-calculator-time-unit">min</span>
            </div>
            <span className="pace-calculator-time-separator">:</span>
            <div className="pace-calculator-time-input-group">
              <input
                type="number"
                min="0"
                max="59"
                value={timeSeconds}
                onChange={(e) => handleTimeChange("seconds", e.target.value)}
                className="pace-calculator-input pace-calculator-input-small"
                placeholder="0"
              />
              <span className="pace-calculator-time-unit">sec</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleClear}
        className="pace-calculator-clear"
        type="button"
      >
        Clear
      </button>
    </div>
  );
}
