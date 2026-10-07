import * as THREE from 'three';

// Balanced, airy stylized city palette inspired by WhereWeWork color hierarchy:
// Light sky + Neutral buildings + Multi-green vegetation + Neutral charcoal roads + Selective accents
export const PALETTE = {
  // Ground & Pedestrian Areas (Warm cream, light sand, subtle neutral stone)
  ground: 0xe8e6df,           // Warm light cream sand
  groundFar: 0xd8d9db,        // Soft pale neutral distant apron
  roadAsphalt: 0x3e4249,      // Neutral charcoal asphalt (not brown)
  roadSecondary: 0x515661,    // Muted slate gray secondary street
  roadLineWhite: 0xf7f8fa,    // Clean crisp white lane markings
  roadLineYellow: 0xf2b73f,   // Controlled warm yellow divider line
  crosswalk: 0xf4f6f8,        // Crisp light crosswalk stripes
  curb: 0xa6aab0,             // Clean neutral gray granite curb
  curbGutter: 0x6e737c,       // Neutral street drainage gutter
  sidewalkTile: 0xdfdad0,     // Warm cream / light stone pavers
  sidewalkRedBrick: 0xb57062, // Subdued terracotta paver border
  cobbleLane: 0x9fa4ad,       // Neutral light-charcoal / granite cobblestone
  compoundWall: 0xededeb,     // Off-white / light cream compound wall
  compoundWallTrim: 0xa0a4ab, // Neutral stone trim coping

  // Architecture - Mostly light/neutral with soft sage, muted green, pale blue, dusty teal, cream
  walls: [
    0xf5f5f2, // 0. Clean off-white plaster (Neutral)
    0xe8ebe8, // 1. Light chalk gray-white (Neutral)
    0xf4efe4, // 2. Warm lime-wash cream (Neutral)
    0xa3bcae, // 3. Soft heritage sage (Vegetation harmony)
    0x8eaba0, // 4. Muted green / celadon
    0x9fb3c8, // 5. Pale slate / powder blue
    0x81a8ab, // 6. Dusty coastal teal
    0xe2e5e7, // 7. Soft architectural mist gray (Neutral)
    0xd6c7b2, // 8. Pale desert sand / muted biscuit
    0xb3c3ce, // 9. Soft airy sky-gray
    0xb7c2ab, // 10. Muted olive sage
    0xbf7865  // 11. Occasional muted terracotta accent (Tasteful, controlled pop)
  ],

  // Roofs - Balanced mixture of gray, charcoal, muted terracotta, muted brown, dark green
  roofSlateGray: 0x474c54,        // Slate charcoal tile
  roofMediumGray: 0x696f78,       // Mid-tone stone gray
  roofTileMangalore: 0x9e584a,    // Muted weathered terracotta (not bright red)
  roofTileWeathered: 0x5c544d,    // Muted slate brown
  roofDarkGreen: 0x395345,        // Occasional dark forest green tile
  roofConcrete: 0xd2d5d8,         // Clean light neutral architectural concrete
  roofParapetYellow: 0xcc9933,    // Subdued brassy parapet trim
  roofWaterTankBlack: 0x22262d,   // Dark graphite Sintex water tank
  roofWaterTankWhite: 0xf0f3f6,   // White Sintex water tank

  // Shutters, Doors & Awnings (Selective accents)
  shutterBlue: 0x3b6ea5,
  shutterGreen: 0x367351,
  shutterTeal: 0x30827d,
  shutterBrown: 0x574b42,
  shutterYellow: 0xc89824,
  woodDark: 0x443b35,
  woodWarm: 0x6e523f,
  ironGate: 0x282c30,
  steel: 0xc4c8ce,
  brass: 0xd4af37,
  awningRed: 0xc94a38,
  awningWhite: 0xf8f9fa,
  awningYellow: 0xf0b832,
  awningTeal: 0x288c88,

  // Temple Gopuram - Authentic South Indian stone with gold & crimson heritage accents
  templePlinth: 0xdedad2,         // Traditional granite plinth
  templeCream: 0xf3f0e8,          // Lime-washed tiered tower
  templeGold: 0xf0b82e,           // Golden Kalasam finials
  templeRed: 0x8f353a,            // Traditional temple kumkum red accent
  templeWhite: 0xfbfaf7,          // Sacred white temple bands
  templeSandstone: 0xd4c2af,      // Heritage sandstone tier
  templeOchre: 0xc98738,          // Warm ochre trim

  // Street Infrastructure & Vehicles
  poleMetal: 0x484d54,
  poleConcrete: 0x9fa3a8,
  wireBlack: 0x272b30,
  lampWarmGlow: 0xffd269,
  busShelterBlue: 0x2272b4,
  busShelterYellow: 0xf5b722,
  autoYellow: 0xf5a524,
  autoBlack: 0x22252a,
  autoGreen: 0x2f8a4e,
  scooterYellow: 0xf5b722,
  scooterCyan: 0x20a8ba,
  scooterRed: 0xdb4242,
  scooterNavy: 0x235284,

  // Multi-Green Vegetation Spectrum (Providing strong visual contrast against buildings)
  treeTrunk: 0x453b34,
  palmTrunk: 0x544941,
  foliageLightGreen: 0x7eb859,     // Vibrant light green / sunlit canopy
  foliageMidGreen: 0x498c4a,       // Rich mid-tone lush green
  foliageDeepGreen: 0x285c39,      // Deep emerald forest green
  foliageMutedOlive: 0x586e50,     // Muted dusty olive green
  foliageNeem: 0x3d7a46,           // Shady neem green
  foliageBanyan: 0x4e853b,         // Spreading banyan green
  foliageGulmoharGreen: 0x5b9437,  // Rich Gulmohar foliage
  foliageGulmoharOrange: 0xe86846, // Soft coral-orange blossom clusters
  palmFronds: 0x2e6b48,            // Curved coconut palm fronds
  lawnGrass: 0x6ca654              // Fresh meadow lawn
};

// Procedural canvas textures for Tamil shop signboards
export function createTamilShopSignTexture(tamil: string, english: string, bg: string, textCol = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 72);

  // Border frame
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, 250, 66);

  // Tamil text
  ctx.fillStyle = textCol;
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tamil, 128, 26);

  // English text
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(english.toUpperCase(), 128, 52);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
