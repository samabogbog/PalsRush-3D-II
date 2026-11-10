export type CharacterId =
  | 'bear'
  | 'panda'
  | 'red_panda'
  | 'raccoon'
  | 'cat'
  | 'dog'
  | 'sheep'
  | 'pig'
  | 'elephant'
  | 'hippo'
  | 'lion'
  | 'tiger'
  | 'penguin'
  | 'duck'
  | 'owl'
  | 'frog';

export type AnimationPose = 'idle' | 'jump' | 'run' | 'cool';

export type ActiveSkillId =
  | 'dash'
  | 'shield'
  | 'spring'
  | 'quake'
  | 'whirlwind';

export type PassiveSkillId =
  | 'nimble_paws'
  | 'bouncy_belly'
  | 'feather_hop'
  | 'slime_boots'
  | 'lucky_magnet';

// Alias for backward compatibility
export type SkillId = ActiveSkillId;

export type ItemId = 'glove' | 'honey' | 'pie' | 'pepper' | 'magnet';

export interface ActiveSkillSpec {
  id: ActiveSkillId;
  name: string;
  activeTitle: string;
  activeDescription: string;
  cooldownSec: number;
  durationSec: number;
  colorHex: string;
}

export interface PassiveSkillSpec {
  id: PassiveSkillId;
  name: string;
  passiveTitle: string;
  passiveDescription: string;
  colorHex: string;
}

export const ACTIVE_SKILLS: Record<ActiveSkillId, ActiveSkillSpec> = {
  dash: {
    id: 'dash',
    name: 'Turbo Dash',
    activeTitle: 'Jet Dash (Q)',
    activeDescription:
      'Burst forward at 1.75x speed for 1.8s & cleanse Sticky Slime slow',
    cooldownSec: 8.5,
    durationSec: 1.8,
    colorHex: '#F59E0B',
  },
  shield: {
    id: 'shield',
    name: 'Bubble Shield',
    activeTitle: 'Bubble Guard (Q)',
    activeDescription:
      'Elastic bubble for 3.6s blocks slaps, items & boulders, bouncing rivals away',
    cooldownSec: 10.5,
    durationSec: 3.6,
    colorHex: '#06B6D4',
  },
  spring: {
    id: 'spring',
    name: 'Spring Hop',
    activeTitle: 'Super Spring (Q)',
    activeDescription:
      'High spring leap vaults over water ponds, beams & boulders with air boost',
    cooldownSec: 7.5,
    durationSec: 1.0,
    colorHex: '#84CC16',
  },
  quake: {
    id: 'quake',
    name: 'Shockwave Stomp',
    activeTitle: 'Dizzy Quake (Q)',
    activeDescription:
      '4.0u shockwave ring wobbles & slows all nearby rivals by 38%',
    cooldownSec: 9.5,
    durationSec: 1.2,
    colorHex: '#EC4899',
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Cyclone Spin',
    activeTitle: 'Cyclone Spin (Q)',
    activeDescription:
      'Tornado spin for 2.2s (+28% speed) that automatically knocks rivals sideways!',
    cooldownSec: 10.0,
    durationSec: 2.2,
    colorHex: '#8B5CF6',
  },
};

export const ACTIVE_SKILL_LIST: ActiveSkillId[] = [
  'dash',
  'shield',
  'spring',
  'quake',
  'whirlwind',
];

