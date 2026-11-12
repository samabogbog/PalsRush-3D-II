import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CharacterRig } from './proceduralBlocks';
import { EQUIPMENT_CATALOG, EquippedLoadout } from './equipmentTypes';

const EQUIP_GROUP_NAMES = {
  weapon: '__equipped_weapon__',
  headgear: '__equipped_headgear__',
  cape: '__equipped_cape__',
  aura: '__equipped_aura__',
};

function clearExistingAttachment(parent: THREE.Object3D, name: string) {
  const existing = parent.getObjectByName(name);
  if (existing) {
    parent.remove(existing);
  }
}

function buildWeaponMesh(weaponId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = EQUIP_GROUP_NAMES.weapon;
  // Position in rightArmPivot space so the character holds the weapon forward in their right paw
  group.position.set(0.18, -0.34, 0.22);
  group.rotation.set(0.35, 0, -0.1);

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#92400E',
    roughness: 0.75,
  });

  if (weaponId === 'w_squeaky_duck') {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.72, 10),
      new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.5 })
    );
    handle.position.set(0, 0.16, 0);
    group.add(handle);

    const malletHead = new THREE.Mesh(
      new RoundedBoxGeometry(0.46, 0.34, 0.36, 4, 0.12),
      new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.35 })
    );
    malletHead.position.set(0, 0.54, 0.04);
    group.add(malletHead);

    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.4 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.52, 0.28);
    group.add(beak);
  } else if (weaponId === 'w_mama_slipper') {
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8),
      woodMat
    );
    grip.position.set(0, 0.05, 0);
    group.add(grip);

    const sole = new THREE.Mesh(
      new RoundedBoxGeometry(0.36, 0.68, 0.11, 4, 0.05),
      new THREE.MeshStandardMaterial({ color: '#EC4899', roughness: 0.45 })
    );
    sole.position.set(0, 0.44, 0.02);
    group.add(sole);

    const strapL = new THREE.Mesh(
      new RoundedBoxGeometry(0.18, 0.07, 0.14, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.35 })
    );
    strapL.position.set(-0.06, 0.48, 0.06);
    strapL.rotation.z = 0.55;
    const strapR = strapL.clone();
    strapR.position.x = 0.06;
    strapR.rotation.z = -0.55;
    group.add(strapL, strapR);
  } else if (weaponId === 'w_golden_wok') {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.52, 10),
      woodMat
    );
    handle.position.set(0, 0.12, 0);
    group.add(handle);

    const wokPan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.22, 0.16, 16),
      new THREE.MeshStandardMaterial({
        color: '#1E293B',
        metalness: 0.65,
        roughness: 0.3,
      })
    );
    wokPan.rotation.x = Math.PI / 2;
    wokPan.position.set(0, 0.52, 0.04);
    group.add(wokPan);

    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 20),
      new THREE.MeshStandardMaterial({
        color: '#F59E0B',
        metalness: 0.7,
        roughness: 0.25,
      })
    );
    goldRim.position.set(0, 0.52, 0.1);
    group.add(goldRim);

    const flameCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: '#F97316',
        emissive: '#EF4444',
        emissiveIntensity: 0.7,
      })
    );
    flameCore.position.set(0, 0.52, 0.14);
    group.add(flameCore);
  } else if (weaponId === 'w_durian_mace') {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.075, 0.62, 10),
      woodMat
    );
    handle.position.set(0, 0.16, 0);
    group.add(handle);

    const durianCore = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.28, 1),
      new THREE.MeshStandardMaterial({
        color: '#65A30D',
        roughness: 0.45,
      })
    );
    durianCore.position.set(0, 0.58, 0);
    group.add(durianCore);

    const spikeMat = new THREE.MeshStandardMaterial({
      color: '#FACC15',
      emissive: '#CA8A04',
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });
    const spikeDirs: [number, number, number][] = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, -1],
      [0.7, 0.7, 0],
      [-0.7, 0.7, 0],
      [0, 0.7, 0.7],
      [0, 0.7, -0.7],
    ];
    for (const [dx, dy, dz] of spikeDirs) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.22, 6),
        spikeMat
      );
      spike.position.set(dx * 0.26, 0.58 + dy * 0.26, dz * 0.26);
      spike.lookAt(dx * 2, 0.58 + dy * 2, dz * 2);
      spike.rotateX(Math.PI / 2);
      group.add(spike);
    }
  } else {
    // w_popsicle_wand (Rainbow Popsicle Scepter)
    const stick = new THREE.Mesh(
      new RoundedBoxGeometry(0.11, 0.48, 0.05, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: '#FDE68A', roughness: 0.7 })
    );
    stick.position.set(0, 0.1, 0);
    group.add(stick);

    const layerColors = ['#F472B6', '#FDE047', '#38BDF8'];
    layerColors.forEach((hex, idx) => {
      const bar = new THREE.Mesh(
        new RoundedBoxGeometry(0.34, 0.22, 0.18, 4, 0.06),
        new THREE.MeshStandardMaterial({
          color: hex,
          emissive: hex,
          emissiveIntensity: 0.28,
          roughness: 0.22,
        })
      );
      bar.position.set(0, 0.36 + idx * 0.19, 0);
      group.add(bar);
    });
  }

  return group;
}

