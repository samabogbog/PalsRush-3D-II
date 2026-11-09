import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CharacterId, KinematicFrame } from './characterTypes';

export interface CharacterRig {
  id: CharacterId;
  rootGroup: THREE.Group;
  bodyGroup: THREE.Group;
  headPivot: THREE.Group;
  leftEarPivot: THREE.Group;
  rightEarPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  tailPivot: THREE.Group;
  accessoryPivot: THREE.Group;
  leftEyeMesh: THREE.Object3D;
  rightEyeMesh: THREE.Object3D;
  contactShadow: THREE.Mesh;
  dispose: () => void;
}

/**
 * Generates a subtle procedural clay/vinyl micro-grain roughness & bump map
 * so the rounded blocks look like high-craft tactile designer toys.
 */
function createClayGrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 128; x += 2) {
        const v = 118 + Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/**
 * Generates a soft radial alpha shadow texture for grounding the character on the floor.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(62, 42, 28, 0.55)');
    grad.addColorStop(0.55, 'rgba(62, 42, 28, 0.22)');
    grad.addColorStop(1, 'rgba(62, 42, 28, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Helper to create a soft-beveled triangular/pointed rounded block via ExtrudeGeometry.
 */
function createRoundedTriangleGeometry(
  width: number,
  height: number,
  depth: number,
  bevel: number,
  invertY = false
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width * 0.5;
  const hh = height * 0.5;
  if (!invertY) {
    shape.moveTo(-hw, -hh);
    shape.quadraticCurveTo(0, -hh - 0.04, hw, -hh);
    shape.quadraticCurveTo(hw + 0.04, 0, 0, hh);
    shape.quadraticCurveTo(-hw - 0.04, 0, -hw, -hh);
  } else {
    shape.moveTo(-hw, hh);
    shape.quadraticCurveTo(0, hh + 0.03, hw, hh);
    shape.quadraticCurveTo(hw * 0.65, -hh * 0.2, 0, -hh);
    shape.quadraticCurveTo(-hw * 0.65, -hh * 0.2, -hw, hh);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: Math.max(0.02, depth - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
  });
  geo.center();
  return geo;
}

/**
 * Creates a cute 3D 'w' cat/bear smile curve out of two joined TubeGeometry arcs.
 */
function createCuteSmileGroup(
  material: THREE.Material,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T
): THREE.Group {
  const smileGroup = new THREE.Group();

  const leftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.115, 0.015, 0),
    new THREE.Vector3(-0.06, -0.042, 0.01),
    new THREE.Vector3(0.0, 0.01, 0.012),
  ]);
  const rightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.01, 0.012),
    new THREE.Vector3(0.06, -0.042, 0.01),
    new THREE.Vector3(0.115, 0.015, 0),
  ]);

  const leftTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(leftCurve, 12, 0.022, 8, false)),
    material
  );
  const rightTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(rightCurve, 12, 0.022, 8, false)),
    material
  );
  const stemGeo = trackGeo(new RoundedBoxGeometry(0.042, 0.075, 0.042, 2, 0.018));
  const stemMesh = new THREE.Mesh(stemGeo, material);
  stemMesh.position.set(0, 0.038, 0.01);

  smileGroup.add(leftTube, rightTube, stemMesh);
  return smileGroup;
}

/**
 * Creates a simple curved U-arc (for Frog's wide grin or Owl's chest scallop marks).
 */
function createSimpleArcMesh(
  width: number,
  dip: number,
  radius: number,
  material: THREE.Material,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width * 0.5, 0.02, 0),
    new THREE.Vector3(0, -dip, 0.015),
    new THREE.Vector3(width * 0.5, 0.02, 0),
  ]);
  return new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(curve, 14, radius, 8, false)),
    material
  );
}

/**
 * Creates a cute 3-part rounded-block bow tie (used by Cat, Sheep, and Duck).
 */
function createBowTieGroup(
  mat: THREE.Material,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T
): THREE.Group {
  const g = new THREE.Group();
  const wingGeo = trackGeo(new RoundedBoxGeometry(0.24, 0.21, 0.12, 3, 0.065));
  const knotGeo = trackGeo(new RoundedBoxGeometry(0.13, 0.14, 0.14, 3, 0.05));

  const leftWing = new THREE.Mesh(wingGeo, mat);
  leftWing.position.set(-0.14, 0, 0);
  leftWing.rotation.z = 0.16;
  leftWing.castShadow = true;

  const rightWing = new THREE.Mesh(wingGeo, mat);
  rightWing.position.set(0.14, 0, 0);
  rightWing.rotation.z = -0.16;
  rightWing.castShadow = true;

  const knot = new THREE.Mesh(knotGeo, mat);
  knot.position.set(0, 0, 0.02);
  knot.castShadow = true;

  g.add(leftWing, rightWing, knot);
  return g;
}

/**
 * Builds any of the 16 chibi rounded-block characters from the reference sheet.
 */
