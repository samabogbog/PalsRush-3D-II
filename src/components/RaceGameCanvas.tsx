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
 * Builds a continuous, gap-free 3D ribbon BufferGeometry along all smooth spline segments.
 */
function buildContinuousTrackRibbon(): THREE.Group {
  const ribbonGroup = new THREE.Group();
  const n = TRACK_SEGMENTS.length;

  // 1. Main Road Deck Ribbon (Top + Bottom + Left/Right Sidewalls)
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const colorMainRoad = new THREE.Color('#F3E8D6');
  const colorBridgeWood = new THREE.Color('#D7A16E');
  const colorHighBridge = new THREE.Color('#E8D3B9');
  const colorDownhillSlope = new THREE.Color('#EFE0C6');

  const thickness = 0.48;

  for (let i = 0; i <= n; i++) {
    const seg = TRACK_SEGMENTS[i % n];
    const halfW = seg.width * 0.5;
    const lx = seg.x0 - seg.rightX * halfW;
    const lz = seg.z0 - seg.rightZ * halfW;
    const rx = seg.x0 + seg.rightX * halfW;
    const rz = seg.z0 + seg.rightZ * halfW;
    const yTop = seg.y0;
    const yBot = seg.y0 - thickness;

    // 4 vertices per cross-section: 0=TopLeft, 1=TopRight, 2=BotLeft, 3=BotRight
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

    let c = colorMainRoad;
    if (seg.isBridgeOverWater) c = colorBridgeWood;
    else if (seg.isHighBridge) c = colorHighBridge;
    else if (seg.isDownhillSlope) c = colorDownhillSlope;

    for (let v = 0; v < 4; v++) {
      colors.push(c.r, c.g, c.b);
    }

    if (i < n) {
      const base = i * 4;
      const next = (i + 1) * 4;
      // Top surface
      indices.push(base + 0, base + 1, next + 1);
      indices.push(base + 0, next + 1, next + 0);
      // Left wall
      indices.push(base + 2, base + 0, next + 0);
      indices.push(base + 2, next + 0, next + 2);
      // Right wall
      indices.push(base + 1, base + 3, next + 3);
      indices.push(base + 1, next + 3, next + 1);
      // Bottom surface
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
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.04,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  roadMesh.castShadow = true;
  ribbonGroup.add(roadMesh);

  // 2. Smooth Curving Guard Curbs & High-Bridge / Slope Features
  const curbPalette = [
    new THREE.MeshStandardMaterial({ color: '#E0675F', roughness: 0.72 }),
    new THREE.MeshStandardMaterial({ color: '#F6CD61', roughness: 0.72 }),
    new THREE.MeshStandardMaterial({ color: '#7E9B6B', roughness: 0.72 }),
    new THREE.MeshStandardMaterial({ color: '#6580B2', roughness: 0.72 }),
  ];
  const pillarMat = new THREE.MeshStandardMaterial({
    color: '#D8C5AC',
    roughness: 0.88,
  });
  const pillarCapMat = new THREE.MeshStandardMaterial({
    color: '#B56E3E',
    roughness: 0.8,
  });
  const archBeamMat = new THREE.MeshStandardMaterial({
    color: '#C86D3B',
    roughness: 0.75,
  });
  const slopeChevronMat = new THREE.MeshStandardMaterial({
    color: '#F59E0B',
    emissive: '#D97706',
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });

  const sharedCurbGeo = new RoundedBoxGeometry(0.44, 0.32, 6.6, 2, 0.08);
  const sharedTowerGeo = new RoundedBoxGeometry(0.65, 5.2, 0.65, 2, 0.14);
  const sharedBarGeo = new RoundedBoxGeometry(1.5, 0.06, 0.32, 1, 0.03);

  for (let i = 0; i < n; i++) {
    const seg = TRACK_SEGMENTS[i];
    const midX = (seg.x0 + seg.x1) * 0.5;
    const midY = (seg.y0 + seg.y1) * 0.5;
    const midZ = (seg.z0 + seg.z1) * 0.5;
    const segYaw = Math.atan2(-seg.dirX, -seg.dirZ);
    const pitchX = Math.atan2(seg.dy, seg.length);

    // Add colorful rounded curb blocks on non-water segments
    if (!seg.isBridgeOverWater) {
      const curbMat = curbPalette[i % curbPalette.length];
      for (const side of [-1, 1]) {
        const curb = new THREE.Mesh(sharedCurbGeo, curbMat);
        const lat = (seg.width * 0.5 + 0.18) * side;
        curb.position.set(
          midX + seg.rightX * lat,
          midY + 0.14,
          midZ + seg.rightZ * lat
        );
        curb.rotation.order = 'YXZ';
        curb.rotation.y = segYaw;
        curb.rotation.x = pitchX;
        ribbonGroup.add(curb);
      }
    }

    // Add Support Viaduct Pillars underneath elevated sections (y > 1.8)
    if (midY > 1.8 && i % 5 === 0) {
      const pillarH = midY + 1.2;
      const pGeo = new THREE.BoxGeometry(1.3, pillarH, 1.3);
      for (const side of [-1, 1]) {
        const lat = (seg.width * 0.5 - 0.8) * side;
        const pillar = new THREE.Mesh(pGeo, pillarMat);
        pillar.position.set(
          midX + seg.rightX * lat,
          midY - pillarH * 0.5 - 0.2,
          midZ + seg.rightZ * lat
        );
        ribbonGroup.add(pillar);
      }
      const crossBeam = new THREE.Mesh(
        new THREE.BoxGeometry(seg.width, 0.7, 1.5),
        pillarCapMat
      );
      crossBeam.position.set(midX, midY - 0.65, midZ);
      crossBeam.rotation.y = segYaw;
      ribbonGroup.add(crossBeam);

      // Suspension Arch Portal on High Bridges every 15 segments
      if (seg.isHighBridge && i % 15 === 0) {
        for (const side of [-1, 1]) {
          const lat = (seg.width * 0.5 + 0.35) * side;
          const tower = new THREE.Mesh(sharedTowerGeo, archBeamMat);
          tower.position.set(
            midX + seg.rightX * lat,
            midY + 2.4,
            midZ + seg.rightZ * lat
          );
          ribbonGroup.add(tower);
        }
        const topBeam = new THREE.Mesh(
          new THREE.BoxGeometry(seg.width + 1.6, 0.65, 0.75),
          archBeamMat
        );
        topBeam.position.set(midX, midY + 4.9, midZ);
        topBeam.rotation.y = segYaw;
        ribbonGroup.add(topBeam);
      }
    }

    // Add Downhill Slope Visual Chevron Markers ("ทางที่เป็นสโลปลงไป")
    if (seg.isDownhillSlope && i % 3 === 0) {
      const chevGroup = new THREE.Group();
      chevGroup.position.set(midX, midY + 0.04, midZ);
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
 * Procedurally builds rich chibi environmental scenery around the entire circuit
 * using shared geometries for fast startup and 60fps performance.
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

  // Shared materials
  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#8D5B3E',
    roughness: 0.85,
  });
  const oakGreenMat = new THREE.MeshStandardMaterial({
    color: '#7E9B6B',
    roughness: 0.78,
  });
  const mintGreenMat = new THREE.MeshStandardMaterial({
    color: '#96B87C',
    roughness: 0.78,
  });
  const sakuraPinkMat = new THREE.MeshStandardMaterial({
    color: '#F4A7B9',
    roughness: 0.75,
  });
  const goldenLeafMat = new THREE.MeshStandardMaterial({
    color: '#F2B53D',
    roughness: 0.78,
  });
  const pineDarkMat = new THREE.MeshStandardMaterial({
    color: '#537A5A',
    roughness: 0.82,
  });
  const mushroomCapMat = new THREE.MeshStandardMaterial({
    color: '#E05A4E',
    roughness: 0.65,
  });
  const mushroomStemMat = new THREE.MeshStandardMaterial({
    color: '#F8EFE0',
    roughness: 0.8,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: '#B6A899',
    roughness: 0.88,
  });
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#FFFDF9',
    roughness: 0.9,
  });
  const sailMat = new THREE.MeshStandardMaterial({
    color: '#F6CD61',
    roughness: 0.7,
  });

  // Shared Geometries (created once!)
  const trunkGeo = new RoundedBoxGeometry(0.65, 2.2, 0.65, 2, 0.16);
  const mainCrownGeo = new RoundedBoxGeometry(2.4, 2.1, 2.4, 2, 0.48);
  const topPuffGeo = new RoundedBoxGeometry(1.5, 1.3, 1.5, 2, 0.35);
  const sidePuffGeo = new RoundedBoxGeometry(1.4, 1.2, 1.4, 2, 0.35);

  const pineTier1Geo = new RoundedBoxGeometry(2.5, 1.3, 2.5, 2, 0.3);
  const pineTier2Geo = new RoundedBoxGeometry(1.9, 1.2, 1.9, 2, 0.28);
  const pineTier3Geo = new RoundedBoxGeometry(1.25, 1.1, 1.25, 2, 0.24);

  const mushStemGeo = new RoundedBoxGeometry(0.95, 2.1, 0.95, 2, 0.25);
  const mushCapGeo = new RoundedBoxGeometry(2.6, 1.25, 2.6, 2, 0.4);
  const mushSpotGeo = new THREE.BoxGeometry(0.45, 0.18, 0.45);
  const sharedRockGeo = new RoundedBoxGeometry(1.5, 1.1, 1.4, 2, 0.3);

  const wmTowerGeo = new RoundedBoxGeometry(3.2, 6.8, 3.2, 2, 0.4);
  const wmRoofGeo = new RoundedBoxGeometry(3.6, 1.8, 3.6, 2, 0.45);
  const wmHubGeo = new THREE.BoxGeometry(0.7, 0.7, 0.6);
  const wmSailGeo = new THREE.BoxGeometry(0.55, 5.6, 0.15);

  const cloud1Geo = new RoundedBoxGeometry(4.6, 1.6, 2.8, 2, 0.45);
  const cloud2Geo = new RoundedBoxGeometry(2.8, 2.1, 2.4, 2, 0.45);
  const balloonEnvGeo = new RoundedBoxGeometry(3.4, 4.0, 3.4, 3, 0.9);
  const balloonBasketGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);

  const createPuffTree = (
    leafMat: THREE.Material,
    scale = 1.0
  ): THREE.Group => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.1;
    const mainCrown = new THREE.Mesh(mainCrownGeo, leafMat);
    mainCrown.position.y = 2.6;
    const topPuff = new THREE.Mesh(topPuffGeo, leafMat);
    topPuff.position.set(0.2, 3.8, -0.15);
    const sidePuff = new THREE.Mesh(sidePuffGeo, leafMat);
    sidePuff.position.set(-0.85, 2.3, 0.4);
    g.add(trunk, mainCrown, topPuff, sidePuff);
    g.scale.setScalar(scale);
    return g;
  };

  const createPineTree = (scale = 1.0): THREE.Group => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    const t1 = new THREE.Mesh(pineTier1Geo, pineDarkMat);
    t1.position.y = 1.8;
    const t2 = new THREE.Mesh(pineTier2Geo, pineDarkMat);
    t2.position.y = 2.8;
    const t3 = new THREE.Mesh(pineTier3Geo, pineDarkMat);
    t3.position.y = 3.7;
    g.add(trunk, t1, t2, t3);
    g.scale.setScalar(scale);
    return g;
  };

  const createGiantMushroom = (scale = 1.0): THREE.Group => {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(mushStemGeo, mushroomStemMat);
    stem.position.y = 1.05;
    const cap = new THREE.Mesh(mushCapGeo, mushroomCapMat);
    cap.position.y = 2.25;
    const spot1 = new THREE.Mesh(mushSpotGeo, mushroomStemMat);
    spot1.position.set(-0.6, 2.82, -0.5);
    const spot2 = new THREE.Mesh(mushSpotGeo, mushroomStemMat);
    spot2.position.set(0.65, 2.82, 0.45);
    g.add(stem, cap, spot1, spot2);
    g.scale.setScalar(scale);
    return g;
  };

  const createWindmill = (): THREE.Group => {
    const g = new THREE.Group();
    const tower = new THREE.Mesh(wmTowerGeo, mushroomStemMat);
    tower.position.y = 3.4;
    const roof = new THREE.Mesh(wmRoofGeo, mushroomCapMat);
    roof.position.y = 7.2;
    const rotor = new THREE.Group();
    rotor.position.set(0, 5.6, 1.75);
    const hub = new THREE.Mesh(wmHubGeo, trunkMat);
    const sail1 = new THREE.Mesh(wmSailGeo, sailMat);
    const sail2 = new THREE.Mesh(wmSailGeo, sailMat);
    sail2.rotation.z = Math.PI * 0.5;
    rotor.add(hub, sail1, sail2);
    g.add(tower, roof, rotor);
    windmillBlades.push(rotor);
    return g;
  };

  // Place roadside trees, mushrooms, boulders & windmills along the circuit
  for (let i = 0; i < TRACK_SEGMENTS.length; i += 3) {
    const seg = TRACK_SEGMENTS[i];
    if (seg.isBridgeOverWater) continue;

    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const randA = seed - Math.floor(seed);
    const randB = seed * 1.7 - Math.floor(seed * 1.7);

    for (const side of [-1, 1]) {
      if (seg.isHighBridge && side === 1 && i % 6 !== 0) continue;

      const distFromEdge = seg.isHighBridge
        ? 6.5 + randA * 8.0
        : 3.6 + randA * 9.5;
      const lat = (seg.width * 0.5 + distFromEdge) * side;
      const px = seg.x0 + seg.rightX * lat;
      const pz = seg.z0 + seg.rightZ * lat;
      const py = seg.isHighBridge ? 0 : Math.max(0, seg.y0 - 0.3);

      const scale = 0.85 + randB * 0.55;
      let prop: THREE.Group;

      if (i % 30 === 0 && side === -1 && !seg.isHighBridge) {
        prop = createWindmill();
        prop.rotation.y = Math.atan2(-seg.rightX * side, -seg.rightZ * side);
      } else if (
        seg.zoneName.includes('Pine') ||
        seg.zoneName.includes('Alpine')
      ) {
        prop = createPineTree(scale * 1.15);
      } else if (
        seg.zoneName.includes('Mushroom') ||
        seg.zoneName.includes('Slime')
      ) {
        prop =
          i % 6 === 0
            ? createGiantMushroom(scale * 1.1)
            : createPuffTree(mintGreenMat, scale);
      } else if (i % 6 === 0) {
        prop = createPuffTree(sakuraPinkMat, scale);
      } else if (i % 9 === 0) {
        prop = createPuffTree(goldenLeafMat, scale);
      } else {
        prop = createPuffTree(oakGreenMat, scale);
      }

      prop.position.set(px, py, pz);
      sceneryGroup.add(prop);

      if (i % 9 === 0 && !seg.isHighBridge) {
        const rock = new THREE.Mesh(sharedRockGeo, rockMat);
        rock.scale.setScalar(scale);
        rock.position.set(
          px + seg.dirX * 2.2,
          py + 0.45 * scale,
          pz + seg.dirZ * 2.2
        );
        rock.rotation.y = randA * Math.PI;
        sceneryGroup.add(rock);
      }
    }
  }

  // Add Floating Fluffy Clouds & Hot Air Balloons in the sky around High Bridges
  const balloonMats = [
    '#E05A4E',
    '#F59E0B',
    '#06B6D4',
    '#8B5CF6',
    '#EC4899',
  ].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));

  for (let k = 0; k < 18; k++) {
    const sample = sampleTrackAtDistance((k / 18) * TOTAL_TRACK_LENGTH);
    const side = k % 2 === 0 ? 1 : -1;
    const lat = (18 + (k % 5) * 6) * side;
    const cx = sample.x + sample.rightX * lat;
    const cz = sample.z + sample.rightZ * lat;
    const cy = Math.max(15, sample.y + 9 + (k % 4) * 3.5);

    const cloud = new THREE.Group();
    const c1 = new THREE.Mesh(cloud1Geo, cloudMat);
    const c2 = new THREE.Mesh(cloud2Geo, cloudMat);
    c2.position.set(-0.6, 0.6, 0);
    cloud.add(c1, c2);
    cloud.position.set(cx, cy, cz);
    cloud.rotation.y = k * 0.7;
    sceneryGroup.add(cloud);
    floatingProps.push({ obj: cloud, baseY: cy, phase: k * 0.8 });

    if (k % 3 === 0) {
      const balloon = new THREE.Group();
      const env = new THREE.Mesh(
        balloonEnvGeo,
        balloonMats[(k / 3) % balloonMats.length]
      );
      env.position.y = 2.6;
      const basket = new THREE.Mesh(balloonBasketGeo, trunkMat);
      balloon.add(env, basket);
      const bx = sample.x - sample.rightX * 16 * side;
      const bz = sample.z - sample.rightZ * 16 * side;
      const by = Math.max(14, sample.y + 8);
      balloon.position.set(bx, by, bz);
      sceneryGroup.add(balloon);
      floatingProps.push({ obj: balloon, baseY: by, phase: k * 1.3 });
    }
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
    scene.background = new THREE.Color('#EAE1D3');
    scene.fog = new THREE.FogExp2('#EAE1D3', 0.0028);

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
    renderer.toneMappingExposure = 1.08;
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

    // Warm Sunlight & Fill Lighting
    const hemiLight = new THREE.HemisphereLight('#FFFDF9', '#D8C3A5', 0.9);
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

    // Meadow Valley Floor
    const meadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1400, 1400),
      new THREE.MeshStandardMaterial({
        color: '#DCE5C9',
        roughness: 0.95,
      })
    );
    meadowPlane.rotation.x = -Math.PI / 2;
    meadowPlane.position.y = -0.35;
    meadowPlane.receiveShadow = true;
    scene.add(meadowPlane);

    // ========================================================================
    // 1. CONTINUOUS 3D SPLINE TRACK & BRIDGES / SLOPES
    // ========================================================================
    const trackGroup = buildContinuousTrackRibbon();
    scene.add(trackGroup);

    // ========================================================================
    // 2. RICH CHIBI ENVIRONMENTAL SCENERY (TREES, MUSHROOMS, WINDMILLS, CLOUDS)
    // ========================================================================
    const { sceneryGroup, windmillBlades, floatingProps } =
      buildEnvironmentalScenery();
    scene.add(sceneryGroup);

    // ========================================================================
    // 3. CRYSTAL LAGOON WATER POND & START/FINISH ARCHWAY
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

      const pondMat = new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        roughness: 0.18,
        metalness: 0.1,
      });
      const pond = new THREE.Mesh(
        new RoundedBoxGeometry(115, 0.3, 95, 4, 0.1),
        pondMat
      );
      pond.position.set(wx, -0.18, wz);
      pond.receiveShadow = true;
      hazardGroup.add(pond);

      // Cute Lily Pads on the Crystal Lagoon
      const lilyMat = new THREE.MeshStandardMaterial({
        color: '#65A30D',
        roughness: 0.7,
      });
      for (let l = 0; l < 18; l++) {
        const angle = (l / 18) * Math.PI * 2;
        const rad = 14 + (l % 4) * 8;
        const lily = new THREE.Mesh(
          new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16),
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

      // Update all 8 Racer Rigs & Procedural Chibi Kinematics
      for (let i = 0; i < state.racers.length; i++) {
        const r = state.racers[i];
        const vis = racerVisuals.get(r.id);
        if (!vis) continue;

        vis.container.position.set(r.x, r.groundY, r.z);
        vis.container.rotation.y = r.yaw;

        if (r.respawnBlinkTimer > 0) {
          vis.container.visible = Math.floor(r.respawnBlinkTimer * 14) % 2 === 0;
        } else {
          vis.container.visible = true;
        }

        const speedMag = Math.hypot(r.vx, r.vz);
        const animSpeed =
          r.pose === 'run'
            ? Math.max(0.85, Math.min(1.65, speedMag / 9.5))
            : 1.05;

        const frame = computeCharacterKinematics(
          r.pose,
          elapsed + i * 0.37,
          animSpeed,
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

      // 3rd-Person Chase Camera tracking Player 3D Position & Elevation (x, y, z)
      const player = state.racers[0];
      if (player) {
        const camDist = 8.4;
        const camHeight = 3.8 + cameraPitchRef.current * 4.4;
        const desiredCamX =
          player.x + Math.sin(cameraYawRef.current) * camDist;
        const desiredCamZ =
          player.z + Math.cos(cameraYawRef.current) * camDist;
        const desiredCamY = player.y + camHeight;

        camPos.lerp(
          new THREE.Vector3(desiredCamX, desiredCamY, desiredCamZ),
          Math.min(1, dt * 10.5)
        );
        const lookAheadX =
          player.x - Math.sin(cameraYawRef.current) * 3.0;
        const lookAheadZ =
          player.z - Math.cos(cameraYawRef.current) * 3.0;
        camLook.lerp(
          new THREE.Vector3(lookAheadX, player.y + 1.25, lookAheadZ),
          Math.min(1, dt * 12.5)
        );

        camera.position.copy(camPos);
        camera.lookAt(camLook);

        // Keep directional shadow frustum centered around player
        dirLight.position.set(player.x + 35, player.y + 65, player.z + 35);
        dirLight.target.position.set(player.x, player.y, player.z);
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
