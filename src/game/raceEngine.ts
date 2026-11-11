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

export type TrackId = 'woodland' | 'snow_glacier';

export interface TrackMetadata {
  id: TrackId;
  name: string;
  thaiName: string;
  subtitle: string;
  badgeText: string;
  accentHex: string;
  secondaryHex: string;
  lengthLabel: string;
  features: string[];
}

export const TRACK_CATALOG: Record<TrackId, TrackMetadata> = {
  woodland: {
    id: 'woodland',
    name: 'Woodland Forest Circuit',
    thaiName: 'สนามป่ามหัศจรรย์ (Woodland Forest)',
    subtitle: 'Dense Pine Woods • Shallow Creek • Plank Bridges • River Stones',
    badgeText: 'FOREST TRAIL',
    accentHex: '#10B981',
    secondaryHex: '#C86D3B',
    lengthLabel: '1,820m',
    features: ['Shallow Creek Ford', 'Canopy Plank Bridge', 'Deep River Stones'],
  },
  snow_glacier: {
    id: 'snow_glacier',
    name: 'Glacier Peak Circuit',
    thaiName: 'สนามหิมะและถ้ำคริสตัลน้ำแข็ง (Glacier Peak)',
    subtitle: 'Ice Palace • Aurora Crystal Bridge • Bobsled Ice Chute • Iceberg Hop',
    badgeText: 'SNOW & ICE',
    accentHex: '#38BDF8',
    secondaryHex: '#818CF8',
    lengthLabel: '1,845m',
    features: ['Ice Palace & Igloos', 'Crystal Sky Bridge', 'Arctic Iceberg Hop'],
  },
};

export type TrackSurfaceType =
  | 'dirt'
  | 'cobble'
  | 'brick'
  | 'wood_plank'
  | 'shallow_water'
  | 'deep_water'
  | 'ice'
  | 'packed_snow';

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

/**
 * 28 Control Points defining the spectacular Snow & Ice Grand Circuit (~1,845u):
 * "Glacier Peak Circuit" — featuring Nordic Ski Chalet Village, Slushy Meltwater Ford,
 * Crystal Ice-Brick Ascent, Aurora Crystal Plank Sky Bridge, Olympic Bobsled Ice Chute,
 * Sub-Zero Arctic River with Floating 3D Icebergs/Ice Floes to hop across,
 * Glowing Ice Cavern Rib Tunnel, and the Grand Ice Palace Final Sprint!
 */
