import { useState } from "react";
import RaceList from "../components/RaceList";
import FilterChip from "../components/FilterChip";
import Header from "../components/Header";
import races from "../data/races.json";
import SearchFilter from "../components/SearchFilter";

export default function Races() {
  console.log("Races passed in:", races);
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
  const [searchTerm, setSearchTerm] = useState(""); // new state for search

  const toggleFilter = (key) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const filteredRaces = races.filter(race => {
    // Example filter logic
    if (activeFilters.includes("medal") && !race.medal) return false;
    if (activeFilters.includes("tshirt") && !race.shirt) return false;
    if (activeFilters.includes("funRun") && race.format !== "Fun") return false;
    if (activeFilters.includes("competitive") && race.format !== "Competitive") return false;
    if (activeFilters.includes("trail") && race.terrain !== "Trail") return false;
    if (activeFilters.includes("road") && race.terrain !== "Road") return false;
    
    // Multi-select filters (OR logic): distance
    const distanceFilters = ["5k","10k","half","full","ultra"].filter(f => activeFilters.includes(f));
    if (distanceFilters.length > 0) {
      const distanceMap = {
        "5k": 5,
        "10k": 10,
        "half": 21.1,
        "full": 42.2,
        "ultra": 42.3 // any distance > 42.2
      };

      let matchDistance = distanceFilters.some(filter => {
        if (filter === "ultra") return race.distance > 42.2;
        return race.distance === distanceMap[filter];
      });

      if (!matchDistance) return false;
    }

    return true;
  }).filter(race => {
    // Search filter
    const term = searchTerm.toLowerCase();
    return (
      race.name.toLowerCase().includes(term) ||
      race.city?.toLowerCase().includes(term)
    );
  });

  console.log("Filtered races:", filteredRaces);

  return (
    <div>
      <Header />
      <main style={{ padding: "1rem" }}>

        <h1>All Races</h1>
        <div class="search-and-filters">
          {/* Search input */}
          <SearchFilter onSearch={setSearchTerm} />

          {/* Filter chips */}
          <div class = "chips">
            {filterOptions.map(opt => (
              <FilterChip
                key={opt.key}
                label={opt.label}
                active={activeFilters.includes(opt.key)}
                onClick={() => toggleFilter(opt.key)}
              />
            ))} 
          </div>
        </div>
        
        {/* Race list */}
        <RaceList races={filteredRaces} type="all"/>
      </main>
    </div>
  );
}
