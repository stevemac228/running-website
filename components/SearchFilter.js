import { useState } from "react";

export default function SearchFilter({ onSearch }) {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClear = () => {
    setInputValue("");  // clear local input
    onSearch("");       // notify parent to reset filtered races
  };

  return (
    <div className="search-container">
      <div className="search-wrapper">
        {/* Search icon */}
        <img src="/icons/search.svg" alt="Search" className="search-icon" fill="none"/>

        {/* Controlled input */}
        <input
          type="text"
          placeholder="Search by name or city..."
          value={inputValue}
          onChange={handleChange}
        />

        {/* Clear button */}
        <button className="clear-btn" onClick={handleClear}>
          ×
        </button>
      </div>
    </div>
  );
}
