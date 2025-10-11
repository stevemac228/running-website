import { useEffect, useRef, useState } from "react";
import { getRaceId } from "../utils/getRaceId";
import races from "../data/races.json";
import { parseGpxToSegments } from "../utils/parseGpx";

export default function MapsPage() {
	const mapRef = useRef(null);
	const leafletRef = useRef(null);
	const blobUrlsRef = useRef([]); // track created blob URLs to revoke on unmount
	const [loading, setLoading] = useState(true);
	const [layersInfo, setLayersInfo] = useState([]); // { id, name, visible, elevInfo, distanceKm, raceSlug }
	const [mapBounds, setMapBounds] = useState(null); // track current map viewport bounds

	useEffect(() => {
		let mounted = true;

		// helper: haversine distance (meters)
		const haversine = (a, b) => {
			const toRad = (v) => (v * Math.PI) / 180;
			const R = 6371000;
			const dLat = toRad(b.lat - a.lat);
			const dLon = toRad(b.lng - a.lng);
			const lat1 = toRad(a.lat);
			const lat2 = toRad(b.lat);
			const sinDLat = Math.sin(dLat / 2);
			const sinDLon = Math.sin(dLon / 2);
			const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
			return R * c;
		};

		// compute polyline total length (meters)
		const computePolyLength = (poly) => {
			// poly.getLatLngs is a function that returns arrays (possibly nested)
			const latlngs = typeof poly.getLatLngs === "function" ? poly.getLatLngs() : (poly._latlngs || []);
			// flatten possible nested arrays safely
			const flatten = (arr) => {
				try {
					return Array.isArray(arr.flat) ? arr.flat(Infinity) : arr.reduce((acc, v) => acc.concat(v), []);
				} catch (e) {
					// fallback: attempt a shallow flatten
					return [].concat(...arr);
				}
			};
			const pts = Array.isArray(latlngs) ? flatten(latlngs).filter((p) => p && typeof p.lat === "number") : [];
			let sum = 0;
			for (let i = 1; i < pts.length; i++) {
				sum += haversine(pts[i - 1], pts[i]);
			}
			return sum; // meters
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
			await import("leaflet-gpx");

			// Utility to build a custom SVG pin icon
			const buildSmallPin = (fillColor) => {
				const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${fillColor}" stroke="#000" stroke-opacity="0.12"/><circle cx="12" cy="9" r="2" fill="#fff"/></svg>`;
				return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
			};

			const map = L.map(mapRef.current, { center: [47.5, -52.7], zoom: 8 });
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "&copy; OpenStreetMap contributors",
			}).addTo(map);

			const groups = [];
			const globalBounds = L.latLngBounds();
			const colors = [
				"#1f78b4",
				"#33a02c",
				"#e31a1c",
				"#ff7f00",
				"#6a3d9a",
				"#b15928",
				"#a6cee3",
				"#b2df8a",
			];

			// Build parallel fetch promises for GPX files
			const fetchPromises = races.map((race) => {
				const raceId = getRaceId(race);
				const gpxUrl = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${encodeURIComponent(raceId)}.gpx`;
				// check sessionStorage cache
				const cacheKey = `gpx:${raceId}`;
				const cached = sessionStorage.getItem(cacheKey);
				if (cached) return Promise.resolve({ race, raceId, gpxUrl, gpxText: cached, cacheKey });
				// fetch text
				return fetch(gpxUrl)
					.then((res) => {
						if (!res.ok) throw new Error("not found");
						return res.text();
					})
					.then((text) => ({ race, raceId, gpxUrl, gpxText: text, cacheKey }))
					.catch(() => ({ race, raceId, gpxUrl, gpxText: null, cacheKey }));
			});

			// Wait for all fetches (parallel) but don't block UI updates for long
			const results = await Promise.allSettled(fetchPromises);

			for (let i = 0; i < results.length; i++) {
				const res = results[i];
				if (res.status !== "fulfilled") continue;
				const item = res.value;
				const { race, raceId, gpxUrl, gpxText, cacheKey } = item;
				if (!gpxText) continue;

				// cache in sessionStorage for this session (bounded by storage limits)
				try {
					sessionStorage.setItem(cacheKey, gpxText);
				} catch (err) {
					// ignore quota issues
				}

				// Check if race has direct coordinates first
				let startLatLng = null;
				let firstEle = null;
				
				if (race.startLineCoordinates && Array.isArray(race.startLineCoordinates) && race.startLineCoordinates.length === 2) {
					const [lat, lon] = race.startLineCoordinates;
					if (typeof lat === 'number' && typeof lon === 'number') {
						startLatLng = { lat, lng: lon };
					}
				}

				// parse start point and elevation quickly from GPX if no direct coordinates
				let segments = [];
				try {
					segments = parseGpxToSegments(gpxText);
				} catch (err) {
					segments = [];
				}
				if (!segments || segments.length === 0) continue;

				// If no direct coordinates, parse from GPX
				if (!startLatLng) {
					try {
						const parser = new DOMParser();
						const doc = parser.parseFromString(gpxText, "application/xml");
						// Prefer trkpt then rtept then wpt
						const firstPtEl =
							doc.querySelector("trk trkseg trkpt") ||
							doc.querySelector("trkpt") ||
							doc.querySelector("rte rtept") ||
							doc.querySelector("rtept") ||
							doc.querySelector("wpt");
						if (firstPtEl) {
							const lat = parseFloat(firstPtEl.getAttribute("lat"));
							const lon = parseFloat(firstPtEl.getAttribute("lon"));
							const eleEl = firstPtEl.querySelector && firstPtEl.querySelector("ele");
							const ele = eleEl ? parseFloat(eleEl.textContent) : null;
							if (Number.isFinite(lat) && Number.isFinite(lon)) {
								startLatLng = { lat, lng: lon };
								firstEle = Number.isFinite(ele) ? ele : null;
							}
						}
					} catch (err) {
						// startLatLng remains null if parsing failed
					}
				}

				// compute elevation gain (sum of positive diffs) and loss (sum of negative diffs) across segments
				let elevGainMeters = null;
				let elevLossMeters = null;
				try {
					let gain = 0;
					let loss = 0;
					let hadEle = false;
					for (const seg of segments) {
						for (let p = 1; p < seg.length; p++) {
							const prev = seg[p - 1];
							const curr = seg[p];
							if (prev.ele != null && curr.ele != null) {
								hadEle = true;
								const diff = curr.ele - prev.ele;
								if (diff > 0) gain += diff;
								else if (diff < 0) loss += -diff;
							}
						}
					}
					if (hadEle) {
						elevGainMeters = Math.round(gain);
						elevLossMeters = Math.round(loss);
					}
					// if plugin or segments had no ele but first trkpt included ele, use a small fallback
					if (elevGainMeters == null && firstEle != null) elevGainMeters = 0;
					if (elevLossMeters == null && firstEle != null) elevLossMeters = 0;
				} catch (err) {
					elevGainMeters = null;
					elevLossMeters = null;
				}
				
				const color = colors[i % colors.length];

				// Create a Blob+objectURL so we can instantiate L.GPX later without refetching
				const blob = new Blob([gpxText], { type: "application/gpx+xml" });
				const blobUrl = URL.createObjectURL(blob);
				blobUrlsRef.current.push(blobUrl);

				// Create lightweight layer with GPX markers but without polylines (visible by default)
				let lightMarker = null;
				let lightLayer = null;
				if (startLatLng) {
					// Create GPX layer with start marker only (no end marker, no polylines)
					// Use DivIcon for better stability during zoom/pan
					try {
						lightLayer = new L.GPX(blobUrl, {
							async: true,
							polyline_options: { color: color, weight: 0, opacity: 0 }, // Hide polylines
							markers: {
								startIcon: L.divIcon({
									className: 'custom-div-icon',
									html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
									iconSize: [12, 12],
									iconAnchor: [6, 6],
								}),
								endIcon: null, // Don't create end marker at all
							},
							marker_options: {
								clickable: true
							},
						});
						
						lightLayer.on("loaded", () => {
							// Remove polylines from the layer to prevent them from appearing
							const children = typeof lightLayer.getLayers === "function" ? lightLayer.getLayers() : [];
							children.forEach((child) => {
								if (child instanceof L.Polyline && !(child instanceof L.Marker)) {
									lightLayer.removeLayer(child);
								}
							});
							
							// Find the start marker and bind popup to it
							children.forEach((child) => {
								if (child instanceof L.Marker) {
									lightMarker = child;
									if (typeof child.setZIndexOffset === "function") child.setZIndexOffset(900);
								}
							});
						});
						
						lightLayer.addTo(map);
					} catch (err) {
						console.error("Error creating light layer:", err);
						lightLayer = null;
					}

					// Bind popup to the start marker after it loads
					const elvText = elevGainMeters != null ? `<br/>Elevation gain: ${Math.round(elevGainMeters)} m` : "";
					const popupContent = `<strong>${race.name}</strong>${elvText}<br/><button data-rid="${raceId}">Show track</button>`;
					
					if (lightLayer) {
						lightLayer.on("loaded", () => {
							// Find the start marker and bind popup
							const children = typeof lightLayer.getLayers === "function" ? lightLayer.getLayers() : [];
							children.forEach((child) => {
								if (child instanceof L.Marker) {
									try {
										child.bindPopup(popupContent);
										child.on("popupopen", () => {
											const btn = document.querySelector(`button[data-rid="${raceId}"]`);
											if (btn) {
												btn.onclick = (ev) => {
													ev.preventDefault();
													const grp = groups.find((g) => g.raceId === raceId);
													if (!grp) return;
													// toggle via same logic as sidebar
													if (grp.visible) {
														// hide full GPX layer and re-show lightweight layer
														if (map.hasLayer(grp.layer)) map.removeLayer(grp.layer);
														grp.visible = false;
														if (grp.lightLayer && !map.hasLayer(grp.lightLayer)) grp.lightLayer.addTo(map);
														btn.textContent = "Show track";
													} else {
														// remove lightweight layer and create & show full plugin layer on-demand
														if (grp.lightLayer && map.hasLayer(grp.lightLayer)) map.removeLayer(grp.lightLayer);
														// create L.GPX from blobUrl if not created yet
														if (!grp.layer) {
															try {
																const layer = new L.GPX(grp.blobUrl || gpxUrl, {
																	async: true,
																	polyline_options: { color: grp.color, weight: 3, opacity: 0.9 },
																	markers: {
																		startIcon: L.divIcon({
																			className: 'custom-div-icon',
																			html: `<div style="background-color: ${grp.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
																			iconSize: [12, 12],
																			iconAnchor: [6, 6],
																		}),
																		endIcon: L.divIcon({
																			className: 'custom-div-icon',
																			html: `<div style="background-color: ${grp.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
																			iconSize: [12, 12],
																			iconAnchor: [6, 6],
																		}),
																	},
																	marker_options: {
																		clickable: true
																	},
																});
																layer.on("loaded", () => {
																	// bind plugin markers' popups
																	const children = typeof layer.getLayers === "function" ? layer.getLayers() : [];
																	children.forEach((child) => {
																		if (child instanceof L.Marker) {
																			try {
																				child.bindPopup(popupContent);
																			} catch (err) {}
																		}
																	});
																});
																grp.layer = layer;
															} catch (_) { grp.layer = null; }
														}
														if (grp.layer) grp.layer.addTo(map);
														grp.visible = true;
														btn.textContent = "Hide track";
														try {
															const b = grp.layer.getBounds && grp.layer.getBounds();
															if (b && b.isValid()) map.fitBounds(b.pad(0.1));
														} catch (_) {}
													}
													if (mounted) {
														const bounds = map.getBounds();
														const filtered = groups
															.filter((g) => {
																if (!g.startLatLng) return false;
																return bounds.contains([g.startLatLng.lat, g.startLatLng.lng]);
															})
															.map((g) => ({ id: g.id, name: g.name, visible: g.visible, elevInfo: g.elevInfo, distanceKm: g.distanceKm, raceSlug: g.raceId, color: g.color }));
														setLayersInfo(filtered);
													}
												};
											}
										});
									} catch (err) {
										console.error("Error binding popup:", err);
									}
								}
							});
						});
					}
				}

				// Distance from race data
				const distanceKm = typeof race.distance === "number" ? +(race.distance) : (race.distance ? String(race.distance) : null);

				// push group but DO NOT create full plugin GPX layer yet; store blobUrl for on-demand creation
				const group = {
					id: String(i),
					raceId,
					name: race.name,
					layer: null, // full GPX layer created only when toggled
					blobUrl,
					color,
					lightLayer, // GPX layer with markers but no polylines (visible by default)
					visible: false,
					elevInfo: (elevGainMeters != null || elevLossMeters != null)
						? { gain: elevGainMeters ?? null, loss: elevLossMeters ?? null, unit: "m" }
						: null,
					distanceKm,
					startLatLng, // store start coordinates for filtering
				};
				groups.push(group);

				// add bounds from start point so map fits markers
				if (startLatLng) globalBounds.extend([startLatLng.lat, startLatLng.lng]);

				// update UI state incrementally
				if (mounted) {
					leafletRef.current = { L, map, groups };

					setLayersInfo(groups.map((g) => ({
						id: g.id,
						name: g.name,
						visible: g.visible,
						elevInfo: g.elevInfo,
						distanceKm: g.distanceKm,
						raceSlug: g.raceId,
						color: g.color
					})));
				}
			} // end for

			// fit map to markers / start points
			setTimeout(() => {
				if (globalBounds.isValid()) {
					map.fitBounds(globalBounds.pad(0.1));
				} else {
					map.setView([47.5, -52.7], 8);
				}
				if (mounted) setLoading(false);
			}, 200);

			// store references
			leafletRef.current = { L, map, groups };

			// Function to update the race list based on current map bounds
			const updateVisibleRaces = () => {
				const bounds = map.getBounds();
				setMapBounds(bounds);
				
				// Filter races whose start points are within the viewport
				const filteredGroups = groups
					.filter((g) => {
						if (!g.startLatLng) return false;
						return bounds.contains([g.startLatLng.lat, g.startLatLng.lng]);
					})
					.map((g) => ({
						id: g.id,
						name: g.name,
						visible: g.visible,
						elevInfo: g.elevInfo,
						distanceKm: g.distanceKm,
						raceSlug: g.raceId,
						color: g.color
					}));
				
				if (mounted) setLayersInfo(filteredGroups);
			};

			// Add event listeners to update race list when map view changes
			map.on("moveend", updateVisibleRaces);
			map.on("zoomend", updateVisibleRaces);

			// Initial update after map is fitted
			setTimeout(() => {
				updateVisibleRaces();
			}, 300);

			// Reproject marker icons after zoom/move to avoid visual drift
			// Note: With GPX plugin markers, this should no longer be necessary,
			// but keeping it for any edge cases
			const reprojectMarkers = () => {
				try {
					(groups || []).forEach((g) => {
						// Handle lightLayer markers (GPX-based markers that shouldn't drift)
						if (g.lightLayer && typeof g.lightLayer.getLayers === "function") {
							const children = g.lightLayer.getLayers();
							children.forEach((child) => {
								if (child && child.getLatLng && child.setLatLng) {
									const ll = child.getLatLng();
									child.setLatLng(ll);
								}
							});
						}
						// Handle full GPX layer markers
						if (g.layer && typeof g.layer.getLayers === "function") {
							const children = g.layer.getLayers();
							children.forEach((child) => {
								if (child && child.getLatLng && child.setLatLng) {
									const cLL = child.getLatLng();
									child.setLatLng(cLL);
								}
							});
						}
					});
				} catch (err) {}
			};

			map.on("zoomend moveend zoom", reprojectMarkers);
			map.on("zoomanim", () => setTimeout(reprojectMarkers, 50));
		} // init

		init();

		return () => {
			mounted = false;
			// cleanup map and revoke blob URLs
			if (leafletRef.current?.map) {
				leafletRef.current.map.remove();
			}
			(blobUrlsRef.current || []).forEach((u) => {
				try { URL.revokeObjectURL(u); } catch (_){ }
			});
		};
	}, []);

	// toggle either from sidebar or popup button — create GPX layer on demand
	function toggleLayer(id) {
		const ref = leafletRef.current;
		if (!ref) return;
		const group = ref.groups.find((g) => g.id === id);
		if (!group) return;

		if (group.visible) {
			// hide full plugin layer and re-add lightweight layer
			if (ref.map.hasLayer(group.layer)) ref.map.removeLayer(group.layer);
			group.visible = false;
			if (group.lightLayer && !ref.map.hasLayer(group.lightLayer)) group.lightLayer.addTo(ref.map);
		} else {
			// remove lightweight layer then create full plugin layer if needed and add to map
			if (group.lightLayer && ref.map.hasLayer(group.lightLayer)) ref.map.removeLayer(group.lightLayer);

			if (!group.layer) {
				try {
					const layer = new ref.L.GPX(group.blobUrl, {
						async: true,
						polyline_options: { color: group.color, weight: 3, opacity: 0.9 },
						markers: {
							startIcon: ref.L.divIcon({
								className: 'custom-div-icon',
								html: `<div style="background-color: ${group.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
								iconSize: [12, 12],
								iconAnchor: [6, 6],
							}),
							endIcon: ref.L.divIcon({
								className: 'custom-div-icon',
								html: `<div style="background-color: ${group.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
								iconSize: [12, 12],
								iconAnchor: [6, 6],
							}),
						},
						marker_options: {
							clickable: true
						},
					});
					layer.on("loaded", () => {
						const popupContent = `<strong>${group.name}</strong>${group.elevInfo ? `<br/>Elevation gain: ${Math.round(group.elevInfo.gain)} m` : ""}<br/><button data-rid="${group.raceId}">Show track</button>`;
						const children = typeof layer.getLayers === "function" ? layer.getLayers() : [];
						children.forEach((child) => {
							if (child instanceof ref.L.Marker) {
								try { child.bindPopup(popupContent); } catch (_) {}
							}
						});
					});
					group.layer = layer;
				} catch (_) { group.layer = null; }
			}

			if (group.layer) group.layer.addTo(ref.map);
			group.visible = true;
			try {
				const b = group.layer.getBounds && group.layer.getBounds();
				if (b && b.isValid()) ref.map.fitBounds(b.pad(0.1));
			} catch (err) {}
		}
		
		// Update race list based on current map bounds
		const bounds = ref.map.getBounds();
		const filteredGroups = ref.groups
			.filter((g) => {
				if (!g.startLatLng) return false;
				return bounds.contains([g.startLatLng.lat, g.startLatLng.lng]);
			})
			.map((g) => ({
				id: g.id,
				name: g.name,
				visible: g.visible,
				elevInfo: g.elevInfo,
				distanceKm: g.distanceKm,
				raceSlug: g.raceId,
				color: g.color
			}));
		
		setLayersInfo(filteredGroups);
	}

	// helper formatting for sidebar: "10k - 41ft elv" -> "10km - 90m ↑ 100m ↓"
	const formatSideText = (distanceKm, elevInfo) => {
		const parts = [];
		// distance
		if (typeof distanceKm === "number" && !Number.isNaN(distanceKm)) {
			parts.push(`${distanceKm % 1 === 0 ? String(distanceKm) : String(distanceKm)}km`);
		} else if (typeof distanceKm === "string" && distanceKm.trim() !== "") {
			parts.push(distanceKm);
		}
		// elevation
		if (elevInfo && (elevInfo.gain != null || elevInfo.loss != null)) {
			const up = elevInfo.gain != null ? `${Math.round(elevInfo.gain)}m ↑` : null;
			const down = elevInfo.loss != null ? `${Math.round(elevInfo.loss)}m ↓` : null;
			const elevPart = [up, down].filter(Boolean).join(" ");
			if (elevPart) parts.push(elevPart);
		}
		return parts.join(" - ") || "—";
	};

  return (
    <div>
      <div className="maps-page-container">
        <h1 className="maps-page-title">Race Map</h1>
      </div>

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
                  />
                  <span className="maps-page-color-indicator" style={{ backgroundColor: li.color }}></span>
                  <div className="maps-page-race-content">
                    <a href={`/race/${encodeURIComponent(li.raceSlug || li.name)}`} onClick={(e) => e.stopPropagation()} className="maps-page-race-link">
                      {li.name}
                    </a>
                    <span className="maps-page-race-details">
                      {formatSideText(li.distanceKm, li.elevInfo)}
                    </span>
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