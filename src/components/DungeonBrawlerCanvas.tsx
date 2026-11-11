import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ActiveSkillId,
  CHARACTERS,
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
  CombatStats,
  computeCharacterCombatStats,
  EQUIPMENT_CATALOG,
  EquippedLoadout,
} from '../models/equipmentTypes';
import {
  animateEquipmentOnRig,
  attachEquipmentToCharacterRig,
} from '../models/equipmentMeshes';

export interface FloatingDamageText {
  id: number;
  text: string;
  isCrit: boolean;
  isHeal?: boolean;
  colorHex: string;
}

export interface DungeonBrawlerHudSnapshot {
  subMode: 'dungeon' | 'pvp';
  stageNumber: number;
  stageName: string;
  phase: 'fighting' | 'victory' | 'defeat';
  waveIndex: number;
  totalWaves: number;
  playerHp: number;
  playerMaxHp: number;
  playerStats: CombatStats;
  attackCooldown: number;
  skillQCooldown: number;
  ultECooldown: number;
  enemiesAlive: number;
  enemiesDefeatedTotal: number;
  bossInfo: {
    name: string;
    hp: number;
    maxHp: number;
    isBoss: boolean;
  } | null;
  bannerText: string | null;
  recentDamages: FloatingDamageText[];
}

export interface DungeonBrawlerCanvasProps {
  subMode: 'dungeon' | 'pvp';
  stageNumber: number;
  playerCharacterId: CharacterId;
  playerActiveSkillId: ActiveSkillId;
  playerPassiveSkillId: PassiveSkillId;
  playerLevel: number;
  playerLoadout: EquippedLoadout;
  sessionKey: number;
  externalActionTrigger: {
    type: 'atk' | 'q' | 'e' | 'jump' | null;
    seq: number;
  };
  joystickInputRef?: React.MutableRefObject<{ x: number; y: number }>;
  onHudUpdate: (snapshot: DungeonBrawlerHudSnapshot) => void;
  onMatchComplete: (payload: {
    mode: 'dungeon' | 'pvp';
    victory: boolean;
    stageCleared: number;
    bossDefeated: boolean;
    enemiesDefeated: number;
  }) => void;
}

interface EnemyEntity {
  id: number;
  name: string;
  kind: 'slime' | 'goblin' | 'golem' | 'boss' | 'rival_pal';
  rivalCharId?: CharacterId;
  rivalLoadout?: EquippedLoadout;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  radius: number;
  speed: number;
  attackTimer: number;
  aoeChargeTimer: number;
  hitFlashTimer: number;
  animPhase: number;
}

const DUNGEON_STAGE_META: Record<
  number,
  {
    name: string;
    bossName: string;
    floorHex: string;
    rimHex: string;
    skyHex: string;
  }
> = {
  1: {
    name: 'Stage 1: Jelly Slime Ruins (วิหารสไลม์เยลลี่ดึ๋งดั๋ง)',
    bossName: 'BOSS: King Pudding Rex (ราชาพุดดิ้งยักษ์)',
    floorHex: '#D6C7B2',
    rimHex: '#84CC16',
    skyHex: '#1E293B',
  },
  2: {
    name: 'Stage 2: Blazing Wok Citadel (ป้อมปราการกระทะไฟลุก)',
    bossName: 'BOSS: Chef Golem Supreme (โกเลมเชฟกระทะเหล็ก)',
    floorHex: '#475569',
    rimHex: '#F97316',
    skyHex: '#27171C',
  },
  3: {
    name: 'Stage 3: Sub-Zero Durian Peak (หอคอยทุเรียนน้ำแข็งพันปี)',
    bossName: 'BOSS: Emperor Frost Durian (จักรพรรดิทุเรียนเหมันต์)',
    floorHex: '#BAE6FD',
    rimHex: '#38BDF8',
    skyHex: '#0F172A',
  },
};

