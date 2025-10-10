const TERRAIN_MAP = {
  road: "badge badge-road",
  trail: "badge badge-trail",
  track: "badge badge-track",
  gravel: "badge badge-gravel",
};

const FORMAT_MAP = {
  competitive: "badge badge-competitive",
  fun: "badge badge-funrun",
};

export function getTerrainBadgeClass(terrain) {
  if (!terrain) return "badge";
  const key = String(terrain).trim().toLowerCase();
  return TERRAIN_MAP[key] || "badge";
}

export function getFormatBadgeClass(format) {
  if (!format) return "badge";
  const key = String(format).trim().toLowerCase();
  return FORMAT_MAP[key] || "badge";
}