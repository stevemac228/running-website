import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import races from "../../data/races.json";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import SearchFilter from "../../components/SearchFilter/SearchFilter";
import CompactRaceCard from "../../components/CompactRaceCard/CompactRaceCard";
import DateRangeSelector from "../../components/DateRangeSelector/DateRangeSelector";
import RacesMapView from "../../components/RacesMapView/RacesMapView";
import DistanceRangeSlider from "../../components/DistanceRangeSlider/DistanceRangeSlider";
import { filterRacesBySearch } from "../../utils/categorySearch";

// Simple debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

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
  const router = useRouter();

  const [activeFilters, setActiveFilters] = useState([]);
  const [formatFilter, setFormatFilter] = useState(""); // Single select for format
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-asc");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [distanceRange, setDistanceRange] = useState({ min: 0, max: 999 });
  const [viewMode, setViewMode] = useState("mixed"); // 'list' | 'mixed' | 'map'
  const [expandedRaceId, setExpandedRaceId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openRegistrationsOnly, setOpenRegistrationsOnly] = useState(false);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
  const raceCardRefs = useRef({});

  // Initialize Fuse.js for fuzzy search
  const fuseRef = useRef(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const FuseModule = (await import("fuse.js")).default;
        if (!mounted) return;
        fuseRef.current = new FuseModule(races, {
          keys: [
            { name: "name", weight: 0.7 },
            { name: "nickName", weight: 0.5 },
            { name: "location", weight: 0.4 },
          ],
          includeScore: true,
          threshold: 0.4,
          distance: 100,
          minMatchCharLength: 2,
        });
      } catch (err) {
        fuseRef.current = null;
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.custom-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Debounce search term to reduce re-renders from typing
  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  // Helper function to apply fuzzy search with category matching
  const applyFuzzySearch = useCallback((term, raceList) => {
    if (!term || term.trim() === "") return raceList;
    
    // Use the category-aware search utility
    return filterRacesBySearch(raceList, term, fuseRef.current);
  }, []);

  // sync searchTerm from query param when arriving with ?search=...
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.search || "";
    if (q && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [router.isReady]);

  // Memoized search handler to prevent SearchFilter from causing infinite loops
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const toggleFilter = (key) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const toggleOrganizer = (org) => {
    setSelectedOrganizers((prev) =>
      prev.includes(org) ? prev.filter((o) => o !== org) : [...prev, org]
    );
  };

  // Extract unique organizers from races data
  const uniqueOrganizers = useMemo(() => {
    const orgs = new Set();
    races.forEach((race) => {
      if (race.organization) {
        orgs.add(race.organization);
      }
    });
    return Array.from(orgs).sort();
  }, []);

  // Helper to parse price string to number
  const parsePriceToNumber = (priceStr) => {
    if (!priceStr) return null;
    const numStr = priceStr.replace(/[$,]/g, "");
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  };

  // Helper to check if registration is open
  const isRegistrationOpen = (race) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    const regStart = race.registrationStart ? parseUSDate(race.registrationStart) : null;
    const regDeadline = race.registrationDeadline ? parseUSDate(race.registrationDeadline) : null;
    
    if (!regStart || !regDeadline) return false;
    
    return today >= regStart && today <= regDeadline;
  };

  // helper: extract month/day from Date or string
  const monthDayFrom = (input) => {
    if (!input) return { m: 0, d: 0 };
    if (input instanceof Date && !isNaN(input)) {
      return { m: input.getMonth() + 1, d: input.getDate() };
    }
    const s = String(input).trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(s)) {
      const [y, mo, da] = s.split("-").map(Number);
      return { m: mo, d: da };
    }
    const us = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/;
    const m = s.match(us);
    if (m) return { m: Number(m[1]), d: Number(m[2]) };
    const parsed = new Date(s);
    if (!isNaN(parsed)) return { m: parsed.getMonth() + 1, d: parsed.getDate() };
    return { m: 0, d: 0 };
  };

  const compareMonthDay = (a, b) => {
    const A = monthDayFrom(a);
    const B = monthDayFrom(b);
    if (A.m !== B.m) return A.m - B.m;
    return A.d - B.d;
  };

  // Pre-compute filtered races before search (so we can apply search to results)
  const allFilteredRaces = useMemo(() => {
    return races
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

        // Features filters (multi-select)
        if (activeFilters.includes("medal") && !race.medal) return false;
        if (activeFilters.includes("reception") && !race.reception) return false;
        if (activeFilters.includes("tshirt") && !race.shirt) return false;
        
        // Format filter (single select)
        if (formatFilter === "funRun" && race.format !== "Fun") return false;
        if (formatFilter === "competitive" && race.format !== "Competitive") return false;
        
        // Terrain filters (multi-select)
        const terrainFilters = ["trail", "road", "gravel", "track"].filter(
          (f) => activeFilters.includes(f)
        );
        if (terrainFilters.length > 0) {
          const matchTerrain = terrainFilters.some((filter) => {
            if (filter === "trail") return race.terrain === "Trail";
            if (filter === "road") return race.terrain === "Road";
            if (filter === "gravel") return race.terrain === "Gravel";
            if (filter === "track") return race.terrain === "Track";
            return false;
          });
          if (!matchTerrain) return false;
        }

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

        // Open registrations filter
        if (openRegistrationsOnly && !isRegistrationOpen(race)) return false;

        // Organizer filter (multi-select)
        if (selectedOrganizers.length > 0 && !selectedOrganizers.includes(race.organization)) {
          return false;
        }

        // Price range filter
        const earlyBirdPrice = parsePriceToNumber(race.earlyBirdCost);
        const regPrice = parsePriceToNumber(race.registrationCost);
        
        // Consider a race if either price exists and is within range
        if (earlyBirdPrice !== null || regPrice !== null) {
          const lowestPrice = earlyBirdPrice !== null && regPrice !== null 
            ? Math.min(earlyBirdPrice, regPrice)
            : (earlyBirdPrice !== null ? earlyBirdPrice : regPrice);
          
          if (lowestPrice < priceRange.min || lowestPrice > priceRange.max) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = parseUSDate(a.date);
        const dateB = parseUSDate(b.date);
        switch (sortOption) {
          case "date-asc":
            return compareMonthDay(dateA, dateB);
          case "date-desc":
            return compareMonthDay(dateB, dateA);
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
  }, [activeFilters, formatFilter, sortOption, dateRange, distanceRange, openRegistrationsOnly, selectedOrganizers, priceRange]);

  // Apply fuzzy search to filtered races
  const filteredRaces = useMemo(() => {
    return applyFuzzySearch(debouncedSearchTerm, allFilteredRaces);
  }, [debouncedSearchTerm, allFilteredRaces, applyFuzzySearch]);

  return (
    <div>
      <Head>
        <title>All Newfoundland Races | Run NL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta
          name="description"
          content="Filter and explore every Newfoundland and Labrador running race by date, distance, and terrain on Run NL."
        />
        <link rel="canonical" href="https://www.runnl.ca/races" />
        <meta property="og:title" content="All Newfoundland Races | Run NL" />
        <meta
          property="og:description"
          content="Filter and explore every Newfoundland and Labrador running race by date, distance, and terrain."
        />
        <meta property="og:url" content="https://www.runnl.ca/races" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "All Newfoundland Races",
              url: "https://www.runnl.ca/races",
              description:
                "Filter and explore every Newfoundland and Labrador running race by date, distance, and terrain.",
            }),
          }}
        />
      </Head>
      <Header />
      <main className="races-page-container">
        {/* Search Bar - Centered */}
        <div className="races-search-bar">
          {/* <SearchFilter onSearch={setSearchTerm} initialValue={searchTerm} /> */}
        </div>

        {/* Content wrapper (filters are now a popout) */}
        <div className="races-content-wrapper">
          {/* Right Content: list + optional map side-by-side */}
          <div className="races-list-container">
            <div className="races-header-bar">
              <div className="races-count">
                {filteredRaces.length} race{filteredRaces.length !== 1 ? "s" : ""} found
              </div>
              <div className="races-search-controls">
                <SearchFilter onSearch={handleSearch} initialValue={searchTerm} showDropdown={false} />
              </div>
              <div className="races-controls">
                {/* Distance Dropdown */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <button 
                    className="filter-dropdown"
                    onClick={() => setOpenDropdown(openDropdown === 'distance' ? null : 'distance')}
                  >
                    Distance {activeFilters.filter(f => ["5k", "10k", "half", "full", "ultra"].includes(f)).length > 0 && `(${activeFilters.filter(f => ["5k", "10k", "half", "full", "ultra"].includes(f)).length})`}
                  </button>
                  {openDropdown === 'distance' && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => toggleFilter('5k')}>
                        <input type="checkbox" checked={activeFilters.includes('5k')} readOnly />
                        <span>5K</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('10k')}>
                        <input type="checkbox" checked={activeFilters.includes('10k')} readOnly />
                        <span>10K</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('half')}>
                        <input type="checkbox" checked={activeFilters.includes('half')} readOnly />
                        <span>Half Marathon</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('full')}>
                        <input type="checkbox" checked={activeFilters.includes('full')} readOnly />
                        <span>Marathon</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('ultra')}>
                        <input type="checkbox" checked={activeFilters.includes('ultra')} readOnly />
                        <span>Ultra</span>
                      </div>
                      <div style={{padding: '10px', borderTop: '1px solid #ddd'}}>
                        <DistanceRangeSlider onChange={setDistanceRange} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Format Dropdown (Single Select) */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <button 
                    className="filter-dropdown"
                    onClick={() => setOpenDropdown(openDropdown === 'format' ? null : 'format')}
                  >
                    Format {formatFilter && `(${formatFilter === 'funRun' ? 'Fun Run' : 'Competitive'})`}
                  </button>
                  {openDropdown === 'format' && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => setFormatFilter(formatFilter === 'funRun' ? '' : 'funRun')}>
                        <input type="radio" checked={formatFilter === 'funRun'} readOnly />
                        <span>Fun Run</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setFormatFilter(formatFilter === 'competitive' ? '' : 'competitive')}>
                        <input type="radio" checked={formatFilter === 'competitive'} readOnly />
                        <span>Competitive</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Terrain Dropdown */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <button 
                    className="filter-dropdown"
                    onClick={() => setOpenDropdown(openDropdown === 'terrain' ? null : 'terrain')}
                  >
                    Terrain {activeFilters.filter(f => ["trail", "road", "gravel", "track"].includes(f)).length > 0 && `(${activeFilters.filter(f => ["trail", "road", "gravel", "track"].includes(f)).length})`}
                  </button>
                  {openDropdown === 'terrain' && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => toggleFilter('trail')}>
                        <input type="checkbox" checked={activeFilters.includes('trail')} readOnly />
                        <span>Trail</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('road')}>
                        <input type="checkbox" checked={activeFilters.includes('road')} readOnly />
                        <span>Road</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('gravel')}>
                        <input type="checkbox" checked={activeFilters.includes('gravel')} readOnly />
                        <span>Gravel</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('track')}>
                        <input type="checkbox" checked={activeFilters.includes('track')} readOnly />
                        <span>Track</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Dropdown */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <button 
                    className="filter-dropdown"
                    onClick={() => setOpenDropdown(openDropdown === 'features' ? null : 'features')}
                  >
                    Features {activeFilters.filter(f => ["medal", "reception", "tshirt"].includes(f)).length > 0 && `(${activeFilters.filter(f => ["medal", "reception", "tshirt"].includes(f)).length})`}
                  </button>
                  {openDropdown === 'features' && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => toggleFilter('medal')}>
                        <input type="checkbox" checked={activeFilters.includes('medal')} readOnly />
                        <span>Medal</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('reception')}>
                        <input type="checkbox" checked={activeFilters.includes('reception')} readOnly />
                        <span>Reception</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('tshirt')}>
                        <input type="checkbox" checked={activeFilters.includes('tshirt')} readOnly />
                        <span>T-Shirt</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range Dropdown */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <DateRangeSelector 
                    onChange={setDateRange}
                    isOpen={openDropdown === 'dates'}
                    onToggle={() => setOpenDropdown(openDropdown === 'dates' ? null : 'dates')}
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <button 
                    className="filter-dropdown"
                    onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  >
                    Sort
                  </button>
                  {openDropdown === 'sort' && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => setSortOption('date-asc')}>
                        <input type="radio" checked={sortOption === 'date-asc'} readOnly />
                        <span>Date (Soonest)</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setSortOption('date-desc')}>
                        <input type="radio" checked={sortOption === 'date-desc'} readOnly />
                        <span>Date (Latest)</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setSortOption('distance-asc')}>
                        <input type="radio" checked={sortOption === 'distance-asc'} readOnly />
                        <span>Distance (Shortest)</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setSortOption('distance-desc')}>
                        <input type="radio" checked={sortOption === 'distance-desc'} readOnly />
                        <span>Distance (Longest)</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setSortOption('name-asc')}>
                        <input type="radio" checked={sortOption === 'name-asc'} readOnly />
                        <span>Name (A–Z)</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setSortOption('name-desc')}>
                        <input type="radio" checked={sortOption === 'name-desc'} readOnly />
                        <span>Name (Z–A)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Filters Dropdown */}
                <div className="custom-dropdown" style={{position: 'relative'}}>
                  <button 
                    className="filter-dropdown"
                    onClick={() => setOpenDropdown(openDropdown === 'additional' ? null : 'additional')}
                  >
                    More Filters {(openRegistrationsOnly || selectedOrganizers.length > 0) && `(${(openRegistrationsOnly ? 1 : 0) + selectedOrganizers.length})`}
                  </button>
                  {openDropdown === 'additional' && (
                    <div className="dropdown-menu" style={{minWidth: '280px'}}>
                      {/* Open Registrations */}
                      <div className="dropdown-item" onClick={() => setOpenRegistrationsOnly(!openRegistrationsOnly)}>
                        <input type="checkbox" checked={openRegistrationsOnly} readOnly />
                        <span>Open Registrations Only</span>
                      </div>
                      
                      <div style={{padding: '0.5rem 1rem', borderBottom: '1px solid #f0f0f0', fontWeight: '600', fontSize: '0.85rem', color: 'var(--runnl-dark-grey)'}}>
                        Organizers
                      </div>
                      
                      {/* Organizers - scrollable list */}
                      <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                        {uniqueOrganizers.map((org) => (
                          <div key={org} className="dropdown-item" onClick={() => toggleOrganizer(org)}>
                            <input type="checkbox" checked={selectedOrganizers.includes(org)} readOnly />
                            <span>{org}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{padding: '0.5rem 1rem', borderTop: '1px solid #f0f0f0', fontWeight: '600', fontSize: '0.85rem', color: 'var(--runnl-dark-grey)'}}>
                        Price Range
                      </div>
                      
                      {/* Price Range Slider */}
                      <div style={{padding: '0.5rem 1rem'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
                          <span>${priceRange.min}</span>
                          <span>${priceRange.max === 200 ? '200+' : priceRange.max}</span>
                        </div>
                        <div style={{position: 'relative', height: '30px', display: 'flex', alignItems: 'center'}}>
                          <div style={{position: 'absolute', width: '100%', height: '6px', background: '#ddd', borderRadius: '3px'}}></div>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            step="5"
                            value={priceRange.min}
                            onChange={(e) => {
                              const newMin = Number(e.target.value);
                              if (newMin <= priceRange.max) {
                                setPriceRange({...priceRange, min: newMin});
                              }
                            }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              appearance: 'none',
                              background: 'transparent',
                              pointerEvents: 'none',
                              margin: 0,
                              padding: 0,
                              zIndex: 3
                            }}
                            className="range-slider range-slider-min"
                          />
                          <input
                            type="range"
                            min="0"
                            max="200"
                            step="5"
                            value={priceRange.max}
                            onChange={(e) => {
                              const newMax = Number(e.target.value);
                              if (newMax >= priceRange.min) {
                                setPriceRange({...priceRange, max: newMax});
                              }
                            }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              appearance: 'none',
                              background: 'transparent',
                              pointerEvents: 'none',
                              margin: 0,
                              padding: 0,
                              zIndex: 4
                            }}
                            className="range-slider range-slider-max"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="view-segment" role="tablist" aria-label="View mode">
                  <button
                    className={`seg-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    role="tab"
                    aria-selected={viewMode === "list"}
                  >
                    List
                  </button>
                  <button
                    className={`seg-btn ${viewMode === "mixed" ? "active" : ""}`}
                    onClick={() => setViewMode("mixed")}
                    role="tab"
                    aria-selected={viewMode === "mixed"}
                  >
                    Mixed
                  </button>
                  {/* <button
                    className={`seg-btn ${viewMode === "map" ? "active" : ""}`}
                    onClick={() => setViewMode("map")}
                    role="tab"
                    aria-selected={viewMode === "map"}
                  >
                    Map
                  </button> */}
                </div>
              </div>
            </div>

            <div
              className={`races-list-map-flex ${
                viewMode === "mixed" ? "map-on" : viewMode === "map" ? "map-only" : "list-only"
              }`}
            >
              {viewMode !== "map" && (
                <div className="races-list-column">
                  {filteredRaces.map((race, index) => (
                    <CompactRaceCard
                      key={index}
                      ref={(el) => {
                        if (el) {
                          raceCardRefs.current[race.id] = el;
                        }
                      }}
                      race={race}
                      isExpanded={expandedRaceId === race.id}
                      onExpanded={(expanded) =>
                        setExpandedRaceId(expanded ? race.id : null)
                      }
                    />
                  ))}
                  {viewMode === "mixed" && <Footer />}
                </div>
              )}

              {viewMode !== "list" && (
                <div className="races-map-column">
                  <RacesMapView
                    filteredRaces={filteredRaces}
                    expandedRaceId={expandedRaceId}
                    viewMode={viewMode}
                    onMarkerClick={(raceId) => {
                      // Set the new expanded race ID
                      setExpandedRaceId(raceId);
                      
                      // Only scroll to card if not in map-only view
                      if (viewMode !== 'map') {
                        setTimeout(() => {
                          const cardRef = raceCardRefs.current[raceId];
                          if (cardRef) {
                            cardRef.scrollIntoView();
                          }
                        }, 100);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {viewMode !== "mixed" && <Footer />}
    </div>
  );
}
