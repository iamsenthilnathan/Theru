import * as THREE from 'three';
import { FoodSpot } from '../types/foodSpot';
import { PALETTE } from './threeUtils';
import { latLngToWorld } from '../services/geoService';
import { getRoadFacingOrientation } from './roadNetwork';
import { getFacadeCueWorldTransform } from './buildingFacadeUtils';

/**
 * Creates a canvas texture for a sign board
 */
function createSignTexture(text: string, subText: string, bgColor: string, textColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.roundRect ? ctx.roundRect(0, 0, 256, 80, 8) : ctx.fillRect(0, 0, 256, 80);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 72);

  ctx.fillStyle = textColor;
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 30);

  if (subText) {
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subText, 128, 56);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a striped awning mesh
 */
function createStripedAwning(width: number, depth: number, colorA: number, colorB: number, stripes = 6): THREE.Group {
  const group = new THREE.Group();
  const stripeW = width / stripes;
  const geom = new THREE.BoxGeometry(stripeW, 0.08, depth);
  geom.rotateX(0.25); // Slight tilt forward

  for (let i = 0; i < stripes; i++) {
    const mat = new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? colorA : colorB });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.x = (i - stripes / 2 + 0.5) * stripeW;
    group.add(mesh);
  }
  return group;
}

/**
 * Helper to build a floating beacon icon above each stall
 */
function createBeacon(spot: FoodSpot): THREE.Group {
  const beaconGroup = new THREE.Group();
  beaconGroup.name = 'beacon';
  beaconGroup.position.y = spot.locationType === 'existing-building' ? 4.8 : 2.9;

  const colorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xe03131;

  // Subtle floating disc badge
  const discGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
  discGeom.rotateX(Math.PI / 4);
  discGeom.rotateY(Math.PI / 4);
  const discMat = new THREE.MeshLambertMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.25
  });
  const disc = new THREE.Mesh(discGeom, discMat);
  disc.name = 'beaconDisc';
  beaconGroup.add(disc);

  // Soft subtle ground/aerial halo ring
  const ringGeom = new THREE.RingGeometry(0.38, 0.48, 16);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.y = -0.04;
  ring.name = 'beaconRing';
  beaconGroup.add(ring);

  return beaconGroup;
}

/**
 * Subtle physical visual cue attached to an existing building's road-facing facade.
 * Provides authentic South Indian storefront identity without dominating or replacing the building.
 */
function buildFoodPresenceCue(spot: FoodSpot, group: THREE.Group, steams: THREE.Mesh[]) {
  const cueGroup = new THREE.Group();
  cueGroup.name = `facade-cue-${spot.id}`;
  cueGroup.userData = {
    spotId: spot.id,
    kind: 'food-presence-cue',
    buildingId: spot.buildingId,
    spot
  };

  const cueColorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xd9480f;

  // 1. Granite threshold / entrance doorstep slab on ground
  const stepGeom = new THREE.BoxGeometry(1.4, 0.04, 0.45);
  const stepMat = new THREE.MeshLambertMaterial({ color: 0x495057 });
  const stepMesh = new THREE.Mesh(stepGeom, stepMat);
  stepMesh.position.set(0, 0.02, 0.22);
  cueGroup.add(stepMesh);

  // 2. Restrained storefront aperture & frame (flushed with building wall)
  const frameGeom = new THREE.BoxGeometry(1.35, 1.9, 0.06);
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x343a40 });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.set(0, 0.95, 0.03);
  cueGroup.add(frameMesh);

  // Recessed warm interior opening / serving counter cavity
  const cavityGeom = new THREE.BoxGeometry(1.12, 1.1, 0.08);
  const cavityMat = new THREE.MeshLambertMaterial({ color: 0x1f2421 });
  const cavityMesh = new THREE.Mesh(cavityGeom, cavityMat);
  cavityMesh.position.set(0, 0.9, 0.05);
  cueGroup.add(cavityMesh);

  // Wooden or stainless steel serving counter sill projecting slightly
  const counterGeom = new THREE.BoxGeometry(1.22, 0.07, 0.28);
  const counterMat = new THREE.MeshLambertMaterial({ color: 0xc8b69e });
  const counterMesh = new THREE.Mesh(counterGeom, counterMat);
  counterMesh.position.set(0, 0.88, 0.16);
  cueGroup.add(counterMesh);

  // Display item on counter (small tea glass or snack plate)
  const itemGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8);
  const itemMat = new THREE.MeshLambertMaterial({ color: 0xffd166 });
  const itemMesh = new THREE.Mesh(itemGeom, itemMat);
  itemMesh.position.set(-0.35, 0.98, 0.16);
  cueGroup.add(itemMesh);

  // Steam if hot food / tiffin / tea
  const steamGeom = new THREE.SphereGeometry(0.06, 6, 6);
  const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  const steam = new THREE.Mesh(steamGeom, steamMat);
  steam.position.set(-0.35, 1.15, 0.16);
  steams.push(steam);
  cueGroup.add(steam);

  // 3. Compact striped fabric awning tilted forward over the entrance
  const awning = createStripedAwning(1.42, 0.52, cueColorHex, 0xffffff, 6);
  awning.position.set(0, 2.05, 0.26);
  cueGroup.add(awning);

  // 4. Subtle facade signboard plaque mounted just above the entrance
  const signText = spot.name.toUpperCase();
  const subText = spot.tamilName || spot.category;
  const signBg = spot.stallColor || '#d9480f';
  const signTex = createSignTexture(signText, subText, signBg, '#ffffff');
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.28, 0.04), signMat);
  signMesh.position.set(0, 2.32, 0.06);
  cueGroup.add(signMesh);

  // 5. Restrained warm brass bracket lamp for evening street ambiance
  const lampArmGeom = new THREE.BoxGeometry(0.03, 0.03, 0.18);
  const lampArmMat = new THREE.MeshLambertMaterial({ color: 0x495057 });
  const lampArm = new THREE.Mesh(lampArmGeom, lampArmMat);
  lampArm.position.set(0.55, 1.75, 0.1);

  const lampBulbGeom = new THREE.SphereGeometry(0.06, 8, 8);
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfff3bf });
  const lampBulb = new THREE.Mesh(lampBulbGeom, lampBulbMat);
  lampBulb.position.set(0.55, 1.72, 0.18);
  cueGroup.add(lampArm, lampBulb);

  cueGroup.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.userData = { foodSpotId: spot.id, spot, isFacadeCue: true };
    }
  });

  group.add(cueGroup);
}

