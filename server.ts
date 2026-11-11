import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_STARTER_LOADOUT,
  EQUIPMENT_CATALOG,
  EQUIPMENT_LIST,
  EquippedLoadout,
  computeCharacterCombatStats,
} from './src/models/equipmentTypes';
import { CharacterId } from './src/models/characterTypes';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'pals_rush.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================================
// 1. INITIALIZE SQLITE TABLES
// ============================================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_guest INTEGER NOT NULL DEFAULT 0,
    is_bot INTEGER NOT NULL DEFAULT 0,
    session_token TEXT UNIQUE NOT NULL,
    selected_character_id TEXT NOT NULL DEFAULT 'bear',
    active_skill_id TEXT NOT NULL DEFAULT 'quake',
    passive_skill_id TEXT NOT NULL DEFAULT 'bouncy_belly',
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 250,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, item_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_loadouts (
    user_id INTEGER PRIMARY KEY,
    weapon_id TEXT,
    headgear_id TEXT,
    cape_id TEXT,
    aura_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    theme TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS season_rankings (
    season_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    race_rp INTEGER NOT NULL DEFAULT 1000,
    race_wins INTEGER NOT NULL DEFAULT 0,
    race_matches INTEGER NOT NULL DEFAULT 0,
    dungeon_rp INTEGER NOT NULL DEFAULT 1000,
    highest_stage INTEGER NOT NULL DEFAULT 1,
    bosses_defeated INTEGER NOT NULL DEFAULT 0,
    pvp_rp INTEGER NOT NULL DEFAULT 1000,
    pvp_wins INTEGER NOT NULL DEFAULT 0,
    pvp_matches INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (season_id, user_id),
    FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS season_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_number INTEGER NOT NULL,
    season_name TEXT NOT NULL,
    mode TEXT NOT NULL,
    champion_name TEXT NOT NULL,
    champion_character_id TEXT NOT NULL,
    final_rp INTEGER NOT NULL,
    archived_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function hashPassword(password: string): string {
  const salt = 'pals_rush_3d_salt_v1';
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function getNextLevelExp(level: number): number {
  return 120 + (level - 1) * 85;
}

// ============================================================================
// 2. SEED ACTIVE SEASON & RIVAL PAL ACCOUNTS
// ============================================================================
function ensureActiveSeason(): {
  id: number;
  season_number: number;
  name: string;
  theme: string;
  starts_at: string;
  ends_at: string;
} {
  let active = db
    .prepare('SELECT * FROM seasons WHERE is_active = 1 ORDER BY season_number DESC LIMIT 1')
    .get() as
    | {
        id: number;
        season_number: number;
        name: string;
        theme: string;
        starts_at: string;
        ends_at: string;
      }
    | undefined;

  if (!active) {
    const startsAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const info = db
      .prepare(
        `INSERT INTO seasons (season_number, name, theme, starts_at, ends_at, is_active)
         VALUES (1, 'Season 1: Frost & Fury', 'ศึกเจ้าแห่งยอดเขาหิมะและดันเจี้ยนน้ำแข็ง', ?, ?, 1)`
      )
      .run(startsAt, endsAt);
    active = db
      .prepare('SELECT * FROM seasons WHERE id = ?')
      .get(info.lastInsertRowid) as {
      id: number;
      season_number: number;
      name: string;
      theme: string;
      starts_at: string;
      ends_at: string;
    };
  }
  return active;
}

function seedRivalAccounts() {
  const activeSeason = ensureActiveSeason();
  const botCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM users WHERE is_bot = 1').get() as {
      cnt: number;
    }
  ).cnt;
  if (botCount > 0) return;

  const rivals: Array<{
    username: string;
    displayName: string;
    charId: CharacterId;
    level: number;
    weapon: string;
    headgear: string;
    cape: string;
    aura: string;
    raceRp: number;
    raceWins: number;
    dungeonRp: number;
    stage: number;
    bosses: number;
    pvpRp: number;
    pvpWins: number;
  }> = [
    {
      username: 'rival_king_durian',
      displayName: 'KingDurian99',
      charId: 'tiger',
      level: 14,
      weapon: 'w_durian_mace',
      headgear: 'h_disco_afro',
      cape: 'c_dragon_wings',
      aura: 'a_thunder_god',
      raceRp: 2260,
      raceWins: 42,
      dungeonRp: 2340,
      stage: 5,
      bosses: 29,
      pvpRp: 2290,
      pvpWins: 38,
    },
    {
      username: 'rival_frost_queen',
      displayName: 'GlacierPuddle',
      charId: 'penguin',
      level: 12,
      weapon: 'w_popsicle_wand',
      headgear: 'h_glacier_crown',
      cape: 'c_royal_ermine',
      aura: 'a_frost_blizzard',
      raceRp: 2140,
      raceWins: 36,
      dungeonRp: 1980,
      stage: 4,
      bosses: 21,
      pvpRp: 2050,
      pvpWins: 31,
    },
    {
      username: 'rival_chef_wok',
      displayName: 'ChefMochiWok',
      charId: 'panda',
      level: 10,
      weapon: 'w_golden_wok',
      headgear: 'h_noodle_pot',
      cape: 'c_soda_jetpack',
      aura: 'a_chili_sparks',
      raceRp: 1790,
      raceWins: 24,
      dungeonRp: 1860,
      stage: 4,
      bosses: 18,
      pvpRp: 1740,
      pvpWins: 22,
    },
    {
      username: 'rival_mama_slipper',
      displayName: 'MamaSlipperZ',
      charId: 'cat',
      level: 9,
      weapon: 'w_mama_slipper',
      headgear: 'h_viking_plunger',
      cape: 'c_cardboard_wings',
      aura: 'a_rainbow_party',
      raceRp: 1620,
      raceWins: 19,
      dungeonRp: 1540,
      stage: 3,
      bosses: 14,
      pvpRp: 1690,
      pvpWins: 20,
    },
    {
      username: 'rival_bandit_dash',
      displayName: 'TurboBandit',
      charId: 'raccoon',
      level: 7,
      weapon: 'w_golden_wok',
      headgear: 'h_propeller_cap',
      cape: 'c_soda_jetpack',
      aura: 'a_soap_bubbles',
      raceRp: 1480,
      raceWins: 15,
      dungeonRp: 1390,
      stage: 3,
      bosses: 10,
      pvpRp: 1420,
      pvpWins: 14,
    },
    {
      username: 'rival_quack_bonk',
      displayName: 'QuackMallet',
      charId: 'duck',
      level: 6,
      weapon: 'w_squeaky_duck',
      headgear: 'h_noodle_pot',
      cape: 'c_towel_cape',
      aura: 'a_chili_sparks',
      raceRp: 1310,
      raceWins: 11,
      dungeonRp: 1280,
      stage: 2,
      bosses: 8,
      pvpRp: 1260,
      pvpWins: 10,
    },
    {
      username: 'rival_sunny_roar',
      displayName: 'SunnyBrawler',
      charId: 'lion',
      level: 5,
      weapon: 'w_mama_slipper',
      headgear: 'h_viking_plunger',
      cape: 'c_towel_cape',
      aura: 'a_soap_bubbles',
      raceRp: 1180,
      raceWins: 8,
      dungeonRp: 1190,
      stage: 2,
      bosses: 6,
      pvpRp: 1210,
      pvpWins: 9,
    },
    {
      username: 'rival_matcha_hop',
      displayName: 'MatchaHopper',
      charId: 'frog',
      level: 4,
      weapon: 'w_squeaky_duck',
      headgear: 'h_propeller_cap',
      cape: 'c_cardboard_wings',
      aura: 'a_soap_bubbles',
      raceRp: 1060,
      raceWins: 5,
      dungeonRp: 1090,
      stage: 2,
      bosses: 4,
      pvpRp: 1040,
      pvpWins: 4,
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, is_guest, is_bot, session_token, selected_character_id, level, exp, coins)
    VALUES (?, ?, ?, 0, 1, ?, ?, ?, 0, 1000)
  `);
  const insertLoadout = db.prepare(`
    INSERT INTO user_loadouts (user_id, weapon_id, headgear_id, cape_id, aura_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertInv = db.prepare(`
    INSERT OR IGNORE INTO user_inventory (user_id, item_id) VALUES (?, ?)
  `);
  const insertRank = db.prepare(`
    INSERT INTO season_rankings (
      season_id, user_id, race_rp, race_wins, race_matches,
      dungeon_rp, highest_stage, bosses_defeated,
      pvp_rp, pvp_wins, pvp_matches
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const r of rivals) {
      const res = insertUser.run(
        r.username,
        hashPassword('bot_pass'),
        r.displayName,
        generateToken(),
        r.charId,
        r.level
      );
      const userId = Number(res.lastInsertRowid);
      insertLoadout.run(userId, r.weapon, r.headgear, r.cape, r.aura);
      for (const itemId of [r.weapon, r.headgear, r.cape, r.aura]) {
        insertInv.run(userId, itemId);
      }
      insertRank.run(
        activeSeason.id,
        userId,
        r.raceRp,
        r.raceWins,
        r.raceWins + 12,
        r.dungeonRp,
        r.stage,
        r.bosses,
        r.pvpRp,
        r.pvpWins,
        r.pvpWins + 9
      );
    }
  });
  tx();
}

seedRivalAccounts();

// ============================================================================
// 3. HELPER TO BUILD FULL USER PROFILE PAYLOAD
// ============================================================================
function grantStarterItemsAndRanking(userId: number) {
  const activeSeason = ensureActiveSeason();
  const starterItems = [
    DEFAULT_STARTER_LOADOUT.weapon!,
    DEFAULT_STARTER_LOADOUT.headgear!,
    DEFAULT_STARTER_LOADOUT.cape!,
    DEFAULT_STARTER_LOADOUT.aura!,
    'w_mama_slipper', // Bonus Rare weapon so players can immediately test swapping gear!
  ];
  const insertInv = db.prepare(
    'INSERT OR IGNORE INTO user_inventory (user_id, item_id) VALUES (?, ?)'
  );
  for (const itemId of starterItems) {
    insertInv.run(userId, itemId);
  }

  db.prepare(
    `INSERT OR IGNORE INTO user_loadouts (user_id, weapon_id, headgear_id, cape_id, aura_id)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    userId,
    DEFAULT_STARTER_LOADOUT.weapon,
    DEFAULT_STARTER_LOADOUT.headgear,
    DEFAULT_STARTER_LOADOUT.cape,
    DEFAULT_STARTER_LOADOUT.aura
  );

  db.prepare(
    `INSERT OR IGNORE INTO season_rankings (season_id, user_id)
     VALUES (?, ?)`
  ).run(activeSeason.id, userId);
}

function buildUserProfilePayload(userId: number) {
  const activeSeason = ensureActiveSeason();
  grantStarterItemsAndRanking(userId);

  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(userId) as Record<string, unknown> | undefined;
  if (!user) return null;

  const loadoutRow = db
    .prepare('SELECT * FROM user_loadouts WHERE user_id = ?')
    .get(userId) as
    | {
        weapon_id: string | null;
        headgear_id: string | null;
        cape_id: string | null;
        aura_id: string | null;
      }
    | undefined;

  const invRows = db
    .prepare('SELECT item_id FROM user_inventory WHERE user_id = ? ORDER BY id ASC')
    .all(userId) as Array<{ item_id: string }>;

  const rankRow = db
    .prepare(
      'SELECT * FROM season_rankings WHERE season_id = ? AND user_id = ?'
    )
    .get(activeSeason.id, userId) as Record<string, number> | undefined;

  const level = Number(user.level || 1);
  return {
    id: Number(user.id),
    username: String(user.username),
    displayName: String(user.display_name),
    isGuest: Boolean(user.is_guest),
    sessionToken: String(user.session_token),
    selectedCharacterId: String(user.selected_character_id) as CharacterId,
    activeSkillId: String(user.active_skill_id),
    passiveSkillId: String(user.passive_skill_id),
    level,
    exp: Number(user.exp || 0),
    nextLevelExp: getNextLevelExp(level),
    coins: Number(user.coins || 0),
    loadout: {
      weapon: loadoutRow?.weapon_id ?? DEFAULT_STARTER_LOADOUT.weapon,
      headgear: loadoutRow?.headgear_id ?? DEFAULT_STARTER_LOADOUT.headgear,
      cape: loadoutRow?.cape_id ?? DEFAULT_STARTER_LOADOUT.cape,
      aura: loadoutRow?.aura_id ?? DEFAULT_STARTER_LOADOUT.aura,
    },
    inventory: invRows.map((r) => r.item_id),
    rankings: {
      seasonNumber: activeSeason.season_number,
      seasonName: activeSeason.name,
      raceRp: Number(rankRow?.race_rp ?? 1000),
      raceWins: Number(rankRow?.race_wins ?? 0),
      raceMatches: Number(rankRow?.race_matches ?? 0),
      dungeonRp: Number(rankRow?.dungeon_rp ?? 1000),
      highestStage: Number(rankRow?.highest_stage ?? 1),
      bossesDefeated: Number(rankRow?.bosses_defeated ?? 0),
      pvpRp: Number(rankRow?.pvp_rp ?? 1000),
      pvpWins: Number(rankRow?.pvp_wins ?? 0),
      pvpMatches: Number(rankRow?.pvp_matches ?? 0),
    },
  };
}

// ============================================================================
// 4. EXPRESS APP & API ROUTES
// ============================================================================
async function startServer() {
  const app = express();
  app.use(express.json());

  // 4.1 Guest Quick Play (Create or Resume)
  app.post('/api/auth/guest', (req, res) => {
    const existingToken = req.body?.sessionToken as string | undefined;
    if (existingToken) {
      const found = db
        .prepare('SELECT id FROM users WHERE session_token = ?')
        .get(existingToken) as { id: number } | undefined;
      if (found) {
        return res.json({ user: buildUserProfilePayload(found.id) });
      }
    }

    const suffix = Math.floor(1000 + Math.random() * 9000);
    const username = `guest_${Date.now()}_${suffix}`;
    const displayName = `PalGuest#${suffix}`;
    const token = generateToken();

    const info = db
      .prepare(
        `INSERT INTO users (username, password_hash, display_name, is_guest, session_token)
         VALUES (?, ?, ?, 1, ?)`
      )
      .run(username, hashPassword(token), displayName, token);

    const user = buildUserProfilePayload(Number(info.lastInsertRowid));
    return res.json({ user });
  });

  // 4.2 Register or Upgrade Guest Account
  app.post('/api/auth/register', (req, res) => {
    const rawUsername = String(req.body?.username || '').trim().toLowerCase();
    const rawDisplayName = String(
      req.body?.displayName || req.body?.username || ''
    ).trim();
    const password = String(req.body?.password || '');
    const guestToken = String(req.body?.guestToken || '').trim();

    if (rawUsername.length < 3 || rawUsername.length > 24) {
      return res.status(400).json({
        error: 'Username must be 3–24 characters.',
      });
    }
    if (password.length < 4) {
      return res.status(400).json({
        error: 'Password must be at least 4 characters.',
      });
    }

    const taken = db
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(rawUsername) as { id: number } | undefined;
    if (taken) {
      return res.status(409).json({
        error: 'Username is already taken. Please choose another.',
      });
    }

    // Check if upgrading an existing Guest session so all items/ranks are preserved
    if (guestToken) {
      const guestRow = db
        .prepare(
          'SELECT id, is_guest FROM users WHERE session_token = ? AND is_guest = 1'
        )
        .get(guestToken) as { id: number; is_guest: number } | undefined;

      if (guestRow) {
        const newToken = generateToken();
        db.prepare(
          `UPDATE users
           SET username = ?, password_hash = ?, display_name = ?, is_guest = 0, session_token = ?
           WHERE id = ?`
        ).run(
          rawUsername,
          hashPassword(password),
          rawDisplayName || rawUsername,
          newToken,
          guestRow.id
        );
        return res.json({
          user: buildUserProfilePayload(guestRow.id),
          upgradedFromGuest: true,
        });
      }
    }

    const newToken = generateToken();
    const info = db
      .prepare(
        `INSERT INTO users (username, password_hash, display_name, is_guest, session_token)
         VALUES (?, ?, ?, 0, ?)`
      )
      .run(
        rawUsername,
        hashPassword(password),
        rawDisplayName || rawUsername,
        newToken
      );

    return res.json({
      user: buildUserProfilePayload(Number(info.lastInsertRowid)),
      upgradedFromGuest: false,
    });
  });

  // 4.3 Member Login
  app.post('/api/auth/login', (req, res) => {
    const rawUsername = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const userRow = db
      .prepare('SELECT id, password_hash FROM users WHERE username = ?')
      .get(rawUsername) as { id: number; password_hash: string } | undefined;

    if (!userRow || userRow.password_hash !== hashPassword(password)) {
      return res.status(401).json({
        error: 'Invalid username or password.',
      });
    }

    const newToken = generateToken();
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(
      newToken,
      userRow.id
    );
    return res.json({ user: buildUserProfilePayload(userRow.id) });
  });

  // 4.3b Firebase Auth & Cloud Firestore Sync (Google Sign-In / Cloud Profile Sync)
  app.post('/api/auth/firebase-sync', (req, res) => {
    const uid = String(req.body?.uid || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 64);
    if (!uid) {
      return res.status(400).json({ error: 'Missing Firebase UID.' });
    }

    const fbUsername = `fb_${uid.slice(0, 20).toLowerCase()}`;
    const displayName =
      String(req.body?.displayName || 'PalHero')
        .trim()
        .slice(0, 40) || 'PalHero';
    const guestToken = String(req.body?.guestToken || '').trim();
    const cloudDoc = req.body?.cloudProfile as
      | {
          characterId?: string;
          level?: number;
          exp?: number;
          coins?: number;
          weapon?: string;
          headgear?: string;
          cape?: string;
          aura?: string;
          inventory?: string[];
          raceRp?: number;
          raceWins?: number;
          raceMatches?: number;
          dungeonRp?: number;
          highestStage?: number;
          bossesDefeated?: number;
          pvpRp?: number;
          pvpWins?: number;
          pvpMatches?: number;
        }
      | undefined;

    const existingFbUser = db
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(fbUsername) as { id: number } | undefined;

    let userId: number;
    let upgradedFromGuest = false;

    if (existingFbUser) {
      userId = existingFbUser.id;
      const newToken = generateToken();
      db.prepare(
        'UPDATE users SET display_name = ?, is_guest = 0, session_token = ? WHERE id = ?'
      ).run(displayName, newToken, userId);
    } else if (guestToken) {
      const guestRow = db
        .prepare(
          'SELECT id FROM users WHERE session_token = ? AND is_guest = 1'
        )
        .get(guestToken) as { id: number } | undefined;
      if (guestRow) {
        userId = guestRow.id;
        upgradedFromGuest = true;
        const newToken = generateToken();
        db.prepare(
          `UPDATE users
           SET username = ?, password_hash = ?, display_name = ?, is_guest = 0, session_token = ?
           WHERE id = ?`
        ).run(fbUsername, hashPassword(uid), displayName, newToken, userId);
      } else {
        const newToken = generateToken();
        const info = db
          .prepare(
            `INSERT INTO users (username, password_hash, display_name, is_guest, session_token)
             VALUES (?, ?, ?, 0, ?)`
          )
          .run(fbUsername, hashPassword(uid), displayName, newToken);
        userId = Number(info.lastInsertRowid);
      }
    } else {
      const newToken = generateToken();
      const info = db
        .prepare(
          `INSERT INTO users (username, password_hash, display_name, is_guest, session_token)
           VALUES (?, ?, ?, 0, ?)`
        )
        .run(fbUsername, hashPassword(uid), displayName, newToken);
      userId = Number(info.lastInsertRowid);
    }

    grantStarterItemsAndRanking(userId);

    // If Cloud Firestore already has higher progression or gear, merge it into SQLite leaderboard state
    if (cloudDoc) {
      const activeSeason = ensureActiveSeason();
      if (cloudDoc.level && cloudDoc.level > 1) {
        db.prepare(
          'UPDATE users SET level = MAX(level, ?), exp = MAX(exp, ?), coins = MAX(coins, ?) WHERE id = ?'
        ).run(
          Number(cloudDoc.level || 1),
          Number(cloudDoc.exp || 0),
          Number(cloudDoc.coins || 250),
          userId
        );
      }
      if (cloudDoc.weapon || cloudDoc.headgear || cloudDoc.cape || cloudDoc.aura) {
        db.prepare(
          `UPDATE user_loadouts
           SET weapon_id = COALESCE(?, weapon_id),
               headgear_id = COALESCE(?, headgear_id),
               cape_id = COALESCE(?, cape_id),
               aura_id = COALESCE(?, aura_id)
           WHERE user_id = ?`
        ).run(
          cloudDoc.weapon || null,
          cloudDoc.headgear || null,
          cloudDoc.cape || null,
          cloudDoc.aura || null,
          userId
        );
      }
      if (Array.isArray(cloudDoc.inventory)) {
        const insertInv = db.prepare(
          'INSERT OR IGNORE INTO user_inventory (user_id, item_id) VALUES (?, ?)'
        );
        for (const itemId of cloudDoc.inventory.slice(0, 30)) {
          if (typeof itemId === 'string' && EQUIPMENT_CATALOG[itemId]) {
            insertInv.run(userId, itemId);
          }
        }
      }
      db.prepare(
        `UPDATE season_rankings
         SET race_rp = MAX(race_rp, ?),
             race_wins = MAX(race_wins, ?),
             race_matches = MAX(race_matches, ?),
             dungeon_rp = MAX(dungeon_rp, ?),
             highest_stage = MAX(highest_stage, ?),
             bosses_defeated = MAX(bosses_defeated, ?),
             pvp_rp = MAX(pvp_rp, ?),
             pvp_wins = MAX(pvp_wins, ?),
             pvp_matches = MAX(pvp_matches, ?)
         WHERE season_id = ? AND user_id = ?`
      ).run(
        Number(cloudDoc.raceRp ?? 1000),
        Number(cloudDoc.raceWins ?? 0),
        Number(cloudDoc.raceMatches ?? 0),
        Number(cloudDoc.dungeonRp ?? 1000),
        Number(cloudDoc.highestStage ?? 1),
        Number(cloudDoc.bossesDefeated ?? 0),
        Number(cloudDoc.pvpRp ?? 1000),
        Number(cloudDoc.pvpWins ?? 0),
        Number(cloudDoc.pvpMatches ?? 0),
        activeSeason.id,
        userId
      );
    }

    return res.json({
      user: buildUserProfilePayload(userId),
      upgradedFromGuest,
    });
  });

  // 4.4 Get Profile by Bearer Token
  app.get('/api/profile', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Missing session token' });
    }
    const found = db
      .prepare('SELECT id FROM users WHERE session_token = ?')
      .get(token) as { id: number } | undefined;
    if (!found) {
      return res.status(401).json({ error: 'Invalid session token' });
    }
    return res.json({ user: buildUserProfilePayload(found.id) });
  });

  // 4.5 Save Character & 4-Slot Equipment Loadout
  app.post('/api/profile/loadout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const found = db
      .prepare('SELECT id FROM users WHERE session_token = ?')
      .get(token) as { id: number } | undefined;
    if (!found) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      selectedCharacterId,
      activeSkillId,
      passiveSkillId,
      loadout,
    } = req.body as {
      selectedCharacterId?: string;
      activeSkillId?: string;
      passiveSkillId?: string;
      loadout?: Partial<EquippedLoadout>;
    };

    if (selectedCharacterId || activeSkillId || passiveSkillId) {
      const current = db
        .prepare(
          'SELECT selected_character_id, active_skill_id, passive_skill_id FROM users WHERE id = ?'
        )
        .get(found.id) as {
        selected_character_id: string;
        active_skill_id: string;
        passive_skill_id: string;
      };
      db.prepare(
        `UPDATE users
         SET selected_character_id = ?, active_skill_id = ?, passive_skill_id = ?
         WHERE id = ?`
      ).run(
        selectedCharacterId || current.selected_character_id,
        activeSkillId || current.active_skill_id,
        passiveSkillId || current.passive_skill_id,
        found.id
      );
    }

    if (loadout) {
      const currentLoadout = db
        .prepare('SELECT * FROM user_loadouts WHERE user_id = ?')
        .get(found.id) as {
        weapon_id: string | null;
        headgear_id: string | null;
        cape_id: string | null;
        aura_id: string | null;
      };

      db.prepare(
        `UPDATE user_loadouts
         SET weapon_id = ?, headgear_id = ?, cape_id = ?, aura_id = ?
         WHERE user_id = ?`
      ).run(
        loadout.weapon !== undefined ? loadout.weapon : currentLoadout.weapon_id,
        loadout.headgear !== undefined
          ? loadout.headgear
          : currentLoadout.headgear_id,
        loadout.cape !== undefined ? loadout.cape : currentLoadout.cape_id,
        loadout.aura !== undefined ? loadout.aura : currentLoadout.aura_id,
        found.id
      );
    }

    return res.json({ user: buildUserProfilePayload(found.id) });
  });

  // 4.6 Complete Match (Race / Dungeon Raid / 3D Brawler PvP) -> EXP, Rank RP & Loot Drop!
  app.post('/api/match/complete', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const found = db
      .prepare('SELECT id, level, exp, coins FROM users WHERE session_token = ?')
      .get(token) as
      | { id: number; level: number; exp: number; coins: number }
      | undefined;

    if (!found) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activeSeason = ensureActiveSeason();
    grantStarterItemsAndRanking(found.id);

    const {
      mode,
      victory,
      rankPlacement = 1,
      stageCleared = 1,
      bossDefeated = false,
      enemiesDefeated = 0,
    } = req.body as {
      mode: 'race' | 'dungeon' | 'pvp';
      victory: boolean;
      rankPlacement?: number;
      stageCleared?: number;
      bossDefeated?: boolean;
      enemiesDefeated?: number;
    };

    let expGained = 35;
    let coinsGained = 40;
    let rpDelta = 0;
    let droppedItemId: string | null = null;

    if (mode === 'race') {
      const place = Math.max(1, Math.min(8, rankPlacement));
      expGained = Math.max(25, 110 - (place - 1) * 12);
      coinsGained = Math.max(30, 120 - (place - 1) * 14);
      rpDelta =
        place === 1
          ? 45
          : place === 2
            ? 28
            : place === 3
              ? 16
              : place <= 5
                ? 5
                : -12;

      db.prepare(
        `UPDATE season_rankings
         SET race_rp = MAX(0, race_rp + ?),
             race_wins = race_wins + ?,
             race_matches = race_matches + 1,
             updated_at = datetime('now')
         WHERE season_id = ? AND user_id = ?`
      ).run(rpDelta, place === 1 ? 1 : 0, activeSeason.id, found.id);

      // Podium finishers in Party Race also get a celebratory cosmetic gear drop!
      if (place <= 3) {
        const pool = EQUIPMENT_LIST.filter((i) => i.dropStageMin <= 2);
        droppedItemId = pool[Math.floor(Math.random() * pool.length)].id;
      }
    } else if (mode === 'dungeon') {
      const stage = Math.max(1, stageCleared);
      expGained = (victory ? 95 : 40) + stage * 35 + enemiesDefeated * 6;
      coinsGained = (victory ? 110 : 35) + stage * 45;
      rpDelta = victory ? 38 + stage * 14 : Math.max(-8, enemiesDefeated * 2 - 10);

      db.prepare(
        `UPDATE season_rankings
         SET dungeon_rp = MAX(0, dungeon_rp + ?),
             highest_stage = MAX(highest_stage, ?),
             bosses_defeated = bosses_defeated + ?,
             updated_at = datetime('now')
         WHERE season_id = ? AND user_id = ?`
      ).run(
        rpDelta,
        victory ? stage + 1 : stage,
        bossDefeated ? 1 : 0,
        activeSeason.id,
        found.id
      );

      // Guaranteed monster/boss gear drop in Dungeon mode!
      const eligiblePool = EQUIPMENT_LIST.filter(
        (item) => item.dropStageMin <= (victory ? stage + 1 : stage)
      );
      const weightedPool: string[] = [];
      for (const item of eligiblePool) {
        const weight =
          item.rarity === 'legendary'
            ? victory && stage >= 2
              ? 3
              : 1
            : item.rarity === 'epic'
              ? 4
              : item.rarity === 'rare'
                ? 6
                : 5;
        for (let w = 0; w < weight; w++) weightedPool.push(item.id);
      }
      if (weightedPool.length > 0) {
        droppedItemId =
          weightedPool[Math.floor(Math.random() * weightedPool.length)];
      }
    } else if (mode === 'pvp') {
      expGained = victory ? 125 : 45;
      coinsGained = victory ? 150 : 45;
      rpDelta = victory ? 48 : -14;

      db.prepare(
        `UPDATE season_rankings
         SET pvp_rp = MAX(0, pvp_rp + ?),
             pvp_wins = pvp_wins + ?,
             pvp_matches = pvp_matches + 1,
             updated_at = datetime('now')
         WHERE season_id = ? AND user_id = ?`
      ).run(rpDelta, victory ? 1 : 0, activeSeason.id, found.id);

      if (victory) {
        const pvpPool = EQUIPMENT_LIST.filter(
          (i) => i.rarity !== 'common'
        );
        droppedItemId = pvpPool[Math.floor(Math.random() * pvpPool.length)].id;
      }
    }

    // Apply EXP & Level Up
    let newLevel = found.level;
    let newExp = found.exp + expGained;
    let leveledUp = false;
    while (newExp >= getNextLevelExp(newLevel) && newLevel < 99) {
      newExp -= getNextLevelExp(newLevel);
      newLevel += 1;
      leveledUp = true;
    }

    db.prepare(
      'UPDATE users SET level = ?, exp = ?, coins = coins + ? WHERE id = ?'
    ).run(newLevel, newExp, coinsGained, found.id);

    let isNewItem = false;
    if (droppedItemId && EQUIPMENT_CATALOG[droppedItemId]) {
      const info = db
        .prepare(
          'INSERT OR IGNORE INTO user_inventory (user_id, item_id) VALUES (?, ?)'
        )
        .run(found.id, droppedItemId);
      isNewItem = info.changes > 0;
    }

    return res.json({
      user: buildUserProfilePayload(found.id),
      reward: {
        mode,
        victory,
        expGained,
        coinsGained,
        rpDelta,
        leveledUp,
        newLevel,
        droppedItemId,
        isNewItem,
      },
    });
  });

  // 4.7 Get Leaderboards (Race, Dungeon, PvP) + Season Archives
  app.get('/api/leaderboards', (_req, res) => {
    const activeSeason = ensureActiveSeason();

    const rows = db
      .prepare(
        `SELECT
           u.id, u.display_name, u.selected_character_id, u.level, u.is_bot,
           l.weapon_id, l.headgear_id, l.cape_id, l.aura_id,
           r.race_rp, r.race_wins, r.race_matches,
           r.dungeon_rp, r.highest_stage, r.bosses_defeated,
           r.pvp_rp, r.pvp_wins, r.pvp_matches
         FROM season_rankings r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN user_loadouts l ON l.user_id = u.id
         WHERE r.season_id = ?`
      )
      .all(activeSeason.id) as Array<Record<string, unknown>>;

    const enriched = rows.map((row) => {
      const loadout: EquippedLoadout = {
        weapon: (row.weapon_id as string) || DEFAULT_STARTER_LOADOUT.weapon,
        headgear:
          (row.headgear_id as string) || DEFAULT_STARTER_LOADOUT.headgear,
        cape: (row.cape_id as string) || DEFAULT_STARTER_LOADOUT.cape,
        aura: (row.aura_id as string) || DEFAULT_STARTER_LOADOUT.aura,
      };
      const stats = computeCharacterCombatStats(
        Number(row.level || 1),
        loadout
      );
      return {
        userId: Number(row.id),
        displayName: String(row.display_name),
        characterId: String(row.selected_character_id) as CharacterId,
        level: Number(row.level || 1),
        isBot: Boolean(row.is_bot),
        loadout,
        combatPower: stats.combatPower,
        raceRp: Number(row.race_rp || 1000),
        raceWins: Number(row.race_wins || 0),
        raceMatches: Number(row.race_matches || 0),
        dungeonRp: Number(row.dungeon_rp || 1000),
        highestStage: Number(row.highest_stage || 1),
        bossesDefeated: Number(row.bosses_defeated || 0),
        pvpRp: Number(row.pvp_rp || 1000),
        pvpWins: Number(row.pvp_wins || 0),
        pvpMatches: Number(row.pvp_matches || 0),
      };
    });

    const raceLeaderboard = [...enriched]
      .sort((a, b) => b.raceRp - a.raceRp)
      .slice(0, 15);
    const dungeonLeaderboard = [...enriched]
      .sort((a, b) => b.dungeonRp - a.dungeonRp)
      .slice(0, 15);
    const pvpLeaderboard = [...enriched]
      .sort((a, b) => b.pvpRp - a.pvpRp)
      .slice(0, 15);

    const archives = db
      .prepare('SELECT * FROM season_archives ORDER BY id DESC LIMIT 18')
      .all();

    return res.json({
      season: {
        seasonNumber: activeSeason.season_number,
        name: activeSeason.name,
        theme: activeSeason.theme,
        startsAt: activeSeason.starts_at,
        endsAt: activeSeason.ends_at,
      },
      raceLeaderboard,
      dungeonLeaderboard,
      pvpLeaderboard,
      archives,
    });
  });

  // 4.8 Trigger Seasonal Reset (Archives Champions & Soft-Resets All Ranks for Next Season!)
  app.post('/api/seasons/reset', (_req, res) => {
    const activeSeason = ensureActiveSeason();

    const seasonThemes = [
      'ศึกเจ้าแห่งยอดเขาหิมะและดันเจี้ยนน้ำแข็ง',
      'มหาศึกค้อนเป็ดยางสะท้านฟ้า',
      'ศึกชิงเจ้ายุทธภพกระทะเหล็กไฟลุก',
      'มหกรรมปาร์ตี้ทุเรียนทองคำ',
    ];

    const tx = db.transaction(() => {
      // 1. Archive #1 champion in each of the 3 modes
      const modes: Array<{
        mode: 'race' | 'dungeon' | 'pvp';
        col: 'race_rp' | 'dungeon_rp' | 'pvp_rp';
      }> = [
        { mode: 'race', col: 'race_rp' },
        { mode: 'dungeon', col: 'dungeon_rp' },
        { mode: 'pvp', col: 'pvp_rp' },
      ];

      for (const m of modes) {
        const topRow = db
          .prepare(
            `SELECT u.display_name, u.selected_character_id, r.${m.col} as rp
             FROM season_rankings r
             JOIN users u ON u.id = r.user_id
             WHERE r.season_id = ?
             ORDER BY r.${m.col} DESC
             LIMIT 1`
          )
          .get(activeSeason.id) as
          | {
              display_name: string;
              selected_character_id: string;
              rp: number;
            }
          | undefined;

        if (topRow) {
          db.prepare(
            `INSERT INTO season_archives (season_number, season_name, mode, champion_name, champion_character_id, final_rp)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            activeSeason.season_number,
            activeSeason.name,
            m.mode,
            topRow.display_name,
            topRow.selected_character_id,
            topRow.rp
          );
        }
      }

      // 2. Mark old season inactive & create Season N+1
      db.prepare('UPDATE seasons SET is_active = 0 WHERE id = ?').run(
        activeSeason.id
      );

      const nextNum = activeSeason.season_number + 1;
      const nextTheme = seasonThemes[(nextNum - 1) % seasonThemes.length];
      const nextName = `Season ${nextNum}: ${
        nextNum % 2 === 0 ? 'Durian & Thunder' : 'Frost & Fury'
      }`;
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      const info = db
        .prepare(
          `INSERT INTO seasons (season_number, name, theme, starts_at, ends_at, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`
        )
        .run(nextNum, nextName, nextTheme, startsAt, endsAt);
      const newSeasonId = Number(info.lastInsertRowid);

      // 3. Soft-reset all users' RP toward baseline 1000 (1000 + 35% of previous progress above 1000)
      const oldRanks = db
        .prepare('SELECT * FROM season_rankings WHERE season_id = ?')
        .all(activeSeason.id) as Array<Record<string, number>>;

      const insertNewRank = db.prepare(`
        INSERT INTO season_rankings (
          season_id, user_id, race_rp, race_wins, race_matches,
          dungeon_rp, highest_stage, bosses_defeated,
          pvp_rp, pvp_wins, pvp_matches
        ) VALUES (?, ?, ?, 0, 0, ?, 1, 0, ?, 0, 0)
      `);

      for (const r of oldRanks) {
        const softReset = (rp: number) =>
          Math.max(950, Math.round(1000 + (rp - 1000) * 0.35));
        insertNewRank.run(
          newSeasonId,
          r.user_id,
          softReset(r.race_rp),
          softReset(r.dungeon_rp),
          softReset(r.pvp_rp)
        );
      }
    });

    tx();
    return res.json({ ok: true, newSeason: ensureActiveSeason() });
  });

  // Mount Vite in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pals Rush 3D SQLite Server listening on http://localhost:${PORT}`);
  });
}

startServer();
