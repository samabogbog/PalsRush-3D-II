import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ActiveSkillId,
  CharacterId,
  computeCharacterKinematics,
  PassiveSkillId,
} from '../models/characterTypes';
import {
  applyKinematicsToRig,
  buildProceduralCharacter,
  CharacterRig,
  createContactShadowTexture,
} from '../models/proceduralBlocks';
import { EquippedLoadout } from '../models/equipmentTypes';
import {
  animateEquipmentOnRig,
  attachEquipmentToCharacterRig,
} from '../models/equipmentMeshes';
import {
  activateRacerItemE,
  activateRacerSkillQ,
  activateRacerSlapF,
  BOOST_PADS,
  createInitialRaceState,
  finishAllRemainingRacers,
  PlayerControlInput,
  RaceSimulationState,
  RIVER_STEPPING_STONES,
  ROLLING_BOULDERS,
  sampleTrackAtDistance,
  setActiveTrack,
  SLIME_PADS,
  stepRaceSimulation,
  TOTAL_TRACK_LENGTH,
  TRACK_SEGMENTS,
  TrackId,
  TURNTABLES,
} from '../game/raceEngine';

export type ReplayCameraTarget = 'leader' | CharacterId;

export type ReplayControlAction =
  | { type: 'start_replay'; target?: ReplayCameraTarget }
  | { type: 'stop_replay' }
  | { type: 'toggle_play' }
  | { type: 'restart' }
  | { type: 'seek'; timeSec: number }
  | { type: 'set_speed'; speed: number }
  | { type: 'set_target'; target: ReplayCameraTarget }
  | { type: 'finish_all_racers' };

export interface ReplayRacerPose {
  id: CharacterId;
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
  pose: RaceSimulationState['racers'][0]['pose'];
  rank: number;
  totalProgress: number;
  furthestCheckpointDist: number;
  finished: boolean;
  finishTimeSec: number | null;
  shieldTimer: number;
  whirlwindTimer: number;
  freezeTimer?: number;
  dashTimer: number;
  stunTimer: number;
  slapAnimTimer: number;
  respawnBlinkTimer: number;
  pokeImpulse: number;
}

export interface ReplayKeyframe {
  timeSec: number;
  leaderId: CharacterId;
  racers: ReplayRacerPose[];
  droppedTraps: { x: number; y: number; z: number; radius: number }[];
  pieProjectiles: {
    x: number;
    y: number;
    z: number;
    kind?: 'pie' | 'ice_bomb';
  }[];
  shockwaves: {
    x: number;
    y: number;
    z: number;
    maxRadius: number;
    age: number;
    maxAge: number;
    colorHex: string;
  }[];
}

export interface RaceHudReplayInfo {
  isActive: boolean;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  speed: number;
  target: ReplayCameraTarget;
  activeFocusRacerId: CharacterId;
  activeLeaderId: CharacterId;
  hasReplayData: boolean;
}

export interface RaceHudSnapshot {
  phase: RaceSimulationState['phase'];
  allFinished: boolean;
  countdownSec: number;
  elapsedRaceSec: number;
  playerRank: number;
  progressPercent: number;
  zoneName: string;
  elevationMeters: number;
  qCooldown: number;
  fCooldown: number;
  heldItem: RaceSimulationState['racers'][0]['heldItem'];
  dashActive: boolean;
  shieldActive: boolean;
  whirlwindActive: boolean;
  slowActive: boolean;
  slapsLanded: number;
  standings: {
    id: CharacterId;
    name: string;
    shortName: string;
    primaryHex: string;
    isPlayer: boolean;
    rank: number;
    finished: boolean;
    finishTimeSec: number | null;
    progressPercent: number;
    x: number;
    z: number;
    yaw: number;
  }[];
  events: RaceSimulationState['events'];
  bannerCallout: RaceSimulationState['bannerCallout'];
  replay: RaceHudReplayInfo;
}

export interface RaceGameCanvasProps {
  trackId: TrackId;
  playerCharacterId: CharacterId;
  playerActiveSkillId: ActiveSkillId;
  playerPassiveSkillId: PassiveSkillId;
  playerLoadout?: EquippedLoadout;
  raceSessionKey: number;
  isLobbyOpen: boolean;
  externalActionTrigger: {
    type: 'q' | 'e' | 'f' | 'jump' | null;
    seq: number;
  };
  externalReplayTrigger?: {
    action: ReplayControlAction | null;
    seq: number;
  };
  joystickInputRef?: React.MutableRefObject<{ x: number; y: number }>;
  spectatedRacerId?: CharacterId | null;
  onHudUpdate: (snapshot: RaceHudSnapshot) => void;
  onPlayerFinishRace?: (rank: number) => void;
}

function createCheckeredBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const size = 16;
  for (let y = 0; y < canvas.height; y += size) {
    for (let x = 0; x < canvas.width; x += size) {
      const even = (x / size + y / size) % 2 === 0;
      ctx.fillStyle = even ? '#2B2118' : '#FFFDF9';
      ctx.fillRect(x, y, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural stone/cobble/brick/earth relief pattern texture applied to the track ribbon
 * so dirt trails, cobblestone climbs, and brick slopes have tactile surface detail.
 */
function createForestRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#E6DEC8';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle stone/brick block mortar lines & organic earth speckles
  ctx.strokeStyle = 'rgba(72, 52, 36, 0.22)';
  ctx.lineWidth = 3;
  const rows = 8;
  const rowH = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    const cols = 4;
    const colW = 256 / cols;
    const offset = (r % 2) * (colW * 0.5);
    for (let c = 0; c <= cols; c++) {
      const x = (c * colW + offset) % 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Earthy pebbles & moss flecks
  for (let i = 0; i < 160; i++) {
    const sx = (Math.sin(i * 78.233) * 0.5 + 0.5) * 250;
    const sy = (Math.cos(i * 45.164) * 0.5 + 0.5) * 250;
    const rad = 2 + (i % 5);
    ctx.fillStyle =
      i % 5 === 0
        ? 'rgba(92, 128, 68, 0.22)'
        : i % 2 === 0
          ? 'rgba(110, 82, 56, 0.18)'
          : 'rgba(255, 252, 242, 0.22)';
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSnowIceRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F0F9FF';
  ctx.fillRect(0, 0, 256, 256);

  // Crystalline frost joints & ice block facets
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 3;
  const rows = 8;
  const rowH = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    const cols = 4;
    const colW = 256 / cols;
    const offset = (r % 2) * (colW * 0.5);
    for (let c = 0; c <= cols; c++) {
      const x = (c * colW + offset) % 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Sparkling snow & ice crystal flecks
  for (let i = 0; i < 160; i++) {
    const sx = (Math.sin(i * 78.233) * 0.5 + 0.5) * 250;
    const sy = (Math.cos(i * 45.164) * 0.5 + 0.5) * 250;
    const rad = 2 + (i % 4);
    ctx.fillStyle =
      i % 4 === 0
        ? 'rgba(56, 189, 248, 0.28)'
        : i % 2 === 0
          ? 'rgba(186, 230, 253, 0.35)'
          : 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the Track Ribbon for either Woodland Forest ('woodland')
 * or Glacier Peak Snow & Ice ('snow_glacier').
 */
function buildContinuousTrackRibbon(trackId: TrackId): THREE.Group {
  const ribbonGroup = new THREE.Group();
  const n = TRACK_SEGMENTS.length;
  const isSnow = trackId === 'snow_glacier';

  // 1. Main Road Bed Ribbon
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const colorDirt = new THREE.Color(isSnow ? '#F1F5F9' : '#B88B5E'); // Packed Snow vs Woodland Dirt
  const colorCobble = new THREE.Color(isSnow ? '#CBD5E1' : '#9E9A90'); // Frosted Granite vs Forest Cobble
  const colorBrick = new THREE.Color(isSnow ? '#BAE6FD' : '#B57C5E'); // Carved Ice Brick vs Stone Brick
  const colorIce = new THREE.Color('#7DD3FC'); // Glossy Glacier Skating Ice
  const colorPlankSub = new THREE.Color(isSnow ? '#0284C7' : '#6E472B'); // Ice beam vs Timber beam
  const colorShallowBed = new THREE.Color(isSnow ? '#67E8F9' : '#7AB8C8'); // Slush bed vs Creek bed
  const colorDeepBed = new THREE.Color(isSnow ? '#082F49' : '#075985'); // Sub-zero Fjord vs Deep River

  const thickness = 0.48;

  for (let i = 0; i <= n; i++) {
    const seg = TRACK_SEGMENTS[i % n];
    const halfW =
      seg.isPlankBridge || seg.isHighBridge
        ? seg.width * 0.36
        : seg.width * 0.5;
    const lx = seg.x0 - seg.rightX * halfW;
    const lz = seg.z0 - seg.rightZ * halfW;
    const rx = seg.x0 + seg.rightX * halfW;
    const rz = seg.z0 + seg.rightZ * halfW;

    let yOffset = 0;
    if (seg.isDeepWaterHazard) yOffset = -0.95;
    else if (seg.isShallowWater) yOffset = -0.14;
    else if (seg.isPlankBridge || seg.isHighBridge) yOffset = -0.14;

    const yTop = seg.y0 + yOffset;
    const yBot = yTop - thickness;

    positions.push(
      lx,
      yTop,
      lz,
      rx,
      yTop,
      rz,
      lx,
      yBot,
      lz,
      rx,
      yBot,
      rz
    );

    const vCoord = seg.startDist * 0.18;
    uvs.push(0, vCoord, 1, vCoord, 0, vCoord, 1, vCoord);

    let c = colorDirt;
    if (seg.isDeepWaterHazard) c = colorDeepBed;
    else if (seg.isShallowWater) c = colorShallowBed;
    else if (seg.isPlankBridge || seg.isHighBridge) c = colorPlankSub;
    else if (seg.surfaceType === 'ice') c = colorIce;
    else if (seg.surfaceType === 'cobble') c = colorCobble;
    else if (seg.surfaceType === 'brick') c = colorBrick;

    for (let v = 0; v < 4; v++) {
      colors.push(c.r, c.g, c.b);
    }

    if (i < n) {
      const base = i * 4;
      const next = (i + 1) * 4;
      indices.push(base + 0, base + 1, next + 1);
      indices.push(base + 0, next + 1, next + 0);
      indices.push(base + 2, base + 0, next + 0);
      indices.push(base + 2, next + 0, next + 2);
      indices.push(base + 1, base + 3, next + 3);
      indices.push(base + 1, next + 3, next + 1);
      indices.push(base + 3, base + 2, next + 2);
      indices.push(base + 3, next + 2, next + 3);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadTex = isSnow ? createSnowIceRoadTexture() : createForestRoadTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    vertexColors: true,
    roughness: isSnow ? 0.42 : 0.88,
    metalness: isSnow ? 0.12 : 0.03,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  roadMesh.castShadow = true;
  ribbonGroup.add(roadMesh);

  // 2. Materials & Shared Geometries for Planks, Cobbles/Bricks, Fences, Hedges & Shallow Water
  const plankMats = isSnow
    ? [
        new THREE.MeshStandardMaterial({
          color: '#38BDF8',
          emissive: '#0284C7',
          emissiveIntensity: 0.18,
          roughness: 0.2,
          metalness: 0.15,
        }),
        new THREE.MeshStandardMaterial({
          color: '#7DD3FC',
          emissive: '#0369A1',
          emissiveIntensity: 0.15,
          roughness: 0.22,
          metalness: 0.12,
        }),
        new THREE.MeshStandardMaterial({
          color: '#818CF8',
          emissive: '#4F46E5',
          emissiveIntensity: 0.18,
          roughness: 0.24,
          metalness: 0.15,
        }),
      ]
    : [
        new THREE.MeshStandardMaterial({ color: '#B87B4B', roughness: 0.82 }),
        new THREE.MeshStandardMaterial({ color: '#A36638', roughness: 0.85 }),
        new THREE.MeshStandardMaterial({ color: '#C88B57', roughness: 0.8 }),
      ];
  const fenceWoodMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#BAE6FD' : '#8C5834',
    roughness: isSnow ? 0.35 : 0.86,
  });
  const fencePostMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#EF4444' : '#6E4224', // Festive red/ice posts on Snow track!
    roughness: isSnow ? 0.45 : 0.88,
  });
  const hedgeDarkMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#E2E8F0' : '#4B773E', // Crisp snowbank vs dark bush
    roughness: isSnow ? 0.75 : 0.82,
  });
  const hedgeLightMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#FFFFFF' : '#679850', // Pure white snowdrift vs light bush
    roughness: isSnow ? 0.7 : 0.8,
  });
  const flowerYellowMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#22D3EE' : '#FDE047', // Glowing ice crystal spike vs yellow flower
    emissive: isSnow ? '#0891B2' : '#000000',
    emissiveIntensity: isSnow ? 0.4 : 0,
    roughness: isSnow ? 0.2 : 0.65,
  });
  const cobbleTileMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#94A3B8' : '#8D8980',
    roughness: isSnow ? 0.55 : 0.88,
  });
  const brickTileMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#7DD3FC' : '#9E6247',
    roughness: isSnow ? 0.28 : 0.84,
  });
  const dirtPebbleMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#F8FAFC' : '#9C7248',
    roughness: isSnow ? 0.65 : 0.9,
  });
  const shallowWaterMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#22D3EE' : '#38BDF8',
    transparent: true,
    opacity: 0.74,
    roughness: 0.1,
    metalness: 0.12,
  });
  const waterFoamMat = new THREE.MeshStandardMaterial({
    color: '#F0F9FF',
    transparent: true,
    opacity: 0.86,
    roughness: 0.25,
  });
  const slopeChevronMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#38BDF8' : '#F59E0B',
    emissive: isSnow ? '#0284C7' : '#D97706',
    emissiveIntensity: 0.35,
    roughness: 0.35,
  });

  const sharedFencePostGeo = new RoundedBoxGeometry(0.32, 1.15, 0.32, 2, 0.06);
  const sharedFenceRailGeo = new RoundedBoxGeometry(0.14, 0.16, 6.8, 1, 0.03);
  const sharedHedgeBlockGeo = new RoundedBoxGeometry(1.25, 0.95, 4.2, 2, 0.32);
  const sharedHedgePuffGeo = new RoundedBoxGeometry(0.95, 0.75, 0.95, 2, 0.28);
  const sharedFlowerGeo = isSnow
    ? new THREE.OctahedronGeometry(0.28, 0)
    : new THREE.BoxGeometry(0.26, 0.22, 0.26);
  const sharedPaverGeo = new RoundedBoxGeometry(1.35, 0.09, 0.95, 2, 0.03);
  const sharedTowerGeo = new RoundedBoxGeometry(0.65, 5.2, 0.65, 2, 0.14);
  const sharedBarGeo = new RoundedBoxGeometry(1.5, 0.06, 0.32, 1, 0.03);
  const sharedFoamRingGeo = new THREE.RingGeometry(0.7, 0.95, 16);

  for (let i = 0; i < n; i++) {
    const seg = TRACK_SEGMENTS[i];
    const midX = (seg.x0 + seg.x1) * 0.5;
    const midY = (seg.y0 + seg.y1) * 0.5;
    const midZ = (seg.z0 + seg.z1) * 0.5;
    const segYaw = Math.atan2(-seg.dirX, -seg.dirZ);
    const pitchX = Math.atan2(seg.dy, seg.length);

    // A. PLANK BRIDGES (Wooden Planks in Woodland, Crystal Ice Planks in Snow & Ice)
    if (seg.isPlankBridge || seg.isHighBridge) {
      const plankCount = Math.max(3, Math.floor(seg.length / 1.25));
      const plankDepth = (seg.length / plankCount) * 0.82;
      const plankGeo = new RoundedBoxGeometry(
        seg.width + 0.35,
        0.24,
        plankDepth,
        2,
        0.05
      );
      for (let p = 0; p < plankCount; p++) {
        const t = (p + 0.5) / plankCount;
        const px = seg.x0 + seg.dx * t;
        const py = seg.y0 + seg.dy * t;
        const pz = seg.z0 + seg.dz * t;
        const plank = new THREE.Mesh(
          plankGeo,
          plankMats[(i + p) % plankMats.length]
        );
        plank.position.set(px, py - 0.02, pz);
        plank.rotation.order = 'YXZ';
        plank.rotation.y = segYaw;
        plank.rotation.x = pitchX;
        plank.receiveShadow = true;
        plank.castShadow = true;
        ribbonGroup.add(plank);
      }
    } else if (!seg.isDeepWaterHazard && !seg.isShallowWater) {
      // B. 3D EMBOSSED PAVERS / ICE BLOCKS / SNOW PATCHES ON ROAD SURFACE
      const tileMat =
        seg.surfaceType === 'brick' || seg.surfaceType === 'ice'
          ? brickTileMat
          : seg.surfaceType === 'cobble'
            ? cobbleTileMat
            : dirtPebbleMat;
      const numPavers =
        seg.surfaceType === 'dirt' || seg.surfaceType === 'packed_snow' ? 1 : 2;
      for (let p = 0; p < numPavers; p++) {
        const seed = Math.sin((i * 7 + p * 13) * 19.13) * 43758.5453;
        const frac = seed - Math.floor(seed);
        const lat = (frac - 0.5) * (seg.width - 2.4);
        const t = (p + 0.35) / numPavers;
        const tx = seg.x0 + seg.dx * t + seg.rightX * lat;
        const ty = seg.y0 + seg.dy * t;
        const tz = seg.z0 + seg.dz * t + seg.rightZ * lat;
        const paver = new THREE.Mesh(sharedPaverGeo, tileMat);
        paver.position.set(tx, ty + 0.01, tz);
        paver.rotation.order = 'YXZ';
        paver.rotation.y =
          segYaw +
          (seg.surfaceType === 'dirt' || seg.surfaceType === 'packed_snow'
            ? frac * 0.5
            : 0);
        paver.rotation.x = pitchX;
        paver.receiveShadow = true;
        ribbonGroup.add(paver);
      }
    }

    // C. UNAVOIDABLE SHALLOW WATER / FROZEN SLUSH FORD
    if (seg.isShallowWater) {
      const waterPlate = new THREE.Mesh(
        new THREE.BoxGeometry(seg.width + 2.6, 0.22, seg.length + 0.6),
        shallowWaterMat
      );
      waterPlate.position.set(midX, midY - 0.01, midZ);
      waterPlate.rotation.order = 'YXZ';
      waterPlate.rotation.y = segYaw;
      waterPlate.rotation.x = pitchX;
      waterPlate.receiveShadow = true;
      ribbonGroup.add(waterPlate);

      if (i % 2 === 0) {
        const ripple = new THREE.Mesh(sharedFoamRingGeo, waterFoamMat);
        const rLat = Math.sin(i * 2.3) * (seg.width * 0.28);
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.set(
          midX + seg.rightX * rLat,
          midY + 0.11,
          midZ + seg.rightZ * rLat
        );
        ribbonGroup.add(ripple);
      }
    }

    // D. TRACK BORDERS: FENCES OR SNOWDRIFT / BUSH HEDGES
    if (!seg.isDeepWaterHazard) {
      if (seg.borderType === 'wood_fence' || seg.isPlankBridge || seg.isHighBridge) {
        for (const side of [-1, 1]) {
          const lat = (seg.width * 0.5 + 0.22) * side;
          const post = new THREE.Mesh(sharedFencePostGeo, fencePostMat);
          post.position.set(
            seg.x0 + seg.rightX * lat,
            seg.y0 + 0.48,
            seg.z0 + seg.rightZ * lat
          );
          post.castShadow = true;
          ribbonGroup.add(post);

          for (const railH of [0.36, 0.78]) {
            const rail = new THREE.Mesh(sharedFenceRailGeo, fenceWoodMat);
            rail.scale.z = seg.length / 6.4;
            rail.position.set(
              midX + seg.rightX * lat,
              midY + railH,
              midZ + seg.rightZ * lat
            );
            rail.rotation.order = 'YXZ';
            rail.rotation.y = segYaw;
            rail.rotation.x = pitchX;
            rail.castShadow = true;
            ribbonGroup.add(rail);
          }
        }
      } else if (seg.borderType === 'bush_hedge') {
        for (const side of [-1, 1]) {
          const lat = (seg.width * 0.5 + 0.65) * side;
          const hedge = new THREE.Mesh(
            sharedHedgeBlockGeo,
            (i + side) % 2 === 0 ? hedgeDarkMat : hedgeLightMat
          );
          hedge.scale.z = (seg.length + 0.6) / 4.0;
          hedge.position.set(
            midX + seg.rightX * lat,
            midY + 0.38,
            midZ + seg.rightZ * lat
          );
          hedge.rotation.order = 'YXZ';
          hedge.rotation.y = segYaw;
          hedge.rotation.x = pitchX;
          hedge.castShadow = true;
          hedge.receiveShadow = true;
          ribbonGroup.add(hedge);

          const puff = new THREE.Mesh(sharedHedgePuffGeo, hedgeLightMat);
          puff.position.set(
            seg.x0 + seg.rightX * (lat + 0.15 * side),
            seg.y0 + 0.72,
            seg.z0 + seg.rightZ * (lat + 0.15 * side)
          );
          ribbonGroup.add(puff);

          if (i % 3 === 0) {
            const flw = new THREE.Mesh(sharedFlowerGeo, flowerYellowMat);
            flw.position.set(
              midX + seg.rightX * (lat - 0.35 * side),
              midY + 0.88,
              midZ + seg.rightZ * (lat - 0.35 * side)
            );
            ribbonGroup.add(flw);
          }
        }
      }
    }

    // E. Elevated Pillars underneath high bridges
    if (midY > 1.8 && i % 5 === 0) {
      const pillarH = midY + 1.2;
      const pGeo = new THREE.BoxGeometry(1.1, pillarH, 1.1);
      for (const side of [-1, 1]) {
        const lat = (seg.width * 0.5 - 0.7) * side;
        const pillar = new THREE.Mesh(pGeo, fenceWoodMat);
        pillar.position.set(
          midX + seg.rightX * lat,
          midY - pillarH * 0.5 - 0.2,
          midZ + seg.rightZ * lat
        );
        ribbonGroup.add(pillar);
      }
      const crossBeam = new THREE.Mesh(
        new THREE.BoxGeometry(seg.width + 0.4, 0.65, 1.3),
        fenceWoodMat
      );
      crossBeam.position.set(midX, midY - 0.55, midZ);
      crossBeam.rotation.y = segYaw;
      ribbonGroup.add(crossBeam);

      if (seg.isHighBridge && i % 15 === 0) {
        for (const side of [-1, 1]) {
          const lat = (seg.width * 0.5 + 0.35) * side;
          const tower = new THREE.Mesh(sharedTowerGeo, fencePostMat);
          tower.position.set(
            midX + seg.rightX * lat,
            midY + 2.4,
            midZ + seg.rightZ * lat
          );
          ribbonGroup.add(tower);
        }
        const topBeam = new THREE.Mesh(
          new THREE.BoxGeometry(seg.width + 1.6, 0.65, 0.75),
          fenceWoodMat
        );
        topBeam.position.set(midX, midY + 4.9, midZ);
        topBeam.rotation.y = segYaw;
        ribbonGroup.add(topBeam);
      }
    }

    // F. Downhill Slope Visual Chevron Markers
    if (seg.isDownhillSlope && i % 3 === 0) {
      const chevGroup = new THREE.Group();
      chevGroup.position.set(midX, midY + 0.05, midZ);
      chevGroup.rotation.order = 'YXZ';
      chevGroup.rotation.y = segYaw;
      chevGroup.rotation.x = pitchX;

      const leftBar = new THREE.Mesh(sharedBarGeo, slopeChevronMat);
      leftBar.position.set(-0.55, 0, 0);
      leftBar.rotation.y = 0.45;
      const rightBar = new THREE.Mesh(sharedBarGeo, slopeChevronMat);
      rightBar.position.set(0.55, 0, 0);
      rightBar.rotation.y = -0.45;
      chevGroup.add(leftBar, rightBar);
      ribbonGroup.add(chevGroup);
    }
  }

  return ribbonGroup;
}