function buildHeadgearMesh(headgearId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = EQUIP_GROUP_NAMES.headgear;
  // Top of head in headPivot space
  group.position.set(0, 1.32, 0.02);

  if (headgearId === 'h_propeller_cap') {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.52,
        16,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      ),
      new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.55 })
    );
    dome.position.y = -0.05;
    group.add(dome);

    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: '#EF4444' })
    );
    pin.position.y = 0.48;
    group.add(pin);

    const blade = new THREE.Mesh(
      new RoundedBoxGeometry(0.68, 0.04, 0.12, 2, 0.015),
      new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.3 })
    );
    blade.name = '__propeller_blade__';
    blade.position.y = 0.58;
    group.add(blade);
  } else if (headgearId === 'h_noodle_pot') {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.54, 0.42, 16),
      new THREE.MeshStandardMaterial({
        color: '#F59E0B',
        metalness: 0.55,
        roughness: 0.3,
      })
    );
    pot.position.y = 0.16;
    group.add(pot);

    const handleL = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.035, 8, 14),
      new THREE.MeshStandardMaterial({ color: '#D97706', metalness: 0.5 })
    );
    handleL.position.set(-0.52, 0.18, 0);
    const handleR = handleL.clone();
    handleR.position.x = 0.52;
    group.add(handleL, handleR);
  } else if (headgearId === 'h_viking_plunger') {
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.54,
        16,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      ),
      new THREE.MeshStandardMaterial({
        color: '#64748B',
        metalness: 0.6,
        roughness: 0.35,
      })
    );
    helm.position.y = -0.04;
    group.add(helm);

    const hornMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.4,
    });
    const hornL = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.48, 10),
      hornMat
    );
    hornL.position.set(-0.58, 0.25, 0);
    hornL.rotation.z = 0.65;
    const hornR = hornL.clone();
    hornR.position.x = 0.58;
    hornR.rotation.z = -0.65;
    group.add(hornL, hornR);

    const plungerCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.24, 0.18, 14),
      new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.5 })
    );
    plungerCup.position.y = 0.54;
    const plungerStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.6 })
    );
    plungerStick.position.y = 0.8;
    group.add(plungerCup, plungerStick);
  } else if (headgearId === 'h_glacier_crown') {
    const baseRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.44, 0.2, 12),
      new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        emissive: '#0284C7',
        emissiveIntensity: 0.35,
        roughness: 0.2,
      })
    );
    baseRing.position.y = 0.08;
    group.add(baseRing);

    const spireMat = new THREE.MeshStandardMaterial({
      color: '#E0F2FE',
      emissive: '#38BDF8',
      emissiveIntensity: 0.5,
      roughness: 0.15,
    });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.42, 6),
        spireMat
      );
      spire.position.set(Math.cos(ang) * 0.42, 0.34, Math.sin(ang) * 0.42);
      group.add(spire);
    }
  } else {
    // h_disco_afro
    const afro = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.62, 2),
      new THREE.MeshStandardMaterial({
        color: '#A855F7',
        roughness: 0.8,
      })
    );
    afro.position.y = 0.24;
    group.add(afro);

    const discoBall = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 1),
      new THREE.MeshStandardMaterial({
        color: '#FACC15',
        emissive: '#F59E0B',
        emissiveIntensity: 0.45,
        metalness: 0.8,
        roughness: 0.15,
      })
    );
    discoBall.position.y = 0.92;
    group.add(discoBall);
  }

  return group;
}