export interface StallMeshBundle {
  group: THREE.Group;
  steams?: THREE.Mesh[];
  beacon: THREE.Group;
  light?: THREE.PointLight;
  groundHalo?: THREE.Mesh;
}

export function buildFoodStall(
  spot: FoodSpot,
  spotIndex: number = 0,
  totalSpotsInBuilding: number = 1
): StallMeshBundle {
  const stallGroup = new THREE.Group();
  stallGroup.name = `stall-${spot.id}`;
  stallGroup.userData = { foodSpotId: spot.id, spot };

  const isBuildingSpot = spot.locationType === 'existing-building' || !!spot.buildingId;
  const steams: THREE.Mesh[] = [];

  // Branch A: Existing Building FoodSpot (Restrained facade cue on road-facing wall)
  if (isBuildingSpot && spot.buildingId) {
    const transform = getFacadeCueWorldTransform(spot.buildingId, spotIndex, totalSpotsInBuilding);
    if (transform) {
      stallGroup.position.copy(transform.position);
      stallGroup.rotation.y = transform.rotationY;
    } else {
      const [wx, wy, wz] = latLngToWorld(spot.latitude, spot.longitude);
      stallGroup.position.set(wx, wy, wz);
    }

    buildFoodPresenceCue(spot, stallGroup, steams);

    // Subtle beacon disc perched right above the storefront awning
    const beacon = createBeacon(spot);
    beacon.position.y = 2.65;
    stallGroup.add(beacon);

    // Subtle doorstep halo on pavement
    const haloGeom = new THREE.RingGeometry(0.7, 0.95, 24);
    haloGeom.rotateX(-Math.PI / 2);
    const haloColor = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xd9480f;
    const groundHalo = new THREE.Mesh(
      haloGeom,
      new THREE.MeshBasicMaterial({ color: haloColor, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    groundHalo.position.set(0, 0.02, 0.22);
    stallGroup.add(groundHalo);

    // Dedicated soft storefront glow
    const stallLight = new THREE.PointLight(0xffe8a1, 0.85, 4.0);
    stallLight.position.set(0, 1.85, 0.35);
    stallGroup.add(stallLight);

    return {
      group: stallGroup,
      steams,
      beacon,
      light: stallLight,
      groundHalo
    };
  }

  // Branch B: Open-Space FoodSpot (Physical street models: Cart, Van, Scooter, Stall, Shop)
  const [wx, wy, wz] = latLngToWorld(spot.latitude, spot.longitude);
  stallGroup.position.set(wx, wy, wz);

  const orientation = getRoadFacingOrientation(wx, wz);
  stallGroup.rotation.y = orientation.angle;

  console.log('[LOG E - BUILD STALL]', JSON.stringify({
    id: spot.id,
    name: spot.name,
    setupType: spot.setupType || 'none',
    parentGroup: stallGroup.name,
    initialPosition: { x: Number(wx.toFixed(4)), y: Number(wy.toFixed(4)), z: Number(wz.toFixed(4)) },
    finalPosition: {
      x: Number(stallGroup.position.x.toFixed(4)),
      y: Number(stallGroup.position.y.toFixed(4)),
      z: Number(stallGroup.position.z.toFixed(4))
    }
  }));

  // 1. KUMAR KADAI (Kothu Parotta - Live cast iron tawa sizzle)
  if (spot.stallType === 'tawa') {
    // Base counter / table
    const tableGeom = new THREE.BoxGeometry(2.2, 0.9, 1.2);
    const tableMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
    const table = new THREE.Mesh(tableGeom, tableMat);
    table.position.y = 0.45;
    stallGroup.add(table);

    // Cast iron big flat tawa
    const tawaGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.08, 16);
    const tawaMat = new THREE.MeshLambertMaterial({ color: 0x1f2421 });
    const tawa = new THREE.Mesh(tawaGeom, tawaMat);
    tawa.position.set(-0.35, 0.94, 0);
    stallGroup.add(tawa);

    // Kothu egg & parotta sizzle mix on tawa
    const sizzleGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 12);
    const sizzleMat = new THREE.MeshLambertMaterial({ color: 0xd97724 });
    const sizzle = new THREE.Mesh(sizzleGeom, sizzleMat);
    sizzle.position.set(-0.35, 0.98, 0);
    stallGroup.add(sizzle);

    // Two metal steel chopping blades
    const bladeGeom = new THREE.BoxGeometry(0.06, 0.2, 0.16);
    const bladeMat = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
    const blade1 = new THREE.Mesh(bladeGeom, bladeMat);
    blade1.position.set(-0.25, 1.05, 0.1);
    blade1.rotation.z = -0.2;
    const blade2 = blade1.clone();
    blade2.position.set(-0.45, 1.05, -0.05);
    blade2.rotation.z = 0.25;
    stallGroup.add(blade1, blade2);

    // Warm awning
    const awning = createStripedAwning(2.6, 1.6, PALETTE.awningRed, PALETTE.awningWhite);
    awning.position.set(0, 2.2, 0.2);
    stallGroup.add(awning);

    // Corner poles for awning
    const poleGeom = new THREE.CylinderGeometry(0.03, 0.03, 2.2);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const p1 = new THREE.Mesh(poleGeom, poleMat);
    p1.position.set(-1.1, 1.1, -0.5);
    const p2 = p1.clone();
    p2.position.set(1.1, 1.1, -0.5);
    const p3 = p1.clone();
    p3.position.set(-1.1, 1.1, 0.7);
    const p4 = p1.clone();
    p4.position.set(1.1, 1.1, 0.7);
    stallGroup.add(p1, p2, p3, p4);

    // Customer wooden bench
    const benchGeom = new THREE.BoxGeometry(1.6, 0.45, 0.4);
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x6e473b });
    const bench = new THREE.Mesh(benchGeom, benchMat);
    bench.position.set(0, 0.22, 1.2);
    stallGroup.add(bench);

    // Signboard
    const signTex = createSignTexture('KUMAR KADAI', 'குமார் கடை • Kothu Parotta', '#a82c1f', '#ffffff');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.05), signMat);
    signMesh.position.set(0, 2.4, 0.85);
    stallGroup.add(signMesh);

    // Steam puffs
    for (let i = 0; i < 3; i++) {
      const sGeom = new THREE.SphereGeometry(0.1 + i * 0.04, 6, 6);
      const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const sMesh = new THREE.Mesh(sGeom, sMat);
      sMesh.position.set(-0.35 + (Math.random() - 0.5) * 0.1, 1.15 + i * 0.25, (Math.random() - 0.5) * 0.1);
      sMesh.userData = { initialY: sMesh.position.y, speed: 0.015 + i * 0.005 };
      stallGroup.add(sMesh);
      steams.push(sMesh);
    }
  }

  // 2. SELVI TEA STALL (Brass Samovar + Bun Butter Jam)
  else if (spot.stallType === 'tea-stall') {
    // Yellow painted wooden tea kiosk
    const kioskGeom = new THREE.BoxGeometry(2.0, 1.0, 1.3);
    const kioskMat = new THREE.MeshLambertMaterial({ color: 0xe69500 });
    const kiosk = new THREE.Mesh(kioskGeom, kioskMat);
    kiosk.position.y = 0.5;
    stallGroup.add(kiosk);

    // Brass Tea Samovar/Boiler
    const boilerGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.7, 12);
    const boilerMat = new THREE.MeshLambertMaterial({ color: PALETTE.brass });
    const boiler = new THREE.Mesh(boilerGeom, boilerMat);
    boiler.position.set(-0.5, 1.35, 0.1);
    stallGroup.add(boiler);

    // Small brass boiler dome cap
    const domeGeom = new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeom, boilerMat);
    dome.position.set(-0.5, 1.7, 0.1);
    stallGroup.add(dome);

    // Glass bakery / bun display case
    const glassCaseGeom = new THREE.BoxGeometry(0.8, 0.5, 0.4);
    const glassCaseMat = new THREE.MeshLambertMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6 });
    const glassCase = new THREE.Mesh(glassCaseGeom, glassCaseMat);
    glassCase.position.set(0.45, 1.25, 0.1);
    stallGroup.add(glassCase);

    // Stacked buns inside
    const bunGeom = new THREE.BoxGeometry(0.18, 0.12, 0.18);
    const bunMat = new THREE.MeshLambertMaterial({ color: 0xd48039 });
    for (let i = -1; i <= 1; i++) {
      const bun = new THREE.Mesh(bunGeom, bunMat);
      bun.position.set(0.45 + i * 0.2, 1.15, 0.1);
      stallGroup.add(bun);
    }

    // Two small round plastic stools (red & blue)
    const stoolGeom = new THREE.CylinderGeometry(0.2, 0.22, 0.35, 8);
    const stool1 = new THREE.Mesh(stoolGeom, new THREE.MeshLambertMaterial({ color: 0xd9381e }));
    stool1.position.set(-0.5, 0.18, 1.1);
    const stool2 = new THREE.Mesh(stoolGeom, new THREE.MeshLambertMaterial({ color: 0x1971c2 }));
    stool2.position.set(0.5, 0.18, 1.1);
    stallGroup.add(stool1, stool2);

    // Striped Awning
    const awning = createStripedAwning(2.4, 1.5, PALETTE.awningYellow, 0x3d7099);
    awning.position.set(0, 2.15, 0.2);
    stallGroup.add(awning);

    // Signboard
    const signTex = createSignTexture('SELVI TEA STALL', 'செல்வி டீ • Chai & Bun Butter', '#1a365d', '#ffdf78');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.48, 0.05), signMat);
    signMesh.position.set(0, 2.38, 0.85);
    stallGroup.add(signMesh);

    // Tea steam
    for (let i = 0; i < 3; i++) {
      const sGeom = new THREE.SphereGeometry(0.08 + i * 0.03, 6, 6);
      const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const sMesh = new THREE.Mesh(sGeom, sMat);
      sMesh.position.set(-0.5, 1.8 + i * 0.2, 0.1);
      sMesh.userData = { initialY: sMesh.position.y, speed: 0.012 + i * 0.004 };
      stallGroup.add(sMesh);
      steams.push(sMesh);
    }
  }

  // 3. MANI BAJJI KADAI (Roadside Bajji Pushcart with Wheels & Kadai)
  else if (spot.stallType === 'bajji-cart') {
    // Pushcart wooden deck
    const cartGeom = new THREE.BoxGeometry(1.8, 0.15, 1.1);
    const cartMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const cart = new THREE.Mesh(cartGeom, cartMat);
    cart.position.y = 0.65;
    stallGroup.add(cart);

    // Cart 4 wooden legs
    const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.65);
    for (const lx of [-0.75, 0.75]) {
      for (const lz of [-0.45, 0.45]) {
        const leg = new THREE.Mesh(legGeom, cartMat);
        leg.position.set(lx, 0.32, lz);
        stallGroup.add(leg);
      }
    }

    // Two big classic cart wheels on sides
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
    const w1 = new THREE.Mesh(wheelGeom, wheelMat);
    w1.position.set(0, 0.38, 0.58);
    const w2 = w1.clone();
    w2.position.set(0, 0.38, -0.58);
    stallGroup.add(w1, w2);

    // Deep Kadai (wok) on cart
    const wokGeom = new THREE.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    wokGeom.rotateX(Math.PI);
    const wokMat = new THREE.MeshLambertMaterial({ color: 0x212529 });
    const wok = new THREE.Mesh(wokGeom, wokMat);
    wok.position.set(-0.35, 0.82, 0);
    stallGroup.add(wok);

    // Golden boiling oil
    const oilGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 12);
    const oilMat = new THREE.MeshLambertMaterial({ color: 0xf59f00, emissive: 0xd97706, emissiveIntensity: 0.3 });
    const oil = new THREE.Mesh(oilGeom, oilMat);
    oil.position.set(-0.35, 0.83, 0);
    stallGroup.add(oil);

    // Stainless steel bajji draining tray with fried golden bajjis
    const trayGeom = new THREE.BoxGeometry(0.65, 0.06, 0.7);
    const trayMat = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
    const tray = new THREE.Mesh(trayGeom, trayMat);
    tray.position.set(0.4, 0.75, 0);
    stallGroup.add(tray);

    // Mirchi bajjis (small golden elongated boxes)
    const bajjiGeom = new THREE.BoxGeometry(0.12, 0.08, 0.24);
    const bajjiMat = new THREE.MeshLambertMaterial({ color: 0xe8590c });
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(bajjiGeom, bajjiMat);
      b.position.set(0.3 + (i % 2) * 0.2, 0.82, -0.15 + Math.floor(i / 2) * 0.3);
      b.rotation.y = 0.2 * i;
      stallGroup.add(b);
    }

    // Bamboo pole with warm hanging bulb
    const bambooPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8), new THREE.MeshLambertMaterial({ color: 0xb58900 }));
    bambooPole.position.set(-0.7, 1.5, 0);
    bambooPole.rotation.z = -0.15;
    stallGroup.add(bambooPole);

    // Warm hanging bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
    bulb.position.set(-0.4, 2.2, 0);
    stallGroup.add(bulb);

    // Signboard
    const signTex = createSignTexture('MANI BAJJI KADAI', 'மணி பஜ்ஜி • Hot Mirchi Bajji', '#c92a2a', '#ffffff');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.05), signMat);
    signMesh.position.set(0, 1.6, 0.6);
    stallGroup.add(signMesh);
  }

  // 4. RAHMAN SHAWARMA (Vertical Rotisserie Spit & Modern Grill counter)
  else if (spot.stallType === 'shawarma') {
    // Stainless steel counter
    const counterGeom = new THREE.BoxGeometry(2.0, 0.95, 1.1);
    const counterMat = new THREE.MeshLambertMaterial({ color: 0xced4da });
    const counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.y = 0.48;
    stallGroup.add(counter);

    // Vertical rotisserie back-heater tower
    const towerGeom = new THREE.BoxGeometry(0.4, 1.1, 0.3);
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x495057 });
    const tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-0.45, 1.5, -0.2);
    stallGroup.add(tower);

    // Glowing heating grill element
    const grillElement = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.9, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xff4500, emissive: 0xff3b00, emissiveIntensity: 0.6 })
    );
    grillElement.position.set(-0.45, 1.5, -0.04);
    stallGroup.add(grillElement);

    // Conical shawarma meat spit
    const spitGeom = new THREE.ConeGeometry(0.2, 0.75, 10);
    spitGeom.rotateX(Math.PI); // inverted cone shape of shawarma meat
    const spitMat = new THREE.MeshLambertMaterial({ color: 0x862e9c });
    const spit = new THREE.Mesh(spitGeom, spitMat);
    spit.position.set(-0.45, 1.5, 0.12);
    stallGroup.add(spit);

    // Glass partition screen
    const glassGeom = new THREE.BoxGeometry(1.8, 0.5, 0.04);
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xe7f5ff, transparent: true, opacity: 0.5 });
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.set(0, 1.2, 0.45);
    stallGroup.add(glass);

    // Purple modern canopy
    const canopy = createStripedAwning(2.2, 1.4, 0x7048e8, 0x212529);
    canopy.position.set(0, 2.2, 0.2);
    stallGroup.add(canopy);

    // Signboard
    const signTex = createSignTexture('RAHMAN SHAWARMA', 'ரஹ்மான் ஷவர்மா • Rolls & Platters', '#49126d', '#ff922b');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.05), signMat);
    signMesh.position.set(0, 2.4, 0.8);
    stallGroup.add(signMesh);
  }

  // 5. MURUGAN JUICE CORNER (Fruit crates, citrus press, colorful counter)
  else if (spot.stallType === 'juice-stall') {
    // Turquoise juice counter
    const boothGeom = new THREE.BoxGeometry(1.9, 0.95, 1.1);
    const boothMat = new THREE.MeshLambertMaterial({ color: 0x0ca678 });
    const booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.y = 0.48;
    stallGroup.add(booth);

    // Fruit crates in front
    const crateGeom = new THREE.BoxGeometry(0.5, 0.35, 0.35);
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const crate1 = new THREE.Mesh(crateGeom, crateMat);
    crate1.position.set(-0.5, 0.18, 0.7);
    const crate2 = new THREE.Mesh(crateGeom, crateMat);
    crate2.position.set(0.1, 0.18, 0.7);
    stallGroup.add(crate1, crate2);

    // Colorful oranges & watermelons in crates
    const fruitGeom = new THREE.SphereGeometry(0.08, 6, 6);
    const orangeMat = new THREE.MeshLambertMaterial({ color: 0xf76707 });
    const melonMat = new THREE.MeshLambertMaterial({ color: 0x2b8a3e });
    for (let i = 0; i < 3; i++) {
      const orange = new THREE.Mesh(fruitGeom, orangeMat);
      orange.position.set(-0.6 + i * 0.12, 0.38, 0.7);
      stallGroup.add(orange);

      const melon = new THREE.Mesh(fruitGeom, melonMat);
      melon.position.set(0.0 + i * 0.12, 0.38, 0.7);
      stallGroup.add(melon);
    }

    // Chrome citrus press machine
    const pressGeom = new THREE.BoxGeometry(0.15, 0.4, 0.2);
    const pressMat = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
    const press = new THREE.Mesh(pressGeom, pressMat);
    press.position.set(0.5, 1.15, 0.1);
    stallGroup.add(press);

    // Green canopy
    const canopy = createStripedAwning(2.3, 1.5, 0x20c997, 0xffffff);
    canopy.position.set(0, 2.2, 0.2);
    stallGroup.add(canopy);

    // Signboard
    const signTex = createSignTexture('MURUGAN JUICE', 'முருகன் ஜூஸ் • Fresh Fruit Juice', '#087f5b', '#ffffff');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.05), signMat);
    signMesh.position.set(0, 2.4, 0.8);
    stallGroup.add(signMesh);
  } else {
    // 6. DYNAMIC SOUTH INDIAN STREET MODELS (Selected by physical setupType)
    if (spot.locationType !== 'existing-building') {
      const st = spot.setupType || 'cart';
      if (st === 'van') {
        buildVanModel(spot, stallGroup, steams);
      } else if (st === 'scooter') {
        buildScooterModel(spot, stallGroup, steams);
      } else if (st === 'shop') {
        buildShopModel(spot, stallGroup, steams);
      } else if (st === 'stall') {
        buildStallModel(spot, stallGroup, steams);
      } else {
        buildCartModel(spot, stallGroup, steams);
      }
    }
  }

  // Floating beacon above stall
  const beacon = createBeacon(spot);
  stallGroup.add(beacon);

  // Subtle ground affordance halo on pavement (communicates interactivity)
  const haloGeom = new THREE.RingGeometry(1.2, 1.45, 32);
  haloGeom.rotateX(-Math.PI / 2);
  const haloColor = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xffa94d;
  const haloMat = new THREE.MeshBasicMaterial({
    color: haloColor,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const groundHalo = new THREE.Mesh(haloGeom, haloMat);
  groundHalo.name = 'groundHalo';
  groundHalo.position.y = 0.02;
  stallGroup.add(groundHalo);

  // Dedicated warm stall point light for inviting neighborhood glow
  const stallLight = new THREE.PointLight(0xffd166, 1.2, 5.5);
  stallLight.position.set(0, 1.8, 0.3);
  stallGroup.add(stallLight);

  return {
    group: stallGroup,
    steams,
    beacon,
    light: stallLight,
    groundHalo
  };
}

// -------------------------------------------------------------
// SETUP TYPE 3D BUILDERS (All meshes use strict local offsets)
// -------------------------------------------------------------

function buildVanModel(spot: FoodSpot, stallGroup: THREE.Group, steams: THREE.Mesh[]) {
  const stallColorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0x2b8a3e;

  // 1. Undercarriage chassis
  const chassisGeom = new THREE.BoxGeometry(2.0, 0.16, 3.2);
  const chassisMat = new THREE.MeshLambertMaterial({ color: 0x22262d });
  const chassis = new THREE.Mesh(chassisGeom, chassisMat);
  chassis.name = 'van-chassis';
  chassis.position.set(0, 0.28, 0);
  stallGroup.add(chassis);

  // 2. 4 Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const wheelPositions = [
    [-0.98, 0.28, 1.0],
    [0.98, 0.28, 1.0],
    [-0.98, 0.28, -1.0],
    [0.98, 0.28, -1.0]
  ];
  wheelPositions.forEach(([x, y, z], idx) => {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.name = `van-wheel-${idx}`;
    wheel.position.set(x, y, z);
    stallGroup.add(wheel);
  });

  // 3. Van Main Body (Kitchen & storage)
  const bodyGeom = new THREE.BoxGeometry(1.9, 1.35, 2.0);
  const bodyMat = new THREE.MeshLambertMaterial({ color: stallColorHex });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.name = 'van-body';
  body.position.set(0, 1.03, -0.4);
  stallGroup.add(body);

  // 4. Cab Front
  const cabGeom = new THREE.BoxGeometry(1.82, 0.95, 1.0);
  const cabMat = new THREE.MeshLambertMaterial({ color: stallColorHex });
  const cab = new THREE.Mesh(cabGeom, cabMat);
  cab.name = 'van-cab';
  cab.position.set(0, 0.83, 1.0);
  stallGroup.add(cab);

  // 5. Windshield
  const windshieldGeom = new THREE.BoxGeometry(1.65, 0.45, 0.08);
  const glassMat = new THREE.MeshLambertMaterial({ color: 0xcbe4f9, transparent: true, opacity: 0.65 });
  const windshield = new THREE.Mesh(windshieldGeom, glassMat);
  windshield.name = 'van-windshield';
  windshield.position.set(0, 1.05, 1.48);
  windshield.rotation.x = -0.22;
  stallGroup.add(windshield);

  // 6. Front Grille & Bumper
  const bumperGeom = new THREE.BoxGeometry(1.9, 0.18, 0.16);
  const bumperMat = new THREE.MeshLambertMaterial({ color: 0x343a40 });
  const bumper = new THREE.Mesh(bumperGeom, bumperMat);
  bumper.name = 'van-bumper';
  bumper.position.set(0, 0.28, 1.54);
  stallGroup.add(bumper);

  // Headlights
  const lightGeom = new THREE.BoxGeometry(0.24, 0.14, 0.05);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff3bf });
  const hl1 = new THREE.Mesh(lightGeom, lightMat);
  hl1.name = 'van-headlight-L';
  hl1.position.set(-0.65, 0.52, 1.52);
  const hl2 = hl1.clone();
  hl2.name = 'van-headlight-R';
  hl2.position.x = 0.65;
  stallGroup.add(hl1, hl2);

  // 7. Side Serving Hatch Counter
  const shelfGeom = new THREE.BoxGeometry(0.4, 0.06, 1.4);
  const shelfMat = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
  const shelf = new THREE.Mesh(shelfGeom, shelfMat);
  shelf.name = 'van-counter';
  shelf.position.set(0.98, 0.95, -0.4);
  stallGroup.add(shelf);

  // Flip-up hatch awning
  const hatchGeom = new THREE.BoxGeometry(0.5, 0.04, 1.45);
  const hatchMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const hatch = new THREE.Mesh(hatchGeom, hatchMat);
  hatch.name = 'van-hatch-awning';
  hatch.position.set(1.08, 1.62, -0.4);
  hatch.rotation.z = -0.35;
  stallGroup.add(hatch);

  // 8. Roof Signboard
  const signTex = createSignTexture(
    spot.name.toUpperCase(),
    spot.tamilName ? `${spot.tamilName} • Food Truck` : 'Food Truck',
    spot.stallColor || '#2b8a3e',
    '#ffffff'
  );
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.46, 0.05), signMat);
  signMesh.name = 'van-sign';
  signMesh.position.set(0, 2.0, -0.4);
  stallGroup.add(signMesh);

  // 9. Steam puffs from kitchen vent
  for (let i = 0; i < 3; i++) {
    const sGeom = new THREE.SphereGeometry(0.1 + i * 0.03, 6, 6);
    const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const sMesh = new THREE.Mesh(sGeom, sMat);
    sMesh.name = `van-steam-${i}`;
    sMesh.position.set(0.4, 1.8 + i * 0.22, -0.4);
    sMesh.userData = { initialY: sMesh.position.y, speed: 0.015 + i * 0.004 };
    stallGroup.add(sMesh);
    steams.push(sMesh);
  }
}