/**
 * Procedurally builds DENSE scenery around the entire circuit for either:
 * - 'woodland': Woodland Forest (Oak/Pine/Birch trees, bushes, grass tufts, mossy rocks, mushrooms)
 * - 'snow_glacier': Glacier Peak Snow & Ice (Towering Alpine Mountains, Grand Ice Palace Fortress,
 *   Nordic Ski Chalets, Arctic Igloos, Rotating Ice Windmills, Snow-Laden Pine Trees,
 *   Glowing Aurora Ice Crystal Clusters, Cute Chibi Snowmen, Overhead Ice Rib Arches & Aurora Borealis!)
 */
function buildEnvironmentalScenery(trackId: TrackId): {
  sceneryGroup: THREE.Group;
  windmillBlades: THREE.Object3D[];
  floatingProps: { obj: THREE.Object3D; baseY: number; phase: number }[];
} {
  const sceneryGroup = new THREE.Group();
  const windmillBlades: THREE.Object3D[] = [];
  const floatingProps: { obj: THREE.Object3D; baseY: number; phase: number }[] =
    [];

  if (trackId === 'snow_glacier') {
    // ========================================================================
    // SPECTACULAR SNOW & ICE ("GLACIER PEAK") 3D ENVIRONMENT & LANDMARKS
    // ========================================================================
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#4A3525',
      roughness: 0.88,
    });
    const pineDarkMat = new THREE.MeshStandardMaterial({
      color: '#1E3F32',
      roughness: 0.82,
    });
    const snowPureMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.65,
    });
    const snowFrostMat = new THREE.MeshStandardMaterial({
      color: '#E0F2FE',
      roughness: 0.55,
    });
    const iceCyanMat = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      emissive: '#0284C7',
      emissiveIntensity: 0.32,
      roughness: 0.16,
      metalness: 0.2,
    });
    const iceVioletMat = new THREE.MeshStandardMaterial({
      color: '#A855F7',
      emissive: '#7E22CE',
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.2,
    });
    const icePaleMat = new THREE.MeshStandardMaterial({
      color: '#BAE6FD',
      emissive: '#0369A1',
      emissiveIntensity: 0.18,
      roughness: 0.22,
      metalness: 0.15,
    });
    const mountainRockMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.88,
    });
    const mountainSlateMat = new THREE.MeshStandardMaterial({
      color: '#64748B',
      roughness: 0.85,
    });
    const chaletWoodMat = new THREE.MeshStandardMaterial({
      color: '#7C4A27',
      roughness: 0.82,
    });
    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: '#FDE047',
      emissive: '#F59E0B',
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const scarfRedMat = new THREE.MeshStandardMaterial({
      color: '#EF4444',
      roughness: 0.6,
    });
    const carrotMat = new THREE.MeshStandardMaterial({
      color: '#F97316',
      roughness: 0.5,
    });
    const coalMat = new THREE.MeshStandardMaterial({
      color: '#1E293B',
      roughness: 0.7,
    });

    // Shared Geometries for Snow & Ice Props
    const trunkGeo = new RoundedBoxGeometry(0.68, 2.2, 0.68, 2, 0.14);
    const pineTier1Geo = new RoundedBoxGeometry(2.8, 1.35, 2.8, 2, 0.32);
    const pineSnow1Geo = new RoundedBoxGeometry(2.92, 0.52, 2.92, 2, 0.22);
    const pineTier2Geo = new RoundedBoxGeometry(2.1, 1.25, 2.1, 2, 0.28);
    const pineSnow2Geo = new RoundedBoxGeometry(2.22, 0.48, 2.22, 2, 0.2);
    const pineTier3Geo = new RoundedBoxGeometry(1.38, 1.15, 1.38, 2, 0.24);
    const pineSnow3Geo = new RoundedBoxGeometry(1.48, 0.55, 1.48, 2, 0.2);

    const crystalMainGeo = new THREE.ConeGeometry(0.68, 2.9, 6);
    const crystalSideGeo = new THREE.ConeGeometry(0.46, 1.95, 6);
    const crystalMiniGeo = new THREE.OctahedronGeometry(0.42, 0);

    const snowMoundGeo = new RoundedBoxGeometry(1.75, 1.05, 1.55, 2, 0.42);
    const snowSubGeo = new RoundedBoxGeometry(1.15, 0.75, 1.15, 2, 0.32);
    const boulderGeo = new RoundedBoxGeometry(2.1, 1.65, 1.85, 2, 0.38);
    const boulderSnowCapGeo = new RoundedBoxGeometry(2.18, 0.55, 1.92, 2, 0.25);

    const snowmanBotGeo = new THREE.SphereGeometry(0.95, 14, 12);
    const snowmanMidGeo = new THREE.SphereGeometry(0.7, 14, 12);
    const snowmanHeadGeo = new THREE.SphereGeometry(0.5, 14, 12);
    const snowmanHatBrimGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.1, 14);
    const snowmanHatTopGeo = new THREE.CylinderGeometry(0.38, 0.36, 0.55, 14);
    const snowmanScarfGeo = new THREE.TorusGeometry(0.52, 0.13, 8, 16);
    const snowmanNoseGeo = new THREE.ConeGeometry(0.11, 0.48, 8);
    const snowmanEyeGeo = new THREE.SphereGeometry(0.07, 8, 8);

    // 1. Snow-Laden Alpine Pine Tree (7-part composite model)
    const createSnowPineTree = (scale = 1.0): THREE.Group => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.95;
      const t1 = new THREE.Mesh(pineTier1Geo, pineDarkMat);
      t1.position.y = 1.8;
      const s1 = new THREE.Mesh(pineSnow1Geo, snowPureMat);
      s1.position.y = 2.28;
      const t2 = new THREE.Mesh(pineTier2Geo, pineDarkMat);
      t2.position.y = 2.95;
      const s2 = new THREE.Mesh(pineSnow2Geo, snowPureMat);
      s2.position.y = 3.38;
      const t3 = new THREE.Mesh(pineTier3Geo, pineDarkMat);
      t3.position.y = 3.95;
      const s3 = new THREE.Mesh(pineSnow3Geo, snowPureMat);
      s3.position.y = 4.35;
      g.add(trunk, t1, s1, t2, s2, t3, s3);
      g.scale.setScalar(scale);
      return g;
    };

    // 2. Glowing Aurora Ice Crystal Cluster (5-part composite model)
    const createIceCrystalCluster = (
      scale = 1.0,
      useViolet = false
    ): THREE.Group => {
      const g = new THREE.Group();
      const matMain = useViolet ? iceVioletMat : iceCyanMat;
      const matSub = useViolet ? iceCyanMat : icePaleMat;

      const c1 = new THREE.Mesh(crystalMainGeo, matMain);
      c1.position.y = 1.4;
      c1.rotation.z = 0.06;

      const c2 = new THREE.Mesh(crystalSideGeo, matSub);
      c2.position.set(0.55, 0.9, 0.25);
      c2.rotation.z = -0.38;
      c2.rotation.x = 0.18;

      const c3 = new THREE.Mesh(crystalSideGeo, matMain);
      c3.position.set(-0.52, 0.85, -0.22);
      c3.rotation.z = 0.42;
      c3.rotation.x = -0.15;

      const baseSnow = new THREE.Mesh(snowSubGeo, snowFrostMat);
      baseSnow.position.y = 0.28;

      g.add(c1, c2, c3, baseSnow);
      g.scale.setScalar(scale);
      return g;
    };

    // 3. Cute Chibi Snowman with Top Hat, Scarf & Carrot Nose (9-part composite model)
    const createChibiSnowman = (scale = 1.0): THREE.Group => {
      const g = new THREE.Group();
      const bot = new THREE.Mesh(snowmanBotGeo, snowPureMat);
      bot.position.y = 0.85;
      const mid = new THREE.Mesh(snowmanMidGeo, snowPureMat);
      mid.position.y = 2.05;
      const head = new THREE.Mesh(snowmanHeadGeo, snowPureMat);
      head.position.y = 2.95;

      const scarf = new THREE.Mesh(snowmanScarfGeo, scarfRedMat);
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = 2.55;

      const nose = new THREE.Mesh(snowmanNoseGeo, carrotMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 2.95, 0.62);

      const eyeL = new THREE.Mesh(snowmanEyeGeo, coalMat);
      eyeL.position.set(-0.18, 3.08, 0.44);
      const eyeR = new THREE.Mesh(snowmanEyeGeo, coalMat);
      eyeR.position.set(0.18, 3.08, 0.44);

      const brim = new THREE.Mesh(snowmanHatBrimGeo, coalMat);
      brim.position.y = 3.38;
      const hatTop = new THREE.Mesh(snowmanHatTopGeo, coalMat);
      hatTop.position.y = 3.68;

      g.add(bot, mid, head, scarf, nose, eyeL, eyeR, brim, hatTop);
      g.scale.setScalar(scale);
      return g;
    };

    // 4. Arctic Igloo Dome with Entrance Tunnel & Glowing Ice Lantern (5-part composite model)
    const createArcticIgloo = (scale = 1.0): THREE.Group => {
      const g = new THREE.Group();
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        snowPureMat
      );
      dome.position.y = 0;

      const tunnel = new THREE.Mesh(
        new RoundedBoxGeometry(1.8, 1.7, 2.4, 3, 0.45),
        snowFrostMat
      );
      tunnel.position.set(0, 0.8, 2.9);

      const doorArch = new THREE.Mesh(
        new RoundedBoxGeometry(1.1, 1.25, 0.4, 2, 0.25),
        windowGlowMat
      );
      doorArch.position.set(0, 0.65, 3.95);

      const iceChimney = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.55, 1.1, 8),
        iceCyanMat
      );
      iceChimney.position.set(0, 3.1, -0.4);

      g.add(dome, tunnel, doorArch, iceChimney);
      g.scale.setScalar(scale);
      return g;
    };

    // 5. Cozy Nordic Timber Ski Chalet with Steep Snow Roof & Glowing Windows (8-part composite model)
    const createNordicSkiChalet = (scale = 1.0): THREE.Group => {
      const g = new THREE.Group();
      const cabin = new THREE.Mesh(
        new RoundedBoxGeometry(5.4, 3.6, 4.6, 2, 0.18),
        chaletWoodMat
      );
      cabin.position.y = 1.8;

      // Steep snow-covered A-frame roof
      const roofMain = new THREE.Mesh(
        new THREE.ConeGeometry(4.6, 3.2, 4),
        snowPureMat
      );
      roofMain.position.y = 5.0;
      roofMain.rotation.y = Math.PI / 4;

      // Warm glowing windows
      const win1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 0.2),
        windowGlowMat
      );
      win1.position.set(-1.3, 2.0, 2.26);
      const win2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 0.2),
        windowGlowMat
      );
      win2.position.set(1.3, 2.0, 2.26);

      // Chimney
      const chimney = new THREE.Mesh(
        new RoundedBoxGeometry(0.9, 2.6, 0.9, 2, 0.1),
        mountainRockMat
      );
      chimney.position.set(1.6, 5.2, -0.8);

      g.add(cabin, roofMain, win1, win2, chimney);
      g.scale.setScalar(scale);
      return g;
    };

    // 6. Grand Crystal Ice Palace / Fortress Landmark (10-part monumental castle!)
    const createGrandIcePalace = (): THREE.Group => {
      const g = new THREE.Group();
      const keep = new THREE.Mesh(
        new RoundedBoxGeometry(14, 11, 10, 3, 0.4),
        icePaleMat
      );
      keep.position.y = 5.5;
      g.add(keep);

      // Central soaring crystal spire
      const centerTower = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 3.2, 18, 8),
        iceCyanMat
      );
      centerTower.position.set(0, 9, 0);
      const centerSpire = new THREE.Mesh(
        new THREE.ConeGeometry(3.1, 9.5, 8),
        iceVioletMat
      );
      centerSpire.position.set(0, 22.5, 0);
      g.add(centerTower, centerSpire);

      // 4 Flanking Crystal Turrets
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const turret = new THREE.Mesh(
            new THREE.CylinderGeometry(1.6, 2.0, 13, 8),
            iceCyanMat
          );
          turret.position.set(sx * 7.2, 6.5, sz * 4.8);
          const spire = new THREE.Mesh(
            new THREE.ConeGeometry(2.0, 6.2, 8),
            snowPureMat
          );
          spire.position.set(sx * 7.2, 16.0, sz * 4.8);
          g.add(turret, spire);
        }
      }

      // Glowing Rose Window on the facade
      const roseWin = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12),
        windowGlowMat
      );
      roseWin.rotation.x = Math.PI / 2;
      roseWin.position.set(0, 7.8, 5.05);
      g.add(roseWin);

      return g;
    };

    // 7. Rotating Ice Crystal Windmill Tower
    const createIceWindmill = (): THREE.Group => {
      const g = new THREE.Group();
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2.5, 9.5, 8),
        snowFrostMat
      );
      tower.position.y = 4.75;
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 2.8, 8),
        iceCyanMat
      );
      roof.position.y = 10.8;
      g.add(tower, roof);

      const hub = new THREE.Group();
      hub.position.set(0, 7.8, 1.85);
      for (let b = 0; b < 4; b++) {
        const sail = new THREE.Mesh(
          new RoundedBoxGeometry(0.75, 6.8, 0.18, 2, 0.05),
          iceVioletMat
        );
        sail.rotation.z = (b * Math.PI) / 2;
        hub.add(sail);
      }
      g.add(hub);
      windmillBlades.push(hub);
      return g;
    };

    // Place the Monumental Grand Ice Palace at the Summit Courtyard (segment 58)!
    const summitSeg = TRACK_SEGMENTS[58] || TRACK_SEGMENTS[0];
    const palace = createGrandIcePalace();
    palace.position.set(
      summitSeg.x0 + summitSeg.rightX * 22,
      Math.max(0, summitSeg.y0 - 0.5),
      summitSeg.z0 + summitSeg.rightZ * 22
    );
    palace.rotation.y = Math.atan2(-summitSeg.dirX, -summitSeg.dirZ) - 0.5;
    sceneryGroup.add(palace);

    // Populate EVERY segment with Snow-Laden Pines, Ice Crystals, Snowmen, Chalets, Igloos & Ice Rib Arches!
    for (let i = 0; i < TRACK_SEGMENTS.length; i++) {
      const seg = TRACK_SEGMENTS[i];
      const seed = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
      const randA = seed - Math.floor(seed);
      const randB = seed * 1.73 - Math.floor(seed * 1.73);
      const randC = seed * 2.41 - Math.floor(seed * 2.41);
      const segYaw = Math.atan2(-seg.dirX, -seg.dirZ);

      // Overhead Glowing Crystal Ice Rib Arches curving over the Bobsled Chute & Crystal Cavern!
      if (
        !seg.isHighBridge &&
        !seg.isDeepWaterHazard &&
        ((i >= 96 && i <= 122 && i % 6 === 0) ||
          (i >= 186 && i <= 204 && i % 5 === 0))
      ) {
        const ribGroup = new THREE.Group();
        ribGroup.position.set(seg.x0, seg.y0, seg.z0);
        ribGroup.rotation.y = segYaw;

        for (const side of [-1, 1]) {
          const baseCrystal = new THREE.Mesh(
            new THREE.ConeGeometry(1.15, 7.2, 6),
            i % 2 === 0 ? iceCyanMat : iceVioletMat
          );
          baseCrystal.position.set(
            (seg.width * 0.5 + 1.4) * side,
            3.1,
            0
          );
          baseCrystal.rotation.z = -side * 0.42;
          ribGroup.add(baseCrystal);
        }
        sceneryGroup.add(ribGroup);
      }

      for (const side of [-1, 1]) {
        const baseGroundY =
          seg.isHighBridge || seg.isDeepWaterHazard
            ? 0
            : Math.max(0, seg.y0 - 0.25);

        // 1. ROADSIDE SNOWDRIFTS, GLOWING ICE CRYSTALS, SNOWMEN & FROSTED BOULDERS
        if (!seg.isHighBridge && !seg.isDeepWaterHazard) {
          // Glowing Ice Crystal Cluster every 3 segments
          if (i % 3 === 0) {
            const crysLat = (seg.width * 0.5 + 1.85 + randA * 2.2) * side;
            const cluster = createIceCrystalCluster(
              0.85 + randB * 0.55,
              (i + side) % 4 === 0
            );
            cluster.position.set(
              seg.x0 + seg.rightX * crysLat,
              baseGroundY,
              seg.z0 + seg.rightZ * crysLat
            );
            cluster.rotation.y = randC * Math.PI * 2;
            sceneryGroup.add(cluster);
          }

          // Cute Chibi Snowman waving beside the track every 14 segments
          if (i % 14 === (side === 1 ? 2 : 9)) {
            const smLat = (seg.width * 0.5 + 2.5 + randB * 1.6) * side;
            const snowman = createChibiSnowman(0.95 + randA * 0.25);
            snowman.position.set(
              seg.x0 + seg.rightX * smLat,
              baseGroundY,
              seg.z0 + seg.rightZ * smLat
            );
            snowman.rotation.y = segYaw - side * (Math.PI * 0.45);
            sceneryGroup.add(snowman);
          }

          // Snow-capped Glacial Boulders & Snowdrifts every 2 segments
          if (i % 2 === 0) {
            const rockLat = (seg.width * 0.5 + 2.2 + randC * 3.2) * side;
            const bGroup = new THREE.Group();
            const rock = new THREE.Mesh(boulderGeo, mountainSlateMat);
            rock.position.y = 0.65;
            const cap = new THREE.Mesh(boulderSnowCapGeo, snowPureMat);
            cap.position.y = 1.32;
            bGroup.add(rock, cap);
            const rScale = 0.75 + randA * 0.55;
            bGroup.scale.setScalar(rScale);
            bGroup.position.set(
              seg.x0 + seg.rightX * rockLat,
              baseGroundY,
              seg.z0 + seg.rightZ * rockLat
            );
            bGroup.rotation.y = randB * Math.PI;
            sceneryGroup.add(bGroup);
          }

          // Nordic Ski Chalets, Arctic Igloos & Ice Windmills at key scenic vistas
          if (i % 28 === 4 && side === 1) {
            const chaletLat = seg.width * 0.5 + 9.5;
            const chalet = createNordicSkiChalet(1.05);
            chalet.position.set(
              seg.x0 + seg.rightX * chaletLat,
              baseGroundY,
              seg.z0 + seg.rightZ * chaletLat
            );
            chalet.rotation.y = segYaw - Math.PI * 0.5;
            sceneryGroup.add(chalet);
          } else if (i % 24 === 12 && side === -1) {
            const iglooLat = -(seg.width * 0.5 + 8.2);
            const igloo = createArcticIgloo(1.0);
            igloo.position.set(
              seg.x0 + seg.rightX * iglooLat,
              baseGroundY,
              seg.z0 + seg.rightZ * iglooLat
            );
            igloo.rotation.y = segYaw + Math.PI * 0.45;
            sceneryGroup.add(igloo);
          } else if (i % 56 === 20 && side === 1) {
            const wmLat = seg.width * 0.5 + 11.5;
            const wm = createIceWindmill();
            wm.position.set(
              seg.x0 + seg.rightX * wmLat,
              baseGroundY,
              seg.z0 + seg.rightZ * wmLat
            );
            wm.rotation.y = segYaw - Math.PI * 0.5;
            sceneryGroup.add(wm);
          }
        }

        // 2. INNER SNOW-LADEN PINE FOREST (Every segment!)
        const innerDist = seg.isHighBridge
          ? 6.2 + randA * 5.5
          : 3.8 + randA * 5.2;
        const treeLat1 = (seg.width * 0.5 + innerDist) * side;
        const tx1 = seg.x0 + seg.rightX * treeLat1;
        const tz1 = seg.z0 + seg.rightZ * treeLat1;
        const scale1 = 1.0 + randB * 0.7;
        const pine1 = createSnowPineTree(scale1);
        pine1.position.set(tx1, baseGroundY, tz1);
        pine1.rotation.y = randC * Math.PI * 2;
        sceneryGroup.add(pine1);

        // 3. OUTER DEEP ALPINE PINE FOREST WALL (Every 2 segments)
        if (i % 2 === 0) {
          const outerDist = 9.8 + randC * 10.0;
          const treeLat2 = (seg.width * 0.5 + outerDist) * side;
          const tx2 = seg.x0 + seg.rightX * treeLat2 + seg.dirX * 1.8;
          const tz2 = seg.z0 + seg.rightZ * treeLat2 + seg.dirZ * 1.8;
          const scale2 = 1.25 + randA * 0.75;
          const pine2 = createSnowPineTree(scale2);
          pine2.position.set(tx2, 0, tz2);
          pine2.rotation.y = randA * Math.PI * 2;
          sceneryGroup.add(pine2);
        }
      }
    }

    // 8. GRAND PERIMETER SNOW-CAPPED ALPINE MOUNTAIN RANGE (18 Towering Peaks!)
    for (let m = 0; m < 18; m++) {
      const sample = sampleTrackAtDistance((m / 18) * TOTAL_TRACK_LENGTH);
      const side = m % 2 === 0 ? 1 : -1;
      const lat = (42 + (m % 3) * 14) * side;
      const mx = sample.x + sample.rightX * lat;
      const mz = sample.z + sample.rightZ * lat;
      const mHeight = 38 + (m % 4) * 12;
      const mRadius = 18 + (m % 3) * 5;

      const mtGroup = new THREE.Group();
      const basePeak = new THREE.Mesh(
        new THREE.ConeGeometry(mRadius, mHeight, 7),
        m % 2 === 0 ? mountainRockMat : mountainSlateMat
      );
      basePeak.position.y = mHeight * 0.5 - 1.0;

      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(mRadius * 0.56, mHeight * 0.52, 7),
        snowPureMat
      );
      snowCap.position.y = mHeight * 0.74 - 0.8;
      snowCap.rotation.y = 0.25;

      mtGroup.add(basePeak, snowCap);
      mtGroup.position.set(mx, 0, mz);
      mtGroup.rotation.y = m * 0.8;
      sceneryGroup.add(mtGroup);
    }

    // 9. SHIMMERING AURORA BOREALIS (NORTHERN LIGHTS) SKY RIBBONS & FROST CLOUDS
    const auroraColors = ['#34D399', '#38BDF8', '#A78BFA'];
    for (let k = 0; k < 12; k++) {
      const sample = sampleTrackAtDistance((k / 12) * TOTAL_TRACK_LENGTH);
      const side = k % 2 === 0 ? 1 : -1;
      const lat = (18 + (k % 4) * 7) * side;
      const cx = sample.x + sample.rightX * lat;
      const cz = sample.z + sample.rightZ * lat;
      const cy = Math.max(24, sample.y + 16 + (k % 3) * 4);

      const auroraRibbon = new THREE.Group();
      const aMat = new THREE.MeshBasicMaterial({
        color: auroraColors[k % auroraColors.length],
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
      });
      const curtain = new THREE.Mesh(
        new RoundedBoxGeometry(16, 4.2, 0.6, 2, 0.25),
        aMat
      );
      auroraRibbon.add(curtain);
      auroraRibbon.position.set(cx, cy, cz);
      auroraRibbon.rotation.y = Math.atan2(-sample.dirX, -sample.dirZ) + 0.35;
      sceneryGroup.add(auroraRibbon);
      floatingProps.push({ obj: auroraRibbon, baseY: cy, phase: k * 0.75 });
    }

    return { sceneryGroup, windmillBlades, floatingProps };
  }

  // Shared Forest Palette Materials
  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#6E472B',
    roughness: 0.88,
  });
  const birchTrunkMat = new THREE.MeshStandardMaterial({
    color: '#D8CFC2',
    roughness: 0.82,
  });
  const oakGreenMat = new THREE.MeshStandardMaterial({
    color: '#4D7C3F',
    roughness: 0.78,
  });
  const lushEmeraldMat = new THREE.MeshStandardMaterial({
    color: '#3F6A34',
    roughness: 0.8,
  });
  const mintGreenMat = new THREE.MeshStandardMaterial({
    color: '#6A994E',
    roughness: 0.78,
  });
  const goldenLeafMat = new THREE.MeshStandardMaterial({
    color: '#D99B26',
    roughness: 0.78,
  });
  const pineDarkMat = new THREE.MeshStandardMaterial({
    color: '#2D5A3C',
    roughness: 0.84,
  });
  const grassBladeMat = new THREE.MeshStandardMaterial({
    color: '#74A853',
    roughness: 0.75,
  });
  const mushroomCapMat = new THREE.MeshStandardMaterial({
    color: '#E05A4E',
    roughness: 0.65,
  });
  const mushroomStemMat = new THREE.MeshStandardMaterial({
    color: '#F8EFE0',
    roughness: 0.8,
  });
  const rockGreyMat = new THREE.MeshStandardMaterial({
    color: '#8C8881',
    roughness: 0.88,
  });
  const rockMossMat = new THREE.MeshStandardMaterial({
    color: '#6E7F62',
    roughness: 0.86,
  });
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#FFFDF9',
    roughness: 0.9,
  });

  // Shared Geometries (created once for 60fps performance!)
  const trunkGeo = new RoundedBoxGeometry(0.7, 2.4, 0.7, 2, 0.16);
  const mainCrownGeo = new RoundedBoxGeometry(2.6, 2.2, 2.6, 2, 0.5);
  const topPuffGeo = new RoundedBoxGeometry(1.65, 1.4, 1.65, 2, 0.38);
  const sidePuffGeo = new RoundedBoxGeometry(1.5, 1.3, 1.5, 2, 0.35);

  const pineTier1Geo = new RoundedBoxGeometry(2.7, 1.4, 2.7, 2, 0.32);
  const pineTier2Geo = new RoundedBoxGeometry(2.05, 1.3, 2.05, 2, 0.28);
  const pineTier3Geo = new RoundedBoxGeometry(1.35, 1.2, 1.35, 2, 0.24);

  const bushMainGeo = new RoundedBoxGeometry(1.55, 1.05, 1.45, 2, 0.38);
  const bushSubGeo = new RoundedBoxGeometry(1.05, 0.8, 1.05, 2, 0.3);
  const grassBladeGeo = new THREE.ConeGeometry(0.16, 0.85, 4);

  const mushStemGeo = new RoundedBoxGeometry(0.85, 1.8, 0.85, 2, 0.22);
  const mushCapGeo = new RoundedBoxGeometry(2.2, 1.1, 2.2, 2, 0.38);
  const mushSpotGeo = new THREE.BoxGeometry(0.4, 0.16, 0.4);

  const sharedRockGeo = new RoundedBoxGeometry(1.65, 1.15, 1.45, 2, 0.32);
  const tallBoulderGeo = new RoundedBoxGeometry(2.2, 2.1, 1.9, 2, 0.42);
  const cloud1Geo = new RoundedBoxGeometry(4.6, 1.6, 2.8, 2, 0.45);
  const cloud2Geo = new RoundedBoxGeometry(2.8, 2.1, 2.4, 2, 0.45);

  const createForestOakTree = (
    leafMat: THREE.Material,
    scale = 1.0,
    useBirch = false
  ): THREE.Group => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      trunkGeo,
      useBirch ? birchTrunkMat : trunkMat
    );
    trunk.position.y = 1.15;
    const mainCrown = new THREE.Mesh(mainCrownGeo, leafMat);
    mainCrown.position.y = 2.65;
    const topPuff = new THREE.Mesh(topPuffGeo, leafMat);
    topPuff.position.set(0.2, 3.85, -0.15);
    const sidePuff = new THREE.Mesh(sidePuffGeo, leafMat);
    sidePuff.position.set(-0.9, 2.35, 0.4);
    g.add(trunk, mainCrown, topPuff, sidePuff);
    g.scale.setScalar(scale);
    return g;
  };

  const createPineTree = (scale = 1.0): THREE.Group => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.95;
    const t1 = new THREE.Mesh(pineTier1Geo, pineDarkMat);
    t1.position.y = 1.85;
    const t2 = new THREE.Mesh(pineTier2Geo, pineDarkMat);
    t2.position.y = 2.9;
    const t3 = new THREE.Mesh(pineTier3Geo, pineDarkMat);
    t3.position.y = 3.85;
    g.add(trunk, t1, t2, t3);
    g.scale.setScalar(scale);
    return g;
  };

  const createForestBushCluster = (scale = 1.0): THREE.Group => {
    const g = new THREE.Group();
    const b1 = new THREE.Mesh(bushMainGeo, oakGreenMat);
    b1.position.y = 0.48;
    const b2 = new THREE.Mesh(bushSubGeo, mintGreenMat);
    b2.position.set(0.55, 0.36, 0.35);
    const b3 = new THREE.Mesh(bushSubGeo, lushEmeraldMat);
    b3.position.set(-0.5, 0.34, -0.3);
    g.add(b1, b2, b3);
    g.scale.setScalar(scale);
    return g;
  };

  const createGrassTuft = (scale = 1.0): THREE.Group => {
    const g = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(grassBladeGeo, grassBladeMat);
      const ang = (b / 3) * Math.PI * 2;
      blade.position.set(Math.cos(ang) * 0.14, 0.38, Math.sin(ang) * 0.14);
      blade.rotation.z = (b - 1) * 0.22;
      blade.rotation.y = ang;
      g.add(blade);
    }
    g.scale.setScalar(scale);
    return g;
  };

  const createGiantMushroom = (scale = 1.0): THREE.Group => {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(mushStemGeo, mushroomStemMat);
    stem.position.y = 0.9;
    const cap = new THREE.Mesh(mushCapGeo, mushroomCapMat);
    cap.position.y = 1.95;
    const spot1 = new THREE.Mesh(mushSpotGeo, mushroomStemMat);
    spot1.position.set(-0.5, 2.45, -0.4);
    const spot2 = new THREE.Mesh(mushSpotGeo, mushroomStemMat);
    spot2.position.set(0.55, 2.45, 0.4);
    g.add(stem, cap, spot1, spot2);
    g.scale.setScalar(scale);
    return g;
  };

  // Populate EVERY segment with dense multi-layered Forest Trees, Bushes, Grass Tufts & Boulders!
  for (let i = 0; i < TRACK_SEGMENTS.length; i++) {
    const seg = TRACK_SEGMENTS[i];
    const seed = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
    const randA = seed - Math.floor(seed);
    const randB = seed * 1.73 - Math.floor(seed * 1.73);
    const randC = seed * 2.41 - Math.floor(seed * 2.41);

    for (const side of [-1, 1]) {
      const baseGroundY =
        seg.isHighBridge || seg.isDeepWaterHazard
          ? 0
          : Math.max(0, seg.y0 - 0.25);

      if (!seg.isHighBridge && !seg.isDeepWaterHazard) {
        const grassLat = (seg.width * 0.5 + 1.45 + randA * 1.8) * side;
        const grassTuft = createGrassTuft(0.9 + randB * 0.5);
        grassTuft.position.set(
          seg.x0 + seg.rightX * grassLat,
          baseGroundY,
          seg.z0 + seg.rightZ * grassLat
        );
        sceneryGroup.add(grassTuft);

        if (i % 2 === 0) {
          const bushLat = (seg.width * 0.5 + 2.1 + randB * 2.4) * side;
          const bush = createForestBushCluster(0.85 + randC * 0.5);
          bush.position.set(
            seg.x0 + seg.rightX * bushLat,
            baseGroundY,
            seg.z0 + seg.rightZ * bushLat
          );
          bush.rotation.y = randA * Math.PI * 2;
          sceneryGroup.add(bush);
        }

        if ((i + (side === 1 ? 1 : 0)) % 2 === 0) {
          const rockLat = (seg.width * 0.5 + 1.85 + randC * 3.5) * side;
          const isBig = i % 6 === 0;
          const rock = new THREE.Mesh(
            isBig ? tallBoulderGeo : sharedRockGeo,
            i % 3 === 0 ? rockMossMat : rockGreyMat
          );
          const rScale = 0.75 + randA * 0.65;
          rock.scale.setScalar(rScale);
          rock.position.set(
            seg.x0 + seg.rightX * rockLat + seg.dirX * 1.1,
            baseGroundY + 0.35 * rScale,
            seg.z0 + seg.rightZ * rockLat + seg.dirZ * 1.1
          );
          rock.rotation.y = randB * Math.PI;
          sceneryGroup.add(rock);
        }
      }

      const innerDist = seg.isHighBridge
        ? 5.8 + randA * 5.5
        : 3.4 + randA * 5.2;
      const treeLat1 = (seg.width * 0.5 + innerDist) * side;
      const tx1 = seg.x0 + seg.rightX * treeLat1;
      const tz1 = seg.z0 + seg.rightZ * treeLat1;
      const scale1 = 0.95 + randB * 0.65;

      let tree1: THREE.Group;
      if (i % 3 === 0) {
        tree1 = createPineTree(scale1 * 1.15);
      } else if (i % 7 === 0) {
        tree1 = createForestOakTree(goldenLeafMat, scale1, true);
      } else if (i % 5 === 0) {
        tree1 = createForestOakTree(mintGreenMat, scale1, false);
      } else if (i % 11 === 0 && !seg.isHighBridge) {
        tree1 = createGiantMushroom(scale1);
      } else {
        tree1 = createForestOakTree(
          i % 2 === 0 ? oakGreenMat : lushEmeraldMat,
          scale1,
          false
        );
      }
      tree1.position.set(tx1, baseGroundY, tz1);
      tree1.rotation.y = randC * Math.PI * 2;
      sceneryGroup.add(tree1);

      if (i % 2 === 0) {
        const outerDist = 9.2 + randC * 9.5;
        const treeLat2 = (seg.width * 0.5 + outerDist) * side;
        const tx2 = seg.x0 + seg.rightX * treeLat2 + seg.dirX * 1.8;
        const tz2 = seg.z0 + seg.rightZ * treeLat2 + seg.dirZ * 1.8;
        const scale2 = 1.15 + randA * 0.7;
        const tree2 =
          (i + side) % 3 === 0
            ? createPineTree(scale2 * 1.2)
            : createForestOakTree(lushEmeraldMat, scale2, false);
        tree2.position.set(tx2, 0, tz2);
        tree2.rotation.y = randA * Math.PI * 2;
        sceneryGroup.add(tree2);
      }
    }
  }

  // Soft Woodland Sky Clouds
  for (let k = 0; k < 14; k++) {
    const sample = sampleTrackAtDistance((k / 14) * TOTAL_TRACK_LENGTH);
    const side = k % 2 === 0 ? 1 : -1;
    const lat = (20 + (k % 5) * 6) * side;
    const cx = sample.x + sample.rightX * lat;
    const cz = sample.z + sample.rightZ * lat;
    const cy = Math.max(18, sample.y + 11 + (k % 4) * 3.5);

    const cloud = new THREE.Group();
    const c1 = new THREE.Mesh(cloud1Geo, cloudMat);
    const c2 = new THREE.Mesh(cloud2Geo, cloudMat);
    c2.position.set(-0.6, 0.6, 0);
    cloud.add(c1, c2);
    cloud.position.set(cx, cy, cz);
    cloud.rotation.y = k * 0.7;
    sceneryGroup.add(cloud);
    floatingProps.push({ obj: cloud, baseY: cy, phase: k * 0.8 });
  }

  return { sceneryGroup, windmillBlades, floatingProps };
}

