import { useEffect, useMemo, useState } from "react";
import { getRaceId } from "../../utils/getRaceId";
import { parseGpxToSegments } from "../../utils/parseGpx";

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceInMeters(a, b) {
  const earthRadius = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function downsample(points, maxPoints = 700) {
  if (points.length <= maxPoints) return points;
  const sampled = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    sampled.push(points[Math.round(i * step)]);
  }
  return sampled;
}

function findNearestPoint(points, distanceKm) {
  let left = 0;
  let right = points.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (points[mid].distanceKm < distanceKm) left = mid + 1;
    else right = mid;
  }
  const current = points[left];
  const previous = points[left - 1];
  if (!previous) return current;
  return Math.abs(current.distanceKm - distanceKm) < Math.abs(previous.distanceKm - distanceKm)
    ? current
    : previous;
}

function getSegmentPoints(points, startKm, endKm) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const startPoint = findNearestPoint(points, startKm);
  const endPoint = findNearestPoint(points, endKm);
  if (!startPoint || !endPoint) return [];
  const between = points.filter((point) => point.distanceKm >= startKm && point.distanceKm <= endKm);
  const combined = [startPoint, ...between, endPoint].sort((a, b) => a.distanceKm - b.distanceKm);
  const unique = [];
  for (const point of combined) {
    if (!unique.length || unique[unique.length - 1].distanceKm !== point.distanceKm) unique.push(point);
  }
  return unique.length >= 2 ? unique : [];
}

