import * as THREE from 'three';
import { PALETTE, createTamilShopSignTexture } from './threeUtils';

/**
 * Creates the hierarchical street network, sidewalks, and ground foundation
 */
export function buildStreetsAndGround(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'streets-and-ground';

  // 1. Base city foundation slab (dense 74x74 area)
  const baseGeom = new THREE.BoxGeometry(74, 0.5, 74);
  const baseMat = new THREE.MeshLambertMaterial({ color: PALETTE.ground });
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -0.25;
  group.add(base);

  // Distant city ground apron
  const apronGeom = new THREE.BoxGeometry(92, 0.4, 92);
  const apronMat = new THREE.MeshLambertMaterial({ color: PALETTE.groundFar });
  const apron = new THREE.Mesh(apronGeom, apronMat);
  apron.position.y = -0.3;
  group.add(apron);

  // Materials
  const roadMainMat = new THREE.MeshLambertMaterial({ color: PALETTE.roadAsphalt });
  const roadSecMat = new THREE.MeshLambertMaterial({ color: PALETTE.roadSecondary });
  const laneMat = new THREE.MeshLambertMaterial({ color: PALETTE.cobbleLane });
  const sidewalkMat = new THREE.MeshLambertMaterial({ color: PALETTE.sidewalkTile });
  const curbMat = new THREE.MeshLambertMaterial({ color: PALETTE.curb });
  const crosswalkMat = new THREE.MeshLambertMaterial({ color: PALETTE.crosswalk });
  const gutterMat = new THREE.MeshLambertMaterial({ color: PALETTE.curbGutter });

  // -------------------------------------------------------------
  // ROAD HIERARCHY
  // -------------------------------------------------------------

  // A. Grand Main Arterial Road (North-South along Z-axis)
  // Width: 5.4, Length: 72
  const mainRoadGeom = new THREE.PlaneGeometry(5.4, 72);
  mainRoadGeom.rotateX(-Math.PI / 2);
  const mainRoad = new THREE.Mesh(mainRoadGeom, roadMainMat);
  mainRoad.position.set(0, 0.015, 0);
  group.add(mainRoad);

  // Storm drain gutters along main road edges
  const gutterLeftGeom = new THREE.PlaneGeometry(0.25, 72);
  gutterLeftGeom.rotateX(-Math.PI / 2);
  const gutterL = new THREE.Mesh(gutterLeftGeom, gutterMat);
  gutterL.position.set(-2.7, 0.016, 0);
  const gutterR = new THREE.Mesh(gutterLeftGeom, gutterMat);
  gutterR.position.set(2.7, 0.016, 0);
  group.add(gutterL, gutterR);

  // B. Secondary Commercial Street (East-West along X-axis)
  // Width: 4.8, Length: 72
  const secRoadGeom = new THREE.PlaneGeometry(72, 4.8);
  secRoadGeom.rotateX(-Math.PI / 2);
  const secRoad = new THREE.Mesh(secRoadGeom, roadSecMat);
  secRoad.position.set(0, 0.018, 0);
  group.add(secRoad);

  // C. Connected Residential Lanes (Narrow, cozy, paved)
  // Lane 1: North Temple Lane at z = -14, running x = -34 to 34 (width 2.6)
  const lane1Geom = new THREE.PlaneGeometry(68, 2.6);
  lane1Geom.rotateX(-Math.PI / 2);
  const lane1 = new THREE.Mesh(lane1Geom, laneMat);
  lane1.position.set(0, 0.02, -14);
  group.add(lane1);

  // Lane 2: West Bazaar Lane at x = -14, running z = -34 to 34 (width 2.4)
  const lane2Geom = new THREE.PlaneGeometry(2.4, 68);
  lane2Geom.rotateX(-Math.PI / 2);
  const lane2 = new THREE.Mesh(lane2Geom, laneMat);
  lane2.position.set(-14, 0.021, 0);
  group.add(lane2);

  // Lane 3: South Market Lane at z = 13.5, running x = -34 to 34 (width 2.5)
  const lane3Geom = new THREE.PlaneGeometry(68, 2.5);
  lane3Geom.rotateX(-Math.PI / 2);
  const lane3 = new THREE.Mesh(lane3Geom, laneMat);
  lane3.position.set(0, 0.02, 13.5);
  group.add(lane3);

  // Lane 4: East Residential Alley at x = 14, running z = -34 to 34 (width 2.4)
  const lane4Geom = new THREE.PlaneGeometry(2.4, 68);
  lane4Geom.rotateX(-Math.PI / 2);
  const lane4 = new THREE.Mesh(lane4Geom, laneMat);
  lane4.position.set(14, 0.021, 0);
  group.add(lane4);

  // D. Outer Perimeter Streets (expanding urban depth)
  // Outer North Street at z = -24.5 (width 2.8)
  const outerNGeom = new THREE.PlaneGeometry(68, 2.8);
  outerNGeom.rotateX(-Math.PI / 2);
  const outerN = new THREE.Mesh(outerNGeom, roadSecMat);
  outerN.position.set(0, 0.019, -24.5);
  group.add(outerN);

  // Outer South Street at z = 24.5 (width 2.8)
  const outerSGeom = new THREE.PlaneGeometry(68, 2.8);
  outerSGeom.rotateX(-Math.PI / 2);
  const outerS = new THREE.Mesh(outerSGeom, roadSecMat);
  outerS.position.set(0, 0.019, 24.5);
  group.add(outerS);

  // Outer West Street at x = -26.5 (width 2.6)
  const outerWGeom = new THREE.PlaneGeometry(2.6, 68);
  outerWGeom.rotateX(-Math.PI / 2);
  const outerW = new THREE.Mesh(outerWGeom, roadSecMat);
  outerW.position.set(-26.5, 0.019, 0);
  group.add(outerW);

  // Outer East Street at x = 26.5 (width 2.6)
  const outerEGeom = new THREE.PlaneGeometry(2.6, 68);
  outerEGeom.rotateX(-Math.PI / 2);
  const outerE = new THREE.Mesh(outerEGeom, roadSecMat);
  outerE.position.set(26.5, 0.019, 0);
  group.add(outerE);

  // E. Pedestrian By-lanes / Intermediate Alleys (width 1.8)
  // Subdividing middle and outer blocks into authentic urban parcels
  const byLanes: [number, number, number, number][] = [
    // [x, z, width, length]
    // N-S lanes connecting z=-14 to z=-24.5 (length 10.5, centered at z=-19.25)
    [-7.0, -19.25, 1.8, 10.5],
    [7.0, -19.25, 1.8, 10.5],
    // N-S lanes connecting z=13.5 to z=24.5 (length 11.0, centered at z=19.0)
    [-7.0, 19.0, 1.8, 11.0],
    [7.0, 19.0, 1.8, 11.0],
    // E-W lanes connecting x=-14 to x=-26.5 (length 12.5, centered at x=-20.25)
    [-20.25, -7.0, 12.5, 1.8],
    [-20.25, 7.0, 12.5, 1.8],
    // E-W lanes connecting x=14 to x=26.5 (length 12.5, centered at x=20.25)
    [20.25, -7.0, 12.5, 1.8],
    [20.25, 7.0, 12.5, 1.8]
  ];

  byLanes.forEach(([bx, bz, bw, bl]) => {
    const blGeom = new THREE.PlaneGeometry(bw, bl);
    blGeom.rotateX(-Math.PI / 2);
    const byLane = new THREE.Mesh(blGeom, laneMat);
    byLane.position.set(bx, 0.021, bz);
    group.add(byLane);
  });

  // -------------------------------------------------------------
  // ROAD MARKINGS & CROSSWALKS
  // -------------------------------------------------------------
  const dashWhiteMat = new THREE.MeshBasicMaterial({ color: PALETTE.roadLineWhite });
  const dashYellowMat = new THREE.MeshBasicMaterial({ color: PALETTE.roadLineYellow });

  // Main Road center double dashes
  const dashGeom = new THREE.PlaneGeometry(0.18, 1.4);
  dashGeom.rotateX(-Math.PI / 2);

  for (let z = -34; z <= 34; z += 3.2) {
    if (
      Math.abs(z) > 3.6 &&
      Math.abs(z + 14) > 2.0 &&
      Math.abs(z - 13.5) > 2.0 &&
      Math.abs(z + 24.5) > 2.0 &&
      Math.abs(z - 24.5) > 2.0
    ) {
      const d1 = new THREE.Mesh(dashGeom, dashYellowMat);
      d1.position.set(-0.12, 0.022, z);
      const d2 = new THREE.Mesh(dashGeom, dashYellowMat);
      d2.position.set(0.12, 0.022, z);
      group.add(d1, d2);
    }
  }

  // Secondary road dashed lines
  const dashEWGeom = new THREE.PlaneGeometry(1.4, 0.18);
  dashEWGeom.rotateX(-Math.PI / 2);
  for (let x = -34; x <= 34; x += 3.2) {
    if (
      Math.abs(x) > 3.6 &&
      Math.abs(x + 14) > 2.0 &&
      Math.abs(x - 14) > 2.0 &&
      Math.abs(x + 26.5) > 2.0 &&
      Math.abs(x - 26.5) > 2.0
    ) {
      const d = new THREE.Mesh(dashEWGeom, dashWhiteMat);
      d.position.set(x, 0.022, 0);
      group.add(d);
    }
  }

  // Zebra Crosswalks at Main Junction
  const stripeZGeom = new THREE.PlaneGeometry(0.4, 4.4);
  stripeZGeom.rotateX(-Math.PI / 2);
  for (let i = -4; i <= 4; i++) {
    const s1 = new THREE.Mesh(stripeZGeom, crosswalkMat);
    s1.position.set(i * 0.55, 0.025, -3.4);
    const s2 = new THREE.Mesh(stripeZGeom, crosswalkMat);
    s2.position.set(i * 0.55, 0.025, 3.4);
    group.add(s1, s2);
  }

  const stripeXGeom = new THREE.PlaneGeometry(4.4, 0.4);
  stripeXGeom.rotateX(-Math.PI / 2);
  for (let i = -4; i <= 4; i++) {
    const s1 = new THREE.Mesh(stripeXGeom, crosswalkMat);
    s1.position.set(3.4, 0.025, i * 0.55);
    const s2 = new THREE.Mesh(stripeXGeom, crosswalkMat);
    s2.position.set(-3.4, 0.025, i * 0.55);
    group.add(s1, s2);
  }

  // Crosswalks at Secondary Lane Junctions
  [-14, 13.5].forEach(zPos => {
    for (let i = -3; i <= 3; i++) {
      const s = new THREE.Mesh(stripeZGeom, crosswalkMat);
      s.position.set(i * 0.65, 0.025, zPos + (zPos < 0 ? 2.0 : -2.0));
      group.add(s);
    }
  });

  // Central Junction Heritage Traffic Island
  const islandBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.3, 0.18, 16),
    curbMat
  );
  islandBase.position.set(0, 0.09, 0);
  const islandGrass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.05, 16),
    new THREE.MeshLambertMaterial({ color: PALETTE.lawnGrass })
  );
  islandGrass.position.set(0, 0.2, 0);
  // Center small decorative heritage lamp pillar
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.2, 1.8, 8),
    new THREE.MeshLambertMaterial({ color: 0x4a4d52 })
  );
  pillar.position.set(0, 1.0, 0);
  const pillarLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff3bf })
  );
  pillarLight.position.set(0, 1.95, 0);
  group.add(islandBase, islandGrass, pillar, pillarLight);

  // -------------------------------------------------------------
  // RAISED SIDEWALK BLOCKS (Framing the urban blocks)
  // -------------------------------------------------------------
  const blocks = [
    // Inner blocks near central junction
    { cx: -7.5, cz: -7.0, w: 9.8, d: 8.8 },
    { cx: 7.5, cz: -7.0, w: 9.8, d: 8.8 },
    { cx: -7.5, cz: 6.8, w: 9.8, d: 8.4 },
    { cx: 7.5, cz: 6.8, w: 9.8, d: 8.4 },

    // Middle West blocks (between x=-15.5 and x=-25.0)
    { cx: -20.2, cz: -10.5, w: 9.6, d: 5.0 },
    { cx: -20.2, cz: -3.5, w: 9.6, d: 5.0 },
    { cx: -20.2, cz: 3.5, w: 9.6, d: 5.0 },
    { cx: -20.2, cz: 10.5, w: 9.6, d: 5.0 },

    // Middle East blocks (between x=15.5 and x=25.0)
    { cx: 20.2, cz: -10.5, w: 9.6, d: 5.0 },
    { cx: 20.2, cz: -3.5, w: 9.6, d: 5.0 },
    { cx: 20.2, cz: 3.5, w: 9.6, d: 5.0 },
    { cx: 20.2, cz: 10.5, w: 9.6, d: 5.0 },

    // North blocks (between z=-15.5 and z=-23.0)
    { cx: -10.5, cz: -19.25, w: 5.0, d: 7.5 },
    { cx: -3.5, cz: -19.25, w: 5.0, d: 7.5 },
    { cx: 3.5, cz: -19.25, w: 5.0, d: 7.5 },
    { cx: 10.5, cz: -19.25, w: 5.0, d: 7.5 },
    { cx: -20.2, cz: -19.25, w: 9.6, d: 7.5 },
    { cx: 20.2, cz: -19.25, w: 9.6, d: 7.5 },

    // South blocks (between z=15.0 and z=23.0)
    { cx: -10.5, cz: 19.0, w: 5.0, d: 8.0 },
    { cx: -3.5, cz: 19.0, w: 5.0, d: 8.0 },
    { cx: 3.5, cz: 19.0, w: 5.0, d: 8.0 },
    { cx: 10.5, cz: 19.0, w: 5.0, d: 8.0 },
    { cx: -20.2, cz: 19.0, w: 9.6, d: 8.0 },
    { cx: 20.2, cz: 19.0, w: 9.6, d: 8.0 },

    // Outer perimeter blocks (North, South, West, East borders)
    { cx: -20.2, cz: -29.5, w: 9.6, d: 6.8 },
    { cx: 0.0, cz: -29.5, w: 22.0, d: 6.8 },
    { cx: 20.2, cz: -29.5, w: 9.6, d: 6.8 },

    { cx: -20.2, cz: 29.5, w: 9.6, d: 6.8 },
    { cx: 0.0, cz: 29.5, w: 22.0, d: 6.8 },
    { cx: 20.2, cz: 29.5, w: 9.6, d: 6.8 },

    { cx: -30.5, cz: 0.0, w: 5.2, d: 32.0 },
    { cx: 30.5, cz: 0.0, w: 5.2, d: 32.0 }
  ];

  blocks.forEach(b => {
    // Sidewalk slab
    const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.1, b.d), sidewalkMat);
    slab.position.set(b.cx, 0.05, b.cz);
    group.add(slab);

    // Curbs along the outer borders
    const curbX1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, b.d), curbMat);
    curbX1.position.set(b.cx - b.w / 2 + 0.07, 0.06, b.cz);
    const curbX2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, b.d), curbMat);
    curbX2.position.set(b.cx + b.w / 2 - 0.07, 0.06, b.cz);

    const curbZ1 = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.12, 0.14), curbMat);
    curbZ1.position.set(b.cx, 0.06, b.cz - b.d / 2 + 0.07);
    const curbZ2 = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.12, 0.14), curbMat);
    curbZ2.position.set(b.cx, 0.06, b.cz + b.d / 2 - 0.07);

    group.add(curbX1, curbX2, curbZ1, curbZ2);
  });

  return group;
}

