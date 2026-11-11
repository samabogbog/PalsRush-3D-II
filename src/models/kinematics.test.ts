import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_SKILLS,
  CHARACTERS,
  PASSIVE_SKILLS,
  POSES,
  ITEMS,
  getCharacterByIndex,
  computeCharacterKinematics,
} from './characterTypes';
import {
  createInitialRaceState,
  activateRacerSkillQ,
  activateRacerSlapF,
  activateRacerItemE,
  stepRaceSimulation,
  TOTAL_TRACK_LENGTH,
  TRACK_SEGMENTS,
  RIVER_STEPPING_STONES,
  TRACK_CATALOG,
  setActiveTrack,
  getActiveTrackId,
} from '../game/raceEngine';

test('all 16 chibi characters across 4 rows are defined in order matching reference image', () => {
  assert.equal(CHARACTERS.length, 16);
  assert.deepEqual(
    CHARACTERS.map((c) => c.id),
    [
      'bear',
      'panda',
      'red_panda',
      'raccoon',
      'cat',
      'dog',
      'sheep',
      'pig',
      'elephant',
      'hippo',
      'lion',
      'tiger',
      'penguin',
      'duck',
      'owl',
      'frog',
    ]
  );
  // Check 4 characters per row (rows 1..4)
  for (const row of [1, 2, 3, 4] as const) {
    const inRow = CHARACTERS.filter((c) => c.row === row);
    assert.equal(inRow.length, 4, `row ${row} should have 4 characters`);
  }
});

test('3 animation poses match requested Idle, Happy Jump, and Run', () => {
  assert.equal(POSES.length, 3);
  assert.deepEqual(
    POSES.map((p) => p.id),
    ['idle', 'jump', 'run']
  );
});

test('getCharacterByIndex wraps safely for negative and overflow indices across all 16 characters', () => {
  assert.equal(getCharacterByIndex(0).id, 'bear');
  assert.equal(getCharacterByIndex(15).id, 'frog');
  assert.equal(getCharacterByIndex(16).id, 'bear');
  assert.equal(getCharacterByIndex(-1).id, 'frog');
});

test('idle pose produces gentle micro-hops, flush arms, and left-to-right tail wag', () => {
  const f0 = computeCharacterKinematics('idle', 0.0, 1.0, 1.0);
  const f1 = computeCharacterKinematics('idle', 0.16, 1.0, 1.0);
  assert.ok(f1.rootY > 0 && f1.rootY <= 0.08, 'idle should have 50% softer micro-hop height');
  assert.ok(f1.leftArmRotZ <= 0 && f1.rightArmRotZ >= 0, 'arms should stay flush outside torso');
  assert.notEqual(f0.tailRotY, f1.tailRotY, 'tail should wag left-to-right');
  assert.notEqual(f0.tailRotZ, f1.tailRotZ, 'tail roll should assist left-to-right wag');
});

test('jump pose achieves 50% softer airborne peak with outward-flared celebratory arms', () => {
  const peakTime = Math.PI / 2 / 7.2;
  const peak = computeCharacterKinematics('jump', peakTime, 1.0, 1.0);
  assert.ok(
    peak.rootY > 0.32 && peak.rootY < 0.42,
    `expected halved jump peak ~0.38, got ${peak.rootY}`
  );
  assert.ok(peak.leftArmRotZ < -0.7, 'left arm should flare outward during jump');
  assert.ok(peak.rightArmRotZ > 0.7, 'right arm should flare outward during jump');
  assert.ok(peak.shadowScale < 0.8, 'shadow should shrink when airborne');
});

test('run pose features forward lean, alternating limb swings, and left-right tail wag', () => {
  const strideA = computeCharacterKinematics('run', (Math.PI / 2) / 18.5, 1.0, 1.0);
  const strideB = computeCharacterKinematics('run', (3 * Math.PI / 2) / 18.5, 1.0, 1.0);
  assert.ok(strideA.rootRotX > 0.1, 'run should lean forward');
  assert.ok(strideA.leftLegRotX > 0.8 && strideA.rightLegRotX < -0.8);
  assert.ok(strideB.leftLegRotX < -0.8 && strideB.rightLegRotX > 0.8);
  assert.ok(strideA.leftArmRotZ < 0 && strideA.rightArmRotZ > 0, 'arms stay outside torso in run');
});

