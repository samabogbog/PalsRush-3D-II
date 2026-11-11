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
