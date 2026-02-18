import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import races from "../../data/races.json";
import { getRaceId } from "../../utils/getRaceId";
import { filterRacesBySearch } from "../../utils/categorySearch";

// Minimal, self-contained search with results dropdown.
export default function SearchFilter({ onSearch, initialValue = "", showDropdown = true }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(() => initialValue || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const fuseRef = useRef(null);
  const onSearchRef = useRef(onSearch);
  const initialValueRef = useRef(initialValue);

  // sync when parent-provided initialValue changes (e.g. when arriving at /races?search=...)
  // Only update if it's significantly different (from URL, not from typing)
  useEffect(() => {
    if (initialValue && initialValue !== initialValueRef.current && !inputValue) {
      setInputValue(initialValue);
      initialValueRef.current = initialValue;
    }
  }, [initialValue]);

  // Keep onSearch ref up to date without triggering effects
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

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

  // compute dropdown position when opened so we can render via a portal
  useEffect(() => {
    if (!open || !wrapperRef.current) {
      setDropdownStyle(null);
      return;
    }

    const update = () => {
      // Prefer the visible .search-wrapper element (it defines the visual box)
      // since wrapperRef is attached to the outer container which may include
      // extra margins/padding. This makes the dropdown width match the box.
      const inner = wrapperRef.current.querySelector
        ? wrapperRef.current.querySelector(".search-wrapper")
        : null;
      const target = inner || wrapperRef.current;
      const rect = target.getBoundingClientRect();
      setDropdownStyle({
        left: Math.max(rect.left, 0) + window.scrollX,
        top: rect.bottom + window.scrollY,
        width: rect.width,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    // Initialize Fuse.js for fuzzy searching (client-side only)
    let mounted = true;
    (async () => {
      try {
        const FuseModule = (await import("fuse.js")).default;
        if (!mounted) return;
        // Configure keys and options tuned for name/location matching with typo-tolerance
        fuseRef.current = new FuseModule(races, {
          keys: [
            { name: "name", weight: 0.7 },
            { name: "nickName", weight: 0.5 },
            { name: "location", weight: 0.4 },
          ],
          includeScore: true,
          threshold: 0.4, // lower = stricter, ~0.4 is a common fuzzy default
          distance: 100,
          minMatchCharLength: 2,
        });
      } catch (err) {
        // If import fails, leave fuseRef null and fallback to simple contains search
        fuseRef.current = null;
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // filter races client-side as user types
    const raw = String(inputValue || "").trim();
    const term = raw.toLowerCase();
    
    // If showDropdown is false, skip search results and just notify parent (for races page)
    if (!showDropdown) {
      if (typeof onSearchRef.current === "function") {
        onSearchRef.current(inputValue);
      }
      return;
    }

    // For homepage with dropdown enabled:
    if (term === "") {
      setResults([]);
      setOpen(false);
      if (typeof onSearchRef.current === "function") onSearchRef.current("");
      return;
    }

    // Use category-aware search which combines fuzzy name/location search with category matching
    let matched = filterRacesBySearch(races, raw, fuseRef.current).slice(0, 20);

    setResults(matched);
    setOpen(matched.length > 0);
    setHighlight(-1);

    // notify parent pages (e.g. races page) about the search term
    if (typeof onSearchRef.current === "function") onSearchRef.current(inputValue);
  }, [inputValue, showDropdown]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    setInputValue("");
    setResults([]);
    setOpen(false);
    setHighlight(-1);
    if (typeof onSearchRef.current === "function") onSearchRef.current("");
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
        router.push(`/races/races?search=${encodeURIComponent(inputValue)}`).catch(()=>{});
        setOpen(false);
      } else {
        // no results -> still navigate to /races with search param
        if (typeof onSearchRef.current === "function") onSearchRef.current(inputValue);
        router.push(`/races/races?search=${encodeURIComponent(inputValue)}`).catch(()=>{});
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
          placeholder="Search races, locations, distances..."
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

      {/* Results dropdown rendered via portal (attached to document.body) to avoid
          stacking context issues — we compute an absolute position matching the
          input wrapper so the dropdown appears visually below the input. */}
      {open && results.length > 0 && dropdownStyle && createPortal(
        <div
          className="search-results"
          role="listbox"
          id="search-results-list"
          style={{
            position: "absolute",
            left: `${dropdownStyle.left}px`,
            top: `${dropdownStyle.top}px`,
            width: `${dropdownStyle.width}px`,
            boxSizing: "border-box",
            zIndex: 2147483647,
          }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
