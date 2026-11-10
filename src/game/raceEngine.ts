import {
  ACTIVE_SKILLS,
  ActiveSkillId,
  AnimationPose,
  CHARACTERS,
  CharacterId,
  CharacterSpec,
  ITEM_LIST,
  ItemId,
  ITEMS,
  PASSIVE_SKILLS,
  PassiveSkillId,
} from '../models/characterTypes';

export type TrackSurfaceType =
  | 'dirt'
  | 'cobble'
  | 'brick'
  | 'wood_plank'
  | 'shallow_water'
  | 'deep_water';

export type TrackBorderType = 'wood_fence' | 'bush_hedge' | 'none';

export interface TrackWaypoint {
  x: number;
  y: number;
  z: number;
  width: number;
  zoneName: string;
  surfaceType?: TrackSurfaceType;
  borderType?: TrackBorderType;
  isShallowWater?: boolean;
  isPlankBridge?: boolean;
  isDeepWaterHazard?: boolean;
  isBridgeOverWater?: boolean;
  isHighBridge?: boolean;
  isDownhillSlope?: boolean;
}

export interface TrackSegment {
  index: number;
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  dx: number;
  dy: number;
  dz: number;
  dirX: number;
  dirZ: number;
  rightX: number;
  rightZ: number;
  length: number;
  slope: number; // dy / length
  startDist: number;
  endDist: number;
  width: number;
  zoneName: string;
  surfaceType: TrackSurfaceType;
  borderType: TrackBorderType;
  isShallowWater: boolean;
  isPlankBridge: boolean;
  isDeepWaterHazard: boolean;
  isBridgeOverWater: boolean;
  isHighBridge: boolean;
  isDownhillSlope: boolean;
}

/**
 * 28 Control Points defining a sweeping, lush Woodland Forest Grand Circuit (~1,820u)
 * featuring dirt trails, cobblestone climbs, ancient stone brick slopes,
 * unavoidable shallow-water stream fords, wooden plank bridges, and a lethal
 * deep-water river crossing with mossy stepping stones to hop across.
 */