export const PASSIVE_SKILLS: Record<PassiveSkillId, PassiveSkillSpec> = {
  nimble_paws: {
    id: 'nimble_paws',
    name: 'Nimble Paws',
    passiveTitle: 'Nimble Paws (Auto)',
    passiveDescription:
      '+8% base top speed & 35% faster stun/knockback recovery',
    colorHex: '#F59E0B',
  },
  bouncy_belly: {
    id: 'bouncy_belly',
    name: 'Bouncy Belly',
    passiveTitle: 'Bouncy Belly (Auto)',
    passiveDescription:
      'Reduces sideways knockback from F slaps, boulders & beams by 45%',
    colorHex: '#06B6D4',
  },
  feather_hop: {
    id: 'feather_hop',
    name: 'Feather Hop',
    passiveTitle: 'Feather Hop (Auto)',
    passiveDescription:
      '+22% jump height & +20% speed burst on every landing and downhill slope',
    colorHex: '#84CC16',
  },
  slime_boots: {
    id: 'slime_boots',
    name: 'Slime Boots',
    passiveTitle: 'Slime Boots (Auto)',
    passiveDescription:
      'Reduces Sticky Slime & Honey slowdown by 70% & widens F slap reach +22%',
    colorHex: '#EC4899',
  },
  lucky_magnet: {
    id: 'lucky_magnet',
    name: 'Lucky Pocket',
    passiveTitle: 'Lucky Pocket (Auto)',
    passiveDescription:
      'Item Boxes cut Q & F cooldowns by 2.0s & boost speed-pad duration +30%',
    colorHex: '#8B5CF6',
  },
};

export const PASSIVE_SKILL_LIST: PassiveSkillId[] = [
  'nimble_paws',
  'bouncy_belly',
  'feather_hop',
  'slime_boots',
  'lucky_magnet',
];

// Combined lookup for legacy references
export const SKILLS = ACTIVE_SKILLS;

export interface ItemSpec {
  id: ItemId;
  name: string;
  shortLabel: string;
  description: string;
  colorHex: string;
}

export const ITEMS: Record<ItemId, ItemSpec> = {
  glove: {
    id: 'glove',
    name: 'Boing Boxing Glove',
    shortLabel: 'Boxing Glove',
    description: 'Lunges forward & bonks the nearest rival sideways!',
    colorHex: '#EF4444',
  },
  honey: {
    id: 'honey',
    name: 'Sticky Honey Trap',
    shortLabel: 'Honey Trap',
    description: 'Drops a gooey puddle behind you that slows & spins rivals!',
    colorHex: '#F59E0B',
  },
  pie: {
    id: 'pie',
    name: 'Cream Pie Toss',
    shortLabel: 'Cream Pie',
    description: 'Lobs a splat pie forward to wobble & slow the leader ahead!',
    colorHex: '#F472B6',
  },
  pepper: {
    id: 'pepper',
    name: 'Golden Pepper Turbo',
    shortLabel: 'Spicy Turbo',
    description: 'Instant 2.4s spicy speed boost through any terrain!',
    colorHex: '#EA580C',
  },
  magnet: {
    id: 'magnet',
    name: 'Dizzy Magnet Pull',
    shortLabel: 'Magnet Pull',
    description: 'Zips you forward while tugging the rival ahead backward!',
    colorHex: '#6366F1',
  },
};

export const ITEM_LIST: ItemId[] = ['glove', 'honey', 'pie', 'pepper', 'magnet'];

export interface CharacterSpec {
  id: CharacterId;
  index: number;
  row: 1 | 2 | 3 | 4;
  name: string;
  shortName: string;
  species: string;
  accessory: string;
  personality: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  blockCount: number;
  bevelRadius: string;
  activeSkillId: ActiveSkillId;
  passiveSkillId: PassiveSkillId;
}