export default function ElevationChart({ race }) {
  const [profile, setProfile] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!race?.hasElevationChart) {
        setProfile([]);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setHover(null);
      try {
        const raceId = getRaceId(race);
        const gpxUrl = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${encodeURIComponent(raceId)}.gpx`;
        const response = await fetch(gpxUrl);
        if (!response.ok) throw new Error("Unable to load route profile");
        const gpxText = await response.text();
        const segments = parseGpxToSegments(gpxText);
        const points = [];
        let distanceMeters = 0;
        segments.forEach((segment) => {
          for (let i = 0; i < segment.length; i += 1) {
            const point = segment[i];
            if (i > 0) distanceMeters += distanceInMeters(segment[i - 1], point);
            if (typeof point.ele === "number" && Number.isFinite(point.ele)) {
              points.push({
                distanceKm: distanceMeters / 1000,
                elevationM: point.ele,
              });
            }
          }
        });
        if (!cancelled) {
          if (points.length < 2) {
            setError("Elevation profile is not available for this route yet.");
            setProfile([]);
          } else {
            setProfile(points);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Elevation profile is not available for this route yet.");
          setProfile([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [race]);

  const chart = useMemo(() => {
    if (!profile.length) return null;

    const sampled = downsample(profile);
    const width = 1000;
    const height = 290;
    const margin = { top: 16, right: 18, bottom: 88, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxDistance = Math.max(sampled[sampled.length - 1].distanceKm, 0.001);
    const elevations = sampled.map((point) => point.elevationM);
    const minElevation = Math.floor(Math.min(...elevations));
    const maxElevation = Math.ceil(Math.max(...elevations));
    const elevationRange = Math.max(maxElevation - minElevation, 1);

    const xFor = (distanceKm) => margin.left + (distanceKm / maxDistance) * plotWidth;
    const yFor = (elevationM) => margin.top + ((maxElevation - elevationM) / elevationRange) * plotHeight;

    const line = sampled.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(point.distanceKm)},${yFor(point.elevationM)}`).join(" ");
    const area = `${line} L${xFor(sampled[sampled.length - 1].distanceKm)},${margin.top + plotHeight} L${xFor(sampled[0].distanceKm)},${margin.top + plotHeight} Z`;

    const yTicks = Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3;
      const elevation = maxElevation - ratio * elevationRange;
      return {
        y: margin.top + ratio * plotHeight,
        value: Math.round(elevation),
      };
    });

    const xTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const distance = ratio * maxDistance;
      return {
        x: margin.left + ratio * plotWidth,
        value: distance.toFixed(1),
      };
    });

    return {
      sampled,
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      maxDistance,
      xFor,
      yFor,
      line,
      area,
      yTicks,
      xTicks,
    };
  }, [profile]);

  if (loading) return <p>Loading elevation profile…</p>;
  if (error) return <p>{error}</p>;
  if (!chart) return null;

  const aidStations = Array.isArray(race?.elevationAidStations) ? race.elevationAidStations : [];
  const courseSegments = Array.isArray(race?.elevationCourseSegments)
    ? race.elevationCourseSegments
        .map((entry) => {
          if (!Array.isArray(entry) || entry.length !== 2) return null;
          const [name, bounds] = entry;
          if (typeof name !== "string" || !Array.isArray(bounds) || bounds.length !== 2) return null;
          const [startKm, endKm] = bounds;
          if (!Number.isFinite(startKm) || !Number.isFinite(endKm)) return null;
          return {
            name,
            startKm: Math.min(startKm, endKm),
            endKm: Math.max(startKm, endKm),
          };
        })
        .filter(Boolean)
    : [];
  const segmentPalette = ["#6ab57d", "#58a56c", "#46945b", "#36834b", "#2e6a3c", "#245532"];
  const segmentDrawData = courseSegments
    .map((segment, index) => {
      const color = segmentPalette[index % segmentPalette.length];
      const points = getSegmentPoints(chart.sampled, segment.startKm, segment.endKm);
      if (points.length < 2) return null;
      const linePath = points
        .map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"}${chart.xFor(point.distanceKm)},${chart.yFor(point.elevationM)}`)
        .join(" ");
      const areaPath = `${linePath} L${chart.xFor(points[points.length - 1].distanceKm)},${chart.margin.top + chart.plotHeight} L${chart.xFor(points[0].distanceKm)},${chart.margin.top + chart.plotHeight} Z`;
      const startX = chart.xFor(Math.min(Math.max(segment.startKm, 0), chart.maxDistance));
      const endX = chart.xFor(Math.min(Math.max(segment.endKm, 0), chart.maxDistance));
      const bandWidth = Math.max(endX - startX, 2);
      const centerX = startX + bandWidth / 2;
      return {
        ...segment,
        color,
        gradientId: `elevation-segment-gradient-${race?.id || "race"}-${index}`,
        linePath,
        areaPath,
        startX,
        bandWidth,
        centerX,
      };
    })
    .filter(Boolean);

  return (
    <div className="elevation-chart-wrapper">
      <div className="elevation-chart-container">
        <svg
          className="elevation-chart-svg"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img"
          aria-label={`${race?.name || "Race"} elevation profile`}
          onMouseMove={(event) => {
            const svgRect = event.currentTarget.getBoundingClientRect();
            const containerRect = event.currentTarget.parentElement.getBoundingClientRect();
            const svgX = ((event.clientX - svgRect.left) / svgRect.width) * chart.width;
            const clamped = Math.min(Math.max(svgX, chart.margin.left), chart.margin.left + chart.plotWidth);
            const distanceKm = ((clamped - chart.margin.left) / chart.plotWidth) * chart.maxDistance;
          const point = findNearestPoint(profile, distanceKm);
          if (!point) return;
          setHover({
            point,
            x: clamped,
            y: chart.yFor(point.elevationM),
            tooltipLeft: event.clientX - containerRect.left,
            tooltipTop: event.clientY - containerRect.top,
          });
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {segmentDrawData.map((segment) => (
              <linearGradient key={segment.gradientId} id={segment.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={segment.color} stopOpacity="0.33" />
                <stop offset="100%" stopColor={segment.color} stopOpacity="0.04" />
              </linearGradient>
            ))}
          </defs>

          {chart.yTicks.map((tick) => (
            <g key={`y-${tick.value}`}>
              <line x1={chart.margin.left} y1={tick.y} x2={chart.margin.left + chart.plotWidth} y2={tick.y} className="elevation-grid-line" />
              <text x={chart.margin.left - 8} y={tick.y + 4} textAnchor="end" className="elevation-axis-text">
                {tick.value.toLocaleString()} M
              </text>
            </g>
          ))}

          {chart.xTicks.map((tick) => (
            <g key={`x-${tick.value}`}>
              <text x={tick.x} y={chart.margin.top + chart.plotHeight + 20} textAnchor="middle" className="elevation-axis-text">
                {tick.value} km
              </text>
            </g>
          ))}

          <path d={chart.area} className="elevation-area-base" />
          <path d={chart.line} className="elevation-line-base" />

          {segmentDrawData.map((segment) => (
            <g key={`${segment.name}-shape-${segment.startKm}-${segment.endKm}`}>
              <path d={segment.areaPath} fill={`url(#${segment.gradientId})`} />
              <path d={segment.linePath} fill="none" stroke={segment.color} strokeWidth="2.4" />
            </g>
          ))}

          {aidStations
            .filter((station) => Number.isFinite(station?.distanceKm))
            .map((station) => {
              const stationPoint = findNearestPoint(profile, station.distanceKm);
              if (!stationPoint) return null;
              const stationX = chart.xFor(stationPoint.distanceKm);
              const stationY = chart.yFor(stationPoint.elevationM);
              return (
                <g key={`${station.name}-${station.distanceKm}`}>
                  <line x1={stationX} y1={chart.margin.top} x2={stationX} y2={chart.margin.top + chart.plotHeight} className="elevation-aid-line" />
                  <circle cx={stationX} cy={stationY} r="4" className="elevation-aid-dot" />
                  <text x={stationX} y={chart.margin.top + chart.plotHeight + 36} textAnchor="middle" className="elevation-aid-text">
                    <tspan x={stationX} className="elevation-aid-distance">
                      {station.distanceKm.toFixed(1)} KM
                    </tspan>
                    <tspan x={stationX} dy="12">
                      {station.name}
                    </tspan>
                  </text>
                </g>
              );
            })}

          {segmentDrawData.map((segment) => {
            return (
              <g key={`${segment.name}-${segment.startKm}-${segment.endKm}`}>
                <rect
                  x={segment.startX}
                  y={chart.margin.top + chart.plotHeight + 54}
                  width={segment.bandWidth}
                  height="8"
                  rx="3"
                  fill={segment.color}
                  fillOpacity="0.22"
                  stroke={segment.color}
                  strokeOpacity="0.65"
                  strokeWidth="1"
                />
                <text
                  x={segment.centerX}
                  y={chart.margin.top + chart.plotHeight + 73}
                  textAnchor="middle"
                  className="elevation-segment-text"
                >
                  <tspan x={segment.centerX}>{segment.name}</tspan>
                  <tspan x={segment.centerX} dy="11" className="elevation-segment-range">
                    {segment.startKm.toFixed(2)}–{segment.endKm.toFixed(2)} km
                  </tspan>
                </text>
              </g>
            );
          })}

          <line x1={chart.margin.left} y1={chart.margin.top + chart.plotHeight} x2={chart.margin.left + chart.plotWidth} y2={chart.margin.top + chart.plotHeight} className="elevation-axis-line" />
          <line x1={chart.margin.left} y1={chart.margin.top} x2={chart.margin.left} y2={chart.margin.top + chart.plotHeight} className="elevation-axis-line" />

          <text x={chart.margin.left + chart.plotWidth / 2} y={chart.height - 8} textAnchor="middle" className="elevation-axis-label">
            Distance (km)
          </text>
          <text
            x="16"
            y={chart.margin.top + chart.plotHeight / 2}
            transform={`rotate(-90 16 ${chart.margin.top + chart.plotHeight / 2})`}
            textAnchor="middle"
            className="elevation-axis-label"
          >
            Elevation (m)
          </text>

          {hover && (
            <g>
              <line x1={hover.x} y1={chart.margin.top} x2={hover.x} y2={chart.margin.top + chart.plotHeight} className="elevation-hover-line" />
              <circle cx={hover.x} cy={hover.y} r="4" className="elevation-hover-dot" />
            </g>
          )}

          <circle cx={chart.margin.left} cy={chart.margin.top + chart.plotHeight} r="4.5" className="elevation-start-dot" />
          <rect x={chart.margin.left + chart.plotWidth - 5} y={chart.margin.top + chart.plotHeight - 5} width="10" height="10" className="elevation-finish-box" />
        </svg>
        {hover && (
          <div className="elevation-chart-tooltip" style={{ left: `${hover.tooltipLeft}px`, top: `${hover.tooltipTop}px` }}>
            <div>{hover.point.distanceKm.toFixed(2)} km</div>
            <div>{Math.round(hover.point.elevationM)} m</div>
          </div>
        )}
      </div>
    </div>
  );
}
