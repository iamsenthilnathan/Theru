import { FoodSpot } from '../types/foodSpot';

/**
 * Geographic Reference and Coordinate Abstraction for Theru.
 *
 * Theru's source of truth for all food locations is geographic (latitude/longitude).
 * This service abstracts the conversion between geographic coordinates and the
 * local 3D presentation layer, and provides geospatial distance and duplicate detection.
 */

// Reference Anchor: Mylapore, Chennai, Tamil Nadu, India
export const ANCHOR_LAT = 13.0336;
export const ANCHOR_LNG = 80.2676;

// Local spatial scale: 1 Three.js world unit = 2.0 real meters
export const METERS_PER_WORLD_UNIT = 2.0;

// Default proximity detection radius in meters
export const DEFAULT_DUPLICATE_RADIUS_METERS = 45.0;

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface DuplicateAssessment {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  canCreate: boolean;
  matchedSpot?: FoodSpot;
  distanceMeters?: number;
  similarityScore?: number;
  nearbySpots: Array<{
    spot: FoodSpot;
    distanceMeters: number;
    similarityScore: number;
  }>;
  message: string;
}

const METERS_PER_DEG_LAT = 111000.0;
const METERS_PER_DEG_LNG = 111000.0 * Math.cos((ANCHOR_LAT * Math.PI) / 180.0);

/**
 * Convert local 3D world coordinates [x, y, z] to geographic (latitude, longitude)
 */
export function worldToLatLng(x: number, z: number): GeoLocation {
  // In our isometric world:
  // -z points North, +x points East
  const metersNorth = -z * METERS_PER_WORLD_UNIT;
  const metersEast = x * METERS_PER_WORLD_UNIT;

  const dLat = metersNorth / METERS_PER_DEG_LAT;
  const dLng = metersEast / METERS_PER_DEG_LNG;

  return {
    latitude: ANCHOR_LAT + dLat,
    longitude: ANCHOR_LNG + dLng
  };
}

/**
 * Convert geographic (latitude, longitude) to local 3D world coordinates [x, 0, z]
 */
export function latLngToWorld(latitude: number, longitude: number): [number, number, number] {
  const dLat = latitude - ANCHOR_LAT;
  const dLng = longitude - ANCHOR_LNG;

  const metersNorth = dLat * METERS_PER_DEG_LAT;
  const metersEast = dLng * METERS_PER_DEG_LNG;

  const x = metersEast / METERS_PER_WORLD_UNIT;
  const z = -metersNorth / METERS_PER_WORLD_UNIT;

  return [x, 0, z];
}

/**
 * Calculate accurate surface distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Normalize place names for robust text comparison
 * (Lowercases, strips punctuation/apostrophes, collapses spaces, normalizes Tamil/English patterns)
 */
