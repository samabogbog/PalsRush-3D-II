import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  AnimationPose,
  CHARACTERS,
  computeCharacterKinematics,
} from '../models/characterTypes';
import {
  applyKinematicsToRig,
  buildProceduralCharacter,
  CharacterRig,
  createContactShadowTexture,
} from '../models/proceduralBlocks';

export interface ChibiStageCanvasProps {
  selectedIndex: number;
  sliderPosition: number;
  pose: AnimationPose;
  speedMultiplier: number;
  bounceIntensity: number;
  showAllLineup: boolean;
  wireframe: boolean;
  autoTurntable: boolean;
  pokeTriggerCount: number;
  onSelectCharacter: (index: number) => void;
  onPokeCharacter: () => void;
}

const SINGLE_VIEW_SPACING = 8.4;
const GRID_COL_SPACING = 3.45;
const GRID_ROW_Y_STEP = 2.05;
const GRID_ROW_Z_STEP = 2.05;

export const ChibiStageCanvas: React.FC<ChibiStageCanvasProps> = ({
  selectedIndex,
  sliderPosition,
  pose,
  speedMultiplier,
  bounceIntensity,
  showAllLineup,
  wireframe,
  autoTurntable,
  pokeTriggerCount,
  onSelectCharacter,
  onPokeCharacter,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    selectedIndex,
    sliderPosition,
    pose,
    speedMultiplier,
    bounceIntensity,
    showAllLineup,
    wireframe,
    autoTurntable,
    pokeImpulse: 0,
  });

  useEffect(() => {
    stateRef.current.selectedIndex = selectedIndex;
    stateRef.current.sliderPosition = sliderPosition;
    stateRef.current.pose = pose;
    stateRef.current.speedMultiplier = speedMultiplier;
    stateRef.current.bounceIntensity = bounceIntensity;
    stateRef.current.showAllLineup = showAllLineup;
    stateRef.current.wireframe = wireframe;
    stateRef.current.autoTurntable = autoTurntable;
  }, [
    selectedIndex,
    sliderPosition,
    pose,
    speedMultiplier,
    bounceIntensity,
    showAllLineup,
    wireframe,
    autoTurntable,
  ]);

  useEffect(() => {
    if (pokeTriggerCount > 0) {
      stateRef.current.pokeImpulse = 1.0;
    }
  }, [pokeTriggerCount]);

  const callbacksRef = useRef({ onSelectCharacter, onPokeCharacter });
  useEffect(() => {
    callbacksRef.current = { onSelectCharacter, onPokeCharacter };
  }, [onSelectCharacter, onPokeCharacter]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.setAttribute('data-testid', 'chibi-3d-canvas');
    renderer.domElement.className = 'w-full h-full block cursor-grab active:cursor-grabbing outline-none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Scene, Studio Environment & Pure White Open Atmosphere
    const scene = new THREE.Scene();
    const bgHex = 0xffffff;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.008);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.34;
    pmremGenerator.dispose();

    // 3. Camera & OrbitControls (Slight Zoom In/Out enabled)
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 120);
    camera.position.set(0, 2.05, 6.15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.75;
    controls.minDistance = 4.2;
    controls.maxDistance = 8.8;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 1.05, 0);
    controls.update();

    // 4. Soft Diffused White Studio Lighting Rig (Gentle, Subtle Shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.62);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf1f5f9, 0.92);
    hemiLight.position.set(0, 14, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffdf9, 1.15);
    keyLight.position.set(5.2, 11.5, 8.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 35;
    const d = 11.0;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf0f9ff, 0.48);
    rimLight.position.set(-6.0, 5.5, -6.0);
    scene.add(rimLight);

    // 5. Open Pure White Studio Floor with Soft Shadow Catcher (No Pedestals!)
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.ShadowMaterial({
      opacity: 0.13,
      color: 0x1e293b,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = 0.001;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    const shadowTex = createContactShadowTexture();
    const rigs: CharacterRig[] = [];
    const slotGroups: THREE.Group[] = [];

    CHARACTERS.forEach((spec, idx) => {
      const slotGroup = new THREE.Group();
      slotGroup.position.set(idx * SINGLE_VIEW_SPACING, 0, 0);
      carouselGroup.add(slotGroup);
      slotGroups.push(slotGroup);

      const rig = buildProceduralCharacter(spec.id, shadowTex);
      slotGroup.add(rig.rootGroup);
      slotGroup.add(rig.contactShadow);
      rigs.push(rig);
    });

    // 6. Joyful Chibi Block Dust/Sparkle Puffs
    const puffGeo = new RoundedBoxGeometry(0.11, 0.11, 0.11, 2, 0.035);
    const puffMat = new THREE.MeshStandardMaterial({
      color: 0xfff9f0,
      roughness: 0.5,
      metalness: 0.0,
    });
    const PUFF_COUNT = 24;
    const puffInstanced = new THREE.InstancedMesh(puffGeo, puffMat, PUFF_COUNT);
    puffInstanced.frustumCulled = false;
    scene.add(puffInstanced);

    const _dummy = new THREE.Object3D();
    const _color = new THREE.Color();
    const puffPalette = [0xf4ba44, 0xf08b7e, 0x8aa678, 0xdf655a, 0xffffff];
    for (let i = 0; i < PUFF_COUNT; i++) {
      _color.setHex(puffPalette[i % puffPalette.length]);
      puffInstanced.setColorAt(i, _color);
    }
    if (puffInstanced.instanceColor) {
      puffInstanced.instanceColor.needsUpdate = true;
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Pointer interaction
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);

      for (let i = 0; i < rigs.length; i++) {
        const hits = raycaster.intersectObject(rigs[i].rootGroup, true);
        if (hits.length > 0) {
          if (i !== stateRef.current.selectedIndex || stateRef.current.showAllLineup) {
            callbacksRef.current.onSelectCharacter(i);
          } else {
            stateRef.current.pokeImpulse = 1.0;
            callbacksRef.current.onPokeCharacter();
          }
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);

    // 8. Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let currentCarouselX = -stateRef.current.sliderPosition * SINGLE_VIEW_SPACING;
    let currentCamDist = 6.35;
    let lastShowAll = stateRef.current.showAllLineup;
    let zoomTransitionActive = false;
    let turntableAngle = 0;
    let lastWireframe = false;
    const _camDir = new THREE.Vector3();

    controls.addEventListener('start', () => {
      zoomTransitionActive = false;
    });

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      if (st.pokeImpulse > 0) {
        st.pokeImpulse = Math.max(0, st.pokeImpulse - dt * 2.4);
      }

      pointer.x = THREE.MathUtils.damp(pointer.x, pointer.targetX, 8, dt);
      pointer.y = THREE.MathUtils.damp(pointer.y, pointer.targetY, 8, dt);

      if (st.wireframe !== lastWireframe) {
        lastWireframe = st.wireframe;
        rigs.forEach((r) => {
          r.rootGroup.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mat = (obj as THREE.Mesh).material;
              if (mat && 'wireframe' in mat) {
                (mat as THREE.MeshStandardMaterial).wireframe = st.wireframe;
              }
            }
          });
        });
      }

      // Smoothly interpolate each slot between 1D Single-View Carousel and 4x4 Tiered Showcase Grid
      slotGroups.forEach((sg, idx) => {
        if (st.showAllLineup) {
          const col = idx % 4;
          const row = Math.floor(idx / 4); // 0 (top row) .. 3 (bottom row)
          const targetX = (col - 1.5) * GRID_COL_SPACING;
          const targetY = (1.5 - row) * GRID_ROW_Y_STEP + 0.85;
          const targetZ = (row - 1.5) * GRID_ROW_Z_STEP;
          sg.position.x = THREE.MathUtils.damp(sg.position.x, targetX, 9.0, dt);
          sg.position.y = THREE.MathUtils.damp(sg.position.y, targetY, 9.0, dt);
          sg.position.z = THREE.MathUtils.damp(sg.position.z, targetZ, 9.0, dt);
        } else {
          const targetX = idx * SINGLE_VIEW_SPACING;
          sg.position.x = THREE.MathUtils.damp(sg.position.x, targetX, 10.0, dt);
          sg.position.y = THREE.MathUtils.damp(sg.position.y, 0, 10.0, dt);
          sg.position.z = THREE.MathUtils.damp(sg.position.z, 0, 10.0, dt);
        }
      });

      floorMesh.visible = !st.showAllLineup;

      const targetCarouselX = st.showAllLineup
        ? 0
        : -st.sliderPosition * SINGLE_VIEW_SPACING;
      currentCarouselX = THREE.MathUtils.damp(currentCarouselX, targetCarouselX, 11.0, dt);
      carouselGroup.position.x = currentCarouselX;

      if (st.showAllLineup !== lastShowAll) {
        lastShowAll = st.showAllLineup;
        zoomTransitionActive = true;
      }

      controls.maxDistance = st.showAllLineup ? 28.0 : 8.8;

      if (zoomTransitionActive) {
        const desiredDist = st.showAllLineup ? 22.8 : 6.15;
        const desiredTargetY = st.showAllLineup ? 1.15 : 1.05;
        controls.target.y = THREE.MathUtils.damp(controls.target.y, desiredTargetY, 7.5, dt);
        currentCamDist = camera.position.distanceTo(controls.target);
        const nextDist = THREE.MathUtils.damp(currentCamDist, desiredDist, 7.5, dt);
        _camDir.subVectors(camera.position, controls.target).normalize();
        if (st.showAllLineup) {
          _camDir.set(0, 0.14, 1).normalize();
        }
        camera.position.copy(controls.target).addScaledVector(_camDir, nextDist);
        if (Math.abs(nextDist - desiredDist) < 0.05) {
          zoomTransitionActive = false;
        }
      }

      if (st.autoTurntable) {
        turntableAngle += dt * 0.75;
      } else {
        turntableAngle = THREE.MathUtils.damp(turntableAngle, 0, 5.0, dt);
      }

      // Animate all 16 characters
      rigs.forEach((rig, idx) => {
        const isSelected = idx === st.selectedIndex;
        const phaseOffset = idx * 0.28;
        const activePose = st.pose;
        const charPoke = isSelected ? st.pokeImpulse : 0;

        const frame = computeCharacterKinematics(
          activePose,
          elapsed + phaseOffset,
          st.speedMultiplier,
          st.bounceIntensity,
          charPoke
        );

        // Soften contact shadow on the pure white floor
        frame.shadowOpacity *= 0.42;
        frame.shadowScale *= 1.08;

        applyKinematicsToRig(
          rig,
          frame,
          isSelected ? pointer.x : pointer.x * 0.35,
          isSelected ? pointer.y : pointer.y * 0.35
        );

        rig.rootGroup.rotation.y = turntableAngle;
      });

      // Animate playful mini-block confetti/dust puffs around the active character
      const activeSlot = slotGroups[st.selectedIndex];
      const activeX = (activeSlot ? activeSlot.position.x : 0) + currentCarouselX;
      const activeY = activeSlot ? activeSlot.position.y : 0;
      const activeZ = activeSlot ? activeSlot.position.z : 0;
      const isEnergetic = st.pose === 'jump' || st.pose === 'run' || st.pokeImpulse > 0.1;
      for (let i = 0; i < PUFF_COUNT; i++) {
        const cycle = (elapsed * st.speedMultiplier * (st.pose === 'run' ? 2.6 : 1.8) + i * 0.17) % 1;
        const angle = (i / PUFF_COUNT) * Math.PI * 2 + elapsed * 0.8;
        const radius = 0.55 + cycle * (st.pose === 'jump' ? 1.15 : 0.85);
        const px = activeX + Math.cos(angle) * radius;
        const pz = activeZ + Math.sin(angle) * radius - (st.pose === 'run' ? cycle * 0.6 : 0);
        const py =
          activeY +
          (isEnergetic
            ? Math.sin(cycle * Math.PI) * (st.pose === 'jump' ? 0.95 : 0.38)
            : 0.02);
        const sc = isEnergetic
          ? Math.sin(cycle * Math.PI) * 0.85 * Math.min(1.3, st.bounceIntensity)
          : 0.0001;

        _dummy.position.set(px, py, pz);
        _dummy.rotation.set(elapsed * 3 + i, elapsed * 2 + i, 0);
        _dummy.scale.setScalar(sc);
        _dummy.updateMatrix();
        puffInstanced.setMatrixAt(i, _dummy.matrix);
      }
      puffInstanced.instanceMatrix.needsUpdate = true;

      if (controls.enableDamping) {
        controls.update();
      }
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      rigs.forEach((r) => r.dispose());
      floorGeo.dispose();
      floorMat.dispose();
      puffGeo.dispose();
      puffMat.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full bg-white select-none overflow-hidden"
      aria-label="Interactive 3D Chibi Block Model Viewport"
    />
  );
};