function buildCapeMesh(capeId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = EQUIP_GROUP_NAMES.cape;
  // Back of torso in bodyGroup space
  group.position.set(0, 0.78, -0.48);

  if (capeId === 'c_towel_cape' || capeId === 'c_royal_ermine') {
    const isRoyal = capeId === 'c_royal_ermine';
    const capeCloth = new THREE.Mesh(
      new RoundedBoxGeometry(0.96, 0.82, 0.08, 3, 0.03),
      new THREE.MeshStandardMaterial({
        color: isRoyal ? '#B91C1C' : '#38BDF8',
        roughness: 0.65,
      })
    );
    capeCloth.position.set(0, -0.26, -0.08);
    capeCloth.rotation.x = 0.22;
    group.add(capeCloth);

    const collar = new THREE.Mesh(
      new RoundedBoxGeometry(1.06, 0.18, 0.22, 3, 0.06),
      new THREE.MeshStandardMaterial({
        color: isRoyal ? '#FEF08A' : '#BAE6FD',
        roughness: 0.5,
      })
    );
    collar.position.set(0, 0.12, 0.02);
    group.add(collar);
  } else if (capeId === 'c_cardboard_wings' || capeId === 'c_dragon_wings') {
    const isDragon = capeId === 'c_dragon_wings';
    const wingMat = new THREE.MeshStandardMaterial({
      color: isDragon ? '#7C3AED' : '#D97706',
      emissive: isDragon ? '#581C87' : '#000000',
      emissiveIntensity: isDragon ? 0.35 : 0,
      roughness: 0.45,
    });
    const wingL = new THREE.Mesh(
      new RoundedBoxGeometry(0.75, 0.52, 0.09, 3, 0.03),
      wingMat
    );
    wingL.position.set(-0.56, -0.02, -0.06);
    wingL.rotation.set(0, 0.28, 0.24);

    const wingR = wingL.clone();
    wingR.position.x = 0.56;
    wingR.rotation.set(0, -0.28, -0.24);
    group.add(wingL, wingR);
  } else {
    // c_soda_jetpack
    const tankMat = new THREE.MeshStandardMaterial({
      color: '#DC2626',
      roughness: 0.3,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: '#22C55E',
      roughness: 0.4,
    });
    for (const side of [-0.24, 0.24]) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.62, 12),
        tankMat
      );
      bottle.position.set(side, -0.14, -0.08);
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.14, 10),
        capMat
      );
      cap.position.set(side, 0.22, -0.08);
      group.add(bottle, cap);
    }
  }

  return group;
}

function buildAuraMesh(auraId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = EQUIP_GROUP_NAMES.aura;
  group.position.set(0, 0.14, 0);

  const spec = EQUIPMENT_CATALOG[auraId];
  const primaryHex = spec?.primaryHex ?? '#38BDF8';
  const secondaryHex = spec?.secondaryHex ?? '#FACC15';

  // Ground glow ring
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.055, 10, 32),
    new THREE.MeshStandardMaterial({
      color: primaryHex,
      emissive: primaryHex,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
    })
  );
  baseRing.rotation.x = Math.PI / 2;
  group.add(baseRing);

  // 6 orbiting 3D elemental shards/bubbles/stars around the character
  const orbitCount = auraId === 'a_thunder_god' || auraId === 'a_rainbow_party' ? 8 : 6;
  const rainbowPalette = [
    '#EF4444',
    '#F97316',
    '#FACC15',
    '#22C55E',
    '#38BDF8',
    '#A855F7',
    '#EC4899',
    '#06B6D4',
  ];

  for (let i = 0; i < orbitCount; i++) {
    const ang = (i / orbitCount) * Math.PI * 2;
    const itemColor =
      auraId === 'a_rainbow_party'
        ? rainbowPalette[i % rainbowPalette.length]
        : i % 2 === 0
          ? primaryHex
          : secondaryHex;

    const orbGeo =
      auraId === 'a_soap_bubbles'
        ? new THREE.SphereGeometry(0.14, 12, 12)
        : new THREE.OctahedronGeometry(0.16, 0);

    const orb = new THREE.Mesh(
      orbGeo,
      new THREE.MeshStandardMaterial({
        color: itemColor,
        emissive: itemColor,
        emissiveIntensity: 0.75,
        transparent: auraId === 'a_soap_bubbles',
        opacity: auraId === 'a_soap_bubbles' ? 0.68 : 0.95,
        roughness: 0.15,
      })
    );
    orb.position.set(
      Math.cos(ang) * 1.15,
      0.38 + (i % 2) * 0.28,
      Math.sin(ang) * 1.15
    );
    group.add(orb);
  }

  return group;
}

