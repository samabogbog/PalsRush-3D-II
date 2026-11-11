import React, { useState } from 'react';
import {
  ActiveSkillId,
  CharacterId,
  ItemId,
  PassiveSkillId,
} from '../models/characterTypes';

/**
 * Delivered PNG Game Banners produced by `agent-asset-gen` in PR #1 (`TASK-001`)
 * and audited in `reviews/PR-001-hud-assets-review.md`.
 */
export const GAME_BANNER_ASSETS = {
  raceCrestBanner: '/assets/game/race_crest_banner.png',
  victoryTrophyEmblem: '/assets/game/victory_trophy_emblem.png',
  circuitMapCard: '/assets/game/circuit_map_card.png',
} as const;

/**
 * Target 16 Character Avatar PNG paths specified in `tasks/TASK-002-character-avatars.md`
 * for `agent-asset-gen` (Agent 2) on branch `agent/asset-gen/character-avatars`.
 */
export const CHARACTER_AVATAR_PATHS: Record<CharacterId, string> = {
  bear: '/assets/game/avatars/avatar_bear.png',
  panda: '/assets/game/avatars/avatar_panda.png',
  red_panda: '/assets/game/avatars/avatar_red_panda.png',
  raccoon: '/assets/game/avatars/avatar_raccoon.png',
  cat: '/assets/game/avatars/avatar_cat.png',
  dog: '/assets/game/avatars/avatar_dog.png',
  sheep: '/assets/game/avatars/avatar_sheep.png',
  pig: '/assets/game/avatars/avatar_pig.png',
  elephant: '/assets/game/avatars/avatar_elephant.png',
  hippo: '/assets/game/avatars/avatar_hippo.png',
  lion: '/assets/game/avatars/avatar_lion.png',
  tiger: '/assets/game/avatars/avatar_tiger.png',
  penguin: '/assets/game/avatars/avatar_penguin.png',
  duck: '/assets/game/avatars/avatar_duck.png',
  owl: '/assets/game/avatars/avatar_owl.png',
  frog: '/assets/game/avatars/avatar_frog.png',
};

export const ACTIVE_SKILL_ICON_PATHS: Record<ActiveSkillId, string> = {
  dash: '/assets/game/icons/skill_dash.png',
  shield: '/assets/game/icons/skill_shield.png',
  spring: '/assets/game/icons/skill_spring.png',
  quake: '/assets/game/icons/skill_quake.png',
  whirlwind: '/assets/game/icons/skill_whirlwind.png',
};

export const PASSIVE_SKILL_ICON_PATHS: Record<PassiveSkillId, string> = {
  nimble_paws: '/assets/game/icons/passive_nimble_paws.png',
  bouncy_belly: '/assets/game/icons/passive_bouncy_belly.png',
  feather_hop: '/assets/game/icons/passive_feather_hop.png',
  slime_boots: '/assets/game/icons/passive_slime_boots.png',
  lucky_magnet: '/assets/game/icons/passive_lucky_magnet.png',
};

export const PRANK_ITEM_ICON_PATHS: Record<ItemId, string> = {
  glove: '/assets/game/icons/item_glove.png',
  honey: '/assets/game/icons/item_honey.png',
  pie: '/assets/game/icons/item_pie.png',
  pepper: '/assets/game/icons/item_pepper.png',
  magnet: '/assets/game/icons/item_magnet.png',
};

export const ACTION_ICON_PATHS = {
  slap: '/assets/game/icons/hud_action_slap.png',
  hop: '/assets/game/icons/hud_action_hop.png',
} as const;

/**
 * Character Avatar Emblem (`TASK-002` — Delivered by `agent-asset-gen` in PR #1 / `2e4f29b`):
 * Renders `/assets/game/avatars/avatar_<id>.png` (512×512 circular badge with transparent corners)
 * across Character Selection, Loadout Strip, Top-Right Standings, Spectator Bar, and Podium.
 */
