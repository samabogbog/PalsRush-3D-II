import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  computeCharacterCombatStats,
  DEFAULT_STARTER_LOADOUT,
  UserProfileData,
} from '../models/equipmentTypes';

// Initialize Firebase App, Cloud Firestore (Enterprise database ID), and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot per skill specification
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Sanitize string to match ^[a-zA-Z0-9_\-]+$ and length bounds from firebase-blueprint.json
function sanitizeSafeId(raw: string, fallback: string, maxLen: number): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, maxLen);
  return cleaned.length >= 2 ? cleaned : fallback;
}

function clampInt(val: number, min: number, max: number): number {
  const n = Math.round(Number.isFinite(val) ? val : min);
  return Math.max(min, Math.min(max, n));
}

export interface CloudPlayerDoc {
  ownerId: string;
  username: string;
  displayName: string;
  characterId: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  coins: number;
  weapon: string;
  headgear: string;
  cape: string;
  aura: string;
  inventory: string[];
  combatPower: number;
  seasonNumber: number;
  seasonName: string;
  raceRp: number;
  raceWins: number;
  raceMatches: number;
  dungeonRp: number;
  highestStage: number;
  bossesDefeated: number;
  pvpRp: number;
  pvpWins: number;
  pvpMatches: number;
}

/**
 * Loads the authenticated user's profile from Cloud Firestore `/users/{uid}`
 */
export async function loadUserProfileFromFirestore(
  uid: string
): Promise<CloudPlayerDoc | null> {
  const userPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as CloudPlayerDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

/**
 * Creates or updates the authenticated user's profile in Cloud Firestore (`/users/{uid}`
 * and `/users/{uid}/private/info` for isolated PII email) using strict blueprint bounds.
 */
export async function syncUserProfileToFirestore(
  profile: UserProfileData
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = currentUser.uid;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;

  const loadout = {
    weapon: sanitizeSafeId(
      profile.loadout.weapon || DEFAULT_STARTER_LOADOUT.weapon!,
      'w_squeaky_duck',
      64
    ),
    headgear: sanitizeSafeId(
      profile.loadout.headgear || DEFAULT_STARTER_LOADOUT.headgear!,
      'h_propeller_cap',
      64
    ),
    cape: sanitizeSafeId(
      profile.loadout.cape || DEFAULT_STARTER_LOADOUT.cape!,
      'c_towel_cape',
      64
    ),
    aura: sanitizeSafeId(
      profile.loadout.aura || DEFAULT_STARTER_LOADOUT.aura!,
      'a_soap_bubbles',
      64
    ),
  };

  const rawInventory =
    profile.inventory && profile.inventory.length > 0
      ? profile.inventory
      : [loadout.weapon, loadout.headgear, loadout.cape, loadout.aura];
  const safeInventory = rawInventory
    .slice(0, 30)
    .map((id) => sanitizeSafeId(String(id), 'w_squeaky_duck', 64));

  const level = clampInt(profile.level, 1, 999);
  const stats = computeCharacterCombatStats(level, loadout);

  const sanitizedDoc: CloudPlayerDoc = {
    ownerId: uid,
    username: sanitizeSafeId(profile.username || `pal_${uid.slice(0, 8)}`, 'pal_hero', 40),
    displayName: (profile.displayName || currentUser.displayName || 'PalHero')
      .trim()
      .slice(0, 50) || 'PalHero',
    characterId: sanitizeSafeId(profile.selectedCharacterId || 'bear', 'bear', 32),
    level,
    exp: clampInt(profile.exp, 0, 1000000),
    nextLevelExp: clampInt(profile.nextLevelExp, 1, 1000000),
    coins: clampInt(profile.coins, 0, 10000000),
    weapon: loadout.weapon,
    headgear: loadout.headgear,
    cape: loadout.cape,
    aura: loadout.aura,
    inventory: safeInventory,
    combatPower: clampInt(stats.combatPower, 0, 1000000),
    seasonNumber: clampInt(profile.rankings.seasonNumber || 1, 1, 1000),
    seasonName:
      (profile.rankings.seasonName || 'Season 1: Frost & Fury').slice(0, 80) ||
      'Season 1',
    raceRp: clampInt(profile.rankings.raceRp, 0, 1000000),
    raceWins: clampInt(profile.rankings.raceWins, 0, 1000000),
    raceMatches: clampInt(profile.rankings.raceMatches, 0, 1000000),
    dungeonRp: clampInt(profile.rankings.dungeonRp, 0, 1000000),
    highestStage: clampInt(profile.rankings.highestStage, 1, 100),
    bossesDefeated: clampInt(profile.rankings.bossesDefeated, 0, 1000000),
    pvpRp: clampInt(profile.rankings.pvpRp, 0, 1000000),
    pvpWins: clampInt(profile.rankings.pvpWins, 0, 1000000),
    pvpMatches: clampInt(profile.rankings.pvpMatches, 0, 1000000),
  };

  try {
    const existingSnap = await getDoc(doc(db, 'users', uid));
    if (!existingSnap.exists()) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid), {
        ...sanitizedDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (currentUser.email && currentUser.email.length >= 3) {
        batch.set(doc(db, 'users', uid, 'private', 'info'), {
          ownerId: uid,
          email: currentUser.email.slice(0, 120),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } else {
      await updateDoc(doc(db, 'users', uid), {
        displayName: sanitizedDoc.displayName,
        characterId: sanitizedDoc.characterId,
        level: sanitizedDoc.level,
        exp: sanitizedDoc.exp,
        nextLevelExp: sanitizedDoc.nextLevelExp,
        coins: sanitizedDoc.coins,
        weapon: sanitizedDoc.weapon,
        headgear: sanitizedDoc.headgear,
        cape: sanitizedDoc.cape,
        aura: sanitizedDoc.aura,
        inventory: sanitizedDoc.inventory,
        combatPower: sanitizedDoc.combatPower,
        seasonNumber: sanitizedDoc.seasonNumber,
        seasonName: sanitizedDoc.seasonName,
        raceRp: sanitizedDoc.raceRp,
        raceWins: sanitizedDoc.raceWins,
        raceMatches: sanitizedDoc.raceMatches,
        dungeonRp: sanitizedDoc.dungeonRp,
        highestStage: sanitizedDoc.highestStage,
        bossesDefeated: sanitizedDoc.bossesDefeated,
        pvpRp: sanitizedDoc.pvpRp,
        pvpWins: sanitizedDoc.pvpWins,
        pvpMatches: sanitizedDoc.pvpMatches,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath || privatePath);
  }
}

/**
 * Records a completed match in `/users/{uid}/matches/{matchId}` in Cloud Firestore.
 */
export async function recordMatchToFirestore(
  mode: 'race' | 'dungeon' | 'pvp',
  rpDelta: number
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = currentUser.uid;
  const matchId = `m_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const matchPath = `users/${uid}/matches/${matchId}`;

  try {
    await setDoc(doc(db, 'users', uid, 'matches', matchId), {
      ownerId: uid,
      mode,
      status: 'completed',
      rpDelta: clampInt(rpDelta, -500, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, matchPath);
  }
}

export async function signInWithGooglePopup(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User as FirebaseUser };