export const CHARACTERS: CharacterSpec[] = [
  // ================= ROW 1: WOODLAND PALS (01 - 04) =================
  {
    id: 'bear',
    index: 0,
    row: 1,
    name: 'Bramble Bear',
    shortName: 'Bear',
    species: 'Honey Brown Bear',
    accessory: 'Golden Knit Block Scarf',
    personality: 'Warm, bouncy & curious',
    primaryHex: '#B56E3E',
    secondaryHex: '#F3D8B6',
    accentHex: '#F0AE34',
    blockCount: 19,
    bevelRadius: '0.34u',
    activeSkillId: 'quake',
    passiveSkillId: 'bouncy_belly',
  },
  {
    id: 'panda',
    index: 1,
    row: 1,
    name: 'Mochi Panda',
    shortName: 'Panda',
    species: 'Giant Bamboo Panda',
    accessory: 'Sage Triangle Bandana',
    personality: 'Playful, clumsy & bubbly',
    primaryHex: '#F3ECE1',
    secondaryHex: '#3D3532',
    accentHex: '#7E9B6B',
    blockCount: 20,
    bevelRadius: '0.34u',
    activeSkillId: 'shield',
    passiveSkillId: 'slime_boots',
  },
  {
    id: 'red_panda',
    index: 2,
    row: 1,
    name: 'Rusty Red Panda',
    shortName: 'Red Panda',
    species: 'Himalayan Red Panda',
    accessory: 'Coral Scarf & Striped Tail',
    personality: 'Mischievous, zippy & energetic',
    primaryHex: '#D4652B',
    secondaryHex: '#5E321D',
    accentHex: '#D9584E',
    blockCount: 26,
    bevelRadius: '0.32u',
    activeSkillId: 'dash',
    passiveSkillId: 'feather_hop',
  },
  {
    id: 'raccoon',
    index: 3,
    row: 1,
    name: 'Bandit Raccoon',
    shortName: 'Raccoon',
    species: 'Masked Trash Panda',
    accessory: 'Slate Buttoned Vest',
    personality: 'Cheeky, nimble & restless',
    primaryHex: '#9C8778',
    secondaryHex: '#3E3632',
    accentHex: '#465F82',
    blockCount: 27,
    bevelRadius: '0.32u',
    activeSkillId: 'whirlwind',
    passiveSkillId: 'lucky_magnet',
  },

  // ================= ROW 2: COZY FARM & PETS (05 - 08) =================
  {
    id: 'cat',
    index: 4,
    row: 2,
    name: 'Marmalade Cat',
    shortName: 'Cat',
    species: 'Ginger Tabby Kitty',
    accessory: 'Lavender Bow Tie & Striped Tail',
    personality: 'Frisky, purring & agile',
    primaryHex: '#F6E7D2',
    secondaryHex: '#E08A3E',
    accentHex: '#9F74B5',
    blockCount: 28,
    bevelRadius: '0.33u',
    activeSkillId: 'spring',
    passiveSkillId: 'nimble_paws',
  },
  {
    id: 'dog',
    index: 5,
    row: 2,
    name: 'Biscuit Puppy',
    shortName: 'Puppy',
    species: 'Floppy-Eared Spotted Pup',
    accessory: 'Sage Collar with Gold Buckle',
    personality: 'Loyal, tail-wagging & eager',
    primaryHex: '#F1D7B4',
    secondaryHex: '#985D38',
    accentHex: '#849E69',
    blockCount: 23,
    bevelRadius: '0.34u',
    activeSkillId: 'dash',
    passiveSkillId: 'lucky_magnet',
  },
  {
    id: 'sheep',
    index: 6,
    row: 2,
    name: 'Cloudy Sheep',
    shortName: 'Sheep',
    species: 'Fluffy Wool Lamb',
    accessory: 'Periwinkle Blue Bow Tie',
    personality: 'Soft, dreamy & bouncy',
    primaryHex: '#F8F2E6',
    secondaryHex: '#F2CCB0',
    accentHex: '#6580B2',
    blockCount: 38,
    bevelRadius: '0.36u',
    activeSkillId: 'shield',
    passiveSkillId: 'feather_hop',
  },
  {
    id: 'pig',
    index: 7,
    row: 2,
    name: 'Peachy Piglet',
    shortName: 'Piglet',
    species: 'Rosy Meadow Piglet',
    accessory: 'Golden Bandana & Curly Tail',
    personality: 'Cheerful, wiggly & upbeat',
    primaryHex: '#F3A79D',
    secondaryHex: '#E68A7F',
    accentHex: '#F2B53D',
    blockCount: 24,
    bevelRadius: '0.34u',
    activeSkillId: 'whirlwind',
    passiveSkillId: 'slime_boots',
  },

  // ================= ROW 3: SAFARI CREW (09 - 12) =================
  {
    id: 'elephant',
    index: 8,
    row: 3,
    name: 'Bumbo Elephant',
    shortName: 'Elephant',
    species: 'Powder-Blue Baby Elephant',
    accessory: 'Ochre Buttoned Vest & Big Ears',
    personality: 'Gentle, playful & expressive',
    primaryHex: '#8FAAC2',
    secondaryHex: '#F0B0AD',
    accentHex: '#E5AE4E',
    blockCount: 26,
    bevelRadius: '0.34u',
    activeSkillId: 'quake',
    passiveSkillId: 'bouncy_belly',
  },
  {
    id: 'hippo',
    index: 9,
    row: 3,
    name: 'Bubbles Hippo',
    shortName: 'Hippo',
    species: 'Lavender River Hippo',
    accessory: 'Coral Bandana & Chibi Tusks',
    personality: 'Jolly, stompy & bubbly',
    primaryHex: '#A688B0',
    secondaryHex: '#CBB1D3',
    accentHex: '#DF665F',
    blockCount: 24,
    bevelRadius: '0.35u',
    activeSkillId: 'shield',
    passiveSkillId: 'bouncy_belly',
  },
  {
    id: 'lion',
    index: 10,
    row: 3,
    name: 'Sunny Lion',
    shortName: 'Lion',
    species: 'Golden Savannah Cub',
    accessory: '12-Block Crown Mane & Tufted Tail',
    personality: 'Proud, energetic & fearless',
    primaryHex: '#F4BC52',
    secondaryHex: '#C96631',
    accentHex: '#FBE0A2',
    blockCount: 33,
    bevelRadius: '0.33u',
    activeSkillId: 'whirlwind',
    passiveSkillId: 'nimble_paws',
  },
  {
    id: 'tiger',
    index: 11,
    row: 3,
    name: 'Tango Tiger',
    shortName: 'Tiger',
    species: 'Striped Bengal Tiger Cub',
    accessory: 'Sage Bandana & Forehead Stripes',
    personality: 'Bouncy, pouncing & spirited',
    primaryHex: '#E88035',
    secondaryHex: '#59311C',
    accentHex: '#7E9B6B',
    blockCount: 31,
    bevelRadius: '0.33u',
    activeSkillId: 'dash',
    passiveSkillId: 'nimble_paws',
  },

  // ================= ROW 4: BIRDS & POND PALS (13 - 16) =================
  {
    id: 'penguin',
    index: 12,
    row: 4,
    name: 'Puddle Penguin',
    shortName: 'Penguin',
    species: 'Chilly Chick Penguin',
    accessory: 'Sky-Blue Winter Scarf',
    personality: 'Waddling, peppy & cool',
    primaryHex: '#55525D',
    secondaryHex: '#F6F0E4',
    accentHex: '#6581A8',
    blockCount: 22,
    bevelRadius: '0.35u',
    activeSkillId: 'dash',
    passiveSkillId: 'slime_boots',
  },
  {
    id: 'duck',
    index: 13,
    row: 4,
    name: 'Quackers Duck',
    shortName: 'Duck',
    species: 'Buttercup Pond Duckling',
    accessory: 'Coral Bow Tie & Head Tuft',
    personality: 'Giddy, flappy & excitable',
    primaryHex: '#F6CD61',
    secondaryHex: '#E88035',
    accentHex: '#E0675F',
    blockCount: 23,
    bevelRadius: '0.34u',
    activeSkillId: 'spring',
    passiveSkillId: 'lucky_magnet',
  },
  {
    id: 'owl',
    index: 14,
    row: 4,
    name: 'Hooty Owl',
    shortName: 'Owl',
    species: 'Chestnut Woodland Owl',
    accessory: 'Scalloped Feather Chest & Ear Tufts',
    personality: 'Curious, head-tilting & alert',
    primaryHex: '#A26B4F',
    secondaryHex: '#F5E5CE',
    accentHex: '#F0A83A',
    blockCount: 27,
    bevelRadius: '0.33u',
    activeSkillId: 'shield',
    passiveSkillId: 'feather_hop',
  },
  {
    id: 'frog',
    index: 15,
    row: 4,
    name: 'Matcha Frog',
    shortName: 'Frog',
    species: 'Tree-Top Hopper Frog',
    accessory: 'Lavender Buttoned Vest',
    personality: 'Springy, grinning & hyper',
    primaryHex: '#B2C180',
    secondaryHex: '#D8E2B0',
    accentHex: '#A47FB3',
    blockCount: 22,
    bevelRadius: '0.34u',
    activeSkillId: 'spring',
    passiveSkillId: 'feather_hop',
  },
];

