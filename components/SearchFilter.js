import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import races from "../data/races.json";
import { getRaceId } from "../utils/getRaceId";

// Minimal, self-contained search with results dropdown.
export default function SearchFilter({ onSearch, initialValue = "" }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(() => initialValue || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef(null);

  // sync when parent-provided initialValue changes (e.g. when arriving at /races?search=...)
  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    // close on click outside
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    // filter races client-side as user types
    const term = String(inputValue || "").trim().toLowerCase();
    if (term === "") {
      setResults([]);
      setOpen(false);
      if (typeof onSearch === "function") onSearch("");
      return;
    }

    // search by name, nickName, location (simple contains)
    const matched = races
      .filter((r) => {
        const s = `${r.name || ""} ${r.nickName || ""} ${r.location || ""}`.toLowerCase();
        return s.includes(term);
      })
      .slice(0, 20);

    setResults(matched);
    setOpen(matched.length > 0);
    setHighlight(-1);

    // notify parent pages (e.g. races page) about the search term
    if (typeof onSearch === "function") onSearch(inputValue);
  }, [inputValue, onSearch]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    setInputValue("");
    setResults([]);
    setOpen(false);
    setHighlight(-1);
    if (typeof onSearch === "function") onSearch("");
  };

  const navigateToRace = (race) => {
    if (!race) return;
    const id = getRaceId(race);
    router.push(`/race/${encodeURIComponent(id)}`);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (results.length > 0) setOpen(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && results[highlight]) {
        // explicit highlighted item
        navigateToRace(results[highlight]);
      } else if (results.length === 1) {
        // single result -> go to that race
        navigateToRace(results[0]);
      } else if (results.length > 1) {
        // multiple results -> go to /races with search param so All Races page filters
        router.push(`/races?search=${encodeURIComponent(inputValue)}`).catch(()=>{});
        setOpen(false);
      } else {
        // no results -> still navigate to /races with search param
        if (typeof onSearch === "function") onSearch(inputValue);
        router.push(`/races?search=${encodeURIComponent(inputValue)}`).catch(()=>{});
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div className="search-container" ref={wrapperRef} aria-haspopup="listbox">
      <div className="search-wrapper" role="search">
        <img src="/icons/search.svg" alt="Search" className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or city..."
          value={inputValue}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-results-list"
        />
        {inputValue && (
          <button className="clear-btn" onClick={handleClear} aria-label="Clear search">
            ×
          </button>
        )}
      </div>

      {/* Results dropdown attached to bottom of search-wrapper */}
      {open && results.length > 0 && (
        <div className="search-results" role="listbox" id="search-results-list">
          {results.map((race, idx) => (
            <div
              key={getRaceId(race) || `${idx}`}
              role="option"
              aria-selected={highlight === idx}
              className={`search-result-item ${highlight === idx ? "highlight" : ""}`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(ev) => { ev.preventDefault(); /* prevent input blur before click */ }}
              onClick={() => navigateToRace(race)}
            >
              <div className="result-title">{race.name || race.nickName}</div>
              <div className="result-sub">
                {race.location ? `${race.location}` : ""} {race.date ? `• ${race.date}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
