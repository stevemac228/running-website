import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useRef, Fragment } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import PaceCalculator from "../../components/PaceCalculator/PaceCalculator";
import RegistrationTimeline from "../../components/RegistrationTimeline/RegistrationTimeline";
import racesData from "../../data/races.json";
import { formatDate } from "../../utils/formatDate";
import { formatTime } from "../../utils/formatTime";
import { getRaceId } from "../../utils/getRaceId";
import { parseGpxToSegments } from "../../utils/parseGpx";
import { getFirstGpxCoordinate } from "../../utils/getFirstGpxCoordinate";
import { isPreviousYear } from "../../utils/isPreviousYear"; // <-- new import

export default function RaceDetail() {
  const router = useRouter();
  const { id } = router.query;

  // geocoding state
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  
  // map state
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // wait for router then find race by id or name slug
  const race = useMemo(() => {
    if (!router.isReady) return null;
    const param = id ? String(id) : null;
    if (!param) return null;
    const decoded = decodeURIComponent(param);

    // 1) explicit id match
    const byId = racesData.find((r) => String(r.id) === param || String(r.id) === decoded);
    if (byId) return byId;

    // 2) computed id match
    const byComputed = racesData.find((r) => getRaceId(r) === decoded || getRaceId(r) === param);
    if (byComputed) return byComputed;

    // 3) fallback to matching by name string
    return racesData.find((r) => String(r.name) === decoded);
  }, [router.isReady, id]);

  // Prepare display entries (all fields) with formatting
  const displayEntries = useMemo(() => {
    if (!race) return [];
    const order = [
      "date",
      "location",
      "startLineLocation",
      "startTime",
      "distance",
      "fundraiser",
      "medal",
      "shirt",
      "reception",
      "organization",
      "nLAACertified",
      "format",
      "terrain",
      "website",
    ];

    const entries = [];

    const add = (key, value) => {
      let formatted = value;
      if (key === "website" && value) {
        formatted = (
          <a href={String(value)} target="_blank" rel="noopener noreferrer">
            {String(value)}
          </a>
        );
      } else if (typeof value === "boolean") {
        formatted = value ? "Yes" : "No";
      } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        formatted = formatDate(value);
      } else if (key === "startTime" && value) {
        formatted = formatTime(value);
      } else if (value === null || value === undefined || value === "") {
        formatted = "—";
      }

      entries.push({ key, label: humanLabel(key), value: formatted });
    };

    // add in preferred order only (do not append remaining keys)
    for (const k of order) {
      if (k in race) add(k, race[k]);
    }

    // removed: loop that added any remaining race keys — we only want fields defined in `order`

    return entries;
  }, [race]);

  // Human readable label from camelCase / keys
  function humanLabel(k) {
    return String(k)
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/(^\w|\s\w)/g, (s) => s.toUpperCase());
  }

  // Geocode start location (client-side only)
  useEffect(() => {
    if (!race) return;
    
    let cancelled = false;
    
    async function loadCoordinates() {
      // First, try to get coordinates from GPX file
      const gpxCoord = await getFirstGpxCoordinate(race);
      if (gpxCoord && !cancelled) {
        setCoords({ lat: gpxCoord.lat, lon: gpxCoord.lng });
        setGeoLoading(false);
        return;
      }
      
      // prefer startLineLocation then location
      const parts = [];
      if (race.startLineLocation) parts.push(race.startLineLocation);
      if (race.location) parts.push(race.location);
      const place = parts.join(", ").trim();
      if (!place) return;

      // Fallback coordinates for common Newfoundland locations
      const locationFallbacks = {
        "paradise": { lat: 47.5333, lon: -52.8833 },
        "octagon pond": { lat: 47.5333, lon: -52.8833 },
        "st.johns": { lat: 47.5615, lon: -52.7126 },
        "st johns": { lat: 47.5615, lon: -52.7126 },
        "mount pearl": { lat: 47.5189, lon: -52.8056 },
        "cbs": { lat: 47.5008, lon: -52.9986 },
        "conception bay south": { lat: 47.5008, lon: -52.9986 },
        "flatrock": { lat: 47.6667, lon: -52.7333 },
        "north west river": { lat: 53.5233, lon: -60.1444 },
      };

      async function geocode() {
        setGeoLoading(true);
        setGeoError(null);
        
        // Check for fallback first
        const placeLower = place.toLowerCase();
        for (const [key, coords] of Object.entries(locationFallbacks)) {
          if (placeLower.includes(key)) {
            if (!cancelled) {
              setCoords(coords);
              setGeoLoading(false);
            }
            return;
          }
        }
        
        try {
          const q = encodeURIComponent(place);
          const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
          const res = await fetch(url, { headers: { "Accept-Language": "en" } });
          if (!res.ok) throw new Error("Network error");
          const data = await res.json();
          if (cancelled) return;
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            setCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
          } else {
            setGeoError("Location not found");
          }
        } catch (err) {
          if (!cancelled) setGeoError("Geocoding failed");
        } finally {
          if (!cancelled) setGeoLoading(false);
        }
      }
      geocode();
    }
    
    loadCoordinates();
    
    return () => {
      cancelled = true;
    };
  }, [race]);

  // Initialize Leaflet map with GPX route
  useEffect(() => {
    if (!race || !coords || !mapRef.current) return;

    let mounted = true;

    async function initMap() {
      try {
        // Load Leaflet
        const L = (await import("leaflet")).default;
        
        // Add Leaflet CSS if not present
        if (!document.querySelector('link[data-leaflet]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.setAttribute("data-leaflet", "1");
          document.head.appendChild(link);
        }

        // Create map centered on start location
        const map = L.map(mapRef.current).setView([coords.lat, coords.lon], 13);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        // Determine colors for route/markers. nLAACertified takes priority. Trail terrain/format takes precedence over competitive.
        const fmt = (race.format || "").toLowerCase();
        const trn = (race.terrain || "").toLowerCase();
        const isNLAA = !!race.nLAACertified;
        const isTrail = trn.includes("trail") || fmt.includes("trial") || fmt.includes("trail");

        const routeColor = isNLAA
          ? "#800080" // purple for N.L.A.A certified
          : isTrail
          ? "#006400" // dark green for Trail
          : fmt.includes("competitive")
          ? "#b30000" // red for Competitive
          : fmt.includes("fun")
          ? "#1f78b4" // blue for Fun
          : "#1f78b4"; // default blue

        const markerColorName = isNLAA
          ? "violet"
          : isTrail
          ? "green"
          : fmt.includes("competitive")
          ? "red"
          : fmt.includes("fun")
          ? "blue"
          : "blue";

        // Add start location marker (color chosen to match route)
        const startIcon = L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColorName}.png`,
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const startMarker = L.marker([coords.lat, coords.lon], { icon: startIcon }).addTo(map);
        startMarker.bindPopup(`<strong>Start Location</strong><br/>${race.name}`);

        // Try to load GPX file if available
        const raceId = getRaceId(race);
        const gpxUrl = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${encodeURIComponent(raceId)}.gpx`;

        try {
          const gpxRes = await fetch(gpxUrl);
          if (gpxRes.ok) {
            const gpxText = await gpxRes.text();
            const segments = parseGpxToSegments(gpxText);
            
            if (segments && segments.length > 0) {
              // Draw the route
              const allLatLngs = [];
              segments.forEach((segment) => {
                const latlngs = segment.map((pt) => [pt.lat, pt.lon]);
                allLatLngs.push(...latlngs);
                L.polyline(latlngs, {
                  color: routeColor,
                  weight: 4,
                  opacity: 0.7,
                }).addTo(map);

                // add end 'X' marker when segment flagged as end
                const lastPt = segment[segment.length - 1];
                if (lastPt && lastPt.isEnd) {
                  const endIcon = L.divIcon({
                    className: "end-x-marker",
                    html: `<div style="color:${routeColor};font-weight:700;font-size:16px;text-shadow:0 0 4px #fff;">✖</div>`,
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                  });
                  L.marker([lastPt.lat, lastPt.lon], { icon: endIcon }).addTo(map);
                }
              });

              // Fit map to show entire route
              if (allLatLngs.length > 0) {
                const bounds = L.latLngBounds(allLatLngs);
                map.fitBounds(bounds.pad(0.1));
              }
            }
          }
        } catch (err) {
          // GPX file not found or error loading - map will just show start location
          console.log("GPX not available for this race");
        }

        if (mounted) {
          mapInstanceRef.current = map;
          setMapLoaded(true);
        }
      } catch (err) {
        console.error("Error initializing map:", err);
      }
    }

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [race, coords]);

  const baseUrl = "https://www.runnl.ca";
  const raceSlug = race ? encodeURIComponent(getRaceId(race)) : "";
  const pageTitle = race
    ? `${race.name} | Run NL`
    : "Race Details | Run NL";
  const pageDescription = race
    ? `Details for ${race.name} including date, distance, and registration info in ${race.location || "Newfoundland and Labrador"}.`
    : "Find Newfoundland race details on Run NL.";
  const jsonLd = race
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: race.name,
        startDate: race.date,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: race.startLineLocation || race.location || "Newfoundland and Labrador",
          address: race.location || "Newfoundland and Labrador",
        },
        url: `${baseUrl}/race/${raceSlug}`,
        organizer: race.organization
          ? { "@type": "Organization", name: race.organization }
          : undefined,
      }
    : null;

  if (!router.isReady) return <p>Loading…</p>;

  if (!race) {
    return (
      <div>
        <Header />
        <main className="race-detail-not-found-main">
          <h1 className="race-detail-not-found-title">Race not found</h1>
          <p>We couldn't find that race. Please check the link.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${baseUrl}/race/${raceSlug}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${baseUrl}/race/${raceSlug}`} />
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </Head>

      <Header />

      <main className="race-detail-main">
        <header className="race-detail-header">
          <h1 className="race-detail-title">{race.name}</h1>
          <div className="race-detail-subtitle">
            {race.date ? (
              <>
                {" "}
                <span className={isPreviousYear(race.date) ? "race-date-previous-year" : ""}>
                  {formatDate(race.date)}
                </span>
              </>
            ) : null}{" "}
            {race.startTime ? `• ${formatTime(race.startTime)}` : null}
          </div>
        </header>

        <div className="race-detail-grid">
          <section>
            <div className="race-detail-info-grid">
              {displayEntries.map(({ key, label, value }) => {
                // Insert registration timeline after distance field
                if (key === "distance") {
                  return (
                    <Fragment key={key}>
                      <div className="race-detail-info-row">
                        <div className="race-detail-info-label">{label}</div>
                        <div className="race-detail-info-value">{value}</div>
                      </div>
                      <div className="race-detail-info-row registration-timeline">
                        <div className="race-detail-info-label registration-timeline-title">Registration</div>
                        <div className="race-detail-info-value">
                          <RegistrationTimeline race={race} />
                        </div>
                      </div>
                    </Fragment>
                  );
                }
                
                return (
                  <div key={key} className="race-detail-info-row">
                    <div className="race-detail-info-label">{label}</div>
                    <div className="race-detail-info-value">{value}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside>
            <h2 className="race-detail-section-title">Race Map</h2>

            <div className="race-detail-map-container">
              {geoLoading && <p>Finding start location…</p>}

              {!geoLoading && geoError && (
                <div>
                  <p className="race-detail-map-error">{geoError}</p>
                  <p className="race-detail-map-error-location">
                    {race.startLineLocation || race.location || "No location provided."}
                  </p>
                </div>
              )}

              {!geoLoading && !geoError && coords && (
                <div ref={mapRef} className="race-detail-map" />
              )}

              {!geoLoading && !geoError && !coords && (
                <div className="race-detail-map-no-location">
                  <p>No start location available.</p>
                  <p>
                    Add a "startLineLocation" or "location" to the race data to enable the map.
                  </p>
                </div>
              )}
            </div>

            {/* Show coordinates and links when map is loaded */}
            {coords && (
              <div className="race-detail-coordinates">
                <div className="race-detail-map-links">
                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="race-detail-map-link race-detail-map-link-google"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Pace Calculator */}
            {race.distance && (
              <PaceCalculator distance={race.distance} />
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}