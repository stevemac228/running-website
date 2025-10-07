import React, { useState } from "react";
import races from "../data/races.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchFilter from "../components/SearchFilter";
import FilterChip from "../components/FilterChip";
import RaceList from "../components/RaceList";
import DateRangeSelector from "../components/DateRangeSelector";

function parseUSDate(dateStr) {
  // expects MM/DD/YYYY
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
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
          if (filter === "ultra") return race.distance > 42.2;
          return race.distance === distanceMap[filter];
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
          return a.distance - b.distance;
        case "distance-desc":
          return b.distance - a.distance;
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
      <main style={{ padding: "1rem" }}>
        <div className="search-and-filters">
          {/* Search input */}
          <SearchFilter onSearch={setSearchTerm} />

          {/* Filter chips */}
          <div className="filters-row">
            <div className="chips">
              {filterOptions.map((opt) => (
                <FilterChip
                  key={opt.key}
                  label={opt.label}
                  active={activeFilters.includes(opt.key)}
                  onClick={() => toggleFilter(opt.key)}
                />
              ))}
            </div>

            {/* Sort + Date Range */}
            <div className="sort-and-date">
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
        </div>

        {/* Race list */}
        <RaceList races={filteredRaces} type="all" />
      </main>
      <Footer />
    </div>
  );
}