/**
 * Builds dense, varied South Indian city architecture (50+ buildings, landmarks, compound walls)
 */
// Helper to build a South Indian shop-house or apartment
export interface BuildingDef {
  id: string;
  name?: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  type: 'shop-house' | 'row-house' | 'apartment' | 'commercial';
  wallColor: number;
  shutterColor?: number;
  awningColor?: number;
  roofType: 'terrace' | 'mangalore' | 'parapet';
  roofColor?: number;
  hasBalcony?: boolean;
  tamilSign?: { tamil: string; eng: string; bg: string };
  rotationY?: number;
}

const RAW_BUILDINGS: Omit<BuildingDef, 'id'>[] = [
    // -------------------------------------------------------------
    // ZONE 1: NW INNER COMMERCIAL CORE (Surrounding Kumar Kadai at -10, -4)
    // -------------------------------------------------------------
    { x: -4.8, z: -4.8, w: 3.2, h: 4.8, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[0], shutterColor: PALETTE.shutterBlue, awningColor: PALETTE.shutterBlue, roofType: 'mangalore', roofColor: PALETTE.roofSlateGray, hasBalcony: true, tamilSign: { tamil: 'அமுதா மெஸ்', eng: 'Amudha Mess', bg: '#2b5c8f' } },
    { x: -4.8, z: -8.4, w: 3.2, h: 6.2, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[1], roofType: 'parapet', hasBalcony: true },
    { x: -4.8, z: -11.8, w: 3.2, h: 4.2, d: 2.8, type: 'shop-house', wallColor: PALETTE.walls[4], shutterColor: PALETTE.shutterGreen, roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore, tamilSign: { tamil: 'ஸ்ரீராம் ஜூவல்லர்ஸ்', eng: 'Sriram Jewellers', bg: '#862e9c' } },
    { x: -8.6, z: -8.4, w: 3.2, h: 4.0, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[7], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    { x: -8.6, z: -11.8, w: 3.4, h: 5.2, d: 2.8, type: 'commercial', wallColor: PALETTE.walls[2], roofType: 'terrace', tamilSign: { tamil: 'கிருஷ்ணா ஸ்டோர்ஸ்', eng: 'Krishna Stores', bg: '#2e6f40' } },
    { x: -12.2, z: -8.4, w: 2.8, h: 4.5, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },
    { x: -12.2, z: -11.8, w: 2.8, h: 5.8, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[5], roofType: 'parapet', hasBalcony: true },

    // -------------------------------------------------------------
    // ZONE 2: NE INNER COMMERCIAL CORE (Surrounding Selvi Tea at 6, -5)
    // -------------------------------------------------------------
    { x: 4.8, z: -8.4, w: 3.2, h: 5.5, d: 3.0, type: 'shop-house', wallColor: PALETTE.walls[3], shutterColor: PALETTE.shutterYellow, awningColor: PALETTE.shutterGreen, roofType: 'mangalore', roofColor: PALETTE.roofMediumGray, tamilSign: { tamil: 'ராஜா பேக்கரி', eng: 'Raja Bakery', bg: '#862e9c' } },
    { x: 4.8, z: -11.8, w: 3.2, h: 4.6, d: 2.8, type: 'shop-house', wallColor: PALETTE.walls[6], shutterColor: PALETTE.shutterBlue, roofType: 'terrace', tamilSign: { tamil: 'கண்ணன் டிபன் சென்டர்', eng: 'Kannan Tiffin Centre', bg: '#b23b2b' } },
    { x: 8.6, z: -8.4, w: 3.4, h: 6.8, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[2], roofType: 'parapet', hasBalcony: true },
    { x: 8.6, z: -11.8, w: 3.4, h: 3.8, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[0], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    { x: 12.2, z: -4.8, w: 2.8, h: 5.0, d: 3.0, type: 'commercial', wallColor: PALETTE.walls[5], roofType: 'terrace' },
    { x: 12.2, z: -8.4, w: 2.8, h: 4.2, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[10], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },
    { x: 12.2, z: -11.8, w: 2.8, h: 6.0, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet' },

    // -------------------------------------------------------------
    // ZONE 3: SW INNER CORE (Surrounding Mani Bajji Kadai at -6, 10)
    // -------------------------------------------------------------
    { x: -4.8, z: 4.8, w: 3.2, h: 4.5, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[5], shutterColor: PALETTE.shutterBrown, roofType: 'terrace', tamilSign: { tamil: 'செல்வம் டெக்ஸ்டைல்ஸ்', eng: 'Selvam Textiles', bg: '#1971c2' } },
    { x: -8.6, z: 4.8, w: 3.4, h: 5.8, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet', hasBalcony: true },
    { x: -12.2, z: 4.8, w: 2.8, h: 4.2, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[3], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: -12.2, z: 8.4, w: 2.8, h: 5.4, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[2], roofType: 'parapet' },
    { x: -12.2, z: 11.8, w: 2.8, h: 4.0, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[11], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: -8.6, z: 11.8, w: 3.0, h: 3.6, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },

    // -------------------------------------------------------------
    // ZONE 4: SE INNER CORE (Surrounding Rahman Shawarma at 11, 7; Murugan Juice is at -3.3, 6.8)
    // -------------------------------------------------------------
    { x: 4.8, z: 4.8, w: 3.2, h: 5.0, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[1], shutterColor: PALETTE.shutterTeal, awningColor: PALETTE.awningTeal, roofType: 'mangalore', roofColor: PALETTE.roofSlateGray, tamilSign: { tamil: 'மீனாட்சி மெடிக்கல்ஸ்', eng: 'Meenakshi Medicals', bg: '#2b8a3e' } },
    { x: 4.8, z: 8.4, w: 3.2, h: 6.5, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[0], roofType: 'parapet', hasBalcony: true },
    { x: 4.8, z: 11.8, w: 3.2, h: 4.5, d: 2.8, type: 'commercial', wallColor: PALETTE.walls[4], roofType: 'terrace', tamilSign: { tamil: 'வெங்கடேஸ்வரா பிரிண்டர்ஸ்', eng: 'Venkateswara Printers', bg: '#1098ad' } },
    { x: 8.4, z: 3.8, w: 2.8, h: 4.2, d: 2.6, type: 'shop-house', wallColor: PALETTE.walls[9], shutterColor: PALETTE.shutterGreen, roofType: 'terrace', tamilSign: { tamil: 'லக்ஷ்மி சுவீட்ஸ்', eng: 'Lakshmi Sweets', bg: '#e8590c' } },
    { x: 8.4, z: 11.8, w: 3.0, h: 5.2, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[6], roofType: 'parapet' },
    { x: 12.2, z: 3.8, w: 2.6, h: 4.8, d: 2.6, type: 'row-house', wallColor: PALETTE.walls[3], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: 12.2, z: 11.8, w: 2.6, h: 5.6, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet' },

    // -------------------------------------------------------------
    // ZONE 5: MID-WEST COMMERCIAL & RESIDENTIAL (x = -17 to -25)
    // -------------------------------------------------------------
    // Upper West Block (z = -4 to -12.5)
    { x: -17.2, z: -4.8, w: 3.2, h: 4.6, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[10], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: -20.8, z: -4.8, w: 3.2, h: 6.4, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet', hasBalcony: true },
    { x: -24.2, z: -4.8, w: 3.0, h: 4.2, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[3], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: -17.2, z: -8.4, w: 3.2, h: 5.2, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[2], roofType: 'terrace', tamilSign: { tamil: 'விஜய் ஹார்டுவேர்', eng: 'Vijay Hardware', bg: '#495057' } },
    { x: -20.8, z: -8.4, w: 3.2, h: 4.8, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[1], shutterColor: PALETTE.shutterBlue, roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: -24.2, z: -8.4, w: 3.0, h: 7.2, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[9], roofType: 'parapet' },
    { x: -17.2, z: -11.8, w: 3.2, h: 4.0, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[6], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },
    { x: -20.8, z: -11.8, w: 3.2, h: 5.6, d: 2.8, type: 'commercial', wallColor: PALETTE.walls[8], roofType: 'terrace' },
    { x: -24.2, z: -11.8, w: 3.0, h: 4.4, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[0], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    // Lower West Block (z = 4 to 12.5)
    { x: -17.2, z: 4.8, w: 3.2, h: 5.4, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[1], roofType: 'terrace', tamilSign: { tamil: 'பாரதி புத்தக நிலையம்', eng: 'Bharathi Book House', bg: '#1864ab' } },
    { x: -20.8, z: 4.8, w: 3.2, h: 4.5, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[5], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: -24.2, z: 4.8, w: 3.0, h: 6.8, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet', hasBalcony: true },
    { x: -17.2, z: 8.4, w: 3.2, h: 4.2, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[4], shutterColor: PALETTE.shutterGreen, roofType: 'terrace' },
    { x: -20.8, z: 8.4, w: 3.2, h: 6.0, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[2], roofType: 'parapet' },
    { x: -24.2, z: 8.4, w: 3.0, h: 4.8, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[10], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: -17.2, z: 11.8, w: 3.2, h: 4.0, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[0], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: -20.8, z: 11.8, w: 3.2, h: 5.0, d: 2.8, type: 'shop-house', wallColor: PALETTE.walls[6], roofType: 'terrace' },
    { x: -24.2, z: 11.8, w: 3.0, h: 7.0, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[3], roofType: 'parapet', hasBalcony: true },

    // -------------------------------------------------------------
    // ZONE 6: MID-EAST COMMERCIAL & RESIDENTIAL (x = 17 to 25)
    // -------------------------------------------------------------
    // Upper East Block (z = -4 to -12.5)
    { x: 17.2, z: -4.8, w: 3.2, h: 6.4, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[0], roofType: 'parapet', hasBalcony: true },
    { x: 20.8, z: -4.8, w: 3.2, h: 4.6, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[4], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },
    { x: 24.2, z: -4.8, w: 3.0, h: 5.8, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[8], roofType: 'terrace', tamilSign: { tamil: 'அன்னை பால் பண்ணை', eng: 'Annai Milk Depot', bg: '#099268' } },
    { x: 17.2, z: -8.4, w: 3.2, h: 4.2, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[7], shutterColor: PALETTE.shutterBlue, roofType: 'terrace' },
    { x: 20.8, z: -8.4, w: 3.2, h: 7.0, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[9], roofType: 'parapet' },
    { x: 24.2, z: -8.4, w: 3.0, h: 4.2, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[2], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: 17.2, z: -11.8, w: 3.2, h: 5.0, d: 2.8, type: 'commercial', wallColor: PALETTE.walls[1], roofType: 'terrace' },
    { x: 20.8, z: -11.8, w: 3.2, h: 4.4, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[5], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: 24.2, z: -11.8, w: 3.0, h: 6.6, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[11], roofType: 'parapet', hasBalcony: true },
    // Lower East Block (z = 4 to 12.5)
    { x: 17.2, z: 4.8, w: 3.2, h: 4.4, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    { x: 20.8, z: 4.8, w: 3.2, h: 6.2, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[1], roofType: 'parapet', hasBalcony: true },
    { x: 24.2, z: 4.8, w: 3.0, h: 5.2, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[3], shutterColor: PALETTE.shutterYellow, roofType: 'mangalore', roofColor: PALETTE.roofMediumGray, tamilSign: { tamil: 'சரவணா எலக்ட்ரிக்கல்ஸ்', eng: 'Saravana Electricals', bg: '#f08c00' } },
    { x: 17.2, z: 8.4, w: 3.2, h: 5.6, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[2], roofType: 'terrace' },
    { x: 20.8, z: 8.4, w: 3.2, h: 4.0, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[11], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: 24.2, z: 8.4, w: 3.0, h: 6.5, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[6], roofType: 'parapet' },
    { x: 17.2, z: 11.8, w: 3.2, h: 4.2, d: 2.8, type: 'shop-house', wallColor: PALETTE.walls[0], shutterColor: PALETTE.shutterTeal, roofType: 'terrace' },
    { x: 20.8, z: 11.8, w: 3.2, h: 5.4, d: 2.8, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet' },
    { x: 24.2, z: 11.8, w: 3.0, h: 4.6, d: 2.8, type: 'row-house', wallColor: PALETTE.walls[10], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },

    // -------------------------------------------------------------
    // ZONE 7: NORTH NEIGHBORHOOD & TEMPLE PRECINCT (z = -17 to -26)
    // -------------------------------------------------------------
    { x: -4.8, z: -17.8, w: 3.4, h: 4.5, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[0], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: -4.8, z: -21.6, w: 3.4, h: 5.8, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet' },
    { x: -4.8, z: -25.5, w: 3.4, h: 4.0, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[3], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: 4.8, z: -17.8, w: 3.4, h: 4.2, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[3], roofType: 'terrace' },
    { x: 4.8, z: -21.6, w: 3.4, h: 6.4, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[1], roofType: 'parapet', hasBalcony: true },
    { x: 4.8, z: -25.5, w: 3.4, h: 4.8, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: 9.2, z: -17.8, w: 3.4, h: 5.2, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[6], roofType: 'terrace' },
    { x: 9.2, z: -21.6, w: 3.4, h: 4.4, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[4], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },
    { x: 9.2, z: -25.5, w: 3.4, h: 6.0, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[2], roofType: 'parapet' },
    { x: -8.8, z: -17.8, w: 3.0, h: 4.2, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[5], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    { x: -20.0, z: -17.8, w: 3.4, h: 5.0, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[10], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    { x: -24.5, z: -17.8, w: 3.6, h: 7.2, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[9], roofType: 'parapet' },
    { x: -20.0, z: -22.0, w: 3.4, h: 4.6, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[1], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: -24.5, z: -22.0, w: 3.6, h: 6.5, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[3], roofType: 'parapet' },
    { x: 17.5, z: -17.8, w: 3.4, h: 6.0, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[2], roofType: 'terrace' },
    { x: 22.0, z: -17.8, w: 3.6, h: 4.8, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[0], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: 17.5, z: -22.0, w: 3.4, h: 4.5, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: 22.0, z: -22.0, w: 3.6, h: 6.8, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[4], roofType: 'parapet', hasBalcony: true },
    { x: 17.5, z: -25.5, w: 3.4, h: 5.4, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[11], roofType: 'parapet' },
    { x: 22.0, z: -25.5, w: 3.6, h: 4.2, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[5], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },

    // -------------------------------------------------------------
    // ZONE 8: SOUTH RESIDENTIAL BLOCKS (z = 17 to 26)
    // -------------------------------------------------------------
    { x: -4.8, z: 17.8, w: 3.4, h: 5.2, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[1], roofType: 'parapet' },
    { x: -4.8, z: 21.6, w: 3.4, h: 4.0, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[6], roofType: 'mangalore', roofColor: PALETTE.roofDarkGreen },
    { x: -4.8, z: 25.5, w: 3.4, h: 6.2, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[2], roofType: 'parapet', hasBalcony: true },
    { x: 4.8, z: 17.8, w: 3.4, h: 4.6, d: 3.2, type: 'shop-house', wallColor: PALETTE.walls[0], roofType: 'terrace' },
    { x: 4.8, z: 21.6, w: 3.4, h: 6.6, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[7], roofType: 'parapet', hasBalcony: true },
    { x: 4.8, z: 25.5, w: 3.4, h: 4.2, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[10], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: -9.2, z: 17.8, w: 3.4, h: 4.5, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[3], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: -9.2, z: 21.6, w: 3.4, h: 5.8, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[5], roofType: 'parapet' },
    { x: -9.2, z: 25.5, w: 3.4, h: 4.0, d: 3.0, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: 9.2, z: 17.8, w: 3.4, h: 5.5, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[9], roofType: 'terrace', tamilSign: { tamil: 'முருகன் ஆட்டோமொபைல்ஸ்', eng: 'Murugan Automobiles', bg: '#d6336c' } },
    { x: 9.2, z: 21.6, w: 3.4, h: 4.3, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[4], roofType: 'mangalore', roofColor: PALETTE.roofTileWeathered },
    { x: 9.2, z: 25.5, w: 3.4, h: 6.4, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[1], roofType: 'parapet' },
    { x: -17.5, z: 17.8, w: 3.4, h: 4.4, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[4], roofType: 'mangalore', roofColor: PALETTE.roofSlateGray },
    { x: -22.0, z: 17.8, w: 3.6, h: 6.8, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[2], roofType: 'parapet' },
    { x: -17.5, z: 22.0, w: 3.4, h: 5.2, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[7], roofType: 'terrace' },
    { x: -22.0, z: 22.0, w: 3.6, h: 4.6, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[0], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: 17.5, z: 17.8, w: 3.4, h: 5.4, d: 3.2, type: 'commercial', wallColor: PALETTE.walls[5], roofType: 'terrace' },
    { x: 22.0, z: 17.8, w: 3.6, h: 4.2, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[8], roofType: 'mangalore', roofColor: PALETTE.roofMediumGray },
    { x: 17.5, z: 22.0, w: 3.4, h: 6.0, d: 3.2, type: 'apartment', wallColor: PALETTE.walls[3], roofType: 'parapet' },
    { x: 22.0, z: 22.0, w: 3.6, h: 4.5, d: 3.2, type: 'row-house', wallColor: PALETTE.walls[1], roofType: 'mangalore', roofColor: PALETTE.roofTileMangalore },
    { x: 17.5, z: 25.5, w: 3.4, h: 4.8, d: 3.0, type: 'commercial', wallColor: PALETTE.walls[10], roofType: 'terrace' },
    { x: 22.0, z: 25.5, w: 3.6, h: 7.0, d: 3.0, type: 'apartment', wallColor: PALETTE.walls[9], roofType: 'parapet', hasBalcony: true },

    // -------------------------------------------------------------
    // ZONE 9: PERIMETER SKYLINE TOWERS & CITY DEPTH
    // -------------------------------------------------------------
    { x: -30.5, z: -10.0, w: 4.8, h: 8.5, d: 5.5, type: 'apartment', wallColor: 0xbac8d3, roofType: 'parapet' },
    { x: -30.5, z: -3.0, w: 4.8, h: 7.8, d: 5.5, type: 'apartment', wallColor: 0xccd5dc, roofType: 'parapet' },
    { x: -30.5, z: 5.0, w: 4.8, h: 9.0, d: 5.5, type: 'apartment', wallColor: 0xc2cfc7, roofType: 'parapet' },
    { x: -30.5, z: 12.0, w: 4.8, h: 8.2, d: 5.5, type: 'apartment', wallColor: 0xd4dbde, roofType: 'parapet' },
    { x: 30.5, z: -10.0, w: 4.8, h: 8.0, d: 5.5, type: 'apartment', wallColor: 0xd8dde0, roofType: 'parapet' },
    { x: 30.5, z: -3.0, w: 4.8, h: 8.6, d: 5.5, type: 'apartment', wallColor: 0xc6d0d6, roofType: 'parapet' },
    { x: 30.5, z: 5.0, w: 4.8, h: 8.8, d: 5.5, type: 'apartment', wallColor: 0xb5c6c0, roofType: 'parapet' },
    { x: 30.5, z: 12.0, w: 4.8, h: 7.9, d: 5.5, type: 'apartment', wallColor: 0xd0d8dc, roofType: 'parapet' },
    { x: -12.0, z: -30.5, w: 5.5, h: 8.2, d: 4.6, type: 'apartment', wallColor: 0xdde0e3, roofType: 'parapet' },
    { x: -3.0, z: -30.5, w: 5.0, h: 8.6, d: 4.6, type: 'apartment', wallColor: 0xc9d3d8, roofType: 'parapet' },
    { x: 6.0, z: -30.5, w: 5.5, h: 9.5, d: 4.6, type: 'apartment', wallColor: 0xcfd8dc, roofType: 'parapet' },
    { x: 15.0, z: -30.5, w: 5.0, h: 8.0, d: 4.6, type: 'apartment', wallColor: 0xd6dedf, roofType: 'parapet' },
    { x: -12.0, z: 30.5, w: 5.5, h: 7.8, d: 4.6, type: 'apartment', wallColor: 0xe2e6e8, roofType: 'parapet' },
    { x: -3.0, z: 30.5, w: 5.0, h: 8.5, d: 4.6, type: 'apartment', wallColor: 0xcdd6db, roofType: 'parapet' },
    { x: 6.0, z: 30.5, w: 5.5, h: 8.4, d: 4.6, type: 'apartment', wallColor: 0xc3ced6, roofType: 'parapet' },
    { x: 15.0, z: 30.5, w: 5.0, h: 8.2, d: 4.6, type: 'apartment', wallColor: 0xd9e1e3, roofType: 'parapet' }
];

export const CITY_BUILDINGS: BuildingDef[] = RAW_BUILDINGS.map((b, idx) => ({
  ...b,
  id: `bldg-${idx + 1}`,
  name: b.tamilSign?.eng || `Building ${idx + 1}`
}));

export function getBuildingById(id: string): BuildingDef | undefined {
  return CITY_BUILDINGS.find(b => b.id === id);
}

/**
 * Builds dense, varied South Indian city architecture (100+ buildings, landmarks, compound walls)
 */
export function buildBuildings(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'city-buildings';

  // Build each building
  CITY_BUILDINGS.forEach(b => {
    const bGroup = new THREE.Group();
    bGroup.name = `building-${b.id}`;
    bGroup.position.set(b.x, 0, b.z);
    if (b.rotationY) {
      bGroup.rotation.y = b.rotationY;
    }
    bGroup.userData = {
      isBuilding: true,
      buildingId: b.id,
      building: b
    };

    // Main wall
    const wallGeom = new THREE.BoxGeometry(b.w, b.h, b.d);
    const wallMat = new THREE.MeshLambertMaterial({ color: b.wallColor });
    const wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.y = b.h / 2;
    bGroup.add(wall);

    // Windows
    const winMat = new THREE.MeshLambertMaterial({ color: 0x252a34 });
    const winGeom = new THREE.BoxGeometry(0.55, 0.75, 0.08);

    for (let floorY = 1.2; floorY < b.h - 0.8; floorY += 1.6) {
      // Front windows
      const w1 = new THREE.Mesh(winGeom, winMat);
      w1.position.set(-b.w * 0.25, floorY, b.d / 2 + 0.04);
      const w2 = new THREE.Mesh(winGeom, winMat);
      w2.position.set(b.w * 0.25, floorY, b.d / 2 + 0.04);
      bGroup.add(w1, w2);

      // Cantilever sunshade chajjas over windows
      const chajja = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.06, 0.35),
        new THREE.MeshLambertMaterial({ color: PALETTE.roofConcrete })
      );
      chajja.position.set(-b.w * 0.25, floorY + 0.45, b.d / 2 + 0.15);
      const chajja2 = chajja.clone();
      chajja2.position.x = b.w * 0.25;
      bGroup.add(chajja, chajja2);
    }

    // Cantilever Balcony
    if (b.hasBalcony && b.h > 4.5) {
      const balFloor = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.65, 0.1, 0.7),
        new THREE.MeshLambertMaterial({ color: PALETTE.roofConcrete })
      );
      balFloor.position.set(0, 2.6, b.d / 2 + 0.35);
      const balRail = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.65, 0.4, 0.05),
        new THREE.MeshLambertMaterial({ color: PALETTE.ironGate })
      );
      balRail.position.set(0, 2.85, b.d / 2 + 0.68);
      bGroup.add(balFloor, balRail);
    }

    // Ground Floor roll-down metal shutter for shops
    if (b.type === 'shop-house' || b.type === 'commercial') {
      const shutter = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.65, 1.7, 0.08),
        new THREE.MeshLambertMaterial({ color: b.shutterColor || PALETTE.shutterBlue })
      );
      shutter.position.set(0, 0.85, b.d / 2 + 0.05);
      bGroup.add(shutter);
    }

    // Ground Floor Awning / Sunshade
    if (b.awningColor) {
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.8, 0.08, 0.85),
        new THREE.MeshLambertMaterial({ color: b.awningColor })
      );
      awning.position.set(0, 1.9, b.d / 2 + 0.45);
      awning.rotateX(0.22);
      bGroup.add(awning);
    }

    // Tamil Shop Signboard
    if (b.tamilSign) {
      const signTex = createTamilShopSignTexture(b.tamilSign.tamil, b.tamilSign.eng, b.tamilSign.bg);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.8, 0.45, 0.06), signMat);
      signMesh.position.set(0, 2.3, b.d / 2 + 0.08);
      bGroup.add(signMesh);
    }

    // Roof Styles
    if (b.roofType === 'mangalore') {
      // Sloped traditional pitched roof with varied tiles
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.72, 1.3, 4),
        new THREE.MeshLambertMaterial({ color: b.roofColor || PALETTE.roofSlateGray })
      );
      roof.rotateY(Math.PI / 4);
      roof.position.y = b.h + 0.65;
      bGroup.add(roof);
    } else if (b.roofType === 'parapet') {
      // Flat concrete terrace with parapet and Sintex water tank
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.15, 0.38, b.d + 0.15),
        new THREE.MeshLambertMaterial({ color: PALETTE.roofConcrete })
      );
      parapet.position.y = b.h + 0.19;
      bGroup.add(parapet);

      // Sintex water tank (black or white)
      const tankColor = Math.random() > 0.5 ? PALETTE.roofWaterTankBlack : PALETTE.roofWaterTankWhite;
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.75, 12),
        new THREE.MeshLambertMaterial({ color: tankColor })
      );
      tank.position.set(b.w * 0.25, b.h + 0.58, b.d * 0.2);
      bGroup.add(tank);

      // Terrace staircase doghouse
      const doghouse = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.2),
        new THREE.MeshLambertMaterial({ color: b.wallColor })
      );
      doghouse.position.set(-b.w * 0.2, b.h + 0.55, -b.d * 0.2);
      bGroup.add(doghouse);
    } else {
      // Simple terrace coping
      const terrace = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.2, 0.2, b.d + 0.2),
        new THREE.MeshLambertMaterial({ color: PALETTE.roofConcrete })
      );
      terrace.position.y = b.h + 0.1;
      bGroup.add(terrace);
    }

    bGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.userData = {
          isBuildingMesh: true,
          buildingId: b.id,
          building: b
        };
      }
    });

    group.add(bGroup);
  });

  // -------------------------------------------------------------
  // ICONIC CITY LANDMARK: South Indian Temple Gopuram
  // Situated at North-West Temple Precinct (-14, -24)
  // -------------------------------------------------------------
  const gopuram = buildTempleGopuram();
  gopuram.position.set(-14, 0, -25);
  group.add(gopuram);

  // -------------------------------------------------------------
  // COMPOUND WALLS WITH ENTRANCE GATES
  // -------------------------------------------------------------
  const wallMat = new THREE.MeshLambertMaterial({ color: PALETTE.compoundWall });
  const trimMat = new THREE.MeshLambertMaterial({ color: PALETTE.compoundWallTrim });

  const compoundConfigs = [
    { x: -14.0, z: -21.0, w: 9.0, rotY: 0 },
    { x: 7.5, z: -14.5, w: 8.0, rotY: 0 },
    { x: -7.5, z: 14.5, w: 8.0, rotY: 0 },
    { x: 14.5, z: 20.0, w: 8.0, rotY: Math.PI / 2 }
  ];

  compoundConfigs.forEach(c => {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(c.x, 0, c.z);
    wallGroup.rotation.y = c.rotY;

    // Wall base
    const wall = new THREE.Mesh(new THREE.BoxGeometry(c.w, 1.0, 0.2), wallMat);
    wall.position.y = 0.5;
    // Coping trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(c.w + 0.1, 0.1, 0.26), trimMat);
    trim.position.y = 1.05;

    // Gate opening in center with two brick pillars
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.25, 0.35), trimMat);
    p1.position.set(-0.8, 0.62, 0);
    const p2 = p1.clone();
    p2.position.x = 0.8;

    wallGroup.add(wall, trim, p1, p2);
    group.add(wallGroup);
  });

  return group;
}

