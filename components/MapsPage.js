import { useEffect, useRef, useState } from "react";
import { getRaceId } from "../utils/getRaceId";
import races from "../data/races.json";
import { parseGpxToSegments } from "../utils/parseGpx";

export default function MapsPage() {
	const mapRef = useRef(null);
	const leafletRef = useRef(null);
	const blobUrlsRef = useRef([]); // track created blob URLs to revoke on unmount
	const [loading, setLoading] = useState(true);
	const [layersInfo, setLayersInfo] = useState([]); // { id, name, visible, elevInfo, distanceKm, lightMarker }

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

				// parse start point and elevation quickly
				let segments = [];
				try {
					segments = parseGpxToSegments(gpxText);
				} catch (err) {
					segments = [];
				}
				if (!segments || segments.length === 0) continue;

				// Robustly pick the first <trkpt> in the GPX XML (fallback to rtept or wpt)
				let startLatLng = null;
				let firstEle = null;
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
					startLatLng = null;
					firstEle = null;
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

				// Create lightweight marker (visible by default)
				let lightMarker = null;
				if (startLatLng) {
					const buildSmallPin = (fillColor) => {
						const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${fillColor}" stroke="#000" stroke-opacity="0.12"/><circle cx="12" cy="9" r="2" fill="#fff"/></svg>`;
						return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
					};
					const iconUrl = buildSmallPin(color);
					const icon = L.icon({
						iconUrl,
						iconSize: [18, 30],
						iconAnchor: [9, 30],
						popupAnchor: [0, -26],
						className: ""
					});
					lightMarker = L.marker([startLatLng.lat, startLatLng.lng], { icon, interactive: true }).addTo(map);
					if (typeof lightMarker.setZIndexOffset === "function") lightMarker.setZIndexOffset(900);

					// bind popup toggle button to lightweight marker
					const elvText = elevGainMeters != null ? `<br/>Elevation gain: ${Math.round(elevGainMeters)} m` : "";
					const popupContent = `<strong>${race.name}</strong>${elvText}<br/><button data-rid="${raceId}">Show track</button>`;
					lightMarker.bindPopup(popupContent);

					lightMarker.on("popupopen", () => {
						const btn = document.querySelector(`button[data-rid="${raceId}"]`);
						if (btn) {
							btn.onclick = (ev) => {
								ev.preventDefault();
								const grp = groups.find((g) => g.raceId === raceId);
								if (!grp) return;
								// toggle via same logic as sidebar
								if (grp.visible) {
									// hide plugin layer and re-show lightweight marker
									if (map.hasLayer(grp.layer)) map.removeLayer(grp.layer);
									grp.visible = false;
									if (grp.lightMarker && !map.hasLayer(grp.lightMarker)) grp.lightMarker.addTo(map);
									btn.textContent = "Show track";
								} else {
									// remove lightweight marker and create & show plugin layer on-demand
									if (grp.lightMarker && map.hasLayer(grp.lightMarker)) map.removeLayer(grp.lightMarker);
									// create L.GPX from blobUrl if not created yet
									if (!grp.layer) {
										try {
											const layer = new L.GPX(grp.blobUrl || gpxUrl, {
												async: true,
												polyline_options: { color: grp.color, weight: 3, opacity: 0.9 },
												marker_options: { startIconUrl: "", endIconUrl: "" },
											});
											layer.on("loaded", () => {
												// bind plugin markers' popups and remove duplicates if necessary
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
								if (mounted) setLayersInfo(groups.map((g) => ({ id: g.id, name: g.name, visible: g.visible, elevInfo: g.elevInfo, distanceKm: g.distanceKm })));
							};
						}
					});
				}

				// Distance from race data
				const distanceKm = typeof race.distance === "number" ? +(race.distance) : (race.distance ? String(race.distance) : null);

				// push group but DO NOT create plugin GPX layer yet; store blobUrl for on-demand creation
				const group = {
					id: String(i),
					raceId,
					name: race.name,
					layer: null, // created only when toggled
					blobUrl,
					color,
					lightMarker,
					visible: false,
					elevInfo: (elevGainMeters != null || elevLossMeters != null)
						? { gain: elevGainMeters ?? null, loss: elevLossMeters ?? null, unit: "m" }
						: null,
					distanceKm,
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
						raceSlug: g.raceId
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

			// Reproject marker icons after zoom/move to avoid visual drift
			const reprojectMarkers = () => {
				try {
					(groups || []).forEach((g) => {
						if (g.lightMarker && g.lightMarker.getLatLng && g.lightMarker.setLatLng) {
							const ll = g.lightMarker.getLatLng();
							g.lightMarker.setLatLng(ll);
						}
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
			// hide plugin layer and re-add lightweight marker
			if (ref.map.hasLayer(group.layer)) ref.map.removeLayer(group.layer);
			group.visible = false;
			if (group.lightMarker && !ref.map.hasLayer(group.lightMarker)) group.lightMarker.addTo(ref.map);
		} else {
			// remove lightweight marker then create plugin layer if needed and add to map
			if (group.lightMarker && ref.map.hasLayer(group.lightMarker)) ref.map.removeLayer(group.lightMarker);

			if (!group.layer) {
				try {
					const layer = new ref.L.GPX(group.blobUrl, {
						async: true,
						polyline_options: { color: group.color, weight: 3, opacity: 0.9 },
						marker_options: { startIconUrl: "", endIconUrl: "" },
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
		setLayersInfo(ref.groups.map((g) => ({
			id: g.id,
			name: g.name,
			visible: g.visible,
			elevInfo: g.elevInfo,
			distanceKm: g.distanceKm,
			raceSlug: g.raceId
		})));
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
      <div style={{ padding: "1rem 0" }}>
        <h1 style={{ margin: 0 }}>Race Map</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>
        <div style={{ minHeight: 500, height: "70vh", borderRadius: 8, overflow: "hidden", border: "1px solid #ddd" }}>
          <div ref={mapRef} id="map" style={{ width: "100%", height: "100%" }} />
        </div>

        <aside style={{ padding: 8 }}>
          <h3 style={{ marginTop: 0 }}>Races</h3>
          {loading && <p>Loading GPX races…</p>}
          {!loading && layersInfo.length === 0 && <p>No GPX files found. Place GPX files in /public/gpx/.</p>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {layersInfo.map((li) => (
              <li key={li.id} style={{ marginBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={li.visible} onChange={() => toggleLayer(li.id)} />
                  <a href={`/race/${encodeURIComponent(li.raceSlug || li.name)}`} onClick={(e) => e.stopPropagation()} style={{ color: "#222", textDecoration: "none" }}>
                    {li.name}
                  </a>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
                    {formatSideText(li.distanceKm, li.elevInfo)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}