/**
 * Attaches or updates the 4-slot 3D equipment models on any CharacterRig.
 */
export function attachEquipmentToCharacterRig(
  rig: CharacterRig,
  loadout?: EquippedLoadout | null
): void {
  clearExistingAttachment(rig.rightArmPivot, EQUIP_GROUP_NAMES.weapon);
  clearExistingAttachment(rig.rightArmPivot, '__slap_wooden_club__');
  clearExistingAttachment(rig.headPivot, EQUIP_GROUP_NAMES.headgear);
  clearExistingAttachment(rig.bodyGroup, EQUIP_GROUP_NAMES.cape);
  clearExistingAttachment(rig.rootGroup, EQUIP_GROUP_NAMES.aura);

  // Always attach the 3D Wooden Club (ไม้กระบอง) for the [F] Slap Swing animation (hidden until swinging)
  rig.rightArmPivot.add(buildWoodenClubMesh());

  if (!loadout) return;

  if (loadout.weapon && EQUIPMENT_CATALOG[loadout.weapon]) {
    rig.rightArmPivot.add(buildWeaponMesh(loadout.weapon));
  }
  if (loadout.headgear && EQUIPMENT_CATALOG[loadout.headgear]) {
    rig.headPivot.add(buildHeadgearMesh(loadout.headgear));
  }
  if (loadout.cape && EQUIPMENT_CATALOG[loadout.cape]) {
    rig.bodyGroup.add(buildCapeMesh(loadout.cape));
  }
  if (loadout.aura && EQUIPMENT_CATALOG[loadout.aura]) {
    rig.rootGroup.add(buildAuraMesh(loadout.aura));
  }
}

/**
 * Builds a tactile 3D Chibi Wooden Club (ไม้กระบอง) with leather grip, tapered oak barrel,
 * wood ring bands, and cute rounded wooden studs + golden swoosh trail.
 */
