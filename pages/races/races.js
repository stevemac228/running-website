import React, { useState, useEffect, useRef } from "react";
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

  // sync searchTerm from query param when arriving with ?search=...
  useEffect(() => {
    if (!router.isReady) return;
    const q =
      typeof router.query.search === "string" ? router.query.search : "";
    if (q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [router.isReady, router.query.search]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <Footer />
    </div>
  );
}