export function buildProceduralCharacter(
  id: CharacterId,
  shadowTexture: THREE.CanvasTexture
): CharacterRig {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const clayBump = createClayGrainTexture();

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Material factory with calibrated roughness differences (>= 0.25 between matte clay, fabric, and satin features)
  const makeClayMat = (hex: string, roughness = 0.78, clearcoat = 0.03) =>
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex),
        roughness,
        metalness: 0.0,
        clearcoat,
        clearcoatRoughness: 0.65,
        bumpMap: clayBump,
        bumpScale: 0.005,
      })
    );

  const makeFabricMat = (hex: string) =>
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex),
        roughness: 0.9,
        metalness: 0.0,
        sheen: 0.25,
        sheenRoughness: 0.85,
        sheenColor: new THREE.Color('#fff5e6'),
        bumpMap: clayBump,
        bumpScale: 0.01,
      })
    );

  const makeGlossyFeatureMat = (hex: string) =>
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex),
        roughness: 0.32,
        metalness: 0.02,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
      })
    );

  const blushMat = makeClayMat('#ED8477', 0.75, 0.04);
  const darkFeatureMat = makeGlossyFeatureMat('#2E1C16');

  // Root hierarchy
  const rootGroup = new THREE.Group();
  rootGroup.name = `character_${id}`;

  // Contact shadow on ground plane
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(2.35, 2.05));
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.set(0, 0.015, 0);

  const bodyGroup = new THREE.Group();
  rootGroup.add(bodyGroup);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.0, 0);
  bodyGroup.add(headPivot);

  const leftEarPivot = new THREE.Group();
  leftEarPivot.position.set(-0.58, 1.22, -0.04);
  headPivot.add(leftEarPivot);

  const rightEarPivot = new THREE.Group();
  rightEarPivot.position.set(0.58, 1.22, -0.04);
  headPivot.add(rightEarPivot);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.6, 0.78, 0.02);
  bodyGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.6, 0.78, 0.02);
  bodyGroup.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.31, 0.38, 0.02);
  bodyGroup.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.31, 0.38, 0.02);
  bodyGroup.add(rightLegPivot);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.42, -0.44);
  bodyGroup.add(tailPivot);

  const accessoryPivot = new THREE.Group();
  accessoryPivot.position.set(0, 0.96, 0.48);
  bodyGroup.add(accessoryPivot);

  // Shared core geometries (all soft rounded boxes!)
  const headGeo = trackGeo(new RoundedBoxGeometry(1.78, 1.32, 1.28, 6, 0.34));
  const torsoGeo = trackGeo(new RoundedBoxGeometry(1.16, 0.86, 0.92, 5, 0.26));
  const armGeo = trackGeo(new RoundedBoxGeometry(0.34, 0.54, 0.36, 4, 0.15));
  const legGeo = trackGeo(new RoundedBoxGeometry(0.45, 0.44, 0.5, 4, 0.16));
  const footPadGeo = trackGeo(new RoundedBoxGeometry(0.38, 0.1, 0.44, 3, 0.04));

  // Crisp, clean dark oval eyes matching the reference illustration
  const eyeGeo = trackGeo(new RoundedBoxGeometry(0.145, 0.225, 0.08, 4, 0.068));

  const buildEyeUnit = (): THREE.Group => {
    const g = new THREE.Group();
    const eyeMesh = new THREE.Mesh(eyeGeo, darkFeatureMat);
    eyeMesh.castShadow = true;
    g.add(eyeMesh);
    return g;
  };

  const leftEyeGroup = buildEyeUnit();
  const rightEyeGroup = buildEyeUnit();
  headPivot.add(leftEyeGroup, rightEyeGroup);

  // Blush cheeks
  const cheekGeo = trackGeo(new RoundedBoxGeometry(0.22, 0.15, 0.07, 3, 0.065));
  const leftCheek = new THREE.Mesh(cheekGeo, blushMat);
  const rightCheek = new THREE.Mesh(cheekGeo, blushMat);
  headPivot.add(leftCheek, rightCheek);

  // Nose & cute 'w' mouth (characters without a standard nose/mouth can hide or reposition them)
  const noseGeo = trackGeo(new RoundedBoxGeometry(0.15, 0.105, 0.08, 3, 0.045));
  const noseMesh = new THREE.Mesh(noseGeo, darkFeatureMat);
  const smileGroup = createCuteSmileGroup(darkFeatureMat, trackGeo);
  headPivot.add(noseMesh, smileGroup);

  // Helper to attach standard arms & legs flush against the sides of the torso
  const addStandardLimbs = (armMaterial: THREE.Material, legMaterial = armMaterial) => {
    const lArm = new THREE.Mesh(armGeo, armMaterial);
    lArm.position.set(-0.15, -0.18, 0);
    lArm.rotation.z = -0.05;
    lArm.castShadow = true;
    leftArmPivot.add(lArm);

    const rArm = new THREE.Mesh(armGeo, armMaterial);
    rArm.position.set(0.15, -0.18, 0);
    rArm.rotation.z = 0.05;
    rArm.castShadow = true;
    rightArmPivot.add(rArm);

    const lLeg = new THREE.Mesh(legGeo, legMaterial);
    lLeg.position.set(0, -0.16, 0);
    lLeg.castShadow = true;
    leftLegPivot.add(lLeg);

    const rLeg = new THREE.Mesh(legGeo, legMaterial);
    rLeg.position.set(0, -0.16, 0);
    rLeg.castShadow = true;
    rightLegPivot.add(rLeg);
  };

  // Helper for 2-to-3-block centered tail angled diagonally upward from the back
  const addCenteredUpwardTail = (
    segSizes: number[],
    segMaterials: THREE.Material[]
  ) => {
    const tailGroup = new THREE.Group();
    const stepCoords: [number, number, number][] = [
      [0.1, -0.15, 0.65],
      [0.28, -0.34, 0.76],
      [0.48, -0.52, 0.86],
    ];
    const count = Math.min(3, segSizes.length);
    for (let i = 0; i < count; i++) {
      const s = segSizes[i];
      const segGeo = trackGeo(
        new RoundedBoxGeometry(s, s * 0.9, s * 0.96, 4, s * 0.36)
      );
      const mat = segMaterials[i % segMaterials.length];
      const seg = new THREE.Mesh(segGeo, mat);
      const [ty, tz, rx] = stepCoords[i];
      seg.position.set(0, ty, tz);
      seg.rotation.set(rx, 0, 0);
      seg.castShadow = true;
      tailGroup.add(seg);
    }
    tailPivot.add(tailGroup);
  };

  let useStandardFootPads = true;

  // ========================================================================
  // 01. BRAMBLE BEAR (Warm Caramel Brown + Golden Scarf)
  // ========================================================================
  if (id === 'bear') {
    const furMat = makeClayMat('#B56E3E', 0.78);
    const creamMat = makeClayMat('#F3D8B6', 0.74);
    const innerEarMat = makeClayMat('#DCA372', 0.78);
    const scarfMat = makeFabricMat('#F0AE34');

    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    const earOuterGeo = trackGeo(new RoundedBoxGeometry(0.54, 0.54, 0.34, 4, 0.21));
    const earInnerGeo = trackGeo(new RoundedBoxGeometry(0.32, 0.32, 0.1, 3, 0.12));

    const lEar = new THREE.Mesh(earOuterGeo, furMat);
    lEar.position.set(0, 0.12, 0);
    lEar.castShadow = true;
    const lEarIn = new THREE.Mesh(earInnerGeo, innerEarMat);
    lEarIn.position.set(0, 0.1, 0.14);
    leftEarPivot.add(lEar, lEarIn);

    const rEar = new THREE.Mesh(earOuterGeo, furMat);
    rEar.position.set(0, 0.12, 0);
    rEar.castShadow = true;
    const rEarIn = new THREE.Mesh(earInnerGeo, innerEarMat);
    rEarIn.position.set(0, 0.1, 0.14);
    rightEarPivot.add(rEar, rEarIn);

    const snoutGeo = trackGeo(new RoundedBoxGeometry(0.62, 0.44, 0.2, 4, 0.15));
    const snoutMesh = new THREE.Mesh(snoutGeo, creamMat);
    snoutMesh.position.set(0, 0.43, 0.6);
    snoutMesh.castShadow = true;
    headPivot.add(snoutMesh);

    leftEyeGroup.position.set(-0.42, 0.56, 0.63);
    rightEyeGroup.position.set(0.42, 0.56, 0.63);
    leftCheek.position.set(-0.55, 0.38, 0.62);
    rightCheek.position.set(0.55, 0.38, 0.62);
    noseMesh.position.set(0, 0.51, 0.7);
    smileGroup.position.set(0, 0.39, 0.69);

    const torsoMesh = new THREE.Mesh(torsoGeo, furMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const bellyGeo = trackGeo(new RoundedBoxGeometry(0.64, 0.54, 0.14, 4, 0.15));
    const bellyMesh = new THREE.Mesh(bellyGeo, creamMat);
    bellyMesh.position.set(0, 0.57, 0.42);
    bodyGroup.add(bellyMesh);

    const scarfRingGeo = trackGeo(new RoundedBoxGeometry(1.26, 0.24, 1.02, 4, 0.1));
    const scarfRing = new THREE.Mesh(scarfRingGeo, scarfMat);
    scarfRing.position.set(0, 0.98, 0.02);
    scarfRing.castShadow = true;
    bodyGroup.add(scarfRing);

    const scarfTailGeo = trackGeo(new RoundedBoxGeometry(0.31, 0.44, 0.2, 4, 0.08));
    const scarfTail = new THREE.Mesh(scarfTailGeo, scarfMat);
    scarfTail.position.set(0.24, -0.14, 0.02);
    scarfTail.rotation.z = -0.06;
    scarfTail.castShadow = true;
    accessoryPivot.add(scarfTail);

    addStandardLimbs(furMat);
    addCenteredUpwardTail([0.28, 0.24], [furMat, furMat]);
  }

  // ========================================================================
  // 02. MOCHI PANDA (Cream + Charcoal Patches + Sage Bandana)
  // ========================================================================
  if (id === 'panda') {
    const creamMat = makeClayMat('#F2EAE0', 0.75);
    const charcoalMat = makeClayMat('#3D3532', 0.8);
    const bandanaMat = makeFabricMat('#7E9B6B');

    const headMesh = new THREE.Mesh(headGeo, creamMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    const earGeo = trackGeo(new RoundedBoxGeometry(0.54, 0.52, 0.34, 4, 0.2));
    const lEar = new THREE.Mesh(earGeo, charcoalMat);
    lEar.position.set(-0.02, 0.12, 0);
    lEar.rotation.z = 0.12;
    lEar.castShadow = true;
    leftEarPivot.add(lEar);

    const rEar = new THREE.Mesh(earGeo, charcoalMat);
    rEar.position.set(0.02, 0.12, 0);
    rEar.rotation.z = -0.12;
    rEar.castShadow = true;
    rightEarPivot.add(rEar);

    const patchGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.52, 0.1, 4, 0.18));
    const leftPatch = new THREE.Mesh(patchGeo, charcoalMat);
    leftPatch.position.set(-0.41, 0.53, 0.61);
    leftPatch.rotation.z = -0.22;
    headPivot.add(leftPatch);

    const rightPatch = new THREE.Mesh(patchGeo, charcoalMat);
    rightPatch.position.set(0.41, 0.53, 0.61);
    rightPatch.rotation.z = 0.22;
    headPivot.add(rightPatch);

    leftEyeGroup.position.set(-0.39, 0.56, 0.65);
    rightEyeGroup.position.set(0.39, 0.56, 0.65);
    leftCheek.position.set(-0.52, 0.36, 0.65);
    rightCheek.position.set(0.52, 0.36, 0.65);
    noseMesh.position.set(0, 0.49, 0.66);
    smileGroup.position.set(0, 0.38, 0.65);

    const torsoMesh = new THREE.Mesh(torsoGeo, creamMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const shoulderBandGeo = trackGeo(new RoundedBoxGeometry(1.18, 0.32, 0.94, 4, 0.12));
    const shoulderBand = new THREE.Mesh(shoulderBandGeo, charcoalMat);
    shoulderBand.position.set(0, 0.88, 0);
    bodyGroup.add(shoulderBand);

    const collarGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.16, 0.98, 4, 0.07));
    const collarMesh = new THREE.Mesh(collarGeo, bandanaMat);
    collarMesh.position.set(0, 0.99, 0.02);
    bodyGroup.add(collarMesh);

    const bibGeo = trackGeo(createRoundedTriangleGeometry(0.76, 0.46, 0.16, 0.05, true));
    const bibMesh = new THREE.Mesh(bibGeo, bandanaMat);
    bibMesh.position.set(0, -0.12, 0.0);
    bibMesh.rotation.x = 0.12;
    bibMesh.castShadow = true;
    accessoryPivot.add(bibMesh);

    addStandardLimbs(charcoalMat);
    addCenteredUpwardTail([0.26, 0.23], [creamMat, creamMat]);
  }

  // ========================================================================
  // 03. RUSTY RED PANDA (Ginger + Cream Mask + Coral Scarf + Striped Tail)
  // ========================================================================
  if (id === 'red_panda') {
    const gingerMat = makeClayMat('#D4652B', 0.76);
    const creamMat = makeClayMat('#F6E2C8', 0.72);
    const cocoaMat = makeClayMat('#5E321D', 0.8);
    const scarfMat = makeFabricMat('#D9584E');

    const headMesh = new THREE.Mesh(headGeo, gingerMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    const outerEarGeo = trackGeo(createRoundedTriangleGeometry(0.56, 0.56, 0.28, 0.08, false));
    const innerEarGeo = trackGeo(createRoundedTriangleGeometry(0.32, 0.34, 0.1, 0.03, false));

    const lEarOuter = new THREE.Mesh(outerEarGeo, creamMat);
    lEarOuter.position.set(-0.02, 0.14, 0);
    lEarOuter.rotation.z = 0.22;
    lEarOuter.castShadow = true;
    const lEarInner = new THREE.Mesh(innerEarGeo, gingerMat);
    lEarInner.position.set(-0.01, 0.11, 0.11);
    lEarInner.rotation.z = 0.22;
    leftEarPivot.add(lEarOuter, lEarInner);

    const rEarOuter = new THREE.Mesh(outerEarGeo, creamMat);
    rEarOuter.position.set(0.02, 0.14, 0);
    rEarOuter.rotation.z = -0.22;
    rEarOuter.castShadow = true;
    const rEarInner = new THREE.Mesh(innerEarGeo, gingerMat);
    rEarInner.position.set(0.01, 0.11, 0.11);
    rEarInner.rotation.z = -0.22;
    rightEarPivot.add(rEarOuter, rEarInner);

    const browGeo = trackGeo(new RoundedBoxGeometry(0.21, 0.13, 0.08, 3, 0.05));
    const leftBrow = new THREE.Mesh(browGeo, creamMat);
    leftBrow.position.set(-0.31, 0.77, 0.62);
    leftBrow.rotation.z = 0.18;
    const rightBrow = new THREE.Mesh(browGeo, creamMat);
    rightBrow.position.set(0.31, 0.77, 0.62);
    rightBrow.rotation.z = -0.18;
    headPivot.add(leftBrow, rightBrow);

    const cheekPatchGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.44, 0.12, 4, 0.15));
    const leftMaskPatch = new THREE.Mesh(cheekPatchGeo, creamMat);
    leftMaskPatch.position.set(-0.5, 0.41, 0.59);
    leftMaskPatch.rotation.z = -0.12;
    const rightMaskPatch = new THREE.Mesh(cheekPatchGeo, creamMat);
    rightMaskPatch.position.set(0.5, 0.41, 0.59);
    rightMaskPatch.rotation.z = 0.12;
    headPivot.add(leftMaskPatch, rightMaskPatch);

    const snoutGeo = trackGeo(new RoundedBoxGeometry(0.6, 0.45, 0.22, 4, 0.15));
    const snoutMesh = new THREE.Mesh(snoutGeo, creamMat);
    snoutMesh.position.set(0, 0.42, 0.6);
    snoutMesh.castShadow = true;
    headPivot.add(snoutMesh);

    leftEyeGroup.position.set(-0.39, 0.56, 0.64);
    rightEyeGroup.position.set(0.39, 0.56, 0.64);
    leftCheek.position.set(-0.55, 0.35, 0.65);
    rightCheek.position.set(0.55, 0.35, 0.65);
    noseMesh.position.set(0, 0.5, 0.71);
    smileGroup.position.set(0, 0.38, 0.7);

    const torsoMesh = new THREE.Mesh(torsoGeo, cocoaMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const scarfRingGeo = trackGeo(new RoundedBoxGeometry(1.26, 0.23, 1.02, 4, 0.1));
    const scarfRing = new THREE.Mesh(scarfRingGeo, scarfMat);
    scarfRing.position.set(0, 0.98, 0.02);
    scarfRing.castShadow = true;
    bodyGroup.add(scarfRing);

    const scarfTailGeo = trackGeo(new RoundedBoxGeometry(0.32, 0.45, 0.2, 4, 0.08));
    const scarfTail = new THREE.Mesh(scarfTailGeo, scarfMat);
    scarfTail.position.set(0.14, -0.15, 0.02);
    scarfTail.castShadow = true;
    accessoryPivot.add(scarfTail);

    addStandardLimbs(cocoaMat);
    addCenteredUpwardTail([0.38, 0.42, 0.36], [gingerMat, cocoaMat, gingerMat]);
  }

  // ========================================================================
  // 04. BANDIT RACCOON (Taupe-Grey + Bandit Mask + Blue Buttoned Vest)
  // ========================================================================
  if (id === 'raccoon') {
    const taupeMat = makeClayMat('#9C8778', 0.78);
    const creamMat = makeClayMat('#F4E6D6', 0.72);
    const maskMat = makeClayMat('#3E3632', 0.8);
    const vestMat = makeFabricMat('#465F82');
    const buttonMat = makeClayMat('#F3DEC0', 0.45, 0.25);

    const headMesh = new THREE.Mesh(headGeo, taupeMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    const outerEarGeo = trackGeo(createRoundedTriangleGeometry(0.56, 0.56, 0.28, 0.08, false));
    const innerEarGeo = trackGeo(createRoundedTriangleGeometry(0.32, 0.34, 0.1, 0.03, false));

    const lEarOuter = new THREE.Mesh(outerEarGeo, creamMat);
    lEarOuter.position.set(-0.02, 0.14, 0);
    lEarOuter.rotation.z = 0.2;
    lEarOuter.castShadow = true;
    const lEarInner = new THREE.Mesh(innerEarGeo, maskMat);
    lEarInner.position.set(-0.01, 0.11, 0.11);
    lEarInner.rotation.z = 0.2;
    leftEarPivot.add(lEarOuter, lEarInner);

    const rEarOuter = new THREE.Mesh(outerEarGeo, creamMat);
    rEarOuter.position.set(0.02, 0.14, 0);
    rEarOuter.rotation.z = -0.2;
    rEarOuter.castShadow = true;
    const rEarInner = new THREE.Mesh(innerEarGeo, maskMat);
    rEarInner.position.set(0.01, 0.11, 0.11);
    rEarInner.rotation.z = -0.2;
    rightEarPivot.add(rEarOuter, rEarInner);

    const maskOutlineGeo = trackGeo(new RoundedBoxGeometry(0.66, 0.56, 0.1, 4, 0.16));
    const leftOutline = new THREE.Mesh(maskOutlineGeo, creamMat);
    leftOutline.position.set(-0.43, 0.49, 0.6);
    leftOutline.rotation.z = 0.12;
    const rightOutline = new THREE.Mesh(maskOutlineGeo, creamMat);
    rightOutline.position.set(0.43, 0.49, 0.6);
    rightOutline.rotation.z = -0.12;
    headPivot.add(leftOutline, rightOutline);

    const banditPatchGeo = trackGeo(new RoundedBoxGeometry(0.52, 0.44, 0.11, 4, 0.14));
    const leftBandit = new THREE.Mesh(banditPatchGeo, maskMat);
    leftBandit.position.set(-0.42, 0.5, 0.63);
    leftBandit.rotation.z = 0.12;
    const rightBandit = new THREE.Mesh(banditPatchGeo, maskMat);
    rightBandit.position.set(0.42, 0.5, 0.63);
    rightBandit.rotation.z = -0.12;
    headPivot.add(leftBandit, rightBandit);

    const snoutGeo = trackGeo(new RoundedBoxGeometry(0.56, 0.43, 0.22, 4, 0.15));
    const snoutMesh = new THREE.Mesh(snoutGeo, creamMat);
    snoutMesh.position.set(0, 0.42, 0.61);
    snoutMesh.castShadow = true;
    headPivot.add(snoutMesh);

    leftEyeGroup.position.set(-0.39, 0.55, 0.68);
    rightEyeGroup.position.set(0.39, 0.55, 0.68);
    leftCheek.position.set(-0.55, 0.36, 0.68);
    rightCheek.position.set(0.55, 0.36, 0.68);
    noseMesh.position.set(0, 0.5, 0.72);
    smileGroup.position.set(0, 0.38, 0.71);

    const torsoMesh = new THREE.Mesh(torsoGeo, taupeMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const vestBackGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.68, 0.96, 4, 0.2));
    const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
    vestBack.position.set(0, 0.66, -0.01);
    vestBack.castShadow = true;
    bodyGroup.add(vestBack);

    const vNeckGeo = trackGeo(createRoundedTriangleGeometry(0.38, 0.28, 0.12, 0.03, true));
    const vNeck = new THREE.Mesh(vNeckGeo, taupeMat);
    vNeck.position.set(0, 0.89, 0.44);
    bodyGroup.add(vNeck);

    const buttonGeo = trackGeo(new RoundedBoxGeometry(0.13, 0.13, 0.08, 3, 0.05));
    const topButton = new THREE.Mesh(buttonGeo, buttonMat);
    topButton.position.set(0, -0.25, 0.01);
    const bottomButton = new THREE.Mesh(buttonGeo, buttonMat);
    bottomButton.position.set(0, -0.44, 0.01);
    accessoryPivot.add(topButton, bottomButton);

    addStandardLimbs(taupeMat);
    addCenteredUpwardTail([0.38, 0.42, 0.36], [taupeMat, maskMat, taupeMat]);
  }

  // ========================================================================
  // 05. MARMALADE CAT (Cream + Ginger Stripes + Lavender Bow Tie)
  // ========================================================================
  if (id === 'cat') {
    const creamMat = makeClayMat('#F6E7D2', 0.75);
    const gingerStripeMat = makeClayMat('#E08A3E', 0.76);
    const innerEarMat = makeClayMat('#F2A594', 0.76);
    const pinkNoseMat = makeClayMat('#E8857B', 0.6);
    const bowMat = makeFabricMat('#9F74B5');

    const headMesh = new THREE.Mesh(headGeo, creamMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Pointed cat ears
    const outerEarGeo = trackGeo(createRoundedTriangleGeometry(0.56, 0.58, 0.28, 0.08, false));
    const innerEarGeo = trackGeo(createRoundedTriangleGeometry(0.32, 0.36, 0.1, 0.03, false));

    const lEarOuter = new THREE.Mesh(outerEarGeo, creamMat);
    lEarOuter.position.set(-0.02, 0.15, 0);
    lEarOuter.rotation.z = 0.18;
    lEarOuter.castShadow = true;
    const lEarInner = new THREE.Mesh(innerEarGeo, innerEarMat);
    lEarInner.position.set(-0.01, 0.12, 0.11);
    lEarInner.rotation.z = 0.18;
    leftEarPivot.add(lEarOuter, lEarInner);

    const rEarOuter = new THREE.Mesh(outerEarGeo, creamMat);
    rEarOuter.position.set(0.02, 0.15, 0);
    rEarOuter.rotation.z = -0.18;
    rEarOuter.castShadow = true;
    const rEarInner = new THREE.Mesh(innerEarGeo, innerEarMat);
    rEarInner.position.set(0.01, 0.12, 0.11);
    rEarInner.rotation.z = -0.18;
    rightEarPivot.add(rEarOuter, rEarInner);

    // Ginger forehead stripes (2 angled tabby bars at top center)
    const topStripeGeo = trackGeo(new RoundedBoxGeometry(0.11, 0.36, 0.12, 3, 0.045));
    const fStripeL = new THREE.Mesh(topStripeGeo, gingerStripeMat);
    fStripeL.position.set(-0.1, 1.12, 0.59);
    fStripeL.rotation.set(0.3, 0, 0.15);
    const fStripeR = new THREE.Mesh(topStripeGeo, gingerStripeMat);
    fStripeR.position.set(0.1, 1.12, 0.59);
    fStripeR.rotation.set(0.3, 0, -0.15);
    headPivot.add(fStripeL, fStripeR);

    // Side cheek horizontal ginger stripes (2 per side)
    const sideStripeGeo = trackGeo(new RoundedBoxGeometry(0.28, 0.12, 0.32, 3, 0.045));
    for (let i = 0; i < 2; i++) {
      const yPos = 0.68 - i * 0.22;
      const sLeft = new THREE.Mesh(sideStripeGeo, gingerStripeMat);
      sLeft.position.set(-0.79, yPos, 0.44);
      const sRight = new THREE.Mesh(sideStripeGeo, gingerStripeMat);
      sRight.position.set(0.79, yPos, 0.44);
      headPivot.add(sLeft, sRight);
    }

    noseMesh.material = pinkNoseMat;
    leftEyeGroup.position.set(-0.42, 0.54, 0.63);
    rightEyeGroup.position.set(0.42, 0.54, 0.63);
    leftCheek.position.set(-0.56, 0.36, 0.62);
    rightCheek.position.set(0.56, 0.36, 0.62);
    noseMesh.position.set(0, 0.49, 0.65);
    smileGroup.position.set(0, 0.38, 0.64);

    const torsoMesh = new THREE.Mesh(torsoGeo, creamMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const bowTie = createBowTieGroup(bowMat, trackGeo);
    bowTie.position.set(0, -0.04, 0.02);
    accessoryPivot.add(bowTie);

    addStandardLimbs(creamMat);
    addCenteredUpwardTail([0.26, 0.27, 0.25], [gingerStripeMat, creamMat, gingerStripeMat]);
  }

  // ========================================================================
  // 06. BISCUIT PUPPY (Cream + Brown Eye Patch & Floppy Ears + Collar)
  // ========================================================================
  if (id === 'dog') {
    const biscuitMat = makeClayMat('#F1D7B4', 0.76);
    const brownMat = makeClayMat('#985D38', 0.78);
    const collarMat = makeFabricMat('#849E69');
    const buckleMat = makeClayMat('#F0B243', 0.35, 0.35);
    const tongueMat = makeClayMat('#EA7B76', 0.6);

    const headMesh = new THREE.Mesh(headGeo, biscuitMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Large brown eye/forehead patch on viewer's right side
    const eyePatchGeo = trackGeo(new RoundedBoxGeometry(0.76, 0.78, 0.12, 4, 0.22));
    const dogPatch = new THREE.Mesh(eyePatchGeo, brownMat);
    dogPatch.position.set(0.46, 0.76, 0.6);
    dogPatch.rotation.z = -0.14;
    headPivot.add(dogPatch);

    // Long floppy drooping ears along the sides of the head
    leftEarPivot.position.set(-0.88, 0.92, 0.05);
    rightEarPivot.position.set(0.88, 0.92, 0.05);
    const floppyEarGeo = trackGeo(new RoundedBoxGeometry(0.38, 0.84, 0.48, 4, 0.17));

    const lEar = new THREE.Mesh(floppyEarGeo, brownMat);
    lEar.position.set(-0.08, -0.24, 0);
    lEar.rotation.z = 0.24;
    lEar.castShadow = true;
    leftEarPivot.add(lEar);

    const rEar = new THREE.Mesh(floppyEarGeo, brownMat);
    rEar.position.set(0.08, -0.24, 0);
    rEar.rotation.z = -0.24;
    rEar.castShadow = true;
    rightEarPivot.add(rEar);

    // Cute pink tongue peeking out below smile
    const tongueGeo = trackGeo(new RoundedBoxGeometry(0.11, 0.11, 0.06, 3, 0.04));
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0.03, 0.34, 0.63);
    headPivot.add(tongue);

    leftEyeGroup.position.set(-0.41, 0.56, 0.63);
    rightEyeGroup.position.set(0.41, 0.56, 0.66);
    leftCheek.position.set(-0.55, 0.37, 0.62);
    rightCheek.position.set(0.55, 0.37, 0.65);
    noseMesh.position.set(0, 0.51, 0.66);
    smileGroup.position.set(0, 0.39, 0.65);

    const torsoMesh = new THREE.Mesh(torsoGeo, biscuitMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Brown spot on lower left hip
    const hipSpotGeo = trackGeo(new RoundedBoxGeometry(0.32, 0.34, 0.26, 3, 0.1));
    const hipSpot = new THREE.Mesh(hipSpotGeo, brownMat);
    hipSpot.position.set(-0.48, 0.5, 0.22);
    bodyGroup.add(hipSpot);

    // Sage-green collar + golden square buckle
    const collarGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.16, 0.98, 4, 0.06));
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.98, 0.02);
    bodyGroup.add(collar);

    const buckleOuterGeo = trackGeo(new RoundedBoxGeometry(0.24, 0.24, 0.1, 3, 0.05));
    const buckleInnerGeo = trackGeo(new RoundedBoxGeometry(0.11, 0.11, 0.12, 2, 0.02));
    const buckleOuter = new THREE.Mesh(buckleOuterGeo, buckleMat);
    const buckleInner = new THREE.Mesh(buckleInnerGeo, collarMat);
    buckleOuter.position.set(0, 0.0, 0.02);
    buckleInner.position.set(0, 0.0, 0.03);
    accessoryPivot.add(buckleOuter, buckleInner);

    addStandardLimbs(biscuitMat);
    addCenteredUpwardTail([0.27, 0.26, 0.24], [brownMat, brownMat, brownMat]);
  }

  // ========================================================================
  // 07. CLOUDY SHEEP (Fluffy Rounded Cube Wool + Blue Bow Tie)
  // ========================================================================
  if (id === 'sheep') {
    const woolMat = makeClayMat('#F9F3E8', 0.85);
    const skinMat = makeClayMat('#F2CCB0', 0.74);
    const pinkNoseMat = makeClayMat('#E68A82', 0.65);
    const bowMat = makeFabricMat('#6580B2');

    // Warm peach-beige inner face block
    const faceGeo = trackGeo(new RoundedBoxGeometry(1.52, 1.12, 1.12, 5, 0.28));
    const faceMesh = new THREE.Mesh(faceGeo, skinMat);
    faceMesh.position.set(0, 0.58, 0.06);
    faceMesh.castShadow = true;
    headPivot.add(faceMesh);

    // Crown & surround of chunky rounded wool blocks around the head
    const woolPuffGeo = trackGeo(new RoundedBoxGeometry(0.56, 0.52, 0.54, 4, 0.18));
    const headWoolCoords: [number, number, number][] = [
      [-0.48, 1.14, 0.22],
      [0.0, 1.18, 0.26],
      [0.48, 1.14, 0.22],
      [-0.36, 1.24, -0.22],
      [0.36, 1.24, -0.22],
      [-0.84, 0.82, -0.04],
      [0.84, 0.82, -0.04],
      [-0.82, 0.36, -0.06],
      [0.82, 0.36, -0.06],
      [0.0, 0.68, -0.45],
    ];
    headWoolCoords.forEach(([wx, wy, wz]) => {
      const puff = new THREE.Mesh(woolPuffGeo, woolMat);
      puff.position.set(wx, wy, wz);
      puff.castShadow = true;
      puff.receiveShadow = true;
      headPivot.add(puff);
    });

    // Cute horizontal drooping sheep ears
    leftEarPivot.position.set(-0.82, 0.62, 0.18);
    rightEarPivot.position.set(0.82, 0.62, 0.18);
    const sheepEarGeo = trackGeo(new RoundedBoxGeometry(0.42, 0.24, 0.22, 4, 0.1));
    const lEar = new THREE.Mesh(sheepEarGeo, skinMat);
    lEar.position.set(-0.12, 0, 0);
    lEar.rotation.z = 0.35;
    leftEarPivot.add(lEar);

    const rEar = new THREE.Mesh(sheepEarGeo, skinMat);
    rEar.position.set(0.12, 0, 0);
    rEar.rotation.z = -0.35;
    rightEarPivot.add(rEar);

    noseMesh.material = pinkNoseMat;
    leftEyeGroup.position.set(-0.38, 0.54, 0.61);
    rightEyeGroup.position.set(0.38, 0.54, 0.61);
    leftCheek.position.set(-0.52, 0.36, 0.6);
    rightCheek.position.set(0.52, 0.36, 0.6);
    noseMesh.position.set(0, 0.48, 0.63);
    smileGroup.position.set(0, 0.37, 0.62);

    // Inner torso + puffy wool block coat
    const torsoMesh = new THREE.Mesh(torsoGeo, woolMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    bodyGroup.add(torsoMesh);

    const bodyWoolGeo = trackGeo(new RoundedBoxGeometry(0.48, 0.44, 0.46, 4, 0.16));
    const bodyWoolCoords: [number, number, number][] = [
      [-0.38, 0.72, 0.32],
      [0.0, 0.72, 0.35],
      [0.38, 0.72, 0.32],
      [-0.4, 0.42, 0.3],
      [0.0, 0.42, 0.34],
      [0.4, 0.42, 0.3],
      [-0.42, 0.56, -0.14],
      [0.42, 0.56, -0.14],
    ];
    bodyWoolCoords.forEach(([bx, by, bz]) => {
      const puff = new THREE.Mesh(bodyWoolGeo, woolMat);
      puff.position.set(bx, by, bz);
      puff.castShadow = true;
      bodyGroup.add(puff);
    });

    const bowTie = createBowTieGroup(bowMat, trackGeo);
    bowTie.position.set(0, -0.02, 0.12);
    accessoryPivot.add(bowTie);

    addStandardLimbs(skinMat);
    addCenteredUpwardTail([0.32, 0.28], [woolMat, woolMat]);
  }

  // ========================================================================
  // 08. PEACHY PIGLET (Coral Pink + Big Snout + Gold Bandana + Curly Tail)
  // ========================================================================
  if (id === 'pig') {
    const pinkMat = makeClayMat('#F3A79D', 0.75);
    const snoutMat = makeClayMat('#E88F84', 0.72);
    const nostrilMat = makeClayMat('#783B35', 0.8);
    const bandanaMat = makeFabricMat('#F2B53D');

    const headMesh = new THREE.Mesh(headGeo, pinkMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Forward-folded floppy pig ears on top corners
    const pigEarGeo = trackGeo(new RoundedBoxGeometry(0.52, 0.44, 0.42, 4, 0.16));
    const lEar = new THREE.Mesh(pigEarGeo, pinkMat);
    lEar.position.set(-0.14, 0.04, 0.12);
    lEar.rotation.set(0.38, 0.2, 0.42);
    lEar.castShadow = true;
    leftEarPivot.add(lEar);

    const rEar = new THREE.Mesh(pigEarGeo, pinkMat);
    rEar.position.set(0.14, 0.04, 0.12);
    rEar.rotation.set(0.38, -0.2, -0.42);
    rEar.castShadow = true;
    rightEarPivot.add(rEar);

    // Prominent rounded pig snout with 2 vertical oval nostrils
    const pigSnoutGeo = trackGeo(new RoundedBoxGeometry(0.48, 0.35, 0.22, 4, 0.13));
    const pigSnout = new THREE.Mesh(pigSnoutGeo, snoutMat);
    pigSnout.position.set(0, 0.47, 0.63);
    pigSnout.castShadow = true;
    headPivot.add(pigSnout);

    const nostrilGeo = trackGeo(new RoundedBoxGeometry(0.075, 0.14, 0.06, 3, 0.03));
    const leftNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    leftNostril.position.set(-0.09, 0.47, 0.73);
    const rightNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    rightNostril.position.set(0.09, 0.47, 0.73);
    headPivot.add(leftNostril, rightNostril);

    // Hide standard nose/smile since piglet has its iconic snout
    noseMesh.visible = false;
    smileGroup.visible = false;

    leftEyeGroup.position.set(-0.42, 0.56, 0.63);
    rightEyeGroup.position.set(0.42, 0.56, 0.63);
    leftCheek.position.set(-0.56, 0.36, 0.62);
    rightCheek.position.set(0.56, 0.36, 0.62);

    const torsoMesh = new THREE.Mesh(torsoGeo, pinkMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Golden-yellow bandana
    const collarGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.16, 0.98, 4, 0.07));
    const collarMesh = new THREE.Mesh(collarGeo, bandanaMat);
    collarMesh.position.set(0, 0.99, 0.02);
    bodyGroup.add(collarMesh);

    const bibGeo = trackGeo(createRoundedTriangleGeometry(0.76, 0.46, 0.16, 0.05, true));
    const bibMesh = new THREE.Mesh(bibGeo, bandanaMat);
    bibMesh.position.set(0, -0.12, 0.0);
    bibMesh.rotation.x = 0.12;
    bibMesh.castShadow = true;
    accessoryPivot.add(bibMesh);

    addStandardLimbs(pinkMat);
    addCenteredUpwardTail([0.22, 0.21, 0.19], [snoutMat, pinkMat, snoutMat]);
  }

  // ========================================================================
  // 09. BUMBO ELEPHANT (Powder Blue + Giant Ears + Trunk + Ochre Vest)
  // ========================================================================
  if (id === 'elephant') {
    const blueMat = makeClayMat('#8FAAC2', 0.76);
    const innerEarMat = makeClayMat('#F0B0AD', 0.74);
    const vestMat = makeFabricMat('#E5AE4E');
    const buttonMat = makeClayMat('#F7E7CE', 0.45, 0.25);

    const headMesh = new THREE.Mesh(headGeo, blueMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Giant wide rounded-block elephant ears on left and right of head
    leftEarPivot.position.set(-0.88, 0.66, -0.06);
    rightEarPivot.position.set(0.88, 0.66, -0.06);
    const bigEarGeo = trackGeo(new RoundedBoxGeometry(0.68, 1.18, 0.28, 5, 0.22));
    const bigEarInnerGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.88, 0.08, 4, 0.15));

    const lEar = new THREE.Mesh(bigEarGeo, blueMat);
    lEar.position.set(-0.22, 0, 0);
    lEar.rotation.y = 0.18;
    lEar.castShadow = true;
    const lEarIn = new THREE.Mesh(bigEarInnerGeo, innerEarMat);
    lEarIn.position.set(-0.2, -0.02, 0.12);
    lEarIn.rotation.y = 0.18;
    leftEarPivot.add(lEar, lEarIn);

    const rEar = new THREE.Mesh(bigEarGeo, blueMat);
    rEar.position.set(0.22, 0, 0);
    rEar.rotation.y = -0.18;
    rEar.castShadow = true;
    const rEarIn = new THREE.Mesh(bigEarInnerGeo, innerEarMat);
    rEarIn.position.set(0.2, -0.02, 0.12);
    rEarIn.rotation.y = -0.18;
    rightEarPivot.add(rEar, rEarIn);

    // Chibi rounded-block elephant trunk curving slightly forward
    const trunkGroup = new THREE.Group();
    const trunkTopGeo = trackGeo(new RoundedBoxGeometry(0.36, 0.36, 0.28, 4, 0.13));
    const trunkMidGeo = trackGeo(new RoundedBoxGeometry(0.35, 0.34, 0.3, 4, 0.13));
    const trunkTipGeo = trackGeo(new RoundedBoxGeometry(0.36, 0.26, 0.32, 4, 0.12));

    const tTop = new THREE.Mesh(trunkTopGeo, blueMat);
    tTop.position.set(0, 0.48, 0.64);
    const tMid = new THREE.Mesh(trunkMidGeo, blueMat);
    tMid.position.set(0, 0.28, 0.7);
    tMid.rotation.x = -0.18;
    const tTip = new THREE.Mesh(trunkTipGeo, blueMat);
    tTip.position.set(0, 0.13, 0.76);
    tTip.rotation.x = -0.35;
    tTop.castShadow = true;
    tMid.castShadow = true;
    tTip.castShadow = true;
    trunkGroup.add(tTop, tMid, tTip);
    headPivot.add(trunkGroup);

    noseMesh.visible = false;
    smileGroup.visible = false;

    leftEyeGroup.position.set(-0.44, 0.56, 0.63);
    rightEyeGroup.position.set(0.44, 0.56, 0.63);
    leftCheek.position.set(-0.58, 0.36, 0.62);
    rightCheek.position.set(0.58, 0.36, 0.62);

    const torsoMesh = new THREE.Mesh(torsoGeo, blueMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Ochre buttoned vest
    const vestBackGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.68, 0.96, 4, 0.2));
    const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
    vestBack.position.set(0, 0.66, -0.01);
    vestBack.castShadow = true;
    bodyGroup.add(vestBack);

    const vNeckGeo = trackGeo(createRoundedTriangleGeometry(0.38, 0.28, 0.12, 0.03, true));
    const vNeck = new THREE.Mesh(vNeckGeo, blueMat);
    vNeck.position.set(0, 0.89, 0.44);
    bodyGroup.add(vNeck);

    const buttonGeo = trackGeo(new RoundedBoxGeometry(0.13, 0.13, 0.08, 3, 0.05));
    const topButton = new THREE.Mesh(buttonGeo, buttonMat);
    topButton.position.set(0, -0.25, 0.01);
    const bottomButton = new THREE.Mesh(buttonGeo, buttonMat);
    bottomButton.position.set(0, -0.44, 0.01);
    accessoryPivot.add(topButton, bottomButton);

    addStandardLimbs(blueMat);
    addCenteredUpwardTail([0.23, 0.2], [blueMat, blueMat]);
  }

  // ========================================================================
  // 10. BUBBLES HIPPO (Lavender + Oversized Lilac Snout & Tusks + Coral Bandana)
  // ========================================================================
  if (id === 'hippo') {
    const hippoMat = makeClayMat('#A688B0', 0.76);
    const muzzleMat = makeClayMat('#CBB1D3', 0.74);
    const nostrilMat = makeClayMat('#6E527A', 0.8);
    const toothMat = makeClayMat('#FAF4EE', 0.5);
    const bandanaMat = makeFabricMat('#DF665F');

    const headMesh = new THREE.Mesh(headGeo, hippoMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Cute small hippo ears on top
    const hippoEarGeo = trackGeo(new RoundedBoxGeometry(0.38, 0.42, 0.28, 4, 0.16));
    const hippoEarInGeo = trackGeo(new RoundedBoxGeometry(0.2, 0.24, 0.08, 3, 0.08));

    const lEar = new THREE.Mesh(hippoEarGeo, hippoMat);
    lEar.position.set(0.06, 0.1, 0);
    lEar.rotation.z = 0.22;
    const lEarIn = new THREE.Mesh(hippoEarInGeo, nostrilMat);
    lEarIn.position.set(0.06, 0.08, 0.12);
    lEarIn.rotation.z = 0.22;
    leftEarPivot.add(lEar, lEarIn);

    const rEar = new THREE.Mesh(hippoEarGeo, hippoMat);
    rEar.position.set(-0.06, 0.1, 0);
    rEar.rotation.z = -0.22;
    const rEarIn = new THREE.Mesh(hippoEarInGeo, nostrilMat);
    rEarIn.position.set(-0.06, 0.08, 0.12);
    rEarIn.rotation.z = -0.22;
    rightEarPivot.add(rEar, rEarIn);

    // Oversized wide pastel-lilac hippo muzzle block across lower face
    const bigMuzzleGeo = trackGeo(new RoundedBoxGeometry(1.52, 0.58, 0.52, 5, 0.24));
    const bigMuzzle = new THREE.Mesh(bigMuzzleGeo, muzzleMat);
    bigMuzzle.position.set(0, 0.36, 0.52);
    bigMuzzle.castShadow = true;
    headPivot.add(bigMuzzle);

    // Two nostrils on the front-upper muzzle
    const nostrilGeo = trackGeo(new RoundedBoxGeometry(0.11, 0.16, 0.08, 3, 0.045));
    const lNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    lNostril.position.set(-0.34, 0.42, 0.76);
    const rNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    rNostril.position.set(0.34, 0.42, 0.76);
    headPivot.add(lNostril, rNostril);

    // Two cute white square-rounded front teeth peeking under the muzzle
    const toothGeo = trackGeo(new RoundedBoxGeometry(0.18, 0.16, 0.14, 3, 0.05));
    const lTooth = new THREE.Mesh(toothGeo, toothMat);
    lTooth.position.set(-0.32, 0.06, 0.62);
    const rTooth = new THREE.Mesh(toothGeo, toothMat);
    rTooth.position.set(0.32, 0.06, 0.62);
    headPivot.add(lTooth, rTooth);

    noseMesh.visible = false;
    smileGroup.visible = false;

    leftEyeGroup.position.set(-0.46, 0.74, 0.63);
    rightEyeGroup.position.set(0.46, 0.74, 0.63);
    leftCheek.position.set(-0.64, 0.62, 0.62);
    rightCheek.position.set(0.64, 0.62, 0.62);

    const torsoMesh = new THREE.Mesh(torsoGeo, hippoMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const collarGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.16, 0.98, 4, 0.07));
    const collarMesh = new THREE.Mesh(collarGeo, bandanaMat);
    collarMesh.position.set(0, 0.99, 0.02);
    bodyGroup.add(collarMesh);

    const bibGeo = trackGeo(createRoundedTriangleGeometry(0.76, 0.46, 0.16, 0.05, true));
    const bibMesh = new THREE.Mesh(bibGeo, bandanaMat);
    bibMesh.position.set(0, -0.12, 0.0);
    bibMesh.rotation.x = 0.12;
    bibMesh.castShadow = true;
    accessoryPivot.add(bibMesh);

    addStandardLimbs(hippoMat);
    addCenteredUpwardTail([0.23, 0.2], [hippoMat, hippoMat]);
  }

  // ========================================================================
  // 11. SUNNY LION (Golden Yellow + 12-Block Scalloped Mane + Tufted Tail)
  // ========================================================================
  if (id === 'lion') {
    const goldMat = makeClayMat('#F4BC52', 0.75);
    const maneMat = makeClayMat('#C96631', 0.8);
    const creamMat = makeClayMat('#FBE0A2', 0.72);

    const headMesh = new THREE.Mesh(headGeo, goldMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Round golden ears in front of the mane
    const earOuterGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.46, 0.28, 4, 0.18));
    const earInnerGeo = trackGeo(new RoundedBoxGeometry(0.26, 0.26, 0.08, 3, 0.1));

    const lEar = new THREE.Mesh(earOuterGeo, goldMat);
    lEar.position.set(0.02, 0.04, 0.18);
    lEar.castShadow = true;
    const lEarIn = new THREE.Mesh(earInnerGeo, maneMat);
    lEarIn.position.set(0.02, 0.03, 0.3);
    leftEarPivot.add(lEar, lEarIn);

    const rEar = new THREE.Mesh(earOuterGeo, goldMat);
    rEar.position.set(-0.02, 0.04, 0.18);
    rEar.castShadow = true;
    const rEarIn = new THREE.Mesh(earInnerGeo, maneMat);
    rEarIn.position.set(-0.02, 0.03, 0.3);
    rightEarPivot.add(rEar, rEarIn);

    // 12-Block Scalloped Sunflower Mane framing the entire head
    const maneBlockGeo = trackGeo(new RoundedBoxGeometry(0.58, 0.54, 0.56, 4, 0.22));
    const maneCount = 12;
    for (let i = 0; i < maneCount; i++) {
      const angle = (i / maneCount) * Math.PI * 2;
      const mx = Math.cos(angle) * 0.94;
      const my = 0.66 + Math.sin(angle) * 0.76;
      const mz = -0.14;
      const mBlock = new THREE.Mesh(maneBlockGeo, maneMat);
      mBlock.position.set(mx, my, mz);
      mBlock.rotation.z = angle;
      mBlock.castShadow = true;
      headPivot.add(mBlock);
    }

    const snoutGeo = trackGeo(new RoundedBoxGeometry(0.6, 0.42, 0.2, 4, 0.14));
    const snoutMesh = new THREE.Mesh(snoutGeo, creamMat);
    snoutMesh.position.set(0, 0.43, 0.6);
    snoutMesh.castShadow = true;
    headPivot.add(snoutMesh);

    leftEyeGroup.position.set(-0.42, 0.56, 0.63);
    rightEyeGroup.position.set(0.42, 0.56, 0.63);
    leftCheek.position.set(-0.55, 0.37, 0.62);
    rightCheek.position.set(0.55, 0.37, 0.62);
    noseMesh.position.set(0, 0.5, 0.7);
    smileGroup.position.set(0, 0.38, 0.69);

    const torsoMesh = new THREE.Mesh(torsoGeo, goldMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const bellyGeo = trackGeo(new RoundedBoxGeometry(0.62, 0.52, 0.14, 4, 0.14));
    const bellyMesh = new THREE.Mesh(bellyGeo, creamMat);
    bellyMesh.position.set(0, 0.56, 0.42);
    bodyGroup.add(bellyMesh);

    addStandardLimbs(goldMat);
    addCenteredUpwardTail([0.24, 0.24, 0.32], [goldMat, goldMat, maneMat]);
  }

  // ========================================================================
  // 12. TANGO TIGER (Tangerine + Forehead '王' Stripes + Sage Bandana)
  // ========================================================================
  if (id === 'tiger') {
    const orangeMat = makeClayMat('#E88035', 0.75);
    const stripeMat = makeClayMat('#59311C', 0.8);
    const creamMat = makeClayMat('#F7E3C6', 0.72);
    const bandanaMat = makeFabricMat('#7E9B6B');

    const headMesh = new THREE.Mesh(headGeo, orangeMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    const earOuterGeo = trackGeo(new RoundedBoxGeometry(0.54, 0.54, 0.34, 4, 0.21));
    const earInnerGeo = trackGeo(new RoundedBoxGeometry(0.32, 0.32, 0.1, 3, 0.12));

    const lEar = new THREE.Mesh(earOuterGeo, orangeMat);
    lEar.position.set(0, 0.12, 0);
    lEar.castShadow = true;
    const lEarIn = new THREE.Mesh(earInnerGeo, creamMat);
    lEarIn.position.set(0, 0.1, 0.14);
    leftEarPivot.add(lEar, lEarIn);

    const rEar = new THREE.Mesh(earOuterGeo, orangeMat);
    rEar.position.set(0, 0.12, 0);
    rEar.castShadow = true;
    const rEarIn = new THREE.Mesh(earInnerGeo, creamMat);
    rEarIn.position.set(0, 0.1, 0.14);
    rightEarPivot.add(rEar, rEarIn);

    // Iconic Tiger '王' Forehead Stripes
    const vBarGeo = trackGeo(new RoundedBoxGeometry(0.11, 0.44, 0.08, 3, 0.035));
    const vBar = new THREE.Mesh(vBarGeo, stripeMat);
    vBar.position.set(0, 0.98, 0.62);
    headPivot.add(vBar);

    const hBarWidths = [0.42, 0.32, 0.24];
    hBarWidths.forEach((w, idx) => {
      const hBarGeo = trackGeo(new RoundedBoxGeometry(w, 0.09, 0.08, 3, 0.03));
      const hBar = new THREE.Mesh(hBarGeo, stripeMat);
      hBar.position.set(0, 1.12 - idx * 0.13, 0.62);
      headPivot.add(hBar);
    });

    // Side cheek stripes
    const sideStripeGeo = trackGeo(new RoundedBoxGeometry(0.3, 0.11, 0.32, 3, 0.04));
    for (let i = 0; i < 2; i++) {
      const yPos = 0.72 - i * 0.22;
      const sL = new THREE.Mesh(sideStripeGeo, stripeMat);
      sL.position.set(-0.79, yPos, 0.44);
      const sR = new THREE.Mesh(sideStripeGeo, stripeMat);
      sR.position.set(0.79, yPos, 0.44);
      headPivot.add(sL, sR);
    }

    // Cream cheek patches & snout
    const cheekPatchGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.38, 0.12, 4, 0.14));
    const lMask = new THREE.Mesh(cheekPatchGeo, creamMat);
    lMask.position.set(-0.5, 0.38, 0.59);
    const rMask = new THREE.Mesh(cheekPatchGeo, creamMat);
    rMask.position.set(0.5, 0.38, 0.59);
    headPivot.add(lMask, rMask);

    const snoutGeo = trackGeo(new RoundedBoxGeometry(0.6, 0.44, 0.22, 4, 0.15));
    const snoutMesh = new THREE.Mesh(snoutGeo, creamMat);
    snoutMesh.position.set(0, 0.42, 0.6);
    headPivot.add(snoutMesh);

    leftEyeGroup.position.set(-0.4, 0.55, 0.64);
    rightEyeGroup.position.set(0.4, 0.55, 0.64);
    leftCheek.position.set(-0.55, 0.35, 0.65);
    rightCheek.position.set(0.55, 0.35, 0.65);
    noseMesh.position.set(0, 0.5, 0.71);
    smileGroup.position.set(0, 0.38, 0.7);

    const torsoMesh = new THREE.Mesh(torsoGeo, orangeMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const bellyGeo = trackGeo(new RoundedBoxGeometry(0.62, 0.54, 0.14, 4, 0.14));
    const bellyMesh = new THREE.Mesh(bellyGeo, creamMat);
    bellyMesh.position.set(0, 0.56, 0.42);
    bodyGroup.add(bellyMesh);

    const collarGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.16, 0.98, 4, 0.07));
    const collarMesh = new THREE.Mesh(collarGeo, bandanaMat);
    collarMesh.position.set(0, 0.99, 0.02);
    bodyGroup.add(collarMesh);

    const bibGeo = trackGeo(createRoundedTriangleGeometry(0.76, 0.46, 0.16, 0.05, true));
    const bibMesh = new THREE.Mesh(bibGeo, bandanaMat);
    bibMesh.position.set(0, -0.12, 0.0);
    bibMesh.rotation.x = 0.12;
    bibMesh.castShadow = true;
    accessoryPivot.add(bibMesh);

    addStandardLimbs(orangeMat);
    addCenteredUpwardTail([0.27, 0.28, 0.25], [orangeMat, stripeMat, orangeMat]);
  }

  // ========================================================================
  // 13. PUDDLE PENGUIN (Slate Charcoal + White Mask + Orange Beak + Blue Scarf)
  // ========================================================================
  if (id === 'penguin') {
    useStandardFootPads = false;
    const slateMat = makeClayMat('#55525D', 0.78);
    const whiteMat = makeClayMat('#F6F0E4', 0.72);
    const beakMat = makeClayMat('#F3AA3C', 0.62, 0.15);
    const scarfMat = makeFabricMat('#6581A8');

    const headMesh = new THREE.Mesh(headGeo, slateMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Heart/Twin-Arch White Facial Mask
    const maskArchGeo = trackGeo(new RoundedBoxGeometry(0.78, 0.88, 0.12, 4, 0.28));
    const maskL = new THREE.Mesh(maskArchGeo, whiteMat);
    maskL.position.set(-0.34, 0.54, 0.6);
    const maskR = new THREE.Mesh(maskArchGeo, whiteMat);
    maskR.position.set(0.34, 0.54, 0.6);
    const maskBottomGeo = trackGeo(new RoundedBoxGeometry(1.42, 0.56, 0.12, 4, 0.22));
    const maskBottom = new THREE.Mesh(maskBottomGeo, whiteMat);
    maskBottom.position.set(0, 0.4, 0.6);
    headPivot.add(maskL, maskR, maskBottom);

    // Plump golden-orange 2-part penguin beak
    const upperBeakGeo = trackGeo(new RoundedBoxGeometry(0.34, 0.16, 0.24, 4, 0.07));
    const lowerBeakGeo = trackGeo(new RoundedBoxGeometry(0.28, 0.11, 0.2, 4, 0.05));
    const uBeak = new THREE.Mesh(upperBeakGeo, beakMat);
    uBeak.position.set(0, 0.49, 0.71);
    uBeak.castShadow = true;
    const lBeak = new THREE.Mesh(lowerBeakGeo, beakMat);
    lBeak.position.set(0, 0.4, 0.69);
    headPivot.add(uBeak, lBeak);

    noseMesh.visible = false;
    smileGroup.visible = false;

    leftEyeGroup.position.set(-0.39, 0.56, 0.66);
    rightEyeGroup.position.set(0.39, 0.56, 0.66);
    leftCheek.position.set(-0.55, 0.37, 0.66);
    rightCheek.position.set(0.55, 0.37, 0.66);

    const torsoMesh = new THREE.Mesh(torsoGeo, slateMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const bellyGeo = trackGeo(new RoundedBoxGeometry(0.76, 0.62, 0.14, 4, 0.2));
    const bellyMesh = new THREE.Mesh(bellyGeo, whiteMat);
    bellyMesh.position.set(0, 0.56, 0.42);
    bodyGroup.add(bellyMesh);

    // Sky-blue winter scarf
    const scarfRingGeo = trackGeo(new RoundedBoxGeometry(1.26, 0.24, 1.02, 4, 0.1));
    const scarfRing = new THREE.Mesh(scarfRingGeo, scarfMat);
    scarfRing.position.set(0, 0.98, 0.02);
    scarfRing.castShadow = true;
    bodyGroup.add(scarfRing);

    const scarfTailGeo = trackGeo(new RoundedBoxGeometry(0.3, 0.44, 0.2, 4, 0.08));
    const scarfTail = new THREE.Mesh(scarfTailGeo, scarfMat);
    scarfTail.position.set(0.28, -0.14, 0.02);
    scarfTail.castShadow = true;
    accessoryPivot.add(scarfTail);

    // Flipper wings flush against torso + Golden webbed feet
    const wingGeo = trackGeo(new RoundedBoxGeometry(0.28, 0.56, 0.4, 4, 0.13));
    const lWing = new THREE.Mesh(wingGeo, slateMat);
    lWing.position.set(-0.14, -0.18, 0);
    lWing.rotation.z = -0.06;
    lWing.castShadow = true;
    leftArmPivot.add(lWing);

    const rWing = new THREE.Mesh(wingGeo, slateMat);
    rWing.position.set(0.14, -0.18, 0);
    rWing.rotation.z = 0.06;
    rWing.castShadow = true;
    rightArmPivot.add(rWing);

    const webFootGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.22, 0.56, 4, 0.09));
    const lFoot = new THREE.Mesh(webFootGeo, beakMat);
    lFoot.position.set(0, -0.24, 0.06);
    lFoot.castShadow = true;
    leftLegPivot.add(lFoot);

    const rFoot = new THREE.Mesh(webFootGeo, beakMat);
    rFoot.position.set(0, -0.24, 0.06);
    rFoot.castShadow = true;
    rightLegPivot.add(rFoot);

    addCenteredUpwardTail([0.25, 0.22], [slateMat, slateMat]);
  }

  // ========================================================================
  // 14. QUACKERS DUCK (Buttercup Yellow + Top Hair Tuft + Coral Bow Tie)
  // ========================================================================
  if (id === 'duck') {
    useStandardFootPads = false;
    const yellowMat = makeClayMat('#F6CD61', 0.74);
    const billMat = makeClayMat('#E88035', 0.65, 0.12);
    const bowMat = makeFabricMat('#E0675F');

    const headMesh = new THREE.Mesh(headGeo, yellowMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Cute 2-feather top head tuft mounted on leftEarPivot/rightEarPivot so it wiggles!
    leftEarPivot.position.set(-0.06, 1.28, 0);
    rightEarPivot.position.set(0.08, 1.28, 0);
    const tuftA = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.18, 0.34, 0.18, 3, 0.08)),
      yellowMat
    );
    tuftA.position.set(0, 0.08, 0);
    tuftA.rotation.z = 0.18;
    leftEarPivot.add(tuftA);

    const tuftB = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.16, 0.26, 0.16, 3, 0.07)),
      yellowMat
    );
    tuftB.position.set(0.04, 0.04, 0);
    tuftB.rotation.z = -0.32;
    rightEarPivot.add(tuftB);

    // Wide tangerine duck bill
    const upperBillGeo = trackGeo(new RoundedBoxGeometry(0.56, 0.18, 0.28, 4, 0.08));
    const lowerBillGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.11, 0.22, 4, 0.05));
    const uBill = new THREE.Mesh(upperBillGeo, billMat);
    uBill.position.set(0, 0.48, 0.7);
    uBill.castShadow = true;
    const lBill = new THREE.Mesh(lowerBillGeo, billMat);
    lBill.position.set(0, 0.38, 0.68);
    headPivot.add(uBill, lBill);

    noseMesh.visible = false;
    smileGroup.visible = false;

    leftEyeGroup.position.set(-0.42, 0.56, 0.63);
    rightEyeGroup.position.set(0.42, 0.56, 0.63);
    leftCheek.position.set(-0.56, 0.37, 0.62);
    rightCheek.position.set(0.56, 0.37, 0.62);

    const torsoMesh = new THREE.Mesh(torsoGeo, yellowMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const bowTie = createBowTieGroup(bowMat, trackGeo);
    bowTie.position.set(0, -0.05, 0.02);
    accessoryPivot.add(bowTie);

    // Wing arms flush against torso & Orange webbed feet
    const wingGeo = trackGeo(new RoundedBoxGeometry(0.3, 0.54, 0.4, 4, 0.14));
    const lWing = new THREE.Mesh(wingGeo, yellowMat);
    lWing.position.set(-0.14, -0.18, 0);
    lWing.rotation.z = -0.06;
    lWing.castShadow = true;
    leftArmPivot.add(lWing);

    const rWing = new THREE.Mesh(wingGeo, yellowMat);
    rWing.position.set(0.14, -0.18, 0);
    rWing.rotation.z = 0.06;
    rWing.castShadow = true;
    rightArmPivot.add(rWing);

    const webFootGeo = trackGeo(new RoundedBoxGeometry(0.46, 0.22, 0.56, 4, 0.09));
    const lFoot = new THREE.Mesh(webFootGeo, billMat);
    lFoot.position.set(0, -0.24, 0.06);
    lFoot.castShadow = true;
    leftLegPivot.add(lFoot);

    const rFoot = new THREE.Mesh(webFootGeo, billMat);
    rFoot.position.set(0, -0.24, 0.06);
    rFoot.castShadow = true;
    rightLegPivot.add(rFoot);

    addCenteredUpwardTail([0.27, 0.23], [yellowMat, yellowMat]);
  }

  // ========================================================================
  // 15. HOOTY OWL (Chestnut Brown + Twin-Arch Face + Scalloped Feather Belly)
  // ========================================================================
  if (id === 'owl') {
    useStandardFootPads = false;
    const brownMat = makeClayMat('#A26B4F', 0.78);
    const darkWingMat = makeClayMat('#86533A', 0.8);
    const creamMat = makeClayMat('#F5E5CE', 0.72);
    const featherMarkMat = makeClayMat('#BC896E', 0.76);
    const beakMat = makeClayMat('#F0A83A', 0.62, 0.15);

    const headMesh = new THREE.Mesh(headGeo, brownMat);
    headMesh.position.set(0, 0.64, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Pointed owl horn tufts on top corners
    const hornGeo = trackGeo(createRoundedTriangleGeometry(0.48, 0.48, 0.26, 0.07, false));
    const lHorn = new THREE.Mesh(hornGeo, brownMat);
    lHorn.position.set(-0.04, 0.12, 0.04);
    lHorn.rotation.z = 0.32;
    lHorn.castShadow = true;
    leftEarPivot.add(lHorn);

    const rHorn = new THREE.Mesh(hornGeo, brownMat);
    rHorn.position.set(0.04, 0.12, 0.04);
    rHorn.rotation.z = -0.32;
    rHorn.castShadow = true;
    rightEarPivot.add(rHorn);

    // Cream Twin-Arch Owl Facial Disc
    const discGeo = trackGeo(new RoundedBoxGeometry(0.76, 0.84, 0.12, 4, 0.28));
    const discL = new THREE.Mesh(discGeo, creamMat);
    discL.position.set(-0.36, 0.53, 0.6);
    const discR = new THREE.Mesh(discGeo, creamMat);
    discR.position.set(0.36, 0.53, 0.6);
    const discBottom = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(1.42, 0.48, 0.12, 4, 0.2)),
      creamMat
    );
    discBottom.position.set(0, 0.36, 0.6);
    headPivot.add(discL, discR, discBottom);

    // Pointed golden triangular owl beak
    const owlBeakGeo = trackGeo(createRoundedTriangleGeometry(0.28, 0.28, 0.22, 0.05, true));
    const owlBeak = new THREE.Mesh(owlBeakGeo, beakMat);
    owlBeak.position.set(0, 0.48, 0.69);
    owlBeak.castShadow = true;
    headPivot.add(owlBeak);

    noseMesh.visible = false;
    smileGroup.visible = false;

    leftEyeGroup.position.set(-0.4, 0.55, 0.66);
    rightEyeGroup.position.set(0.4, 0.55, 0.66);
    leftCheek.position.set(-0.56, 0.36, 0.66);
    rightCheek.position.set(0.56, 0.36, 0.66);

    const torsoMesh = new THREE.Mesh(torsoGeo, brownMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Cream belly patch with 3 scalloped feather crescents
    const bellyGeo = trackGeo(new RoundedBoxGeometry(0.74, 0.6, 0.14, 4, 0.2));
    const bellyMesh = new THREE.Mesh(bellyGeo, creamMat);
    bellyMesh.position.set(0, 0.56, 0.42);
    bodyGroup.add(bellyMesh);

    const markCoords: [number, number][] = [
      [-0.16, 0.66],
      [0.16, 0.66],
      [0.0, 0.48],
    ];
    markCoords.forEach(([mx, my]) => {
      const arc = createSimpleArcMesh(0.18, 0.05, 0.02, featherMarkMat, trackGeo);
      arc.position.set(mx, my, 0.49);
      bodyGroup.add(arc);
    });

    // Feathered wings flush against torso & Golden owl feet
    const wingGeo = trackGeo(new RoundedBoxGeometry(0.3, 0.56, 0.44, 4, 0.14));
    const lWing = new THREE.Mesh(wingGeo, darkWingMat);
    lWing.position.set(-0.14, -0.18, 0);
    lWing.rotation.z = -0.06;
    lWing.castShadow = true;
    leftArmPivot.add(lWing);

    const rWing = new THREE.Mesh(wingGeo, darkWingMat);
    rWing.position.set(0.14, -0.18, 0);
    rWing.rotation.z = 0.06;
    rWing.castShadow = true;
    rightArmPivot.add(rWing);

    const owlFootGeo = trackGeo(new RoundedBoxGeometry(0.44, 0.22, 0.54, 4, 0.09));
    const lFoot = new THREE.Mesh(owlFootGeo, beakMat);
    lFoot.position.set(0, -0.24, 0.06);
    lFoot.castShadow = true;
    leftLegPivot.add(lFoot);

    const rFoot = new THREE.Mesh(owlFootGeo, beakMat);
    rFoot.position.set(0, -0.24, 0.06);
    rFoot.castShadow = true;
    rightLegPivot.add(rFoot);

    addCenteredUpwardTail([0.27, 0.23], [darkWingMat, brownMat]);
  }

  // ========================================================================
  // 16. MATCHA FROG (Matcha Green + Top Eye Bumps + Wide Grin + Lavender Vest)
  // ========================================================================
  if (id === 'frog') {
    const frogMat = makeClayMat('#B2C180', 0.75);
    const bellyMat = makeClayMat('#D8E2B0', 0.72);
    const vestMat = makeFabricMat('#A47FB3');
    const buttonMat = makeClayMat('#F3DEC0', 0.45, 0.25);

    // Wide rounded frog head
    const frogHeadGeo = trackGeo(new RoundedBoxGeometry(1.82, 1.16, 1.26, 6, 0.34));
    const headMesh = new THREE.Mesh(frogHeadGeo, frogMat);
    headMesh.position.set(0, 0.56, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Top-mounted protruding frog eye blocks flush with front face
    leftEarPivot.position.set(-0.52, 1.12, 0.36);
    rightEarPivot.position.set(0.52, 1.12, 0.36);
    const eyeMountGeo = trackGeo(new RoundedBoxGeometry(0.5, 0.46, 0.44, 4, 0.18));

    const lMount = new THREE.Mesh(eyeMountGeo, frogMat);
    lMount.castShadow = true;
    leftEarPivot.add(lMount);

    const rMount = new THREE.Mesh(eyeMountGeo, frogMat);
    rMount.castShadow = true;
    rightEarPivot.add(rMount);

    // Position the dark oval eyes right on the front of the top eye mounts!
    leftEyeGroup.position.set(-0.52, 1.12, 0.58);
    rightEyeGroup.position.set(0.52, 1.12, 0.58);

    // Wide happy curved frog smile + rosy cheeks
    noseMesh.visible = false;
    smileGroup.visible = false;
    const frogSmile = createSimpleArcMesh(0.42, 0.14, 0.028, darkFeatureMat, trackGeo);
    frogSmile.position.set(0, 0.58, 0.63);
    headPivot.add(frogSmile);

    leftCheek.position.set(-0.58, 0.46, 0.62);
    rightCheek.position.set(0.58, 0.46, 0.62);

    const torsoMesh = new THREE.Mesh(torsoGeo, frogMat);
    torsoMesh.position.set(0, 0.64, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Lavender buttoned vest with V-neck
    const vestBackGeo = trackGeo(new RoundedBoxGeometry(1.22, 0.66, 0.96, 4, 0.2));
    const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
    vestBack.position.set(0, 0.66, -0.01);
    vestBack.castShadow = true;
    bodyGroup.add(vestBack);

    const vNeckGeo = trackGeo(createRoundedTriangleGeometry(0.38, 0.28, 0.12, 0.03, true));
    const vNeck = new THREE.Mesh(vNeckGeo, bellyMat);
    vNeck.position.set(0, 0.89, 0.44);
    bodyGroup.add(vNeck);

    const buttonGeo = trackGeo(new RoundedBoxGeometry(0.14, 0.14, 0.08, 3, 0.05));
    const centerButton = new THREE.Mesh(buttonGeo, buttonMat);
    centerButton.position.set(0, -0.28, 0.01);
    accessoryPivot.add(centerButton);

    addStandardLimbs(frogMat);
    addCenteredUpwardTail([0.22, 0.19], [frogMat, frogMat]);
  }

  // Add subtle paw pads under feet for mammals
  if (useStandardFootPads) {
    const padMat = makeClayMat('#5A3D31', 0.8);
    const lPad = new THREE.Mesh(footPadGeo, padMat);
    lPad.position.set(0, -0.34, 0.02);
    leftLegPivot.add(lPad);
    const rPad = new THREE.Mesh(footPadGeo, padMat);
    rPad.position.set(0, -0.34, 0.02);
    rightLegPivot.add(rPad);
  }

  return {
    id,
    rootGroup,
    bodyGroup,
    headPivot,
    leftEarPivot,
    rightEarPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    tailPivot,
    accessoryPivot,
    leftEyeMesh: leftEyeGroup,
    rightEyeMesh: rightEyeGroup,
    contactShadow,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      clayBump.dispose();
    },
  };
}

