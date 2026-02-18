import { useEffect, useRef, useState } from "react";
import { parseGpxToSegments } from "../../utils/parseGpx";
import { getFirstGpxCoordinate } from "../../utils/getFirstGpxCoordinate";

// Default map view settings - Change these to set initial position and zoom
const DEFAULT_MAP_CENTER = [47.5758536, -52.83462524]; // [latitude, longitude]
const DEFAULT_MAP_ZOOM = 11;

const RACE_COLORS = [
  "#1f78b4", "#33a02c", "#e31a1c", "#ff7f00", "#6a3d9a",
  "#a6cee3", "#b2df8a", "#fb9a99", "#fdbf6f", "#cab2d6",
];

const MULTI_RACE_MARKER_COLOR = "#FF6B35";
const COORDINATE_PRECISION = 6;

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

// Determine map color for a race - copied from MapsPage
// nLAACertified takes priority. Trail terrain/format takes precedence over competitive.
const getMapColor = (race) => {
  const trn = (race.terrain || "").toLowerCase();
  const fmt = (race.format || "").toLowerCase();
  if (race.nLAACertified) return "#800080"; // purple
  const isTrail = trn.includes("trail") || fmt.includes("trial") || fmt.includes("trail");
  if (isTrail) return "#006400"; // dark green
  if (fmt.includes("competitive")) return "#b30000"; // red
  if (fmt.includes("fun")) return "#1f78b4"; // blue
  return "#1f78b4"; // default blue
};

// Build popup HTML with race info - copied from MapsPage
const buildPopupHtml = (race, distanceLabel, elevInfo) => {
  const elevLine = elevInfo
    ? [elevInfo.gain != null ? `${Math.round(elevInfo.gain)}m ↑` : null, elevInfo.loss != null ? `${Math.round(elevInfo.loss)}m ↓` : null]
        .filter(Boolean)
        .join(" / ")
    : "";

  return `
    <div class="custom-popup">
      <div class="popup-title">${race.name}</div>
      <div class="popup-extra">
      ${distanceLabel ? `<div class="popup-distance">${distanceLabel}</div>` : ""}
      ${elevLine ? `<div class="popup-elevation">${elevLine}</div>` : ""}
      </div>
    </div>
  `;
};

// Compute elevation gain/loss from segments - copied from MapsPage
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