/**
 * Builds an authentic tiered South Indian Temple Gopuram landmark
 */
function buildTempleGopuram(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'temple-gopuram';

  // Base entrance gateway (Mandapam plinth)
  const baseGeom = new THREE.BoxGeometry(6.4, 2.4, 4.8);
  const baseMat = new THREE.MeshLambertMaterial({ color: PALETTE.templePlinth }); // Traditional stone plinth
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = 1.2;
  g.add(base);

  // Plinth crimson baseline border
  const baseTrimGeom = new THREE.BoxGeometry(6.5, 0.2, 4.9);
  const baseTrimMat = new THREE.MeshLambertMaterial({ color: PALETTE.templeRed });
  const baseTrim = new THREE.Mesh(baseTrimGeom, baseTrimMat);
  baseTrim.position.y = 0.1;
  g.add(baseTrim);

  // Arched entrance portal
  const archGeom = new THREE.BoxGeometry(2.0, 1.8, 5.0);
  const archMat = new THREE.MeshLambertMaterial({ color: 0x22262a });
  const arch = new THREE.Mesh(archGeom, archMat);
  arch.position.set(0, 0.9, 0);
  g.add(arch);

  // Stepped pyramid tiers (3 authentic lime-wash & sandstone tiers)
  const tierColors = [PALETTE.templeCream, PALETTE.templeSandstone, PALETTE.templeCream];
  const tierSizes = [
    { w: 5.6, d: 4.2, h: 1.6, y: 3.2 },
    { w: 4.6, d: 3.4, h: 1.5, y: 4.75 },
    { w: 3.6, d: 2.6, h: 1.4, y: 6.2 }
  ];

  tierSizes.forEach((t, i) => {
    const tier = new THREE.Mesh(
      new THREE.BoxGeometry(t.w, t.h, t.d),
      new THREE.MeshLambertMaterial({ color: tierColors[i] })
    );
    tier.position.y = t.y;

    // Cornice trim band (Sacred white lime)
    const cornice = new THREE.Mesh(
      new THREE.BoxGeometry(t.w + 0.3, 0.18, t.d + 0.3),
      new THREE.MeshLambertMaterial({ color: PALETTE.templeWhite })
    );
    cornice.position.y = t.y + t.h / 2;

    g.add(tier, cornice);
  });

  // Barrel-vaulted barrel roof (Sala crown)
  const crownGeom = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 12);
  crownGeom.rotateZ(Math.PI / 2);
  const crownMat = new THREE.MeshLambertMaterial({ color: PALETTE.templeRed });
  const crown = new THREE.Mesh(crownGeom, crownMat);
  crown.position.set(0, 7.4, 0);
  g.add(crown);

  // 5 Golden Kalasams (Temple Spire finials) on crown top
  const kalasamGeom = new THREE.ConeGeometry(0.12, 0.65, 8);
  const goldMat = new THREE.MeshBasicMaterial({ color: PALETTE.templeGold });
  for (let i = -2; i <= 2; i++) {
    const k = new THREE.Mesh(kalasamGeom, goldMat);
    k.position.set(i * 0.55, 8.35, 0);
    g.add(k);
  }

  // Warm temple beacon light
  const tLight = new THREE.PointLight(0xffb703, 1.2, 10.0);
  tLight.position.set(0, 4.5, 2.5);
  g.add(tLight);

  return g;
}