export const CharacterAvatarEmblem: React.FC<{
  characterId: CharacterId;
  primaryHex: string;
  secondaryHex?: string;
  accentHex?: string;
  size?: number;
  className?: string;
}> = ({
  characterId,
  primaryHex,
  secondaryHex = '#FFFDF9',
  accentHex = '#F59E0B',
  size = 38,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={CHARACTER_AVATAR_PATHS[characterId]}
        alt={characterId}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`shrink-0 object-contain drop-shadow-xs select-none ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: primaryHex,
      }}
      className={`relative shrink-0 rounded-full border-2 border-[#2B2118] flex items-center justify-center overflow-hidden shadow-2xs ${className}`}
    >
      <span
        className="w-[46%] h-[42%] rounded-full border border-black/25 flex items-center justify-center"
        style={{ backgroundColor: secondaryHex }}
      />
      <span
        className="absolute bottom-0 inset-x-0 h-[20%] border-t border-black/25"
        style={{ backgroundColor: accentHex }}
      />
    </div>
  );
};

const SKILL_COLOR_MAP: Record<ActiveSkillId, { bg: string; code: string }> = {
  dash: { bg: '#F59E0B', code: 'DSH' },
  shield: { bg: '#06B6D4', code: 'SHD' },
  spring: { bg: '#84CC16', code: 'SPR' },
  quake: { bg: '#EC4899', code: 'QKE' },
  whirlwind: { bg: '#8B5CF6', code: 'CYC' },
};

const PASSIVE_COLOR_MAP: Record<PassiveSkillId, { bg: string; code: string }> = {
  nimble_paws: { bg: '#F59E0B', code: 'PAW' },
  bouncy_belly: { bg: '#06B6D4', code: 'BLY' },
  feather_hop: { bg: '#84CC16', code: 'FTH' },
  slime_boots: { bg: '#EC4899', code: 'SLM' },
  lucky_magnet: { bg: '#8B5CF6', code: 'LCK' },
};

const ITEM_COLOR_MAP: Record<ItemId, { bg: string; code: string }> = {
  glove: { bg: '#EF4444', code: 'GLV' },
  honey: { bg: '#F59E0B', code: 'HNY' },
  pie: { bg: '#F472B6', code: 'PIE' },
  pepper: { bg: '#EA580C', code: 'PEP' },
  magnet: { bg: '#6366F1', code: 'MAG' },
};

/**
 * Renders an asset banner from `public/assets/game/*.png` delivered by `agent-asset-gen` in PR #1.
 */
export const PendingBannerSlot: React.FC<{
  src: string;
  alt: string;
  fileName: string;
  className?: string;
}> = ({ src, alt, fileName, className = '' }) => {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div
        className={`bg-[#2B2118] text-[#F3E8D6] flex flex-col items-center justify-center p-3 text-center border border-dashed border-[#F59E0B]/50 ${className}`}
      >
        <span className="text-[10px] font-mono text-[#FDE047] uppercase">
          Missing Asset
        </span>
        <span className="text-xs font-extrabold text-white mt-0.5 font-mono">
          {fileName}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setMissing(true)}
      className={className}
    />
  );
};

/**
 * Active Skill Emblem (`[Key Q]`): Renders the 512×512 PNG icon delivered in PR #1.
 */
