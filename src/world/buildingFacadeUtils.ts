import * as THREE from 'three';
import { BuildingDef, getBuildingById } from './neighborhoodBuilder';
import { findNearestRoad } from './roadNetwork';

export interface BuildingFacadeInfo {
  building: BuildingDef;
  facadeSide: 'north' | 'south' | 'east' | 'west';
  wallCenter: { x: number; y: number; z: number };
  outwardNormal: { x: number; z: number };
  tangentVector: { x: number; z: number };
  facadeLength: number;
  rotationY: number;
  nearestRoadName: string;
}

/**
 * Rotates a 2D vector in the XZ horizontal plane around the Y axis by angle in radians.
 * Matches Three.js Object3D rotation around Y:
 * x' = x * cos(angle) + z * sin(angle)
 * z' = -x * sin(angle) + z * cos(angle)
 */
export function rotateVectorY(x: number, z: number, angle: number): { x: number; z: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos + z * sin,
    z: -x * sin + z * cos
  };
}

/**
 * Determines which of the 4 building walls faces the nearest road.
 * Supports:
 * - North, South, East, West facades
 * - Buildings with arbitrary world rotation (without rotating the building itself)
 * - Computing exterior coordinates, outward normal, tangent vector, and orientation angle.
 * 
 * The storefront FRONT (local +Z) is oriented to point outward along outwardNormal toward the road.
 */
export function getBuildingRoadFacingFacade(building: BuildingDef): BuildingFacadeInfo {
  const bRot = (building as any).rotationY ?? (building as any).rotY ?? (building as any).rotation ?? 0;

  const walls = [
    { side: 'south' as const, lcx: 0, lcz: building.d / 2, lnx: 0, lnz: 1, len: building.w },
    { side: 'north' as const, lcx: 0, lcz: -building.d / 2, lnx: 0, lnz: -1, len: building.w },
    { side: 'east' as const, lcx: building.w / 2, lcz: 0, lnx: 1, lnz: 0, len: building.d },
    { side: 'west' as const, lcx: -building.w / 2, lcz: 0, lnx: -1, lnz: 0, len: building.d },
  ];

  const road = findNearestRoad(building.x, building.z);

  let bestScore = -Infinity;
  let chosen = walls[0];
  let chosenWorldCenter = { x: building.x, y: 0, z: building.z };
  let chosenWorldNormal = { x: 0, z: 1 };

  for (const wall of walls) {
    const rc = rotateVectorY(wall.lcx, wall.lcz, bRot);
    const wc = {
      x: building.x + rc.x,
      y: 0,
      z: building.z + rc.z
    };
    const wn = rotateVectorY(wall.lnx, wall.lnz, bRot);

    // Vector from wall center to closest point on the nearest road
    let toRoadX = 0;
    let toRoadZ = 0;
    if (road) {
      const vx = road.segment.x2 - road.segment.x1;
      const vz = road.segment.z2 - road.segment.z1;
      const lenSq = vx * vx + vz * vz;
      if (lenSq > 0) {
        const t = Math.max(0, Math.min(1, ((wc.x - road.segment.x1) * vx + (wc.z - road.segment.z1) * vz) / lenSq));
        const rx = road.segment.x1 + t * vx;
        const rz = road.segment.z1 + t * vz;
        toRoadX = rx - wc.x;
        toRoadZ = rz - wc.z;
      } else {
        toRoadX = road.closestPointOnRoad.x - wc.x;
        toRoadZ = road.closestPointOnRoad.z - wc.z;
      }
    } else {
      toRoadX = -building.x;
      toRoadZ = -building.z;
    }

    const dist = Math.hypot(toRoadX, toRoadZ);
    const dirX = dist > 1e-4 ? toRoadX / dist : wn.x;
    const dirZ = dist > 1e-4 ? toRoadZ / dist : wn.z;

    // Dot product between outward normal and direction to road
    const dot = wn.x * dirX + wn.z * dirZ;
    // Score prioritizes facing the road (dot > 0) and proximity
    const score = dot / Math.max(dist, 0.5);

    if (score > bestScore) {
      bestScore = score;
      chosen = wall;
      chosenWorldCenter = wc;
      chosenWorldNormal = wn;
    }
  }

  // Derive cue rotation directly from outward normal of road-facing facade
  // In Three.js, local +Z transforms to (sin(rotY), cos(rotY))
  // Therefore, rotY = atan2(normal.x, normal.z) points storefront front outward along normal
  const rotationY = Math.atan2(chosenWorldNormal.x, chosenWorldNormal.z);

  // Tangent vector along the wall: 90 deg rotated from outward normal
  const tangentVector = {
    x: -chosenWorldNormal.z,
    z: chosenWorldNormal.x
  };

  return {
    building,
    facadeSide: chosen.side,
    wallCenter: chosenWorldCenter,
    outwardNormal: chosenWorldNormal,
    tangentVector,
    facadeLength: chosen.len,
    rotationY,
    nearestRoadName: road ? road.segment.name : 'Street'
  };
}

/**
 * Calculates slot offset along the facade wall for multiple food spots attached to the same building.
 * Ensures non-overlapping, balanced spacing.
 */
export function getSlotOffsetOnFacade(spotIndex: number, totalSpots: number, facadeLength: number): number {
  if (totalSpots <= 1) return 0;
  const usableSpan = Math.max(0.8, facadeLength - 1.2);
  const step = Math.min(1.4, usableSpan / Math.max(1, totalSpots - 1));
  const start = -((totalSpots - 1) * step) / 2;
  return start + spotIndex * step;
}

/**
 * Computes world transform (position & rotation) for a building food-presence facade cue.
 */
export function getFacadeCueWorldTransform(
  buildingId: string,
  spotIndex: number = 0,
  totalSpots: number = 1
): { position: THREE.Vector3; rotationY: number; facadeInfo: BuildingFacadeInfo } | null {
  const building = getBuildingById(buildingId);
  if (!building) return null;

  const facade = getBuildingRoadFacingFacade(building);
  const offset = getSlotOffsetOnFacade(spotIndex, totalSpots, facade.facadeLength);

  const posX = facade.wallCenter.x + facade.tangentVector.x * offset + facade.outwardNormal.x * 0.04;
  const posY = 0;
  const posZ = facade.wallCenter.z + facade.tangentVector.z * offset + facade.outwardNormal.z * 0.04;

  return {
    position: new THREE.Vector3(posX, posY, posZ),
    rotationY: facade.rotationY,
    facadeInfo: facade
  };
}
