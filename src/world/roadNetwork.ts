import { CITY_BUILDINGS } from './neighborhoodBuilder';

export interface RoadSegment {
  id: string;
  name: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
  axis: 'NS' | 'EW';
}

/**
 * Authoritative road network extracted directly from neighborhoodBuilder.ts
 */
export const ROAD_SEGMENTS: RoadSegment[] = [
  // Primary Arterial & Commercial Streets
  { id: 'main-arterial', name: 'Grand Arterial Road', x1: 0, z1: -36, x2: 0, z2: 36, width: 5.4, axis: 'NS' },
  { id: 'sec-commercial', name: 'Bazaar Commercial Street', x1: -36, z1: 0, x2: 36, z2: 0, width: 4.8, axis: 'EW' },

  // Connected Residential Lanes
  { id: 'lane-1', name: 'North Temple Lane', x1: -34, z1: -14, x2: 34, z2: -14, width: 2.6, axis: 'EW' },
  { id: 'lane-2', name: 'West Bazaar Lane', x1: -14, z1: -34, x2: -14, z2: 34, width: 2.4, axis: 'NS' },
  { id: 'lane-3', name: 'South Market Lane', x1: -34, z1: 13.5, x2: 34, z2: 13.5, width: 2.5, axis: 'EW' },
  { id: 'lane-4', name: 'East Residential Alley', x1: 14, z1: -34, x2: 14, z2: 34, width: 2.4, axis: 'NS' },

  // Outer Perimeter Streets
  { id: 'outer-n', name: 'North Outer Street', x1: -34, z1: -24.5, x2: 34, z2: -24.5, width: 2.8, axis: 'EW' },
  { id: 'outer-s', name: 'South Outer Street', x1: -34, z1: 24.5, x2: 34, z2: 24.5, width: 2.8, axis: 'EW' },
  { id: 'outer-w', name: 'West Outer Street', x1: -26.5, z1: -34, x2: -26.5, z2: 34, width: 2.6, axis: 'NS' },
  { id: 'outer-e', name: 'East Outer Street', x1: 26.5, z1: -34, x2: 26.5, z2: 34, width: 2.6, axis: 'NS' },

  // Pedestrian By-lanes / Urban Alleys
  { id: 'by-lane-nw', name: 'Northwest Temple By-lane', x1: -7.0, z1: -24.5, x2: -7.0, z2: -14, width: 1.8, axis: 'NS' },
  { id: 'by-lane-ne', name: 'Northeast Temple By-lane', x1: 7.0, z1: -24.5, x2: 7.0, z2: -14, width: 1.8, axis: 'NS' },
  { id: 'by-lane-sw', name: 'Southwest Market By-lane', x1: -7.0, z1: 13.5, x2: -7.0, z2: 24.5, width: 1.8, axis: 'NS' },
  { id: 'by-lane-se', name: 'Southeast Market By-lane', x1: 7.0, z1: 13.5, x2: 7.0, z2: 24.5, width: 1.8, axis: 'NS' },
  { id: 'by-lane-wn', name: 'West-North By-lane', x1: -26.5, z1: -7.0, x2: -14, z2: -7.0, width: 1.8, axis: 'EW' },
  { id: 'by-lane-ws', name: 'West-South By-lane', x1: -26.5, z1: 7.0, x2: -14, z2: 7.0, width: 1.8, axis: 'EW' },
  { id: 'by-lane-en', name: 'East-North By-lane', x1: 14, z1: -7.0, x2: 26.5, z2: -7.0, width: 1.8, axis: 'EW' },
  { id: 'by-lane-es', name: 'East-South By-lane', x1: 14, z1: 7.0, x2: 26.5, z2: 7.0, width: 1.8, axis: 'EW' }
];