/**
 * Applies a computed KinematicFrame + subtle pointer look-target onto a CharacterRig.
 */
export function applyKinematicsToRig(
  rig: CharacterRig,
  frame: KinematicFrame,
  pointerX = 0,
  pointerY = 0
): void {
  rig.bodyGroup.position.set(0, frame.rootY, frame.rootZ);
  rig.bodyGroup.rotation.set(frame.rootRotX, frame.rootRotY, frame.rootRotZ);
  rig.bodyGroup.scale.set(frame.scaleX, frame.scaleY, frame.scaleZ);

  // Combine animation head rotation with responsive cursor tracking
  rig.headPivot.position.y = 1.0 + frame.headYOffset;
  rig.headPivot.rotation.set(
    frame.headRotX - pointerY * 0.18,
    frame.headRotY + pointerX * 0.28,
    frame.headRotZ - pointerX * 0.08
  );

  // Keep frog's top-mounted eyes gently bobbing rather than tilting sideways like ears
  if (rig.id === 'frog') {
    rig.leftEarPivot.rotation.z = frame.leftEarRotZ * 0.25;
    rig.rightEarPivot.rotation.z = frame.rightEarRotZ * 0.25;
  } else {
    rig.leftEarPivot.rotation.z = frame.leftEarRotZ;
    rig.rightEarPivot.rotation.z = frame.rightEarRotZ;
  }

  rig.leftArmPivot.rotation.set(frame.leftArmRotX, 0, frame.leftArmRotZ);
  rig.rightArmPivot.rotation.set(frame.rightArmRotX, 0, frame.rightArmRotZ);

  rig.leftLegPivot.rotation.x = frame.leftLegRotX;
  rig.rightLegPivot.rotation.x = frame.rightLegRotX;

  rig.tailPivot.rotation.set(frame.tailRotX, frame.tailRotY, frame.tailRotZ);

  rig.accessoryPivot.position.y = 0.96 + frame.accessoryBounce * 0.14;
  rig.accessoryPivot.rotation.x = -frame.accessoryBounce * 0.65;

  rig.leftEyeMesh.scale.y = frame.blinkScaleY;
  rig.rightEyeMesh.scale.y = frame.blinkScaleY;

  rig.contactShadow.scale.set(frame.shadowScale, 1, frame.shadowScale);
  const shadowMat = rig.contactShadow.material as THREE.MeshBasicMaterial;
  shadowMat.opacity = frame.shadowOpacity;
}
