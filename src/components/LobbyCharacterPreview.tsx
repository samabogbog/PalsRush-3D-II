import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RotateCw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
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
  const zoomDeltaRef = useRef<number>(0);

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
      alpha: false,
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
    renderer.toneMappingExposure = 1.02;
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

    // Pure open white studio background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Camera framed on the character standing on open white ground with slight zoom in/out support
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);
    camera.position.set(0, 1.85, 5.65);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.7;
    controls.minDistance = 3.9;
    controls.maxDistance = 7.8;
    controls.minPolarAngle = Math.PI * 0.26;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 1.02, 0);
    controls.update();

    // Soft Diffused White Studio Lighting for Gentle, Subtle Shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf1f5f9, 0.95);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffdf9, 1.15);
    keyLight.position.set(3.6, 8.2, 5.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    const d = 2.8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf0f9ff, 0.55);
    fillLight.position.set(-4.2, 4.8, -3.5);
    scene.add(fillLight);

    // Open White Floor with Soft Subtle Shadow Catcher (No Pedestal!)
    const shadowFloorGeo = new THREE.PlaneGeometry(24, 24);
    shadowFloorGeo.rotateX(-Math.PI / 2);
    const shadowFloorMat = new THREE.ShadowMaterial({
      opacity: 0.13,
      color: 0x1e293b,
    });
    const shadowFloorMesh = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
    shadowFloorMesh.position.y = 0.001;
    shadowFloorMesh.receiveShadow = true;
    scene.add(shadowFloorMesh);

    const turntableGroup = new THREE.Group();
    scene.add(turntableGroup);

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
          turntableGroup.remove(activeRig.contactShadow);
        }
        activeRig = ensureCharacterRig(targetSpec);
        activeCharId = targetSpec.id;
        turntableGroup.add(activeRig.rootGroup);
        turntableGroup.add(activeRig.contactShadow);
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
    const zoomDirVec = new THREE.Vector3();

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

      if (zoomDeltaRef.current !== 0) {
        const curDist = camera.position.distanceTo(controls.target);
        const nextDist = Math.max(
          controls.minDistance,
          Math.min(controls.maxDistance, curDist + zoomDeltaRef.current)
        );
        zoomDirVec.subVectors(camera.position, controls.target).normalize();
        camera.position.copy(controls.target).addScaledVector(zoomDirVec, nextDist);
        zoomDeltaRef.current = 0;
      }

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
        // Keep the contact shadow subtle and soft on the pure white floor
        frame.shadowOpacity *= 0.42;
        frame.shadowScale *= 1.08;
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
      shadowFloorGeo.dispose();
      shadowFloorMat.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[110px] flex-1 bg-white border-2 sm:border-3 border-[#2B2118] rounded-2xl sm:rounded-3xl shadow-inner overflow-hidden">
      {/* Full-Bleed Interactive 3D Character Canvas on Pure White Ground */}
      <div
        ref={mountRef}
        onClick={() => setCheerCount((c) => c + 1)}
        title="Drag to rotate · Scroll/Pinch to zoom · Click to cheer!"
        className="absolute inset-0 z-0 w-full h-full bg-white"
      />

      {/* Top Floating Overlay: Character Number, Name, Zoom +/- & 360° Toggle */}
      <div className="pointer-events-none absolute top-2 inset-x-2.5 z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 bg-white/90 backdrop-blur-xs border-2 border-[#2B2118] rounded-xl px-2.5 py-1 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#F59E0B] text-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              <span>#{character.index + 1}</span>
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#2B2118] leading-tight truncate">
              {character.name}
            </h3>
          </div>
          <p className="hidden md:block text-[10px] font-bold text-[#6E5844] leading-snug truncate mt-0.5">
            {character.accessory}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              zoomDeltaRef.current = -0.55;
            }}
            title="Zoom In"
            aria-label="Zoom In 3D Model"
            className="p-1.5 rounded-xl border-2 border-[#2B2118] bg-white/90 hover:bg-[#FEF3C7] text-[#2B2118] shadow-xs transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              zoomDeltaRef.current = 0.55;
            }}
            title="Zoom Out"
            aria-label="Zoom Out 3D Model"
            className="p-1.5 rounded-xl border-2 border-[#2B2118] bg-white/90 hover:bg-[#FEF3C7] text-[#2B2118] shadow-xs transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {/* Turntable Auto-Sway Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Auto-Sway / Drag 3D Model to Rotate"
            className={`px-2 py-1 rounded-xl border-2 text-[10px] font-black flex items-center gap-1 transition-colors shrink-0 shadow-xs cursor-pointer ${
              autoRotate
                ? 'bg-[#84CC16] text-[#2B2118] border-[#2B2118]'
                : 'bg-white/90 text-[#2B2118] border-[#2B2118] hover:bg-[#F5EDE0]'
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>360°</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Overlay: Pose Switcher Pills */}
      <div className="pointer-events-none absolute bottom-2 inset-x-2.5 z-10 flex items-center justify-center">
        <div className="pointer-events-auto inline-flex items-center gap-1 bg-white/90 backdrop-blur-xs border-2 border-[#2B2118] rounded-xl p-1 shadow-sm">
          {[
            { id: 'cool' as const, label: 'COOL' },
            { id: 'jump' as const, label: 'HOP' },
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
                className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FDE047] text-[#2B2118] border-[#2B2118] shadow-2xs'
                    : 'bg-transparent text-[#5A4635] border-transparent hover:bg-[#F5EDE0]'
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