export const RaceGameCanvas: React.FC<RaceGameCanvasProps> = ({
  trackId,
  playerCharacterId,
  playerActiveSkillId,
  playerPassiveSkillId,
  playerLoadout,
  raceSessionKey,
  isLobbyOpen,
  externalActionTrigger,
  externalReplayTrigger,
  joystickInputRef,
  spectatedRacerId,
  onHudUpdate,
  onPlayerFinishRace,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  // Ensure active track spline is synchronized before initial state creation
  setActiveTrack(trackId);
  const simStateRef = useRef<RaceSimulationState>(
    createInitialRaceState(
      playerCharacterId,
      playerActiveSkillId,
      playerPassiveSkillId
    )
  );
  const isLobbyOpenRef = useRef<boolean>(isLobbyOpen);
  const spectatedRacerIdRef = useRef<CharacterId | null>(
    spectatedRacerId ?? null
  );
  const onHudUpdateRef = useRef(onHudUpdate);
  const onPlayerFinishRaceRef = useRef(onPlayerFinishRace);
  const playerLoadoutRef = useRef<EquippedLoadout | undefined>(playerLoadout);
  const playerLoadoutKeyRef = useRef<string>(JSON.stringify(playerLoadout || {}));
  const reportedFinishSessionRef = useRef<number>(0);

  // Replay recording & playback buffers
  const replayFramesRef = useRef<ReplayKeyframe[]>([]);
  const lastRecordedReplaySecRef = useRef<number>(-1);
  const replayStateRef = useRef<{
    isActive: boolean;
    isPlaying: boolean;
    currentTimeSec: number;
    speed: number;
    target: ReplayCameraTarget;
  }>({
    isActive: false,
    isPlaying: true,
    currentTimeSec: 0,
    speed: 1,
    target: 'leader',
  });

  const recordReplayKeyframe = (state: RaceSimulationState) => {
    const leader =
      state.racers.find((r) => r.rank === 1) ?? state.racers[0];
    replayFramesRef.current.push({
      timeSec: state.elapsedRaceSec,
      leaderId: leader.id,
      racers: state.racers.map((r) => ({
        id: r.id,
        x: r.x,
        y: r.y,
        z: r.z,
        groundY: r.groundY,
        vx: r.vx,
        vy: r.vy,
        vz: r.vz,
        knockVx: r.knockVx,
        knockVz: r.knockVz,
        yaw: r.yaw,
        pose: r.pose,
        rank: r.rank,
        totalProgress: r.totalProgress,
        furthestCheckpointDist: r.furthestCheckpointDist,
        finished: r.finished,
        finishTimeSec: r.finishTimeSec,
        shieldTimer: r.shieldTimer,
        whirlwindTimer: r.whirlwindTimer,
        freezeTimer: r.freezeTimer,
        dashTimer: r.dashTimer,
        stunTimer: r.stunTimer,
        slapAnimTimer: r.slapAnimTimer,
        respawnBlinkTimer: r.respawnBlinkTimer,
        pokeImpulse: r.pokeImpulse,
      })),
      droppedTraps: state.droppedTraps.map((t) => ({
        x: t.x,
        y: t.y,
        z: t.z,
        radius: t.radius,
      })),
      pieProjectiles: state.pieProjectiles.map((p) => ({
        x: p.x,
        y: p.y,
        z: p.z,
        kind: p.kind,
      })),
      shockwaves: state.shockwaves.map((s) => ({
        x: s.x,
        y: s.y,
        z: s.z,
        maxRadius: s.maxRadius,
        age: s.age,
        maxAge: s.maxAge,
        colorHex: s.colorHex,
      })),
    });
    lastRecordedReplaySecRef.current = state.elapsedRaceSec;
  };

  const fastForwardCompleteAllRacers = () => {
    const state = simStateRef.current;
    if (state.phase === 'countdown') {
      state.phase = 'racing';
      state.countdownSec = 0;
    }
    if (!state.allFinished) {
      const idleInput: PlayerControlInput = {
        moveForward: 1,
        moveRight: 0,
        cameraYaw: cameraYawRef.current,
        jumpRequested: false,
        skillQRequested: false,
        itemERequested: false,
        slapFRequested: false,
      };
      let guard = 0;
      while (!state.allFinished && guard < 420) {
        stepRaceSimulation(state, 0.065, idleInput);
        recordReplayKeyframe(state);
        guard++;
      }
      if (!state.allFinished) {
        finishAllRemainingRacers(state);
        recordReplayKeyframe(state);
      }
    } else if (
      replayFramesRef.current.length === 0 ||
      replayFramesRef.current[replayFramesRef.current.length - 1].timeSec <
        state.elapsedRaceSec
    ) {
      recordReplayKeyframe(state);
    }
  };

  const keysDownRef = useRef<Set<string>>(new Set());
  const cameraYawRef = useRef<number>(0);
  const targetCameraYawRef = useRef<number>(0);
  const cameraYawVelRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0.42);
  const targetCameraPitchRef = useRef<number>(0.42);
  const cameraPitchVelRef = useRef<number>(0);
  const pendingActionsRef = useRef({
    jump: false,
    q: false,
    e: false,
    f: false,
  });

  useEffect(() => {
    isLobbyOpenRef.current = isLobbyOpen;
    if (isLobbyOpen && document.pointerLockElement) {
      try {
        document.exitPointerLock?.();
      } catch {
        // Ignore pointer lock exit errors
      }
    }
  }, [isLobbyOpen]);

  useEffect(() => {
    spectatedRacerIdRef.current = spectatedRacerId ?? null;
    if (spectatedRacerId) {
      const target = simStateRef.current.racers.find(
        (r) => r.id === spectatedRacerId
      );
      if (target) {
        targetCameraYawRef.current = target.yaw;
      }
    }
  }, [spectatedRacerId]);

  useEffect(() => {
    onHudUpdateRef.current = onHudUpdate;
  }, [onHudUpdate]);

  useEffect(() => {
    onPlayerFinishRaceRef.current = onPlayerFinishRace;
  }, [onPlayerFinishRace]);

  useEffect(() => {
    playerLoadoutRef.current = playerLoadout;
    playerLoadoutKeyRef.current = JSON.stringify(playerLoadout || {});
  }, [playerLoadout]);

  useEffect(() => {
    if (!externalActionTrigger.type) return;
    if (externalActionTrigger.type === 'q') pendingActionsRef.current.q = true;
    if (externalActionTrigger.type === 'e') pendingActionsRef.current.e = true;
    if (externalActionTrigger.type === 'f') pendingActionsRef.current.f = true;
    if (externalActionTrigger.type === 'jump')
      pendingActionsRef.current.jump = true;
  }, [externalActionTrigger]);

  useEffect(() => {
    const act = externalReplayTrigger?.action;
    if (!act) return;
    const rep = replayStateRef.current;
    if (act.type === 'finish_all_racers') {
      fastForwardCompleteAllRacers();
    } else if (act.type === 'start_replay') {
      fastForwardCompleteAllRacers();
      rep.isActive = true;
      rep.isPlaying = true;
      rep.currentTimeSec = 0;
      rep.speed = 1;
      if (act.target) {
        rep.target = act.target;
      }
    } else if (act.type === 'stop_replay') {
      rep.isActive = false;
      rep.isPlaying = false;
    } else if (act.type === 'toggle_play') {
      const totalDur =
        replayFramesRef.current.length > 0
          ? replayFramesRef.current[replayFramesRef.current.length - 1].timeSec
          : simStateRef.current.elapsedRaceSec;
      if (!rep.isPlaying && rep.currentTimeSec >= Math.max(0.1, totalDur - 0.05)) {
        rep.currentTimeSec = 0;
      }
      rep.isPlaying = !rep.isPlaying;
    } else if (act.type === 'restart') {
      rep.currentTimeSec = 0;
      rep.isPlaying = true;
    } else if (act.type === 'seek') {
      const totalDur =
        replayFramesRef.current.length > 0
          ? replayFramesRef.current[replayFramesRef.current.length - 1].timeSec
          : simStateRef.current.elapsedRaceSec;
      rep.currentTimeSec = Math.max(0, Math.min(totalDur, act.timeSec));
    } else if (act.type === 'set_speed') {
      rep.speed = act.speed;
    } else if (act.type === 'set_target') {
      rep.target = act.target;
    }
  }, [externalReplayTrigger]);

  // Reset race state when trackId, character, skills, or session key changes
  useEffect(() => {
    setActiveTrack(trackId);
    const fresh = createInitialRaceState(
      playerCharacterId,
      playerActiveSkillId,
      playerPassiveSkillId
    );
    const startSeg = TRACK_SEGMENTS[0];
    const initialYaw = Math.atan2(-startSeg.dirX, -startSeg.dirZ);
    cameraYawRef.current = initialYaw;
    targetCameraYawRef.current = initialYaw;
    cameraYawVelRef.current = 0;
    cameraPitchRef.current = 0.42;
    targetCameraPitchRef.current = 0.42;
    cameraPitchVelRef.current = 0;
    simStateRef.current = fresh;
    reportedFinishSessionRef.current = 0;
    replayFramesRef.current = [];
    lastRecordedReplaySecRef.current = -1;
    replayStateRef.current = {
      isActive: false,
      isPlaying: true,
      currentTimeSec: 0,
      speed: 1,
      target: 'leader',
    };
    recordReplayKeyframe(fresh);
  }, [
    trackId,
    playerCharacterId,
    playerActiveSkillId,
    playerPassiveSkillId,
    raceSessionKey,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setActiveTrack(trackId);
    const isSnow = trackId === 'snow_glacier';

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const skyColorHex = isSnow ? '#CBE4F9' : '#D5E6CE';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(skyColorHex);
    scene.fog = new THREE.FogExp2(skyColorHex, isSnow ? 0.0022 : 0.0026);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.2, 460);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const glRenderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : '';
    const isSoftwareGl =
      /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(glRenderer);

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isSnow ? 1.08 : 1.06;
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = isSnow ? 0.65 : 0.55;

    // Sunlight & Fill Lighting
    const hemiLight = new THREE.HemisphereLight(
      isSnow ? '#F0F9FF' : '#FFFDF9',
      isSnow ? '#7DD3FC' : '#6B8E4E',
      isSnow ? 0.96 : 0.92
    );
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(
      isSnow ? '#FFFFFF' : '#FFF6E6',
      isSnow ? 1.5 : 1.55
    );
    dirLight.position.set(45, 75, 45);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
    dirLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 260;
    const d = 85;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Ground Floor (Snowfield vs Woodland Moss)
    const meadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1400, 1400),
      new THREE.MeshStandardMaterial({
        color: isSnow ? '#E2F1FC' : '#6A8E4E',
        roughness: isSnow ? 0.78 : 0.95,
      })
    );
    meadowPlane.rotation.x = -Math.PI / 2;
    meadowPlane.position.y = -0.35;
    meadowPlane.receiveShadow = true;
    scene.add(meadowPlane);

    // ========================================================================
    // 1. CONTINUOUS 3D SPLINE TRACK & PLANK BRIDGES / SHALLOW FORDS / SLOPES
    // ========================================================================
    const trackGroup = buildContinuousTrackRibbon(trackId);
    scene.add(trackGroup);

    // ========================================================================
    // 2. DENSE SCENERY (WOODLAND FOREST OR GLACIER PEAK SNOW & ICE)
    // ========================================================================
    const { sceneryGroup, windmillBlades, floatingProps } =
      buildEnvironmentalScenery(trackId);
    scene.add(sceneryGroup);

    // ========================================================================
    // 3. DEEP WATER RIVER / ARCTIC FJORD HAZARD + 3D STEPPING STONES / ICEBERGS
    // ========================================================================
    const hazardGroup = new THREE.Group();
    scene.add(hazardGroup);

    const waterSegs = TRACK_SEGMENTS.filter((s) => s.isBridgeOverWater);
    if (waterSegs.length > 0) {
      let wx = 0;
      let wz = 0;
      waterSegs.forEach((ws) => {
        wx += ws.x0;
        wz += ws.z0;
      });
      wx /= waterSegs.length;
      wz /= waterSegs.length;

      const deepRiverMat = new THREE.MeshStandardMaterial({
        color: isSnow ? '#082F49' : '#0369A1',
        roughness: 0.12,
        metalness: 0.15,
      });
      const pond = new THREE.Mesh(
        new RoundedBoxGeometry(165, 0.35, 120, 4, 0.1),
        deepRiverMat
      );
      pond.position.set(wx, -0.16, wz);
      pond.receiveShadow = true;
      hazardGroup.add(pond);

      // Stepping Stones (Mossy Rocks in Woodland, 3D Floating Icebergs in Snow & Ice!)
      const stoneBaseMat = new THREE.MeshStandardMaterial({
        color: isSnow ? '#0284C7' : '#57534E',
        roughness: isSnow ? 0.3 : 0.9,
      });
      const stoneMossMat = new THREE.MeshStandardMaterial({
        color: isSnow ? '#7DD3FC' : '#65A30D',
        roughness: isSnow ? 0.25 : 0.82,
      });
      const stoneTopMat = new THREE.MeshStandardMaterial({
        color: isSnow ? '#F8FAFC' : '#D6D3D1',
        roughness: isSnow ? 0.5 : 0.75,
      });
      const stoneRingMat = new THREE.MeshBasicMaterial({
        color: '#BAE6FD',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.58,
      });

      for (const st of RIVER_STEPPING_STONES) {
        const stGroup = new THREE.Group();
        stGroup.position.set(st.x, st.y, st.z);
        stGroup.rotation.y = st.yaw;

        // Submerged dark rock or deep blue iceberg shelf
        const baseMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(
            st.radius * 0.98,
            st.radius * 1.14,
            0.65,
            isSnow ? 7 : 10
          ),
          stoneBaseMat
        );
        baseMesh.position.y = -0.32;
        stGroup.add(baseMesh);

        // Collar (Mossy green or crystalline cyan ice rim)
        const mossMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(
            st.radius * 0.96,
            st.radius * 1.02,
            0.15,
            isSnow ? 7 : 10
          ),
          stoneMossMat
        );
        mossMesh.position.y = -0.04;
        stGroup.add(mossMesh);

        // Flat top platform for jumping on!
        const topMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(
            st.radius * 0.88,
            st.radius * 0.95,
            0.16,
            isSnow ? 7 : 10
          ),
          stoneTopMat
        );
        topMesh.position.y = 0.04;
        topMesh.receiveShadow = true;
        topMesh.castShadow = true;
        stGroup.add(topMesh);

        // Water ripple ring
        const ripple = new THREE.Mesh(
          new THREE.RingGeometry(st.radius * 1.02, st.radius * 1.18, 16),
          stoneRingMat
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.y = -0.12;
        stGroup.add(ripple);

        hazardGroup.add(stGroup);
      }

      // Decorative Fjord Icebergs (in Snow) or Lily Pads (in Woodland)
      const decorMat = new THREE.MeshStandardMaterial({
        color: isSnow ? '#E0F2FE' : '#4D7C0F',
        roughness: isSnow ? 0.35 : 0.7,
      });
      for (let l = 0; l < 18; l++) {
        const angle = (l / 18) * Math.PI * 2;
        const rad = 20 + (l % 4) * 9;
        if (isSnow) {
          const bergGroup = new THREE.Group();
          const floe = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 2.6, 0.35, 6),
            stoneTopMat
          );
          const spire = new THREE.Mesh(
            new THREE.ConeGeometry(1.4, 3.2 + (l % 3) * 1.4, 6),
            decorMat
          );
          spire.position.y = 1.4;
          bergGroup.add(floe, spire);
          bergGroup.position.set(
            wx + Math.cos(angle) * rad,
            0.05,
            wz + Math.sin(angle) * rad
          );
          bergGroup.rotation.y = l * 0.6;
          hazardGroup.add(bergGroup);
        } else {
          const lily = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 0.08, 14),
            decorMat
          );
          lily.position.set(
            wx + Math.cos(angle) * rad,
            0.02,
            wz + Math.sin(angle) * rad
          );
          hazardGroup.add(lily);
        }
      }
    }

    // Start / Finish Checkered Archway
    const startSeg = TRACK_SEGMENTS[0];
    const startYaw = Math.atan2(-startSeg.dirX, -startSeg.dirZ);
    const archGroup = new THREE.Group();
    archGroup.position.set(startSeg.x0, startSeg.y0, startSeg.z0);
    archGroup.rotation.y = startYaw;

    const pillarMat = new THREE.MeshStandardMaterial({
      color: isSnow ? '#0284C7' : '#C86D3B',
      roughness: isSnow ? 0.25 : 0.6,
    });
    const leftPillar = new THREE.Mesh(
      new RoundedBoxGeometry(0.9, 5.2, 0.9, 3, 0.16),
      pillarMat
    );
    leftPillar.position.set(-5.2, 2.6, 0);
    leftPillar.castShadow = true;
    const rightPillar = new THREE.Mesh(
      new RoundedBoxGeometry(0.9, 5.2, 0.9, 3, 0.16),
      pillarMat
    );
    rightPillar.position.set(5.2, 2.6, 0);
    rightPillar.castShadow = true;

    const bannerTex = createCheckeredBannerTexture();
    const topBanner = new THREE.Mesh(
      new RoundedBoxGeometry(11.6, 1.3, 1.0, 3, 0.16),
      new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.5 })
    );
    topBanner.position.set(0, 4.9, 0);
    topBanner.castShadow = true;

    const startLineStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(10.6, 1.5),
      new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.7 })
    );
    startLineStrip.rotation.x = -Math.PI / 2;
    startLineStrip.position.set(0, 0.03, 0);

    archGroup.add(leftPillar, rightPillar, topBanner, startLineStrip);
    hazardGroup.add(archGroup);

    // Sticky Slime / Frozen Slush Puddles (3D)
    const slimeMat = new THREE.MeshStandardMaterial({
      color: isSnow ? '#06B6D4' : '#84CC16',
      roughness: 0.2,
      metalness: 0.1,
    });
    for (const slime of SLIME_PADS) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          slime.radius,
          slime.radius * 1.04,
          0.12,
          24
        ),
        slimeMat
      );
      mesh.position.set(slime.x, slime.y + 0.04, slime.z);
      mesh.receiveShadow = true;
      hazardGroup.add(mesh);
    }

    // Speed Boost Pads
    const boostMat = new THREE.MeshStandardMaterial({
      color: isSnow ? '#38BDF8' : '#F59E0B',
      emissive: isSnow ? '#0284C7' : '#F59E0B',
      emissiveIntensity: 0.4,
      roughness: 0.35,
    });
    for (const pad of BOOST_PADS) {
      const padMesh = new THREE.Mesh(
        new RoundedBoxGeometry(2.2, 0.1, 2.8, 2, 0.03),
        boostMat
      );
      padMesh.position.set(pad.x, pad.y + 0.04, pad.z);
      padMesh.rotation.y = pad.yaw;
      hazardGroup.add(padMesh);
    }

    // Spinning Turntables with Sweeping Bumper Beams
    const turntableMeshes: { group: THREE.Group; spec: typeof TURNTABLES[0] }[] =
      [];
    for (const tt of TURNTABLES) {
      const g = new THREE.Group();
      g.position.set(tt.x, tt.y + 0.05, tt.z);

      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(tt.radius, tt.radius, 0.16, 32),
        new THREE.MeshStandardMaterial({
          color: isSnow ? '#7DD3FC' : '#FDE047',
          roughness: 0.35,
        })
      );
      disc.receiveShadow = true;
      g.add(disc);

      const hub = new THREE.Mesh(
        new RoundedBoxGeometry(0.95, 0.9, 0.95, 3, 0.18),
        new THREE.MeshStandardMaterial({
          color: isSnow ? '#6366F1' : '#EF4444',
          roughness: 0.35,
        })
      );
      hub.position.y = 0.45;
      g.add(hub);

      const beam = new THREE.Mesh(
        new RoundedBoxGeometry(tt.barHalfLength * 2, 0.44, 0.44, 3, 0.12),
        new THREE.MeshStandardMaterial({
          color: isSnow ? '#38BDF8' : '#EF4444',
          roughness: 0.35,
        })
      );
      beam.position.y = 0.36;
      beam.castShadow = true;
      g.add(beam);

      hazardGroup.add(g);
      turntableMeshes.push({ group: g, spec: tt });
    }

    // Rolling Boulders / Giant Snowballs & Crystal Balls
    const boulderMeshes: { mesh: THREE.Mesh; spec: typeof ROLLING_BOULDERS[0] }[] =
      [];
    for (const b of ROLLING_BOULDERS) {
      const geo = b.isBeachBall
        ? new RoundedBoxGeometry(
            b.radius * 1.85,
            b.radius * 1.85,
            b.radius * 1.85,
            5,
            b.radius * 0.55
          )
        : new RoundedBoxGeometry(
            b.radius * 1.8,
            b.radius * 1.8,
            b.radius * 1.8,
            3,
            b.radius * 0.38
          );
      const mat = new THREE.MeshStandardMaterial({
        color: b.colorHex,
        roughness: b.isBeachBall ? 0.28 : isSnow ? 0.55 : 0.85,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.centerX, b.centerY + b.radius, b.centerZ);
      mesh.castShadow = true;
      hazardGroup.add(mesh);
      boulderMeshes.push({ mesh, spec: b });
    }

    // 3D Falling Snowflakes Particle System (Active on Snow & Ice Circuit!)
    const snowflakesGroup = new THREE.Group();
    if (isSnow) {
      scene.add(snowflakesGroup);
    }
    const snowflakeMeshes: {
      mesh: THREE.Mesh;
      offsetX: number;
      offsetZ: number;
      fallSpeed: number;
      swayPhase: number;
      heightOffset: number;
    }[] = [];
    if (isSnow) {
      const flakeGeo = new THREE.OctahedronGeometry(0.14, 0);
      const flakeMat = new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.88,
      });
      for (let sf = 0; sf < 95; sf++) {
        const m = new THREE.Mesh(flakeGeo, flakeMat);
        const ox = ((Math.sin(sf * 17.3) * 0.5 + 0.5) - 0.5) * 44;
        const oz = ((Math.cos(sf * 31.7) * 0.5 + 0.5) - 0.5) * 44;
        const hOff = (sf / 95) * 18;
        snowflakesGroup.add(m);
        snowflakeMeshes.push({
          mesh: m,
          offsetX: ox,
          offsetZ: oz,
          fallSpeed: 2.8 + (sf % 5) * 0.6,
          swayPhase: sf * 0.9,
          heightOffset: hOff,
        });
      }
    }

    // Mystery Item Boxes
    const itemBoxMeshes: Map<string, THREE.Mesh> = new Map();
    const boxGeo = new RoundedBoxGeometry(0.95, 0.95, 0.95, 3, 0.18);
    const boxMat = new THREE.MeshStandardMaterial({
      color: '#FBBF24',
      emissive: '#D97706',
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.2,
    });
    for (const box of simStateRef.current.itemBoxes) {
      const m = new THREE.Mesh(boxGeo, boxMat);
      m.position.set(box.x, box.y + 0.95, box.z);
      m.castShadow = true;
      hazardGroup.add(m);
      itemBoxMeshes.set(box.id, m);
    }

    const dynamicEffectsGroup = new THREE.Group();
    scene.add(dynamicEffectsGroup);

    // Cute Footstep Smoke / Dust & Water Splash Puffs Group ("เพิ่มความน่ารักโดยเพิ่มควันผุดขึ้นมาตามหลังเท้าตรงพื้นที่ตัวละครเหยียบ")
    const footstepPuffsGroup = new THREE.Group();
    scene.add(footstepPuffsGroup);
    const sharedPuffGeo = new THREE.DodecahedronGeometry(0.24, 1);
    const dustPuffMat = new THREE.MeshStandardMaterial({
      color: '#FFFDF7',
      roughness: 0.92,
      transparent: true,
      opacity: 0.88,
    });
    const splashPuffMat = new THREE.MeshStandardMaterial({
      color: '#BAE6FD',
      roughness: 0.35,
      transparent: true,
      opacity: 0.9,
    });

    interface ActiveFootstepPuff {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      age: number;
      maxAge: number;
      peakScale: number;
    }
    const activeFootstepPuffs: ActiveFootstepPuff[] = [];
    const racerStepState = new Map<
      CharacterId,
      {
        timer: number;
        footSide: number;
        wasAirborne: boolean;
        animTime: number;
        smoothGroundY: number;
        smoothPitch: number;
        smoothRoll: number;
        prevYaw: number;
        squashY: number;
      }
    >();

    const spawnFootstepPuff = (
      x: number,
      y: number,
      z: number,
      vx: number,
      vy: number,
      vz: number,
      peakScale: number,
      isWaterSplash: boolean
    ) => {
      if (activeFootstepPuffs.length > 90) {
        const oldest = activeFootstepPuffs.shift()!;
        footstepPuffsGroup.remove(oldest.mesh);
      }
      const mesh = new THREE.Mesh(
        sharedPuffGeo,
        isWaterSplash ? splashPuffMat : dustPuffMat
      );
      mesh.position.set(x, y, z);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.scale.setScalar(peakScale * 0.45);
      footstepPuffsGroup.add(mesh);
      activeFootstepPuffs.push({
        mesh,
        vx,
        vy,
        vz,
        age: 0,
        maxAge: isWaterSplash ? 0.38 : 0.46,
        peakScale,
      });
    };

    // ========================================================================
    // 4. BUILD ALL 8 CHIBI PROCEDURAL RACER RIGS (FACING FORWARD!)
    // ========================================================================
    const shadowTex = createContactShadowTexture();
    const racerVisuals: Map<
      CharacterId,
      {
        container: THREE.Group;
        rig: CharacterRig;
        shieldBubble: THREE.Mesh;
        whirlwindRing: THREE.Mesh;
        freezeBlock: THREE.Mesh;
        playerMarker: THREE.Mesh | null;
      }
    > = new Map();

    const botCosmeticLoadouts: EquippedLoadout[] = [
      {
        weapon: 'w_durian_mace',
        headgear: 'h_glacier_crown',
        cape: 'c_dragon_wings',
        aura: 'a_thunder_god',
      },
      {
        weapon: 'w_golden_wok',
        headgear: 'h_noodle_pot',
        cape: 'c_soda_jetpack',
        aura: 'a_chili_sparks',
      },
      {
        weapon: 'w_popsicle_wand',
        headgear: 'h_disco_afro',
        cape: 'c_royal_ermine',
        aura: 'a_rainbow_party',
      },
      {
        weapon: 'w_mama_slipper',
        headgear: 'h_viking_plunger',
        cape: 'c_cardboard_wings',
        aura: 'a_frost_blizzard',
      },
      {
        weapon: 'w_squeaky_duck',
        headgear: 'h_propeller_cap',
        cape: 'c_towel_cape',
        aura: 'a_soap_bubbles',
      },
    ];

    const buildRacerVisualsForCurrentState = () => {
      for (const v of racerVisuals.values()) {
        scene.remove(v.container);
      }
      racerVisuals.clear();

      simStateRef.current.racers.forEach((r, idx) => {
        const wrapper = new THREE.Group();
        const rig = buildProceduralCharacter(r.id, shadowTex);
        rig.rootGroup.scale.setScalar(0.75);
        // Fix orientation: procedural character's face/eyes are built at +Z and tail at -Z,
        // while raceEngine's forward vector (-sin(yaw), -cos(yaw)) is wrapper's -Z.
        // Rotating rootGroup by Math.PI (180°) makes the character face forward down the track!
        rig.rootGroup.rotation.y = Math.PI;
        attachEquipmentToCharacterRig(
          rig,
          r.isPlayer
            ? playerLoadoutRef.current
            : botCosmeticLoadouts[idx % botCosmeticLoadouts.length]
        );
        wrapper.add(rig.rootGroup);

        // Bubble Shield sphere
        const shieldBubble = new THREE.Mesh(
          new THREE.SphereGeometry(1.18, 20, 20),
          new THREE.MeshStandardMaterial({
            color: '#38BDF8',
            transparent: true,
            opacity: 0.35,
            roughness: 0.15,
          })
        );
        shieldBubble.position.y = 0.85;
        shieldBubble.visible = false;
        wrapper.add(shieldBubble);

        // Cyclone Spin Tornado Ring
        const whirlwindRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.35, 0.12, 10, 24),
          new THREE.MeshStandardMaterial({
            color: '#8B5CF6',
            emissive: '#7C3AED',
            emissiveIntensity: 0.45,
            transparent: true,
            opacity: 0.75,
          })
        );
        whirlwindRing.rotation.x = Math.PI / 2;
        whirlwindRing.position.y = 0.7;
        whirlwindRing.visible = false;
        wrapper.add(whirlwindRing);

        // 3D Translucent Ice Cube encasement when hit by Frost Ice Bomb!
        const freezeBlock = new THREE.Mesh(
          new RoundedBoxGeometry(1.45, 1.85, 1.45, 3, 0.14),
          new THREE.MeshStandardMaterial({
            color: '#7DD3FC',
            emissive: '#0284C7',
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.56,
            roughness: 0.12,
            metalness: 0.15,
          })
        );
        freezeBlock.position.y = 0.92;
        freezeBlock.visible = false;
        wrapper.add(freezeBlock);

        let playerMarker: THREE.Mesh | null = null;
        if (r.isPlayer) {
          playerMarker = new THREE.Mesh(
            new THREE.ConeGeometry(0.24, 0.45, 4),
            new THREE.MeshStandardMaterial({
              color: '#F59E0B',
              emissive: '#F59E0B',
              emissiveIntensity: 0.4,
            })
          );
          playerMarker.rotation.x = Math.PI;
          playerMarker.position.y = 2.15;
          wrapper.add(playerMarker);
        }

        wrapper.position.set(r.x, r.y, r.z);
        scene.add(wrapper);
        racerVisuals.set(r.id, {
          container: wrapper,
          rig,
          shieldBubble,
          whirlwindRing,
          freezeBlock,
          playerMarker,
        });
      });
    };

    buildRacerVisualsForCurrentState();

    // ========================================================================
    // 5. UNLIMITED 360° MOUSE CAMERA (POINTER LOCK + DRAG) & MULTI-TOUCH LOOK
    // ========================================================================
    const onKeyDown = (e: KeyboardEvent) => {
      if (isLobbyOpenRef.current) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const code = e.code;
      keysDownRef.current.add(code);

      if (code === 'Space') {
        e.preventDefault();
        pendingActionsRef.current.jump = true;
      } else if (code === 'KeyQ') {
        e.preventDefault();
        pendingActionsRef.current.q = true;
      } else if (code === 'KeyE') {
        e.preventDefault();
        pendingActionsRef.current.e = true;
      } else if (code === 'KeyF') {
        e.preventDefault();
        pendingActionsRef.current.f = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    const domElem = renderer.domElement;
    // Track active drag pointers by pointerId for glitch-free multi-touch + mouse drag
    const activeDragPointers = new Map<number, { lastX: number; lastY: number }>();

    const onPointerDown = (e: PointerEvent) => {
      if (isLobbyOpenRef.current) return;
      activeDragPointers.set(e.pointerId, {
        lastX: e.clientX,
        lastY: e.clientY,
      });

      // Request Pointer Lock on desktop mouse click so the mouse can rotate 360°
      // infinitely without ever hitting the edge of the screen or snapping back!
      if (
        e.pointerType === 'mouse' &&
        document.pointerLockElement !== domElem &&
        simStateRef.current.phase !== 'finished'
      ) {
        try {
          domElem.requestPointerLock?.();
        } catch {
          // Fallback to drag-to-turn if iframe blocks pointer lock
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isLobbyOpenRef.current) return;

      // Mode 1: Pointer Lock is active -> Unlimited 360° hardware mouse deltas (80% speed, ease-in-out damped)
      if (document.pointerLockElement === domElem) {
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        targetCameraYawRef.current -= dx * 0.00256;
        targetCameraPitchRef.current = Math.max(
          0.16,
          Math.min(0.85, targetCameraPitchRef.current + dy * 0.00208)
        );
        return;
      }

      // Mode 2: Active Mouse Drag or Mobile Touch-Swipe on Canvas (80% speed, ease-in-out damped)
      // (Moving an unlocked mouse without holding the button NEVER rotates the camera back!)
      const tracked = activeDragPointers.get(e.pointerId);
      if (!tracked) return;

      const dx = e.clientX - tracked.lastX;
      const dy = e.clientY - tracked.lastY;
      tracked.lastX = e.clientX;
      tracked.lastY = e.clientY;

      const sensitivity = e.pointerType === 'touch' ? 0.0052 : 0.00416;
      targetCameraYawRef.current -= dx * sensitivity;
      targetCameraPitchRef.current = Math.max(
        0.16,
        Math.min(0.85, targetCameraPitchRef.current + dy * 0.0032)
      );
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      activeDragPointers.delete(e.pointerId);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);

    // ========================================================================
    // 6. MAIN GAME & RENDER LOOP
    // ========================================================================
    let animFrameId = 0;
    let lastTime = performance.now();
    let lastHudEmitTime = 0;
    let knownPlayerId = simStateRef.current.racers[0]?.id;
    let knownLoadoutKey = playerLoadoutKeyRef.current;

    const camPos = new THREE.Vector3(0, 6, 12);
    const camLook = new THREE.Vector3(0, 1.2, 0);
    const desiredCamPosVec = new THREE.Vector3();
    const desiredCamLookVec = new THREE.Vector3();

    // 2nd-order critically-damped spring filter (SmoothDamp) for natural ease-in & ease-out camera rotation
    const smoothDampScalar = (
      current: number,
      target: number,
      velRef: { current: number },
      smoothTime: number,
      dt: number
    ): number => {
      const tau = Math.max(0.0001, smoothTime);
      const omega = 2.0 / tau;
      const x = omega * dt;
      const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = current - target;
      const temp = (velRef.current + omega * change) * dt;
      velRef.current = (velRef.current - omega * temp) * exp;
      return target + (change + temp) * exp;
    };

    const animate = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const state = simStateRef.current;
      if (
        state.racers[0]?.id !== knownPlayerId ||
        playerLoadoutKeyRef.current !== knownLoadoutKey
      ) {
        knownPlayerId = state.racers[0]?.id;
        knownLoadoutKey = playerLoadoutKeyRef.current;
        buildRacerVisualsForCurrentState();
      }

      const playerRacer = state.racers.find((r) => r.isPlayer);
      if (
        playerRacer?.finished &&
        reportedFinishSessionRef.current === 0 &&
        !isLobbyOpenRef.current
      ) {
        reportedFinishSessionRef.current = 1;
        onPlayerFinishRaceRef.current?.(playerRacer.rank);
      }

      // Release pointer lock automatically when race finishes so user can click Podium buttons
      if (
        state.phase === 'finished' &&
        document.pointerLockElement === domElem
      ) {
        try {
          document.exitPointerLock?.();
        } catch {
          // ignore
        }
      }

      const keys = keysDownRef.current;
      const kbForward =
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const kbRight =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);

      const joyX = joystickInputRef?.current.x ?? 0;
      const joyY = joystickInputRef?.current.y ?? 0;
      const joyMag = Math.hypot(joyX, joyY);

      // When steering with the virtual joystick, tilting left/right smoothly curves forward along the track
      // instead of snapping 90 degrees perpendicular into the side fence.
      let effectiveJoyForward = joyY;
      let effectiveJoyRight = joyX;
      if (joyMag > 0.05 && kbForward === 0 && kbRight === 0) {
        if (joyY >= -0.22) {
          const forwardAssist = Math.max(joyY, Math.abs(joyX) * 0.72);
          effectiveJoyForward = forwardAssist * Math.min(1, Math.max(0.45, joyMag));
          effectiveJoyRight = joyX * 0.74;
        }
      }

      const moveForward = Math.max(-1, Math.min(1, kbForward + effectiveJoyForward));
      const moveRight = Math.max(-1, Math.min(1, kbRight + effectiveJoyRight));

      // Smoothly bank camera into turns when steering forward-left / forward-right
      const isActivelyAiming =
        document.pointerLockElement === domElem || activeDragPointers.size > 0;
      if (Math.abs(moveRight) > 0.05 && moveForward >= -0.1 && !isActivelyAiming) {
        targetCameraYawRef.current -= moveRight * dt * 0.92;
      }

      // Apply 2nd-order ease-in-out damping to camera yaw & pitch
      cameraYawRef.current = smoothDampScalar(
        cameraYawRef.current,
        targetCameraYawRef.current,
        cameraYawVelRef,
        0.095,
        dt
      );
      cameraPitchRef.current = smoothDampScalar(
        cameraPitchRef.current,
        targetCameraPitchRef.current,
        cameraPitchVelRef,
        0.095,
        dt
      );

      const input: PlayerControlInput = {
        moveForward,
        moveRight,
        cameraYaw: cameraYawRef.current,
        jumpRequested: pendingActionsRef.current.jump,
        skillQRequested: pendingActionsRef.current.q,
        itemERequested: pendingActionsRef.current.e,
        slapFRequested: pendingActionsRef.current.f,
      };
      pendingActionsRef.current.jump = false;
      pendingActionsRef.current.q = false;
      pendingActionsRef.current.e = false;
      pendingActionsRef.current.f = false;

      const rep = replayStateRef.current;

      if (!isLobbyOpenRef.current && !rep.isActive) {
        const wasAllFinished = state.allFinished;
        stepRaceSimulation(state, dt, input);
        if (
          (state.phase === 'racing' ||
            (state.phase === 'finished' && !wasAllFinished)) &&
          (state.elapsedRaceSec - lastRecordedReplaySecRef.current >= 0.062 ||
            state.allFinished !== wasAllFinished)
        ) {
          recordReplayKeyframe(state);
        }
      }

      const frames = replayFramesRef.current;
      const totalReplayDuration =
        frames.length > 0
          ? frames[frames.length - 1].timeSec
          : state.elapsedRaceSec;

      if (rep.isActive && frames.length > 0) {
        if (rep.isPlaying) {
          rep.currentTimeSec += dt * rep.speed;
          if (rep.currentTimeSec >= totalReplayDuration) {
            rep.currentTimeSec = totalReplayDuration;
            rep.isPlaying = false;
          }
        }
      }

      // Interpolate Replay Frame if Replay Mode is Active
      let activeRenderRacers: ReplayRacerPose[] = state.racers;
      let activeDroppedTraps: {
        x: number;
        y: number;
        z: number;
        radius: number;
      }[] = state.droppedTraps;
      let activePieProjectiles: {
        x: number;
        y: number;
        z: number;
        kind?: 'pie' | 'ice_bomb';
      }[] = state.pieProjectiles;
      let activeShockwaves: {
        x: number;
        y: number;
        z: number;
        maxRadius: number;
        age: number;
        maxAge: number;
        colorHex: string;
      }[] = state.shockwaves;
      let activeSceneTimeSec = state.elapsedRaceSec;
      let activeLeaderId: CharacterId =
        (state.racers.find((r) => r.rank === 1) ?? state.racers[0]).id;

      if (rep.isActive && frames.length > 0) {
        const t = rep.currentTimeSec;
        activeSceneTimeSec = t;
        // Binary search bracketing keyframes
        let low = 0;
        let high = frames.length - 1;
        while (low < high - 1) {
          const mid = (low + high) >> 1;
          if (frames[mid].timeSec <= t) {
            low = mid;
          } else {
            high = mid;
          }
        }
        const kf0 = frames[low];
        const kf1 = frames[high];
        const span = Math.max(0.0001, kf1.timeSec - kf0.timeSec);
        const alpha = Math.max(0, Math.min(1, (t - kf0.timeSec) / span));

        activeLeaderId = alpha < 0.5 ? kf0.leaderId : kf1.leaderId;
        activeDroppedTraps = kf0.droppedTraps;
        activePieProjectiles = kf0.pieProjectiles;
        activeShockwaves = kf0.shockwaves;

        activeRenderRacers = kf0.racers.map((r0, idx) => {
          const r1 = kf1.racers[idx] ?? r0;
          let yawDiff = r1.yaw - r0.yaw;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          return {
            ...r0,
            x: r0.x + (r1.x - r0.x) * alpha,
            y: r0.y + (r1.y - r0.y) * alpha,
            z: r0.z + (r1.z - r0.z) * alpha,
            groundY: r0.groundY + (r1.groundY - r0.groundY) * alpha,
            vx: r0.vx + (r1.vx - r0.vx) * alpha,
            vy: r0.vy + (r1.vy - r0.vy) * alpha,
            vz: r0.vz + (r1.vz - r0.vz) * alpha,
            knockVx: r0.knockVx + (r1.knockVx - r0.knockVx) * alpha,
            knockVz: r0.knockVz + (r1.knockVz - r0.knockVz) * alpha,
            yaw: r0.yaw + yawDiff * alpha,
            pose: alpha < 0.5 ? r0.pose : r1.pose,
            rank: alpha < 0.5 ? r0.rank : r1.rank,
            totalProgress:
              r0.totalProgress + (r1.totalProgress - r0.totalProgress) * alpha,
            furthestCheckpointDist:
              r0.furthestCheckpointDist +
              (r1.furthestCheckpointDist - r0.furthestCheckpointDist) * alpha,
            finished: alpha < 0.5 ? r0.finished : r1.finished,
            finishTimeSec: alpha < 0.5 ? r0.finishTimeSec : r1.finishTimeSec,
          };
        });
      }

      const elapsed = now / 1000;

      // Animate Windmill Sails & Floating Sky Props
      for (const blade of windmillBlades) {
        blade.rotation.z += dt * 1.2;
      }
      for (const fp of floatingProps) {
        fp.obj.position.y =
          fp.baseY + Math.sin(elapsed * 1.4 + fp.phase) * 0.65;
      }

      // Update Turntable Visual Rotations
      for (const tm of turntableMeshes) {
        tm.group.rotation.y = activeSceneTimeSec * tm.spec.angularSpeed;
      }

      // Update Rolling Boulders & Beach Balls
      for (const bm of boulderMeshes) {
        const b = bm.spec;
        const offset =
          Math.sin(activeSceneTimeSec * b.speed + b.phase) * b.sweepHalfWidth;
        bm.mesh.position.set(
          b.centerX + b.rightX * offset,
          b.centerY + b.radius,
          b.centerZ + b.rightZ * offset
        );
        bm.mesh.rotation.x += dt * b.speed * 2.2;
        bm.mesh.rotation.z += dt * b.speed * 1.8;
      }

      // Update Mystery Item Boxes
      for (const box of state.itemBoxes) {
        const mesh = itemBoxMeshes.get(box.id);
        if (mesh) {
          mesh.visible = rep.isActive ? true : box.respawnTimer <= 0;
          if (mesh.visible) {
            mesh.rotation.y = elapsed * 2.4 + box.x;
            mesh.rotation.x = Math.sin(elapsed * 3.0 + box.z) * 0.25;
            mesh.position.y =
              box.y + 0.95 + Math.sin(elapsed * 4.0 + box.x) * 0.16;
          }
        }
      }

      // Rebuild transient Traps, Pies & Shockwaves
      while (dynamicEffectsGroup.children.length > 0) {
        dynamicEffectsGroup.remove(dynamicEffectsGroup.children[0]);
      }
      for (const trap of activeDroppedTraps) {
        const tMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(trap.radius, trap.radius, 0.14, 18),
          new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.2 })
        );
        tMesh.position.set(trap.x, trap.y + 0.06, trap.z);
        dynamicEffectsGroup.add(tMesh);
      }
      for (const pie of activePieProjectiles) {
        if (pie.kind === 'ice_bomb') {
          const iceMesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.55, 1),
            new THREE.MeshStandardMaterial({
              color: '#38BDF8',
              emissive: '#0284C7',
              emissiveIntensity: 0.45,
              roughness: 0.15,
              metalness: 0.2,
            })
          );
          iceMesh.position.set(pie.x, pie.y, pie.z);
          iceMesh.rotation.set(elapsed * 5.0, elapsed * 6.5, 0);
          dynamicEffectsGroup.add(iceMesh);
        } else {
          const pMesh = new THREE.Mesh(
            new RoundedBoxGeometry(0.75, 0.35, 0.75, 3, 0.12),
            new THREE.MeshStandardMaterial({ color: '#F472B6', roughness: 0.4 })
          );
          pMesh.position.set(pie.x, pie.y, pie.z);
          pMesh.rotation.y = elapsed * 6.0;
          dynamicEffectsGroup.add(pMesh);
        }
      }
      for (const sw of activeShockwaves) {
        const progress = sw.age / sw.maxAge;
        const radius = 0.6 + (sw.maxRadius - 0.6) * progress;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius * 0.82, radius, 28),
          new THREE.MeshBasicMaterial({
            color: sw.colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1 - progress,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(sw.x, sw.y + 0.12, sw.z);
        dynamicEffectsGroup.add(ring);
      }

      // Update all 8 Racer Rigs, Procedural Chibi Kinematics & Cute Footstep Dust/Splash Puffs!
      const playerRef = activeRenderRacers[0];
      let cameraFocusRacer: ReplayRacerPose = playerRef;
      if (rep.isActive) {
        if (rep.target === 'leader') {
          cameraFocusRacer =
            activeRenderRacers.find((r) => r.id === activeLeaderId) ||
            activeRenderRacers.find((r) => r.rank === 1) ||
            playerRef;
        } else {
          cameraFocusRacer =
            activeRenderRacers.find((r) => r.id === rep.target) || playerRef;
        }
      } else if (state.phase === 'finished' && spectatedRacerIdRef.current) {
        cameraFocusRacer =
          activeRenderRacers.find(
            (r) => r.id === spectatedRacerIdRef.current
          ) || playerRef;
      }

      for (let i = 0; i < activeRenderRacers.length; i++) {
        const r = activeRenderRacers[i];
        const vis = racerVisuals.get(r.id);
        if (!vis) continue;

        let stepInfo = racerStepState.get(r.id);
        if (!stepInfo) {
          stepInfo = {
            timer: 0,
            footSide: 1,
            wasAirborne: false,
            animTime: i * 0.43,
            smoothGroundY: r.groundY,
            smoothPitch: 0,
            smoothRoll: 0,
            prevYaw: r.yaw,
            squashY: 0,
          };
          racerStepState.set(r.id, stepInfo);
        }

        // Smooth vertical ground tracking (prevents 1-frame step jitter on slope segment boundaries)
        if (Math.abs(r.groundY - stepInfo.smoothGroundY) > 2.5) {
          stepInfo.smoothGroundY = r.groundY;
        } else {
          stepInfo.smoothGroundY +=
            (r.groundY - stepInfo.smoothGroundY) * Math.min(1, dt * 24.0);
        }

        // Compute natural 3D Knockback Tumble Tilt & Cornering Bank Lean
        const sinY = Math.sin(r.yaw);
        const cosY = Math.cos(r.yaw);
        const fwdX = -sinY;
        const fwdZ = -cosY;
        const rightX = cosY;
        const rightZ = -sinY;

        const knockFwd = r.knockVx * fwdX + r.knockVz * fwdZ;
        const knockRight = r.knockVx * rightX + r.knockVz * rightZ;

        let yawDiff = r.yaw - stepInfo.prevYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        stepInfo.prevYaw = r.yaw;
        const yawRate = Math.max(-6, Math.min(6, yawDiff / Math.max(0.005, dt)));

        const stunWobble =
          r.stunTimer > 0 ? Math.sin(elapsed * 22.0 + i) * 0.24 : 0;
        const targetPitch = Math.max(
          -0.55,
          Math.min(0.55, -knockFwd * 0.038 + (r.vy > 1.5 ? -0.1 : 0))
        );
        const targetRoll = Math.max(
          -0.62,
          Math.min(0.62, -knockRight * 0.042 + yawRate * 0.032 + stunWobble)
        );

        const tiltAlpha = 1 - Math.exp(-14.0 * dt);
        stepInfo.smoothPitch += (targetPitch - stepInfo.smoothPitch) * tiltAlpha;
        stepInfo.smoothRoll += (targetRoll - stepInfo.smoothRoll) * tiltAlpha;

        vis.container.position.set(r.x, stepInfo.smoothGroundY, r.z);
        vis.container.rotation.order = 'YXZ';
        vis.container.rotation.y = r.yaw;
        vis.container.rotation.x = stepInfo.smoothPitch;
        vis.container.rotation.z = stepInfo.smoothRoll;

        if (r.respawnBlinkTimer > 0) {
          vis.container.visible = Math.floor(r.respawnBlinkTimer * 14) % 2 === 0;
        } else {
          vis.container.visible = true;
        }

        const speedMag = Math.hypot(r.vx, r.vz);
        const animSpeed =
          r.pose === 'run'
            ? Math.max(0.85, Math.min(1.55, speedMag / 9.8))
            : 1.0;

        const effectiveAnimDt = rep.isActive
          ? rep.isPlaying
            ? dt * rep.speed
            : 0
          : dt;
        // Accumulate continuous animation phase per racer so changing speed never causes phase-jump shaking!
        stepInfo.animTime += effectiveAnimDt * animSpeed;

        const frame = computeCharacterKinematics(
          r.pose,
          stepInfo.animTime,
          1.0,
          1.0,
          r.pokeImpulse
        );

        if (r.slapAnimTimer > 0) {
          const swing = Math.sin((r.slapAnimTimer / 0.35) * Math.PI) * 1.15;
          frame.leftArmRotZ -= swing;
          frame.rightArmRotZ += swing;
        }

        const airOffset = Math.max(0, r.y - r.groundY);
        const isAirborneNow = airOffset > 0.14;
        if (stepInfo.wasAirborne && !isAirborneNow) {
          stepInfo.squashY = -0.16; // Cute squash on landing/bounce
        } else if (!stepInfo.wasAirborne && isAirborneNow && r.vy > 4.0) {
          stepInfo.squashY = 0.12; // Stretch on launch
        }
        stepInfo.squashY *= Math.exp(-12.0 * dt);

        const baseScale = 0.75;
        vis.rig.rootGroup.scale.set(
          baseScale * (1 - stepInfo.squashY * 0.55),
          baseScale * (1 + stepInfo.squashY),
          baseScale * (1 - stepInfo.squashY * 0.55)
        );

        frame.rootY += airOffset / 0.75;
        applyKinematicsToRig(vis.rig, frame);
        animateEquipmentOnRig(
          vis.rig,
          stepInfo.animTime,
          r.slapAnimTimer > 0 ? r.slapAnimTimer / 0.35 : 0
        );

        // Spawn cute footstep dust/smoke puffs (or water splash puffs in shallow water) behind feet!
        const isNearCamera =
          r.id === cameraFocusRacer?.id ||
          !cameraFocusRacer ||
          Math.hypot(r.x - cameraFocusRacer.x, r.z - cameraFocusRacer.z) < 42;

        if (
          isNearCamera &&
          !isLobbyOpenRef.current &&
          (!rep.isActive || rep.isPlaying)
        ) {
          const rSample = sampleTrackAtDistance(r.furthestCheckpointDist);
          const inWater = rSample.isShallowWater;

          // Burst of 3 cute puffs upon landing from a hop/jump
          if (stepInfo.wasAirborne && !isAirborneNow) {
            for (let k = -1; k <= 1; k += 2) {
              const sideX = Math.cos(r.yaw) * 0.28 * k;
              const sideZ = -Math.sin(r.yaw) * 0.28 * k;
              spawnFootstepPuff(
                r.x + sideX,
                stepInfo.smoothGroundY + 0.14,
                r.z + sideZ,
                sideX * 1.8,
                1.05,
                sideZ * 1.8,
                1.35,
                inWater
              );
            }
          }

          // Rhythmic alternating left/right footstep puffs behind the heels while running
          if (!isAirborneNow && speedMag > 1.6) {
            stepInfo.timer -= effectiveAnimDt;
            const interval = r.id === cameraFocusRacer?.id ? 0.075 : 0.13;
            if (stepInfo.timer <= 0) {
              stepInfo.timer = interval;
              stepInfo.footSide *= -1;
              const backX = Math.sin(r.yaw);
              const backZ = Math.cos(r.yaw);
              const rightX = Math.cos(r.yaw);
              const rightZ = -Math.sin(r.yaw);
              const footLat = 0.22 * stepInfo.footSide;
              const px = r.x + backX * 0.42 + rightX * footLat;
              const pz = r.z + backZ * 0.42 + rightZ * footLat;
              spawnFootstepPuff(
                px,
                stepInfo.smoothGroundY + 0.12,
                pz,
                backX * 0.9 + (Math.random() - 0.5) * 0.5,
                0.75 + Math.random() * 0.35,
                backZ * 0.9 + (Math.random() - 0.5) * 0.5,
                r.id === cameraFocusRacer?.id ? 1.15 : 0.95,
                inWater
              );
            }
          }
        }
        stepInfo.wasAirborne = isAirborneNow;

        vis.shieldBubble.visible = r.shieldTimer > 0;
        if (vis.shieldBubble.visible) {
          vis.shieldBubble.position.y = airOffset + 0.85;
          vis.shieldBubble.scale.setScalar(
            1 + Math.sin(elapsed * 10) * 0.05
          );
        }

        vis.whirlwindRing.visible = r.whirlwindTimer > 0;
        if (vis.whirlwindRing.visible) {
          vis.whirlwindRing.position.y = airOffset + 0.72;
          vis.whirlwindRing.rotation.z = elapsed * 14;
        }

        vis.freezeBlock.visible = (r.freezeTimer ?? 0) > 0;
        if (vis.freezeBlock.visible) {
          vis.freezeBlock.position.y = airOffset + 0.92;
        }

        if (vis.playerMarker) {
          vis.playerMarker.position.y =
            airOffset + 2.15 + Math.sin(elapsed * 6.0) * 0.12;
          vis.playerMarker.rotation.y = elapsed * 2.5;
        }
      }

      // Animate & billow all active footstep smoke/splash puffs
      for (let pIdx = activeFootstepPuffs.length - 1; pIdx >= 0; pIdx--) {
        const puff = activeFootstepPuffs[pIdx];
        puff.age += dt;
        if (puff.age >= puff.maxAge) {
          footstepPuffsGroup.remove(puff.mesh);
          activeFootstepPuffs.splice(pIdx, 1);
          continue;
        }
        const t = puff.age / puff.maxAge;
        puff.mesh.position.x += puff.vx * dt;
        puff.mesh.position.y += puff.vy * dt;
        puff.mesh.position.z += puff.vz * dt;
        puff.mesh.rotation.x += dt * 2.2;
        puff.mesh.rotation.y += dt * 2.6;
        // Billow up rapidly then shrink smoothly to zero
        const scaleCurve =
          t < 0.35
            ? (t / 0.35) * puff.peakScale
            : (1 - (t - 0.35) / 0.65) * puff.peakScale;
        puff.mesh.scale.setScalar(Math.max(0.01, scaleCurve));
      }

      // 3rd-Person Chase Camera vs High & Wide Broadcast Replay/Spectator Camera
      const player = state.racers[0];
      const camTarget = cameraFocusRacer || player;
      const isWideBroadcastCam =
        rep.isActive ||
        (state.phase === 'finished' && spectatedRacerIdRef.current !== null);

      // Smoothly transition FOV between standard gameplay (50°) and Wide Broadcast Replay (68°)
      const desiredFov = isWideBroadcastCam ? 68 : 50;
      if (Math.abs(camera.fov - desiredFov) > 0.05) {
        camera.fov += (desiredFov - camera.fov) * Math.min(1, dt * 7.5);
        camera.updateProjectionMatrix();
      }

      if (camTarget) {
        // In Replay or Spectator Mode, gently auto-align camera behind target racer's heading if not manually dragging
        if (
          (rep.isActive ||
            (state.phase === 'finished' && camTarget.id !== player.id)) &&
          activeDragPointers.size === 0 &&
          document.pointerLockElement !== domElem
        ) {
          let yawDiff = camTarget.yaw - targetCameraYawRef.current;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          targetCameraYawRef.current += yawDiff * Math.min(1, dt * 4.2);
        }

        // High & Wide Aerial Broadcast Camera during Replay vs Standard Gameplay Chase Camera
        const camDist = isWideBroadcastCam ? 15.2 : 8.4;
        const camHeight = isWideBroadcastCam
          ? 9.4 + cameraPitchRef.current * 5.8
          : 3.8 + cameraPitchRef.current * 4.4;
        const desiredCamX =
          camTarget.x + Math.sin(cameraYawRef.current) * camDist;
        const desiredCamZ =
          camTarget.z + Math.cos(cameraYawRef.current) * camDist;
        const desiredCamY = camTarget.y + camHeight;

        const posAlpha = 1 - Math.exp(-9.0 * dt);
        desiredCamPosVec.set(desiredCamX, desiredCamY, desiredCamZ);
        camPos.lerp(desiredCamPosVec, posAlpha);

        const lookAheadDist = isWideBroadcastCam ? 5.2 : 3.0;
        const lookHeightOffset = isWideBroadcastCam ? 0.85 : 1.25;
        const lookAheadX =
          camTarget.x - Math.sin(cameraYawRef.current) * lookAheadDist;
        const lookAheadZ =
          camTarget.z - Math.cos(cameraYawRef.current) * lookAheadDist;
        const lookAlpha = 1 - Math.exp(-11.0 * dt);
        desiredCamLookVec.set(
          lookAheadX,
          camTarget.y + lookHeightOffset,
          lookAheadZ
        );
        camLook.lerp(desiredCamLookVec, lookAlpha);

        camera.position.copy(camPos);
        camera.lookAt(camLook);

        // Keep directional shadow frustum centered around camera target racer
        dirLight.position.set(
          camTarget.x + 35,
          camTarget.y + 65,
          camTarget.z + 35
        );
        dirLight.target.position.set(camTarget.x, camTarget.y, camTarget.z);
        dirLight.target.updateMatrixWorld();

        // Animate 3D Falling Snowflakes around the active camera target on the Snow & Ice circuit!
        if (isSnow && snowflakeMeshes.length > 0) {
          for (const sf of snowflakeMeshes) {
            const fallY =
              16 - ((elapsed * sf.fallSpeed + sf.heightOffset) % 17.5);
            const swayX = Math.sin(elapsed * 1.8 + sf.swayPhase) * 1.2;
            const swayZ = Math.cos(elapsed * 1.5 + sf.swayPhase) * 1.2;
            sf.mesh.position.set(
              camTarget.x + sf.offsetX + swayX,
              camTarget.y + fallY,
              camTarget.z + sf.offsetZ + swayZ
            );
            sf.mesh.rotation.x += dt * 1.5;
            sf.mesh.rotation.y += dt * 1.8;
          }
        }
      }

      renderer.render(scene, camera);

      // Emit HUD snapshot (~15 Hz)
      if (now - lastHudEmitTime > 65 && player) {
        lastHudEmitTime = now;
        const sortedStandings = [...state.racers]
          .sort((a, b) => a.rank - b.rank)
          .map((r) => {
            const repPose = rep.isActive
              ? activeRenderRacers.find((rr) => rr.id === r.id)
              : null;
            return {
              id: r.id,
              name: r.spec.name,
              shortName: r.spec.shortName,
              primaryHex: r.spec.primaryHex,
              isPlayer: r.isPlayer,
              rank: repPose ? repPose.rank : r.rank,
              finished: r.finished,
              finishTimeSec: r.finishTimeSec,
              progressPercent: Math.min(
                100,
                Math.round(
                  ((repPose ? repPose.totalProgress : r.totalProgress) /
                    TOTAL_TRACK_LENGTH) *
                    100
                )
              ),
              x: repPose ? repPose.x : r.x,
              z: repPose ? repPose.z : r.z,
              yaw: repPose ? repPose.yaw : r.yaw,
            };
          })
          .sort((a, b) => a.rank - b.rank);

        const focusSpecSample = sampleTrackAtDistance(
          cameraFocusRacer.furthestCheckpointDist
        );

        onHudUpdateRef.current({
          phase: state.phase,
          allFinished: state.allFinished,
          countdownSec: state.countdownSec,
          elapsedRaceSec: state.elapsedRaceSec,
          playerRank: player.rank,
          progressPercent: Math.min(
            100,
            Math.round((player.totalProgress / TOTAL_TRACK_LENGTH) * 100)
          ),
          zoneName: focusSpecSample.zoneName,
          elevationMeters: Math.round(cameraFocusRacer.y * 2),
          qCooldown: player.qCooldown,
          fCooldown: player.fCooldown,
          heldItem: player.heldItem,
          dashActive: player.dashTimer > 0,
          shieldActive: player.shieldTimer > 0,
          whirlwindActive: player.whirlwindTimer > 0,
          slowActive: player.slowTimer > 0,
          slapsLanded: player.slapsLanded,
          standings: sortedStandings,
          events: [...state.events],
          bannerCallout: state.bannerCallout ? { ...state.bannerCallout } : null,
          replay: {
            isActive: rep.isActive,
            isPlaying: rep.isPlaying,
            currentTimeSec: rep.currentTimeSec,
            durationSec: Math.max(0.1, totalReplayDuration),
            speed: rep.speed,
            target: rep.target,
            activeFocusRacerId: cameraFocusRacer.id,
            activeLeaderId,
            hasReplayData: frames.length > 1,
          },
        });
      }

      afterDraw();
    };

    let stopped = false;
    let pacingTimer: ReturnType<typeof setTimeout> | null = null;
    const afterDraw = () => {
      if (stopped) return;
      if (isSoftwareGl) {
        gl.finish();
        pacingTimer = setTimeout(() => {
          if (!stopped) animFrameId = requestAnimationFrame(animate);
        }, 350);
      } else {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    // Remove the self-scheduling requestAnimationFrame at the top of animate by using afterDraw
    animFrameId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrameId);
      if (pacingTimer) clearTimeout(pacingTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, [trackId]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full touch-none cursor-grab active:cursor-grabbing"
      aria-label="3D Party Obstacle Race Viewport"
    />
  );
};
