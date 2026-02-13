import { useState } from "react";

export default function PaceCalculator({ distance }) {
  const [paceMinutes, setPaceMinutes] = useState("");
  const [paceSeconds, setPaceSeconds] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");
  const [lastEdited, setLastEdited] = useState(null); // "pace" or "time"

  // Calculate time from pace
  const calculateTimeFromPace = (dist, paceMin, paceSec) => {
    if (!dist || (!paceMin && !paceSec)) return;

    const distNum = parseFloat(dist);
    const paceInSeconds = (parseInt(paceMin) || 0) * 60 + (parseInt(paceSec) || 0);

    if (distNum <= 0 || paceInSeconds <= 0) return;

    const totalSeconds = distNum * paceInSeconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    setTimeHours(hours.toString());
    setTimeMinutes(minutes.toString());
    setTimeSeconds(seconds.toString());
  };

  // Calculate pace from time
  const calculatePaceFromTime = (dist, hrs, mins, secs) => {
    if (!dist || (!hrs && !mins && !secs)) return;

    const distNum = parseFloat(dist);
    const totalTimeSeconds = (parseInt(hrs) || 0) * 3600 + (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);

    if (distNum <= 0 || totalTimeSeconds <= 0) return;

    const paceInSeconds = totalTimeSeconds / distNum;
    const paceMin = Math.floor(paceInSeconds / 60);
    const paceSec = Math.floor(paceInSeconds % 60);

    setPaceMinutes(paceMin.toString());
    setPaceSeconds(paceSec.toString());
  };

  // Handle pace changes
  const handlePaceChange = (field, value) => {
    setLastEdited("pace");

    if (field === "minutes") {
      setPaceMinutes(value);
      calculateTimeFromPace(distance, value, paceSeconds);
    } else {
      setPaceSeconds(value);
      calculateTimeFromPace(distance, paceMinutes, value);
    }
  };

  // Handle time changes
  const handleTimeChange = (field, value) => {
    setLastEdited("time");

    if (field === "hours") {
      setTimeHours(value);
      calculatePaceFromTime(distance, value, timeMinutes, timeSeconds);
    } else if (field === "minutes") {
      setTimeMinutes(value);
      calculatePaceFromTime(distance, timeHours, value, timeSeconds);
    } else {
      setTimeSeconds(value);
      calculatePaceFromTime(distance, timeHours, timeMinutes, value);
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
        {/* Pace */}
        <div className="pace-calculator-field">
          <label className="pace-calculator-label">
            Pace (per km)
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