export default function RacesMapView({ filteredRaces = [], expandedRaceId = null, onMarkerClick = null, viewMode = 'mixed' }) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const routesRef = useRef(new Map());
  const gpxCoordsRef = useRef(new Map());
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());
  const previousRaceIdsRef = useRef([]);
  const previousExpandedRaceIdRef = useRef(null);

  // Get race coordinates using GPX cache or fallback
  const getRaceCoordinates = (race) => {
    // First check if we have cached GPX coordinates
    if (gpxCoordsRef.current.has(race.id)) {
      return gpxCoordsRef.current.get(race.id);
    }

    // Fallback to location-based coordinates for initial display
    const locationKey = race.location?.toLowerCase().trim();
    if (locationKey && LOCATION_FALLBACKS[locationKey]) {
      return LOCATION_FALLBACKS[locationKey];
    }

    return { lat: 47.5615, lng: -52.7126 };
  };

  // Load GPX for a race
  const loadRaceGpx = async (race, L) => {
    const gpxPath = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${race.id}.gpx`;
    try {
      const response = await fetch(gpxPath);
      if (!response.ok) return null;
      const gpxText = await response.text();
      const segments = parseGpxToSegments(gpxText);
      return segments?.length > 0 ? segments : null;
    } catch {
      return null;
    }
  };

  // Create route layers from segments
  const createRouteLayer = (L, segments, color) => {
    const group = L.featureGroup();
    
    segments.forEach((segment) => {
      const latLngs = segment
        .map((pt) => typeof pt.lat === "number" && typeof pt.lon === "number" ? [pt.lat, pt.lon] : null)
        .filter(Boolean);
      
      if (latLngs.length > 0) {
        L.polyline(latLngs, { color, weight: 3, opacity: 0.8 }).addTo(group);
      }

      const lastPt = segment[segment.length - 1];
      if (lastPt?.isEnd) {
        const endIcon = L.divIcon({
          className: "end-x-marker",
          html: '<div style="color:#ff0000;font-weight:700;font-size:20px;text-shadow:0 0 3px #fff;">✖</div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([lastPt.lat, lastPt.lon], { icon: endIcon }).addTo(group);
      }
    });

    return group;
  };

  // Initialize and update map
  useEffect(() => {
    if (!containerRef.current || filteredRaces.length === 0) {
      console.log("Skipping map init:", { hasContainer: !!containerRef.current, raceCount: filteredRaces.length });
      return;
    }

    // Only reinitialize if the race IDs have changed, not just the list order
    const currentRaceIds = filteredRaces.map(r => r.id).sort((a, b) => a - b);
    const raceIdsChanged = JSON.stringify(currentRaceIds) !== JSON.stringify(previousRaceIdsRef.current);
    
    if (!raceIdsChanged && mapInstanceRef.current) {
      console.log("Race IDs haven't changed, skipping reinitialization");
      return;
    }

    previousRaceIdsRef.current = currentRaceIds;

    console.log("Initializing map with", filteredRaces.length, "races");
    let isMounted = true;

    const initializeMap = async () => {
      try {
        const L = (await import("leaflet")).default;
        console.log("Leaflet loaded");

        // Ensure CSS is loaded
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        if (!isMounted) return;

        // Load GPX coordinates for all races first
        await Promise.all(
          filteredRaces.map(async (race) => {
            const gpxCoord = await getFirstGpxCoordinate(race);
            if (gpxCoord) {
              gpxCoordsRef.current.set(race.id, gpxCoord);
            }
          })
        );

        if (!isMounted) return;

        // Remove old map if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Create new map with default view
        const map = L.map(containerRef.current, {
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
        });
        console.log("Map instance created with default view");

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapInstanceRef.current = map;
        markersRef.current.clear();
        routesRef.current.clear();
        setExpandedRoutes(new Set()); // Clear expanded routes on reinitialize

        // Group races by coordinates
        const racesByCoords = new Map();
        filteredRaces.forEach((race) => {
          const coords = getRaceCoordinates(race);
          const key = `${coords.lat.toFixed(COORDINATE_PRECISION)},${coords.lng.toFixed(COORDINATE_PRECISION)}`;
          if (!racesByCoords.has(key)) {
            racesByCoords.set(key, []);
          }
          racesByCoords.get(key).push(race);
        });

        // Add markers for each coordinate group
        racesByCoords.forEach((racesAtLocation, coordKey) => {
          const firstRace = racesAtLocation[0];
          const coords = getRaceCoordinates(firstRace);
          
          // Determine marker color (use first race's color, or indicate multiple)
          const color = racesAtLocation.length > 1 ? MULTI_RACE_MARKER_COLOR : getMapColor(firstRace);
          
          // Create marker icon
          const markerIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.35);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          // Create and add marker
          const marker = L.marker([coords.lat, coords.lng], { icon: markerIcon });
          
          // Handle multiple races at same location
          if (racesAtLocation.length > 1) {
            // Build popup with race list
            const popupHtml = `
              <div class="custom-popup multi-race-popup">
                <div class="popup-title">Select a race (${racesAtLocation.length} at this location):</div>
                <ul class="race-selection-list">
                  ${racesAtLocation.map(race => {
                    const distanceLabel = race.distance ? `${race.distance} km` : '';
                    return `<li class="race-selection-item" data-race-id="${race.id}">
                      <strong>${race.name}</strong>
                      ${distanceLabel ? `<span class="race-distance">${distanceLabel}</span>` : ''}
                    </li>`;
                  }).join('')}
                </ul>
              </div>
            `;
            
            marker.bindPopup(popupHtml, { maxWidth: 300, minWidth: 200 });
            
            marker.on("click", (e) => {
              // Popup will open automatically
            });
            
            // Handle clicks on race items in popup
            marker.on("popupopen", () => {
              const popup = marker.getPopup();
              const popupElement = popup.getElement();
              if (popupElement) {
                const raceItems = popupElement.querySelectorAll('.race-selection-item');
                raceItems.forEach(item => {
                  item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const raceId = parseInt(item.getAttribute('data-race-id'));
                    marker.closePopup();
                    
                    if (viewMode === 'map') {
                      // Toggle route in map-only view
                      setExpandedRoutes((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(raceId)) {
                          newSet.delete(raceId);
                        } else {
                          newSet.add(raceId);
                        }
                        return newSet;
                      });
                    } else if (onMarkerClick) {
                      // Scroll to card in mixed view
                      onMarkerClick(raceId);
                    }
                  });
                });
              }
            });
          } else {
            // Single race at location - original behavior
            const race = racesAtLocation[0];
            const distanceLabel = race.distance ? `${race.distance} km` : null;
            
            if (viewMode === 'map') {
              const popupHtml = buildPopupHtml(race, distanceLabel, null);
              marker.bindPopup(popupHtml, { maxWidth: 200, minWidth: 140 });
              
              marker.on("click", (e) => {
                setExpandedRoutes((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(race.id)) {
                    newSet.delete(race.id);
                  } else {
                    newSet.add(race.id);
                  }
                  return newSet;
                });
              });
            } else {
              marker.on("click", (e) => {
                if (onMarkerClick) {
                  onMarkerClick(race.id);
                }
              });
            }
          }
          
          marker.addTo(map);

          // Store marker for all races at this location
          racesAtLocation.forEach(race => {
            markersRef.current.set(race.id, { marker, color, race, distanceLabel: race.distance ? `${race.distance} km` : null });
          });
        });

        console.log("Map initialized with", racesByCoords.size, "markers for", filteredRaces.length, "races");
        
        // Set up resize observer after map is created
        if (containerRef.current) {
          const resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              requestAnimationFrame(() => {
                if (mapInstanceRef.current) {
                  const mapPane = mapInstanceRef.current.getPane('mapPane');
                  if (mapPane) {
                    mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
                  }
                  
                  mapInstanceRef.current.invalidateSize({ pan: false });
                  
                  const center = mapInstanceRef.current.getCenter();
                  const zoom = mapInstanceRef.current.getZoom();
                  mapInstanceRef.current.setView(center, zoom, { animate: false });
                  
                  mapInstanceRef.current.eachLayer((layer) => {
                    if (layer.redraw) {
                      layer.redraw();
                    }
                  });
                }
              });
            }
          });
          
          resizeObserver.observe(containerRef.current);
          
          // Store observer for cleanup
          return () => {
            resizeObserver.disconnect();
            isMounted = false;
          };
        }
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, [filteredRaces]);

  // Load and display routes when expandedRoutes changes
  useEffect(() => {
    if (!mapInstanceRef.current || !filteredRaces.length) return;

    const loadRoutes = async () => {
      const L = (await import("leaflet")).default;

      // Remove all routes that are no longer in expandedRoutes
      routesRef.current.forEach((routeData, raceId) => {
        if (!expandedRoutes.has(raceId) && routeData.layer) {
          console.log("Removing route for race", raceId);
          mapInstanceRef.current.removeLayer(routeData.layer);
          routeData.layer = null;
        }
      });

      // Load and add new routes
      for (const raceId of expandedRoutes) {
        const race = filteredRaces.find((r) => r.id === raceId);
        if (!race) continue;

        const routeData = routesRef.current.get(raceId);
        if (routeData?.layer) continue; // Already loaded

        // Fetch GPX
        const gpxPath = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${race.id}.gpx`;
        try {
          const response = await fetch(gpxPath);
          if (!response.ok) continue;

          const gpxText = await response.text();
          const segments = parseGpxToSegments(gpxText);
          if (!segments?.length) continue;

          const color = markersRef.current.get(raceId)?.color || "#1f78b4";
          const featureGroup = createRouteLayer(L, segments, color);

          featureGroup.addTo(mapInstanceRef.current);

          // Calculate elevation data and update marker popup if in map-only mode
          const elevInfo = computeElevation(segments);
          const markerData = markersRef.current.get(raceId);
          if (markerData?.marker && markerData.marker.getPopup && viewMode === 'map') {
            const distanceLabel = markerData.distanceLabel || (race.distance ? `${race.distance} km` : null);
            const updatedPopupHtml = buildPopupHtml(race, distanceLabel, elevInfo);
            markerData.marker.setPopupContent(updatedPopupHtml);
          }

          // Store layer and elevation data
          if (!routesRef.current.has(raceId)) {
            routesRef.current.set(raceId, {});
          }
          routesRef.current.get(raceId).layer = featureGroup;
          routesRef.current.get(raceId).elevInfo = elevInfo;

          // Fit bounds
          try {
            mapInstanceRef.current.fitBounds(featureGroup.getBounds(), { padding: [50, 50] });
          } catch {
            // Bounds error
          }
        } catch (error) {
          console.error(`Failed to load GPX for race ${raceId}:`, error);
        }
      }
    };

    loadRoutes();
  }, [expandedRoutes, filteredRaces]);

  // Handle expandedRaceId from list card expansion
  useEffect(() => {
    // Only process if expandedRaceId has changed (not just re-renders with same value)
    if (expandedRaceId === previousExpandedRaceIdRef.current) return;
    
    const previousId = previousExpandedRaceIdRef.current;
    previousExpandedRaceIdRef.current = expandedRaceId;

    // Remove the previous race from expandedRoutes if it exists
    if (previousId !== null) {
      setExpandedRoutes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(previousId);
        return newSet;
      });
    }

    // If expandedRaceId is null, we're done (just removed the previous route above)
    if (expandedRaceId === null) return;

    if (!mapInstanceRef.current) return;

    // Add the new expanded race to expandedRoutes
    setExpandedRoutes((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has(expandedRaceId)) {
        newSet.add(expandedRaceId);
      }
      return newSet;
    });

    // Zoom to the expanded race's marker
    const marker = markersRef.current.get(expandedRaceId);
    if (marker?.marker) {
      const markerLatLng = marker.marker.getLatLng();
      mapInstanceRef.current.setView(markerLatLng, 14, { animate: true });
    }
  }, [expandedRaceId]);

  if (!filteredRaces.length) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        No races to display on map
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        position: "relative",
      }}
    />
  );
}
