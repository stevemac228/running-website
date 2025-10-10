// return badge class based on terrain value, if none return badge
export function getTerrainBadgeClass(terrain) {
  if (!terrain) return "badge";
  const map = {
    road: "badge badge-road",
    trail: "badge badge-trail",
    track: "badge badge-track",
    gravel: "badge badge-gravel",
  };
  return map[terrain.toLowerCase()] || "badge";
}

// return badge class based on format value, if none return default
export function getFormatBadgeClass(format) {
  if (!format) return "badge";
  const map = {
    competitive: "badge badge-competitive",
    fun: "badge badge-funrun",
  };
  return map[format.toLowerCase()] || "badge";
}