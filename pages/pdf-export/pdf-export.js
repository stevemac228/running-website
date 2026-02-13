import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import races from "../../data/races.json";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { filterRacesBySearch } from "../../utils/categorySearch";
import jsPDF from "jspdf";
import { formatDate } from "../../utils/formatDate";
import { formatTime } from "../../utils/formatTime";

// Maximum z-index for dropdown overlay
const DROPDOWN_Z_INDEX = 9999;

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
  const [showResults, setShowResults] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const searchWrapperRef = useRef(null);
  const dropdownRef = useRef(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute dropdown position
  useEffect(() => {
    if (!showResults || !searchWrapperRef.current) {
      setDropdownStyle(null);
      return;
    }

    const update = () => {
      const rect = searchWrapperRef.current.getBoundingClientRect();
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
  }, [showResults]);

  // Memoized search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setShowResults(term.trim().length > 0);
  }, []);

  // Apply fuzzy search
  const applyFuzzySearch = useCallback((term, raceList) => {
    if (!term || term.trim() === "") return [];
    return filterRacesBySearch(raceList, term, fuseRef.current);
  }, []);

  // Filter races based on search term and exclude past races
  const filteredRaces = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return [];
    const searchResults = applyFuzzySearch(debouncedSearchTerm, races);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Filter out races with dates in the past
    return searchResults.filter(race => {
      const raceDate = new Date(race.date);
      return raceDate >= today;
    });
  }, [debouncedSearchTerm, applyFuzzySearch]);

  // Add race to selection
  const addRace = (race) => {
    if (!selectedRaces.find(r => r.id === race.id)) {
      setSelectedRaces([...selectedRaces, race]);
      setShowResults(false);
      setSearchTerm("");
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

  // Generate PDF with simple list format
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
    const title = exportType === "list" ? "Race List" : "Race Calendar";
    doc.text(title, margin, yPosition);
    yPosition += 10;

    if (exportType === "list") {
      // Simple list format (previously "calendar" - month-grouped condensed view)
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

          // Race name/title
          if (selectedFields.name) {
            doc.setFont(undefined, 'bold');
            doc.text(race.name, margin + 5, yPosition);
            yPosition += 5;
            doc.setFont(undefined, 'normal');
          }

          // Build compact info line
          let infoLine = "";
          if (selectedFields.date) {
            const date = new Date(race.date);
            infoLine += `${date.getDate()}`;
          }
          if (selectedFields.distance) {
            const distanceText = race.distance === "∞" ? "∞" : `${race.distance}km`;
            if (infoLine) infoLine += " • ";
            infoLine += distanceText;
          }
          if (selectedFields.location) {
            if (infoLine) infoLine += " • ";
            infoLine += race.location;
          }
          if (selectedFields.startTime && race.startTime) {
            if (infoLine) infoLine += " • ";
            infoLine += formatTime(race.startTime);
          }
          
          if (infoLine) {
            doc.text(infoLine, margin + 10, yPosition);
            yPosition += 5;
          }

          // Additional fields
          if (selectedFields.terrain && race.terrain) {
            doc.text(`Terrain: ${race.terrain}`, margin + 10, yPosition);
            yPosition += 4;
          }
          if (selectedFields.format && race.format) {
            doc.text(`Format: ${race.format}`, margin + 10, yPosition);
            yPosition += 4;
          }
          if (selectedFields.registrationCost && race.registrationCost) {
            doc.text(`Cost: ${race.registrationCost}`, margin + 10, yPosition);
            yPosition += 4;
          }
          if (selectedFields.earlyBirdCost && race.earlyBirdCost) {
            doc.text(`Early Bird: ${race.earlyBirdCost}`, margin + 10, yPosition);
            yPosition += 4;
          }
          if (selectedFields.website && race.website) {
            doc.setTextColor(0, 0, 255);
            doc.textWithLink(`${race.website}`, margin + 10, yPosition, { url: race.website });
            doc.setTextColor(0, 0, 0);
            yPosition += 4;
          }
          
          // Features
          const features = [];
          if (selectedFields.medal && race.medal) features.push("Medal");
          if (selectedFields.shirt && race.shirt) features.push("T-Shirt");
          if (selectedFields.reception && race.reception) features.push("Reception");
          
          if (features.length > 0) {
            doc.text(`Features: ${features.join(", ")}`, margin + 10, yPosition);
            yPosition += 4;
          }

          yPosition += 3; // Space between races
        });

        yPosition += 5; // Space between months
      });
    } else {
      // Detailed format (previously "list")
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
    }

    // Save the PDF
    doc.save("races-export.pdf");
  };

  // Generate ICS calendar file
  const generateCalendar = () => {
    // Create ICS format
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Run NL//Race Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    icsContent += 'X-WR-CALNAME:Run NL Races\r\n';
    icsContent += 'X-WR-TIMEZONE:America/St_Johns\r\n';

    selectedRaces.forEach(race => {
      const raceDate = new Date(race.date);
      const year = raceDate.getFullYear();
      const month = String(raceDate.getMonth() + 1).padStart(2, '0');
      const day = String(raceDate.getDate()).padStart(2, '0');
      
      // Format date for ICS (YYYYMMDD)
      const dateStr = `${year}${month}${day}`;
      
      // Start time - if specified, otherwise default to 8:00 AM
      let startTime = '080000';
      if (race.startTime) {
        const timeParts = race.startTime.match(/(\d+):(\d+)/);
        if (timeParts) {
          startTime = `${timeParts[1].padStart(2, '0')}${timeParts[2].padStart(2, '0')}00`;
        }
      }

      // Create event
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${race.id}-${Date.now()}@runnl.ca\r\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      icsContent += `DTSTART:${dateStr}T${startTime}\r\n`;
      // Duration: assume 4 hours for race event
      icsContent += `DTEND:${dateStr}T${(parseInt(startTime.substring(0, 2)) + 4).toString().padStart(2, '0')}${startTime.substring(2)}\r\n`;
      icsContent += `SUMMARY:${race.name}\r\n`;
      
      // Description with race details
      let description = '';
      if (race.distance) {
        const distanceText = race.distance === "∞" ? "∞" : `${race.distance}km`;
        description += `Distance: ${distanceText}\\n`;
      }
      if (race.location) {
        description += `Location: ${race.location}\\n`;
      }
      if (race.website) {
        description += `Website: ${race.website}\\n`;
      }
      if (description) {
        icsContent += `DESCRIPTION:${description}\r\n`;
      }
      
      if (race.location) {
        icsContent += `LOCATION:${race.location}\r\n`;
      }
      
      if (race.website) {
        icsContent += `URL:${race.website}\r\n`;
      }
      
      icsContent += 'STATUS:CONFIRMED\r\n';
      icsContent += 'END:VEVENT\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'races-calendar.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="pdf-export-hero">
          <h1 className="pdf-export-title">PDF Export</h1>
          <p className="pdf-export-subtitle">
            Search for races, add them to your list, select which information to include, and export to PDF.
          </p>
        </div>

        <div className="pdf-export-container">
          {/* Search Section */}
          <div className="pdf-search-section">
            <div className="pdf-search-wrapper" ref={searchWrapperRef}>
              <img src="/icons/search.svg" alt="Search" className="search-icon" />
              <input
                type="text"
                placeholder="Search races, marathon, trail..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (filteredRaces.length > 0) setShowResults(true); }}
                className="pdf-search-input"
              />
              {searchTerm && (
                <button className="clear-btn" onClick={() => { setSearchTerm(""); setShowResults(false); }} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>

            {/* Search results dropdown - rendered via portal */}
            {showResults && filteredRaces.length > 0 && dropdownStyle && typeof window !== 'undefined' && createPortal(
              <div
                ref={dropdownRef}
                className="search-results pdf-search-results"
                style={{
                  position: "absolute",
                  left: `${dropdownStyle.left}px`,
                  top: `${dropdownStyle.top}px`,
                  width: `${dropdownStyle.width}px`,
                  boxSizing: "border-box",
                  zIndex: DROPDOWN_Z_INDEX,
                }}
              >
                {filteredRaces.slice(0, 10).map((race) => (
                  <div
                    key={race.id}
                    className="search-result-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addRace(race)}
                  >
                    <div className="result-title">{race.name}</div>
                    <div className="result-sub">
                      {race.distance === "∞" ? "∞" : `${race.distance}km`} · {race.location} · {formatDate(race.date)}
                    </div>
                  </div>
                ))}
              </div>,
              document.body
            )}
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

          {/* Export Actions Section */}
          <div className="pdf-export-section">
            <h2 className="section-title">Export</h2>
            <div className="export-actions-grid">
              <button
                className="export-action-btn export-pdf-btn"
                onClick={generatePDF}
                disabled={selectedRaces.length === 0}
              >
                <span className="export-btn-icon">📄</span>
                <span className="export-btn-text">
                  <strong>Export to PDF</strong>
                  <small>Simple list format</small>
                </span>
              </button>
              <button
                className="export-action-btn export-calendar-btn"
                onClick={generateCalendar}
                disabled={selectedRaces.length === 0}
              >
                <span className="export-btn-icon">📅</span>
                <span className="export-btn-text">
                  <strong>Export to Calendar</strong>
                  <small>Download .ics file</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