function buildMonsterMesh(
  kind: EnemyEntity['kind'],
  stageNumber: number
): THREE.Group {
  const g = new THREE.Group();

  if (kind === 'slime') {
    const color = stageNumber === 3 ? '#38BDF8' : stageNumber === 2 ? '#F97316' : '#84CC16';
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(1.15, 0.95, 1.15, 5, 0.32),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        transparent: true,
        opacity: 0.9,
      })
    );
    body.position.y = 0.48;
    body.castShadow = true;
    g.add(body);

    const eyeGeo = new THREE.SphereGeometry(0.11, 10, 10);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#1E293B' });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.24, 0.56, 0.56);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.24;
    g.add(eyeL, eyeR);
  } else if (kind === 'goblin' || kind === 'golem') {
    const isGolem = kind === 'golem';
    const scale = isGolem ? 1.32 : 1.0;
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(1.1 * scale, 1.15 * scale, 0.95 * scale, 4, 0.22),
      new THREE.MeshStandardMaterial({
        color: isGolem ? '#78350F' : '#EF4444',
        roughness: 0.65,
      })
    );
    body.position.y = 0.62 * scale;
    body.castShadow = true;
    g.add(body);

    const brow = new THREE.Mesh(
      new RoundedBoxGeometry(0.85 * scale, 0.14 * scale, 0.2 * scale, 2, 0.04),
      new THREE.MeshStandardMaterial({ color: '#1E293B' })
    );
    brow.position.set(0, 0.92 * scale, 0.48 * scale);
    g.add(brow);

    const hornMat = new THREE.MeshStandardMaterial({ color: '#FACC15' });
    for (const side of [-0.36, 0.36]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.14 * scale, 0.42 * scale, 8),
        hornMat
      );
      horn.position.set(side * scale, 1.34 * scale, 0);
      g.add(horn);
    }
  } else if (kind === 'boss') {
    const bossColor =
      stageNumber === 3
        ? '#0284C7'
        : stageNumber === 2
          ? '#DC2626'
          : '#A855F7';
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(2.4, 2.2, 2.2, 6, 0.48),
      new THREE.MeshStandardMaterial({
        color: bossColor,
        roughness: 0.35,
      })
    );
    body.position.y = 1.15;
    body.castShadow = true;
    g.add(body);

    // Giant Gold Boss Crown
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.72, 0.55, 8),
      new THREE.MeshStandardMaterial({
        color: '#FACC15',
        emissive: '#D97706',
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.25,
      })
    );
    crown.position.y = 2.48;
    g.add(crown);

    // Angry glowing boss eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: '#FEF08A',
      emissive: '#EF4444',
      emissiveIntensity: 0.9,
    });
    for (const side of [-0.48, 0.48]) {
      const eye = new THREE.Mesh(
        new RoundedBoxGeometry(0.36, 0.24, 0.14, 2, 0.05),
        eyeMat
      );
      eye.position.set(side, 1.45, 1.1);
      eye.rotation.z = side < 0 ? -0.22 : 0.22;
      g.add(eye);
    }
  }

  return g;
}

