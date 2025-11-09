export function parseGpxToSegments(gpxXmlText) {
  // returns array of segments, each segment is array of {lat, lon, ele?, isEnd?}
  if (!gpxXmlText) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxXmlText, "application/xml");

  // small helper: Haversine distance in meters
  const toRad = (v) => (v * Math.PI) / 180;
  const metersBetween = (a, b) => {
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aHarv = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
    return R * c;
  };
  const CLOSE_THRESHOLD_METERS = 25; // treat as closed loop if within ~25m

  // prefer trk/trkseg/trkpt
  const trkSegments = Array.from(doc.querySelectorAll("trk trkseg"));
  if (trkSegments.length) {
    return trkSegments
      .map((seg) =>
        Array.from(seg.querySelectorAll("trkpt"))
          .map((pt) => {
            const lat = parseFloat(pt.getAttribute("lat"));
            const lon = parseFloat(pt.getAttribute("lon"));
            const eleEl = pt.querySelector("ele");
            const ele = eleEl ? parseFloat(eleEl.textContent) : null;
            return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon, ele } : null;
          })
          .filter(Boolean)
      )
      .map((s) => {
        // mark last point as end unless it's very close to the first (closed loop)
        if (s.length >= 2) {
          const first = s[0];
          const last = s[s.length - 1];
          try {
            if (typeof first.lat === "number" && typeof last.lat === "number") {
              const dist = metersBetween(first, last);
              if (dist > CLOSE_THRESHOLD_METERS) last.isEnd = true;
            }
          } catch {}
        }
        return s;
      })
      .filter((s) => s.length);
  }

  // fallback to route points <rte><rtept>
  const rte = doc.querySelectorAll("rte");
  if (rte.length) {
    return Array.from(rte)
      .map((r) =>
        Array.from(r.querySelectorAll("rtept"))
          .map((pt) => {
            const lat = parseFloat(pt.getAttribute("lat"));
            const lon = parseFloat(pt.getAttribute("lon"));
            const eleEl = pt.querySelector("ele");
            const ele = eleEl ? parseFloat(eleEl.textContent) : null;
            return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon, ele } : null;
          })
          .filter(Boolean)
      )
      .map((s) => {
        if (s.length >= 2) {
          const first = s[0];
          const last = s[s.length - 1];
          try {
            if (typeof first.lat === "number" && typeof last.lat === "number") {
              const dist = metersBetween(first, last);
              if (dist > CLOSE_THRESHOLD_METERS) last.isEnd = true;
            }
          } catch {}
        }
        return s;
      })
      .filter((s) => s.length);
  }

  // fallback to wpt single points -> return empty (not useful as line)
  return [];
}