test('cool hero stance features proud chest-out lean, left hand on hip, right hero flex, and rhythmic groove', () => {
  const f0 = computeCharacterKinematics('cool', 0.0, 1.0, 1.0);
  const f1 = computeCharacterKinematics('cool', 0.22, 1.0, 1.0);
  assert.ok(f1.rootRotX < -0.02, 'cool stance leans chest proudly back');
  assert.ok(f1.leftArmRotZ < -0.4, 'left arm is cocked on hip');
  assert.ok(f1.rightArmRotZ > 0.5, 'right arm performs confident hero flex');
  assert.notEqual(f0.tailRotY, f1.tailRotY, 'tail wags to the groove beat');
});

test('skill system provides 5 Active Skills and 5 Passive Skills with valid character defaults', () => {
  const activeKeys = Object.keys(ACTIVE_SKILLS);
  const passiveKeys = Object.keys(PASSIVE_SKILLS);
  assert.equal(activeKeys.length, 5, 'should have 5 active skills');
  assert.equal(passiveKeys.length, 5, 'should have 5 passive skills');
  for (const char of CHARACTERS) {
    assert.ok(activeKeys.includes(char.activeSkillId), `${char.id} has valid activeSkillId`);
    assert.ok(passiveKeys.includes(char.passiveSkillId), `${char.id} has valid passiveSkillId`);
  }
  assert.equal(Object.keys(ITEMS).length, 5);
});

test('Grand Catmull-Rom spline track is ~1,800u long (~2:45 min lap), smooth, with high bridges & downhill slopes', () => {
  assert.equal(TRACK_SEGMENTS.length, 280, '28 control points * 10 spline subdivisions = 280 smooth segments');
  assert.ok(
    TOTAL_TRACK_LENGTH > 1650 && TOTAL_TRACK_LENGTH < 2150,
    `expected ~1820u grand circuit for 2.5-3 min race, got ${TOTAL_TRACK_LENGTH}`
  );
  const hasHighBridge = TRACK_SEGMENTS.some((s) => s.isHighBridge && s.y0 > 10);
  const hasDownhillSlope = TRACK_SEGMENTS.some((s) => s.isDownhillSlope && s.slope < -0.02);
  assert.ok(hasHighBridge, 'track should include elevated high bridges (y > 10)');
  assert.ok(hasDownhillSlope, 'track should include downhill slope sections');
});

test('Party Race engine spawns 8 racers with custom 1-of-5 Active & 1-of-5 Passive skills and supports Q/E/F', () => {
  const state = createInitialRaceState('bear', 'whirlwind', 'lucky_magnet');
  assert.equal(state.racers.length, 8);
  assert.equal(state.racers.filter((r) => r.isPlayer).length, 1);
  assert.equal(state.racers.filter((r) => !r.isPlayer).length, 7);

  // Move to racing phase
  state.phase = 'racing';
  const player = state.racers[0];
  const rival = state.racers[1];

  assert.equal(player.activeSkillId, 'whirlwind', 'Player custom active skill is applied');
  assert.equal(player.passiveSkillId, 'lucky_magnet', 'Player custom passive skill is applied');

  // Test Q active skill ('whirlwind' Cyclone Spin)
  const usedQ = activateRacerSkillQ(state, player);
  assert.equal(usedQ, true);
  assert.ok(player.qCooldown > 0, 'Q skill should enter cooldown');
  assert.ok(player.whirlwindTimer > 0, 'Cyclone Spin skill should activate whirlwindTimer');

  // Test F melee slap sideways knockback on nearby rival
  rival.x = player.x + 1.4;
  rival.z = player.z;
  const slapped = activateRacerSlapF(state, player);
  assert.equal(slapped, true);
  assert.ok(player.fCooldown > 0, 'F slap should enter cooldown');
  assert.ok(
    Math.hypot(rival.knockVx, rival.knockVz) > 8,
    'Rival hit by F melee slap should receive strong sideways knockback velocity'
  );

  // Test E item use (give player Spicy Pepper and trigger E)
  player.heldItem = 'pepper';
  player.dashTimer = 0;
  const usedE = activateRacerItemE(state, player);
  assert.equal(usedE, true);
  assert.equal(player.heldItem, null, 'Item slot should clear after pressing E');
  assert.ok(player.dashTimer > 0, 'Pepper boost should be active');

  // Step simulation forward and verify progress
  stepRaceSimulation(state, 0.1, {
    moveForward: 1,
    moveRight: 0,
    cameraYaw: 0,
    jumpRequested: false,
    skillQRequested: false,
    itemERequested: false,
    slapFRequested: false,
  });
  assert.ok(state.elapsedRaceSec > 0, 'elapsedRaceSec advances during racing phase');
});