/**
 * Builds rich environmental infrastructure:
 * electric poles with overhead wires, bus shelter, vehicles, tropical trees, street lamps
 */
export function buildEnvironment(): { group: THREE.Group; streetLights: THREE.PointLight[] } {
  const envGroup = new THREE.Group();
  envGroup.name = 'city-environment';
  const streetLights: THREE.PointLight[] = [];

  // 1. Concrete Electric Poles & Overhead Wires
  const polePositions: [number, number][] = [
    [-3.2, -18.0],
    [-3.2, -5.0],
    [-3.2, 8.0],
    [-3.2, 22.0],
    [3.2, -18.0],
    [3.2, -5.0],
    [3.2, 8.0],
    [3.2, 22.0]
  ];

  const poleGeom = new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6);
  const poleMat = new THREE.MeshLambertMaterial({ color: PALETTE.poleConcrete });
  const crossArmGeom = new THREE.BoxGeometry(0.8, 0.06, 0.06);

  polePositions.forEach(([px, pz]) => {
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(px, 2.1, pz);

    const crossArm = new THREE.Mesh(crossArmGeom, poleMat);
    crossArm.position.set(px, 4.0, pz);

    envGroup.add(pole, crossArm);
  });

  // Overhead wire lines spanning between electric poles
  const wireMat = new THREE.LineBasicMaterial({ color: PALETTE.wireBlack, linewidth: 1 });
  for (let i = 0; i < 3; i++) {
    // West side wire
    const p1 = new THREE.Vector3(polePositions[i][0], 4.0, polePositions[i][1]);
    const p2 = new THREE.Vector3(polePositions[i + 1][0], 4.0, polePositions[i + 1][1]);
    const geomW = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const wireW = new THREE.Line(geomW, wireMat);

    // East side wire
    const p3 = new THREE.Vector3(polePositions[i + 4][0], 4.0, polePositions[i + 4][1]);
    const p4 = new THREE.Vector3(polePositions[i + 5][0], 4.0, polePositions[i + 5][1]);
    const geomE = new THREE.BufferGeometry().setFromPoints([p3, p4]);
    const wireE = new THREE.Line(geomE, wireMat);

    envGroup.add(wireW, wireE);
  }

  // 2. Roadside Bus Stop Shelter (Near x = 3.6, z = 4.0 on main road)
  const busShelter = buildBusStopShelter();
  busShelter.position.set(3.4, 0, 4.5);
  busShelter.rotation.y = -Math.PI / 2;
  envGroup.add(busShelter);

  // 3. Street Lamps with Warm Pools of Light
  const lampPositions: [number, number][] = [
    [-3.0, -11.0],
    [-3.0, -1.5],
    [-3.0, 11.0],
    [3.0, -11.0],
    [3.0, -1.5],
    [3.0, 11.0],
    [-11.0, -14.0],
    [11.0, -14.0],
    [-11.0, 13.5],
    [11.0, 13.5]
  ];

  lampPositions.forEach(([lx, lz]) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 3.2, 6),
      new THREE.MeshLambertMaterial({ color: PALETTE.poleMetal })
    );
    post.position.y = 1.6;
    lamp.add(post);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.05, 0.05),
      new THREE.MeshLambertMaterial({ color: PALETTE.poleMetal })
    );
    arm.position.set(lx > 0 ? -0.22 : 0.22, 3.15, 0);
    lamp.add(arm);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: PALETTE.lampWarmGlow })
    );
    bulb.position.set(lx > 0 ? -0.4 : 0.4, 3.05, 0);
    lamp.add(bulb);

    const pLight = new THREE.PointLight(0xffd066, 0.9, 6.5);
    pLight.position.set(lx > 0 ? -0.4 : 0.4, 2.95, 0);
    lamp.add(pLight);
    streetLights.push(pLight);

    envGroup.add(lamp);
  });

  // 4. Vehicles: Classic Yellow/Black Autos & Parked Scooters
  // Auto Stand near junction
  const auto1 = createAutoRickshaw();
  auto1.position.set(-3.2, 0, 2.2);
  auto1.rotation.y = 0.05;

  const auto2 = createAutoRickshaw();
  auto2.position.set(-3.2, 0, -2.5);
  auto2.rotation.y = -0.15;

  const auto3 = createAutoRickshaw();
  auto3.position.set(11.0, 0, 11.5);
  auto3.rotation.y = Math.PI / 2;

  envGroup.add(auto1, auto2, auto3);

  // Parked Scooters (Chetak, Activa, Enfield)
  const scooterPositions: [number, number, number, number][] = [
    [-3.2, -6.8, PALETTE.scooterYellow, 0.2],
    [3.2, -7.5, PALETTE.scooterCyan, -0.3],
    [3.2, 8.8, PALETTE.scooterRed, -0.1],
    [-8.2, -14.0, PALETTE.scooterNavy, Math.PI / 2],
    [8.2, 13.5, PALETTE.scooterYellow, Math.PI / 2],
    [-11.5, 6.5, PALETTE.scooterCyan, 0.4]
  ];

  scooterPositions.forEach(([sx, sz, col, rotY]) => {
    const sc = createScooter(col);
    sc.position.set(sx, 0, sz);
    sc.rotation.y = rotY;
    envGroup.add(sc);
  });

  // 5. Tropical Trees: Gulmohar, Banyan/Neem, Coconut Palms
  // Gulmohar (Orange blossoms)
  const gulmohar1 = createGulmoharTree();
  gulmohar1.position.set(-8.5, 0, 8.5); // Shades Mani Bajji cart
  const gulmohar2 = createGulmoharTree();
  gulmohar2.position.set(8.5, 0, -8.5);

  // Banyan / Neem trees
  const neemPositions: [number, number][] = [
    [-3.4, -12.5],
    [3.4, -12.5],
    [-3.4, 12.5],
    [3.4, 12.5],
    [-12.5, -4.5],
    [12.5, -4.5],
    [-12.5, 4.5],
    [12.5, 4.5]
  ];

  const treeGreens = [
    PALETTE.foliageLightGreen,
    PALETTE.foliageMidGreen,
    PALETTE.foliageDeepGreen,
    PALETTE.foliageMutedOlive
  ];

  neemPositions.forEach(([tx, tz], i) => {
    const tree = createNeemTree(treeGreens[i % treeGreens.length]);
    tree.position.set(tx, 0, tz);
    envGroup.add(tree);
  });

  // Coconut Palms (Slender trunks with curved fronds)
  const palmPositions: [number, number][] = [
    [-6.5, -16.5],
    [6.5, -16.5],
    [-16.5, 11.5],
    [16.5, 11.5],
    [-10.5, -28.0],
    [10.5, -28.0]
  ];

  palmPositions.forEach(([px, pz]) => {
    const palm = createCoconutPalm();
    palm.position.set(px, 0, pz);
    envGroup.add(palm);
  });

  envGroup.add(gulmohar1, gulmohar2);

  // 6. Pedestrians (South Indian citizens in shirts, veshtis, and sarees)
  const pedestriansData = [
    { pos: [5.2, 0, -4.5], color: 0x3a86ff }, // Selvi tea customer
    { pos: [6.8, 0, -4.8], color: 0xff006e }, // Chatting friend
    { pos: [-9.0, 0, -3.8], color: 0xfb5607 }, // Kumar Kadai customer
    { pos: [-2.5, 0, 6.8], color: 0x8338ec }, // Murugan juice customer
    { pos: [3.4, 0, 4.2], color: 0x38b000 },  // Bus stop commuter
    { pos: [-2.9, 0, 9.8], color: 0xf59f00 }, // Mani bajji customer
    { pos: [9.5, 0, 6.8], color: 0x20c997 }   // Rahman shawarma customer
  ];

  pedestriansData.forEach(p => {
    const fig = createPedestrian(p.color);
    fig.position.set(p.pos[0], p.pos[1], p.pos[2]);
    envGroup.add(fig);
  });

  return { group: envGroup, streetLights };
}

