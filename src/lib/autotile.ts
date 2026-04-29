/**
 * Autotile Rule Generation Logic
 * Ported to TypeScript for React integration
 */

export type TilesetType = 'blob' | 'transition' | 'cave';

export interface GeneratorResult {
  rules: any[];
  tileMap: Record<number, number[]>; // tile number → array of rule indices (1-based)
}

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
export function generateBlob16(tileset: Record<number, TileRule>): GeneratorResult {
  const rules: any[] = [];
  const tileMap: Record<number, number[]> = {};
  const innerCorners = [5, 6, 11, 12, 17, 18, 23, 24];
  for (let i = 1; i <= 24; i++) {
    tileMap[i] = [];
    const tile = tileset[i];
    if (innerCorners.includes(i)) {
      rules.push([[null,null,null],[null,null,null],[null,null,null]]);
    } else {
      rules.push(buildRuleGrid(
        !!tile.n, !!tile.e, !!tile.s, !!tile.w,
        null, null, null, null
      ));
      tileMap[i].push(rules.length); // 1-based rule index
    }
  }
  return { rules, tileMap };
}

// Generate Cave 16 rules
export function generateCave16(tileset: Record<number, TileRule>): GeneratorResult {
  const rules: any[] = [];
  const tileMap: Record<number, number[]> = {};
  for (let t = 1; t <= 9; t++) tileMap[t] = [];

  for (let i = 0; i < 16; i++) {
    const n = !!(i & 8);
    const e = !!(i & 4);
    const s = !!(i & 2);
    const w = !!(i & 1);

    // Find best matching tile
    let bestTile = 1;
    let maxMatches = -1;
    for (let t = 1; t <= 9; t++) {
      const tile = tileset[t];
      let matches = 0;
      if (!!tile.n === n) matches++;
      if (!!tile.e === e) matches++;
      if (!!tile.s === s) matches++;
      if (!!tile.w === w) matches++;
      if (matches > maxMatches) { maxMatches = matches; bestTile = t; }
    }

    rules.push(buildRuleGrid(n, e, s, w, null, null, null, null));
    tileMap[bestTile].push(rules.length);
  }
  return { rules, tileMap };
}

export function generateTransition25(tileset: Record<number, TileRule>): GeneratorResult {
  const rules: any[] = [];
  const tileMap: Record<number, number[]> = {};
  for (let i = 1; i <= 13; i++) tileMap[i] = [];
  
  // Rules 1-9: Standard tiles (corners=true)
  for (let i = 1; i <= 9; i++) {
    const t = tileset[i];
    rules.push(buildRuleGrid(!!t.n, !!t.e, !!t.s, !!t.w, true, true, true, true));
    tileMap[i].push(rules.length);
  }

  // Rules 10-25: Inner corners
  // 10=TL, 11=TR, 12=BL, 13=BR
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
    const tileNum = 10 + i; // tiles 10, 11, 12, 13
    for (const p of cornerPatterns[i]) {
      rules.push(buildRuleGrid(p.n, p.e, p.s, p.w, p.tl, p.tr, p.bl, p.br));
      tileMap[tileNum].push(rules.length);
    }
  }

  return { rules, tileMap };
}

export function generateBlob47(): GeneratorResult {
  const allRules: any[] = [];
  const tileMap: Record<number, number[]> = {};
  for (let t = 1; t <= 24; t++) tileMap[t] = [];

  const patterns = [
    {n:false,e:false,s:false,w:false, corners:[] as string[]},
    {n:true, e:false,s:false,w:false, corners:[]},
    {n:false,e:true, s:false,w:false, corners:[]},
    {n:false,e:false,s:true, w:false, corners:[]},
    {n:false,e:false,s:false,w:true,  corners:[]},
    {n:true, e:false,s:true, w:false, corners:[]},
    {n:false,e:true, s:false,w:true,  corners:[]},
    {n:true, e:true, s:false,w:false, corners:['tr']},
    {n:true, e:false,s:false,w:true,  corners:['tl']},
    {n:false,e:true, s:true, w:false, corners:['br']},
    {n:false,e:false,s:true, w:true,  corners:['bl']},
    {n:true, e:true, s:true, w:false, corners:['tr','br']},
    {n:true, e:true, s:false,w:true,  corners:['tl','tr']},
    {n:true, e:false,s:true, w:true,  corners:['tl','bl']},
    {n:false,e:true, s:true, w:true,  corners:['bl','br']},
    {n:true, e:true, s:true, w:true,  corners:['tl','tr','bl','br']},
  ];

  const ruleData: {grid: any, tile: number}[] = [];

  for (const pat of patterns) {
    const {n, e, s, w, corners} = pat;
    if (corners.length === 0) {
      const tile = findBlobTile(n, e, s, w, {});
      ruleData.push({grid: buildRuleGrid(n, e, s, w, null, null, null, null), tile});
    } else {
      const combos = 1 << corners.length;
      for (let c = 0; c < combos; c++) {
        const cv: Record<string, boolean> = {};
        corners.forEach((cn, i) => { cv[cn] = Boolean(c & (1 << i)); });
        const tile = findBlobTile(n, e, s, w, cv);
        ruleData.push({
          grid: buildRuleGrid(n, e, s, w,
            cv.tl !== undefined ? cv.tl : null,
            cv.tr !== undefined ? cv.tr : null,
            cv.bl !== undefined ? cv.bl : null,
            cv.br !== undefined ? cv.br : null),
          tile
        });
      }
    }
  }

  ruleData.sort((a, b) => a.tile - b.tile);

  for (const rd of ruleData) {
    allRules.push(rd.grid);
    tileMap[rd.tile].push(allRules.length);
  }

  return { rules: allRules, tileMap };
}

function findBlobTile(n: boolean, e: boolean, s: boolean, w: boolean, corners: Record<string, boolean>): number {
  let best = 1;
  let bestScore = -1;
  for (let t = 1; t <= 24; t++) {
    const d = BLOB_TILES[t];
    if (!!d.n !== n || !!d.e !== e || !!d.s !== s || !!d.w !== w) continue;
    let score = 0;
    let valid = true;
    for (const [cn, cv] of Object.entries(corners)) {
      const tv = d[cn as keyof TileRule] as boolean | null;
      if (tv === null) { /* tile doesn't specify, ok */ }
      else if (tv === cv) score += 2;
      else { valid = false; break; }
    }
    if (valid && score > bestScore) { best = t; bestScore = score; }
  }
  if (bestScore >= 0) return best;
  // Fallback: match edges only
  for (let t = 1; t <= 24; t++) {
    const d = BLOB_TILES[t];
    if (!!d.n === n && !!d.e === e && !!d.s === s && !!d.w === w) return t;
  }
  return 1;
}
