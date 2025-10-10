export function parseGpxToSegments(gpxXmlText) {
  // returns array of segments, each segment is array of {lat, lon, ele?}
  if (!gpxXmlText) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxXmlText, "application/xml");

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
      .filter((s) => s.length);
  }

  // fallback to wpt single points -> return empty (not useful as line)
  return [];
}
