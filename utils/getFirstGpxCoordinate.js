import { parseGpxToSegments } from './parseGpx';

/**
 * Fetches GPX file and returns the first coordinate from the track
 * @param {Object} race - Race object with id or gpx property
 * @returns {Promise<{lat: number, lng: number} | null>} First coordinate or null if not found
 */
export async function getFirstGpxCoordinate(race) {
  if (!race) return null;

  const gpxPath = race.gpx ? `/gpx/${race.gpx}` : `/gpx/${race.id}.gpx`;
  
  try {
    const response = await fetch(gpxPath);
    if (!response.ok) return null;
    
    const gpxText = await response.text();
    const segments = parseGpxToSegments(gpxText);
    
    if (segments && segments.length > 0 && segments[0].length > 0) {
      const firstPoint = segments[0][0];
      if (typeof firstPoint.lat === 'number' && typeof firstPoint.lon === 'number') {
        return { lat: firstPoint.lat, lng: firstPoint.lon };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch GPX for race ${race.id}:`, error);
    return null;
  }
}
