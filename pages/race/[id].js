import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useRef } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import racesData from "../../data/races.json";
import { formatDate } from "../../utils/formatDate";
import { formatTime } from "../../utils/formatTime";
import { getRaceId } from "../../utils/getRaceId";
import { parseGpxToSegments } from "../../utils/parseGpx";

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
      "name",
      "nickName",
      "date",
      "startTime",
      "distance",
      "registrationStart",
      "earlyBirdDeadline",
      "earlyBirdCost",
      "registrationDeadline",
      "registrationCost",
      "fundraiser",
      "medal",
      "shirt",
      "reception",
      "location",
      "startLineLocation",
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

    // add in preferred order first
    for (const k of order) {
      if (k in race) add(k, race[k]);
    }
    // add any remaining keys not in order
    for (const [k, v] of Object.entries(race)) {
      if (!order.includes(k)) add(k, v);
    }

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
    
    // Check if coordinates are directly provided
    if (race.startLineCoordinates && Array.isArray(race.startLineCoordinates) && race.startLineCoordinates.length === 2) {
      const [lat, lon] = race.startLineCoordinates;
      if (typeof lat === 'number' && typeof lon === 'number') {
        setCoords({ lat, lon });
        setGeoLoading(false);
        return;
      }
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

    let cancelled = false;
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

        // Add start location marker
        const startIcon = L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
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
                  color: "#1f78b4",
                  weight: 4,
                  opacity: 0.7,
                }).addTo(map);
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
      <Header />

      <main className="race-detail-main">
        <header className="race-detail-header">
          <h1 className="race-detail-title">{race.name}</h1>
          <div className="race-detail-subtitle">
            {race.nickName ? <em>{race.nickName}</em> : null}{" "}
            {race.date ? `• ${formatDate(race.date)}` : null}{" "}
            {race.startTime ? `• ${formatTime(race.startTime)}` : null}
          </div>
        </header>

        <div className="race-detail-grid">
          <section>
            <h2 className="race-detail-section-title">All Race Info</h2>

            <div className="race-detail-info-grid">
              {displayEntries.map(({ key, label, value }) => (
                <div key={key} className="race-detail-info-row">
                  <div className="race-detail-info-label">{label}</div>
                  <div className="race-detail-info-value">{value}</div>
                </div>
              ))}
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
                Coordinates: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                <div className="race-detail-map-links">
                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="race-detail-map-link race-detail-map-link-google"
                  >
                    Open in Google Maps
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=16/${coords.lat}/${coords.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="race-detail-map-link race-detail-map-link-osm"
                  >
                    Open in OSM
                  </a>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}