export function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’`]/g, '') // Remove apostrophes (e.g. Mani's -> Manis)
    .replace(/[^a-z0-9\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

const GENERIC_FOOD_WORDS = new Set([
  'kadai',
  'stall',
  'shop',
  'mess',
  'tea',
  'hotel',
  'bhavan',
  'point',
  'corner',
  'centre',
  'center',
  'tiffin',
  'foods',
  'fast',
  'food',
  'junction',
  'restaurant'
]);

/**
 * Calculate text similarity score between two place names (0.0 to 1.0)
 * Combines token overlap (Jaccard), normalized Levenshtein edit distance, and substring matching.
 */
export function calculateNameSimilarity(nameA: string, nameB: string): number {
  const normA = normalizePlaceName(nameA);
  const normB = normalizePlaceName(nameB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Substring match with high overlap
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    if (minLen / maxLen >= 0.55) {
      return 0.88;
    }
  }

  // Tokenize
  const tokensA = new Set(normA.split(' ').filter(Boolean));
  const tokensB = new Set(normB.split(' ').filter(Boolean));

  let tokenMatchCount = 0;
  let nonGenericMatchCount = 0;
  tokensA.forEach(t => {
    // Exact token match or singular/plural match (e.g. 'mani' vs 'manis')
    for (const tb of tokensB) {
      if (t === tb || (t.length > 3 && (t === tb + 's' || tb === t + 's'))) {
        tokenMatchCount++;
        if (!GENERIC_FOOD_WORDS.has(t) && !GENERIC_FOOD_WORDS.has(tb)) {
          nonGenericMatchCount++;
        }
        break;
      }
    }
  });

  // If no tokens match at all
  if (tokenMatchCount === 0) {
    if (tokensA.size === 1 && tokensB.size === 1) {
      const lev = levenshtein(normA, normB);
      const maxLen = Math.max(normA.length, normB.length);
      const levSim = maxLen > 0 ? 1 - lev / maxLen : 0;
      return levSim >= 0.7 ? levSim : 0;
    }
    return 0;
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  const tokenJaccard = unionSize > 0 ? tokenMatchCount / unionSize : 0;

  // If only generic category words match (e.g. both end in "Kadai" or "Stall"),
  // treat them as distinct independent places
  if (nonGenericMatchCount === 0 && tokenJaccard < 0.6) {
    return 0.15;
  }

  // Levenshtein distance
  const lev = levenshtein(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  const levSim = maxLen > 0 ? 1 - lev / maxLen : 0;

  // Combined score: high weight to token overlap when tokens match
  if (tokenJaccard >= 0.5) {
    return Math.max(tokenJaccard, levSim);
  }

  return levSim * 0.7 + tokenJaccard * 0.3;
}

function levenshtein(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

/**
 * Multi-factor duplicate assessment based on distance, name similarity, and contextual categories.
 */
export function assessDuplicate(
  candidate: { name: string; latitude: number; longitude: number; category?: string; buildingId?: string },
  existingSpots: FoodSpot[],
  radiusMeters: number = DEFAULT_DUPLICATE_RADIUS_METERS
): DuplicateAssessment {
  const candidateName = candidate.name.trim();

  // 1. Find all existing spots within the proximity radius
  const nearbySpotsWithDist = existingSpots
    .map(spot => {
      const dist = calculateDistanceMeters(
        candidate.latitude,
        candidate.longitude,
        spot.latitude,
        spot.longitude
      );
      const similarity = candidateName ? calculateNameSimilarity(candidateName, spot.name) : 0;
      return { spot, distanceMeters: dist, similarityScore: similarity };
    })
    .filter(item => item.distanceMeters <= radiusMeters)
    .sort((a, b) => {
      // Sort primarily by highest similarity, then by nearest distance
      if (b.similarityScore !== a.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      return a.distanceMeters - b.distanceMeters;
    });

  // If no spots within radius
  if (nearbySpotsWithDist.length === 0) {
    return {
      confidence: 'LOW',
      canCreate: true,
      nearbySpots: [],
      message: 'No existing food spots found within the vicinity.'
    };
  }

  // If candidate name has not been entered yet
  if (!candidateName) {
    return {
      confidence: 'LOW',
      canCreate: true,
      nearbySpots: nearbySpotsWithDist,
      message: `${nearbySpotsWithDist.length} place(s) exist within ${radiusMeters}m.`
    };
  }

  const topMatch = nearbySpotsWithDist[0];

  // 2. High Confidence Duplicate
  // - High name similarity (>= 0.62) within radius (e.g. "Mani Pani Puri" vs "Mani's Pani Puri" 32m away)
  // - OR very high similarity (>= 0.85) up to 1.5x radius
  if (topMatch.similarityScore >= 0.62) {
    return {
      confidence: 'HIGH',
      canCreate: false,
      matchedSpot: topMatch.spot,
      distanceMeters: topMatch.distanceMeters,
      similarityScore: topMatch.similarityScore,
      nearbySpots: nearbySpotsWithDist,
      message: 'This place may already exist'
    };
  }

  // If sharing the same building, multiple distinct food spots/counters can coexist
  // unless name similarity is high (>= 0.62)
  if (
    candidate.buildingId &&
    topMatch.spot.buildingId &&
    candidate.buildingId === topMatch.spot.buildingId &&
    topMatch.similarityScore < 0.62
  ) {
    return {
      confidence: 'LOW',
      canCreate: true,
      nearbySpots: nearbySpotsWithDist,
      message: `${nearbySpotsWithDist.length} other place(s) in this building.`
    };
  }

  // 3. Medium Confidence (Potential Match / Uncertain)
  // - Moderate similarity (>= 0.45)
  // - OR close (<= 12m) with some name similarity (>= 0.25) AND matching category
  const isVeryCloseCategoryMatch =
    topMatch.distanceMeters <= 12 &&
    topMatch.similarityScore >= 0.25 &&
    candidate.category &&
    topMatch.spot.category.toLowerCase() === candidate.category.toLowerCase();

  if (topMatch.similarityScore >= 0.45 || isVeryCloseCategoryMatch) {
    return {
      confidence: 'MEDIUM',
      canCreate: true, // Allowed if user explicitly confirms
      matchedSpot: topMatch.spot,
      distanceMeters: topMatch.distanceMeters,
      similarityScore: topMatch.similarityScore,
      nearbySpots: nearbySpotsWithDist,
      message: 'A similar place was found nearby. Please check if this is the same place.'
    };
  }

  // 4. Low Confidence (Independent stalls coexisting)
  // Two different food stalls (e.g. Kumar Kadai vs Murugan Juice) can genuinely sit 15m apart
  return {
    confidence: 'LOW',
    canCreate: true,
    nearbySpots: nearbySpotsWithDist,
    message: `${nearbySpotsWithDist.length} other place(s) nearby on this street.`
  };
}