function buildBusStopShelter(): THREE.Group {
  const g = new THREE.Group();
  // Roof canopy (Curved blue metal sheet)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.08, 1.2),
    new THREE.MeshLambertMaterial({ color: PALETTE.busShelterBlue })
  );
  roof.position.set(0, 2.1, 0);

  // Support posts
  const postGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.1);
  const postMat = new THREE.MeshLambertMaterial({ color: 0xced4da });
  const p1 = new THREE.Mesh(postGeom, postMat);
  p1.position.set(-1.0, 1.05, -0.45);
  const p2 = p1.clone();
  p2.position.x = 1.0;
  g.add(p1, p2, roof);

  // Wooden commuter bench
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.38, 0.35),
    new THREE.MeshLambertMaterial({ color: 0x795548 })
  );
  bench.position.set(0, 0.22, -0.3);
  g.add(bench);

  // Bus stop yellow sign board
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.35, 0.05),
    new THREE.MeshLambertMaterial({ color: PALETTE.busShelterYellow })
  );
  board.position.set(1.2, 1.6, 0);
  g.add(board);

  return g;
}

function createGulmoharTree(): THREE.Group {
  const g = new THREE.Group();
  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.28, 2.0, 8),
    new THREE.MeshLambertMaterial({ color: PALETTE.treeTrunk })
  );
  trunk.position.y = 1.0;
  g.add(trunk);

  // Lush spreading green crown
  const leafMat = new THREE.MeshLambertMaterial({ color: PALETTE.foliageGulmoharGreen });
  const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25), leafMat);
  c1.position.set(0, 2.4, 0);
  const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95), leafMat);
  c2.position.set(0.6, 2.8, 0.4);
  const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85), leafMat);
  c3.position.set(-0.6, 2.7, -0.3);

  // Delicate coral flower accents
  const flowerMat = new THREE.MeshLambertMaterial({ color: PALETTE.foliageGulmoharOrange });
  const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32), flowerMat);
  f1.position.set(0.4, 3.2, 0.2);
  const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), flowerMat);
  f2.position.set(-0.5, 3.1, 0.3);
  const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26), flowerMat);
  f3.position.set(0, 3.3, -0.4);

  g.add(c1, c2, c3, f1, f2, f3);
  return g;
}

