import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import racesData from "../../data/races.json";
import { formatDate } from "../../utils/formatDate";
import { formatTime } from "../../utils/formatTime";
import { getRaceId } from "../../utils/getRaceId";

export default function RaceDetail() {
  const router = useRouter();
  const { id } = router.query;

  // geocoding state
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

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
      "startLinelocation",
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
    // prefer startLinelocation then location
    const parts = [];
    if (race.startLinelocation) parts.push(race.startLinelocation);
    if (race.location) parts.push(race.location);
    const place = parts.join(", ").trim();
    if (!place) return;

    let cancelled = false;
    async function geocode() {
      setGeoLoading(true);
      setGeoError(null);
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

  if (!router.isReady) return <p>Loading…</p>;

  if (!race) {
    return (
      <div>
        <Header />
        <main style={{ padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>Race not found</h1>
          <p>We couldn't find that race. Please check the link.</p>
        </main>
        <Footer />
      </div>
    );
  }

  // build map iframe when coords are present
  const mapIframeSrc = coords
    ? (() => {
        const lat = coords.lat;
        const lon = coords.lon;
        const deltaLon = 0.02;
        const deltaLat = 0.01;
        const left = lon - deltaLon;
        const right = lon + deltaLon;
        const top = lat + deltaLat;
        const bottom = lat - deltaLat;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
      })()
    : null;

  return (
    <div>
      <Header />

      <main style={{ padding: 24 }}>
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 36, margin: 0 }}>{race.name}</h1>
          <div style={{ color: "#666", marginTop: 6 }}>
            {race.nickName ? <em>{race.nickName}</em> : null}{" "}
            {race.date ? `• ${formatDate(race.date)}` : null}{" "}
            {race.startTime ? `• ${formatTime(race.startTime)}` : null}
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <section>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>All Race Info</h2>

            <div style={{ display: "grid", gap: 10 }}>
              {displayEntries.map(({ key, label, value }) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ minWidth: 200, fontWeight: 700 }}>{label}</div>
                  <div style={{ flex: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          <aside>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Start Location Map</h2>

            <div
              style={{
                width: "100%",
                height: 320,
                border: "1px solid #ddd",
                borderRadius: 8,
                overflow: "hidden",
                background: "#f7f7f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 12,
              }}
            >
              {geoLoading && <p>Finding start location…</p>}

              {!geoLoading && geoError && (
                <div>
                  <p style={{ margin: 0 }}>{geoError}</p>
                  <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
                    {race.startLinelocation || race.location || "No location provided."}
                  </p>
                </div>
              )}

              {!geoLoading && !geoError && coords && mapIframeSrc && (
                <iframe
                  title="Start location"
                  src={mapIframeSrc}
                  style={{ border: 0, width: "100%", height: "100%" }}
                  loading="lazy"
                />
              )}

              {!geoLoading && !geoError && !coords && (
                <div style={{ color: "#666" }}>
                  <p style={{ margin: 0 }}>No start location available.</p>
                  <p style={{ marginTop: 8, fontSize: 13 }}>
                    Add a "startLinelocation" or "location" to the race data to enable the map.
                  </p>
                </div>
              )}
            </div>

            {/* Optionally show a small text summary of the resolved address */}
            {coords && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
                Coordinates: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                <div style={{ marginTop: 6 }}>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=16/${coords.lat}/${coords.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
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