function buildScooterModel(spot: FoodSpot, stallGroup: THREE.Group, steams: THREE.Mesh[]) {
  const stallColorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xf59f00;

  // 1. Two Wheels (front & rear)
  const wheelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1f2421 });

  const fWheel = new THREE.Mesh(wheelGeom, wheelMat);
  fWheel.name = 'scooter-wheel-front';
  fWheel.position.set(0, 0.28, 0.75);
  stallGroup.add(fWheel);

  const rWheel = new THREE.Mesh(wheelGeom, wheelMat);
  rWheel.name = 'scooter-wheel-rear';
  rWheel.position.set(0, 0.28, -0.6);
  stallGroup.add(rWheel);

  // 2. Central Scooter Body & Footboard
  const bodyGeom = new THREE.BoxGeometry(0.45, 0.32, 1.1);
  const bodyMat = new THREE.MeshLambertMaterial({ color: stallColorHex });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.name = 'scooter-body';
  body.position.set(0, 0.36, 0.08);
  stallGroup.add(body);

  // Front Apron & Steering Column
  const apronGeom = new THREE.BoxGeometry(0.42, 0.65, 0.16);
  const apron = new THREE.Mesh(apronGeom, bodyMat);
  apron.name = 'scooter-apron';
  apron.position.set(0, 0.65, 0.58);
  stallGroup.add(apron);

  // Handlebars
  const handleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.72, 8);
  handleGeom.rotateZ(Math.PI / 2);
  const handleMat = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.name = 'scooter-handle';
  handle.position.set(0, 0.98, 0.58);
  stallGroup.add(handle);

  // Headlight
  const hlGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
  hlGeom.rotateX(Math.PI / 2);
  const hl = new THREE.Mesh(hlGeom, new THREE.MeshBasicMaterial({ color: 0xfffae6 }));
  hl.name = 'scooter-headlight';
  hl.position.set(0, 0.92, 0.68);
  stallGroup.add(hl);

  // Rider Seat
  const seatGeom = new THREE.BoxGeometry(0.35, 0.12, 0.45);
  const seatMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
  const seat = new THREE.Mesh(seatGeom, seatMat);
  seat.name = 'scooter-seat';
  seat.position.set(0, 0.6, 0.05);
  stallGroup.add(seat);

  // 3. Rear Cargo Food Delivery Box
  const cargoGeom = new THREE.BoxGeometry(0.9, 0.8, 0.85);
  const cargoMat = new THREE.MeshLambertMaterial({ color: stallColorHex });
  const cargo = new THREE.Mesh(cargoGeom, cargoMat);
  cargo.name = 'scooter-cargo-box';
  cargo.position.set(0, 0.85, -0.68);
  stallGroup.add(cargo);

  // Stainless Steel Hot Tiffin Canister on top
  const tiffinGeom = new THREE.CylinderGeometry(0.2, 0.22, 0.4, 12);
  const tiffinMat = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
  const tiffin = new THREE.Mesh(tiffinGeom, tiffinMat);
  tiffin.name = 'scooter-tiffin';
  tiffin.position.set(0.18, 1.45, -0.68);
  stallGroup.add(tiffin);

  // Small roadside umbrella pole & canopy mounted on scooter
  const poleGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x495057 });
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.name = 'scooter-umbrella-pole';
  pole.position.set(-0.35, 1.25, -0.68);
  stallGroup.add(pole);

  // Umbrella canopy
  const umbGeom = new THREE.ConeGeometry(0.85, 0.35, 8);
  const umbMat = new THREE.MeshLambertMaterial({ color: 0xe03131 });
  const umbrella = new THREE.Mesh(umbGeom, umbMat);
  umbrella.name = 'scooter-umbrella';
  umbrella.position.set(-0.35, 2.15, -0.68);
  stallGroup.add(umbrella);

  // Signboard attached to food box
  const signTex = createSignTexture(
    spot.name.toUpperCase(),
    spot.tamilName ? `${spot.tamilName} • Mobile Food` : 'Mobile Food',
    spot.stallColor || '#f59f00',
    '#ffffff'
  );
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 0.04), signMat);
  signMesh.name = 'scooter-sign';
  signMesh.position.set(0, 1.35, -0.22);
  stallGroup.add(signMesh);

  // Steam puffs from tiffin container
  for (let i = 0; i < 2; i++) {
    const sGeom = new THREE.SphereGeometry(0.08 + i * 0.03, 6, 6);
    const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const sMesh = new THREE.Mesh(sGeom, sMat);
    sMesh.name = `scooter-steam-${i}`;
    sMesh.position.set(0.18, 1.75 + i * 0.2, -0.68);
    sMesh.userData = { initialY: sMesh.position.y, speed: 0.015 + i * 0.005 };
    stallGroup.add(sMesh);
    steams.push(sMesh);
  }
}