function createNeemTree(leafColor: number): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 1.8, 6),
    new THREE.MeshLambertMaterial({ color: PALETTE.treeTrunk })
  );
  trunk.position.y = 0.9;
  g.add(trunk);

  const leafMat = new THREE.MeshLambertMaterial({ color: leafColor });
  const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0), leafMat);
  c1.position.y = 2.2;
  const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), leafMat);
  c2.position.set(0.35, 2.6, 0.2);
  const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65), leafMat);
  c3.position.set(-0.35, 2.5, -0.2);

  g.add(c1, c2, c3);
  return g;
}

function createCoconutPalm(): THREE.Group {
  const g = new THREE.Group();
  // Tall segmented trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 3.8, 6),
    new THREE.MeshLambertMaterial({ color: PALETTE.palmTrunk })
  );
  trunk.position.y = 1.9;
  trunk.rotation.z = -0.08; // Natural gentle curve
  g.add(trunk);

  // Arched palm fronds (6 frond blades radiating outward)
  const frondMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmFronds });
  const frondGeom = new THREE.BoxGeometry(0.18, 0.04, 1.4);
  frondGeom.rotateX(0.45); // Droop downward

  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(frondGeom, frondMat);
    frond.position.set(0, 3.8, 0);
    frond.rotation.y = (i * Math.PI) / 3;
    g.add(frond);
  }

  // Small coconuts at trunk head
  const nutGeom = new THREE.SphereGeometry(0.1, 6, 6);
  const nutMat = new THREE.MeshLambertMaterial({ color: 0x4a7c29 });
  const n1 = new THREE.Mesh(nutGeom, nutMat);
  n1.position.set(0.1, 3.65, 0.1);
  const n2 = new THREE.Mesh(nutGeom, nutMat);
  n2.position.set(-0.1, 3.65, -0.1);
  g.add(n1, n2);

  return g;
}

