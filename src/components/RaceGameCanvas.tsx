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
import {
  activateRacerItemE,
  activateRacerSkillQ,
  activateRacerSlapF,
  BOOST_PADS,
  createInitialRaceState,
  PlayerControlInput,
  RaceSimulationState,
  RIVER_STEPPING_STONES,
  ROLLING_BOULDERS,
  sampleTrackAtDistance,
  SLIME_PADS,
  stepRaceSimulation,
  TOTAL_TRACK_LENGTH,
  TRACK_SEGMENTS,
  TURNTABLES,
} from '../game/raceEngine';

export interface RaceHudSnapshot {
  phase: RaceSimulationState['phase'];
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
}

export interface RaceGameCanvasProps {
  playerCharacterId: CharacterId;
  playerActiveSkillId: ActiveSkillId;
  playerPassiveSkillId: PassiveSkillId;
  raceSessionKey: number;
  isLobbyOpen: boolean;
  externalActionTrigger: {
    type: 'q' | 'e' | 'f' | 'jump' | null;
    seq: number;
  };
  joystickInputRef?: React.MutableRefObject<{ x: number; y: number }>;
  spectatedRacerId?: CharacterId | null;
  onHudUpdate: (snapshot: RaceHudSnapshot) => void;
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

/**
 * Builds the Forest Track Ribbon featuring:
 * - Dirt trails, Cobblestone roads, and Stone Brick Block paths
 * - Individual Wooden Planks laid in a row for all bridges ("กระดานไม้เรียงต่อกันเป็นสะพาน")
 * - Unavoidable Shallow Water Fords ("ช่วงที่มีแอ่งน้ำตื้นที่ต้องลงน้ำโดยไม่มีทางหลีกเลี่ยง")
 * - Deep Water Stepping-Stone River Crossing ("จุดที่เป็นน้ำลึกที่ตกแล้วตาย แต่จะมีก้อนหินโผล่ขึ้นมาให้กระโดดได้")
 * - Wooden Post-and-Rail Fences ("รั้วไม้") or Continuous Long Bush Hedges ("พุ่มหญ้ายาวเป็นแนว")
 */
function buildContinuousTrackRibbon(): THREE.Group {
  const ribbonGroup = new THREE.Group();
  const n = TRACK_SEGMENTS.length;

  // 1. Main Road Bed Ribbon (Dirt, Cobblestone, Stone Brick, Shallow Stream Bed)
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const colorDirt = new THREE.Color('#B88B5E'); // Rich packed woodland dirt
  const colorCobble = new THREE.Color('#9E9A90'); // Weathered forest cobblestone
  const colorBrick = new THREE.Color('#B57C5E'); // Warm ancient stone brick blocks
  const colorPlankSub = new THREE.Color('#6E472B'); // Dark timber beam under planks
  const colorShallowBed = new THREE.Color('#7AB8C8'); // Sandy wet shallow stream bed
  const colorDeepBed = new THREE.Color('#075985'); // Submerged deep river bed

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

    // Lower road deck slightly on plank bridges (so 3D planks sit on top),
    // dip slightly in shallow water fords, and submerge deeply in the deep water hazard!
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

  const roadTex = createForestRoadTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.03,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  roadMesh.castShadow = true;
  ribbonGroup.add(roadMesh);

  // 2. Materials & Shared Geometries for Planks, Cobbles/Bricks, Fences, Bush Hedges & Shallow Water
  const plankMats = [
    new THREE.MeshStandardMaterial({ color: '#B87B4B', roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ color: '#A36638', roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: '#C88B57', roughness: 0.8 }),
  ];
  const fenceWoodMat = new THREE.MeshStandardMaterial({
    color: '#8C5834',
    roughness: 0.86,
  });
  const fencePostMat = new THREE.MeshStandardMaterial({
    color: '#6E4224',
    roughness: 0.88,
  });
  const hedgeDarkMat = new THREE.MeshStandardMaterial({
    color: '#4B773E',
    roughness: 0.82,
  });
  const hedgeLightMat = new THREE.MeshStandardMaterial({
    color: '#679850',
    roughness: 0.8,
  });
  const flowerYellowMat = new THREE.MeshStandardMaterial({
    color: '#FDE047',
    roughness: 0.65,
  });
  const cobbleTileMat = new THREE.MeshStandardMaterial({
    color: '#8D8980',
    roughness: 0.88,
  });
  const brickTileMat = new THREE.MeshStandardMaterial({
    color: '#9E6247',
    roughness: 0.84,
  });
  const dirtPebbleMat = new THREE.MeshStandardMaterial({
    color: '#9C7248',
    roughness: 0.9,
  });
  const shallowWaterMat = new THREE.MeshStandardMaterial({
    color: '#38BDF8',
    transparent: true,
    opacity: 0.72,
    roughness: 0.12,
    metalness: 0.08,
  });
  const waterFoamMat = new THREE.MeshStandardMaterial({
    color: '#E0F2FE',
    transparent: true,
    opacity: 0.82,
    roughness: 0.3,
  });
  const slopeChevronMat = new THREE.MeshStandardMaterial({
    color: '#F59E0B',
    emissive: '#D97706',
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });

  const sharedFencePostGeo = new RoundedBoxGeometry(0.32, 1.15, 0.32, 2, 0.06);
  const sharedFenceRailGeo = new RoundedBoxGeometry(0.14, 0.16, 6.8, 1, 0.03);
  const sharedHedgeBlockGeo = new RoundedBoxGeometry(1.25, 0.95, 4.2, 2, 0.32);
  const sharedHedgePuffGeo = new RoundedBoxGeometry(0.95, 0.75, 0.95, 2, 0.28);
  const sharedFlowerGeo = new THREE.BoxGeometry(0.26, 0.22, 0.26);
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

    // A. WOODEN PLANK BRIDGES ("ช่วงที่เป็นสะพานทำเป็นกระดานไม้เรียงต่อกันเป็นสะพาน")
    if (seg.isPlankBridge || seg.isHighBridge) {
      const plankCount = Math.max(3, Math.floor(seg.length / 1.25));
      const plankDepth = (seg.length / plankCount) * 0.82; // visible gap between planks!
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
      // B. 3D EMBOSSED COBBLESTONES, BRICK BLOCKS & DIRT STONES ON ROAD SURFACE
      const tileMat =
        seg.surfaceType === 'brick'
          ? brickTileMat
          : seg.surfaceType === 'cobble'
            ? cobbleTileMat
            : dirtPebbleMat;
      const numPavers = seg.surfaceType === 'dirt' ? 1 : 2;
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
        paver.rotation.y = segYaw + (seg.surfaceType === 'dirt' ? frac * 0.5 : 0);
        paver.rotation.x = pitchX;
        paver.receiveShadow = true;
        ribbonGroup.add(paver);
      }
    }

