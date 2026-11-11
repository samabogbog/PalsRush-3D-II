import React, { useEffect, useRef, useState } from 'react';
import {
  Swords,
  Trophy,
  Flame,
  RotateCcw,
  Sparkles,
  Flag,
  Home,
  X,
} from 'lucide-react';
import {
  ACTIVE_SKILLS,
  ActiveSkillId,
  CharacterSpec,
  PassiveSkillId,
} from '../models/characterTypes';
import {
  EQUIPMENT_CATALOG,
  getRankTierByRp,
  RARITY_META,
  UserProfileData,
} from '../models/equipmentTypes';
import { DungeonBrawlerHudSnapshot } from './DungeonBrawlerCanvas';
import { MenuIconEmblem } from './GameAssetIcons';

export interface MatchRewardResult {
  mode: 'race' | 'dungeon' | 'pvp';
  victory: boolean;
  expGained: number;
  coinsGained: number;
  rpDelta: number;
  leveledUp: boolean;
  newLevel: number;
  droppedItemId: string | null;
  isNewItem: boolean;
}

export interface DungeonBrawlerHudProps {
  hud: DungeonBrawlerHudSnapshot;
  userProfile: UserProfileData | null;
  selectedCharacter: CharacterSpec;
  selectedActiveSkillId: ActiveSkillId;
  selectedPassiveSkillId: PassiveSkillId;
  lastReward: MatchRewardResult | null;
  onSelectSubMode: (subMode: 'dungeon' | 'pvp') => void;
  onSelectStage: (stage: number) => void;
  onRestartCombat: () => void;
  onSwitchToRaceMode: () => void;
  onGoHome: () => void;
  onOpenArmoryModal: (tab: 'auth' | 'armory' | 'leaderboard') => void;
  onEquipDroppedItem: (itemId: string) => void;
  onTriggerCombatAction: (type: 'atk' | 'q' | 'e' | 'jump') => void;
  onJoystickChange: (x: number, y: number) => void;
}

