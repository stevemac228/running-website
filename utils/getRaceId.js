export function getRaceId(race) {
  // If explicit id exists, use it
  if (race && race.id) return String(race.id);

  // Build base from name and distance to avoid simple duplicates
  const name = String(race?.name ?? "");
  const distance = race?.distance !== undefined && race?.distance !== null ? String(race.distance) : "";

  const base = `${name}${distance ? "-" + distance : ""}`;

  // slugify: lowercase, remove apostrophes, replace non-alnum with dashes, collapse dashes
  return base
    .toLowerCase()
    .replace(/[’'`]/g, "") // remove quotes/apostrophes
    .replace(/[^a-z0-9]+/g, "-") // replace non-alnum with dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/-{2,}/g, "-"); // collapse multiple dashes
}