export const ActiveSkillEmblem: React.FC<{
  skillId: ActiveSkillId;
  size?: number;
  className?: string;
}> = ({ skillId, size = 38, className = '' }) => {
  const [missing, setMissing] = useState(false);
  const spec = SKILL_COLOR_MAP[skillId];

  if (!missing) {
    return (
      <img
        src={ACTIVE_SKILL_ICON_PATHS[skillId]}
        alt={skillId}
        width={size}
        height={size}
        onError={() => setMissing(true)}
        className={`shrink-0 object-contain drop-shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: spec.bg }}
      className={`shrink-0 rounded-xl border-2 border-[#2B2118] flex items-center justify-center text-[10px] font-black font-mono text-[#2B2118] shadow-2xs ${className}`}
    >
      {spec.code}
    </div>
  );
};

/**
 * Passive Skill Emblem (`[Auto]`): Renders the 512×512 PNG medallion delivered in PR #1.
 */
export const PassiveSkillEmblem: React.FC<{
  passiveId: PassiveSkillId;
  size?: number;
  className?: string;
}> = ({ passiveId, size = 32, className = '' }) => {
  const [missing, setMissing] = useState(false);
  const spec = PASSIVE_COLOR_MAP[passiveId];

  if (!missing) {
    return (
      <img
        src={PASSIVE_SKILL_ICON_PATHS[passiveId]}
        alt={passiveId}
        width={size}
        height={size}
        onError={() => setMissing(true)}
        className={`shrink-0 object-contain drop-shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: spec.bg }}
      className={`shrink-0 rounded-full border-2 border-[#2B2118] flex items-center justify-center text-[9px] font-black font-mono text-[#2B2118] ${className}`}
    >
      {spec.code}
    </div>
  );
};

/**
 * Prank Item Emblem (`[Key E]`): Renders the 512×512 PNG item icon delivered in PR #1.
 */
export const PrankItemEmblem: React.FC<{
  itemId: ItemId | null;
  size?: number;
  className?: string;
}> = ({ itemId, size = 38, className = '' }) => {
  const [missing, setMissing] = useState(false);

  if (!itemId) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-xl border-2 border-dashed border-[#C8B69E] bg-[#F5EDE0] flex items-center justify-center text-sm font-black font-mono text-[#8C7762] ${className}`}
      >
        ?
      </div>
    );
  }

  const spec = ITEM_COLOR_MAP[itemId];

  if (!missing) {
    return (
      <img
        src={PRANK_ITEM_ICON_PATHS[itemId]}
        alt={itemId}
        width={size}
        height={size}
        onError={() => setMissing(true)}
        className={`shrink-0 object-contain drop-shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: spec.bg }}
      className={`shrink-0 rounded-xl border-2 border-[#2B2118] flex items-center justify-center text-[10px] font-black font-mono text-white ${className}`}
    >
      {spec.code}
    </div>
  );
};

/**
 * Core Arcade Action Button Emblem (`[F] Slap` & `[Space] Hop` PNG icons from PR #1).
 */
export const ActionButtonEmblem: React.FC<{
  action: 'slap' | 'hop';
  size?: number;
  className?: string;
}> = ({ action, size = 28, className = '' }) => {
  const [missing, setMissing] = useState(false);
  if (missing) return null;

  return (
    <img
      src={ACTION_ICON_PATHS[action]}
      alt={action === 'slap' ? 'Sideways Slap' : 'Hop Jump'}
      width={size}
      height={size}
      onError={() => setMissing(true)}
      className={`shrink-0 object-contain drop-shadow-xs ${className}`}
    />
  );
};

/**
 * Dynamic Parametric Rank Shield (`public/assets/game/icons/hud_rank_shield_frame.svg`).
 * Inlined per `agent-asset-gen` specification in `TASK-001` §6 so `--shield-outer` and
 * `--shield-inner` inherit dynamically from the racer's live rank (1st Gold, 2nd Silver,
 * 3rd Bronze, 4th–8th Slate) with live ordinal text centered at coordinate (32, 38).
 */
export const ArcadeRankShield: React.FC<{
  rank: number;
  size?: number;
}> = ({ rank, size = 56 }) => {
  const suffix =
    rank === 1 ? 'ST' : rank === 2 ? 'ND' : rank === 3 ? 'RD' : 'TH';

  const palette =
    rank === 1
      ? { outer: '#F59E0B', inner: '#FEF08A', text: '#2B2118' }
      : rank === 2
      ? { outer: '#CBD5E1', inner: '#F8FAFC', text: '#1E293B' }
      : rank === 3
      ? { outer: '#C86D3B', inner: '#FED7AA', text: '#2B2118' }
      : { outer: '#64748B', inner: '#CBD5E1', text: '#1E293B' };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={`Rank ${rank}${suffix.toLowerCase()}`}
      className="shrink-0 drop-shadow-sm"
      style={
        {
          '--shield-outer': palette.outer,
          '--shield-inner': palette.inner,
        } as React.CSSProperties
      }
    >
      <path
        d="M7 11 32 4 57 11v22c0 13-13 23-25 28C20 56 7 46 7 33Z"
        fill="var(--shield-outer, #F59E0B)"
        stroke="#2B2118"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M11 32c0 11 11 20 21 25 10-5 21-14 21-25v7C50 48 40 55 32 58 21 53 12 45 11 37Z"
        fill="#1A130D"
        opacity=".28"
      />
      <path
        d="m13 16 19-6 19 6v16c0 9-9 17-19 22-10-5-19-13-19-22Z"
        fill="var(--shield-inner, #FEF08A)"
        stroke="#2B2118"
        strokeWidth="1.5"
      />
      <path
        d="m15 17 17-5 17 5"
        stroke="#FFFDF9"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".8"
      />
      <path
        d="m24 17 4 3 4-6 4 6 4-3-2 8H26Z"
        fill="var(--shield-outer, #F59E0B)"
        stroke="#2B2118"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m32 46 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4Z"
        fill="var(--shield-outer, #F59E0B)"
      />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill={palette.text}
        fontSize="16"
        fontWeight="900"
        fontFamily="monospace"
      >
        {rank}
        <tspan fontSize="9" dy="-5">
          {suffix}
        </tspan>
      </text>
    </svg>
  );
};

/**
 * TASK-003 Target Paths for `agent-asset-gen` (Agent 2) on branch `agent/asset-gen/mode-cards-and-menu-icons`.
 */
export const MODE_CARD_PATHS = {
  party_race: '/assets/game/modes/mode_party_race.png',
  dungeon_raid: '/assets/game/modes/mode_dungeon_raid.png',
  brawler_pvp: '/assets/game/modes/mode_brawler_pvp.png',
} as const;

export const MAP_CARD_PATHS = {
  woodland: '/assets/game/maps/map_woodland_circuit.png',
  snow_glacier: '/assets/game/maps/map_glacier_peak.png',
} as const;

export const DUNGEON_STAGE_CARD_PATHS: Record<number, string> = {
  1: '/assets/game/dungeons/stage_1_slime_ruins.png',
  2: '/assets/game/dungeons/stage_2_lava_kitchen.png',
  3: '/assets/game/dungeons/stage_3_frost_citadel.png',
};

export type MenuIconId =
  | 'home'
  | 'heroes'
  | 'gear'
  | 'ranks'
  | 'account'
  | 'studio'
  | 'git'
  | 'weapon'
  | 'headgear'
  | 'cape'
  | 'aura';

export const MENU_ICON_PATHS: Record<MenuIconId, string> = {
  home: '/assets/game/icons/menu_home.png',
  heroes: '/assets/game/icons/menu_heroes.png',
  gear: '/assets/game/icons/menu_gear.png',
  ranks: '/assets/game/icons/menu_ranks.png',
  account: '/assets/game/icons/menu_account.png',
  studio: '/assets/game/icons/menu_heroes.png',
  git: '/assets/game/icons/menu_account.png',
  weapon: '/assets/game/icons/slot_weapon.png',
  headgear: '/assets/game/icons/slot_headgear.png',
  cape: '/assets/game/icons/slot_cape_aura.png',
  aura: '/assets/game/icons/slot_cape_aura.png',
};

export type VisualCardVariant =
  | 'mode_party_race'
  | 'mode_dungeon_raid'
  | 'mode_brawler_pvp'
  | 'map_woodland'
  | 'map_glacier'
  | 'stage_1'
  | 'stage_2'
  | 'stage_3';

const VISUAL_CARD_TARGET_SRC: Record<VisualCardVariant, string> = {
  mode_party_race: MODE_CARD_PATHS.party_race,
  mode_dungeon_raid: MODE_CARD_PATHS.dungeon_raid,
  mode_brawler_pvp: MODE_CARD_PATHS.brawler_pvp,
  map_woodland: MAP_CARD_PATHS.woodland,
  map_glacier: MAP_CARD_PATHS.snow_glacier,
  stage_1: DUNGEON_STAGE_CARD_PATHS[1],
  stage_2: DUNGEON_STAGE_CARD_PATHS[2],
  stage_3: DUNGEON_STAGE_CARD_PATHS[3],
};

/**
 * Illustrated Game Card Backdrop (`TASK-003`):
 * Automatically loads Agent 2's PNG card from `public/assets/game/{modes,maps,dungeons}/*.png`,
 * and renders a rich illustrated artwork diorama using existing game assets + SVG scenery until PR #3 is merged.
 */
export const VisualImageCard: React.FC<{
  variant: VisualCardVariant;
  className?: string;
}> = ({ variant, className = '' }) => {
  const [missingTargetPng, setMissingTargetPng] = useState(false);

  if (!missingTargetPng) {
    return (
      <img
        src={VISUAL_CARD_TARGET_SRC[variant]}
        alt={variant}
        onError={() => setMissingTargetPng(true)}
        className={`w-full h-full object-cover select-none ${className}`}
      />
    );
  }

  // Rich illustrated fallback compositions for each card variant
  if (variant === 'mode_party_race') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#1D2B19] ${className}`}>
        <img
          src={GAME_BANNER_ASSETS.raceCrestBanner}
          alt="Party Race"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/75 via-[#1A130D]/25 to-transparent" />
        <div className="absolute right-3 bottom-2 flex items-end -space-x-2 pointer-events-none">
          <img
            src={CHARACTER_AVATAR_PATHS.bear}
            alt="Bear"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg -rotate-6"
          />
          <img
            src={CHARACTER_AVATAR_PATHS.penguin}
            alt="Penguin"
            className="w-15 h-15 sm:w-18 sm:h-18 object-contain drop-shadow-lg z-10"
          />
          <img
            src={CHARACTER_AVATAR_PATHS.duck}
            alt="Duck"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg rotate-6"
          />
        </div>
      </div>
    );
  }

  if (variant === 'mode_dungeon_raid') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#3B1D5E] via-[#6D28D9] to-[#1E1B4B] ${className}`}
      >
        <svg
          viewBox="0 0 400 180"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="310" cy="85" r="68" fill="#F59E0B" opacity="0.22" />
          <path d="M0 180 L0 110 L70 65 L140 120 L220 50 L310 115 L400 55 L400 180 Z" fill="#1E1B4B" />
          {/* Giant Crowned Slime Boss Silhouette */}
          <ellipse cx="305" cy="118" rx="48" ry="38" fill="#22C55E" stroke="#1A130D" strokeWidth="5" />
          <ellipse cx="292" cy="105" rx="14" ry="8" fill="#86EFAC" opacity="0.7" />
          <circle cx="290" cy="115" r="5" fill="#1A130D" />
          <circle cx="320" cy="115" r="5" fill="#1A130D" />
          <polygon
            points="282,82 293,64 305,77 317,64 328,82"
            fill="#FACC15"
            stroke="#1A130D"
            strokeWidth="3.5"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/80 via-[#1A130D]/30 to-transparent" />
        <div className="absolute right-3 bottom-2 flex items-center gap-1 pointer-events-none">
          <img
            src={ACTIVE_SKILL_ICON_PATHS.quake}
            alt="Boss Smash"
            className="w-11 h-11 object-contain drop-shadow-md -rotate-12"
          />
          <img
            src={CHARACTER_AVATAR_PATHS.tiger}
            alt="Tiger Raider"
            className="w-15 h-15 object-contain drop-shadow-lg"
          />
        </div>
      </div>
    );
  }

  if (variant === 'mode_brawler_pvp') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#7F1D1D] via-[#BE123C] to-[#31102F] ${className}`}
      >
        <svg
          viewBox="0 0 400 180"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="295" cy="90" r="64" fill="#FDE047" opacity="0.2" />
          {/* Lightning Clash Rays */}
          <polygon points="275,20 295,82 268,90 310,165 285,100 315,90" fill="#FDE047" opacity="0.45" />
          <ellipse cx="295" cy="152" rx="75" ry="20" fill="#451A03" stroke="#1A130D" strokeWidth="4" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/80 via-[#1A130D]/30 to-transparent" />
        <div className="absolute right-3 bottom-2 flex items-center -space-x-2 pointer-events-none">
          <img
            src={CHARACTER_AVATAR_PATHS.lion}
            alt="Lion"
            className="w-14 h-14 object-contain drop-shadow-lg -rotate-6"
          />
          <img
            src={PRANK_ITEM_ICON_PATHS.glove}
            alt="Clash"
            className="w-11 h-11 object-contain drop-shadow-lg z-10"
          />
          <img
            src={CHARACTER_AVATAR_PATHS.raccoon}
            alt="Raccoon"
            className="w-14 h-14 object-contain drop-shadow-lg rotate-6"
          />
        </div>
      </div>
    );
  }

  if (variant === 'map_woodland') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#14532D] ${className}`}>
        <img
          src={GAME_BANNER_ASSETS.circuitMapCard}
          alt="Woodland Circuit"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/85 via-transparent to-black/20" />
      </div>
    );
  }

  if (variant === 'map_glacier') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#082F49] via-[#0284C7] to-[#1E1B4B] ${className}`}
      >
        <svg
          viewBox="0 0 400 200"
          className="absolute inset-0 w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Northern Lights Aurora Ribbon */}
          <path
            d="M-20 45 Q90 10 200 50 T420 35"
            fill="none"
            stroke="#34D399"
            strokeWidth="18"
            strokeLinecap="round"
            opacity="0.45"
          />
          <path
            d="M-20 65 Q110 25 220 65 T420 55"
            fill="none"
            stroke="#A855F7"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Glacier Mountains & Crystal Spires */}
          <polygon points="10,200 85,68 165,200" fill="#BAE6FD" stroke="#1A130D" strokeWidth="4" />
          <polygon points="85,68 122,130 85,115 55,130" fill="#FFFDF9" />
          <polygon points="130,200 230,48 330,200" fill="#7DD3FC" stroke="#1A130D" strokeWidth="4" />
          <polygon points="230,48 272,120 230,104 190,120" fill="#FFFDF9" />
          <polygon points="270,200 350,82 420,200" fill="#38BDF8" stroke="#1A130D" strokeWidth="4" />
          {/* Glowing Ice Crystals */}
          <polygon points="315,155 328,112 341,155" fill="#67E8F9" stroke="#1A130D" strokeWidth="3" />
          <polygon points="52,165 64,125 76,165" fill="#A5F3FC" stroke="#1A130D" strokeWidth="3" />
        </svg>
        <img
          src={CHARACTER_AVATAR_PATHS.penguin}
          alt="Penguin"
          className="absolute right-3 bottom-2 w-14 h-14 object-contain drop-shadow-lg pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/85 via-transparent to-transparent" />
      </div>
    );
  }

  if (variant === 'stage_1') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#15803D] to-[#1A2E05] ${className}`}
      >
        <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full object-cover">
          <circle cx="160" cy="95" r="52" fill="#84CC16" opacity="0.25" />
          <ellipse cx="160" cy="112" rx="44" ry="34" fill="#22C55E" stroke="#1A130D" strokeWidth="4.5" />
          <polygon points="140,78 150,62 160,74 170,62 180,78" fill="#FDE047" stroke="#1A130D" strokeWidth="3" />
          <circle cx="146" cy="108" r="4.5" fill="#1A130D" />
          <circle cx="174" cy="108" r="4.5" fill="#1A130D" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/85 via-transparent to-transparent" />
      </div>
    );
  }

  if (variant === 'stage_2') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#7C2D12] via-[#DC2626] to-[#450A0A] ${className}`}
      >
        <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full object-cover">
          <circle cx="160" cy="95" r="55" fill="#F97316" opacity="0.3" />
          <rect x="118" y="72" width="84" height="64" rx="22" fill="#EA580C" stroke="#1A130D" strokeWidth="4.5" />
          <polygon points="132,72 145,50 160,68 175,50 188,72" fill="#FDE047" stroke="#1A130D" strokeWidth="3" />
          <circle cx="144" cy="102" r="5" fill="#FDE047" />
          <circle cx="176" cy="102" r="5" fill="#FDE047" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/85 via-transparent to-transparent" />
      </div>
    );
  }

  // stage_3: Frost Durian Citadel
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0C4A6E] via-[#0284C7] to-[#3B0764] ${className}`}
    >
      <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full object-cover">
        <circle cx="160" cy="95" r="56" fill="#38BDF8" opacity="0.28" />
        <polygon
          points="160,52 178,72 204,68 192,94 212,114 184,122 176,144 160,128 144,144 136,122 108,114 128,94 116,68 142,72"
          fill="#38BDF8"
          stroke="#1A130D"
          strokeWidth="4"
        />
        <circle cx="148" cy="100" r="4.5" fill="#1A130D" />
        <circle cx="172" cy="100" r="4.5" fill="#1A130D" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/85 via-transparent to-transparent" />
    </div>
  );
};