test('setActiveTrack switches cleanly between woodland and snow_glacier with ice chutes and iceberg stones', () => {
  assert.ok(TRACK_CATALOG.woodland && TRACK_CATALOG.snow_glacier);
  setActiveTrack('snow_glacier');
  assert.equal(getActiveTrackId(), 'snow_glacier');
  assert.equal(TRACK_SEGMENTS.length, 280);
  assert.ok(
    TOTAL_TRACK_LENGTH > 1700 && TOTAL_TRACK_LENGTH < 2150,
    `expected ~1845u snow circuit, got ${TOTAL_TRACK_LENGTH}`
  );
  const hasIceSurface = TRACK_SEGMENTS.some((s) => s.surfaceType === 'ice');
  const hasPackedSnow = TRACK_SEGMENTS.some((s) => s.surfaceType === 'packed_snow');
  assert.ok(hasIceSurface, 'snow_glacier track should include glossy ice chute segments');
  assert.ok(hasPackedSnow, 'snow_glacier track should include packed snow segments');
  assert.ok(RIVER_STEPPING_STONES.length >= 15, 'snow_glacier should generate floating iceberg stepping stones');

  // Switch back to woodland cleanly
  setActiveTrack('woodland');
  assert.equal(getActiveTrackId(), 'woodland');
  assert.equal(TRACK_SEGMENTS.length, 280);
});

test('3D Physics: parabolic knockback arc, low air drag, elastic bounce, and pairwise rigid-body collisions', () => {
  const state = createInitialRaceState('bear', 'dash', 'bouncy_belly');
  state.phase = 'racing';
  const r0 = state.racers[0];
  const r1 = state.racers[1];

  // Place r1 right next to r0 and slap r1
  r1.x = r0.x + 1.2;
  r1.z = r0.z;
  const slapped = activateRacerSlapF(state, r0);
  assert.equal(slapped, true);
  assert.ok(r1.vy > 4.0, 'Slapped racer should be launched into an upward parabolic arc (vy > 4)');
  assert.ok(r1.y > r1.groundY, 'Slapped racer should lift off the ground immediately');

  // Step 1 frame while airborne and verify low air drag preserves horizontal knockback momentum
  const initialKnockSpeed = Math.hypot(r1.knockVx, r1.knockVz);
  stepRaceSimulation(state, 0.05, {
    moveForward: 0,
    moveRight: 0,
    cameraYaw: 0,
    jumpRequested: false,
    skillQRequested: false,
    itemERequested: false,
    slapFRequested: false,
  });
  const afterAirStepSpeed = Math.hypot(r1.knockVx, r1.knockVz);
  assert.ok(
    afterAirStepSpeed > initialKnockSpeed * 0.88,
    'Airborne knockback should experience low air drag so the arc looks natural'
  );

  // Test symmetric pairwise racer-vs-racer body collision depenetration & impulse
  const r2 = state.racers[2];
  const r3 = state.racers[3];
  r2.x = 0;
  r2.z = 10;
  r2.vx = 9;
  r2.vz = 0;
  r3.x = 0.8; // overlapping (< 1.50 minDist)
  r3.z = 10;
  r3.vx = -5;
  r3.vz = 0;

  stepRaceSimulation(state, 0.016, {
    moveForward: 0,
    moveRight: 0,
    cameraYaw: 0,
    jumpRequested: false,
    skillQRequested: false,
    itemERequested: false,
    slapFRequested: false,
  });

  const separatedDist = Math.hypot(r3.x - r2.x, r3.z - r2.z);
  assert.ok(
    separatedDist >= 1.17,
    `Overlapping racers should cleanly depenetrate to >= 1.17u (got ${separatedDist.toFixed(2)})`
  );
  assert.ok(
    r2.knockVx < 0 && r3.knockVx > 0,
    'Colliding racers should exchange opposite elastic velocity impulses'
  );
});