function createScooter(color: number): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.65), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 0.22;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.12), new THREE.MeshLambertMaterial({ color }));
  post.position.set(0, 0.45, 0.25);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1f2421 });
  const wGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10);
  wGeom.rotateZ(Math.PI / 2);
  const wFront = new THREE.Mesh(wGeom, wheelMat);
  wFront.position.set(0, 0.12, 0.28);
  const wBack = new THREE.Mesh(wGeom, wheelMat);
  wBack.position.set(0, 0.12, -0.25);

  group.add(body, post, wFront, wBack);
  return group;
}

function createAutoRickshaw(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 1.4),
    new THREE.MeshLambertMaterial({ color: PALETTE.autoYellow })
  );
  body.position.y = 0.4;
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.45, 1.3),
    new THREE.MeshLambertMaterial({ color: PALETTE.autoBlack })
  );
  top.position.y = 0.85;

  const wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10);
  wGeom.rotateZ(Math.PI / 2);
  const w1 = new THREE.Mesh(wGeom, wMat);
  w1.position.set(0.48, 0.16, -0.4);
  const w2 = new THREE.Mesh(wGeom, wMat);
  w2.position.set(-0.48, 0.16, -0.4);
  const wFront = new THREE.Mesh(wGeom, wMat);
  wFront.position.set(0, 0.16, 0.6);

  group.add(body, top, w1, w2, wFront);
  return group;
}

function createPedestrian(shirtColor: number): THREE.Group {
  const figure = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.16), new THREE.MeshLambertMaterial({ color: shirtColor }));
  torso.position.y = 0.58;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshLambertMaterial({ color: 0xd4a373 }));
  head.position.y = 0.88;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.14), new THREE.MeshLambertMaterial({ color: 0x333d47 }));
  legs.position.y = 0.2;

  figure.add(torso, head, legs);
  return figure;
}