/**
 * Illustrated Menu & Equipment Slot Icon (`TASK-003`):
 * Loads `/assets/game/icons/menu_<id>.png` or `slot_<id>.png` when Agent 2's PR is merged,
 * and renders a custom 3D toy-craft SVG icon emblem with `#2B2118` outline as fallback.
 */
export const MenuIconEmblem: React.FC<{
  icon: MenuIconId;
  size?: number;
  className?: string;
}> = ({ icon, size = 26, className = '' }) => {
  const [missingPng, setMissingPng] = useState(false);

  if (!missingPng) {
    return (
      <img
        src={MENU_ICON_PATHS[icon]}
        alt={icon}
        width={size}
        height={size}
        onError={() => setMissingPng(true)}
        className={`shrink-0 object-contain drop-shadow-xs select-none ${className}`}
      />
    );
  }

  // Toy-craft vector emblem fallback for each menu / slot icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={`shrink-0 drop-shadow-xs select-none ${className}`}
    >
      {icon === 'home' && (
        <>
          <polygon points="20,5 36,18 32,18 32,34 8,34 8,18 4,18" fill="#FDE047" stroke="#2B2118" strokeWidth="3.2" strokeLinejoin="round" />
          <polygon points="20,5 36,18 4,18" fill="#EF4444" stroke="#2B2118" strokeWidth="3.2" strokeLinejoin="round" />
          <rect x="16" y="22" width="8" height="12" rx="2" fill="#8B5A3C" stroke="#2B2118" strokeWidth="2.5" />
        </>
      )}
      {icon === 'heroes' && (
        <>
          <circle cx="20" cy="20" r="15" fill="#F59E0B" stroke="#2B2118" strokeWidth="3.2" />
          <circle cx="13" cy="12" r="4" fill="#8B5A3C" stroke="#2B2118" strokeWidth="2.4" />
          <circle cx="27" cy="12" r="4" fill="#8B5A3C" stroke="#2B2118" strokeWidth="2.4" />
          <circle cx="20" cy="21" r="9.5" fill="#FFFDF9" stroke="#2B2118" strokeWidth="2.6" />
          <circle cx="17" cy="20" r="1.8" fill="#2B2118" />
          <circle cx="23" cy="20" r="1.8" fill="#2B2118" />
          <ellipse cx="20" cy="24" rx="3" ry="2" fill="#D94E41" />
        </>
      )}
      {icon === 'gear' && (
        <>
          <path d="M8 9 L20 4 L32 9 V20 C32 28 20 35 20 35 C20 35 8 28 8 20 Z" fill="#A855F7" stroke="#2B2118" strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M13 13 L20 9 L27 13 V19 C27 24 20 29 20 29 C20 29 13 24 13 19 Z" fill="#FDE047" stroke="#2B2118" strokeWidth="2" />
        </>
      )}
      {icon === 'ranks' && (
        <>
          <path d="M11 8 H29 V18 C29 24 25 27 20 27 C15 27 11 24 11 18 Z" fill="#FACC15" stroke="#2B2118" strokeWidth="3.2" strokeLinejoin="round" />
          <rect x="16" y="27" width="8" height="5" fill="#F59E0B" stroke="#2B2118" strokeWidth="2.5" />
          <rect x="11" y="32" width="18" height="4" rx="1.5" fill="#2B2118" />
          <polygon points="20,12 22,16 26,16 23,19 24,23 20,20 16,23 17,19 14,16 18,16" fill="#FFFDF9" />
        </>
      )}
      {icon === 'account' && (
        <>
          <rect x="6" y="7" width="28" height="26" rx="6" fill="#38BDF8" stroke="#2B2118" strokeWidth="3.2" />
          <circle cx="20" cy="16" r="5" fill="#FFFDF9" stroke="#2B2118" strokeWidth="2.5" />
          <path d="M11 29 C11 24 29 24 29 29" fill="#FDE047" stroke="#2B2118" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {icon === 'studio' && (
        <>
          <polygon points="20,5 34,12 34,28 20,35 6,28 6,12" fill="#38BDF8" stroke="#2B2118" strokeWidth="3.2" strokeLinejoin="round" />
          <polygon points="20,5 34,12 20,19 6,12" fill="#BAE6FD" stroke="#2B2118" strokeWidth="2.2" />
          <polygon points="20,19 34,12 34,28 20,35" fill="#0284C7" stroke="#2B2118" strokeWidth="2.2" />
        </>
      )}
      {icon === 'git' && (
        <>
          <circle cx="12" cy="11" r="4.5" fill="#F59E0B" stroke="#2B2118" strokeWidth="2.8" />
          <circle cx="12" cy="29" r="4.5" fill="#84CC16" stroke="#2B2118" strokeWidth="2.8" />
          <circle cx="28" cy="20" r="4.5" fill="#38BDF8" stroke="#2B2118" strokeWidth="2.8" />
          <path d="M12 15.5 V24.5 M16 12 L24 18 M16 28 L24 22" stroke="#2B2118" strokeWidth="3.2" strokeLinecap="round" />
        </>
      )}
      {icon === 'weapon' && (
        <>
          <rect x="17" y="16" width="6" height="19" rx="2.5" transform="rotate(-30 20 25)" fill="#8B5A3C" stroke="#2B2118" strokeWidth="2.6" />
          <rect x="8" y="7" width="22" height="13" rx="6" transform="rotate(-30 19 13)" fill="#FACC15" stroke="#2B2118" strokeWidth="3" />
        </>
      )}
      {icon === 'headgear' && (
        <>
          <path d="M8 26 C8 15 32 15 32 26 Z" fill="#EF4444" stroke="#2B2118" strokeWidth="3" />
          <rect x="5" y="25" width="30" height="5" rx="2.5" fill="#FDE047" stroke="#2B2118" strokeWidth="2.6" />
          <line x1="20" y1="9" x2="20" y2="15" stroke="#2B2118" strokeWidth="3" />
          <ellipse cx="20" cy="9" rx="9" ry="2.5" fill="#38BDF8" stroke="#2B2118" strokeWidth="2.2" />
        </>
      )}
      {(icon === 'cape' || icon === 'aura') && (
        <>
          <path d="M12 8 H28 L33 33 L20 29 L7 33 Z" fill="#EC4899" stroke="#2B2118" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="20,12 22,17 27,17 23,20 24,25 20,22 16,25 17,20 13,17 18,17" fill="#FDE047" />
        </>
      )}
    </svg>
  );
};

