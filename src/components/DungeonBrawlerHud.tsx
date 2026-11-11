import React, { useEffect, useRef, useState } from 'react';
import {
  Shield,
  Swords,
  Trophy,
  UserCheck,
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
  PASSIVE_SKILLS,
  PassiveSkillId,
} from '../models/characterTypes';
import {
  EQUIPMENT_CATALOG,
  EquippedLoadout,
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
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4 select-none overflow-hidden">
      {/* ==================== TOP BAR: PLAYER COMBAT STATS & BOSS HP ==================== */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* Left: Player Combat Status & Real Gear Stats */}
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-[#2B2118]/95 text-[#FFFDF9] border-3 border-[#1A130D] border-b-6 rounded-3xl px-3.5 py-2.5 shadow-xl min-w-[255px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src={`/assets/game/avatars/avatar_${selectedCharacter.id}.png`}
                alt={selectedCharacter.shortName}
                className="w-9 h-9 rounded-2xl border-2 border-[#FDE047] bg-[#3A2C20] object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#FDE047]">
                    Lv.{hud.playerStats.level}{' '}
                    {userProfile?.displayName || selectedCharacter.shortName}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[9px] font-black text-[#2B2118]"
                    style={{ backgroundColor: rankTier.bgHex }}
                  >
                    {rankTier.tierName} ({currentRp} RP)
                  </span>
                </div>
                <div className="text-[10px] font-bold text-[#E5D9C5] tabular-nums">
                  CP {hud.playerStats.combatPower} · ATK {hud.playerStats.atk} · DEF{' '}
                  {hud.playerStats.def} · CRIT {hud.playerStats.critPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Player HP Bar */}
          <div className="w-full bg-[#1A130D] h-4 rounded-full p-0.5 border border-white/15 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-[#22C55E] to-[#84CC16]"
              style={{ width: `${hpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow tabular-nums">
              HP {hud.playerHp} / {hud.playerMaxHp} ({hpPct}%)
            </span>
          </div>

          {/* Stage & Wave Indicator */}
          <div className="flex items-center justify-between text-[10px] font-extrabold text-[#FDE047]">
            <span className="truncate max-w-[180px]">{hud.stageName}</span>
            <span className="px-2 py-0.5 rounded-lg bg-[#1A130D] text-[#38BDF8] tabular-nums">
              {hud.subMode === 'pvp'
                ? `ROUND ${hud.waveIndex}/${hud.totalWaves}`
                : `WAVE ${hud.waveIndex}/${hud.totalWaves}`}
            </span>
          </div>
        </div>

        {/* Center: Giant Boss / Rival Champion HP Bar + Floating Damage Callouts */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md mx-auto">
          {hud.bossInfo && (
            <div className="w-full bg-[#2B2118]/95 border-3 border-[#EF4444] border-b-6 rounded-3xl px-4 py-2 shadow-xl">
              <div className="flex items-center justify-between text-xs font-black text-[#FCA5A5]">
                <span className="truncate">{hud.bossInfo.name}</span>
                <span className="tabular-nums text-[#FDE047]">
                  {hud.bossInfo.hp} / {hud.bossInfo.maxHp}
                </span>
              </div>
              <div className="mt-1 w-full h-3.5 bg-[#1A130D] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#DC2626] via-[#F97316] to-[#FACC15] transition-all duration-150"
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
            <div className="px-4 py-1.5 rounded-2xl bg-[#F59E0B] text-[#2B2118] border-2 border-[#1A130D] text-xs sm:text-sm font-black shadow-lg">
              {hud.bannerText}
            </div>
          )}

          {/* Floating Damage Feed */}
          {hud.recentDamages.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {hud.recentDamages.slice(0, 3).map((d) => (
                <span
                  key={d.id}
                  className={`px-2 py-0.5 rounded-xl bg-[#1A130D]/90 border border-white/15 font-black tabular-nums ${
                    d.isCrit ? 'text-xs text-[#FACC15]' : 'text-[11px] text-white'
                  }`}
                  style={{ color: d.colorHex }}
                >
                  {d.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Sub-Mode Switcher, Stage Buttons, Armory, Leaderboards & Back to Home / Race */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onGoHome}
              data-testid="combat-go-home-btn"
              className="h-9 px-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="home" size={18} />
              <span>HOME</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSubMode('dungeon')}
              data-testid="combat-tab-dungeon"
              className={`h-9 px-3 rounded-2xl border-2 border-b-4 text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
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
              className={`h-9 px-3 rounded-2xl border-2 border-b-4 text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                hud.subMode === 'pvp'
                  ? 'bg-[#EC4899] text-white border-[#1A130D]'
                  : 'bg-[#2B2118]/90 text-[#FFFDF9] border-[#1A130D] hover:bg-[#3A2C20]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>PvP ARENA</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArmoryModal('armory')}
              data-testid="combat-open-armory"
              className="h-9 px-3 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="gear" size={18} />
              <span>GEAR</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArmoryModal('leaderboard')}
              data-testid="combat-open-leaderboard"
              className="h-9 px-3 rounded-2xl bg-[#FACC15] hover:bg-[#FDE047] text-[#2B2118] border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="ranks" size={18} />
              <span>RANKS</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArmoryModal('auth')}
              className="h-9 px-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              <MenuIconEmblem icon="account" size={18} />
              <span>ACCOUNT</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToRaceMode}
              data-testid="switch-to-party-race"
              className="h-9 px-3 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>RACE</span>
            </button>
          </div>

          {/* Stage Selector Pills when in Dungeon Mode */}
          {hud.subMode === 'dungeon' && (
            <div className="flex items-center gap-1 bg-[#2B2118]/90 p-1 rounded-2xl border-2 border-[#1A130D]">
              {[1, 2, 3].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onSelectStage(st)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all whitespace-nowrap shrink-0 ${
                    hud.stageNumber === st
                      ? 'bg-[#38BDF8] text-[#2B2118]'
                      : 'text-[#E5D9C5] hover:bg-white/10'
                  }`}
                >
                  STAGE {st}
                </button>
              ))}
              <button
                type="button"
                onClick={onRestartCombat}
                title="Restart Stage"
                className="px-2 py-1 rounded-xl text-[10px] font-black text-[#FDE047] hover:bg-white/10 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RETRY</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== CENTER MODAL: VICTORY / DEFEAT & LOOT CHEST DROP ==================== */}
      {(hud.phase === 'victory' || hud.phase === 'defeat') && isResultDismissed && (
        <div className="pointer-events-auto mx-auto bg-[#2B2118]/95 text-[#FFFDF9] border-3 border-[#F59E0B] rounded-2xl px-4 py-2 flex items-center gap-2.5 shadow-xl">
          <span className="text-xs font-black text-[#FDE047]">
            {hud.phase === 'victory' ? '🏆 STAGE CLEARED!' : '💀 BATTLE ENDED'}
          </span>
          <button
            type="button"
            onClick={() => setIsResultDismissed(false)}
            className="px-3 py-1 rounded-xl bg-[#F59E0B] text-[#2B2118] text-xs font-black"
          >
            REWARDS
          </button>
          <button
            type="button"
            onClick={onRestartCombat}
            className="px-3 py-1 rounded-xl bg-[#84CC16] text-[#2B2118] text-xs font-black"
          >
            RETRY
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="px-3 py-1 rounded-xl bg-[#FFFDF9] text-[#2B2118] text-xs font-black flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>
        </div>
      )}

      {(hud.phase === 'victory' || hud.phase === 'defeat') && !isResultDismissed && (
        <div
          onClick={() => setIsResultDismissed(true)}
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border-4 border-[#2B2118] rounded-3xl max-w-md w-full p-5 shadow-2xl text-[#2B2118] flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2 border-b-2 border-[#E5D9C5] pb-2.5">
              <div>
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                    hud.phase === 'victory'
                      ? 'bg-[#84CC16] text-[#2B2118]'
                      : 'bg-[#EF4444] text-white'
                  }`}
                >
                  {hud.phase === 'victory' ? 'VICTORY & LOOT DROP!' : 'BATTLE ENDED'}
                </span>
                <h2 className="text-xl font-black mt-1">
                  {hud.phase === 'victory'
                    ? hud.subMode === 'pvp'
                      ? '3D Brawler Arena Champion!'
                      : `Stage ${hud.stageNumber} Cleared!`
                    : 'Defeated! Upgrade Gear & Try Again!'}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Trophy className="w-7 h-7 text-[#F59E0B]" />
                <button
                  type="button"
                  onClick={() => setIsResultDismissed(true)}
                  aria-label="Close Result Modal"
                  className="px-2.5 py-1.5 rounded-xl bg-[#2B2118] hover:bg-[#EF4444] text-white text-xs font-black flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {lastReward && (
              <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5">
                <div>
                  <div className="text-[10px] font-bold text-[#7D6854]">
                    EXP GAINED
                  </div>
                  <div className="text-sm font-black text-[#16A34A] tabular-nums">
                    +{lastReward.expGained} EXP
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6854]">
                    COINS
                  </div>
                  <div className="text-sm font-black text-[#D97706] tabular-nums">
                    +{lastReward.coinsGained} 🪙
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6854]">
                    SEASON RP
                  </div>
                  <div
                    className={`text-sm font-black tabular-nums ${
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

            {/* Dropped Equipment Item Card */}
            {droppedItem && (
              <div
                className="rounded-2xl p-3 border-2 flex items-center justify-between gap-3"
                style={{
                  backgroundColor: RARITY_META[droppedItem.rarity].bgHex,
                  borderColor: RARITY_META[droppedItem.rarity].borderHex,
                }}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    <span
                      className="text-[10px] font-black uppercase"
                      style={{
                        color: RARITY_META[droppedItem.rarity].colorHex,
                      }}
                    >
                      {RARITY_META[droppedItem.rarity].label} DROP
                    </span>
                  </div>
                  <div className="text-sm font-black text-[#2B2118] mt-0.5">
                    {droppedItem.name}
                  </div>
                  <div className="text-[11px] font-bold text-[#5C4938] tabular-nums">
                    ATK +{droppedItem.bonusAtk} · HP +{droppedItem.bonusHp} · DEF +
                    {droppedItem.bonusDef} · CRIT +{droppedItem.bonusCritPct}%
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEquipDroppedItem(droppedItem.id)}
                  className="px-3 py-2 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] text-xs font-black whitespace-nowrap shrink-0 shadow"
                >
                  EQUIP NOW
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onRestartCombat}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-xs font-black whitespace-nowrap"
              >
                PLAY AGAIN
              </button>
              {hud.subMode === 'dungeon' && hud.stageNumber < 3 && (
                <button
                  type="button"
                  onClick={() => onSelectStage(hud.stageNumber + 1)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-xs font-black whitespace-nowrap"
                >
                  STAGE {hud.stageNumber + 1}
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenArmoryModal('armory')}
                className="px-3.5 py-2.5 rounded-2xl bg-[#2B2118] text-[#FFFDF9] border-3 border-[#1A130D] border-b-6 text-xs font-black whitespace-nowrap"
              >
                GEAR
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="px-3.5 py-2.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-xs font-black flex items-center gap-1 whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5" />
                <span>HOME</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM CONTROLS: JOYSTICK & 4 COMBAT BUTTONS ==================== */}
      <div className="flex items-end justify-between gap-3">
        {/* Left: Virtual Analog Thumbstick */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
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
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#2B2118]/90 border-4 border-[#1A130D] shadow-xl flex items-center justify-center touch-none cursor-pointer"
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-3 border-[#1A130D] shadow-md"
              style={{
                transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
              }}
            />
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-[#2B2118]/90 text-[#F3E8D6] text-[9px] font-black">
            WASD / MOVE
          </span>
        </div>

        {/* Center Helper Tip */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#2B2118]/90 text-[#F3E8D6] border-2 border-[#1A130D] text-[11px] font-bold">
          <span>[F / Click] Swing ({equippedWeapon.name})</span>
          <span>·</span>
          <span>[Q] {activeSkill.name}</span>
          <span>·</span>
          <span>[E] Weapon Ultimate (+15% Heal)</span>
          <span>·</span>
          <span>[Space] Dodge</span>
        </div>

        {/* Right: 4 Action Combat Buttons */}
        <div className="pointer-events-auto flex items-end gap-2">
          {/* [F] Basic Weapon Swing */}
          <button
            type="button"
            onClick={() => onTriggerCombatAction('atk')}
            data-testid="combat-btn-attack"
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b from-[#EF4444] to-[#DC2626] hover:from-[#F87171] hover:to-[#EF4444] text-white border-3 border-[#1A130D] border-b-6 shadow-xl flex flex-col items-center justify-center active:translate-y-0.5"
          >
            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-lg bg-[#1A130D] text-[#FDE047] text-[9px] font-black">
              F / CLICK
            </span>
            <Swords className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[10px] font-black mt-0.5">BONK!</span>
          </button>

          {/* [Q] Active Skill */}
          <button
            type="button"
            onClick={() => onTriggerCombatAction('q')}
            data-testid="combat-btn-skill-q"
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#2B2118] hover:bg-[#3A2C20] text-white border-3 border-[#1A130D] border-b-6 shadow-xl flex flex-col items-center justify-center overflow-hidden"
          >
            <span className="absolute top-0.5 left-1 text-[9px] font-black text-[#FDE047]">
              Q
            </span>
            <img
              src={`/assets/game/icons/skill_${selectedActiveSkillId}.png`}
              alt={selectedActiveSkillId}
              className="w-7 h-7 object-contain"
            />
            <span className="text-[9px] font-black">
              {hud.skillQCooldown > 0
                ? `${hud.skillQCooldown.toFixed(1)}s`
                : 'SKILL'}
            </span>
          </button>

          {/* [E] Weapon Ultimate */}
          <button
            type="button"
            onClick={() => onTriggerCombatAction('e')}
            data-testid="combat-btn-ult-e"
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-[#A855F7] to-[#7E22CE] text-white border-3 border-[#1A130D] border-b-6 shadow-xl flex flex-col items-center justify-center"
          >
            <span className="absolute top-0.5 left-1 text-[9px] font-black text-[#FDE047]">
              E
            </span>
            <Flame className="w-5 h-5 text-[#FDE047]" />
            <span className="text-[9px] font-black">
              {hud.ultECooldown > 0
                ? `${hud.ultECooldown.toFixed(1)}s`
                : 'ULTI'}
            </span>
          </button>

          {/* [Space] Dodge Hop */}
          <button
            type="button"
            onClick={() => onTriggerCombatAction('jump')}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#1A130D] border-b-6 shadow-xl flex flex-col items-center justify-center"
          >
            <span className="absolute top-0.5 left-1 text-[9px] font-black">
              SPC
            </span>
            <img
              src="/assets/game/icons/hud_action_hop.png"
              alt="Dodge Hop"
              className="w-6 h-6 object-contain"
            />
            <span className="text-[9px] font-black">DODGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
