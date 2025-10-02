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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21 20l-5.6-5.6A7.936 7.936 0 0016 9a8 8 0 10-8 8 7.936 7.936 0 005.4-2.6L20 21l1-1zM4 9a5 5 0 115 5 5.006 5.006 0 01-5-5z" />
        </svg>

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