function buildShopModel(spot: FoodSpot, stallGroup: THREE.Group, steams: THREE.Mesh[]) {
  const stallColorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0x1971c2;

  // 1. Plinth / Foundation Base
  const baseGeom = new THREE.BoxGeometry(2.4, 0.18, 1.8);
  const baseMat = new THREE.MeshLambertMaterial({ color: PALETTE.curb });
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.name = 'shop-base';
  base.position.set(0, 0.09, 0);
  stallGroup.add(base);

  // 2. Solid Masonry Structure (Walls)
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f2 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 0.15), wallMat);
  backWall.name = 'shop-back-wall';
  backWall.position.set(0, 1.05, -0.8);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 1.6), wallMat);
  leftWall.name = 'shop-left-wall';
  leftWall.position.set(-1.06, 1.05, 0);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 1.6), wallMat);
  rightWall.name = 'shop-right-wall';
  rightWall.position.set(1.06, 1.05, 0);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 0.25), wallMat);
  lintel.name = 'shop-lintel';
  lintel.position.set(0, 1.85, 0.7);
  stallGroup.add(backWall, leftWall, rightWall, lintel);

  // 3. Roll-up Shutter (Rolled up half way)
  const shutterHousing = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.28, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x495057 })
  );
  shutterHousing.name = 'shop-shutter-box';
  shutterHousing.position.set(0, 1.75, 0.65);

  const rolledShutter = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.45, 0.06),
    new THREE.MeshLambertMaterial({ color: stallColorHex })
  );
  rolledShutter.name = 'shop-shutter-slats';
  rolledShutter.position.set(0, 1.48, 0.65);
  stallGroup.add(shutterHousing, rolledShutter);

  // 4. Granite Counter Shelf in opening
  const counterGeom = new THREE.BoxGeometry(2.1, 0.1, 0.5);
  const counterMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
  const counter = new THREE.Mesh(counterGeom, counterMat);
  counter.name = 'shop-counter';
  counter.position.set(0, 0.82, 0.65);
  stallGroup.add(counter);

  // Lower front masonry wall below counter
  const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.73, 0.15), wallMat);
  lowerWall.name = 'shop-lower-wall';
  lowerWall.position.set(0, 0.45, 0.68);
  stallGroup.add(lowerWall);

  // 5. Slanted Tiled Awning Roof
  const awningGeom = new THREE.BoxGeometry(2.5, 0.08, 0.9);
  awningGeom.rotateX(0.3);
  const awningMat = new THREE.MeshLambertMaterial({ color: PALETTE.roofTileMangalore });
  const awning = new THREE.Mesh(awningGeom, awningMat);
  awning.name = 'shop-awning';
  awning.position.set(0, 2.15, 0.85);
  stallGroup.add(awning);

  // 6. Overhead Authentic Shop Signboard
  const signTex = createSignTexture(
    spot.name.toUpperCase(),
    spot.tamilName ? `${spot.tamilName} • Kiosk` : spot.category,
    spot.stallColor || '#1971c2',
    '#ffffff'
  );
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.05), signMat);
  signMesh.name = 'shop-sign';
  signMesh.position.set(0, 2.55, 0.82);
  stallGroup.add(signMesh);

  // Subtle interior warm bulb
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  bulb.name = 'shop-bulb';
  bulb.position.set(0, 1.6, 0.1);
  stallGroup.add(bulb);

  // Steam puffs from interior counter
  for (let i = 0; i < 2; i++) {
    const sGeom = new THREE.SphereGeometry(0.08 + i * 0.03, 6, 6);
    const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const sMesh = new THREE.Mesh(sGeom, sMat);
    sMesh.name = `shop-steam-${i}`;
    sMesh.position.set(0.4, 1.05 + i * 0.22, 0.5);
    sMesh.userData = { initialY: sMesh.position.y, speed: 0.015 + i * 0.005 };
    stallGroup.add(sMesh);
    steams.push(sMesh);
  }
}