function buildWoodenClubMesh(): THREE.Group {
  const clubGroup = new THREE.Group();
  clubGroup.name = '__slap_wooden_club__';
  clubGroup.position.set(0.18, -0.32, 0.24);
  clubGroup.rotation.set(0.45, 0, -0.12);
  clubGroup.visible = false;

  const darkOakMat = new THREE.MeshStandardMaterial({
    color: '#78350F',
    roughness: 0.72,
  });
  const warmWoodMat = new THREE.MeshStandardMaterial({
    color: '#B45309',
    roughness: 0.62,
  });
  const lightStudMat = new THREE.MeshStandardMaterial({
    color: '#FDE68A',
    roughness: 0.45,
  });
  const leatherWrapMat = new THREE.MeshStandardMaterial({
    color: '#FEF3C7',
    roughness: 0.85,
  });

  // Pommel knob
  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 10, 10),
    darkOakMat
  );
  pommel.position.set(0, -0.06, 0);
  clubGroup.add(pommel);

  // Leather wrapped handle grip
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.052, 0.34, 10),
    leatherWrapMat
  );
  grip.position.set(0, 0.12, 0);
  clubGroup.add(grip);

  // Tapered hefty wooden club barrel (ไม้กระบอง)
  const clubBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.075, 0.78, 12),
    warmWoodMat
  );
  clubBarrel.position.set(0, 0.62, 0);
  clubBarrel.castShadow = true;
  clubGroup.add(clubBarrel);

  // Rounded club dome tip
  const clubTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.208, 12, 10),
    warmWoodMat
  );
  clubTip.position.set(0, 1.0, 0);
  clubTip.scale.set(1, 0.65, 1);
  clubGroup.add(clubTip);

  // Dark wood grain ring band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.024, 8, 16),
    darkOakMat
  );
  band.rotation.x = Math.PI / 2;
  band.position.set(0, 0.76, 0);
  clubGroup.add(band);

  // Cute chunky wooden studs around the club head
  const studAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
  studAngles.forEach((ang, idx) => {
    const r = idx % 2 === 0 ? 0.19 : 0.16;
    const yPos = idx % 2 === 0 ? 0.84 : 0.64;
    const stud = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.15, 7),
      lightStudMat
    );
    stud.position.set(Math.cos(ang) * r, yPos, Math.sin(ang) * r);
    stud.lookAt(Math.cos(ang) * 2, yPos, Math.sin(ang) * 2);
    stud.rotateX(Math.PI / 2);
    clubGroup.add(stud);
  });

  // Dynamic glowing motion swoosh fin along the club head
  const swooshGeo = new RoundedBoxGeometry(0.06, 0.68, 0.34, 2, 0.02);
  const swooshMat = new THREE.MeshBasicMaterial({
    color: '#FDE047',
    transparent: true,
    opacity: 0.75,
  });
  const swoosh = new THREE.Mesh(swooshGeo, swooshMat);
  swoosh.name = '__club_swoosh__';
  swoosh.position.set(-0.16, 0.74, 0);
  clubGroup.add(swoosh);

  return clubGroup;
}

/**
 * Animates rotating 3D aura rings, propeller caps, and wooden club slap swings.
 */
export function animateEquipmentOnRig(
  rig: CharacterRig,
  elapsedSec: number,
  attackSwingPhase = 0
): void {
  const auraGroup = rig.rootGroup.getObjectByName(EQUIP_GROUP_NAMES.aura);
  if (auraGroup) {
    auraGroup.rotation.y = elapsedSec * 2.1;
    auraGroup.position.y = 0.14 + Math.sin(elapsedSec * 3.6) * 0.06;
  }

  const headGroup = rig.headPivot.getObjectByName(EQUIP_GROUP_NAMES.headgear);
  if (headGroup) {
    const blade = headGroup.getObjectByName('__propeller_blade__');
    if (blade) {
      blade.rotation.y = elapsedSec * 14.0;
    }
  }

  let clubGroup = rig.rightArmPivot.getObjectByName('__slap_wooden_club__');
  if (!clubGroup) {
    clubGroup = buildWoodenClubMesh();
    rig.rightArmPivot.add(clubGroup);
  }
  const equippedWeapon = rig.rightArmPivot.getObjectByName(
    EQUIP_GROUP_NAMES.weapon
  );

  if (attackSwingPhase > 0) {
    // Note: attackSwingPhase counts down from 1.0 -> 0.0 during slapAnimTimer
    const progress = 1.0 - attackSwingPhase; // 0.0 (start) -> 1.0 (end)
    const swingSin = Math.sin(progress * Math.PI);
    // Wide 180-degree horizontal-diagonal club cleave from right-back across to front-left!
    const sweepArc = Math.cos(progress * Math.PI); // +1 (windup right) -> -1 (follow-through left)

    clubGroup.visible = true;
    clubGroup.scale.setScalar(1.0 + swingSin * 0.35);
    clubGroup.rotation.set(
      0.85 + swingSin * 0.55,
      sweepArc * 0.45,
      -0.35 - sweepArc * 0.85
    );

    if (equippedWeapon) {
      equippedWeapon.visible = false;
    }

    rig.rightArmPivot.rotation.x = -1.55 * swingSin - 0.35;
    rig.rightArmPivot.rotation.y = sweepArc * 1.15;
    rig.rightArmPivot.rotation.z = 0.65 * sweepArc + 0.35 * swingSin;
    rig.bodyGroup.rotation.y += sweepArc * 0.42 * swingSin;
  } else {
    clubGroup.visible = false;
    if (equippedWeapon) {
      equippedWeapon.visible = true;
    }
  }
}
