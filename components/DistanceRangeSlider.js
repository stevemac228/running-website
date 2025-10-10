import { useState } from "react";

export default function DistanceRangeSlider({ onChange }) {
  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(100);

  const handleMinChange = (e) => {
    const value = parseInt(e.target.value);
    setMinDistance(value);
    onChange({ min: value, max: maxDistance });
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxDistance(value);
    onChange({ min: minDistance, max: value });
  };

  return (
    <div className="distance-range-slider">
      <label className="filter-section-label">Distance Range (km)</label>
      <div className="slider-values">
        <span>{minDistance}km</span>
        <span>{maxDistance}km</span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={minDistance}
          onChange={handleMinChange}
          className="range-slider"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={maxDistance}
          onChange={handleMaxChange}
          className="range-slider"
        />
      </div>
    </div>
  );
}