export interface PoseSpec {
  id: AnimationPose;
  index: number;
  label: string;
  shortLabel: string;
  description: string;
  tempoBpm: number;
}

export const POSES: PoseSpec[] = [
  {
    id: 'idle',
    index: 1,
    label: '1. Idle Bounce',
    shortLabel: 'Idle',
    description:
      'Fidgety chibi breathing, curious head tilts, ear wiggles & playful micro-hops',
    tempoBpm: 136,
  },
  {
    id: 'jump',
    index: 2,
    label: '2. Happy Jump',
    shortLabel: 'Happy Jump',
    description:
      'Exuberant joyful hops, mid-air ear flaps, raised arms & squash-and-stretch',
    tempoBpm: 168,
  },
  {
    id: 'run',
    index: 3,
    label: '3. Zippy Run',
    shortLabel: 'Run',
    description:
      'Fast mischievous scamper, rapid stubby limb swings, forward lean & tail swish',
    tempoBpm: 192,
  },
];

export interface KinematicFrame {
  rootY: number;
  rootZ: number;
  rootRotX: number;
  rootRotY: number;
  rootRotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  headYOffset: number;
  leftEarRotZ: number;
  rightEarRotZ: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
  tailRotX: number;
  tailRotY: number;
  tailRotZ: number;
  accessoryBounce: number;
  blinkScaleY: number;
  shadowScale: number;
  shadowOpacity: number;
}