function buildStallModel(spot: FoodSpot, stallGroup: THREE.Group, steams: THREE.Mesh[]) {
  const stallColorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xe03131;

  // 1. 4 Corner Bamboo / Timber Uprights
  const poleGeom = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
  const poles = [
    [-1.05, 1.1, -0.6],
    [1.05, 1.1, -0.6],
    [-1.05, 1.1, 0.65],
    [1.05, 1.1, 0.65]
  ];
  poles.forEach(([x, y, z], idx) => {
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.name = `stall-pole-${idx}`;
    pole.position.set(x, y, z);
    stallGroup.add(pole);
  });

  // 2. Wooden Table / Food Prep Counter
  const tableGeom = new THREE.BoxGeometry(2.1, 0.85, 1.15);
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x6e523f });
  const table = new THREE.Mesh(tableGeom, tableMat);
  table.name = 'stall-table';
  table.position.set(0, 0.43, 0);
  stallGroup.add(table);

  // Stainless steel top
  const topGeom = new THREE.BoxGeometry(2.15, 0.06, 1.2);
  const top = new THREE.Mesh(topGeom, new THREE.MeshLambertMaterial({ color: PALETTE.steel }));
  top.name = 'stall-counter-top';
  top.position.set(0, 0.88, 0);
  stallGroup.add(top);

  // Large cooking vessel / kadai on table
  const potGeom = new THREE.CylinderGeometry(0.38, 0.3, 0.25, 14);
  const potMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
  const pot = new THREE.Mesh(potGeom, potMat);
  pot.name = 'stall-cooking-pot';
  pot.position.set(-0.4, 1.02, 0.05);
  stallGroup.add(pot);

  // 3. Draped Fabric / Tarpaulin Canopy Roof
  const canopyGeom = new THREE.BoxGeometry(2.35, 0.06, 1.55);
  canopyGeom.rotateX(0.12);
  const canopyMat = new THREE.MeshLambertMaterial({ color: stallColorHex });
  const canopy = new THREE.Mesh(canopyGeom, canopyMat);
  canopy.name = 'stall-canopy';
  canopy.position.set(0, 2.2, 0.05);
  stallGroup.add(canopy);

  // 4. Warm Hanging Light Bulb on wire
  const cordGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.45, 6);
  const cord = new THREE.Mesh(cordGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
  cord.name = 'stall-bulb-cord';
  cord.position.set(0.2, 1.95, 0.1);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd43b }));
  bulb.name = 'stall-bulb';
  bulb.position.set(0.2, 1.7, 0.1);
  stallGroup.add(cord, bulb);

  // 5. Hanging Signboard
  const signTex = createSignTexture(
    spot.name.toUpperCase(),
    spot.tamilName ? `${spot.tamilName} • Roadside Stall` : spot.category,
    spot.stallColor || '#e03131',
    '#ffffff'
  );
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.44, 0.04), signMat);
  signMesh.name = 'stall-sign';
  signMesh.position.set(0, 2.38, 0.72);
  stallGroup.add(signMesh);

  // Steam puffs from pot
  for (let i = 0; i < 3; i++) {
    const sGeom = new THREE.SphereGeometry(0.1 + i * 0.03, 6, 6);
    const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const sMesh = new THREE.Mesh(sGeom, sMat);
    sMesh.name = `stall-steam-${i}`;
    sMesh.position.set(-0.4 + (Math.random() - 0.5) * 0.1, 1.2 + i * 0.22, 0.05);
    sMesh.userData = { initialY: sMesh.position.y, speed: 0.015 + i * 0.005 };
    stallGroup.add(sMesh);
    steams.push(sMesh);
  }
}

