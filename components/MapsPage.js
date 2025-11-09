import { useEffect, useRef, useState } from "react";
import { getRaceId } from "../utils/getRaceId";
import races from "../data/races.json";
import { parseGpxToSegments } from "../utils/parseGpx";

const LOCATION_FALLBACKS = {
  paradise: { lat: 47.5333, lng: -52.8833 },
  "octagon pond": { lat: 47.5333, lng: -52.8833 },
  "st.johns": { lat: 47.5615, lng: -52.7126 },
  "st johns": { lat: 47.5615, lng: -52.7126 },
  "mount pearl": { lat: 47.5189, lng: -52.8056 },
  cbs: { lat: 47.5008, lng: -52.9986 },
  "conception bay south": { lat: 47.5008, lng: -52.9986 },
  flatrock: { lat: 47.6667, lng: -52.7333 },
  "north west river": { lat: 53.5233, lng: -60.1444 },
};

const buildPopupHtml = (race, distanceLabel, elevInfo) => {
  const elevLine = elevInfo
    ? [elevInfo.gain != null ? `${Math.round(elevInfo.gain)}m ↑` : null, elevInfo.loss != null ? `${Math.round(elevInfo.loss)}m ↓` : null]
        .filter(Boolean)
        .join(" / ")
    : "";
  return `
    <div class="custom-popup">
      <div class="popup-title">${race.name}</div>
      ${distanceLabel ? `<div class="popup-distance">${distanceLabel}</div>` : ""}
      ${elevLine ? `<div class="popup-elevation">${elevLine}</div>` : ""}
    </div>
  `;
};

