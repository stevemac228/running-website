import { useState } from "react";

export default function DistanceRangeSlider({ onChange }) {
  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);

  const handleMinChange = (e) => {
    const value = parseInt(e.target.value);
    const newMin = Math.min(value, maxDistance);
    setMinDistance(newMin);
    onChange({ min: newMin, max: maxDistance >= 50 ? 999 : maxDistance });
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value);
    const newMax = Math.max(value, minDistance);
    setMaxDistance(newMax);
    onChange({ min: minDistance, max: newMax >= 50 ? 999 : newMax });
  };

  return (
    <div className="distance-range-slider">
      <div className="slider-values">
        <span>{minDistance}km</span>
        <span>{maxDistance >= 50 ? "50+ km" : `${maxDistance}km`}</span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="50"
          value={minDistance}
          onChange={handleMinChange}
          className="range-slider range-slider-min"
          style={{ zIndex: minDistance > maxDistance - 1 ? 5 : 3 }}
        />
        <input
          type="range"
          min="0"
          max="50"
          value={maxDistance}
          onChange={handleMaxChange}
          className="range-slider range-slider-max"
          style={{ zIndex: maxDistance < minDistance + 1 ? 5 : 4 }}
        />
      </div>
    </div>
  );
}
