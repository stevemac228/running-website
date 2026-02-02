// Category search utility for matching search terms to race categories
// This allows searching for "marathon", "trail", "5k", etc. to match by distance, terrain, or format

// Distance category mappings (search term -> numeric distance in km)
// Order matters: longer/more specific patterns first to avoid false matches
const DISTANCE_CATEGORIES = [
  // Half marathon variations (check before "marathon" to avoid false matches)
  { keywords: ["half marathon", "halfmarathon", "half"], distance: 21.1 },
  { keywords: ["21.1km", "21.1k", "21km", "21k"], distance: 21.1 },
  // Full marathon variations
  { keywords: ["full marathon", "fullmarathon", "marathon"], distance: 42.2 },
  { keywords: ["42.2km", "42.2k", "42km", "42k"], distance: 42.2 },
  // 10k variations (check before 5k to handle "10k" vs "5k" correctly)
  { keywords: ["10km", "10k", "10 km", "10 k"], distance: 10 },
  // 5k variations
  { keywords: ["5km", "5k", "5 km", "5 k"], distance: 5 },
];

// Ultra marathon keywords (any distance > 42.2km)
const ULTRA_KEYWORDS = ["ultra", "ultramarathon", "ultra marathon"];

// Terrain category mappings
const TERRAIN_CATEGORIES = {
  trail: "Trail",
  trails: "Trail",
  road: "Road",
  roads: "Road",
  gravel: "Gravel",
  track: "Track",
};

// Format category mappings
const FORMAT_CATEGORIES = {
  "fun run": "Fun",
  funrun: "Fun",
  competitive: "Competitive",
};

/**
 * Helper to get race distance as a number
 */
function getRaceDistance(race) {
  return typeof race.distance === "number" ? race.distance : parseFloat(race.distance);
}

/**
 * Check if a search term matches a keyword using word boundaries
 * @param {string} term - The search term (already lowercase and trimmed)
 * @param {string} keyword - The keyword to match
 * @returns {boolean}
 */
function matchesKeyword(term, keyword) {
  // Exact match
  if (term === keyword) return true;
  
  // Check if keyword appears as a complete word/phrase in the term
  // Use word boundary regex to avoid partial matches like "10k" matching "100k"
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}($|\\s)`, 'i');
  return regex.test(term);
}

/**
 * Check if a race matches a search term by category (distance, terrain, format)
 * @param {Object} race - The race object
 * @param {string} searchTerm - The search term (lowercase)
 * @returns {boolean} - Whether the race matches the category
 */
export function matchesCategorySearch(race, searchTerm) {
  if (!searchTerm || !race) return false;
  
  const term = searchTerm.toLowerCase().trim();
  if (term === "") return false;

  // Check distance categories
  for (const { keywords, distance } of DISTANCE_CATEGORIES) {
    for (const keyword of keywords) {
      if (matchesKeyword(term, keyword)) {
        const raceDistance = getRaceDistance(race);
        // Match if race distance is within 0.5km of the category
        if (Math.abs(raceDistance - distance) < 0.5) {
          return true;
        }
      }
    }
  }

  // Check ultra keywords
  for (const keyword of ULTRA_KEYWORDS) {
    if (matchesKeyword(term, keyword)) {
      const raceDistance = getRaceDistance(race);
      if (raceDistance > 42.2) {
        return true;
      }
    }
  }

  // Check terrain categories
  for (const [keyword, terrainValue] of Object.entries(TERRAIN_CATEGORIES)) {
    if (matchesKeyword(term, keyword)) {
      if (race.terrain === terrainValue) {
        return true;
      }
    }
  }

  // Check format categories
  for (const [keyword, formatValue] of Object.entries(FORMAT_CATEGORIES)) {
    if (matchesKeyword(term, keyword)) {
      if (race.format === formatValue) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get a stable identifier for a race
 * @param {Object} race - The race object
 * @param {number} fallbackIndex - Fallback index to use if no ID
 * @returns {string|number} - A stable identifier
 */
function getRaceIdentifier(race, fallbackIndex) {
  // Prefer the race ID if available
  if (race.id !== undefined && race.id !== null) return race.id;
  // Use name + date as a fallback identifier since these should be unique
  if (race.name && race.date) return `${race.name}-${race.date}`;
  // Last resort: use the fallback index
  return `idx-${fallbackIndex}`;
}

/**
 * Filter races by combining fuzzy name/location search with category matching
 * @param {Array} races - Array of race objects
 * @param {string} searchTerm - The search term
 * @param {Object} fuseInstance - Optional Fuse.js instance for fuzzy search
 * @returns {Array} - Filtered races
 */
export function filterRacesBySearch(races, searchTerm, fuseInstance = null) {
  if (!searchTerm || searchTerm.trim() === "") return races;
  
  const term = searchTerm.toLowerCase().trim();
  
  // Build a map of race identifier -> race for stable lookups
  const raceMap = new Map();
  races.forEach((race, index) => {
    raceMap.set(getRaceIdentifier(race, index), race);
  });
  
  // Get races that match by category
  const categoryMatchIds = new Set();
  races.forEach((race, index) => {
    if (matchesCategorySearch(race, term)) {
      categoryMatchIds.add(getRaceIdentifier(race, index));
    }
  });

  // Get races that match by name/location using Fuse.js or simple search
  let nameMatches = [];
  if (fuseInstance) {
    try {
      const fuseResults = fuseInstance.search(searchTerm, { limit: 1000 });
      nameMatches = fuseResults.map(r => r.item);
    } catch (err) {
      // Fallback to simple contains
      nameMatches = races.filter(r =>
        `${r.name || ""} ${r.nickName || ""} ${r.location || ""}`.toLowerCase().includes(term)
      );
    }
  } else {
    // Simple contains search
    nameMatches = races.filter(r =>
      `${r.name || ""} ${r.nickName || ""} ${r.location || ""}`.toLowerCase().includes(term)
    );
  }

  // Track which races are already in name matches
  const nameMatchIds = new Set();
  nameMatches.forEach((race, index) => {
    // For Fuse results, we need to find the original index
    const originalIndex = races.findIndex(r => r === race || 
      (r.id !== undefined && r.id === race.id) ||
      (r.name === race.name && r.date === race.date));
    nameMatchIds.add(getRaceIdentifier(race, originalIndex >= 0 ? originalIndex : index));
  });
  
  // Get category matches that weren't already in name matches
  const additionalCategoryMatches = races.filter((race, index) => {
    const raceId = getRaceIdentifier(race, index);
    return categoryMatchIds.has(raceId) && !nameMatchIds.has(raceId);
  });

  return [...nameMatches, ...additionalCategoryMatches];
}