    // C. UNAVOIDABLE SHALLOW WATER STREAM FORD ("ช่วงที่มีแอ่งน้ำตื้นที่ต้องลงน้ำโดยไม่มีทางหลีกเลี่ยง")
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

    // D. TRACK BORDERS: WOODEN FENCES ("รั้วไม้") OR LONG BUSH HEDGES ("พุ่มหญ้ายาวเป็นแนว")
    if (!seg.isDeepWaterHazard) {
      if (seg.borderType === 'wood_fence' || seg.isPlankBridge || seg.isHighBridge) {
        // Rustic Wooden Post-and-Rail Fence along both edges
        for (const side of [-1, 1]) {
          const lat = (seg.width * 0.5 + 0.22) * side;
          // Fence Post at start of segment
          const post = new THREE.Mesh(sharedFencePostGeo, fencePostMat);
          post.position.set(
            seg.x0 + seg.rightX * lat,
            seg.y0 + 0.48,
            seg.z0 + seg.rightZ * lat
          );
          post.castShadow = true;
          ribbonGroup.add(post);

          // Upper & Lower Horizontal Wooden Rails
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
        // Continuous Long Lush Bush & Grass Hedge ("พุ่มหญ้ายาวเป็นแนวโดยไม่มีรั้ว")
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

          // Extra leafy top tuft + wildflower dot on the hedge
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
              midY + 0.85,
              midZ + seg.rightZ * (lat - 0.35 * side)
            );
            ribbonGroup.add(flw);
          }
        }
      }
    }

    // E. Elevated Timber Trestle Pillars underneath high bridges
    if (midY > 1.8 && i % 5 === 0) {
      const pillarH = midY + 1.2;
      const pGeo = new THREE.BoxGeometry(1.1, pillarH, 1.1);
      for (const side of [-1, 1]) {
        const lat = (seg.width * 0.5 - 0.7) * side;
        const pillar = new THREE.Mesh(pGeo, fencePostMat);
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
 * Procedurally builds DENSE Woodland Forest scenery around the entire circuit:
 * - Multi-layered Oak, Pine, Birch & Mossy Trees
 * - Dense Roadside Bushes / Shrubs ("พุ่มไม้")
 * - Hundreds of 3D Grass Blade Tufts ("ใบหญ้า")
 * - Mossy Boulders, River Rocks & Fallen Hollow Logs ("ก้อนหิน")
 */
function buildEnvironmentalScenery(): {
  sceneryGroup: THREE.Group;
  windmillBlades: THREE.Object3D[];
  floatingProps: { obj: THREE.Object3D; baseY: number; phase: number }[];
} {
  const sceneryGroup = new THREE.Group();
  const windmillBlades: THREE.Object3D[] = [];
  const floatingProps: { obj: THREE.Object3D; baseY: number; phase: number }[] =
    [];

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

      // 1. ROADSIDE GRASS TUFTS ("ใบหญ้า") & BUSHES ("พุ่มไม้") & ROCKS ("ก้อนหิน")
      if (!seg.isHighBridge && !seg.isDeepWaterHazard) {
        // Grass tuft right outside the path border on every segment
        const grassLat = (seg.width * 0.5 + 1.45 + randA * 1.8) * side;
        const grassTuft = createGrassTuft(0.9 + randB * 0.5);
        grassTuft.position.set(
          seg.x0 + seg.rightX * grassLat,
          baseGroundY,
          seg.z0 + seg.rightZ * grassLat
        );
        sceneryGroup.add(grassTuft);

        // Dense roadside bush every 2 segments
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

        // Mossy Rocks & Boulders along the trail every 2 segments
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

      // 2. INNER FOREST CANOPY TREES (Close to track on every segment!)
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

      // 3. OUTER DEEP WOODLAND TREE WALL (Second dense row of forest trees!)
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
  playerCharacterId,
  playerActiveSkillId,
  playerPassiveSkillId,
  raceSessionKey,
  isLobbyOpen,
  externalActionTrigger,
  joystickInputRef,
  spectatedRacerId,
  onHudUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
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

  const keysDownRef = useRef<Set<string>>(new Set());
  const cameraYawRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0.42);
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
        cameraYawRef.current = target.yaw;
      }
    }
  }, [spectatedRacerId]);

  useEffect(() => {
    onHudUpdateRef.current = onHudUpdate;
  }, [onHudUpdate]);

  useEffect(() => {
    if (!externalActionTrigger.type) return;
    if (externalActionTrigger.type === 'q') pendingActionsRef.current.q = true;
    if (externalActionTrigger.type === 'e') pendingActionsRef.current.e = true;
    if (externalActionTrigger.type === 'f') pendingActionsRef.current.f = true;
    if (externalActionTrigger.type === 'jump')
      pendingActionsRef.current.jump = true;
  }, [externalActionTrigger]);

  // Reset race state when character, skills, or session key changes
  useEffect(() => {
    const fresh = createInitialRaceState(
      playerCharacterId,
      playerActiveSkillId,
      playerPassiveSkillId
    );
    const startSeg = TRACK_SEGMENTS[0];
    cameraYawRef.current = Math.atan2(-startSeg.dirX, -startSeg.dirZ);
    simStateRef.current = fresh;
  }, [
    playerCharacterId,
    playerActiveSkillId,
    playerPassiveSkillId,
    raceSessionKey,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#D5E6CE');
    scene.fog = new THREE.FogExp2('#D5E6CE', 0.0026);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.2, 420);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.55;

    // Warm Woodland Sunlight & Canopy Fill Lighting
    const hemiLight = new THREE.HemisphereLight('#FFFDF9', '#6B8E4E', 0.92);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#FFF6E6', 1.55);
    dirLight.position.set(45, 75, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 260;
    const d = 85;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Rich Woodland Forest Moss & Grass Floor
    const meadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1400, 1400),
      new THREE.MeshStandardMaterial({
        color: '#6A8E4E',
        roughness: 0.95,
      })
    );
    meadowPlane.rotation.x = -Math.PI / 2;
    meadowPlane.position.y = -0.35;
    meadowPlane.receiveShadow = true;
    scene.add(meadowPlane);

    // ========================================================================
    // 1. CONTINUOUS 3D SPLINE TRACK & PLANK BRIDGES / SHALLOW FORDS / SLOPES
    // ========================================================================
    const trackGroup = buildContinuousTrackRibbon();
    scene.add(trackGroup);

    // ========================================================================
    // 2. DENSE FOREST SCENERY (TREES, BUSHES, GRASS TUFTS, ROCKS, MUSHROOMS)
    // ========================================================================
    const { sceneryGroup, windmillBlades, floatingProps } =
      buildEnvironmentalScenery();
    scene.add(sceneryGroup);

    // ========================================================================
    // 3. DEEP WATER RIVER HAZARD + 3D STEPPING STONES ("น้ำลึกที่ตกแล้วตาย + ก้อนหินให้กระโดด")
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

      // Deep Sapphire/Teal Forest River Basin
      const deepRiverMat = new THREE.MeshStandardMaterial({
        color: '#0369A1',
        roughness: 0.14,
        metalness: 0.12,
      });
      const pond = new THREE.Mesh(
        new RoundedBoxGeometry(155, 0.35, 115, 4, 0.1),
        deepRiverMat
      );
      pond.position.set(wx, -0.16, wz);
      pond.receiveShadow = true;
      hazardGroup.add(pond);

      // Build 3D Mossy Stepping Stones emerging from the Deep Water Hazard!
      const stoneBaseMat = new THREE.MeshStandardMaterial({
        color: '#57534E',
        roughness: 0.9,
      });
      const stoneMossMat = new THREE.MeshStandardMaterial({
        color: '#65A30D',
        roughness: 0.82,
      });
      const stoneTopMat = new THREE.MeshStandardMaterial({
        color: '#D6D3D1',
        roughness: 0.75,
      });
      const stoneRingMat = new THREE.MeshBasicMaterial({
        color: '#BAE6FD',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      });

      for (const st of RIVER_STEPPING_STONES) {
        const stGroup = new THREE.Group();
        stGroup.position.set(st.x, st.y, st.z);
        stGroup.rotation.y = st.yaw;

        // Submerged dark rock pillar
        const baseMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(
            st.radius * 0.98,
            st.radius * 1.12,
            0.65,
            10
          ),
          stoneBaseMat
        );
        baseMesh.position.y = -0.32;
        stGroup.add(baseMesh);

        // Mossy green collar
        const mossMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(
            st.radius * 0.96,
            st.radius * 1.0,
            0.14,
            10
          ),
          stoneMossMat
        );
        mossMesh.position.y = -0.04;
        stGroup.add(mossMesh);

        // Flat stepping-stone top platform for jumping on!
        const topMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(
            st.radius * 0.88,
            st.radius * 0.95,
            0.16,
            10
          ),
          stoneTopMat
        );
        topMesh.position.y = 0.04;
        topMesh.receiveShadow = true;
        topMesh.castShadow = true;
        stGroup.add(topMesh);

        // Water ripple ring around the stepping stone
        const ripple = new THREE.Mesh(
          new THREE.RingGeometry(st.radius * 1.02, st.radius * 1.18, 18),
          stoneRingMat
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.y = -0.12;
        stGroup.add(ripple);

        hazardGroup.add(stGroup);
      }

      // Cute Lily Pads on the Deep River
      const lilyMat = new THREE.MeshStandardMaterial({
        color: '#4D7C0F',
        roughness: 0.7,
      });
      for (let l = 0; l < 18; l++) {
        const angle = (l / 18) * Math.PI * 2;
        const rad = 18 + (l % 4) * 9;
        const lily = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 0.08, 14),
          lilyMat
        );
        lily.position.set(
          wx + Math.cos(angle) * rad,
          0.02,
          wz + Math.sin(angle) * rad
        );
        hazardGroup.add(lily);
      }
    }

    // Start / Finish Checkered Archway
    const startSeg = TRACK_SEGMENTS[0];
    const startYaw = Math.atan2(-startSeg.dirX, -startSeg.dirZ);
    const archGroup = new THREE.Group();
    archGroup.position.set(startSeg.x0, startSeg.y0, startSeg.z0);
    archGroup.rotation.y = startYaw;

    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#C86D3B',
      roughness: 0.6,
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

    // Sticky Slime Puddles (3D)
    const slimeMat = new THREE.MeshStandardMaterial({
      color: '#84CC16',
      roughness: 0.25,
      metalness: 0.08,
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
      color: '#F59E0B',
      emissive: '#F59E0B',
      emissiveIntensity: 0.35,
      roughness: 0.4,
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
        new THREE.MeshStandardMaterial({ color: '#FDE047', roughness: 0.5 })
      );
      disc.receiveShadow = true;
      g.add(disc);

      const hub = new THREE.Mesh(
        new RoundedBoxGeometry(0.95, 0.9, 0.95, 3, 0.18),
        new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.4 })
      );
      hub.position.y = 0.45;
      g.add(hub);

      const beam = new THREE.Mesh(
        new RoundedBoxGeometry(tt.barHalfLength * 2, 0.44, 0.44, 3, 0.12),
        new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.4 })
      );
      beam.position.y = 0.36;
      beam.castShadow = true;
      g.add(beam);

      hazardGroup.add(g);
      turntableMeshes.push({ group: g, spec: tt });
    }

    // Rolling Boulders & Giant Beach Balls
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
        roughness: b.isBeachBall ? 0.35 : 0.85,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.centerX, b.centerY + b.radius, b.centerZ);
      mesh.castShadow = true;
      hazardGroup.add(mesh);
      boulderMeshes.push({ mesh, spec: b });
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
        playerMarker: THREE.Mesh | null;
      }
    > = new Map();

    const buildRacerVisualsForCurrentState = () => {
      for (const v of racerVisuals.values()) {
        scene.remove(v.container);
      }
      racerVisuals.clear();

      for (const r of simStateRef.current.racers) {
        const wrapper = new THREE.Group();
        const rig = buildProceduralCharacter(r.id, shadowTex);
        rig.rootGroup.scale.setScalar(0.75);
        // Fix orientation: procedural character's face/eyes are built at +Z and tail at -Z,
        // while raceEngine's forward vector (-sin(yaw), -cos(yaw)) is wrapper's -Z.
        // Rotating rootGroup by Math.PI (180°) makes the character face forward down the track!
        rig.rootGroup.rotation.y = Math.PI;
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
          playerMarker,
        });
      }
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

      // Mode 1: Pointer Lock is active -> Unlimited 360° hardware mouse deltas!
      if (document.pointerLockElement === domElem) {
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        cameraYawRef.current -= dx * 0.0032;
        cameraPitchRef.current = Math.max(
          0.16,
          Math.min(0.85, cameraPitchRef.current + dy * 0.0026)
        );
        return;
      }

      // Mode 2: Active Mouse Drag or Mobile Touch-Swipe on Canvas
      // (Moving an unlocked mouse without holding the button NEVER rotates the camera back!)
      const tracked = activeDragPointers.get(e.pointerId);
      if (!tracked) return;

      const dx = e.clientX - tracked.lastX;
      const dy = e.clientY - tracked.lastY;
      tracked.lastX = e.clientX;
      tracked.lastY = e.clientY;

      const sensitivity = e.pointerType === 'touch' ? 0.0065 : 0.0052;
      cameraYawRef.current -= dx * sensitivity;
      cameraPitchRef.current = Math.max(
        0.16,
        Math.min(0.85, cameraPitchRef.current + dy * 0.004)
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

    const camPos = new THREE.Vector3(0, 6, 12);
    const camLook = new THREE.Vector3(0, 1.2, 0);

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const state = simStateRef.current;
      if (state.racers[0]?.id !== knownPlayerId) {
        knownPlayerId = state.racers[0]?.id;
        buildRacerVisualsForCurrentState();
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

      const moveForward = Math.max(-1, Math.min(1, kbForward + joyY));
      const moveRight = Math.max(-1, Math.min(1, kbRight + joyX));

      // Smoothly steer camera into turns when turning with A/D or Virtual Thumbstick
      const isActivelyAiming =
        document.pointerLockElement === domElem || activeDragPointers.size > 0;
      if (Math.abs(moveRight) > 0.05 && !isActivelyAiming) {
        cameraYawRef.current -= moveRight * dt * 1.55;
      }

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

      if (!isLobbyOpenRef.current) {
        stepRaceSimulation(state, dt, input);
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
        tm.group.rotation.y = state.elapsedRaceSec * tm.spec.angularSpeed;
      }

      // Update Rolling Boulders & Beach Balls
      for (const bm of boulderMeshes) {
        const b = bm.spec;
        const offset =
          Math.sin(state.elapsedRaceSec * b.speed + b.phase) * b.sweepHalfWidth;
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
          mesh.visible = box.respawnTimer <= 0;
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
      for (const trap of state.droppedTraps) {
        const tMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(trap.radius, trap.radius, 0.14, 18),
          new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.2 })
        );
        tMesh.position.set(trap.x, trap.y + 0.06, trap.z);
        dynamicEffectsGroup.add(tMesh);
      }
      for (const pie of state.pieProjectiles) {
        const pMesh = new THREE.Mesh(
          new RoundedBoxGeometry(0.75, 0.35, 0.75, 3, 0.12),
          new THREE.MeshStandardMaterial({ color: '#F472B6', roughness: 0.4 })
        );
        pMesh.position.set(pie.x, pie.y, pie.z);
        dynamicEffectsGroup.add(pMesh);
      }
      for (const sw of state.shockwaves) {
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
      const playerRef = state.racers[0];
      const cameraFocusRacer =
        (state.phase === 'finished' &&
          spectatedRacerIdRef.current &&
          state.racers.find((r) => r.id === spectatedRacerIdRef.current)) ||
        playerRef;

      for (let i = 0; i < state.racers.length; i++) {
        const r = state.racers[i];
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

        vis.container.position.set(r.x, stepInfo.smoothGroundY, r.z);
        vis.container.rotation.y = r.yaw;

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

        // Accumulate continuous animation phase per racer so changing speed never causes phase-jump shaking!
        stepInfo.animTime += dt * animSpeed;

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
        frame.rootY += airOffset / 0.75;
        applyKinematicsToRig(vis.rig, frame);

        // Spawn cute footstep dust/smoke puffs (or water splash puffs in shallow water) behind feet!
        const isAirborneNow = airOffset > 0.14;
        const isNearCamera =
          r.id === cameraFocusRacer?.id ||
          !cameraFocusRacer ||
          Math.hypot(r.x - cameraFocusRacer.x, r.z - cameraFocusRacer.z) < 42;

        if (isNearCamera && !isLobbyOpenRef.current) {
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
            stepInfo.timer -= dt;
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

      // 3rd-Person Chase Camera tracking Player or Spectated Racer 3D Position & Elevation (x, y, z)
      const player = state.racers[0];
      const camTarget = cameraFocusRacer || player;
      if (camTarget) {
        // When spectating another racer after finishing, gently auto-align camera behind their heading if not manually dragging
        if (
          state.phase === 'finished' &&
          !camTarget.isPlayer &&
          activeDragPointers.size === 0 &&
          document.pointerLockElement !== domElem
        ) {
          let yawDiff = camTarget.yaw - cameraYawRef.current;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          cameraYawRef.current += yawDiff * Math.min(1, dt * 4.5);
        }

        const camDist = 8.4;
        const camHeight = 3.8 + cameraPitchRef.current * 4.4;
        const desiredCamX =
          camTarget.x + Math.sin(cameraYawRef.current) * camDist;
        const desiredCamZ =
          camTarget.z + Math.cos(cameraYawRef.current) * camDist;
        const desiredCamY = camTarget.y + camHeight;

        camPos.lerp(
          new THREE.Vector3(desiredCamX, desiredCamY, desiredCamZ),
          Math.min(1, dt * 10.5)
        );
        const lookAheadX =
          camTarget.x - Math.sin(cameraYawRef.current) * 3.0;
        const lookAheadZ =
          camTarget.z - Math.cos(cameraYawRef.current) * 3.0;
        camLook.lerp(
          new THREE.Vector3(lookAheadX, camTarget.y + 1.25, lookAheadZ),
          Math.min(1, dt * 12.5)
        );

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
      }

      renderer.render(scene, camera);

      // Emit HUD snapshot (~15 Hz)
      if (now - lastHudEmitTime > 65 && player) {
        lastHudEmitTime = now;
        const sortedStandings = [...state.racers]
          .sort((a, b) => a.rank - b.rank)
          .map((r) => ({
            id: r.id,
            name: r.spec.name,
            shortName: r.spec.shortName,
            primaryHex: r.spec.primaryHex,
            isPlayer: r.isPlayer,
            rank: r.rank,
            finished: r.finished,
            finishTimeSec: r.finishTimeSec,
            progressPercent: Math.min(
              100,
              Math.round((r.totalProgress / TOTAL_TRACK_LENGTH) * 100)
            ),
            x: r.x,
            z: r.z,
            yaw: r.yaw,
          }));

        const playerSeg = sampleTrackAtDistance(player.furthestCheckpointDist);

        onHudUpdateRef.current({
          phase: state.phase,
          countdownSec: state.countdownSec,
          elapsedRaceSec: state.elapsedRaceSec,
          playerRank: player.rank,
          progressPercent: Math.min(
            100,
            Math.round((player.totalProgress / TOTAL_TRACK_LENGTH) * 100)
          ),
          zoneName: playerSeg.zoneName,
          elevationMeters: Math.round(player.y * 2),
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
        });
      }
    };

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
      cancelAnimationFrame(animFrameId);
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
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full touch-none cursor-grab active:cursor-grabbing"
      aria-label="3D Party Obstacle Race Viewport"
    />
  );
};
