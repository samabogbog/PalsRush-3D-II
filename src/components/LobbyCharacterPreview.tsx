import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RotateCw, Sparkles } from 'lucide-react';
import {
  AnimationPose,
  CharacterId,
  CharacterSpec,
  computeCharacterKinematics,
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

export interface LobbyCharacterPreviewProps {
  character: CharacterSpec;
  loadout?: EquippedLoadout;
}

export const LobbyCharacterPreview: React.FC<LobbyCharacterPreviewProps> = ({
  character,
  loadout,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [previewPose, setPreviewPose] = useState<AnimationPose>('cool');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cheerCount, setCheerCount] = useState<number>(0);

  const stateRef = useRef<{
    character: CharacterSpec;
    loadout?: EquippedLoadout;
    loadoutKey: string;
    pose: AnimationPose;
    autoRotate: boolean;
    pokeImpulse: number;
  }>({
    character,
    loadout,
    loadoutKey: JSON.stringify(loadout || {}),
    pose: previewPose,
    autoRotate,
    pokeImpulse: 0.9,
  });

  useEffect(() => {
    const changedChar = stateRef.current.character.id !== character.id;
    stateRef.current.character = character;
    if (changedChar) {
      // Trigger a confident pop-bounce whenever the user selects a different character
      stateRef.current.pokeImpulse = 0.95;
    }
  }, [character]);

  useEffect(() => {
    const nextKey = JSON.stringify(loadout || {});
    if (stateRef.current.loadoutKey !== nextKey) {
      stateRef.current.loadout = loadout;
      stateRef.current.loadoutKey = nextKey;
      stateRef.current.pokeImpulse = 0.75;
    }
  }, [loadout]);

  useEffect(() => {
    stateRef.current.pose = previewPose;
  }, [previewPose]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (cheerCount > 0) {
      stateRef.current.pokeImpulse = 1.1;
    }
  }, [cheerCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(220, container.clientWidth || 280);
    const height = Math.max(220, container.clientHeight || 280);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const glRenderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : '';
    const isSoftwareGl =
      /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(glRenderer);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.setAttribute('data-testid', 'lobby-3d-character-canvas');
    renderer.domElement.className =
      'w-full h-full block cursor-grab active:cursor-grabbing outline-none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Camera framed nicely on the single pedestal character
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);
    camera.position.set(0, 1.85, 5.25);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 1.02, 0);
    controls.update();

    // Studio 3-Point Warm Arcade Lighting
    const hemiLight = new THREE.HemisphereLight(0xfff8eb, 0xc8b294, 1.05);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4df, 1.45);
    keyLight.position.set(4.2, 8.5, 6.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfde047, 0.65);
    rimLight.position.set(-4.5, 4.5, -4.0);
    scene.add(rimLight);

    // Toy Arcade Turntable Pedestal
    const turntableGroup = new THREE.Group();
    scene.add(turntableGroup);

    const plinthBaseGeo = new RoundedBoxGeometry(2.35, 0.28, 2.35, 4, 0.12);
    const plinthBaseMat = new THREE.MeshStandardMaterial({
      color: 0x2b2118,
      roughness: 0.45,
      metalness: 0.08,
    });
    const plinthBaseMesh = new THREE.Mesh(plinthBaseGeo, plinthBaseMat);
    plinthBaseMesh.position.y = -0.14;
    plinthBaseMesh.receiveShadow = true;
    turntableGroup.add(plinthBaseMesh);

    const plinthTopGeo = new RoundedBoxGeometry(2.05, 0.12, 2.05, 4, 0.06);
    const plinthTopMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stateRef.current.character.primaryHex),
      roughness: 0.38,
      metalness: 0.05,
    });
    const plinthTopMesh = new THREE.Mesh(plinthTopGeo, plinthTopMat);
    plinthTopMesh.position.y = -0.02;
    plinthTopMesh.receiveShadow = true;
    turntableGroup.add(plinthTopMesh);

    // Floating Star / Accent Corner Studs on the Pedestal
    const studGeo = new RoundedBoxGeometry(0.22, 0.1, 0.22, 2, 0.04);
    const studMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stateRef.current.character.accentHex),
      roughness: 0.35,
    });
    const studOffsets = [
      [-0.82, 0.03, -0.82],
      [0.82, 0.03, -0.82],
      [-0.82, 0.03, 0.82],
      [0.82, 0.03, 0.82],
    ];
    for (const [sx, sy, sz] of studOffsets) {
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.set(sx, sy, sz);
      turntableGroup.add(stud);
    }

    // Cache built character rigs by CharacterId so switching is 0ms instant
    const shadowTex = createContactShadowTexture();
    const rigCache = new Map<CharacterId, CharacterRig>();
    let activeCharId: CharacterId | null = null;
    let activeLoadoutKey = '';
    let activeRig: CharacterRig | null = null;

    const ensureCharacterRig = (spec: CharacterSpec): CharacterRig => {
      let cached = rigCache.get(spec.id);
      if (!cached) {
        cached = buildProceduralCharacter(spec.id, shadowTex);
        rigCache.set(spec.id, cached);
      }
      return cached;
    };

    const syncSelectedCharacter = () => {
      const targetSpec = stateRef.current.character;
      const targetLoadoutKey = stateRef.current.loadoutKey;
      const charChanged = activeCharId !== targetSpec.id || !activeRig;
      const loadoutChanged = activeLoadoutKey !== targetLoadoutKey;

      if (!charChanged && !loadoutChanged) return;

      if (charChanged) {
        if (activeRig) {
          turntableGroup.remove(activeRig.rootGroup);
        }
        activeRig = ensureCharacterRig(targetSpec);
        activeCharId = targetSpec.id;
        turntableGroup.add(activeRig.rootGroup);

        // Update pedestal accent colors to match the selected character
        plinthTopMat.color.set(targetSpec.primaryHex);
        studMat.color.set(targetSpec.accentHex);
      }

      if (activeRig) {
        attachEquipmentToCharacterRig(activeRig, stateRef.current.loadout);
        activeLoadoutKey = targetLoadoutKey;
      }
    };

    syncSelectedCharacter();

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(120, container.clientWidth);
      const h = Math.max(90, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animFrameId = 0;
    let stopped = false;
    let pacingTimer: ReturnType<typeof setTimeout> | null = null;
    const clock = new THREE.Clock();

    const afterDraw = () => {
      if (stopped) return;
      if (isSoftwareGl) {
        gl.finish();
        pacingTimer = setTimeout(() => {
          if (!stopped) animFrameId = requestAnimationFrame(animate);
        }, 140);
      } else {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      syncSelectedCharacter();

      if (stateRef.current.pokeImpulse > 0) {
        stateRef.current.pokeImpulse = Math.max(
          0,
          stateRef.current.pokeImpulse - dt * 2.2
        );
      }

      if (stateRef.current.autoRotate) {
        turntableGroup.rotation.y = Math.sin(elapsed * 0.75) * 0.38;
      }

      if (activeRig) {
        const frame = computeCharacterKinematics(
          stateRef.current.pose,
          elapsed,
          1.0,
          1.05,
          stateRef.current.pokeImpulse
        );
        applyKinematicsToRig(activeRig, frame);
        animateEquipmentOnRig(activeRig, elapsed);
      }

      controls.update();
      renderer.render(scene, camera);
      afterDraw();
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrameId);
      if (pacingTimer) clearTimeout(pacingTimer);
      resizeObserver.disconnect();
      controls.dispose();
      for (const rig of rigCache.values()) {
        rig.dispose();
      }
      rigCache.clear();
      plinthBaseGeo.dispose();
      plinthBaseMat.dispose();
      plinthTopGeo.dispose();
      plinthTopMat.dispose();
      studGeo.dispose();
      studMat.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[120px] flex-1 bg-gradient-to-b from-[#2B2118] via-[#3A2C20] to-[#2B2118] border-2 sm:border-3 border-[#2B2118] rounded-2xl sm:rounded-3xl p-2 sm:p-3 flex flex-col justify-between shadow-inner overflow-hidden">
      {/* Subtle Radial Spotlight Behind the 3D Model */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35 transition-colors duration-300"
        style={{
          background: `radial-gradient(circle at 50% 48%, ${character.primaryHex} 0%, transparent 68%)`,
        }}
      />

      {/* Top Overlay: Character Number, Name & Accessory Badge */}
      <div className="relative z-10 flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-[#1A130D]">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>#{character.index + 1} · 3D LIVE STAGE</span>
          </div>
          <h3 className="mt-0.5 text-sm sm:text-lg font-black text-[#FFFDF9] leading-tight drop-shadow truncate">
            {character.name}
          </h3>
          <p className="hidden sm:block text-[11px] font-bold text-[#FDE047] leading-snug truncate">
            {character.accessory}
          </p>
        </div>

        {/* Turntable Auto-Sway Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          title="Toggle Auto-Sway / Drag 3D Model to Rotate"
          className={`p-1 sm:p-1.5 rounded-xl border-2 text-[10px] font-black flex items-center gap-1 transition-colors shrink-0 ${
            autoRotate
              ? 'bg-[#84CC16] text-[#2B2118] border-[#1A130D]'
              : 'bg-[#1A130D]/80 text-[#F3E8D6] border-white/20 hover:bg-[#423326]'
          }`}
        >
          <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">360°</span>
        </button>
      </div>

      {/* Center Interactive 3D Character Canvas */}
      <div
        ref={mountRef}
        onClick={() => setCheerCount((c) => c + 1)}
        title="Drag to rotate 3D model · Click to cheer!"
        className="relative z-10 flex-1 w-full min-h-[75px]"
      />

      {/* Bottom Overlay: Pose Switcher Pills (Default: Cool Hero Pose!) */}
      <div className="relative z-10 flex items-center justify-between gap-1.5 pt-1 border-t border-white/15 shrink-0">
        <span className="text-[9px] sm:text-[10px] font-extrabold text-[#E5D9C5] uppercase tracking-wider">
          Pose:
        </span>
        <div className="flex items-center gap-1">
          {[
            { id: 'cool' as const, label: 'COOL POSE' },
            { id: 'jump' as const, label: 'HAPPY HOP' },
            { id: 'run' as const, label: 'SPRINT' },
          ].map((p) => {
            const active = previewPose === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPreviewPose(p.id);
                  setCheerCount((c) => c + 1);
                }}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black border transition-colors ${
                  active
                    ? 'bg-[#FDE047] text-[#2B2118] border-[#1A130D] shadow'
                    : 'bg-[#1A130D]/75 text-[#F3E8D6] border-white/15 hover:bg-[#3A2C20]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