export const DungeonBrawlerHud: React.FC<DungeonBrawlerHudProps> = ({
  hud,
  userProfile,
  selectedCharacter,
  selectedActiveSkillId,
  lastReward,
  onSelectSubMode,
  onSelectStage,
  onRestartCombat,
  onSwitchToRaceMode,
  onGoHome,
  onOpenArmoryModal,
  onEquipDroppedItem,
  onTriggerCombatAction,
  onJoystickChange,
}) => {
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isResultDismissed, setIsResultDismissed] = useState(false);
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyPointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (hud.phase === 'fighting') {
      setIsResultDismissed(false);
    }
  }, [hud.phase]);

  const equippedWeapon =
    EQUIPMENT_CATALOG[userProfile?.loadout.weapon || 'w_squeaky_duck'] ||
    EQUIPMENT_CATALOG.w_squeaky_duck;
  const activeSkill = ACTIVE_SKILLS[selectedActiveSkillId];

  const currentRp =
    hud.subMode === 'pvp'
      ? userProfile?.rankings.pvpRp ?? 1000
      : userProfile?.rankings.dungeonRp ?? 1000;
  const rankTier = getRankTierByRp(currentRp);

  const hpPct = Math.max(
    0,
    Math.min(100, Math.round((hud.playerHp / Math.max(1, hud.playerMaxHp)) * 100))
  );

  const droppedItem =
    lastReward?.droppedItemId && EQUIPMENT_CATALOG[lastReward.droppedItemId]
      ? EQUIPMENT_CATALOG[lastReward.droppedItemId]
      : null;

  const updateJoystickFromEvent = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);
    const nx = dist > 2 ? (Math.cos(angle) * clampedDist) / maxR : 0;
    const ny = dist > 2 ? (Math.sin(angle) * clampedDist) / maxR : 0;
    setJoyKnob({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });
    onJoystickChange(nx, -ny);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden">
      {/* ==================== PINNED TOP BAR: PLAYER COMBAT STATS & MODE CONTROLS ==================== */}
      <div className="absolute top-2 inset-x-2 sm:top-3.5 sm:inset-x-4 z-10 flex items-start justify-between gap-2">
        {/* Left: Player Combat Status & Real Gear Stats (Fixed min-width, tabular-nums) */}
        <div className="pointer-events-auto flex flex-col gap-1 bg-[#2B2118]/95 text-[#FFFDF9] border-2 sm:border-3 border-[#1A130D] rounded-2xl sm:rounded-3xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-xl w-[225px] sm:w-[270px] shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={`/assets/game/avatars/avatar_${selectedCharacter.id}.png`}
              alt={selectedCharacter.shortName}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-[#FDE047] bg-[#3A2C20] object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs font-black text-[#FDE047] truncate">
                  Lv.{hud.playerStats.level}{' '}
                  {userProfile?.displayName || selectedCharacter.shortName}
                </span>
                <span
                  className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black text-[#2B2118] tabular-nums shrink-0"
                  style={{ backgroundColor: rankTier.bgHex }}
                >
                  {currentRp} RP
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#E5D9C5] tabular-nums truncate">
                CP {hud.playerStats.combatPower} · ATK {hud.playerStats.atk} · DEF{' '}
                {hud.playerStats.def}
              </div>
            </div>
          </div>

          {/* Player HP Bar */}
          <div className="w-full bg-[#1A130D] h-3.5 sm:h-4 rounded-full p-0.5 border border-white/15 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-150 bg-gradient-to-r from-[#22C55E] to-[#84CC16]"
              style={{ width: `${hpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white drop-shadow tabular-nums">
              HP {hud.playerHp} / {hud.playerMaxHp} ({hpPct}%)
            </span>
          </div>

          {/* Stage & Wave Indicator */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-extrabold text-[#FDE047] tabular-nums">
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
              {hud.stageName}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#1A130D] text-[#38BDF8] shrink-0">
              {hud.subMode === 'pvp'
                ? `ROUND ${hud.waveIndex}/${hud.totalWaves}`
                : `WAVE ${hud.waveIndex}/${hud.totalWaves}`}
            </span>
          </div>
        </div>

        {/* Right: Sub-Mode Switcher, Stage Buttons, Armory, Leaderboards & Back to Home / Race */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={onGoHome}
              data-testid="combat-go-home-btn"
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#1A130D] active:scale-95 transition-transform text-[11px] sm:text-xs font-black flex items-center gap-1 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="home" size={16} />
              <span>HOME</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSubMode('dungeon')}
              data-testid="combat-tab-dungeon"
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl sm:rounded-2xl border-2 active:scale-95 transition-transform text-[11px] sm:text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0 ${
                hud.subMode === 'dungeon'
                  ? 'bg-[#F59E0B] text-[#2B2118] border-[#1A130D]'
                  : 'bg-[#2B2118]/90 text-[#FFFDF9] border-[#1A130D] hover:bg-[#3A2C20]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>DUNGEON</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSubMode('pvp')}
              data-testid="combat-tab-pvp"
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl sm:rounded-2xl border-2 active:scale-95 transition-transform text-[11px] sm:text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0 ${
                hud.subMode === 'pvp'
                  ? 'bg-[#EC4899] text-white border-[#1A130D]'
                  : 'bg-[#2B2118]/90 text-[#FFFDF9] border-[#1A130D] hover:bg-[#3A2C20]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>PvP</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArmoryModal('armory')}
              data-testid="combat-open-armory"
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#1A130D] active:scale-95 transition-transform text-[11px] sm:text-xs font-black flex items-center gap-1 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="gear" size={16} />
              <span className="hidden sm:inline">GEAR</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArmoryModal('leaderboard')}
              data-testid="combat-open-leaderboard"
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#FACC15] hover:bg-[#FDE047] text-[#2B2118] border-2 border-[#1A130D] active:scale-95 transition-transform text-[11px] sm:text-xs font-black flex items-center gap-1 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="ranks" size={16} />
              <span className="hidden sm:inline">RANKS</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArmoryModal('auth')}
              className="hidden md:flex h-8 sm:h-9 px-2.5 rounded-xl sm:rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] active:scale-95 transition-transform text-xs font-black items-center gap-1 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="account" size={16} />
              <span>ACCOUNT</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToRaceMode}
              data-testid="switch-to-party-race"
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#1A130D] active:scale-95 transition-transform text-[11px] sm:text-xs font-black flex items-center gap-1 shadow whitespace-nowrap shrink-0"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RACE</span>
            </button>
          </div>

          {/* Stage Selector Pills when in Dungeon Mode */}
          {hud.subMode === 'dungeon' && (
            <div className="flex items-center gap-1 bg-[#2B2118]/90 p-1 rounded-xl border border-[#1A130D]">
              {[1, 2, 3].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onSelectStage(st)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-colors whitespace-nowrap shrink-0 ${
                    hud.stageNumber === st
                      ? 'bg-[#38BDF8] text-[#2B2118]'
                      : 'text-[#E5D9C5] hover:bg-white/10'
                  }`}
                >
                  ST.{st}
                </button>
              ))}
              <button
                type="button"
                onClick={onRestartCombat}
                title="Restart Stage"
                className="px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black text-[#FDE047] hover:bg-white/10 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RETRY</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== PINNED CENTER OVERLAY: BOSS HP & FLOATING DAMAGE (ZERO LAYOUT SHIFT) ==================== */}
      <div className="pointer-events-none absolute top-26 sm:top-4 left-1/2 -translate-x-1/2 z-10 w-[min(360px,90vw)] flex flex-col items-center gap-1.5">
        {hud.bossInfo && (
          <div className="w-full bg-[#2B2118]/95 border-2 border-[#EF4444] rounded-2xl px-3 py-1.5 shadow-xl">
            <div className="flex items-center justify-between text-[11px] font-black text-[#FCA5A5] tabular-nums">
              <span className="truncate">{hud.bossInfo.name}</span>
              <span className="text-[#FDE047]">
                {hud.bossInfo.hp} / {hud.bossInfo.maxHp}
              </span>
            </div>
            <div className="mt-1 w-full h-3 bg-[#1A130D] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#DC2626] via-[#F97316] to-[#FACC15] transition-[width] duration-150"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (hud.bossInfo.hp / Math.max(1, hud.bossInfo.maxHp)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {hud.bannerText && (
          <div className="px-3.5 py-1 rounded-xl bg-[#F59E0B] text-[#2B2118] border-2 border-[#1A130D] text-xs font-black shadow-lg whitespace-nowrap">
            {hud.bannerText}
          </div>
        )}

        {hud.recentDamages.length > 0 && (
          <div className="flex items-center gap-1 justify-center">
            {hud.recentDamages.slice(0, 3).map((d) => (
              <span
                key={d.id}
                className={`px-2 py-0.5 rounded-lg bg-[#1A130D]/90 border border-white/15 font-black tabular-nums ${
                  d.isCrit ? 'text-xs text-[#FACC15]' : 'text-[10px] text-white'
                }`}
                style={{ color: d.colorHex }}
              >
                {d.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ==================== CENTER MODAL: VICTORY / DEFEAT & LOOT CHEST DROP ==================== */}
      {(hud.phase === 'victory' || hud.phase === 'defeat') && isResultDismissed && (
        <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2B2118]/95 text-[#FFFDF9] border-2 border-[#F59E0B] rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xl">
          <span className="text-xs font-black text-[#FDE047] whitespace-nowrap">
            {hud.phase === 'victory' ? '🏆 STAGE CLEARED!' : '💀 BATTLE ENDED'}
          </span>
          <button
            type="button"
            onClick={() => setIsResultDismissed(false)}
            className="px-2.5 py-1 rounded-xl bg-[#F59E0B] text-[#2B2118] text-xs font-black"
          >
            REWARDS
          </button>
          <button
            type="button"
            onClick={onRestartCombat}
            className="px-2.5 py-1 rounded-xl bg-[#84CC16] text-[#2B2118] text-xs font-black"
          >
            RETRY
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="px-2.5 py-1 rounded-xl bg-[#FFFDF9] text-[#2B2118] text-xs font-black flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>
        </div>
      )}

      {(hud.phase === 'victory' || hud.phase === 'defeat') && !isResultDismissed && (
        <div
          onClick={() => setIsResultDismissed(true)}
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl max-w-md w-full p-4 shadow-2xl text-[#2B2118] flex flex-col gap-3 max-h-[92dvh] overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2 border-b-2 border-[#E5D9C5] pb-2">
              <div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    hud.phase === 'victory'
                      ? 'bg-[#84CC16] text-[#2B2118]'
                      : 'bg-[#EF4444] text-white'
                  }`}
                >
                  {hud.phase === 'victory' ? 'VICTORY & LOOT DROP!' : 'BATTLE ENDED'}
                </span>
                <h2 className="text-lg font-black mt-1">
                  {hud.phase === 'victory'
                    ? hud.subMode === 'pvp'
                      ? '3D Brawler Arena Champion!'
                      : `Stage ${hud.stageNumber} Cleared!`
                    : 'Defeated! Upgrade Gear & Try Again!'}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Trophy className="w-6 h-6 text-[#F59E0B]" />
                <button
                  type="button"
                  onClick={() => setIsResultDismissed(true)}
                  aria-label="Close Result Modal"
                  className="px-2.5 py-1 rounded-xl bg-[#2B2118] hover:bg-[#EF4444] text-white text-xs font-black flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {lastReward && (
              <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2 tabular-nums">
                <div>
                  <div className="text-[10px] font-bold text-[#7D6854]">
                    EXP GAINED
                  </div>
                  <div className="text-sm font-black text-[#16A34A]">
                    +{lastReward.expGained} EXP
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6854]">
                    COINS
                  </div>
                  <div className="text-sm font-black text-[#D97706]">
                    +{lastReward.coinsGained} 🪙
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6854]">
                    SEASON RP
                  </div>
                  <div
                    className={`text-sm font-black ${
                      lastReward.rpDelta >= 0
                        ? 'text-[#0284C7]'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {lastReward.rpDelta >= 0
                      ? `+${lastReward.rpDelta} RP`
                      : `${lastReward.rpDelta} RP`}
                  </div>
                </div>
              </div>
            )}

            {droppedItem && (
              <div
                className="rounded-2xl p-2.5 border-2 flex items-center justify-between gap-2"
                style={{
                  backgroundColor: RARITY_META[droppedItem.rarity].bgHex,
                  borderColor: RARITY_META[droppedItem.rarity].borderHex,
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span
                      className="text-[10px] font-black uppercase"
                      style={{
                        color: RARITY_META[droppedItem.rarity].colorHex,
                      }}
                    >
                      {RARITY_META[droppedItem.rarity].label} DROP
                    </span>
                  </div>
                  <div className="text-sm font-black text-[#2B2118] truncate">
                    {droppedItem.name}
                  </div>
                  <div className="text-[10px] font-bold text-[#5C4938] tabular-nums">
                    ATK +{droppedItem.bonusAtk} · HP +{droppedItem.bonusHp} · DEF +
                    {droppedItem.bonusDef} · CRIT +{droppedItem.bonusCritPct}%
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEquipDroppedItem(droppedItem.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] text-xs font-black whitespace-nowrap shrink-0 shadow"
                >
                  EQUIP NOW
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRestartCombat}
                className="flex-1 py-2 px-3 rounded-xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black whitespace-nowrap"
              >
                PLAY AGAIN
              </button>
              {hud.subMode === 'dungeon' && hud.stageNumber < 3 && (
                <button
                  type="button"
                  onClick={() => onSelectStage(hud.stageNumber + 1)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black whitespace-nowrap"
                >
                  STAGE {hud.stageNumber + 1}
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenArmoryModal('armory')}
                className="px-3 py-2 rounded-xl bg-[#2B2118] text-[#FFFDF9] border-2 border-[#1A130D] text-xs font-black whitespace-nowrap"
              >
                GEAR
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="px-3 py-2 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black flex items-center gap-1 whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5" />
                <span>HOME</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PINNED BOTTOM CONTROLS: LOCKED JOYSTICK & 4 COMBAT BUTTONS (ZERO CLS) ==================== */}
      <div className="absolute bottom-2 inset-x-2 sm:bottom-3.5 sm:inset-x-4 z-10 flex items-end justify-between gap-2">
        {/* Left: Fixed-Size Virtual Analog Thumbstick */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 shrink-0">
          <div
            ref={joyBaseRef}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              joyPointerIdRef.current = e.pointerId;
              updateJoystickFromEvent(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyPointerIdRef.current !== e.pointerId) return;
              updateJoystickFromEvent(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (joyPointerIdRef.current !== e.pointerId) return;
              joyPointerIdRef.current = null;
              setJoyKnob({ x: 0, y: 0 });
              onJoystickChange(0, 0);
            }}
            onPointerCancel={() => {
              joyPointerIdRef.current = null;
              setJoyKnob({ x: 0, y: 0 });
              onJoystickChange(0, 0);
            }}
            className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full bg-[#2B2118]/90 border-3 border-[#1A130D] shadow-xl flex items-center justify-center touch-none cursor-pointer"
          >
            <div
              className="pointer-events-none w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-2 border-[#1A130D] shadow-md will-change-transform"
              style={{
                transform: `translate3d(${joyKnob.x}px, ${joyKnob.y}px, 0)`,
              }}
            />
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-[#2B2118]/90 text-[#F3E8D6] text-[8px] sm:text-[9px] font-black whitespace-nowrap">
            WASD / MOVE
          </span>
        </div>

        {/* Center Helper Tip (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#2B2118]/90 text-[#F3E8D6] border border-[#1A130D] text-[11px] font-bold whitespace-nowrap">
          <span>[F / Click] Swing ({equippedWeapon.name})</span>
          <span>·</span>
          <span>[Q] {activeSkill.name}</span>
          <span>·</span>
          <span>[E] Weapon Ultimate (+15% Heal)</span>
          <span>·</span>
          <span>[Space] Dodge</span>
        </div>

        {/* Right: 4 Locked-Geometry Action Combat Buttons (Zero Layout Shift on Cooldown) */}
        <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2 shrink-0">
          {/* [F] Basic Weapon Swing */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onTriggerCombatAction('atk');
            }}
            data-testid="combat-btn-attack"
            className="relative w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] shrink-0 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#EF4444] to-[#DC2626] hover:from-[#F87171] hover:to-[#EF4444] text-white border-3 border-[#1A130D] shadow-xl flex flex-col items-center justify-center touch-none active:scale-95 transition-transform duration-75 will-change-transform"
          >
            <span className="pointer-events-none absolute -top-1.5 -left-1 px-1.5 py-0.2 rounded-md bg-[#1A130D] text-[#FDE047] text-[8px] sm:text-[9px] font-black">
              F
            </span>
            <Swords className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none" />
            <span className="text-[9px] sm:text-[10px] font-black mt-0.5 pointer-events-none">
              BONK!
            </span>
          </button>

          {/* [Q] Active Skill (Fixed 56x56 / 64x64 box + Overlay Cooldown) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onTriggerCombatAction('q');
            }}
            data-testid="combat-btn-skill-q"
            className="relative w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] shrink-0 rounded-2xl bg-[#2B2118] hover:bg-[#3A2C20] text-white border-3 border-[#1A130D] shadow-xl flex flex-col items-center justify-center overflow-hidden touch-none active:scale-95 transition-transform duration-75 will-change-transform"
          >
            <span className="pointer-events-none absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-black text-[#FDE047]">
              Q
            </span>
            <img
              src={`/assets/game/icons/skill_${selectedActiveSkillId}.png`}
              alt={selectedActiveSkillId}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain pointer-events-none"
            />
            <span className="text-[8px] sm:text-[9px] font-black pointer-events-none">
              SKILL
            </span>
            {hud.skillQCooldown > 0 && (
              <div className="pointer-events-none absolute inset-0 bg-black/75 flex items-center justify-center">
                <span className="text-xs font-black text-[#FDE047] tabular-nums">
                  {hud.skillQCooldown.toFixed(1)}s
                </span>
              </div>
            )}
          </button>

          {/* [E] Weapon Ultimate (Fixed 56x56 / 64x64 box + Overlay Cooldown) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onTriggerCombatAction('e');
            }}
            data-testid="combat-btn-ult-e"
            className="relative w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] shrink-0 rounded-2xl bg-gradient-to-b from-[#A855F7] to-[#7E22CE] text-white border-3 border-[#1A130D] shadow-xl flex flex-col items-center justify-center overflow-hidden touch-none active:scale-95 transition-transform duration-75 will-change-transform"
          >
            <span className="pointer-events-none absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-black text-[#FDE047]">
              E
            </span>
            <Flame className="w-5 h-5 text-[#FDE047] pointer-events-none" />
            <span className="text-[8px] sm:text-[9px] font-black pointer-events-none">
              ULTI
            </span>
            {hud.ultECooldown > 0 && (
              <div className="pointer-events-none absolute inset-0 bg-black/75 flex items-center justify-center">
                <span className="text-xs font-black text-[#FDE047] tabular-nums">
                  {hud.ultECooldown.toFixed(1)}s
                </span>
              </div>
            )}
          </button>

          {/* [Space] Dodge Hop (Fixed 56x56 / 64x64 box) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onTriggerCombatAction('jump');
            }}
            className="relative w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] shrink-0 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#1A130D] shadow-xl flex flex-col items-center justify-center touch-none active:scale-95 transition-transform duration-75 will-change-transform"
          >
            <span className="pointer-events-none absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-black">
              SPC
            </span>
            <img
              src="/assets/game/icons/hud_action_hop.png"
              alt="Dodge Hop"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain pointer-events-none"
            />
            <span className="text-[8px] sm:text-[9px] font-black pointer-events-none">
              DODGE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