export const TRACK_CONTROL_POINTS: TrackWaypoint[] = [
  // 0..1: Whispering Woods Dirt Trail (Packed Earth + Wooden Fence)
  {
    x: 0,
    y: 0.0,
    z: 16,
    width: 11.0,
    zoneName: 'Whispering Woods Dirt Trail',
    surfaceType: 'dirt',
    borderType: 'wood_fence',
  },
  {
    x: 0,
    y: 0.0,
    z: -45,
    width: 10.6,
    zoneName: 'Whispering Woods Dirt Trail',
    surfaceType: 'dirt',
    borderType: 'wood_fence',
  },

  // 2..3: Unavoidable Shallow Creek Ford (Must wade through ankle-deep stream!)
  {
    x: 28,
    y: 0.0,
    z: -108,
    width: 11.2,
    zoneName: 'Shallow Forest Creek (Wade Through!)',
    surfaceType: 'shallow_water',
    borderType: 'bush_hedge',
    isShallowWater: true,
  },
  {
    x: -24,
    y: 0.5,
    z: -168,
    width: 10.8,
    zoneName: 'Shallow Forest Creek (Wade Through!)',
    surfaceType: 'shallow_water',
    borderType: 'bush_hedge',
    isShallowWater: true,
  },

  // 4..6: Ancient Cobblestone & Brick Forest Climb (Bush Hedges & Wooden Fences)
  {
    x: 38,
    y: 5.0,
    z: -228,
    width: 9.8,
    zoneName: 'Mossy Cobblestone Climb',
    surfaceType: 'cobble',
    borderType: 'bush_hedge',
  },
  {
    x: 96,
    y: 8.6,
    z: -272,
    width: 9.5,
    zoneName: 'Ancient Stone Brick Ascent',
    surfaceType: 'brick',
    borderType: 'wood_fence',
  },
  {
    x: 162,
    y: 11.8,
    z: -248,
    width: 9.2,
    zoneName: 'Ancient Stone Brick Ascent',
    surfaceType: 'brick',
    borderType: 'wood_fence',
  },

  // 7..9: Treetop Wooden Plank Bridge (Row of Timber Planks!)
  {
    x: 215,
    y: 13.6,
    z: -188,
    width: 7.4,
    zoneName: 'Treetop Wooden Plank Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },
  {
    x: 248,
    y: 14.0,
    z: -115,
    width: 7.2,
    zoneName: 'Treetop Wooden Plank Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },
  {
    x: 224,
    y: 13.2,
    z: -42,
    width: 7.6,
    zoneName: 'Treetop Wooden Plank Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },

  // 10..12: Ruined Stone Brick Downhill Slope (y = 10.2 -> 2.8)
  {
    x: 168,
    y: 10.2,
    z: 14,
    width: 10.2,
    zoneName: 'Mossy Brick Downhill Run',
    surfaceType: 'brick',
    borderType: 'wood_fence',
    isDownhillSlope: true,
  },
  {
    x: 198,
    y: 6.4,
    z: 84,
    width: 10.5,
    zoneName: 'Mossy Brick Downhill Run',
    surfaceType: 'brick',
    borderType: 'bush_hedge',
    isDownhillSlope: true,
  },
  {
    x: 256,
    y: 2.8,
    z: 148,
    width: 10.5,
    zoneName: 'Cobblestone Forest Chute',
    surfaceType: 'cobble',
    borderType: 'bush_hedge',
    isDownhillSlope: true,
  },

  // 13..15: Deep Woods Dirt & Fern Hollow (Long Bush Hedges, No Fence)
  {
    x: 228,
    y: 0.4,
    z: 218,
    width: 10.0,
    zoneName: 'Deep Woods Fern & Dirt Trail',
    surfaceType: 'dirt',
    borderType: 'bush_hedge',
  },
  {
    x: 158,
    y: 1.2,
    z: 256,
    width: 9.8,
    zoneName: 'Deep Woods Fern & Dirt Trail',
    surfaceType: 'dirt',
    borderType: 'bush_hedge',
  },
  {
    x: 92,
    y: 2.4,
    z: 214,
    width: 9.6,
    zoneName: 'Old Cobble Woodland Bend',
    surfaceType: 'cobble',
    borderType: 'wood_fence',
  },

  // 16..17: Low Timber Plank River Bridge (Wooden Planks Laid in a Row)
  {
    x: 34,
    y: 0.6,
    z: 262,
    width: 7.4,
    zoneName: 'Timber Plank Creek Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isBridgeOverWater: true,
  },
  {
    x: -36,
    y: 0.3,
    z: 238,
    width: 7.0,
    zoneName: 'Timber Plank Creek Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isBridgeOverWater: true,
  },

  // 18..19: Deep River Stepping-Stone Crossing (Lethal Deep Water + Stepping Stones to Jump!)
  {
    x: -96,
    y: 0.2,
    z: 188,
    width: 9.2,
    zoneName: 'Deep River Stepping Stones (Jump!)',
    surfaceType: 'deep_water',
    borderType: 'none',
    isDeepWaterHazard: true,
    isBridgeOverWater: true,
  },
  {
    x: -148,
    y: 0.3,
    z: 224,
    width: 9.2,
    zoneName: 'Deep River Stepping Stones (Jump!)',
    surfaceType: 'deep_water',
    borderType: 'none',
    isDeepWaterHazard: true,
    isBridgeOverWater: true,
  },

  // 20..21: Forest Ridge Climb & Canopy Plank Viaduct
  {
    x: -206,
    y: 6.4,
    z: 176,
    width: 9.6,
    zoneName: 'Hollow Log & Cobble Climb',
    surfaceType: 'cobble',
    borderType: 'bush_hedge',
  },
  {
    x: -228,
    y: 10.6,
    z: 104,
    width: 7.6,
    zoneName: 'Canopy Plank Suspension Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },

  // 22..24: Stone Brick & Cobble Canyon Downhill Chute
  {
    x: -182,
    y: 7.6,
    z: 36,
    width: 10.2,
    zoneName: 'Stone Brick Canyon Chute',
    surfaceType: 'brick',
    borderType: 'wood_fence',
    isDownhillSlope: true,
  },
  {
    x: -214,
    y: 3.4,
    z: -38,
    width: 10.2,
    zoneName: 'Stone Brick Canyon Chute',
    surfaceType: 'brick',
    borderType: 'bush_hedge',
    isDownhillSlope: true,
  },
  {
    x: -164,
    y: 0.4,
    z: -102,
    width: 9.8,
    zoneName: 'Bramble Boulder Dirt Alley',
    surfaceType: 'dirt',
    borderType: 'bush_hedge',
  },

  // 25..26: Second Unavoidable Shallow Forest Pond + Final Stone Brick Sprint
  {
    x: -104,
    y: 0.0,
    z: -64,
    width: 11.0,
    zoneName: 'Shallow Mossy Pond (Wade Through!)',
    surfaceType: 'shallow_water',
    borderType: 'bush_hedge',
    isShallowWater: true,
  },
  {
    x: -92,
    y: 2.2,
    z: 18,
    width: 9.8,
    zoneName: 'Forest Cobble Crest',
    surfaceType: 'cobble',
    borderType: 'wood_fence',
  },
  {
    x: -44,
    y: 1.0,
    z: 52,
    width: 10.6,
    zoneName: 'Woodland Brick Final Sprint',
    surfaceType: 'brick',
    borderType: 'wood_fence',
    isDownhillSlope: true,
  },
];

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const SUBDIVISIONS_PER_CONTROL = 10;

/**
 * Dense smooth waypoints generated by Catmull-Rom spline interpolation
 * so there are zero sharp corners anywhere on the circuit.
 */
export const TRACK_WAYPOINTS: TrackWaypoint[] = (() => {
  const pts: TrackWaypoint[] = [];
  const n = TRACK_CONTROL_POINTS.length;
  for (let i = 0; i < n; i++) {
    const p0 = TRACK_CONTROL_POINTS[(i - 1 + n) % n];
    const p1 = TRACK_CONTROL_POINTS[i];
    const p2 = TRACK_CONTROL_POINTS[(i + 1) % n];
    const p3 = TRACK_CONTROL_POINTS[(i + 2) % n];

    for (let s = 0; s < SUBDIVISIONS_PER_CONTROL; s++) {
      const t = s / SUBDIVISIONS_PER_CONTROL;
      const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
      const y = Math.max(0, catmullRom(p0.y, p1.y, p2.y, p3.y, t));
      const z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
      const width = p1.width + (p2.width - p1.width) * t;
      const ref = t < 0.5 ? p1 : p2;
      pts.push({
        x,
        y,
        z,
        width,
        zoneName: ref.zoneName,
        surfaceType: ref.surfaceType ?? 'dirt',
        borderType: ref.borderType ?? 'wood_fence',
        isShallowWater: Boolean(ref.isShallowWater),
        isPlankBridge: Boolean(ref.isPlankBridge),
        isDeepWaterHazard: Boolean(ref.isDeepWaterHazard),
        isBridgeOverWater: Boolean(ref.isBridgeOverWater),
        isHighBridge: Boolean(ref.isHighBridge),
        isDownhillSlope: Boolean(ref.isDownhillSlope),
      });
    }
  }
  return pts;
})();

export const TRACK_SEGMENTS: TrackSegment[] = (() => {
  const segs: TrackSegment[] = [];
  let accum = 0;
  for (let i = 0; i < TRACK_WAYPOINTS.length; i++) {
    const wp0 = TRACK_WAYPOINTS[i];
    const wp1 = TRACK_WAYPOINTS[(i + 1) % TRACK_WAYPOINTS.length];
    const dx = wp1.x - wp0.x;
    const dy = wp1.y - wp0.y;
    const dz = wp1.z - wp0.z;
    const length = Math.max(0.001, Math.hypot(dx, dz));
    const dirX = dx / length;
    const dirZ = dz / length;
    const rightX = -dirZ;
    const rightZ = dirX;
    const slope = dy / length;
    segs.push({
      index: i,
      x0: wp0.x,
      y0: wp0.y,
      z0: wp0.z,
      x1: wp1.x,
      y1: wp1.y,
      z1: wp1.z,
      dx,
      dy,
      dz,
      dirX,
      dirZ,
      rightX,
      rightZ,
      length,
      slope,
      startDist: accum,
      endDist: accum + length,
      width: (wp0.width + wp1.width) * 0.5,
      zoneName: wp0.zoneName,
      surfaceType: wp0.surfaceType ?? 'dirt',
      borderType: wp0.borderType ?? 'wood_fence',
      isShallowWater: Boolean(wp0.isShallowWater),
      isPlankBridge: Boolean(wp0.isPlankBridge),
      isDeepWaterHazard: Boolean(wp0.isDeepWaterHazard),
      isBridgeOverWater: Boolean(wp0.isBridgeOverWater),
      isHighBridge: Boolean(wp0.isHighBridge),
      isDownhillSlope: Boolean(wp0.isDownhillSlope || slope < -0.025),
    });
    accum += length;
  }
  return segs;
})();

export const TOTAL_TRACK_LENGTH =
  TRACK_SEGMENTS[TRACK_SEGMENTS.length - 1].endDist;

export interface TrackSample {
  x: number;
  y: number;
  z: number;
  dirX: number;
  dirZ: number;
  rightX: number;
  rightZ: number;
  slope: number;
  width: number;
  segmentIndex: number;
  zoneName: string;
  surfaceType: TrackSurfaceType;
  borderType: TrackBorderType;
  isShallowWater: boolean;
  isPlankBridge: boolean;
  isDeepWaterHazard: boolean;
  isBridgeOverWater: boolean;
  isHighBridge: boolean;
  isDownhillSlope: boolean;
}

export function sampleTrackAtDistance(dist: number): TrackSample {
  const wrapped =
    ((dist % TOTAL_TRACK_LENGTH) + TOTAL_TRACK_LENGTH) % TOTAL_TRACK_LENGTH;
  // Binary search over TRACK_SEGMENTS for O(log N) speed
  let lo = 0;
  let hi = TRACK_SEGMENTS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (TRACK_SEGMENTS[mid].endDist < wrapped) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  const seg = TRACK_SEGMENTS[lo];
  const localT = Math.max(
    0,
    Math.min(1, (wrapped - seg.startDist) / seg.length)
  );
  return {
    x: seg.x0 + seg.dx * localT,
    y: seg.y0 + seg.dy * localT,
    z: seg.z0 + seg.dz * localT,
    dirX: seg.dirX,
    dirZ: seg.dirZ,
    rightX: seg.rightX,
    rightZ: seg.rightZ,
    slope: seg.slope,
    width: seg.width,
    segmentIndex: seg.index,
    zoneName: seg.zoneName,
    surfaceType: seg.surfaceType,
    borderType: seg.borderType,
    isShallowWater: seg.isShallowWater,
    isPlankBridge: seg.isPlankBridge,
    isDeepWaterHazard: seg.isDeepWaterHazard,
    isBridgeOverWater: seg.isBridgeOverWater,
    isHighBridge: seg.isHighBridge,
    isDownhillSlope: seg.isDownhillSlope,
  };
}

export interface TrackProjection {
  trackDist: number;
  lateralOffset: number;
  closestX: number;
  closestY: number;
  closestZ: number;
  dirX: number;
  dirZ: number;
  rightX: number;
  rightZ: number;
  slope: number;
  width: number;
  segmentIndex: number;
  zoneName: string;
  surfaceType: TrackSurfaceType;
  borderType: TrackBorderType;
  isShallowWater: boolean;
  isPlankBridge: boolean;
  isDeepWaterHazard: boolean;
  isBridgeOverWater: boolean;
  isHighBridge: boolean;
  isDownhillSlope: boolean;
}

/**
 * Projects any world (x, z) point onto the nearest smooth spline segment.
 * Optional hintDist restricts the search to nearby segments so overlapping bridges
 * or nearby switchbacks never confuse a racer's lap progress.
 */
export function projectPointToTrack(
  x: number,
  z: number,
  hintDist?: number
): TrackProjection {
  let bestDistSq = Infinity;
  let bestSeg = TRACK_SEGMENTS[0];
  let bestT = 0;

  for (let i = 0; i < TRACK_SEGMENTS.length; i++) {
    const seg = TRACK_SEGMENTS[i];
    if (hintDist !== undefined) {
      const segMid = (seg.startDist + seg.endDist) * 0.5;
      let delta = Math.abs(segMid - (hintDist % TOTAL_TRACK_LENGTH));
      if (delta > TOTAL_TRACK_LENGTH * 0.5) {
        delta = TOTAL_TRACK_LENGTH - delta;
      }
      if (delta > 110) continue;
    }

    const vx = x - seg.x0;
    const vz = z - seg.z0;
    const proj = vx * seg.dirX + vz * seg.dirZ;
    const clampedProj = Math.max(0, Math.min(seg.length, proj));
    const cx = seg.x0 + seg.dirX * clampedProj;
    const cz = seg.z0 + seg.dirZ * clampedProj;
    const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestSeg = seg;
      bestT = clampedProj;
    }
  }

  const closestX = bestSeg.x0 + bestSeg.dirX * bestT;
  const closestY = bestSeg.y0 + (bestSeg.dy / bestSeg.length) * bestT;
  const closestZ = bestSeg.z0 + bestSeg.dirZ * bestT;
  const relX = x - closestX;
  const relZ = z - closestZ;
  const lateralOffset = relX * bestSeg.rightX + relZ * bestSeg.rightZ;

  return {
    trackDist: bestSeg.startDist + bestT,
    lateralOffset,
    closestX,
    closestY,
    closestZ,
    dirX: bestSeg.dirX,
    dirZ: bestSeg.dirZ,
    rightX: bestSeg.rightX,
    rightZ: bestSeg.rightZ,
    slope: bestSeg.slope,
    width: bestSeg.width,
    segmentIndex: bestSeg.index,
    zoneName: bestSeg.zoneName,
    surfaceType: bestSeg.surfaceType,
    borderType: bestSeg.borderType,
    isShallowWater: bestSeg.isShallowWater,
    isPlankBridge: bestSeg.isPlankBridge,
    isDeepWaterHazard: bestSeg.isDeepWaterHazard,
    isBridgeOverWater: bestSeg.isBridgeOverWater,
    isHighBridge: bestSeg.isHighBridge,
    isDownhillSlope: bestSeg.isDownhillSlope,
  };
}

/**
 * Stepping stones emerging from the Deep Water River Hazard section.
 * Players and AI must hop from stone to stone; falling into the deep water
 * between or beside the stones causes an instant splash & checkpoint respawn!
 */
export interface SteppingStoneSpec {
  id: string;
  trackDist: number;
  lateralOffset: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  yaw: number;
}

export const RIVER_STEPPING_STONES: SteppingStoneSpec[] = (() => {
  const stones: SteppingStoneSpec[] = [];
  const deepSegs = TRACK_SEGMENTS.filter((s) => s.isDeepWaterHazard);
  if (deepSegs.length === 0) return stones;

  const startD = deepSegs[0].startDist;
  const endD = deepSegs[deepSegs.length - 1].endDist;
  let stepIdx = 0;

  for (let d = startD; d <= endD; d += 5.4) {
    const s = sampleTrackAtDistance(d);
    const isAnchor = d <= startD + 3.0 || d >= endD - 3.0;
    const lat = isAnchor ? 0 : Math.sin(stepIdx * 1.15) * 1.35;
    const rad = isAnchor ? 3.4 : 2.55;
    stones.push({
      id: `stone_main_${stepIdx}`,
      trackDist: d,
      lateralOffset: lat,
      x: s.x + s.rightX * lat,
      y: s.y,
      z: s.z + s.rightZ * lat,
      radius: rad,
      yaw: Math.atan2(-s.dirX, -s.dirZ) + stepIdx * 0.4,
    });

    // Add a secondary staggered stone on every other step for dual-lane hopping
    if (!isAnchor && stepIdx % 2 === 1) {
      const altLat = -lat * 1.25;
      stones.push({
        id: `stone_alt_${stepIdx}`,
        trackDist: d,
        lateralOffset: altLat,
        x: s.x + s.rightX * altLat,
        y: s.y,
        z: s.z + s.rightZ * altLat,
        radius: 2.15,
        yaw: Math.atan2(-s.dirX, -s.dirZ) - stepIdx * 0.5,
      });
    }
    stepIdx++;
  }
  return stones;
})();

// ============================================================================
// TRACK OBSTACLES & ITEMS DEFINITIONS ACROSS THE ~1,820u CIRCUIT
// ============================================================================

export interface SlimePadSpec {
  id: string;
  trackDist: number;
  lateralOffset: number;
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface TurntableSpec {
  id: string;
  trackDist: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  angularSpeed: number; // rad/s
  barHalfLength: number;
}

export interface RollingBoulderSpec {
  id: string;
  trackDist: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  rightX: number;
  rightZ: number;
  sweepHalfWidth: number;
  speed: number;
  phase: number;
  radius: number;
  colorHex: string;
  isBeachBall: boolean;
}

export interface BoostPadSpec {
  id: string;
  trackDist: number;
  lateralOffset: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface ItemBoxState {
  id: string;
  x: number;
  y: number;
  z: number;
  respawnTimer: number;
}

export interface DroppedTrap {
  id: string;
  ownerId: CharacterId;
  x: number;
  y: number;
  z: number;
  radius: number;
  ttl: number;
}

export interface PieProjectile {
  id: string;
  ownerId: CharacterId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  ttl: number;
}

export interface ShockwaveEffect {
  id: string;
  x: number;
  y: number;
  z: number;
  colorHex: string;
  age: number;
  maxAge: number;
  maxRadius: number;
}

export const SLIME_PADS: SlimePadSpec[] = [
  { frac: 0.08, lat: -1.8, r: 2.5 },
  { frac: 0.11, lat: 1.8, r: 2.5 },
  { frac: 0.16, lat: -1.4, r: 2.4 },
  { frac: 0.21, lat: 1.6, r: 2.4 },
  { frac: 0.46, lat: -2.0, r: 2.6 },
  { frac: 0.49, lat: 1.8, r: 2.6 },
  { frac: 0.52, lat: -1.5, r: 2.7 },
  { frac: 0.55, lat: 1.6, r: 2.6 },
  { frac: 0.58, lat: 0.0, r: 2.5 },
  { frac: 0.61, lat: -1.8, r: 2.5 },
  { frac: 0.72, lat: 1.7, r: 2.5 },
  { frac: 0.75, lat: -1.7, r: 2.5 },
  { frac: 0.88, lat: 1.8, r: 2.4 },
  { frac: 0.93, lat: -1.6, r: 2.4 },
].map((cfg, idx) => {
  const dist = cfg.frac * TOTAL_TRACK_LENGTH;
  const s = sampleTrackAtDistance(dist);
  return {
    id: `slime_${idx}`,
    trackDist: dist,
    lateralOffset: cfg.lat,
    x: s.x + s.rightX * cfg.lat,
    y: s.y,
    z: s.z + s.rightZ * cfg.lat,
    radius: cfg.r,
  };
});

export const TURNTABLES: TurntableSpec[] = [
  { frac: 0.26, speed: 1.55, r: 4.0 },
  { frac: 0.31, speed: -1.75, r: 4.0 },
  { frac: 0.54, speed: 1.65, r: 4.2 },
  { frac: 0.78, speed: -1.7, r: 4.0 },
  { frac: 0.91, speed: 1.6, r: 4.2 },
].map((cfg, idx) => {
  const dist = cfg.frac * TOTAL_TRACK_LENGTH;
  const s = sampleTrackAtDistance(dist);
  return {
    id: `turntable_${idx}`,
    trackDist: dist,
    x: s.x,
    y: s.y,
    z: s.z,
    radius: cfg.r,
    angularSpeed: cfg.speed,
    barHalfLength: cfg.r * 0.92,
  };
});

export const ROLLING_BOULDERS: RollingBoulderSpec[] = [
  { frac: 0.14, speed: 2.2, phase: 0.0, r: 1.1, hex: '#8C7A6B', ball: false },
  { frac: 0.19, speed: 2.5, phase: 1.5, r: 1.15, hex: '#F43F5E', ball: true },
  { frac: 0.36, speed: 2.4, phase: 2.8, r: 1.1, hex: '#3B82F6', ball: true },
  { frac: 0.41, speed: 2.6, phase: 4.1, r: 1.15, hex: '#78685A', ball: false },
  { frac: 0.68, speed: 2.3, phase: 0.9, r: 1.1, hex: '#F59E0B', ball: true },
  { frac: 0.74, speed: 2.6, phase: 2.4, r: 1.15, hex: '#8C7A6B', ball: false },
  { frac: 0.83, speed: 2.5, phase: 3.7, r: 1.15, hex: '#EC4899', ball: true },
  { frac: 0.86, speed: 2.7, phase: 5.1, r: 1.2, hex: '#78685A', ball: false },
  { frac: 0.89, speed: 2.4, phase: 1.2, r: 1.1, hex: '#10B981', ball: true },
  { frac: 0.95, speed: 2.6, phase: 2.9, r: 1.15, hex: '#8C7A6B', ball: false },
].map((cfg, idx) => {
  const dist = cfg.frac * TOTAL_TRACK_LENGTH;
  const s = sampleTrackAtDistance(dist);
  return {
    id: `boulder_${idx}`,
    trackDist: dist,
    centerX: s.x,
    centerY: s.y,
    centerZ: s.z,
    rightX: s.rightX,
    rightZ: s.rightZ,
    sweepHalfWidth: s.width * 0.42,
    speed: cfg.speed,
    phase: cfg.phase,
    radius: cfg.r,
    colorHex: cfg.hex,
    isBeachBall: cfg.ball,
  };
});

export const BOOST_PADS: BoostPadSpec[] = [
  { frac: 0.04, lat: 0 },
  { frac: 0.13, lat: -1.4 },
  { frac: 0.23, lat: 0 },
  { frac: 0.34, lat: -1.5 },
  { frac: 0.38, lat: 1.5 },
  { frac: 0.43, lat: 0 },
  { frac: 0.59, lat: 0 },
  { frac: 0.69, lat: 0 },
  { frac: 0.8, lat: -1.4 },
  { frac: 0.84, lat: 1.4 },
  { frac: 0.96, lat: -1.5 },
  { frac: 0.98, lat: 1.5 },
].map((cfg, idx) => {
  const dist = cfg.frac * TOTAL_TRACK_LENGTH;
  const s = sampleTrackAtDistance(dist);
  return {
    id: `boost_${idx}`,
    trackDist: dist,
    lateralOffset: cfg.lat,
    x: s.x + s.rightX * cfg.lat,
    y: s.y,
    z: s.z + s.rightZ * cfg.lat,
    yaw: Math.atan2(-s.dirX, -s.dirZ),
  };
});

export function createInitialItemBoxes(): ItemBoxState[] {
  const boxFractions = [
    0.03, 0.09, 0.15, 0.22, 0.29, 0.35, 0.42, 0.48, 0.56, 0.62, 0.67, 0.73,
    0.79, 0.85, 0.92, 0.97,
  ];
  const boxes: ItemBoxState[] = [];
  boxFractions.forEach((frac, rIdx) => {
    const dist = frac * TOTAL_TRACK_LENGTH;
    const s = sampleTrackAtDistance(dist);
    const lats = rIdx % 2 === 0 ? [-2.4, 0, 2.4] : [-2.0, 2.0];
    lats.forEach((lat, lIdx) => {
      boxes.push({
        id: `box_${rIdx}_${lIdx}`,
        x: s.x + s.rightX * lat,
        y: s.y,
        z: s.z + s.rightZ * lat,
        respawnTimer: 0,
      });
    });
  });
  return boxes;
}

// ============================================================================
// RACER STATE & SIMULATION
// ============================================================================

export interface RacerState {
  id: CharacterId;
  spec: CharacterSpec;
  isPlayer: boolean;
  x: number;
  y: number;
  z: number;
  groundY: number;
  vx: number;
  vy: number;
  vz: number;
  knockVx: number;
  knockVz: number;
  yaw: number;
  pose: AnimationPose;
  // Track progress & checkpoints
  furthestCheckpointDist: number;
  totalProgress: number;
  checkpointX: number;
  checkpointY: number;
  checkpointZ: number;
  checkpointYaw: number;
  finished: boolean;
  finishTimeSec: number | null;
  rank: number;
  // Skills, Items & Cooldowns
  activeSkillId: ActiveSkillId;
  passiveSkillId: PassiveSkillId;
  qCooldown: number;
  fCooldown: number;
  heldItem: ItemId | null;
  // Active status timers
  dashTimer: number;
  shieldTimer: number;
  whirlwindTimer: number;
  stunTimer: number;
  slowTimer: number;
  respawnBlinkTimer: number;
  landingBoostTimer: number;
  slapAnimTimer: number;
  pokeImpulse: number;
  slapsLanded: number;
  // Bot AI steering
  botPreferredLane: number;
  botLaneTimer: number;
}

export interface PlayerControlInput {
  moveForward: number; // -1..1 (W = +1, S = -1)
  moveRight: number; // -1..1 (D = +1, A = -1)
  cameraYaw: number; // radians
  jumpRequested: boolean;
  skillQRequested: boolean;
  itemERequested: boolean;
  slapFRequested: boolean;
}

export interface RaceEventLog {
  id: string;
  text: string;
  colorHex: string;
  timestamp: number;
}

export interface RaceSimulationState {
  phase: 'lobby' | 'countdown' | 'racing' | 'finished';
  countdownSec: number;
  elapsedRaceSec: number;
  racers: RacerState[];
  itemBoxes: ItemBoxState[];
  droppedTraps: DroppedTrap[];
  pieProjectiles: PieProjectile[];
  shockwaves: ShockwaveEffect[];
  events: RaceEventLog[];
  bannerCallout: { text: string; colorHex: string; ttl: number } | null;
}

/**
 * Selects 7 lively AI bot opponents from the remaining 15 characters
 * and spawns all 8 racers on the starting grid with custom player skills.
 */
export function createInitialRaceState(
  playerCharId: CharacterId,
  customActiveSkillId?: ActiveSkillId,
  customPassiveSkillId?: PassiveSkillId
): RaceSimulationState {
  const playerSpec =
    CHARACTERS.find((c) => c.id === playerCharId) || CHARACTERS[0];
  const remaining = CHARACTERS.filter((c) => c.id !== playerSpec.id);

  const botSpecs: CharacterSpec[] = [];
  const step = 2;
  for (let i = 0; i < 7; i++) {
    botSpecs.push(remaining[(i * step) % remaining.length]);
  }

  const allSpecs = [playerSpec, ...botSpecs];
  const startSeg = TRACK_SEGMENTS[0];
  const startYaw = Math.atan2(-startSeg.dirX, -startSeg.dirZ);

  const racers: RacerState[] = allSpecs.map((spec, idx) => {
    const row = Math.floor(idx / 4); // 0 or 1
    const col = idx % 4; // 0..3
    const latOffset = (col - 1.5) * 1.85;
    const startDist = 2.0 + (1 - row) * 2.2;
    const sample = sampleTrackAtDistance(startDist);
    const spawnX = sample.x + sample.rightX * latOffset;
    const spawnY = sample.y;
    const spawnZ = sample.z + sample.rightZ * latOffset;

    const isPlayer = idx === 0;
    return {
      id: spec.id,
      spec,
      isPlayer,
      x: spawnX,
      y: spawnY,
      z: spawnZ,
      groundY: spawnY,
      vx: 0,
      vy: 0,
      vz: 0,
      knockVx: 0,
      knockVz: 0,
      yaw: startYaw,
      pose: 'idle',
      furthestCheckpointDist: startDist,
      totalProgress: startDist,
      checkpointX: spawnX,
      checkpointY: spawnY,
      checkpointZ: spawnZ,
      checkpointYaw: startYaw,
      finished: false,
      finishTimeSec: null,
      rank: idx + 1,
      activeSkillId:
        isPlayer && customActiveSkillId
          ? customActiveSkillId
          : spec.activeSkillId,
      passiveSkillId:
        isPlayer && customPassiveSkillId
          ? customPassiveSkillId
          : spec.passiveSkillId,
      qCooldown: 0,
      fCooldown: 0,
      heldItem: null,
      dashTimer: 0,
      shieldTimer: 0,
      whirlwindTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      respawnBlinkTimer: 0,
      landingBoostTimer: 0,
      slapAnimTimer: 0,
      pokeImpulse: 0,
      slapsLanded: 0,
      botPreferredLane: (col - 1.5) * 0.9,
      botLaneTimer: 1.5 + idx * 0.4,
    };
  });

  return {
    phase: 'countdown',
    countdownSec: 3.0,
    elapsedRaceSec: 0,
    racers,
    itemBoxes: createInitialItemBoxes(),
    droppedTraps: [],
    pieProjectiles: [],
    shockwaves: [],
    events: [
      {
        id: 'init_0',
        text: 'Grand 1-Lap Winding Circuit (~2:45 min) — Use Q Skill, E Item & F Sideways Slap!',
        colorHex: '#C86D3B',
        timestamp: 0,
      },
    ],
    bannerCallout: null,
  };
}

function pushEvent(
  state: RaceSimulationState,
  text: string,
  colorHex = '#F59E0B'
) {
  state.events.unshift({
    id: `${Date.now()}_${Math.random()}`,
    text,
    colorHex,
    timestamp: state.elapsedRaceSec,
  });
  if (state.events.length > 5) {
    state.events.length = 5;
  }
}

/**
 * Triggers a racer's Primary Active Skill (Key Q) — supports all 5 Active Skills.
 */
export function activateRacerSkillQ(
  state: RaceSimulationState,
  racer: RacerState
): boolean {
  if (racer.qCooldown > 0 || racer.stunTimer > 0 || racer.finished) {
    return false;
  }
  const skill = ACTIVE_SKILLS[racer.activeSkillId];
  racer.qCooldown = skill.cooldownSec;
  racer.pokeImpulse = 0.85;

  if (racer.activeSkillId === 'dash') {
    racer.dashTimer = skill.durationSec;
    racer.slowTimer = 0;
    if (racer.isPlayer) {
      state.bannerCallout = {
        text: 'JET DASH TURBO!',
        colorHex: skill.colorHex,
        ttl: 1.2,
      };
    }
  } else if (racer.activeSkillId === 'shield') {
    racer.shieldTimer = skill.durationSec;
    if (racer.isPlayer) {
      state.bannerCallout = {
        text: 'BUBBLE SHIELD UP!',
        colorHex: skill.colorHex,
        ttl: 1.2,
      };
    }
  } else if (racer.activeSkillId === 'spring') {
    racer.vy = 16.5;
    racer.y = Math.max(racer.groundY + 0.08, racer.y);
    racer.dashTimer = Math.max(racer.dashTimer, 0.85);
    if (racer.isPlayer) {
      state.bannerCallout = {
        text: 'SUPER SPRING HOP!',
        colorHex: skill.colorHex,
        ttl: 1.2,
      };
    }
  } else if (racer.activeSkillId === 'quake') {
    state.shockwaves.push({
      id: `quake_${Date.now()}_${racer.id}`,
      x: racer.x,
      y: racer.y,
      z: racer.z,
      colorHex: skill.colorHex,
      age: 0,
      maxAge: 0.55,
      maxRadius: 4.0,
    });
    for (const other of state.racers) {
      if (other.id === racer.id || other.finished) continue;
      const dx = other.x - racer.x;
      const dz = other.z - racer.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 4.0 && dist > 0.001) {
        if (other.shieldTimer > 0) {
          other.shieldTimer = 0;
          continue;
        }
        const resist = other.passiveSkillId === 'bouncy_belly' ? 0.55 : 1.0;
        const push = ((4.0 - dist) / 4.0) * 14.5 * resist;
        other.knockVx += (dx / dist) * push;
        other.knockVz += (dz / dist) * push;
        other.slowTimer = Math.max(other.slowTimer, 2.2);
        other.stunTimer = Math.max(other.stunTimer, 0.55);
        other.pokeImpulse = 1.0;
      }
    }
    if (racer.isPlayer) {
      state.bannerCallout = {
        text: 'DIZZY QUAKE STOMP!',
        colorHex: skill.colorHex,
        ttl: 1.2,
      };
    }
  } else if (racer.activeSkillId === 'whirlwind') {
    racer.whirlwindTimer = skill.durationSec;
    racer.slowTimer = 0;
    state.shockwaves.push({
      id: `whirl_${Date.now()}_${racer.id}`,
      x: racer.x,
      y: racer.y,
      z: racer.z,
      colorHex: skill.colorHex,
      age: 0,
      maxAge: 0.65,
      maxRadius: 3.4,
    });
    if (racer.isPlayer) {
      state.bannerCallout = {
        text: 'CYCLONE SPIN TORNADO!',
        colorHex: skill.colorHex,
        ttl: 1.3,
      };
    }
  }
  return true;
}

/**
 * Triggers a racer's Held Prank Item (Key E).
 */
export function activateRacerItemE(
  state: RaceSimulationState,
  racer: RacerState
): boolean {
  if (!racer.heldItem || racer.stunTimer > 0 || racer.finished) {
    return false;
  }
  const item = racer.heldItem;
  racer.heldItem = null;
  racer.pokeImpulse = 0.8;
  const luckyMult = racer.passiveSkillId === 'lucky_magnet' ? 1.3 : 1.0;

  const fwdX = -Math.sin(racer.yaw);
  const fwdZ = -Math.cos(racer.yaw);

  if (item === 'pepper') {
    racer.dashTimer = Math.max(racer.dashTimer, 2.4 * luckyMult);
    racer.slowTimer = 0;
    if (racer.isPlayer) {
      state.bannerCallout = {
        text: 'SPICY PEPPER TURBO!',
        colorHex: ITEMS.pepper.colorHex,
        ttl: 1.2,
      };
    }
  } else if (item === 'honey') {
    state.droppedTraps.push({
      id: `trap_${Date.now()}_${racer.id}`,
      ownerId: racer.id,
      x: racer.x - fwdX * 1.7,
      y: racer.groundY,
      z: racer.z - fwdZ * 1.7,
      radius: 2.0,
      ttl: 18.0 * luckyMult,
    });
    if (racer.isPlayer) {
      pushEvent(
        state,
        `${racer.spec.shortName} dropped a Sticky Honey Trap!`,
        '#F59E0B'
      );
    }
  } else if (item === 'pie') {
    state.pieProjectiles.push({
      id: `pie_${Date.now()}_${racer.id}`,
      ownerId: racer.id,
      x: racer.x + fwdX * 1.3,
      y: racer.y + 0.9,
      z: racer.z + fwdZ * 1.3,
      vx: fwdX * 26.0,
      vz: fwdZ * 26.0,
      ttl: 2.8,
    });
    if (racer.isPlayer) {
      pushEvent(
        state,
        `${racer.spec.shortName} tossed a Cream Pie ahead!`,
        '#F472B6'
      );
    }
  } else if (item === 'glove') {
    racer.vx += fwdX * 9.0;
    racer.vz += fwdZ * 9.0;
    let bestTarget: RacerState | null = null;
    let bestDist = 4.6;
    for (const other of state.racers) {
      if (other.id === racer.id || other.finished) continue;
      const d = Math.hypot(other.x - racer.x, other.z - racer.z);
      if (d < bestDist) {
        bestDist = d;
        bestTarget = other;
      }
    }
    if (bestTarget) {
      const proj = projectPointToTrack(
        bestTarget.x,
        bestTarget.z,
        bestTarget.furthestCheckpointDist
      );
      const sideSign = proj.lateralOffset >= 0 ? 1 : -1;
      const resist = bestTarget.passiveSkillId === 'bouncy_belly' ? 0.55 : 1.0;
      bestTarget.knockVx += proj.rightX * sideSign * 21.0 * resist;
      bestTarget.knockVz += proj.rightZ * sideSign * 21.0 * resist;
      bestTarget.vy = 5.5;
      bestTarget.stunTimer = 0.65;
      bestTarget.pokeImpulse = 1.2;
      racer.slapsLanded += 1;
      pushEvent(
        state,
        `🥊 ${racer.spec.shortName} bonked ${bestTarget.spec.shortName} sideways!`,
        '#EF4444'
      );
    }
  } else if (item === 'magnet') {
    let targetAhead: RacerState | null = null;
    let bestAheadDelta = Infinity;
    for (const other of state.racers) {
      if (other.id === racer.id || other.finished) continue;
      const delta = other.totalProgress - racer.totalProgress;
      if (delta > 0 && delta < bestAheadDelta) {
        bestAheadDelta = delta;
        targetAhead = other;
      }
    }
    racer.dashTimer = Math.max(racer.dashTimer, 1.45 * luckyMult);
    if (targetAhead) {
      if (targetAhead.shieldTimer <= 0) {
        targetAhead.slowTimer = Math.max(targetAhead.slowTimer, 1.9);
        targetAhead.pokeImpulse = 1.0;
      }
      pushEvent(
        state,
        `🧲 ${racer.spec.shortName} magnetized ${targetAhead.spec.shortName}!`,
        '#6366F1'
      );
    }
  }
  return true;
}

/**
 * Triggers a racer's Melee Sideways Slap (Key F).
 * Rivals within melee reach are knocked strongly sideways (left/right across the track).
 */
export function activateRacerSlapF(
  state: RaceSimulationState,
  racer: RacerState
): boolean {
  if (racer.fCooldown > 0 || racer.stunTimer > 0 || racer.finished) {
    return false;
  }
  racer.fCooldown = 1.35;
  racer.slapAnimTimer = 0.35;
  racer.pokeImpulse = 0.9;

  const reach = racer.passiveSkillId === 'slime_boots' ? 3.3 : 2.75;
  state.shockwaves.push({
    id: `slap_${Date.now()}_${racer.id}`,
    x: racer.x,
    y: racer.y,
    z: racer.z,
    colorHex: '#F97316',
    age: 0,
    maxAge: 0.28,
    maxRadius: reach,
  });

  let hitAny = false;
  for (const other of state.racers) {
    if (other.id === racer.id || other.finished) continue;
    const dx = other.x - racer.x;
    const dz = other.z - racer.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= reach) {
      hitAny = true;
      if (other.shieldTimer > 0) {
        other.shieldTimer = 0;
        racer.knockVx -= (dx / Math.max(0.1, dist)) * 12.0;
        racer.knockVz -= (dz / Math.max(0.1, dist)) * 12.0;
        pushEvent(
          state,
          `🫧 ${other.spec.shortName}'s Bubble Shield bounced ${racer.spec.shortName}!`,
          '#06B6D4'
        );
        continue;
      }

      const proj = projectPointToTrack(
        other.x,
        other.z,
        other.furthestCheckpointDist
      );
      const relSide = dx * proj.rightX + dz * proj.rightZ;
      const sideSign =
        Math.abs(relSide) > 0.08
          ? Math.sign(relSide)
          : proj.lateralOffset >= 0
          ? 1
          : -1;

      const resist = other.passiveSkillId === 'bouncy_belly' ? 0.55 : 1.0;
      const knockSpeed = 19.5 * resist;

      other.knockVx +=
        (proj.rightX * sideSign * 0.85 + (dx / Math.max(0.1, dist)) * 0.15) *
        knockSpeed;
      other.knockVz +=
        (proj.rightZ * sideSign * 0.85 + (dz / Math.max(0.1, dist)) * 0.15) *
        knockSpeed;
      other.vy = Math.max(other.vy, 4.8);
      other.y = Math.max(other.groundY + 0.05, other.y);
      other.stunTimer = Math.max(other.stunTimer, 0.45);
      other.pokeImpulse = 1.25;
      racer.slapsLanded += 1;

      if (racer.isPlayer || other.isPlayer) {
        pushEvent(
          state,
          `👋 ${racer.spec.shortName} slapped ${other.spec.shortName} sideways!`,
          '#F97316'
        );
      }
      if (racer.isPlayer) {
        state.bannerCallout = {
          text: `SLAPPED ${other.spec.shortName.toUpperCase()} SIDEWAYS!`,
          colorHex: '#F97316',
          ttl: 1.0,
        };
      }
    }
  }
  return hitAny;
}

/**
 * Advances the entire 8-racer 3D obstacle course simulation by dt seconds.
 */
export function stepRaceSimulation(
  state: RaceSimulationState,
  dt: number,
  playerInput: PlayerControlInput
): void {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));

  if (state.bannerCallout) {
    state.bannerCallout.ttl -= clampedDt;
    if (state.bannerCallout.ttl <= 0) {
      state.bannerCallout = null;
    }
  }

  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    state.shockwaves[i].age += clampedDt;
    if (state.shockwaves[i].age >= state.shockwaves[i].maxAge) {
      state.shockwaves.splice(i, 1);
    }
  }

  if (state.phase === 'lobby') {
    return;
  }

  if (state.phase === 'countdown') {
    state.countdownSec -= clampedDt;
    if (state.countdownSec <= 0) {
      state.countdownSec = 0;
      state.phase = 'racing';
      state.bannerCallout = {
        text: 'GO! GO! GO!',
        colorHex: '#84CC16',
        ttl: 1.2,
      };
    }
    return;
  }

  state.elapsedRaceSec += clampedDt;

  // Update Item Box respawn timers
  for (const box of state.itemBoxes) {
    if (box.respawnTimer > 0) {
      box.respawnTimer = Math.max(0, box.respawnTimer - clampedDt);
    }
  }

  // Update Dropped Honey Traps
  for (let i = state.droppedTraps.length - 1; i >= 0; i--) {
    state.droppedTraps[i].ttl -= clampedDt;
    if (state.droppedTraps[i].ttl <= 0) {
      state.droppedTraps.splice(i, 1);
    }
  }

  // Update Cream Pie Projectiles
  for (let i = state.pieProjectiles.length - 1; i >= 0; i--) {
    const pie = state.pieProjectiles[i];
    pie.x += pie.vx * clampedDt;
    pie.z += pie.vz * clampedDt;
    const pieProj = projectPointToTrack(pie.x, pie.z);
    pie.y = pieProj.closestY + 0.85;
    pie.ttl -= clampedDt;
    let hit = false;
    for (const r of state.racers) {
      if (r.id === pie.ownerId || r.finished) continue;
      if (Math.hypot(r.x - pie.x, r.z - pie.z) < 1.35) {
        hit = true;
        if (r.shieldTimer > 0) {
          r.shieldTimer = 0;
        } else {
          r.stunTimer = Math.max(r.stunTimer, 0.75);
          r.slowTimer = Math.max(r.slowTimer, 2.0);
          r.pokeImpulse = 1.2;
          pushEvent(state, `🥧 ${r.spec.shortName} got splatted by a Cream Pie!`, '#F472B6');
        }
        break;
      }
    }
    if (hit || pie.ttl <= 0) {
      state.pieProjectiles.splice(i, 1);
    }
  }

  // Step each racer
  for (const r of state.racers) {
    r.qCooldown = Math.max(0, r.qCooldown - clampedDt);
    r.fCooldown = Math.max(0, r.fCooldown - clampedDt);
    r.dashTimer = Math.max(0, r.dashTimer - clampedDt);
    r.shieldTimer = Math.max(0, r.shieldTimer - clampedDt);
    r.whirlwindTimer = Math.max(0, r.whirlwindTimer - clampedDt);
    r.slowTimer = Math.max(0, r.slowTimer - clampedDt);
    r.respawnBlinkTimer = Math.max(0, r.respawnBlinkTimer - clampedDt);
    r.landingBoostTimer = Math.max(0, r.landingBoostTimer - clampedDt);
    r.slapAnimTimer = Math.max(0, r.slapAnimTimer - clampedDt);
    r.pokeImpulse = Math.max(0, r.pokeImpulse - clampedDt * 2.2);

    const stunRecoveryRate = r.passiveSkillId === 'nimble_paws' ? 1.35 : 1.0;
    r.stunTimer = Math.max(0, r.stunTimer - clampedDt * stunRecoveryRate);

    if (r.finished) {
      r.pose = 'jump';
      r.vx *= 0.9;
      r.vz *= 0.9;
      continue;
    }

    // Current track projection
    const currentProj = projectPointToTrack(
      r.x,
      r.z,
      r.furthestCheckpointDist
    );
    r.groundY = currentProj.closestY;

    // Passive top speed & jump modifiers
    let topSpeed = 10.8;
    if (r.passiveSkillId === 'nimble_paws') {
      topSpeed *= 1.08;
    }
    if (r.dashTimer > 0) {
      topSpeed *= 1.68;
    }
    if (r.whirlwindTimer > 0) {
      topSpeed *= 1.28;
      r.yaw += clampedDt * 18.0; // Tornado spin visual rotation!
      // Cyclone Spin automatically knocks nearby rivals sideways!
      for (const other of state.racers) {
        if (other.id === r.id || other.finished) continue;
        const dx = other.x - r.x;
        const dz = other.z - r.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 2.55 && other.stunTimer <= 0) {
          if (other.shieldTimer > 0) {
            other.shieldTimer = 0;
            continue;
          }
          const oProj = projectPointToTrack(
            other.x,
            other.z,
            other.furthestCheckpointDist
          );
          const sideSign = oProj.lateralOffset >= 0 ? 1 : -1;
          const resist = other.passiveSkillId === 'bouncy_belly' ? 0.55 : 1.0;
          other.knockVx += oProj.rightX * sideSign * 17.5 * resist;
          other.knockVz += oProj.rightZ * sideSign * 17.5 * resist;
          other.vy = Math.max(other.vy, 4.2);
          other.stunTimer = 0.45;
          r.slapsLanded += 1;
        }
      }
    }
    if (r.landingBoostTimer > 0) {
      topSpeed *= 1.2;
    }
    // Downhill slope momentum boost ("ทางที่เป็นสโลปลงไป")
    if (currentProj.isDownhillSlope || currentProj.slope < -0.02) {
      const slopeBoost = r.passiveSkillId === 'feather_hop' ? 1.24 : 1.16;
      topSpeed *= slopeBoost;
    } else if (currentProj.slope > 0.03) {
      // Gentle uphill resistance
      topSpeed *= 0.93;
    }

    // Unavoidable Shallow Water Ford wading physics ("แอ่งน้ำตื้นที่ต้องลงน้ำโดยไม่มีทางหลีกเลี่ยง")
    if (currentProj.isShallowWater && r.y - r.groundY < 0.25 && r.dashTimer <= 0) {
      const wadeMult = r.passiveSkillId === 'slime_boots' ? 0.94 : 0.86;
      topSpeed *= wadeMult;
    }

    // Check Sticky Slime Pads (only if near ground level)
    let inSlime = false;
    if (r.y - r.groundY < 0.45 && r.dashTimer <= 0) {
      for (const slime of SLIME_PADS) {
        if (Math.hypot(r.x - slime.x, r.z - slime.z) < slime.radius) {
          inSlime = true;
          break;
        }
      }
      for (const trap of state.droppedTraps) {
        if (
          trap.ownerId !== r.id &&
          Math.hypot(r.x - trap.x, r.z - trap.z) < trap.radius
        ) {
          inSlime = true;
          r.slowTimer = Math.max(r.slowTimer, 1.1);
          break;
        }
      }
    }

    if (inSlime || r.slowTimer > 0) {
      const slimeMult = r.passiveSkillId === 'slime_boots' ? 0.78 : 0.48;
      topSpeed *= slimeMult;
    }

    // Check Speed Boost Pads
    if (r.y - r.groundY < 0.65) {
      for (const pad of BOOST_PADS) {
        if (Math.hypot(r.x - pad.x, r.z - pad.z) < 1.9) {
          const boostDur = r.passiveSkillId === 'lucky_magnet' ? 1.5 : 1.15;
          r.dashTimer = Math.max(r.dashTimer, boostDur);
          r.slowTimer = 0;
        }
      }
    }

    // Desired movement vector
    let moveDirX = 0;
    let moveDirZ = 0;

    if (r.isPlayer) {
      if (playerInput.skillQRequested) {
        activateRacerSkillQ(state, r);
      }
      if (playerInput.itemERequested) {
        activateRacerItemE(state, r);
      }
      if (playerInput.slapFRequested) {
        activateRacerSlapF(state, r);
      }
      if (playerInput.jumpRequested && r.y <= r.groundY + 0.06 && r.stunTimer <= 0) {
        const jumpMult = r.passiveSkillId === 'feather_hop' ? 1.22 : 1.0;
        r.vy = 11.4 * jumpMult;
        r.y = r.groundY + 0.08;
      }

      if (r.stunTimer <= 0) {
        const camFwdX = -Math.sin(playerInput.cameraYaw);
        const camFwdZ = -Math.cos(playerInput.cameraYaw);
        const camRightX = Math.cos(playerInput.cameraYaw);
        const camRightZ = -Math.sin(playerInput.cameraYaw);

        const rawX =
          camFwdX * playerInput.moveForward + camRightX * playerInput.moveRight;
        const rawZ =
          camFwdZ * playerInput.moveForward + camRightZ * playerInput.moveRight;
        const mag = Math.hypot(rawX, rawZ);
        if (mag > 0.01) {
          moveDirX = rawX / mag;
          moveDirZ = rawZ / mag;
          if (r.whirlwindTimer <= 0) {
            const targetYaw = Math.atan2(-moveDirX, -moveDirZ);
            let diff = targetYaw - r.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            r.yaw += diff * Math.min(1, clampedDt * 18.0);
          }
        }
      }
    } else {
      // AI Bot Steering & Mischievous Behavior
      r.botLaneTimer -= clampedDt;
      if (r.botLaneTimer <= 0) {
        r.botLaneTimer = 1.6 + Math.random() * 2.0;
        r.botPreferredLane = (Math.random() - 0.5) * 3.4;
      }

      const lookAheadDist = r.furthestCheckpointDist + 7.5;
      const sampleAhead = sampleTrackAtDistance(lookAheadDist);

      let targetX: number;
      let targetZ: number;

      // When approaching or crossing the Deep River Stepping-Stone Hazard, bots target the NEXT stone ahead and hop cleanly!
      if (currentProj.isDeepWaterHazard || sampleAhead.isDeepWaterHazard) {
        let minAheadDist = Infinity;
        for (const st of RIVER_STEPPING_STONES) {
          const d = st.trackDist - currentProj.trackDist;
          if (d > 1.8 && d < minAheadDist) {
            minAheadDist = d;
          }
        }

        let nextStone: SteppingStoneSpec | null = null;
        if (minAheadDist < Infinity) {
          let bestLatDiff = Infinity;
          for (const st of RIVER_STEPPING_STONES) {
            const d = st.trackDist - currentProj.trackDist;
            if (Math.abs(d - minAheadDist) < 1.2) {
              const latDiff = Math.abs(
                st.lateralOffset - r.botPreferredLane * 0.45
              );
              if (latDiff < bestLatDiff) {
                bestLatDiff = latDiff;
                nextStone = st;
              }
            }
          }
        }

        if (nextStone) {
          targetX = nextStone.x;
          targetZ = nextStone.z;
        } else {
          // Past the final stepping stone -> aim straight for the solid riverbank ahead!
          const lastStoneDist =
            RIVER_STEPPING_STONES.length > 0
              ? RIVER_STEPPING_STONES[RIVER_STEPPING_STONES.length - 1].trackDist
              : currentProj.trackDist;
          const exitBank = sampleTrackAtDistance(
            Math.max(currentProj.trackDist + 6.5, lastStoneDist + 6.5)
          );
          targetX = exitBank.x;
          targetZ = exitBank.z;
        }

        const toTargetX = targetX - r.x;
        const toTargetZ = targetZ - r.z;
        const distToTarget = Math.hypot(toTargetX, toTargetZ);
        const dirToTargetX = distToTarget > 0.01 ? toTargetX / distToTarget : currentProj.dirX;
        const dirToTargetZ = distToTarget > 0.01 ? toTargetZ / distToTarget : currentProj.dirZ;

        // Check if the point just ahead of the bot's feet is over deep water (off the current stone edge)
        const probeX = r.x + dirToTargetX * 1.15;
        const probeZ = r.z + dirToTargetZ * 1.15;
        const probeProj = projectPointToTrack(probeX, probeZ, currentProj.trackDist);
        let probeOnStone = false;
        if (probeProj.isDeepWaterHazard) {
          for (const st of RIVER_STEPPING_STONES) {
            if (Math.hypot(probeX - st.x, probeZ - st.z) <= st.radius + 0.15) {
              probeOnStone = true;
              break;
            }
          }
        }

        // Auto-hop right before leaving the stone edge or when within jump range of the next stone
        if (
          r.y <= r.groundY + 0.08 &&
          ((probeProj.isDeepWaterHazard && !probeOnStone) ||
            (distToTarget > 2.0 && distToTarget < 6.2))
        ) {
          r.vy = 12.4;
          r.y = r.groundY + 0.12;
          r.dashTimer = Math.max(r.dashTimer, 0.32);
        }
      } else {
        const safeLane =
          sampleAhead.isBridgeOverWater || sampleAhead.isHighBridge
            ? r.botPreferredLane * 0.25
            : r.botPreferredLane;
        targetX = sampleAhead.x + sampleAhead.rightX * safeLane;
        targetZ = sampleAhead.z + sampleAhead.rightZ * safeLane;
      }

      const dx = targetX - r.x;
      const dz = targetZ - r.z;
      const mag = Math.hypot(dx, dz);
      if (mag > 0.01 && r.stunTimer <= 0) {
        moveDirX = dx / mag;
        moveDirZ = dz / mag;
        if (r.whirlwindTimer <= 0) {
          const targetYaw = Math.atan2(-moveDirX, -moveDirZ);
          let diff = targetYaw - r.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          r.yaw += diff * Math.min(1, clampedDt * 14.0);
        }
      }

      // Rubber-banding so bots stay competitive across the 2:45 min race
      const playerRacer = state.racers[0];
      const diffFromPlayer = playerRacer.totalProgress - r.totalProgress;
      if (diffFromPlayer > 35) {
        topSpeed *= 1.12;
      } else if (diffFromPlayer < -40) {
        topSpeed *= 0.92;
      } else {
        topSpeed *= 0.985;
      }

      if (r.y <= r.groundY + 0.05 && (inSlime || currentProj.isShallowWater) && Math.random() < 0.08) {
        r.vy = 11.0;
        r.y = r.groundY + 0.08;
      }
      if (
        r.qCooldown <= 0 &&
        !currentProj.isDeepWaterHazard &&
        Math.random() < 0.016
      ) {
        activateRacerSkillQ(state, r);
      }
      if (
        r.heldItem &&
        !currentProj.isDeepWaterHazard &&
        Math.random() < 0.025
      ) {
        activateRacerItemE(state, r);
      }
      if (
        r.fCooldown <= 0 &&
        !currentProj.isDeepWaterHazard &&
        Math.random() < 0.03
      ) {
        for (const other of state.racers) {
          if (other.id !== r.id && Math.hypot(other.x - r.x, other.z - r.z) < 2.2) {
            activateRacerSlapF(state, r);
            break;
          }
        }
      }
    }

    // Apply velocity & knockback decay
    const targetVx = moveDirX * topSpeed;
    const targetVz = moveDirZ * topSpeed;
    const accel = r.y > r.groundY + 0.15 ? 6.5 : 12.0;
    r.vx += (targetVx - r.vx) * Math.min(1, accel * clampedDt);
    r.vz += (targetVz - r.vz) * Math.min(1, accel * clampedDt);

    // Spinning Turntable Platform & Sweeping Beam physics
    for (const tt of TURNTABLES) {
      const dx = r.x - tt.x;
      const dz = r.z - tt.z;
      const dist = Math.hypot(dx, dz);
      if (dist < tt.radius) {
        const tangX = -dz * tt.angularSpeed * 0.42;
        const tangZ = dx * tt.angularSpeed * 0.42;
        r.x += tangX * clampedDt;
        r.z += tangZ * clampedDt;

        if (r.y - r.groundY < 0.65) {
          const barAngle = state.elapsedRaceSec * tt.angularSpeed;
          const barDirX = Math.cos(barAngle);
          const barDirZ = Math.sin(barAngle);
          const projAlong = dx * barDirX + dz * barDirZ;
          if (Math.abs(projAlong) < tt.barHalfLength) {
            const perpDist = Math.abs(-dx * barDirZ + dz * barDirX);
            if (perpDist < 0.62) {
              if (r.shieldTimer > 0) {
                r.shieldTimer = 0;
              } else {
                const resist = r.passiveSkillId === 'bouncy_belly' ? 0.55 : 1.0;
                const normalX = -barDirZ * Math.sign(tt.angularSpeed);
                const normalZ = barDirX * Math.sign(tt.angularSpeed);
                r.knockVx += normalX * 15.0 * resist;
                r.knockVz += normalZ * 15.0 * resist;
                r.vy = 4.6;
                r.y = r.groundY + 0.08;
                r.stunTimer = Math.max(r.stunTimer, 0.35);
              }
            }
          }
        }
      }
    }

    // Rolling Boulders & Giant Beach Balls collision
    for (const b of ROLLING_BOULDERS) {
      const offset =
        Math.sin(state.elapsedRaceSec * b.speed + b.phase) * b.sweepHalfWidth;
      const bx = b.centerX + b.rightX * offset;
      const bz = b.centerZ + b.rightZ * offset;
      const dx = r.x - bx;
      const dz = r.z - bz;
      const dist = Math.hypot(dx, dz);
      if (dist < b.radius + 0.68 && r.y - r.groundY < b.radius * 1.45) {
        if (r.shieldTimer > 0) {
          r.shieldTimer = 0;
        } else {
          const resist = r.passiveSkillId === 'bouncy_belly' ? 0.55 : 1.0;
          const nx = dx / Math.max(0.1, dist);
          const nz = dz / Math.max(0.1, dist);
          r.knockVx += nx * 18.0 * resist;
          r.knockVz += nz * 18.0 * resist;
          r.vy = 5.5;
          r.y = r.groundY + 0.08;
          r.stunTimer = Math.max(r.stunTimer, 0.5);
          r.pokeImpulse = 1.2;
          if (r.isPlayer) {
            state.bannerCallout = {
              text: b.isBeachBall ? 'BONKED BY GIANT BALL!' : 'HIT BY BOULDER!',
              colorHex: '#EF4444',
              ttl: 1.0,
            };
          }
        }
      }
    }

    // Soft Racer-vs-Racer body bump separation (skip while hopping across deep water stones)
    if (!currentProj.isDeepWaterHazard) {
      for (const other of state.racers) {
        if (other.id === r.id || other.finished) continue;
        const dx = r.x - other.x;
        const dz = r.z - other.z;
        const dist = Math.hypot(dx, dz);
        const minSep = 1.12;
        if (dist < minSep && dist > 0.001) {
          const push = (minSep - dist) * 4.5 * clampedDt;
          r.x += (dx / dist) * push;
          r.z += (dz / dist) * push;
        }
      }
    }

    // Integrate horizontal position
    r.x += (r.vx + r.knockVx) * clampedDt;
    r.z += (r.vz + r.knockVz) * clampedDt;

    const knockDecay = Math.pow(0.015, clampedDt * stunRecoveryRate);
    r.knockVx *= knockDecay;
    r.knockVz *= knockDecay;

    // Project new position onto smooth spline track
    const proj = projectPointToTrack(r.x, r.z, r.furthestCheckpointDist);
    const nextGroundY = proj.closestY;

    // Integrate vertical jump / gravity relative to undulating 3D track elevation
    // Use 0.24 threshold when vy == 0 so downhill slopes never cause rapid run<->jump flickering!
    const isActivelyJumping =
      r.vy > 0 || (r.vy < 0 && r.y > nextGroundY + 0.02) || r.y > nextGroundY + 0.24;
    r.groundY = nextGroundY;
    if (isActivelyJumping) {
      r.y += r.vy * clampedDt;
      r.vy -= 28.0 * clampedDt; // crisp gravity
      if (r.y <= r.groundY) {
        r.y = r.groundY;
        r.vy = 0;
        if (r.passiveSkillId === 'feather_hop') {
          r.landingBoostTimer = 0.65;
        }
      }
    } else {
      r.y = r.groundY;
      r.vy = 0;
    }

    // Check Mystery Item Box pickup
    if (!r.heldItem) {
      for (const box of state.itemBoxes) {
        if (
          box.respawnTimer <= 0 &&
          Math.hypot(r.x - box.x, r.z - box.z) < 1.45
        ) {
          box.respawnTimer = 6.0;
          const randomItem =
            ITEM_LIST[Math.floor(Math.random() * ITEM_LIST.length)];
          r.heldItem = randomItem;
          r.pokeImpulse = 0.65;
          if (r.passiveSkillId === 'lucky_magnet') {
            r.qCooldown = Math.max(0, r.qCooldown - 2.0);
            r.fCooldown = Math.max(0, r.fCooldown - 2.0);
          }
          if (r.isPlayer) {
            state.bannerCallout = {
              text: `GOT ${ITEMS[randomItem].shortLabel.toUpperCase()} [PRESS E]!`,
              colorHex: ITEMS[randomItem].colorHex,
              ttl: 1.1,
            };
          }
          break;
        }
      }
    }

    const halfWidth = proj.width * 0.5;

    // Check if racer is in the Deep Water Hazard section ("จุดที่เป็นน้ำลึกที่ตกแล้วตาย แต่จะมีก้อนหินโผล่ขึ้นมาให้กระโดดได้")
    let onSteppingStone: SteppingStoneSpec | null = null;
    if (proj.isDeepWaterHazard) {
      const stoneMargin = r.isPlayer ? 0.38 : 0.65;
      for (const stone of RIVER_STEPPING_STONES) {
        if (
          Math.hypot(r.x - stone.x, r.z - stone.z) <=
          stone.radius + stoneMargin
        ) {
          onSteppingStone = stone;
          break;
        }
      }

      // If not standing on a stepping stone and not jumping in the air -> FALL INTO DEEP WATER & DIE/RESPAWN!
      if (!onSteppingStone && r.y <= r.groundY + 0.16) {
        r.x = r.checkpointX;
        r.y = r.checkpointY + 0.65;
        r.z = r.checkpointZ;
        r.yaw = r.checkpointYaw;
        r.vx = 0;
        r.vz = 0;
        r.knockVx = 0;
        r.knockVz = 0;
        r.respawnBlinkTimer = 1.4;
        r.stunTimer = 0.25;
        // If a bot somehow falls in deep water, advance it to the next stepping stone so it never loops
        if (!r.isPlayer) {
          let rescueStone = RIVER_STEPPING_STONES[0];
          for (const st of RIVER_STEPPING_STONES) {
            if (st.trackDist >= r.furthestCheckpointDist - 1.0) {
              rescueStone = st;
              break;
            }
          }
          if (rescueStone) {
            r.x = rescueStone.x;
            r.y = rescueStone.y + 0.4;
            r.z = rescueStone.z;
            r.groundY = rescueStone.y;
            r.furthestCheckpointDist = Math.max(
              r.furthestCheckpointDist,
              rescueStone.trackDist
            );
          }
        }
        if (r.isPlayer) {
          state.bannerCallout = {
            text: 'DEEP WATER! JUMP ON THE STEPPING STONES!',
            colorHex: '#0284C7',
            ttl: 1.5,
          };
        }
        pushEvent(
          state,
          `🌊 ${r.spec.shortName} sank in Deep Water! Hop on the stones!`,
          '#0284C7'
        );
        continue;
      }
    }

    // Wooden Plank Bridge OR High Viaduct Bridge Fall & Instant Checkpoint Respawn!
    if (
      (proj.isBridgeOverWater || proj.isHighBridge) &&
      !proj.isDeepWaterHazard &&
      Math.abs(proj.lateralOffset) > halfWidth + 0.35 &&
      r.y <= r.groundY + 0.35
    ) {
      r.x = r.checkpointX;
      r.y = r.checkpointY + 0.6;
      r.z = r.checkpointZ;
      r.yaw = r.checkpointYaw;
      r.vx = 0;
      r.vz = 0;
      r.knockVx = 0;
      r.knockVz = 0;
      r.respawnBlinkTimer = 1.4;
      r.stunTimer = 0.35;
      if (r.isPlayer) {
        state.bannerCallout = {
          text: proj.isBridgeOverWater
            ? 'SPLASH! FELL OFF TIMBER PLANK BRIDGE!'
            : 'FELL OFF CANOPY PLANK BRIDGE!',
          colorHex: '#06B6D4',
          ttl: 1.3,
        };
      }
      pushEvent(
        state,
        proj.isBridgeOverWater
          ? `💦 ${r.spec.shortName} fell off the Timber Plank Bridge!`
          : `🌲 ${r.spec.shortName} fell off the Canopy Plank Bridge!`,
        '#06B6D4'
      );
      continue;
    }

    // Soft guard curbs (Wooden Fences / Bush Hedges) on normal road & shallow water segments
    if (
      !proj.isBridgeOverWater &&
      !proj.isHighBridge &&
      !proj.isDeepWaterHazard &&
      Math.abs(proj.lateralOffset) > halfWidth
    ) {
      const clampedLat = Math.sign(proj.lateralOffset) * halfWidth;
      r.x = proj.closestX + proj.rightX * clampedLat;
      r.z = proj.closestZ + proj.rightZ * clampedLat;
      r.knockVx *= 0.3;
      r.knockVz *= 0.3;
    }

    // Forward checkpoint progression & 1-Lap Finish detection
    const forwardAdvance = proj.trackDist - r.furthestCheckpointDist;
    if (forwardAdvance > -35 && forwardAdvance < 75) {
      if (proj.trackDist > r.furthestCheckpointDist) {
        r.furthestCheckpointDist = proj.trackDist;
        r.totalProgress = proj.trackDist;

        // Only save safe respawn checkpoints on solid ground or on a stepping stone
        if (onSteppingStone) {
          r.checkpointX = onSteppingStone.x;
          r.checkpointY = onSteppingStone.y;
          r.checkpointZ = onSteppingStone.z;
          r.checkpointYaw = Math.atan2(-proj.dirX, -proj.dirZ);
        } else if (!proj.isDeepWaterHazard) {
          const safeSample = sampleTrackAtDistance(
            Math.max(2, proj.trackDist - 2.5)
          );
          if (!safeSample.isDeepWaterHazard) {
            r.checkpointX = safeSample.x;
            r.checkpointY = safeSample.y;
            r.checkpointZ = safeSample.z;
            r.checkpointYaw = Math.atan2(-safeSample.dirX, -safeSample.dirZ);
          }
        }
      } else {
        r.totalProgress = Math.max(0, proj.trackDist);
      }
    } else if (
      r.furthestCheckpointDist > TOTAL_TRACK_LENGTH * 0.85 &&
      proj.trackDist < TOTAL_TRACK_LENGTH * 0.15
    ) {
      // Crossed the Start/Finish Archway after completing the full loop!
      r.finished = true;
      r.totalProgress = TOTAL_TRACK_LENGTH + 10;
      r.finishTimeSec = state.elapsedRaceSec;
      r.pose = 'jump';
      pushEvent(
        state,
        `🏁 ${r.spec.shortName} crossed the Finish Line!`,
        '#84CC16'
      );
      if (r.isPlayer) {
        state.phase = 'finished';
        state.bannerCallout = {
          text: 'FINISH! RACE COMPLETE!',
          colorHex: '#84CC16',
          ttl: 3.0,
        };
      }
    }

    // Update animation pose (`1. idle`, `2. jump`, `3. run`) with hysteresis to prevent rapid flickering
    const groundSpeed = Math.hypot(r.vx, r.vz);
    if (r.y > r.groundY + 0.15 || r.vy > 1.0) {
      r.pose = 'jump';
    } else if (groundSpeed > (r.pose === 'run' ? 0.85 : 1.35)) {
      r.pose = 'run';
    } else {
      r.pose = 'idle';
    }
  }

  // Compute live rankings (1..8)
  const sorted = [...state.racers].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTimeSec ?? 9999) - (b.finishTimeSec ?? 9999);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.totalProgress - a.totalProgress;
  });
  sorted.forEach((r, idx) => {
    r.rank = idx + 1;
  });
}