export const DungeonBrawlerCanvas: React.FC<DungeonBrawlerCanvasProps> = ({
  subMode,
  stageNumber,
  playerCharacterId,
  playerActiveSkillId,
  playerPassiveSkillId,
  playerLevel,
  playerLoadout,
  sessionKey,
  externalActionTrigger,
  joystickInputRef,
  onHudUpdate,
  onMatchComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onHudUpdateRef = useRef(onHudUpdate);
  const onMatchCompleteRef = useRef(onMatchComplete);
  const pendingActionsRef = useRef({
    atk: false,
    q: false,
    e: false,
    jump: false,
  });
  const keysDownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onHudUpdateRef.current = onHudUpdate;
  }, [onHudUpdate]);

  useEffect(() => {
    onMatchCompleteRef.current = onMatchComplete;
  }, [onMatchComplete]);

  useEffect(() => {
    if (!externalActionTrigger.type) return;
    if (externalActionTrigger.type === 'atk') pendingActionsRef.current.atk = true;
    if (externalActionTrigger.type === 'q') pendingActionsRef.current.q = true;
    if (externalActionTrigger.type === 'e') pendingActionsRef.current.e = true;
    if (externalActionTrigger.type === 'jump')
      pendingActionsRef.current.jump = true;
  }, [externalActionTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const meta =
      subMode === 'pvp'
        ? {
            name: '3D Brawler Gladiator Ring (สังเวียนประลองยุทธ์สายป่วน)',
            bossName: 'RIVAL CHAMPION',
            floorHex: '#E2E8F0',
            rimHex: '#F59E0B',
            skyHex: '#1E1B4B',
          }
        : DUNGEON_STAGE_META[stageNumber] || DUNGEON_STAGE_META[1];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(meta.skyHex);
    scene.fog = new THREE.FogExp2(meta.skyHex, 0.012);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.2, 220);

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
    renderer.toneMappingExposure = 1.08;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const hemi = new THREE.HemisphereLight('#FFFBEB', '#334155', 1.05);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight('#FFF7ED', 1.65);
    dirLight.position.set(16, 28, 18);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    // Build 3D Circular Combat Arena (Radius 18u)
    const ARENA_RADIUS = 17.5;
    const arenaGroup = new THREE.Group();
    scene.add(arenaGroup);

    const floorDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 1.2, 1.2, 48),
      new THREE.MeshStandardMaterial({
        color: meta.floorHex,
        roughness: 0.65,
      })
    );
    floorDisc.position.y = -0.6;
    floorDisc.receiveShadow = true;
    arenaGroup.add(floorDisc);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA_RADIUS - 1.2, ARENA_RADIUS - 0.3, 48),
      new THREE.MeshBasicMaterial({
        color: meta.rimHex,
        side: THREE.DoubleSide,
      })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.02;
    arenaGroup.add(innerRing);

    // 12 Arena Torch Pillars around the perimeter
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const px = Math.cos(ang) * (ARENA_RADIUS + 0.6);
      const pz = Math.sin(ang) * (ARENA_RADIUS + 0.6);

      const pillar = new THREE.Mesh(
        new RoundedBoxGeometry(1.1, 3.6, 1.1, 3, 0.16),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 })
      );
      pillar.position.set(px, 1.8, pz);
      arenaGroup.add(pillar);

      const brazier = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 0),
        new THREE.MeshStandardMaterial({
          color: meta.rimHex,
          emissive: meta.rimHex,
          emissiveIntensity: 0.85,
        })
      );
      brazier.position.set(px, 4.0, pz);
      arenaGroup.add(brazier);
    }

    // Build Player 3D Rig + Equipped 4-Slot Gear!
    const shadowTex = createContactShadowTexture();
    const playerWrapper = new THREE.Group();
    const playerRig = buildProceduralCharacter(playerCharacterId, shadowTex);
    playerRig.rootGroup.scale.setScalar(0.85);
    playerRig.rootGroup.rotation.y = Math.PI;
    attachEquipmentToCharacterRig(playerRig, playerLoadout);
    playerWrapper.add(playerRig.rootGroup);
    scene.add(playerWrapper);

    // Weapon Attack Shockwave Ring Mesh
    const swingRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 3.4, 28),
      new THREE.MeshBasicMaterial({
        color: '#FACC15',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      })
    );
    swingRingMesh.rotation.x = -Math.PI / 2;
    swingRingMesh.position.y = 0.15;
    playerWrapper.add(swingRingMesh);

    // Bubble Shield Mesh
    const shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 20, 20),
      new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        transparent: true,
        opacity: 0.35,
      })
    );
    shieldMesh.position.y = 0.9;
    shieldMesh.visible = false;
    playerWrapper.add(shieldMesh);

    // Player Combat State (Uses Real Gear Stats!)
    const baseStats = computeCharacterCombatStats(playerLevel, playerLoadout);
    // Passive Skill Combat Bonuses
    const passiveSpeedMult =
      playerPassiveSkillId === 'nimble_paws' ? 1.12 : 1.0;
    const passiveDefMult =
      playerPassiveSkillId === 'bouncy_belly' ? 1.25 : 1.0;

    const playerState = {
      x: 0,
      y: 0,
      z: 8,
      vy: 0,
      yaw: 0,
      hp: baseStats.maxHp,
      maxHp: baseStats.maxHp,
      atk: baseStats.atk,
      def: Math.round(baseStats.def * passiveDefMult),
      critPct: baseStats.critPct,
      attackCd: 0,
      skillQCd: 0,
      ultECd: 0,
      swingAnimTimer: 0,
      shieldTimer: 0,
      whirlwindTimer: 0,
      dashTimer: 0,
      animTime: 0,
    };

    // Enemy Management
    const enemies: EnemyEntity[] = [];
    const enemyVisuals = new Map<
      number,
      {
        wrapper: THREE.Group;
        rig?: CharacterRig;
        aoeRing?: THREE.Mesh;
      }
    >();
    let nextEnemyId = 1;
    let currentWave = 1;
    const totalWaves = subMode === 'pvp' ? 3 : 3;
    let phase: 'fighting' | 'victory' | 'defeat' = 'fighting';
    let enemiesDefeatedTotal = 0;
    let bossDefeated = false;
    let matchReported = false;
    let bannerText: string | null =
      subMode === 'pvp'
        ? 'ROUND 1: RIVAL BRAWLER ARENA!'
        : `WAVE 1/${totalWaves} — CLEAR THE MONSTERS!`;
    let bannerTimer = 2.6;
    const recentDamages: FloatingDamageText[] = [];
    let nextDmgId = 1;

    const pushDamageCallout = (
      text: string,
      isCrit: boolean,
      colorHex: string
    ) => {
      recentDamages.unshift({
        id: nextDmgId++,
        text,
        isCrit,
        colorHex,
      });
      if (recentDamages.length > 5) recentDamages.pop();
    };

    const spawnWave = (waveIdx: number) => {
      // Clear any remaining visuals
      for (const vis of enemyVisuals.values()) {
        scene.remove(vis.wrapper);
      }
      enemyVisuals.clear();
      enemies.length = 0;

      const stageScale = 1 + (stageNumber - 1) * 0.38;

      if (subMode === 'pvp') {
        // PvP Brawler Mode: Fight Rival Pal Champions with real 3D gear!
        const rivalSpecs: Array<{
          name: string;
          charId: CharacterId;
          loadout: EquippedLoadout;
          hpMult: number;
          atkMult: number;
        }> = [
          {
            name: 'QuackMallet (Lv.6 Rival)',
            charId: 'duck',
            loadout: {
              weapon: 'w_squeaky_duck',
              headgear: 'h_noodle_pot',
              cape: 'c_towel_cape',
              aura: 'a_chili_sparks',
            },
            hpMult: 1.0,
            atkMult: 0.9,
          },
          {
            name: 'ChefMochiWok (Lv.10 Elite)',
            charId: 'panda',
            loadout: {
              weapon: 'w_golden_wok',
              headgear: 'h_viking_plunger',
              cape: 'c_soda_jetpack',
              aura: 'a_frost_blizzard',
            },
            hpMult: 1.35,
            atkMult: 1.15,
          },
          {
            name: 'KingDurian99 (Grand Champion)',
            charId: 'tiger',
            loadout: {
              weapon: 'w_durian_mace',
              headgear: 'h_disco_afro',
              cape: 'c_dragon_wings',
              aura: 'a_thunder_god',
            },
            hpMult: 1.75,
            atkMult: 1.35,
          },
        ];

        const spec = rivalSpecs[(waveIdx - 1) % rivalSpecs.length];
        const id = nextEnemyId++;
        const maxHp = Math.round(420 * spec.hpMult * stageScale);
        const ent: EnemyEntity = {
          id,
          name: spec.name,
          kind: 'rival_pal',
          rivalCharId: spec.charId,
          rivalLoadout: spec.loadout,
          x: 0,
          y: 0,
          z: -7,
          vx: 0,
          vz: 0,
          yaw: Math.PI,
          hp: maxHp,
          maxHp,
          atk: Math.round(36 * spec.atkMult * stageScale),
          def: 18,
          radius: 1.15,
          speed: 6.4,
          attackTimer: 1.0,
          aoeChargeTimer: 0,
          hitFlashTimer: 0,
          animPhase: 0,
        };
        enemies.push(ent);

        const wrapper = new THREE.Group();
        const rig = buildProceduralCharacter(spec.charId, shadowTex);
        rig.rootGroup.scale.setScalar(0.92);
        rig.rootGroup.rotation.y = Math.PI;
        attachEquipmentToCharacterRig(rig, spec.loadout);
        wrapper.add(rig.rootGroup);
        scene.add(wrapper);
        enemyVisuals.set(id, { wrapper, rig });
      } else {
        // Dungeon Raid Mode: Waves 1 & 2 spawn monster packs; Wave 3 spawns the Giant Boss + 2 guards!
        if (waveIdx < totalWaves) {
          const count = waveIdx === 1 ? 4 : 5;
          for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 1.4 - Math.PI * 0.7;
            const dist = 7.5 + (i % 2) * 2.5;
            const kind =
              waveIdx === 1
                ? i % 2 === 0
                  ? 'slime'
                  : 'goblin'
                : i % 2 === 0
                  ? 'golem'
                  : 'goblin';
            const id = nextEnemyId++;
            const maxHp = Math.round(
              (kind === 'golem' ? 210 : 135) * stageScale
            );
            const ent: EnemyEntity = {
              id,
              name:
                kind === 'golem'
                  ? 'Barrel Golem'
                  : kind === 'goblin'
                    ? 'Spicy Imp'
                    : 'Jelly Slime',
              kind,
              x: Math.sin(ang) * dist,
              y: 0,
              z: -Math.cos(ang) * dist * 0.7 - 2,
              vx: 0,
              vz: 0,
              yaw: 0,
              hp: maxHp,
              maxHp,
              atk: Math.round((kind === 'golem' ? 26 : 18) * stageScale),
              def: kind === 'golem' ? 14 : 6,
              radius: kind === 'golem' ? 1.15 : 0.9,
              speed: kind === 'golem' ? 4.4 : 5.6,
              attackTimer: 0.8 + i * 0.25,
              aoeChargeTimer: 0,
              hitFlashTimer: 0,
              animPhase: i * 0.7,
            };
            enemies.push(ent);

            const wrapper = buildMonsterMesh(kind, stageNumber);
            scene.add(wrapper);
            enemyVisuals.set(id, { wrapper });
          }
        } else {
          // BOSS WAVE!
          const bossId = nextEnemyId++;
          const bossMaxHp = Math.round(880 * stageScale);
          const bossEnt: EnemyEntity = {
            id: bossId,
            name: meta.bossName,
            kind: 'boss',
            x: 0,
            y: 0,
            z: -8.5,
            vx: 0,
            vz: 0,
            yaw: 0,
            hp: bossMaxHp,
            maxHp: bossMaxHp,
            atk: Math.round(44 * stageScale),
            def: 22,
            radius: 1.95,
            speed: 4.8,
            attackTimer: 1.5,
            aoeChargeTimer: 4.0,
            hitFlashTimer: 0,
            animPhase: 0,
          };
          enemies.push(bossEnt);

          const bossWrapper = buildMonsterMesh('boss', stageNumber);
          const aoeRing = new THREE.Mesh(
            new THREE.RingGeometry(0.4, 4.6, 32),
            new THREE.MeshBasicMaterial({
              color: '#EF4444',
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.0,
            })
          );
          aoeRing.rotation.x = -Math.PI / 2;
          aoeRing.position.y = 0.08;
          bossWrapper.add(aoeRing);
          scene.add(bossWrapper);
          enemyVisuals.set(bossId, { wrapper: bossWrapper, aoeRing });
        }
      }
    };

    spawnWave(1);

    // Input Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      keysDownRef.current.add(e.code);
      if (e.code === 'KeyF' || e.code === 'KeyJ') {
        e.preventDefault();
        pendingActionsRef.current.atk = true;
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        pendingActionsRef.current.q = true;
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        pendingActionsRef.current.e = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        pendingActionsRef.current.jump = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    const onPointerDown = () => {
      pendingActionsRef.current.atk = true;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Combat Damage Helper
    const dealDamageToEnemy = (
      ent: EnemyEntity,
      damageMultiplier: number,
      knockbackForce: number
    ) => {
      const isCrit = Math.random() * 100 < playerState.critPct;
      const raw =
        playerState.atk * damageMultiplier * (isCrit ? 1.85 : 1.0) -
        ent.def * 0.35;
      const finalDmg = Math.max(
        12,
        Math.round(raw * (0.92 + Math.random() * 0.16))
      );
      ent.hp = Math.max(0, ent.hp - finalDmg);
      ent.hitFlashTimer = 0.22;

      const dx = ent.x - playerState.x;
      const dz = ent.z - playerState.z;
      const dist = Math.max(0.1, Math.hypot(dx, dz));
      ent.vx += (dx / dist) * knockbackForce;
      ent.vz += (dz / dist) * knockbackForce;

      pushDamageCallout(
        isCrit ? `CRIT BONK! -${finalDmg}` : `-${finalDmg}`,
        isCrit,
        isCrit ? '#FACC15' : '#FFFDF9'
      );
    };

    let animFrameId = 0;
    let stopped = false;
    let pacingTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTime = performance.now();
    let lastHudEmit = 0;

    const afterDraw = () => {
      if (stopped) return;
      if (isSoftwareGl) {
        gl.finish();
        pacingTimer = setTimeout(() => {
          if (!stopped) animFrameId = requestAnimationFrame(animate);
        }, 280);
      } else {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    const animate = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (bannerTimer > 0) {
        bannerTimer = Math.max(0, bannerTimer - dt);
        if (bannerTimer === 0) bannerText = null;
      }

      if (phase === 'fighting') {
        // Cooldowns
        playerState.attackCd = Math.max(0, playerState.attackCd - dt);
        playerState.skillQCd = Math.max(0, playerState.skillQCd - dt);
        playerState.ultECd = Math.max(0, playerState.ultECd - dt);
        playerState.swingAnimTimer = Math.max(
          0,
          playerState.swingAnimTimer - dt
        );
        playerState.shieldTimer = Math.max(0, playerState.shieldTimer - dt);
        playerState.whirlwindTimer = Math.max(
          0,
          playerState.whirlwindTimer - dt
        );
        playerState.dashTimer = Math.max(0, playerState.dashTimer - dt);

        // Movement Input
        const keys = keysDownRef.current;
        const kbX =
          (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
          (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
        const kbZ =
          (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) -
          (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);

        const joyX = joystickInputRef?.current.x ?? 0;
        const joyY = -(joystickInputRef?.current.y ?? 0);

        let moveX = Math.max(-1, Math.min(1, kbX + joyX));
        let moveZ = Math.max(-1, Math.min(1, kbZ + joyY));
        const mag = Math.hypot(moveX, moveZ);
        if (mag > 1) {
          moveX /= mag;
          moveZ /= mag;
        }

        const speed =
          8.6 *
          passiveSpeedMult *
          (playerState.dashTimer > 0
            ? 1.75
            : playerState.whirlwindTimer > 0
              ? 1.3
              : 1.0);

        playerState.x += moveX * speed * dt;
        playerState.z += moveZ * speed * dt;

        // Clamp inside circular arena
        const pDist = Math.hypot(playerState.x, playerState.z);
        if (pDist > ARENA_RADIUS - 1.2) {
          playerState.x = (playerState.x / pDist) * (ARENA_RADIUS - 1.2);
          playerState.z = (playerState.z / pDist) * (ARENA_RADIUS - 1.2);
        }

        if (mag > 0.08) {
          playerState.yaw = Math.atan2(-moveX, -moveZ);
        } else if (enemies.length > 0) {
          // Auto-face nearest enemy when standing still for easy aiming!
          let nearest = enemies[0];
          let bestD = Infinity;
          for (const e of enemies) {
            const d = Math.hypot(e.x - playerState.x, e.z - playerState.z);
            if (d < bestD) {
              bestD = d;
              nearest = e;
            }
          }
          playerState.yaw = Math.atan2(
            -(nearest.x - playerState.x),
            -(nearest.z - playerState.z)
          );
        }

        // Jump / Hop Dodge
        if (pendingActionsRef.current.jump && playerState.y <= 0.05) {
          playerState.vy = 9.2;
        }
        playerState.y += playerState.vy * dt;
        if (playerState.y > 0) {
          playerState.vy -= 24.0 * dt;
        } else {
          playerState.y = 0;
          playerState.vy = 0;
        }

        // 1. Basic Weapon Swing [F / J / Click]
        if (pendingActionsRef.current.atk && playerState.attackCd <= 0) {
          playerState.attackCd = 0.42;
          playerState.swingAnimTimer = 0.32;
          for (const ent of enemies) {
            const d = Math.hypot(ent.x - playerState.x, ent.z - playerState.z);
            if (d <= 3.8 + ent.radius) {
              dealDamageToEnemy(ent, 1.0, 6.5);
            }
          }
        }

        // 2. Active Skill [Q]
        if (pendingActionsRef.current.q && playerState.skillQCd <= 0) {
          playerState.skillQCd = 6.5;
          playerState.swingAnimTimer = 0.35;
          if (playerActiveSkillId === 'shield') {
            playerState.shieldTimer = 4.0;
            bannerText = 'BUBBLE SHIELD ACTIVATED!';
            bannerTimer = 1.5;
          } else if (playerActiveSkillId === 'whirlwind') {
            playerState.whirlwindTimer = 2.6;
            bannerText = 'CYCLONE SPIN SLASH!';
            bannerTimer = 1.5;
          } else if (playerActiveSkillId === 'dash') {
            playerState.dashTimer = 1.8;
            bannerText = 'TURBO DASH STRIKE!';
            bannerTimer = 1.5;
          } else if (playerActiveSkillId === 'spring') {
            playerState.vy = 12.5;
            bannerText = 'SUPER SPRING SLAM!';
            bannerTimer = 1.5;
          } else {
            bannerText = 'SHOCKWAVE STOMP!';
            bannerTimer = 1.5;
          }

          for (const ent of enemies) {
            const d = Math.hypot(ent.x - playerState.x, ent.z - playerState.z);
            if (d <= 5.5 + ent.radius) {
              dealDamageToEnemy(ent, 1.65, 10.5);
            }
          }
        }

        // 3. Weapon Ultimate [E]
        if (pendingActionsRef.current.e && playerState.ultECd <= 0) {
          playerState.ultECd = 8.0;
          playerState.swingAnimTimer = 0.4;
          const weaponName =
            EQUIPMENT_CATALOG[playerLoadout.weapon || 'w_squeaky_duck']
              ?.thaiName || 'ท่าไม้ตายอาวุธ';
          bannerText = `ULTIMATE: ${weaponName}!!`;
          bannerTimer = 2.0;

          // Hits all enemies in a wide 8.5u radius for 2.4x weapon damage + heals 15% HP!
          playerState.hp = Math.min(
            playerState.maxHp,
            Math.round(playerState.hp + playerState.maxHp * 0.15)
          );
          for (const ent of enemies) {
            const d = Math.hypot(ent.x - playerState.x, ent.z - playerState.z);
            if (d <= 8.5 + ent.radius) {
              dealDamageToEnemy(ent, 2.4, 14.0);
            }
          }
        }

        // Ongoing Whirlwind Spin Damage
        if (playerState.whirlwindTimer > 0 && Math.random() < dt * 5.5) {
          for (const ent of enemies) {
            const d = Math.hypot(ent.x - playerState.x, ent.z - playerState.z);
            if (d <= 3.6 + ent.radius) {
              dealDamageToEnemy(ent, 0.55, 4.0);
            }
          }
        }

        pendingActionsRef.current.atk = false;
        pendingActionsRef.current.q = false;
        pendingActionsRef.current.e = false;
        pendingActionsRef.current.jump = false;

        // Update Enemies & Check Deaths
        for (let i = enemies.length - 1; i >= 0; i--) {
          const ent = enemies[i];
          if (ent.hp <= 0) {
            const vis = enemyVisuals.get(ent.id);
            if (vis) {
              scene.remove(vis.wrapper);
              enemyVisuals.delete(ent.id);
            }
            if (ent.kind === 'boss') bossDefeated = true;
            enemiesDefeatedTotal += 1;
            enemies.splice(i, 1);
            continue;
          }

          ent.animPhase += dt * 4.5;
          ent.hitFlashTimer = Math.max(0, ent.hitFlashTimer - dt);

          const dx = playerState.x - ent.x;
          const dz = playerState.z - ent.z;
          const dist = Math.max(0.01, Math.hypot(dx, dz));
          ent.yaw = Math.atan2(dx, dz);

          // Move toward player + apply knockback decay
          if (dist > ent.radius + 1.05) {
            ent.x += (dx / dist) * ent.speed * dt;
            ent.z += (dz / dist) * ent.speed * dt;
          }
          ent.x += ent.vx * dt;
          ent.z += ent.vz * dt;
          ent.vx *= Math.pow(0.04, dt);
          ent.vz *= Math.pow(0.04, dt);

          // Boss AoE Slam Telegraph
          if (ent.kind === 'boss') {
            ent.aoeChargeTimer -= dt;
            const vis = enemyVisuals.get(ent.id);
            if (vis?.aoeRing) {
              const mat = vis.aoeRing.material as THREE.MeshBasicMaterial;
              if (ent.aoeChargeTimer < 1.3 && ent.aoeChargeTimer > 0) {
                mat.opacity = 0.45 + Math.sin(now * 0.02) * 0.25;
              } else {
                mat.opacity = 0;
              }
            }
            if (ent.aoeChargeTimer <= 0) {
              ent.aoeChargeTimer = 4.6;
              if (dist <= 4.8 && playerState.y < 0.45) {
                const shieldMult = playerState.shieldTimer > 0 ? 0.25 : 1.0;
                const dmg = Math.max(
                  10,
                  Math.round((ent.atk * 1.35 - playerState.def * 0.4) * shieldMult)
                );
                playerState.hp = Math.max(0, playerState.hp - dmg);
                pushDamageCallout(`BOSS SLAM -${dmg}`, false, '#EF4444');
              }
            }
          }

          // Contact / Melee Attack against Player
          ent.attackTimer -= dt;
          if (dist <= ent.radius + 1.35 && ent.attackTimer <= 0) {
            ent.attackTimer = 1.25;
            if (playerState.y < 0.5) {
              const shieldMult = playerState.shieldTimer > 0 ? 0.2 : 1.0;
              const dmg = Math.max(
                6,
                Math.round((ent.atk - playerState.def * 0.42) * shieldMult)
              );
              playerState.hp = Math.max(0, playerState.hp - dmg);
              pushDamageCallout(`-${dmg} HP`, false, '#F87171');
            }
          }

          // Update Enemy Visuals
          const vis = enemyVisuals.get(ent.id);
          if (vis) {
            const hop = Math.abs(Math.sin(ent.animPhase)) * 0.22;
            vis.wrapper.position.set(ent.x, hop, ent.z);
            vis.wrapper.rotation.y = ent.yaw;
            if (vis.rig) {
              const rFrame = computeCharacterKinematics(
                'run',
                ent.animPhase * 0.35,
                1.0,
                1.0,
                ent.hitFlashTimer > 0 ? 0.9 : 0
              );
              applyKinematicsToRig(vis.rig, rFrame);
              animateEquipmentOnRig(
                vis.rig,
                ent.animPhase * 0.35,
                ent.attackTimer > 0.9 ? (ent.attackTimer - 0.9) / 0.35 : 0
              );
            }
          }
        }

        // Check Player Defeat
        if (playerState.hp <= 0) {
          phase = 'defeat';
          bannerText = 'DEFEATED! UPGRADE YOUR GEAR & TRY AGAIN!';
          bannerTimer = 5.0;
          if (!matchReported) {
            matchReported = true;
            onMatchCompleteRef.current({
              mode: subMode,
              victory: false,
              stageCleared: stageNumber,
              bossDefeated: false,
              enemiesDefeated: enemiesDefeatedTotal,
            });
          }
        } else if (enemies.length === 0) {
          // Wave Cleared! Advance to next wave or Victory!
          if (currentWave < totalWaves) {
            currentWave += 1;
            // Heal 25% between waves
            playerState.hp = Math.min(
              playerState.maxHp,
              Math.round(playerState.hp + playerState.maxHp * 0.25)
            );
            bannerText =
              subMode === 'pvp'
                ? `ROUND ${currentWave}/${totalWaves} — NEXT CHALLENGER!`
                : currentWave === totalWaves
                  ? `WARNING: ${meta.bossName} APPEARS!`
                  : `WAVE ${currentWave}/${totalWaves} INCOMING!`;
            bannerTimer = 2.8;
            spawnWave(currentWave);
          } else {
            phase = 'victory';
            bannerText =
              subMode === 'pvp'
                ? 'CHAMPION OF THE 3D BRAWLER ARENA!'
                : 'DUNGEON STAGE CLEARED! LOOT CHEST UNLOCKED!';
            bannerTimer = 8.0;
            if (!matchReported) {
              matchReported = true;
              onMatchCompleteRef.current({
                mode: subMode,
                victory: true,
                stageCleared: stageNumber,
                bossDefeated: true,
                enemiesDefeated: enemiesDefeatedTotal,
              });
            }
          }
        }
      }

      // Animate Player Rig + 3D Equipped Weapon Swing!
      playerState.animTime += dt * 1.25;
      const pFrame = computeCharacterKinematics(
        phase === 'victory' ? 'jump' : 'run',
        playerState.animTime,
        1.0,
        1.0,
        playerState.swingAnimTimer > 0 ? 0.6 : 0
      );
      applyKinematicsToRig(playerRig, pFrame);
      animateEquipmentOnRig(
        playerRig,
        playerState.animTime,
        playerState.swingAnimTimer / 0.32
      );

      playerWrapper.position.set(
        playerState.x,
        playerState.y,
        playerState.z
      );
      playerWrapper.rotation.y =
        playerState.whirlwindTimer > 0
          ? now * 0.022
          : playerState.yaw;

      shieldMesh.visible = playerState.shieldTimer > 0;
      const swingMat = swingRingMesh.material as THREE.MeshBasicMaterial;
      swingMat.opacity =
        playerState.swingAnimTimer > 0
          ? (playerState.swingAnimTimer / 0.32) * 0.65
          : 0;
      swingRingMesh.scale.setScalar(
        1.0 + (1.0 - playerState.swingAnimTimer / 0.32) * 0.45
      );

      // Isometric Action Camera Following Player
      camera.position.set(
        playerState.x * 0.55,
        13.5,
        playerState.z * 0.55 + 16.5
      );
      camera.lookAt(playerState.x * 0.4, 1.0, playerState.z * 0.4 - 1.5);

      renderer.render(scene, camera);

      if (now - lastHudEmit > 75) {
        lastHudEmit = now;
        const bossOrRival =
          enemies.find((e) => e.kind === 'boss' || e.kind === 'rival_pal') ||
          enemies[0] ||
          null;
        onHudUpdateRef.current({
          subMode,
          stageNumber,
          stageName: meta.name,
          phase,
          waveIndex: currentWave,
          totalWaves,
          playerHp: playerState.hp,
          playerMaxHp: playerState.maxHp,
          playerStats: baseStats,
          attackCooldown: playerState.attackCd,
          skillQCooldown: playerState.skillQCd,
          ultECooldown: playerState.ultECd,
          enemiesAlive: enemies.length,
          enemiesDefeatedTotal,
          bossInfo: bossOrRival
            ? {
                name: bossOrRival.name,
                hp: bossOrRival.hp,
                maxHp: bossOrRival.maxHp,
                isBoss:
                  bossOrRival.kind === 'boss' ||
                  bossOrRival.kind === 'rival_pal',
              }
            : null,
          bannerText,
          recentDamages: [...recentDamages],
        });
      }

      afterDraw();
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
      stopped = true;
      cancelAnimationFrame(animFrameId);
      if (pacingTimer) clearTimeout(pacingTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
    };
  }, [
    subMode,
    stageNumber,
    playerCharacterId,
    playerActiveSkillId,
    playerPassiveSkillId,
    playerLevel,
    playerLoadout,
    sessionKey,
  ]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full touch-none cursor-crosshair"
      aria-label="3D Dungeon Raid & Brawler PvP Viewport"
    />
  );
};