export const SNOW_TRACK_CONTROL_POINTS: TrackWaypoint[] = [
  // 0..1: Frostbite Nordic Ski Village (Packed Snow + Candy-Cane / Frost Fence)
  {
    x: 0,
    y: 0.0,
    z: 18,
    width: 11.4,
    zoneName: 'Frostbite Ski Chalet Plaza',
    surfaceType: 'packed_snow',
    borderType: 'wood_fence',
  },
  {
    x: 0,
    y: 0.0,
    z: -46,
    width: 11.0,
    zoneName: 'Snowman & Igloo Promenade',
    surfaceType: 'packed_snow',
    borderType: 'wood_fence',
  },

  // 2..3: Unavoidable Slushy Glacial Meltwater Stream (Must wade through icy slush!)
  {
    x: -36,
    y: 0.0,
    z: -112,
    width: 11.4,
    zoneName: 'Shivering Slush Meltwater Ford (Wade Through!)',
    surfaceType: 'shallow_water',
    borderType: 'bush_hedge',
    isShallowWater: true,
  },
  {
    x: 26,
    y: 0.6,
    z: -174,
    width: 11.0,
    zoneName: 'Shivering Slush Meltwater Ford (Wade Through!)',
    surfaceType: 'shallow_water',
    borderType: 'bush_hedge',
    isShallowWater: true,
  },

  // 4..6: Glacial Ice-Block & Frosted Cobble Climb toward the Ice Palace
  {
    x: -28,
    y: 5.4,
    z: -236,
    width: 10.0,
    zoneName: 'Frosted Granite Ridge Climb',
    surfaceType: 'cobble',
    borderType: 'bush_hedge',
  },
  {
    x: 48,
    y: 10.2,
    z: -282,
    width: 9.8,
    zoneName: 'Crystal Ice Palace Ascent',
    surfaceType: 'brick',
    borderType: 'wood_fence',
  },
  {
    x: 134,
    y: 13.8,
    z: -264,
    width: 9.6,
    zoneName: 'Grand Ice Fortress Courtyard',
    surfaceType: 'ice',
    borderType: 'wood_fence',
  },

  // 7..9: Aurora Crystal Plank Suspension Bridge (High Altitude Translucent Ice Planks!)
  {
    x: 204,
    y: 15.2,
    z: -206,
    width: 7.8,
    zoneName: 'Aurora Crystal Plank Skybridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },
  {
    x: 252,
    y: 15.8,
    z: -128,
    width: 7.6,
    zoneName: 'Aurora Crystal Plank Skybridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },
  {
    x: 232,
    y: 14.4,
    z: -48,
    width: 7.8,
    zoneName: 'Aurora Crystal Plank Skybridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },

  // 10..12: Olympic Bobsled Glossy Ice Chute (High-Speed Downhill Ice Glide!)
  {
    x: 176,
    y: 10.8,
    z: 16,
    width: 10.6,
    zoneName: 'Glacier Bobsled Ice Chute',
    surfaceType: 'ice',
    borderType: 'wood_fence',
    isDownhillSlope: true,
  },
  {
    x: 212,
    y: 6.4,
    z: 88,
    width: 10.8,
    zoneName: 'Glacier Bobsled Ice Chute',
    surfaceType: 'ice',
    borderType: 'bush_hedge',
    isDownhillSlope: true,
  },
  {
    x: 162,
    y: 2.2,
    z: 152,
    width: 10.4,
    zoneName: 'Snowdrift Slalom Run',
    surfaceType: 'packed_snow',
    borderType: 'bush_hedge',
    isDownhillSlope: true,
  },

  // 13..14: Penguins' Snowbank Bend approaching the Freezing Arctic Fjord
  {
    x: 112,
    y: 1.0,
    z: 204,
    width: 10.0,
    zoneName: 'Polar Snowbank Bend',
    surfaceType: 'packed_snow',
    borderType: 'bush_hedge',
  },
  {
    x: 60,
    y: 0.4,
    z: 222,
    width: 9.6,
    zoneName: 'Arctic Fjord Ice Edge',
    surfaceType: 'cobble',
    borderType: 'wood_fence',
  },

  // 15..17: Sub-Zero Deep Arctic River — Hop Across Floating 3D Icebergs / Ice Floes!
  {
    x: 18,
    y: 0.35,
    z: 222,
    width: 9.0,
    zoneName: 'Sub-Zero Fjord (Hop the Floating Icebergs!)',
    surfaceType: 'deep_water',
    borderType: 'none',
    isDeepWaterHazard: true,
    isBridgeOverWater: true,
  },
  {
    x: -22,
    y: 0.35,
    z: 222,
    width: 9.0,
    zoneName: 'Sub-Zero Fjord (Hop the Floating Icebergs!)',
    surfaceType: 'deep_water',
    borderType: 'none',
    isDeepWaterHazard: true,
    isBridgeOverWater: true,
  },
  {
    x: -62,
    y: 0.35,
    z: 222,
    width: 9.0,
    zoneName: 'Sub-Zero Fjord (Hop the Floating Icebergs!)',
    surfaceType: 'deep_water',
    borderType: 'none',
    isDeepWaterHazard: true,
    isBridgeOverWater: true,
  },

  // 18..21: Frozen West Shore & Crystal Ice-Rib Cavern Climb
  {
    x: -108,
    y: 0.5,
    z: 220,
    width: 9.8,
    zoneName: 'Glacier West Snowbank',
    surfaceType: 'packed_snow',
    borderType: 'wood_fence',
  },
  {
    x: -164,
    y: 3.4,
    z: 238,
    width: 10.2,
    zoneName: 'Glowing Crystal Rib Cavern',
    surfaceType: 'ice',
    borderType: 'bush_hedge',
  },
  {
    x: -222,
    y: 7.4,
    z: 184,
    width: 9.8,
    zoneName: 'Frost Giant Ice-Brick Climb',
    surfaceType: 'brick',
    borderType: 'bush_hedge',
  },
  {
    x: -234,
    y: 11.4,
    z: 106,
    width: 7.8,
    zoneName: 'Northern Lights Ice-Plank Bridge',
    surfaceType: 'wood_plank',
    borderType: 'wood_fence',
    isPlankBridge: true,
    isHighBridge: true,
  },

  // 22..24: Avalanche Ice-Brick & Glossy Glacier Chute
  {
    x: -186,
    y: 8.2,
    z: 36,
    width: 10.4,
    zoneName: 'Avalanche Ice-Brick Chute',
    surfaceType: 'brick',
    borderType: 'wood_fence',
    isDownhillSlope: true,
  },
  {
    x: -218,
    y: 3.8,
    z: -40,
    width: 10.6,
    zoneName: 'Mirror Ice Skating Rink',
    surfaceType: 'ice',
    borderType: 'bush_hedge',
    isDownhillSlope: true,
  },
  {
    x: -166,
    y: 0.6,
    z: -104,
    width: 10.2,
    zoneName: 'Snowflake Pine Alley',
    surfaceType: 'packed_snow',
    borderType: 'bush_hedge',
  },

  // 25..27: Second Frozen Meltwater Ford + Nordic Chalet Final Sprint
  {
    x: -106,
    y: 0.0,
    z: -66,
    width: 11.2,
    zoneName: 'Frozen Lagoon Shallows (Wade Through!)',
    surfaceType: 'shallow_water',
    borderType: 'bush_hedge',
    isShallowWater: true,
  },
  {
    x: -92,
    y: 2.4,
    z: 18,
    width: 10.0,
    zoneName: 'Winter Lantern Crest',
    surfaceType: 'cobble',
    borderType: 'wood_fence',
  },
  {
    x: -44,
    y: 1.0,
    z: 54,
    width: 10.8,
    zoneName: 'Glacier Peak Final Sprint',
    surfaceType: 'ice',
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

function buildWaypointsFromControlPoints(controlPoints: TrackWaypoint[]): TrackWaypoint[] {
  const pts: TrackWaypoint[] = [];
  const n = controlPoints.length;
  for (let i = 0; i < n; i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

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
}

function buildSegmentsFromWaypoints(waypoints: TrackWaypoint[]): TrackSegment[] {
  const segs: TrackSegment[] = [];
  let accum = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const wp0 = waypoints[i];
    const wp1 = waypoints[(i + 1) % waypoints.length];
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
}

let activeTrackId: TrackId = 'woodland';

export function getActiveTrackId(): TrackId {
  return activeTrackId;
}

/**
 * Dense smooth waypoints generated by Catmull-Rom spline interpolation
 * so there are zero sharp corners anywhere on the circuit.
 */
export const TRACK_WAYPOINTS: TrackWaypoint[] = buildWaypointsFromControlPoints(
  TRACK_CONTROL_POINTS
);

export const TRACK_SEGMENTS: TrackSegment[] = buildSegmentsFromWaypoints(
  TRACK_WAYPOINTS
);

export let TOTAL_TRACK_LENGTH =
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

function buildRiverSteppingStones(): SteppingStoneSpec[] {
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
}

export const RIVER_STEPPING_STONES: SteppingStoneSpec[] =
  buildRiverSteppingStones();

// ============================================================================
// TRACK OBSTACLES & ITEMS DEFINITIONS ACROSS THE CIRCUIT
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

function buildSlimePads(): SlimePadSpec[] {
  return [
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
}

function buildTurntables(): TurntableSpec[] {
  return [
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
}

function buildRollingBoulders(trackId: TrackId): RollingBoulderSpec[] {
  const isSnow = trackId === 'snow_glacier';
  return [
    { frac: 0.14, speed: 2.2, phase: 0.0, r: 1.15, hex: isSnow ? '#F8FAFC' : '#8C7A6B', ball: false },
    { frac: 0.19, speed: 2.5, phase: 1.5, r: 1.15, hex: isSnow ? '#38BDF8' : '#F43F5E', ball: true },
    { frac: 0.36, speed: 2.4, phase: 2.8, r: 1.15, hex: isSnow ? '#818CF8' : '#3B82F6', ball: true },
    { frac: 0.41, speed: 2.6, phase: 4.1, r: 1.2, hex: isSnow ? '#E2E8F0' : '#78685A', ball: false },
    { frac: 0.68, speed: 2.3, phase: 0.9, r: 1.15, hex: isSnow ? '#22D3EE' : '#F59E0B', ball: true },
    { frac: 0.74, speed: 2.6, phase: 2.4, r: 1.2, hex: isSnow ? '#F8FAFC' : '#8C7A6B', ball: false },
    { frac: 0.83, speed: 2.5, phase: 3.7, r: 1.15, hex: isSnow ? '#C084FC' : '#EC4899', ball: true },
    { frac: 0.86, speed: 2.7, phase: 5.1, r: 1.25, hex: isSnow ? '#E2E8F0' : '#78685A', ball: false },
    { frac: 0.89, speed: 2.4, phase: 1.2, r: 1.15, hex: isSnow ? '#34D399' : '#10B981', ball: true },
    { frac: 0.95, speed: 2.6, phase: 2.9, r: 1.2, hex: isSnow ? '#F8FAFC' : '#8C7A6B', ball: false },
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
}

function buildBoostPads(): BoostPadSpec[] {
  return [
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
}

export const SLIME_PADS: SlimePadSpec[] = buildSlimePads();
export const TURNTABLES: TurntableSpec[] = buildTurntables();
export const ROLLING_BOULDERS: RollingBoulderSpec[] = buildRollingBoulders(activeTrackId);
export const BOOST_PADS: BoostPadSpec[] = buildBoostPads();

/**
 * Switches the active circuit ('woodland' or 'snow_glacier') and rebuilds all
 * spline segments, stepping stones / icebergs, hazards, and boost pads in-place.
 */
export function setActiveTrack(trackId: TrackId): void {
  activeTrackId = trackId;
  const controlPts =
    trackId === 'snow_glacier' ? SNOW_TRACK_CONTROL_POINTS : TRACK_CONTROL_POINTS;
  const newWaypoints = buildWaypointsFromControlPoints(controlPts);
  TRACK_WAYPOINTS.splice(0, TRACK_WAYPOINTS.length, ...newWaypoints);

  const newSegments = buildSegmentsFromWaypoints(TRACK_WAYPOINTS);
  TRACK_SEGMENTS.splice(0, TRACK_SEGMENTS.length, ...newSegments);
  TOTAL_TRACK_LENGTH = TRACK_SEGMENTS[TRACK_SEGMENTS.length - 1].endDist;

  const newStones = buildRiverSteppingStones();
  RIVER_STEPPING_STONES.splice(0, RIVER_STEPPING_STONES.length, ...newStones);

  const newSlimes = buildSlimePads();
  SLIME_PADS.splice(0, SLIME_PADS.length, ...newSlimes);

  const newTurntables = buildTurntables();
  TURNTABLES.splice(0, TURNTABLES.length, ...newTurntables);

  const newBoulders = buildRollingBoulders(trackId);
  ROLLING_BOULDERS.splice(0, ROLLING_BOULDERS.length, ...newBoulders);

  const newBoosts = buildBoostPads();
  BOOST_PADS.splice(0, BOOST_PADS.length, ...newBoosts);
}

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
  hazardCooldown: number;
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
      hazardCooldown: 0,
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

function applyBallisticKnockback(
  target: RacerState,
  dirX: number,
  dirZ: number,
  horizSpeed: number,
  upwardVy: number,
  stunSec: number
): void {
  const len = Math.hypot(dirX, dirZ);
  const nx = len > 0.001 ? dirX / len : 0;
  const nz = len > 0.001 ? dirZ / len : 1;
  const resist = target.passiveSkillId === 'bouncy_belly' ? 0.62 : 1.0;

  // Dampen conflicting run momentum so knockback follows a clean ballistic arc
  target.vx *= 0.32;
  target.vz *= 0.32;

  const nextKx = target.knockVx * 0.35 + nx * horizSpeed * resist;
  const nextKz = target.knockVz * 0.35 + nz * horizSpeed * resist;
  const kMag = Math.hypot(nextKx, nextKz);
  const maxK = 16.0;
  if (kMag > maxK) {
    target.knockVx = (nextKx / kMag) * maxK;
    target.knockVz = (nextKz / kMag) * maxK;
  } else {
    target.knockVx = nextKx;
    target.knockVz = nextKz;
  }

  target.vy = Math.max(target.vy, upwardVy * (0.85 + 0.15 * resist));
  target.y = Math.max(target.groundY + 0.08, target.y);
  target.stunTimer = Math.max(target.stunTimer, stunSec * resist);
  target.pokeImpulse = 1.15;
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
    racer.vy = 15.8;
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
          other.hazardCooldown = 0.5;
          continue;
        }
        const falloff = 0.55 + 0.45 * ((4.0 - dist) / 4.0);
        applyBallisticKnockback(
          other,
          dx,
          dz,
          13.5 * falloff,
          6.4 * falloff,
          0.5
        );
        other.slowTimer = Math.max(other.slowTimer, 2.0);
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
      applyBallisticKnockback(
        bestTarget,
        proj.rightX * sideSign,
        proj.rightZ * sideSign,
        14.8,
        7.2,
        0.58
      );
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
        other.hazardCooldown = 0.5;
        applyBallisticKnockback(racer, -dx, -dz, 10.5, 4.8, 0.25);
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

      const dirX =
        proj.rightX * sideSign * 0.78 + (dx / Math.max(0.1, dist)) * 0.22;
      const dirZ =
        proj.rightZ * sideSign * 0.78 + (dz / Math.max(0.1, dist)) * 0.22;

      applyBallisticKnockback(other, dirX, dirZ, 14.2, 6.6, 0.42);
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
    r.hazardCooldown = Math.max(0, r.hazardCooldown - clampedDt);
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
        if (dist < 2.55 && other.stunTimer <= 0 && other.hazardCooldown <= 0) {
          if (other.shieldTimer > 0) {
            other.shieldTimer = 0;
            other.hazardCooldown = 0.55;
            continue;
          }
          const oProj = projectPointToTrack(
            other.x,
            other.z,
            other.furthestCheckpointDist
          );
          const sideSign = oProj.lateralOffset >= 0 ? 1 : -1;
          applyBallisticKnockback(
            other,
            oProj.rightX * sideSign * 0.7 + (dx / Math.max(0.1, dist)) * 0.3,
            oProj.rightZ * sideSign * 0.7 + (dz / Math.max(0.1, dist)) * 0.3,
            13.2,
            6.2,
            0.42
          );
          other.hazardCooldown = 0.55;
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

    // Glossy Glacier Ice surface speed glide ("ทางน้ำแข็งลื่นสปีดพุ่ง")
    if (currentProj.surfaceType === 'ice' && r.y - r.groundY < 0.35) {
      topSpeed *= 1.1;
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

    // Apply velocity & momentum (preserve horizontal momentum while airborne or knocked back)
    const isAirborne = r.y > r.groundY + 0.12;
    const targetVx = r.stunTimer > 0 ? 0 : moveDirX * topSpeed;
    const targetVz = r.stunTimer > 0 ? 0 : moveDirZ * topSpeed;
    const groundAccel = currentProj.surfaceType === 'ice' ? 7.8 : 12.5;
    const accel = r.stunTimer > 0 ? 3.2 : isAirborne ? 5.8 : groundAccel;
    r.vx += (targetVx - r.vx) * Math.min(1, accel * clampedDt);
    r.vz += (targetVz - r.vz) * Math.min(1, accel * clampedDt);

    // Spinning Turntable Platform & Sweeping Beam physics (with instant depenetration + cooldown)
    for (const tt of TURNTABLES) {
      const dx = r.x - tt.x;
      const dz = r.z - tt.z;
      const dist = Math.hypot(dx, dz);
      if (dist < tt.radius) {
        if (r.y - r.groundY < 0.25) {
          const tangX = -dz * tt.angularSpeed * 0.38;
          const tangZ = dx * tt.angularSpeed * 0.38;
          r.x += tangX * clampedDt;
          r.z += tangZ * clampedDt;
        }

        if (r.y - r.groundY < 0.68 && r.hazardCooldown <= 0) {
          const barAngle = state.elapsedRaceSec * tt.angularSpeed;
          const barDirX = Math.cos(barAngle);
          const barDirZ = Math.sin(barAngle);
          const projAlong = dx * barDirX + dz * barDirZ;
          if (Math.abs(projAlong) < tt.barHalfLength) {
            const signedPerp = -dx * barDirZ + dz * barDirX;
            const perpDist = Math.abs(signedPerp);
            const hitRadius = 0.72;
            if (perpDist < hitRadius) {
              // Instant depenetration outside the sweeping bar so it never multi-hits
              const pushSign =
                Math.abs(signedPerp) > 0.02
                  ? Math.sign(signedPerp)
                  : Math.sign(tt.angularSpeed) || 1;
              const normalX = -barDirZ * pushSign;
              const normalZ = barDirX * pushSign;
              const overlap = hitRadius - perpDist + 0.12;
              r.x += normalX * overlap;
              r.z += normalZ * overlap;
              r.hazardCooldown = 0.55;

              if (r.shieldTimer > 0) {
                r.shieldTimer = 0;
                applyBallisticKnockback(r, normalX, normalZ, 6.0, 3.8, 0.12);
              } else {
                const sweepNormalX = -barDirZ * Math.sign(tt.angularSpeed);
                const sweepNormalZ = barDirX * Math.sign(tt.angularSpeed);
                applyBallisticKnockback(
                  r,
                  sweepNormalX * 0.75 + normalX * 0.25,
                  sweepNormalZ * 0.75 + normalZ * 0.25,
                  12.8,
                  6.4,
                  0.38
                );
              }
            }
          }
        }
      }
    }

    // Rolling Boulders & Giant Beach Balls collision (with radial depenetration + cooldown)
    for (const b of ROLLING_BOULDERS) {
      const offset =
        Math.sin(state.elapsedRaceSec * b.speed + b.phase) * b.sweepHalfWidth;
      const bx = b.centerX + b.rightX * offset;
      const bz = b.centerZ + b.rightZ * offset;
      const dx = r.x - bx;
      const dz = r.z - bz;
      const dist = Math.hypot(dx, dz);
      const minRadius = b.radius + 0.72;
      if (dist < minRadius && r.y - r.groundY < b.radius * 1.45) {
        const nx = dist > 0.01 ? dx / dist : b.rightX;
        const nz = dist > 0.01 ? dz / dist : b.rightZ;
        // Push racer cleanly outside the boulder surface immediately
        const overlap = minRadius - dist + 0.08;
        r.x += nx * overlap;
        r.z += nz * overlap;

        if (r.hazardCooldown <= 0) {
          r.hazardCooldown = 0.58;
          if (r.shieldTimer > 0) {
            r.shieldTimer = 0;
            applyBallisticKnockback(r, nx, nz, 6.5, 4.0, 0.15);
          } else {
            // Combine radial normal + boulder travel direction for natural elastic rebound
            const boulderVelSign = Math.cos(
              state.elapsedRaceSec * b.speed + b.phase
            );
            const launchX = nx * 0.75 + b.rightX * boulderVelSign * 0.25;
            const launchZ = nz * 0.75 + b.rightZ * boulderVelSign * 0.25;
            applyBallisticKnockback(r, launchX, launchZ, 13.8, 7.2, 0.45);
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
    }

    // Integrate horizontal position
    r.x += (r.vx + r.knockVx) * clampedDt;
    r.z += (r.vz + r.knockVz) * clampedDt;

    // Air vs. Ground Knockback Drag:
    // Low drag in the air preserves a natural parabolic arc; ground friction slows the slide on landing
    const knockDragRate =
      r.y > r.groundY + 0.05 || Math.abs(r.vy) > 0.5
        ? 1.55
        : 6.8 * stunRecoveryRate;
    const knockDecay = Math.exp(-knockDragRate * clampedDt);
    r.knockVx *= knockDecay;
    r.knockVz *= knockDecay;
    if (Math.hypot(r.knockVx, r.knockVz) < 0.08) {
      r.knockVx = 0;
      r.knockVz = 0;
    }

    // Project new position onto smooth spline track
    const proj = projectPointToTrack(r.x, r.z, r.furthestCheckpointDist);
    const nextGroundY = proj.closestY;

    // Integrate vertical jump / gravity relative to undulating 3D track elevation
    const isActivelyJumping =
      r.vy > 0 ||
      (r.vy < 0 && r.y > nextGroundY + 0.02) ||
      r.y > nextGroundY + 0.24;
    r.groundY = nextGroundY;
    if (isActivelyJumping) {
      r.y += r.vy * clampedDt;
      r.vy -= 26.5 * clampedDt; // smooth ballistic gravity
      if (r.y <= r.groundY) {
        r.y = r.groundY;
        // Natural elastic ground bounce when landing from a knockback/stun arc!
        if (
          (r.stunTimer > 0 || Math.hypot(r.knockVx, r.knockVz) > 3.5) &&
          r.vy < -3.6
        ) {
          r.vy = Math.min(4.2, -r.vy * 0.36);
        } else {
          r.vy = 0;
          if (r.passiveSkillId === 'feather_hop') {
            r.landingBoostTimer = 0.65;
          }
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

    // Smooth Elastic Guard Curbs (Wooden Fences / Ice Walls) without segment-seam snapping
    if (
      !proj.isBridgeOverWater &&
      !proj.isHighBridge &&
      !proj.isDeepWaterHazard &&
      Math.abs(proj.lateralOffset) > halfWidth
    ) {
      const sideSign = Math.sign(proj.lateralOffset) || 1;
      const penetration = Math.abs(proj.lateralOffset) - halfWidth;
      // Push inward along track lateral normal only (prevents forward/backward jerks on corners)
      const inNormalX = -proj.rightX * sideSign;
      const inNormalZ = -proj.rightZ * sideSign;
      r.x += inNormalX * penetration;
      r.z += inNormalZ * penetration;

      // Reflect outward normal velocity component with soft elastic restitution (0.35)
      const totalVx = r.vx + r.knockVx;
      const totalVz = r.vz + r.knockVz;
      const outwardVn =
        totalVx * (proj.rightX * sideSign) + totalVz * (proj.rightZ * sideSign);
      if (outwardVn > 0) {
        const bounceImpulse = outwardVn * 1.35;
        r.knockVx += inNormalX * bounceImpulse * 0.55;
        r.knockVz += inNormalZ * bounceImpulse * 0.55;
        r.vx += inNormalX * outwardVn * 0.8;
        r.vz += inNormalZ * outwardVn * 0.8;
      }
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

  // Symmetric Pairwise Rigid-Body Elastic Racer-vs-Racer Collision Solver
  const minSep = 1.18;
  for (let i = 0; i < state.racers.length; i++) {
    const rA = state.racers[i];
    if (rA.finished || rA.respawnBlinkTimer > 0) continue;
    const projA = projectPointToTrack(rA.x, rA.z, rA.furthestCheckpointDist);
    if (projA.isDeepWaterHazard) continue;

    for (let j = i + 1; j < state.racers.length; j++) {
      const rB = state.racers[j];
      if (rB.finished || rB.respawnBlinkTimer > 0) continue;
      if (Math.abs(rA.y - rB.y) > 1.35) continue;

      const dx = rB.x - rA.x;
      const dz = rB.z - rA.z;
      const dist = Math.hypot(dx, dz);
      if (dist < minSep) {
        const nx = dist > 0.001 ? dx / dist : 1;
        const nz = dist > 0.001 ? dz / dist : 0;
        const overlap = minSep - dist;

        const massA =
          (rA.passiveSkillId === 'bouncy_belly' ? 1.45 : 1.0) *
          (rA.dashTimer > 0 ? 1.5 : 1.0);
        const massB =
          (rB.passiveSkillId === 'bouncy_belly' ? 1.45 : 1.0) *
          (rB.dashTimer > 0 ? 1.5 : 1.0);
        const invA = 1 / massA;
        const invB = 1 / massB;
        const invSum = invA + invB;

        // 1. Positional depenetration so characters never clip inside each other
        rA.x -= nx * overlap * (invA / invSum);
        rA.z -= nz * overlap * (invA / invSum);
        rB.x += nx * overlap * (invB / invSum);
        rB.z += nz * overlap * (invB / invSum);

        // 2. Elastic velocity impulse exchange along collision normal
        const vAx = rA.vx + rA.knockVx;
        const vAz = rA.vz + rA.knockVz;
        const vBx = rB.vx + rB.knockVx;
        const vBz = rB.vz + rB.knockVz;
        const relVn = (vBx - vAx) * nx + (vBz - vAz) * nz;
        if (relVn < 0) {
          const restitution = 0.52;
          const jImp = (-(1 + restitution) * relVn) / invSum;
          const impX = nx * jImp;
          const impZ = nz * jImp;

          rA.knockVx -= impX * invA * 0.65;
          rA.knockVz -= impZ * invA * 0.65;
          rB.knockVx += impX * invB * 0.65;
          rB.knockVz += impZ * invB * 0.65;

          rA.pokeImpulse = Math.max(rA.pokeImpulse, 0.45);
          rB.pokeImpulse = Math.max(rB.pokeImpulse, 0.45);
        }

        // 3. Dash Shoulder-Bump: Dashing racer knocks non-dashing rival sideways!
        if (rA.dashTimer > 0 && rB.dashTimer <= 0 && rB.hazardCooldown <= 0) {
          rB.hazardCooldown = 0.45;
          applyBallisticKnockback(rB, nx, nz, 10.2, 4.6, 0.25);
        } else if (
          rB.dashTimer > 0 &&
          rA.dashTimer <= 0 &&
          rA.hazardCooldown <= 0
        ) {
          rA.hazardCooldown = 0.45;
          applyBallisticKnockback(rA, -nx, -nz, 10.2, 4.6, 0.25);
        }
      }
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
