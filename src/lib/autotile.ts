/**
 * Autotile Rule Generation Logic
 * Ported to TypeScript for React integration
 */

export type TilesetType = 'blob' | 'transition' | 'cave';

export interface TileRule {
  n: boolean | null;
  e: boolean | null;
  s: boolean | null;
  w: boolean | null;
  tl: boolean | null;
  tr: boolean | null;
  bl: boolean | null;
  br: boolean | null;
  desc?: string;
  corner?: string;
}

export const BLOB_TILES: Record<number, TileRule> = {
  1:  {n:false,e:true, s:true, w:false, tl:null, tr:null, bl:null, br:true,  desc:"TL outer corner"},
  2:  {n:false,e:true, s:true, w:true,  tl:null, tr:null, bl:true, br:true,  desc:"Top edge"},
  3:  {n:false,e:false,s:true, w:true,  tl:null, tr:null, bl:true, br:null,  desc:"TR outer corner"},
  4:  {n:false,e:false,s:true, w:false, tl:null, tr:null, bl:null, br:null,  desc:"Top cap"},
  5:  {n:false,e:true, s:true, w:false, tl:null, tr:null, bl:null, br:false, desc:"Inner corner ES (BR notch)"},
  6:  {n:false,e:false,s:true, w:true,  tl:null, tr:null, bl:false,br:null,  desc:"Inner corner SW (BL notch)"},
  7:  {n:true, e:true, s:true, w:false, tl:null, tr:true, bl:null, br:true,  desc:"Left edge"},
  8:  {n:true, e:true, s:true, w:true,  tl:true, tr:true, bl:true, br:true,  desc:"Full center"},
  9:  {n:true, e:false,s:true, w:true,  tl:true, tr:null, bl:true, br:null,  desc:"Right edge"},
  10: {n:true, e:false,s:true, w:false, tl:null, tr:null, bl:null, br:null,  desc:"Vertical pipe"},
  11: {n:true, e:true, s:false,w:false, tl:null, tr:false,bl:null, br:null,  desc:"Inner corner NE (TR notch)"},
  12: {n:true, e:false,s:false,w:true,  tl:false,tr:null, bl:null, br:null,  desc:"Inner corner NW (TL notch)"},
  13: {n:true, e:true, s:false,w:false, tl:null, tr:true, bl:null, br:null,  desc:"BL outer corner"},
  14: {n:true, e:true, s:false,w:true,  tl:true, tr:true, bl:null, br:null,  desc:"Bottom edge"},
  15: {n:true, e:false,s:false,w:true,  tl:true, tr:null, bl:null, br:null,  desc:"BR outer corner"},
  16: {n:true, e:false,s:false,w:false, tl:null, tr:null, bl:null, br:null,  desc:"Bottom cap"},
  17: {n:true, e:true, s:true, w:true,  tl:true, tr:true, bl:true, br:false, desc:"Center, BR notch"},
  18: {n:true, e:true, s:true, w:true,  tl:true, tr:true, bl:false,br:true,  desc:"Center, BL notch"},
  19: {n:false,e:true, s:false,w:false, tl:null, tr:null, bl:null, br:null,  desc:"Left cap"},
  20: {n:false,e:true, s:false,w:true,  tl:null, tr:null, bl:null, br:null,  desc:"Horizontal pipe"},
  21: {n:false,e:false,s:false,w:true,  tl:null, tr:null, bl:null, br:null,  desc:"Right cap"},
  22: {n:false,e:false,s:false,w:false, tl:null, tr:null, bl:null, br:null,  desc:"Isolated"},
  23: {n:true, e:true, s:true, w:true,  tl:true, tr:false,bl:true, br:true,  desc:"Center, TR notch"},
  24: {n:true, e:true, s:true, w:true,  tl:false,tr:true, bl:true, br:true,  desc:"Center, TL notch"},
};