export default function MapsPage() {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const mapBoundsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [layersInfo, setLayersInfo] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchRaceGpxText = (race, raceId) => {
      const gpxPath = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${encodeURIComponent(raceId)}.gpx`;
      return fetch(gpxPath).then((res) => (res.ok ? res.text() : null)).catch(() => null);
    };

    // create polylines from parsed segments
    const createLayerFromSegments = (L, segments, color) => {
      const polylines = segments
        .map((segment) => {
          const latLngs = segment
            .map((pt) => (typeof pt.lat === "number" && typeof pt.lon === "number" ? [pt.lat, pt.lon] : null))
            .filter(Boolean);
          return latLngs.length ? L.polyline(latLngs, { color, weight: 3, opacity: 0.9, smoothFactor: 1 }) : null;
        })
        .filter(Boolean);
      return polylines.length ? L.featureGroup(polylines) : null;
    };

    // compute elevation info from parsed segments
    const computeElevation = (segments) => {
      let gain = 0;
      let loss = 0;
      let hasElevation = false;
      segments.forEach((seg) => {
        for (let i = 1; i < seg.length; i++) {
          const prev = seg[i - 1];
          const curr = seg[i];
          if (prev.ele != null && curr.ele != null) {
            hasElevation = true;
            const diff = curr.ele - prev.ele;
            if (diff > 0) gain += diff;
            else if (diff < 0) loss += -diff;
          }
        }
      });
      if (!hasElevation) return null;
      return { gain: Math.round(gain), loss: Math.round(loss), unit: "m" };
    };

    // load parsed segments cached or fetching & parsing as needed
    const loadGpxForGroup = async (group) => {
      if (!group || group.gpxLoading || group.gpxLoaded) return null;
      group.gpxLoading = true;
      try {
        const cacheKey = `gpxParsed:${group.raceId}`;
        let parsed = null;
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) parsed = JSON.parse(cached);
        } catch {
          parsed = null;
        }

        if (!parsed) {
          const text = await fetchRaceGpxText(group.rawRace, group.raceId);
          if (text) {
            try {
              parsed = parseGpxToSegments(text) || [];
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
              } catch {
                /* ignore quota errors */
              }
            } catch {
              parsed = [];
            }
          } else {
            parsed = [];
          }
        }

        // build layer and elevation info
        if (parsed && parsed.length) {
          const L = leafletRef.current?.map?._leaflet ? leafletRef.current.map.constructor : null;
          // the above is guarded; instead use stored map reference
        }

        return parsed;
      } finally {
        group.gpxLoading = false;
      }
    };

    async function init() {
      const L = (await import("leaflet")).default;

      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.setAttribute("data-leaflet", "1");
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current, { center: [47.5, -52.7], zoom: 8 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const groups = [];
      const globalBounds = L.latLngBounds();
      const colors = ["#1f78b4", "#33a02c", "#e31a1c", "#ff7f00", "#6a3d9a", "#b15928", "#a6cee3", "#b2df8a"];

      const updateSidebar = () => {
        if (!mounted) return;
        const bounds = map.getBounds();
        mapBoundsRef.current = bounds;
        const visibleGroups = groups
          .filter((g) => g.startLatLng && bounds.contains([g.startLatLng.lat, g.startLatLng.lng]))
          .map((g) => ({
            id: g.id,
            name: g.name,
            visible: g.visible,
            elevInfo: g.elevInfo,
            distanceKm: g.distanceValue,
            raceSlug: g.raceId,
            color: g.color,
          }));
        setLayersInfo(visibleGroups);
      };

      // set visibility; if we need the route we lazy-load it here
      const setGroupVisibility = async (group, shouldShow, { fromMarker = false } = {}) => {
        if (!mounted || !group || !map) return;

        // if we should show and layer not built yet -> load GPX and create layer
        if (shouldShow && !group.layer && !group.gpxLoading) {
          const cacheKey = `gpxParsed:${group.raceId}`;
          // check session cache quickly
          let parsed = null;
          try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) parsed = JSON.parse(cached);
          } catch {
            parsed = null;
          }

          if (!parsed) {
            // show a quick UI hint by keeping marker popup open while loading
            if (group.marker) {
              group.marker.setPopupContent(`<div class="custom-popup"><div class="popup-title">${group.name}</div><div>Loading route…</div></div>`);
              if (!group.marker.isPopupOpen || !group.isPopupRequested) {
                group.marker.openPopup();
              }
            }
            parsed = await loadGpxForGroup(group);
          }

          // create layer
          if (parsed && parsed.length) {
            const layer = createLayerFromSegments(L, parsed, group.color);
            group.layer = layer;
            // compute elevation now
            const elevInfo = computeElevation(parsed);
            group.elevInfo = elevInfo;
            // update popup & sidebar info
            const distanceLabel = typeof group.rawRace.distance === "number" ? `${group.rawRace.distance}km` : (typeof group.rawRace.distance === "string" ? group.rawRace.distance : null);
            const popupHtml = buildPopupHtml(group.rawRace, distanceLabel, elevInfo);
            if (group.marker) {
              group.marker.setPopupContent(popupHtml);
            }
            // if we have a layer and group requested to be visible - add it
            if (layer) {
              if (!map.hasLayer(layer)) layer.addTo(map);
            }
          } else {
            // no segments: update popup to say route not available
            if (group.marker) {
              group.marker.setPopupContent(`<div class="custom-popup"><div class="popup-title">${group.name}</div><div class="popup-elevation">Route not available</div></div>`);
            }
          }
          group.gpxLoaded = true;
        }

        if (shouldShow) {
          if (group.layer && !map.hasLayer(group.layer)) {
            group.layer.addTo(map);
          }
          group.visible = true;

          if (group.marker) {
            group.isClosingProgrammatically = false;
            group.marker.openPopup();
          }

          if (!fromMarker) {
            if (group.layer && group.layer.getBounds) {
              const bounds = group.layer.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1));
              } else if (group.startLatLng) {
                map.panTo(group.startLatLng);
              }
            } else if (group.startLatLng) {
              map.panTo(group.startLatLng);
            }
          }
        } else {
          if (group.layer && map.hasLayer(group.layer)) {
            map.removeLayer(group.layer);
          }
          group.visible = false;
          if (group.marker && group.marker.isPopupOpen && group.marker.isPopupOpen()) {
            group.isClosingProgrammatically = true;
            group.marker.closePopup();
          }
        }

        updateSidebar();
      };

      leafletRef.current = { map, groups, setGroupVisibility, updateSidebar };

      map.on("moveend", updateSidebar);
      map.on("zoomend", updateSidebar);

      // Instead of fetching all GPX at init, create markers/groups with start location only.
      races.forEach((race, index) => {
        const raceId = getRaceId(race);
        let startLatLng = null;
        if (Array.isArray(race.startLineCoordinates) && race.startLineCoordinates.length === 2) {
          const [lat, lon] = race.startLineCoordinates;
          if (typeof lat === "number" && typeof lon === "number") {
            startLatLng = { lat, lng: lon };
          }
        }

        // try to quickly derive start from fallback locations (no GPX fetch)
        if (!startLatLng) {
          const fallbackKey = `${race.startLineLocation || ""} ${race.location || ""}`.toLowerCase();
          for (const key of Object.keys(LOCATION_FALLBACKS)) {
            if (fallbackKey.includes(key)) {
              startLatLng = { ...LOCATION_FALLBACKS[key] };
              break;
            }
          }
        }

        // if no startLatLng and no cached GPX start, still add nothing (no marker)
        if (!startLatLng) return;

        const color = colors[index % colors.length];
        const marker = L.marker([startLatLng.lat, startLatLng.lng], {
          icon: L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.35);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(map);

        const distanceValue =
          typeof race.distance === "number"
            ? race.distance
            : typeof race.distance === "string" && race.distance.trim() !== ""
            ? race.distance.trim()
            : null;

        const distanceLabel = typeof distanceValue === "number" ? `${distanceValue}km` : distanceValue;
        const popupHtml = buildPopupHtml(race, distanceLabel, null);
        marker.bindPopup(popupHtml, {
          className: "modern-leaflet-popup",
          autoClose: false,
          closeOnClick: false,
        });
        marker.closePopup();

        const group = {
          id: String(index),
          raceId,
          name: race.name,
          rawRace: race,
          marker,
          layer: null,
          color,
          visible: false,
          popupHtml,
          elevInfo: null,
          distanceValue,
          startLatLng,
          isClosingProgrammatically: false,
          gpxLoaded: false,
          gpxLoading: false,
        };

        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          group.isPopupRequested = true;
          setGroupVisibility(group, !group.visible, { fromMarker: true });
        });

        marker.on("popupclose", () => {
          if (group.isClosingProgrammatically) {
            group.isClosingProgrammatically = false;
            return;
          }
          if (group.visible) {
            setGroupVisibility(group, false, { fromMarker: true });
          }
        });

        groups.push(group);
        // extend bounds to include marker start
        globalBounds.extend([startLatLng.lat, startLatLng.lng]);
      });

      if (!mounted || !map) return;
      if (globalBounds.isValid()) {
        map.fitBounds(globalBounds.pad(0.1));
      } else {
        map.setView([47.5, -52.7], 8);
      }

      mapBoundsRef.current = map.getBounds();
      updateSidebar();
      if (mounted) setLoading(false);
    }

    init();

    return () => {
      mounted = false;
      const ref = leafletRef.current;
      if (ref?.map) {
        ref.map.off("moveend", ref.updateSidebar);
        ref.map.off("zoomend", ref.updateSidebar);
        ref.groups.forEach((group) => {
          if (group.marker) group.marker.off();
          if (group.layer && ref.map.hasLayer(group.layer)) {
            ref.map.removeLayer(group.layer);
          }
        });
        ref.map.remove();
      }
      leafletRef.current = null;
    };
  }, []);

  const formatSideText = (distanceKm, elevInfo) => {
    const parts = [];
    if (typeof distanceKm === "number" && !Number.isNaN(distanceKm)) {
      parts.push(`${distanceKm % 1 === 0 ? String(distanceKm) : String(distanceKm)}km`);
    } else if (typeof distanceKm === "string" && distanceKm.trim() !== "") {
      parts.push(distanceKm);
    }
    if (elevInfo && (elevInfo.gain != null || elevInfo.loss != null)) {
      const up = elevInfo.gain != null ? `${Math.round(elevInfo.gain)}m ↑` : null;
      const down = elevInfo.loss != null ? `${Math.round(elevInfo.loss)}m ↓` : null;
      const elevPart = [up, down].filter(Boolean).join(" ");
      if (elevPart) parts.push(elevPart);
    }
    return parts.join(" - ") || "—";
  };

  const toggleLayer = (id) => {
    const ref = leafletRef.current;
    if (!ref) return;
    const group = ref.groups.find((g) => g.id === id);
    if (!group) return;
    ref.setGroupVisibility(group, !group.visible);
  };

  return (
    <div>
      <div className="maps-page-grid">
        <div className="maps-page-map-container">
          <div ref={mapRef} id="map" className="maps-page-map" />
        </div>

        <aside className="maps-page-sidebar">
          <h3 className="maps-page-sidebar-title">Races in View</h3>
          {loading && <p>Loading GPX races…</p>}
          {!loading && layersInfo.length === 0 && <p>No races in current map view.</p>}
          <ul className="maps-page-race-list">
            {layersInfo.map((li) => (
              <li key={li.id} className="maps-page-race-item">
                <label className="maps-page-race-label">
                  <input
                    type="checkbox"
                    checked={li.visible}
                    onChange={() => toggleLayer(li.id)}
                    className="maps-page-checkbox"
                    data-color={li.color}
                    style={{
                      borderColor: li.visible ? "white" : li.color,
                      backgroundColor: li.visible ? li.color : "white",
                    }}
                  />
                  <div className="maps-page-race-content">
                    <a
                      href={`/race/${encodeURIComponent(li.raceSlug || li.name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="maps-page-race-link"
                    >
                      {li.name}
                    </a>
                    <span className="maps-page-race-details">{formatSideText(li.distanceKm, li.elevInfo)}</span>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}