/**
 * Cycles character index safely with wrap-around or clamping.
 */
export function getCharacterByIndex(index: number): CharacterSpec {
  const normalized =
    ((index % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length;
  return CHARACTERS[normalized];
}

/**
 * Pure procedural chibi animation kinematics for 1. Idle, 2. Happy Jump, and 3. Run.
 * Base squash-and-stretch and vertical bounce are calibrated to a gentle 50% baseline,
 * arms stay flush outside the torso (leftArmRotZ <= 0, rightArmRotZ >= 0),
 * and the centered upward tail wags briskly left-to-right.
 */
export function computeCharacterKinematics(
  pose: AnimationPose,
  elapsedSeconds: number,
  speedMultiplier = 1.0,
  bounceIntensity = 1.0,
  pokeImpulse = 0.0
): KinematicFrame {
  const t = elapsedSeconds * speedMultiplier;
  const amp = Math.max(0.2, Math.min(2.0, bounceIntensity));
  const poke = Math.max(0, Math.min(1.5, pokeImpulse));

  // Periodic lively blink (double-blink every ~3.4s)
  const blinkCycle = t % 3.4;
  let blinkScaleY = 1.0;
  if (
    (blinkCycle > 3.05 && blinkCycle < 3.16) ||
    (blinkCycle > 3.24 && blinkCycle < 3.35)
  ) {
    blinkScaleY = 0.12;
  }

  // Extra poke reaction overlay (halved baseline)
  const pokeHop = Math.sin(poke * Math.PI) * 0.21;
  const pokeWiggle = Math.sin(poke * Math.PI * 4) * 0.16 * poke;

  if (pose === 'cool') {
    const grooveBeat = t * 6.8;
    const bounceWave = Math.abs(Math.sin(grooveBeat));
    const grooveHop = Math.pow(bounceWave, 1.5) * 0.085 * amp + pokeHop;

    const squash = Math.cos(grooveBeat * 2) * 0.032 * amp;
    const scaleY = 1.0 + squash + poke * 0.07;
    const scaleXZ = 1.0 - squash * 0.5;

    // Confident weight shift + proud chest-out swagger
    const swaggerSway = Math.sin(grooveBeat) * 0.095 * amp;
    const swaggerTwist = Math.cos(grooveBeat) * 0.22 * amp + pokeWiggle;
    const headNod = -0.05 + Math.sin(grooveBeat * 2) * 0.085 * amp;
    const headTilt = -swaggerSway * 1.15 + Math.cos(grooveBeat) * 0.08 * amp;
    const headLook = -swaggerTwist * 0.55 + Math.sin(t * 2.2) * 0.16;

    const earPerk = Math.max(0, Math.sin(grooveBeat * 2)) * 0.18 * amp;
    const leftEarRotZ = 0.11 + earPerk;
    const rightEarRotZ = -0.11 - earPerk * 0.85;

    // Left arm cocked on hip; Right arm doing a cool hero flex / wave to the beat
    const flexWave = Math.sin(grooveBeat);
    const leftArmRotZ = -0.46 - bounceWave * 0.08 * amp - poke * 0.25;
    const leftArmRotX = 0.28 + Math.cos(grooveBeat) * 0.08 * amp;
    const rightArmRotZ =
      0.56 + Math.max(0, flexWave) * 0.38 * amp + poke * 0.35;
    const rightArmRotX = -0.52 - Math.cos(grooveBeat * 2) * 0.22 * amp;

    // Alternating cool foot tap
    const leftTap = Math.max(0, Math.sin(grooveBeat)) * 0.28 * amp;
    const rightTap = Math.max(0, -Math.sin(grooveBeat)) * 0.28 * amp;

    const tailWag = Math.sin(grooveBeat * 2) * 0.52 * amp;

    return {
      rootY: grooveHop,
      rootZ: 0,
      rootRotX: -0.065 * amp + Math.sin(grooveBeat * 2) * 0.03 * amp,
      rootRotY: swaggerTwist,
      rootRotZ: swaggerSway,
      scaleX: scaleXZ,
      scaleY,
      scaleZ: scaleXZ,
      headRotX: headNod,
      headRotY: headLook,
      headRotZ: headTilt,
      headYOffset: Math.sin(grooveBeat * 2 - 0.35) * 0.022 * amp,
      leftEarRotZ,
      rightEarRotZ,
      leftArmRotX,
      leftArmRotZ,
      rightArmRotX,
      rightArmRotZ,
      leftLegRotX: 0.06 - leftTap,
      rightLegRotX: -0.08 - rightTap,
      tailRotX: 0.1 + Math.cos(grooveBeat * 2) * 0.07 * amp,
      tailRotY: tailWag,
      tailRotZ: tailWag * 0.78,
      accessoryBounce: Math.max(0, Math.sin(grooveBeat * 2 - 0.4)) * 0.12 * amp,
      blinkScaleY,
      shadowScale: Math.max(0.64, 1.0 - grooveHop * 0.65),
      shadowOpacity: Math.max(0.22, 0.42 - grooveHop * 0.35),
    };
  }

  if (pose === 'idle') {
    const fastBeat = t * 9.5;
    const hopWave = Math.abs(Math.sin(fastBeat * 0.5));
    const microHop = Math.pow(hopWave, 1.6) * 0.07 * amp;

    const squash = Math.cos(fastBeat) * 0.0275 * amp;
    const scaleY = 1.0 + squash + poke * 0.06;
    const scaleXZ = 1.0 - squash * 0.5;

    const sway = Math.sin(fastBeat * 0.5) * 0.06 * amp;
    const lookAround =
      Math.sin(t * 2.8) * 0.16 + Math.sin(t * 6.2) * 0.06 + pokeWiggle;
    const headTilt =
      Math.cos(fastBeat * 0.5) * 0.1 * amp + Math.sin(t * 4.5) * 0.04;
    const headNod = Math.sin(fastBeat) * 0.05 * amp;

    const earTwitch = Math.max(0, Math.sin(t * 11.0)) * 0.15 * amp;
    const leftEarRotZ = 0.08 + earTwitch + Math.sin(fastBeat) * 0.05;
    const rightEarRotZ = -0.08 - earTwitch * 0.8 + Math.cos(fastBeat) * 0.05;

    const armOutwardPulse = Math.max(0, Math.sin(fastBeat)) * 0.08 * amp;
    const footTapLeft = Math.max(0, Math.sin(fastBeat * 0.5)) * 0.22 * amp;
    const footTapRight = Math.max(0, -Math.sin(fastBeat * 0.5)) * 0.22 * amp;

    const tailWag = Math.sin(fastBeat * 1.4) * 0.44 * amp;

    const rootY = microHop + pokeHop;

    return {
      rootY,
      rootZ: 0,
      rootRotX: Math.sin(fastBeat) * 0.025 * amp,
      rootRotY: lookAround * 0.45,
      rootRotZ: sway,
      scaleX: scaleXZ,
      scaleY,
      scaleZ: scaleXZ,
      headRotX: headNod,
      headRotY: lookAround * 0.65,
      headRotZ: headTilt,
      headYOffset: Math.sin(fastBeat - 0.4) * 0.018 * amp,
      leftEarRotZ,
      rightEarRotZ,
      leftArmRotX: Math.cos(fastBeat * 0.5) * 0.18 * amp,
      leftArmRotZ: -0.04 - armOutwardPulse - poke * 0.35,
      rightArmRotX: -Math.cos(fastBeat * 0.5) * 0.18 * amp,
      rightArmRotZ: 0.04 + armOutwardPulse + poke * 0.35,
      leftLegRotX: -footTapLeft,
      rightLegRotX: -footTapRight,
      tailRotX: Math.cos(fastBeat) * 0.06 * amp,
      tailRotY: tailWag,
      tailRotZ: tailWag * 0.75,
      accessoryBounce: Math.max(0, Math.sin(fastBeat - 0.6)) * 0.09 * amp,
      blinkScaleY,
      shadowScale: Math.max(0.65, 1.0 - rootY * 0.65),
      shadowOpacity: Math.max(0.22, 0.42 - rootY * 0.35),
    };
  }

  if (pose === 'jump') {
    const jumpFreq = t * 7.2;
    const rawSin = Math.sin(jumpFreq);
    const airborne = Math.max(0, rawSin);
    const jumpHeight = Math.pow(airborne, 0.78) * 0.38 * amp + pokeHop;

    const landingCompression = Math.min(0, rawSin);
    const stretch =
      airborne > 0
        ? Math.sin(airborne * Math.PI) * 0.07 * amp
        : landingCompression * 0.09 * amp;

    const scaleY = 1.0 + stretch;
    const scaleXZ = 1.0 - stretch * 0.5;

    const jumpIndex = Math.floor(jumpFreq / Math.PI);
    const tiltDir = jumpIndex % 2 === 0 ? 1 : -1;
    const airWiggle = airborne * Math.sin(t * 24) * 0.12 * amp;

    const cheerOutward = Math.pow(airborne, 0.65) * 0.78 * amp;
    const tailWag = Math.sin(t * 20.0) * 0.56 * amp;

    return {
      rootY: jumpHeight,
      rootZ: 0,
      rootRotX: (rawSin * -0.09 + Math.cos(jumpFreq) * 0.05) * amp,
      rootRotY: airWiggle + Math.sin(jumpFreq * 0.5) * 0.18 * amp + pokeWiggle,
      rootRotZ: airborne * 0.09 * tiltDir * amp,
      scaleX: scaleXZ,
      scaleY,
      scaleZ: scaleXZ,
      headRotX: -airborne * 0.16 * amp + Math.max(0, -rawSin) * 0.08,
      headRotY: Math.sin(jumpFreq * 0.5) * 0.16 * amp,
      headRotZ: airborne * 0.12 * -tiltDir * amp,
      headYOffset: airborne * 0.03 * amp,
      leftEarRotZ: 0.1 + airborne * 0.25 * amp,
      rightEarRotZ: -0.1 - airborne * 0.25 * amp,
      leftArmRotX: -0.35 * airborne,
      leftArmRotZ: -0.05 - cheerOutward,
      rightArmRotX: -0.35 * airborne,
      rightArmRotZ: 0.05 + cheerOutward,
      leftLegRotX: airborne * 0.42 * amp - Math.max(0, -rawSin) * 0.1,
      rightLegRotX: -airborne * 0.28 * amp - Math.max(0, -rawSin) * 0.1,
      tailRotX: -airborne * 0.15 * amp,
      tailRotY: tailWag,
      tailRotZ: tailWag * 0.75,
      accessoryBounce: airborne * 0.22 * amp,
      blinkScaleY: airborne > 0.65 ? 0.18 : blinkScaleY,
      shadowScale: Math.max(0.52, 1.0 - jumpHeight * 0.75),
      shadowOpacity: Math.max(0.16, 0.42 - jumpHeight * 0.45),
    };
  }

  const runCycle = t * 18.5;
  const strideSin = Math.sin(runCycle);
  const strideCos = Math.cos(runCycle);
  const doubleBounce = Math.abs(Math.sin(runCycle));
  const runHop = Math.pow(doubleBounce, 1.3) * 0.13 * amp + pokeHop;

  const squash = Math.cos(runCycle * 2) * 0.04 * amp;
  const scaleY = 1.0 + squash;
  const scaleXZ = 1.0 - squash * 0.5;

  const forwardLean = 0.18 * amp;
  const waddleRoll = strideSin * 0.1 * amp;
  const yawTwist = strideCos * 0.14 * amp + pokeWiggle;
  const tailWag = Math.sin(runCycle * 1.4) * 0.62 * amp;

  return {
    rootY: runHop,
    rootZ: Math.sin(t * 5.0) * 0.05 * amp,
    rootRotX: forwardLean + Math.sin(runCycle * 2) * 0.04 * amp,
    rootRotY: yawTwist,
    rootRotZ: waddleRoll,
    scaleX: scaleXZ,
    scaleY,
    scaleZ: scaleXZ,
    headRotX: -0.11 * amp + Math.cos(runCycle * 2) * 0.05 * amp,
    headRotY: -yawTwist * 0.65,
    headRotZ: -waddleRoll * 0.8 + Math.sin(runCycle) * 0.09 * amp,
    headYOffset: Math.sin(runCycle * 2 - 0.5) * 0.022 * amp,
    leftEarRotZ: 0.08 + Math.abs(strideSin) * 0.2 * amp,
    rightEarRotZ: -0.08 - Math.abs(strideCos) * 0.2 * amp,
    leftArmRotX: -strideSin * 0.9 * amp,
    leftArmRotZ: -0.06 - Math.abs(strideSin) * 0.1 * amp,
    rightArmRotX: strideSin * 0.9 * amp,
    rightArmRotZ: 0.06 + Math.abs(strideCos) * 0.1 * amp,
    leftLegRotX: strideSin * 0.95 * amp,
    rightLegRotX: -strideSin * 0.95 * amp,
    tailRotX: 0.08 + Math.sin(runCycle * 2) * 0.08 * amp,
    tailRotY: tailWag,
    tailRotZ: tailWag * 0.75,
    accessoryBounce: (0.09 + Math.abs(strideCos) * 0.18) * amp,
    blinkScaleY,
    shadowScale: Math.max(0.62, 1.0 - runHop * 0.7),
    shadowOpacity: Math.max(0.2, 0.42 - runHop * 0.4),
  };
}