export const TRANS_TILES: Record<number, TileRule> = {
  1:  {n:false,e:true, s:true, w:false, tl:null, tr:null, bl:null, br:null, desc:"TL outer corner"},
  2:  {n:false,e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Top edge"},
  3:  {n:false,e:false,s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"TR outer corner"},
  4:  {n:true, e:true, s:true, w:false, tl:null, tr:null, bl:null, br:null, desc:"Left edge"},
  5:  {n:true, e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Center fill"},
  6:  {n:true, e:false,s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Right edge"},
  7:  {n:true, e:true, s:false,w:false, tl:null, tr:null, bl:null, br:null, desc:"BL outer corner"},
  8:  {n:true, e:true, s:false,w:true,  tl:null, tr:null, bl:null, br:null, desc:"Bottom edge"},
  9:  {n:true, e:false,s:false,w:true,  tl:null, tr:null, bl:null, br:null, desc:"BR outer corner"},
  10: {n:true, e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Inner corner TL", corner:"TL"},
  11: {n:true, e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Inner corner TR", corner:"TR"},
  12: {n:true, e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Inner corner BL", corner:"BL"},
  13: {n:true, e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Inner corner BR", corner:"BR"},
};

export const CAVE_TILES: Record<number, TileRule> = {
  1: {n:false,e:true, s:true, w:false, tl:null, tr:null, bl:null, br:null, desc:"TL corner"},
  2: {n:false,e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Top edge"},
  3: {n:false,e:false,s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"TR corner"},
  4: {n:true, e:true, s:true, w:false, tl:null, tr:null, bl:null, br:null, desc:"Left edge"},
  5: {n:true, e:true, s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Center"},
  6: {n:true, e:false,s:true, w:true,  tl:null, tr:null, bl:null, br:null, desc:"Right edge"},
  7: {n:true, e:true, s:false,w:false, tl:null, tr:null, bl:null, br:null, desc:"BL corner"},
  8: {n:true, e:true, s:false,w:true,  tl:null, tr:null, bl:null, br:null, desc:"Bottom edge"},
  9: {n:true, e:false,s:false,w:true,  tl:null, tr:null, bl:null, br:null, desc:"BR corner"},
};

export function buildRuleGrid(n: boolean, e: boolean, s: boolean, w: boolean, tl: boolean | null, tr: boolean | null, bl: boolean | null, br: boolean | null) {
  // Blob restriction: corners only matter when both adjacent edges are true
  const tl_val = (n && w) ? tl : null;
  const tr_val = (n && e) ? tr : null;
  const bl_val = (s && w) ? bl : null;
  const br_val = (s && e) ? br : null;

  return [
    [tl_val,           n ? true : false, tr_val],
    [w ? true : false, null,             e ? true : false],
    [bl_val,           s ? true : false, br_val]
  ];
}

// Generate Blob 16 rules
export function generateBlob16(tileset: Record<number, TileRule>) {
  const result: any[] = [];
  // For each of the 24 tile slots
  for (let i = 1; i <= 24; i++) {
    const tile = tileset[i];
    // Inner corner tiles get null placeholder in 16-rule mode
    if ([5, 6, 11, 12, 17, 18, 23, 24].includes(i)) {
      result.push(null);
    } else {
      result.push(buildRuleGrid(
        !!tile.n, !!tile.e, !!tile.s, !!tile.w,
        null, null, null, null
      ));
    }
  }
  return result;
}

// Generate Cave 16 rules
export function generateCave16(tileset: Record<number, TileRule>) {
  const result: any[] = [];
  // Enumerate all 16 NESW combinations
  for (let i = 0; i < 16; i++) {
    const n = !!(i & 1);
    const e = !!(i & 2);
    const s = !!(i & 4);
    const w = !!(i & 8);

    // Find best matching tile from 9 available
    let bestTile = 1;
    let maxMatches = -1;

    for (let t = 1; t <= 9; t++) {
      const tile = tileset[t];
      let matches = 0;
      if (!!tile.n === n) matches++;
      if (!!tile.e === e) matches++;
      if (!!tile.s === s) matches++;
      if (!!tile.w === w) matches++;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestTile = t;
      }
    }
    
    // In Sprite Fusion, a rule is tile-index specific? 
    // Actually, Sprite Fusion JSON expects a flat list of rules.
    // Each rule corresponds to a tile index if it's a fixed grid mapping.
    // v2 tool says: "Each rule is assigned to a tile... rule list is flat."
    // Let's stick to the v2 algorithm structure.
    result.push(buildRuleGrid(n, e, s, w, null, null, null, null));
  }
  return result;
}

export function generateTransition25(tileset: Record<number, TileRule>) {
  const rules: any[] = [];
  
  // Rules 1-9: Standard tiles (corners=true)
  for (let i = 1; i <= 9; i++) {
    const t = tileset[i];
    rules.push(buildRuleGrid(!!t.n, !!t.e, !!t.s, !!t.w, true, true, true, true));
  }

  // Rules 10-25: Inner corners
  // TL is relevant in: NW, NSW, NEW, NESW
  const patterns = [
    {n:true, e:false, s:false, w:true, tl:false, tr:true, bl:true, br:true},
    {n:true, e:false, s:true,  w:true, tl:false, tr:true, bl:true, br:true},
    {n:true, e:true,  s:false, w:true, tl:false, tr:true, bl:true, br:true},
    {n:true, e:true,  s:true,  w:true, tl:false, tr:true, bl:true, br:true},
  ];

  // For each inner corner tile (10, 11, 12, 13)
  // 10=TL, 11=TR, 12=BL, 13=BR
  
  // Actually the patterns depend on WHICH corner we are talking about.
  // TL Patterns: NW, NSW, NEW, NESW
  // TR Patterns: NE, NEW, NES, NESW
  // BL Patterns: SW, ESW, NSW, NESW
  // BR Patterns: ES, ESW, NES, NESW
  
  const cornerPatterns = [
    // TL (NW, NSW, NEW, NESW)
    [
      {n:true, e:false, s:false, w:true, tl:false, tr:true, bl:true, br:true},
      {n:true, e:false, s:true,  w:true, tl:false, tr:true, bl:true, br:true},
      {n:true, e:true,  s:false, w:true, tl:false, tr:true, bl:true, br:true},
      {n:true, e:true,  s:true,  w:true, tl:false, tr:true, bl:true, br:true},
    ],
    // TR (NE, NEW, NES, NESW)
    [
      {n:true, e:true, s:false, w:false, tl:true, tr:false, bl:true, br:true},
      {n:true, e:true, s:false, w:true,  tl:true, tr:false, bl:true, br:true},
      {n:true, e:true, s:true,  w:false, tl:true, tr:false, bl:true, br:true},
      {n:true, e:true, s:true,  w:true,  tl:true, tr:false, bl:true, br:true},
    ],
    // BL (SW, ESW, NSW, NESW)
    [
      {n:false, e:false, s:true, w:true, tl:true, tr:true, bl:false, br:true},
      {n:false, e:true,  s:true, w:true, tl:true, tr:true, bl:false, br:true},
      {n:true,  e:false, s:true, w:true, tl:true, tr:true, bl:false, br:true},
      {n:true,  e:true,  s:true, w:true, tl:true, tr:true, bl:false, br:true},
    ],
    // BR (ES, ESW, NES, NESW)
    [
      {n:false, e:true, s:true, w:false, tl:true, tr:true, bl:true, br:false},
      {n:false, e:true, s:true, w:true,  tl:true, tr:true, bl:true, br:false},
      {n:true,  e:true, s:true, w:false, tl:true, tr:true, bl:true, br:false},
      {n:true,  e:true, s:true, w:true,  tl:true, tr:true, bl:true, br:false},
    ]
  ];

  for (let i = 0; i < 4; i++) {
    for (const p of cornerPatterns[i]) {
      rules.push(buildRuleGrid(p.n, p.e, p.s, p.w, p.tl, p.tr, p.bl, p.br));
    }
  }

  return rules;
}

export function generateBlob47() {
  const rules: any[] = [];
  
  // This is a complex enumeration. In the v2 tool, it was hardcoded or generated.
  // Enumerate all 256 possible corner configurations for NESW=true? 
  // No, 47 rules is specifically:
  // 7 edge-only (no corners)
  // + combinations where corners matter.
  
  // For a 47-rule autotile, we usually enumerate all 256 configurations and map them to the 47 unique ones.
  // Sprite Fusion uses these 47 as the basis.
  
  // Simplified version: 
  // We'll generate a list of 47 patterns (n,e,s,w + corners)
  // and for each, find the best tile index from the 24 blob tiles.
  
  const patterns: any[] = [];
  
  for (let i = 0; i < 256; i++) {
    const n = !!(i & 1);
    const e = !!(i & 2);
    const s = !!(i & 4);
    const w = !!(i & 8);
    const tl = !!(i & 16);
    const tr = !!(i & 32);
    const bl = !!(i & 64);
    const br = !!(i & 128);
    
    // Apply blob restriction to pattern itself to deduplicate?
    // In Sprite Fusion, they often just want the 47 unique tiles.
    // For now, I'll generate the 47 standard blob rule patterns.
    // (A full list is quite long, I'll use a representative set or the logic provided in prompt)
  }
  
  // RE-READ prompt: "47-rule (edges + corners)"
  // "Algorithm 2: Blob 47-Rule: Enumerate all valid blob patterns... 16+16+8+7 = 47"
  
  // I'll implement a helper that returns the 47 patterns.
  const blob47Patterns = getBlob47Patterns();
  return blob47Patterns.map(p => buildRuleGrid(p.n, p.e, p.s, p.w, p.tl, p.tr, p.bl, p.br));
}

function getBlob47Patterns() {
  const patterns: any[] = [];
  // 1-4 edges combination check
  // This is a known set for Wang tiles / Blob tiles.
  // I will generate them by enumerating and filtering with blob constraints.
  const unique = new Set<string>();
  for (let i = 0; i < 256; i++) {
    let n = !!(i & 1);
    let e = !!(i & 2);
    let s = !!(i & 4);
    let w = !!(i & 8);
    let tl = !!(i & 16);
    let tr = !!(i & 32);
    let bl = !!(i & 64);
    let br = !!(i & 128);

    // Apply blob logic: corner only exists if both adjacent edges are true
    if (!(n && w)) tl = false;
    if (!(n && e)) tr = false;
    if (!(s && w)) bl = false;
    if (!(s && e)) br = false;

    const key = `${n},${e},${s},${w},${tl},${tr},${bl},${br}`;
    if (!unique.has(key)) {
      unique.add(key);
      patterns.push({n,e,s,w,tl,tr,bl,br});
    }
  }
  return patterns; // This should be exactly 47 patterns
}
