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
  }, [activeFilters, formatFilter, sortOption, dateRange, distanceRange]);

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
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏃</span>
                        <span>5K</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('10k')}>
                        <input type="checkbox" checked={activeFilters.includes('10k')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏃‍♂️</span>
                        <span>10K</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('half')}>
                        <input type="checkbox" checked={activeFilters.includes('half')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏃‍♀️</span>
                        <span>Half Marathon</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('full')}>
                        <input type="checkbox" checked={activeFilters.includes('full')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏅</span>
                        <span>Marathon</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('ultra')}>
                        <input type="checkbox" checked={activeFilters.includes('ultra')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>⚡</span>
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
                        <span style={{fontSize: '18px', flexShrink: 0}}>🎉</span>
                        <span>Fun Run</span>
                      </div>
                      <div className="dropdown-item" onClick={() => setFormatFilter(formatFilter === 'competitive' ? '' : 'competitive')}>
                        <input type="radio" checked={formatFilter === 'competitive'} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏆</span>
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
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏔️</span>
                        <span>Trail</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('road')}>
                        <input type="checkbox" checked={activeFilters.includes('road')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🛣️</span>
                        <span>Road</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('gravel')}>
                        <input type="checkbox" checked={activeFilters.includes('gravel')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🪨</span>
                        <span>Gravel</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('track')}>
                        <input type="checkbox" checked={activeFilters.includes('track')} readOnly />
                        <span style={{fontSize: '18px', flexShrink: 0}}>🏃</span>
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0}}>
                          <path d="M15.9201 12.8959L19.2583 8.89003C19.533 8.5604 19.6704 8.39557 19.7681 8.21065C19.8548 8.0466 19.9183 7.87128 19.9567 7.68973C20 7.48508 20 7.27053 20 6.84144V6.2C20 5.07989 20 4.51984 19.782 4.09202C19.5903 3.71569 19.2843 3.40973 18.908 3.21799C18.4802 3 17.9201 3 16.8 3H7.2C6.0799 3 5.51984 3 5.09202 3.21799C4.71569 3.40973 4.40973 3.71569 4.21799 4.09202C4 4.51984 4 5.07989 4 6.2V6.84144C4 7.27053 4 7.48508 4.04328 7.68973C4.08168 7.87128 4.14515 8.0466 4.23188 8.21065C4.32964 8.39557 4.467 8.5604 4.74169 8.89003L8.07995 12.8959M13.4009 11.1989L19.3668 3.53988M10.5991 11.1989L4.6394 3.53414M6.55673 6H17.4505M17 16C17 18.7614 14.7614 21 12 21C9.23858 21 7 18.7614 7 16C7 13.2386 9.23858 11 12 11C14.7614 11 17 13.2386 17 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                        <span>Medal</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('reception')}>
                        <input type="checkbox" checked={activeFilters.includes('reception')} readOnly />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0}}>
                          <path d="M5.5713 14.5L9.46583 18.4141M18.9996 3.60975C17.4044 3.59505 16.6658 4.33233 16.4236 5.07743C16.2103 5.73354 16.4052 7.07735 15.896 8.0727C15.4091 9.02443 14.1204 9.5617 12.6571 9.60697M20 7.6104L20.01 7.61049M19 15.96L19.01 15.9601M7.00001 3.94926L7.01001 3.94936M19 11.1094C17.5 11.1094 16.5 11.6094 15.5949 12.5447M10.2377 7.18796C11 6.10991 11.5 5.10991 11.0082 3.52734M3.53577 20.4645L7.0713 9.85791L14.1424 16.929L3.53577 20.4645Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Reception</span>
                      </div>
                      <div className="dropdown-item" onClick={() => toggleFilter('tshirt')}>
                        <input type="checkbox" checked={activeFilters.includes('tshirt')} readOnly />
                        <svg width="18" height="18" viewBox="0 0 470.381 470.381" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0}}>
                          <path d="M462.158,96.555L294.402,47.959c-1.033-0.3-2.098-0.45-3.17-0.45H179.155c-1.074,0-2.142,0.15-3.171,0.45L8.224,96.555C3.355,97.968,0,102.425,0,107.499v97.198c0,3.511,1.619,6.833,4.396,8.991c2.771,2.159,6.376,2.927,9.787,2.059l73.95-18.65v214.38c0,6.293,5.103,11.395,11.396,11.395h271.329c6.293,0,11.396-5.102,11.396-11.395V197.096l73.943,18.65c3.41,0.868,7.021,0.1,9.793-2.059s4.391-5.48,4.391-8.991v-97.198C470.381,102.424,467.031,97.968,462.158,96.555z M283.236,70.298c-3.311,23.586-23.564,41.808-48.045,41.808c-24.482,0-44.734-18.222-48.045-41.808H283.236z M447.592,190.069l-73.945-18.65c-3.406-0.868-7.023-0.095-9.793,2.059c-2.771,2.159-4.391,5.48-4.391,8.991v217.614H110.924V182.468c0-3.511-1.619-6.833-4.396-8.991c-2.771-2.153-6.376-2.927-9.787-2.059l-73.951,18.65v-74.007l142.032-41.146c5.481,33.945,34.903,59.98,70.368,59.98c35.47,0,64.886-26.035,70.369-59.98l142.033,41.147V190.069z" />
                        </svg>
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
