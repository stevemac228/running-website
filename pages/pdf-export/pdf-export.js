import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import races from "../../data/races.json";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { filterRacesBySearch } from "../../utils/categorySearch";
import jsPDF from "jspdf";
import { formatDate } from "../../utils/formatDate";
import { formatTime } from "../../utils/formatTime";

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

export default function PDFExport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRaces, setSelectedRaces] = useState([]);
  const [exportType, setExportType] = useState("list"); // "list" or "calendar"
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    date: true,
    distance: true,
    location: true,
    startTime: false,
    registrationCost: false,
    earlyBirdCost: false,
    website: false,
    terrain: false,
    format: false,
    medal: false,
    shirt: false,
    reception: false,
  });

  const fuseRef = useRef(null);

  // Initialize Fuse.js for fuzzy search
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

  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  // Memoized search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Apply fuzzy search
  const applyFuzzySearch = useCallback((term, raceList) => {
    if (!term || term.trim() === "") return raceList;
    return filterRacesBySearch(raceList, term, fuseRef.current);
  }, []);

  // Filter races based on search term
  const filteredRaces = useMemo(() => {
    return applyFuzzySearch(debouncedSearchTerm, races);
  }, [debouncedSearchTerm, applyFuzzySearch]);

  // Add race to selection
  const addRace = (race) => {
    if (!selectedRaces.find(r => r.id === race.id)) {
      setSelectedRaces([...selectedRaces, race]);
    }
  };

  // Remove race from selection
  const removeRace = (raceId) => {
    setSelectedRaces(selectedRaces.filter(r => r.id !== raceId));
  };

  // Toggle field selection
  const toggleField = (field) => {
    setSelectedFields({
      ...selectedFields,
      [field]: !selectedFields[field]
    });
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    const title = exportType === "calendar" ? "Race Calendar" : "Race List";
    doc.text(title, margin, yPosition);
    yPosition += 10;

    if (exportType === "list") {
      // List format
      selectedRaces.forEach((race, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        
        if (selectedFields.name) {
          doc.text(race.name, margin, yPosition);
          yPosition += 7;
        }

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        if (selectedFields.date) {
          doc.text(`Date: ${formatDate(race.date)}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.distance) {
          const distanceText = race.distance === "∞" ? "∞" : `${race.distance}km`;
          doc.text(`Distance: ${distanceText}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.location) {
          doc.text(`Location: ${race.location}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.startTime && race.startTime) {
          doc.text(`Start Time: ${formatTime(race.startTime)}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.terrain && race.terrain) {
          doc.text(`Terrain: ${race.terrain}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.format && race.format) {
          doc.text(`Format: ${race.format}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.registrationCost && race.registrationCost) {
          doc.text(`Registration Cost: ${race.registrationCost}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.earlyBirdCost && race.earlyBirdCost) {
          doc.text(`Early Bird Cost: ${race.earlyBirdCost}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (selectedFields.website && race.website) {
          doc.setTextColor(0, 0, 255);
          doc.textWithLink(`Website: ${race.website}`, margin + 5, yPosition, { url: race.website });
          doc.setTextColor(0, 0, 0);
          yPosition += 5;
        }

        const features = [];
        if (selectedFields.medal && race.medal) features.push("Medal");
        if (selectedFields.shirt && race.shirt) features.push("T-Shirt");
        if (selectedFields.reception && race.reception) features.push("Reception");
        
        if (features.length > 0) {
          doc.text(`Features: ${features.join(", ")}`, margin + 5, yPosition);
          yPosition += 5;
        }

        yPosition += 5; // Space between races
      });
    } else {
      // Calendar format - group by month
      const racesByMonth = {};
      selectedRaces.forEach(race => {
        const date = new Date(race.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!racesByMonth[monthYear]) {
          racesByMonth[monthYear] = [];
        }
        racesByMonth[monthYear].push(race);
      });

      Object.keys(racesByMonth).sort((a, b) => {
        const dateA = new Date(racesByMonth[a][0].date);
        const dateB = new Date(racesByMonth[b][0].date);
        return dateA - dateB;
      }).forEach(monthYear => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(monthYear, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        racesByMonth[monthYear].forEach(race => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          let line = "";
          if (selectedFields.date) {
            const date = new Date(race.date);
            line += `${date.getDate()}`;
          }
          if (selectedFields.name) {
            line += ` - ${race.name}`;
          }
          if (selectedFields.distance) {
            const distanceText = race.distance === "∞" ? "∞" : `${race.distance}km`;
            line += ` (${distanceText})`;
          }
          if (selectedFields.location) {
            line += ` - ${race.location}`;
          }

          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });

        yPosition += 5; // Space between months
      });
    }

    // Save the PDF
    doc.save("races-export.pdf");
  };

  return (
    <div>
      <Head>
        <title>PDF Export | Run NL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta
          name="description"
          content="Export selected races to PDF in list or calendar format."
        />
      </Head>
      <Header />
      <main className="pdf-export-page">
        <div className="pdf-export-container">
          <h1 className="pdf-export-title">PDF Export</h1>
          <p className="pdf-export-subtitle">
            Search for races, add them to your list, select which information to include, and export to PDF.
          </p>

          {/* Search Section */}
          <div className="pdf-export-section">
            <h2 className="section-title">Search Races</h2>
            <div className="pdf-search-wrapper">
              <img src="/icons/search.svg" alt="Search" className="pdf-search-icon" />
              <input
                type="text"
                placeholder="Search races, marathon, trail..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pdf-search-input"
              />
              {searchTerm && (
                <button className="pdf-search-clear" onClick={() => handleSearch("")} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>
            <div className="search-results">
              {debouncedSearchTerm && filteredRaces.length > 0 && (
                <div className="search-results-list">
                  {filteredRaces.slice(0, 10).map((race) => (
                    <div key={race.id} className="search-result-item" onClick={() => addRace(race)}>
                      <div className="search-result-info">
                        <span className="search-result-name">{race.name}</span>
                        <span className="search-result-details">
                          {race.distance === "∞" ? "∞" : `${race.distance}km`} - {race.location} - {formatDate(race.date)}
                        </span>
                      </div>
                      <button className="add-race-btn" onClick={(e) => { e.stopPropagation(); addRace(race); }}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Races Section */}
          <div className="pdf-export-section">
            <h2 className="section-title">Selected Races ({selectedRaces.length})</h2>
            {selectedRaces.length === 0 ? (
              <p className="no-races-message">No races selected. Search and add races above.</p>
            ) : (
              <div className="selected-races-list">
                {selectedRaces.map((race) => (
                  <div key={race.id} className="selected-race-card">
                    <div className="selected-race-info">
                      <h3 className="selected-race-name">{race.name}</h3>
                      <p className="selected-race-details">
                        {race.distance === "∞" ? "∞" : `${race.distance}km`} - {race.location} - {formatDate(race.date)}
                      </p>
                    </div>
                    <button className="remove-race-btn" onClick={() => removeRace(race.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Field Selection Section */}
          <div className="pdf-export-section">
            <h2 className="section-title">Select Fields to Export</h2>
            <div className="field-selection-grid">
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.name}
                  onChange={() => toggleField("name")}
                />
                <span>Race Name</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.date}
                  onChange={() => toggleField("date")}
                />
                <span>Date</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.distance}
                  onChange={() => toggleField("distance")}
                />
                <span>Distance</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.location}
                  onChange={() => toggleField("location")}
                />
                <span>Location</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.startTime}
                  onChange={() => toggleField("startTime")}
                />
                <span>Start Time</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.terrain}
                  onChange={() => toggleField("terrain")}
                />
                <span>Terrain</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.format}
                  onChange={() => toggleField("format")}
                />
                <span>Format</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.registrationCost}
                  onChange={() => toggleField("registrationCost")}
                />
                <span>Registration Cost</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.earlyBirdCost}
                  onChange={() => toggleField("earlyBirdCost")}
                />
                <span>Early Bird Cost</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.website}
                  onChange={() => toggleField("website")}
                />
                <span>Website</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.medal}
                  onChange={() => toggleField("medal")}
                />
                <span>Medal</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.shirt}
                  onChange={() => toggleField("shirt")}
                />
                <span>T-Shirt</span>
              </label>
              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFields.reception}
                  onChange={() => toggleField("reception")}
                />
                <span>Reception</span>
              </label>
            </div>
          </div>

          {/* Export Type Toggle Section */}
          <div className="pdf-export-section">
            <h2 className="section-title">Export Format</h2>
            <div className="export-type-toggle">
              <button
                className={`export-type-btn ${exportType === "list" ? "active" : ""}`}
                onClick={() => setExportType("list")}
              >
                List View
              </button>
              <button
                className={`export-type-btn ${exportType === "calendar" ? "active" : ""}`}
                onClick={() => setExportType("calendar")}
              >
                Calendar View
              </button>
            </div>
          </div>

          {/* Export Button */}
          <div className="pdf-export-actions">
            <button
              className="export-pdf-btn"
              onClick={generatePDF}
              disabled={selectedRaces.length === 0}
            >
              Export to PDF
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
