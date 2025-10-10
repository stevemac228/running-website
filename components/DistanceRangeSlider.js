import { useState } from "react";

export default function DistanceRangeSlider({ onChange }) {
  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);

  const handleMinChange = (e) => {
    const value = parseInt(e.target.value);
    setMinDistance(value);
    onChange({ min: value, max: maxDistance >= 50 ? 999 : maxDistance });
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxDistance(value);
    onChange({ min: minDistance, max: value >= 50 ? 999 : value });
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
        />
        <input
          type="range"
          min="0"
          max="50"
          value={maxDistance}
          onChange={handleMaxChange}
          className="range-slider range-slider-max"
        />
      </div>
    </div>
  );
}
