import React, { useState } from "react";
import races from "../data/races.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchFilter from "../components/SearchFilter";
import FilterSidebar from "../components/FilterSidebar";
import CompactRaceCard from "../components/CompactRaceCard";
import DateRangeSelector from "../components/DateRangeSelector";

function parseUSDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const s = String(dateStr).trim();
  if (s.includes("-")) {
    // assume ISO YYYY-MM-DD
    return new Date(s);
  }
  // assume MM/DD/YYYY
  const parts = s.split("/").map(Number);
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return new Date(year, month - 1, day);
  }
  return new Date(s); // fallback
}

// Normalize distance to a number (supports "∞" and string inputs)
function toDistanceNumber(d) {
  if (typeof d === "number") return d;
  if (d === "∞") return Number.POSITIVE_INFINITY;
  const n = Number(d);
  return Number.isFinite(n) ? n : 0;
}

export default function Races() {
  const filterOptions = [
    { key: "5k", label: "5K" },
    { key: "10k", label: "10K" },
    { key: "half", label: "Half Marathon" },
    { key: "full", label: "Marathon" },
    { key: "ultra", label: "Ultra" },
    { key: "medal", label: "Medal" },
    { key: "tshirt", label: "T Shirt" },
    { key: "funRun", label: "Fun Run" },
    { key: "competitive", label: "Competitive" },
    { key: "trail", label: "Trail" },
    { key: "road", label: "Road" },
  ];

  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-asc");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [distanceRange, setDistanceRange] = useState({ min: 0, max: 999 });

  const toggleFilter = (key) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const filteredRaces = races
    .filter((race) => {
      const raceDate = parseUSDate(race.date);

      // Date range filter
      if (dateRange.start && raceDate < dateRange.start) return false;
      if (dateRange.end && raceDate > dateRange.end) return false;

      // Distance range filter (custom slider)
      const distVal = toDistanceNumber(race.distance);
      // Infinity distances should always pass through the range filter
      if (!Number.isFinite(distVal)) {
        // Keep infinity races visible
      } else if (distVal < distanceRange.min || distVal > distanceRange.max) {
        return false;
      }

      // Other filters
      if (activeFilters.includes("medal") && !race.medal) return false;
      if (activeFilters.includes("tshirt") && !race.shirt) return false;
      if (activeFilters.includes("funRun") && race.format !== "Fun")
        return false;
      if (
        activeFilters.includes("competitive") &&
        race.format !== "Competitive"
      )
        return false;
      if (activeFilters.includes("trail") && race.terrain !== "Trail")
        return false;
      if (activeFilters.includes("road") && race.terrain !== "Road")
        return false;

      // Multi-select distance filters
      const distanceFilters = ["5k", "10k", "half", "full", "ultra"].filter(
        (f) => activeFilters.includes(f)
      );
      if (distanceFilters.length > 0) {
        const distanceMap = {
          "5k": 5,
          "10k": 10,
          half: 21.1,
          full: 42.2,
          ultra: 42.3,
        };
        const matchDistance = distanceFilters.some((filter) => {
          const dv = toDistanceNumber(race.distance);
          if (filter === "ultra") return dv > 42.2;
          return Math.abs(dv - distanceMap[filter]) < 1e-9;
        });
        if (!matchDistance) return false;
      }

      return true;
    })
    .filter((race) => {
      const term = searchTerm.toLowerCase();
      return (
        race.name.toLowerCase().includes(term) ||
        race.location?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const dateA = parseUSDate(a.date);
      const dateB = parseUSDate(b.date);
      switch (sortOption) {
        case "date-asc":
          return dateA - dateB;
        case "date-desc":
          return dateB - dateA;
        case "distance-asc":
          return toDistanceNumber(a.distance) - toDistanceNumber(b.distance);
        case "distance-desc":
          return toDistanceNumber(b.distance) - toDistanceNumber(a.distance);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  return (
    <div>
      <Header />
      <main className="races-page-container">
        {/* Search Bar - Centered */}
        <div className="races-search-bar">
          <SearchFilter onSearch={setSearchTerm} />
        </div>

        {/* Two-column layout: Sidebar + Content */}
        <div className="races-content-wrapper">
          {/* Left Sidebar */}
          <FilterSidebar
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            onDistanceRangeChange={setDistanceRange}
          />

          {/* Right Content */}
          <div className="races-list-container">
            {/* Races count and sorting on same line */}
            <div className="races-header-bar">
              <div className="races-count">
                {filteredRaces.length} race{filteredRaces.length !== 1 ? "s" : ""} found
              </div>
              <div className="races-controls">
                <DateRangeSelector onChange={setDateRange} />
                <select
                  className="sort-dropdown"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="date-asc">Date (Soonest)</option>
                  <option value="date-desc">Date (Latest)</option>
                  <option value="distance-asc">Distance (Shortest)</option>
                  <option value="distance-desc">Distance (Longest)</option>
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="name-desc">Name (Z–A)</option>
                </select>
              </div>
            </div>
            {filteredRaces.map((race, index) => (
              <CompactRaceCard key={index} race={race} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