function buildCartModel(spot: FoodSpot, stallGroup: THREE.Group, steams: THREE.Mesh[]) {
  const stallColorHex = spot.stallColor ? parseInt(spot.stallColor.replace('#', '0x')) : 0xd9480f;

  // 1. Pushcart Wooden Deck
  const deckGeom = new THREE.BoxGeometry(1.9, 0.14, 1.15);
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const deck = new THREE.Mesh(deckGeom, deckMat);
  deck.name = 'cart-deck';
  deck.position.set(0, 0.65, 0);
  stallGroup.add(deck);

  // Counter Top Shelf
  const topGeom = new THREE.BoxGeometry(1.95, 0.05, 1.2);
  const top = new THREE.Mesh(topGeom, new THREE.MeshLambertMaterial({ color: PALETTE.steel }));
  top.name = 'cart-counter-top';
  top.position.set(0, 0.74, 0);
  stallGroup.add(top);

  // Front Support Legs
  const legGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8);
  const leg1 = new THREE.Mesh(legGeom, deckMat);
  leg1.name = 'cart-leg-FL';
  leg1.position.set(0.75, 0.32, -0.45);
  const leg2 = leg1.clone();
  leg2.name = 'cart-leg-FR';
  leg2.position.z = 0.45;
  stallGroup.add(leg1, leg2);

  // 2 Large Cart Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
  const w1 = new THREE.Mesh(wheelGeom, wheelMat);
  w1.name = 'cart-wheel-L';
  w1.position.set(-0.4, 0.38, 0.61);
  const w2 = w1.clone();
  w2.name = 'cart-wheel-R';
  w2.position.z = -0.61;
  stallGroup.add(w1, w2);

  // Push Handle Bar at back
  const handleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8);
  handleGeom.rotateX(Math.PI / 2);
  const handle = new THREE.Mesh(handleGeom, deckMat);
  handle.name = 'cart-handle';
  handle.position.set(-1.0, 0.78, 0);
  stallGroup.add(handle);

  // 4 Canopy Corner Poles
  const poleGeom = new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x495057 });
  const poles = [
    [-0.85, 1.45, -0.5],
    [0.85, 1.45, -0.5],
    [-0.85, 1.45, 0.5],
    [0.85, 1.45, 0.5]
  ];
  poles.forEach(([x, y, z], idx) => {
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.name = `cart-pole-${idx}`;
    pole.position.set(x, y, z);
    stallGroup.add(pole);
  });

  // Striped Canopy Awning
  const canopy = createStripedAwning(2.2, 1.4, stallColorHex, 0xffffff);
  canopy.name = 'cart-canopy';
  canopy.position.set(0, 2.18, 0.1);
  stallGroup.add(canopy);

  // Custom Signboard
  const signTex = createSignTexture(
    spot.name.toUpperCase(),
    spot.tamilName ? `${spot.tamilName} • ${spot.category}` : spot.category,
    spot.stallColor || '#d9480f',
    '#ffffff'
  );
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.44, 0.04), signMat);
  signMesh.name = 'cart-sign';
  signMesh.position.set(0, 2.4, 0.65);
  stallGroup.add(signMesh);

  // Steam puffs
  for (let i = 0; i < 2; i++) {
    const sGeom = new THREE.SphereGeometry(0.1 + i * 0.03, 6, 6);
    const sMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const sMesh = new THREE.Mesh(sGeom, sMat);
    sMesh.name = `cart-steam-${i}`;
    sMesh.position.set((Math.random() - 0.5) * 0.4, 1.05 + i * 0.22, 0);
    sMesh.userData = { initialY: sMesh.position.y, speed: 0.015 + i * 0.005 };
    stallGroup.add(sMesh);
    steams.push(sMesh);
  }
}