export interface ExclusionBox {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Geometric zebra crosswalk exclusion zones (including pedestrian curb landings)
 */
export const CROSSWALK_EXCLUSIONS: ExclusionBox[] = [
  // Main Junction Crosswalks (buffered)
  { id: 'cw-main-s', name: 'South Arterial Crosswalk', minX: -3.6, maxX: 3.6, minZ: 1.0, maxZ: 5.8 },
  { id: 'cw-main-n', name: 'North Arterial Crosswalk', minX: -3.6, maxX: 3.6, minZ: -5.8, maxZ: -1.0 },
  { id: 'cw-main-e', name: 'East Commercial Crosswalk', minX: 1.0, maxX: 5.8, minZ: -3.2, maxZ: 3.2 },
  { id: 'cw-main-w', name: 'West Commercial Crosswalk', minX: -5.8, maxX: -1.0, minZ: -3.2, maxZ: 3.2 },
  // Secondary Crosswalks on Grand Arterial
  { id: 'cw-sec-n', name: 'North Temple Lane Crosswalk', minX: -3.2, maxX: 3.2, minZ: -14.4, maxZ: -9.6 },
  { id: 'cw-sec-s', name: 'South Market Lane Crosswalk', minX: -3.2, maxX: 3.2, minZ: 9.1, maxZ: 13.9 }
];

/**
 * Programmatically builds exclusion boxes for all road intersections and crossings
 */
export function buildIntersectionExclusions(): ExclusionBox[] {
  const boxes: ExclusionBox[] = [];
  for (let i = 0; i < ROAD_SEGMENTS.length; i++) {
    const s1 = ROAD_SEGMENTS[i];
    for (let j = i + 1; j < ROAD_SEGMENTS.length; j++) {
      const s2 = ROAD_SEGMENTS[j];
      if (s1.axis !== s2.axis) {
        const ns = s1.axis === 'NS' ? s1 : s2;
        const ew = s1.axis === 'EW' ? s1 : s2;
        const cx = ns.x1;
        const cz = ew.z1;
        const nsMinZ = Math.min(ns.z1, ns.z2) - 0.2;
        const nsMaxZ = Math.max(ns.z1, ns.z2) + 0.2;
        const ewMinX = Math.min(ew.x1, ew.x2) - 0.2;
        const ewMaxX = Math.max(ew.x1, ew.x2) + 0.2;
        if (cz >= nsMinZ && cz <= nsMaxZ && cx >= ewMinX && cx <= ewMaxX) {
          const hx = ns.width / 2 + 0.5;
          const hz = ew.width / 2 + 0.5;
          boxes.push({
            id: `int-${ns.id}-${ew.id}`,
            name: `${ns.name} & ${ew.name}`,
            minX: cx - hx,
            maxX: cx + hx,
            minZ: cz - hz,
            maxZ: cz + hz
          });
        }
      }
    }
  }
  return boxes;
}

export const INTERSECTION_EXCLUSIONS = buildIntersectionExclusions();

export interface RoadProximityResult {
  segment: RoadSegment;
  closestPointOnRoad: { x: number; z: number };
  distanceToCenter: number;
  distanceToEdge: number;
  isValidRoadside: boolean;
  snappedRoadsidePoint: { x: number; z: number };
  facingVector: { x: number; z: number };
  facingAngle: number; // in radians: rotation.y for 3D stall group so front faces road
}

/**
 * Checks if a 2D world point is inside any building footprint
 */
export function isInsideBuilding(x: number, z: number, padding: number = 0.2): boolean {
  for (const b of CITY_BUILDINGS) {
    const halfW = b.w / 2 + padding;
    const halfD = b.d / 2 + padding;
    if (x >= b.x - halfW && x <= b.x + halfW && z >= b.z - halfD && z <= b.z + halfD) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a 2D world point is inside any road carriageway or driving lane
 */
export function isInAnyCarriageway(x: number, z: number, margin: number = 0.05): boolean {
  for (const seg of ROAD_SEGMENTS) {
    const vx = seg.x2 - seg.x1;
    const vz = seg.z2 - seg.z1;
    const lenSq = vx * vx + vz * vz;
    if (lenSq === 0) continue;
    const t = Math.max(0, Math.min(1, ((x - seg.x1) * vx + (z - seg.z1) * vz) / lenSq));
    const cx = seg.x1 + t * vx;
    const cz = seg.z1 + t * vz;
    const dist = Math.hypot(x - cx, z - cz);
    if (dist <= seg.width / 2 + margin) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a 2D world point is inside any zebra crosswalk or pedestrian curb landing
 */
export function isInsideCrosswalk(x: number, z: number, padding: number = 0): boolean {
  for (const cw of CROSSWALK_EXCLUSIONS) {
    if (
      x >= cw.minX - padding &&
      x <= cw.maxX + padding &&
      z >= cw.minZ - padding &&
      z <= cw.maxZ + padding
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a 2D world point is inside any road intersection / junction
 */
export function isInsideIntersection(x: number, z: number, padding: number = 0): boolean {
  for (const box of INTERSECTION_EXCLUSIONS) {
    if (
      x >= box.minX - padding &&
      x <= box.maxX + padding &&
      z >= box.minZ - padding &&
      z <= box.maxZ + padding
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Master check for valid food spot placement:
 * Never occupies road carriageway, driving lane, crosswalk, intersection, or building footprint.
 */
export function isValidRoadsidePosition(x: number, z: number): boolean {
  if (Math.abs(x) > 35 || Math.abs(z) > 35) return false;
  if (isInAnyCarriageway(x, z, 0.05)) return false;
  if (isInsideCrosswalk(x, z, 0.1)) return false;
  if (isInsideIntersection(x, z, 0.1)) return false;
  if (isInsideBuilding(x, z, 0.15)) return false;
  return true;
}

/**
 * Finds the nearest road segment to any world coordinate (x, z),
 * offsets outward from carriageway onto the sidewalk curb edge,
 * protects crosswalks and intersections with automated sliding search,
 * and calculates the facing direction toward the road.
 */
export function findNearestRoad(x: number, z: number): RoadProximityResult | null {
  // Bound check within city limits
  if (Math.abs(x) > 35 || Math.abs(z) > 35) {
    return null;
  }

  let bestResult: RoadProximityResult | null = null;
  let minEdgeDist = Infinity;

  for (const seg of ROAD_SEGMENTS) {
    const vx = seg.x2 - seg.x1;
    const vz = seg.z2 - seg.z1;
    const segLen = Math.hypot(vx, vz);
    if (segLen === 0) continue;

    // Project point onto line segment
    const t = Math.max(0, Math.min(1, ((x - seg.x1) * vx + (z - seg.z1) * vz) / (segLen * segLen)));
    let cx = seg.x1 + t * vx;
    let cz = seg.z1 + t * vz;

    const dx = x - cx;
    const dz = z - cz;
    const distToCenter = Math.hypot(dx, dz);
    const halfWidth = seg.width / 2;
    const distToEdge = distToCenter - halfWidth;

    if (distToEdge < minEdgeDist) {
      minEdgeDist = distToEdge;

      // Calculate unit normal pointing outward from road center to point
      let nx = 0;
      let nz = 0;
      if (distToCenter > 1e-4) {
        nx = dx / distToCenter;
        nz = dz / distToCenter;
      } else {
        // Exactly on centerline: pick standard perpendicular
        if (seg.axis === 'NS') {
          nx = x <= 0 ? -1 : 1;
          nz = 0;
        } else {
          nx = 0;
          nz = z <= 0 ? -1 : 1;
        }
      }

      // Snapped roadside curb distance: offset outward onto the sidewalk / pedestrian edge
      // Spatial hierarchy: Building -> Sidewalk -> Food Spot -> Road
      const snapOffset = halfWidth + 0.65;
      let sx = cx + nx * snapOffset;
      let sz = cz + nz * snapOffset;

      // Check if candidate roadside position is valid
      let valid = isValidRoadsidePosition(sx, sz);

      // If in an exclusion zone (crosswalk, intersection, carriageway, building):
      // Search and slide along the road curb line to find the nearest valid roadside position
      if (!valid) {
        const searchDeltas: number[] = [];
        for (let step = 0.25; step <= 8.0; step += 0.25) {
          searchDeltas.push(step, -step);
        }

        let foundCandidate = false;
        // 1. Try along current curb side
        for (const delta of searchDeltas) {
          const testT = Math.max(0, Math.min(1, t + delta / segLen));
          const testCx = seg.x1 + testT * vx;
          const testCz = seg.z1 + testT * vz;
          const testSx = testCx + nx * snapOffset;
          const testSz = testCz + nz * snapOffset;

          if (isValidRoadsidePosition(testSx, testSz)) {
            cx = testCx;
            cz = testCz;
            sx = testSx;
            sz = testSz;
            valid = true;
            foundCandidate = true;
            break;
          }
        }

        // 2. If still not valid, try along opposite curb side
        if (!foundCandidate) {
          const oppNx = -nx;
          const oppNz = -nz;
          for (const delta of [0, ...searchDeltas]) {
            const testT = Math.max(0, Math.min(1, t + delta / segLen));
            const testCx = seg.x1 + testT * vx;
            const testCz = seg.z1 + testT * vz;
            const testSx = testCx + oppNx * snapOffset;
            const testSz = testCz + oppNz * snapOffset;

            if (isValidRoadsidePosition(testSx, testSz)) {
              cx = testCx;
              cz = testCz;
              nx = oppNx;
              nz = oppNz;
              sx = testSx;
              sz = testSz;
              valid = true;
              break;
            }
          }
        }
      }

      // Facing vector: pointing from the stall position (sx, sz) looking back toward the road centerline (cx, cz)
      const fx = cx - sx;
      const fz = cz - sz;
      const fDist = Math.hypot(fx, fz) || 1;
      const nfx = fx / fDist;
      const nfz = fz / fDist;
      const facingAngle = Math.atan2(nfx, nfz);

      // Spot is valid roadside if it's within reach of the road (<= 3.5m) and passes position validity
      const isValidRoadside = valid && distToEdge <= 3.5;

      bestResult = {
        segment: seg,
        closestPointOnRoad: { x: Number(cx.toFixed(4)), z: Number(cz.toFixed(4)) },
        distanceToCenter: distToCenter,
        distanceToEdge: distToEdge,
        isValidRoadside,
        snappedRoadsidePoint: { x: Number(sx.toFixed(4)), z: Number(sz.toFixed(4)) },
        facingVector: { x: Number(nfx.toFixed(4)), z: Number(nfz.toFixed(4)) },
        facingAngle
      };
    }
  }

  return bestResult;
}

/**
 * Calculates the orientation angle (in radians) for an open-space food spot at (x, z)
 * so that its front counter faces the nearest road.
 */
export function getRoadFacingOrientation(x: number, z: number): { angle: number; roadName: string } {
  const road = findNearestRoad(x, z);
  if (road) {
    return {
      angle: road.facingAngle,
      roadName: road.segment.name
    };
  }
  return { angle: 0, roadName: 'Street' };
}
