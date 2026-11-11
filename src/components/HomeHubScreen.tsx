import React, { useState, useEffect } from 'react';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import {
  ACTIVE_SKILLS,
  ActiveSkillId,
  CHARACTERS,
  CharacterId,
  CharacterSpec,
  PASSIVE_SKILLS,
  PassiveSkillId,
} from '../models/characterTypes';
import {
  computeCharacterCombatStats,
  EQUIPMENT_CATALOG,
  EquippedLoadout,
  getRankTierByRp,
  SLOT_META,
  EquipmentSlot,
  UserProfileData,
} from '../models/equipmentTypes';
import { TRACK_CATALOG, TrackId } from '../game/raceEngine';
import { LobbyCharacterPreview } from './LobbyCharacterPreview';
import {
  ActiveSkillEmblem,
  CharacterAvatarEmblem,
  MenuIconEmblem,
  PassiveSkillEmblem,
  VisualImageCard,
} from './GameAssetIcons';

export interface HomeHubScreenProps {
  selectedCharacter: CharacterSpec;
  selectedActiveSkillId: ActiveSkillId;
  selectedPassiveSkillId: PassiveSkillId;
  selectedTrackId: TrackId;
  dungeonStage: number;
  userProfile: UserProfileData | null;
  playerLoadout: EquippedLoadout;
  onSelectCharacterByIndex: (index: number) => void;
  onSelectCharacterById: (id: CharacterId) => void;
  onSelectTrack: (trackId: TrackId) => void;
  onSelectDungeonStage: (stage: number) => void;
  onStartPartyRace: () => void;
  onOpenHeroSkillLocker: () => void;
  onStartDungeonRaid: (stage: number) => void;
  onStartPvpBrawler: () => void;
  onOpenModal: (tab: 'auth' | 'armory' | 'leaderboard') => void;
  onOpenStudio: () => void;
  onOpenGitHub: () => void;
}

const DUNGEON_STAGE_CARDS = [
  {
    stage: 1,
    variant: 'stage_1' as const,
    title: 'Stage 1: Slime Ruins',
    boss: 'King Jelly Slime',
    recCp: 'CP 150+',
  },
  {
    stage: 2,
    variant: 'stage_2' as const,
    title: 'Stage 2: Lava Kitchen',
    boss: 'Magma Wok Golem',
    recCp: 'CP 260+',
  },
  {
    stage: 3,
    variant: 'stage_3' as const,
    title: 'Stage 3: Frost Citadel',
    boss: 'Emperor Frost Durian',
    recCp: 'CP 380+',
  },
];

export const HomeHubScreen: React.FC<HomeHubScreenProps> = ({
  selectedCharacter,
  selectedActiveSkillId,
  selectedPassiveSkillId,
  selectedTrackId,
  dungeonStage,
  userProfile,
  playerLoadout,
  onSelectCharacterByIndex,
  onSelectCharacterById,
  onSelectDungeonStage,
  onStartPartyRace,
  onOpenHeroSkillLocker,
  onStartDungeonRaid,
  onStartPvpBrawler,
  onOpenModal,
  onOpenStudio,
  onOpenGitHub,
}) => {
  const [preGameModal, setPreGameModal] = useState<'dungeon' | 'pvp' | null>(
    null
  );

  useEffect(() => {
    if (!preGameModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreGameModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [preGameModal]);

  const combatStats = computeCharacterCombatStats(
    userProfile?.level ?? 1,
    playerLoadout
  );
  const activeSkill = ACTIVE_SKILLS[selectedActiveSkillId];
  const passiveSkill = PASSIVE_SKILLS[selectedPassiveSkillId];

  const raceRp = userProfile?.rankings.raceRp ?? 1000;
  const dungeonRp = userProfile?.rankings.dungeonRp ?? 1000;
  const pvpRp = userProfile?.rankings.pvpRp ?? 1000;

  const raceTier = getRankTierByRp(raceRp);
  const dungeonTier = getRankTierByRp(dungeonRp);
  const pvpTier = getRankTierByRp(pvpRp);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#2B2118] via-[#3A2C20] to-[#1E1610] text-[#FFFDF9] flex flex-col justify-between gap-2 sm:gap-3 p-2 sm:p-4 select-none"
      data-testid="home-hub-screen"
    >
      {/* ==================== 1. SINGLE-ROW APP BAR ==================== */}
      <header className="w-full max-w-7xl mx-auto shrink-0 bg-[#FFFDF9] text-[#2B2118] border-2 sm:border-4 border-[#1A130D] rounded-2xl sm:rounded-3xl px-2.5 py-1.5 sm:px-4 sm:py-2 shadow-xl flex items-center justify-between gap-2">
        {/* Left: Game Logo + Compact Member Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] border-2 border-[#2B2118] flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-[#2B2118]" />
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-black tracking-tight text-[#2B2118] leading-none whitespace-nowrap">
                PALS RUSH 3D
              </h1>
              <p className="text-[9px] font-extrabold text-[#7D6854] uppercase tracking-wider mt-0.5 whitespace-nowrap">
                {userProfile?.rankings.seasonName || 'Season 1: Frost & Fury'}
              </p>
            </div>
          </div>

          {/* Compact Player Profile Pill */}
          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            data-testid="home-open-auth-btn"
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#FAF3E8] hover:bg-[#FEF3C7] border-2 border-[#2B2118] flex items-center gap-1.5 sm:gap-2 transition-colors shadow-xs shrink-0"
          >
            <CharacterAvatarEmblem
              characterId={selectedCharacter.id}
              primaryHex={selectedCharacter.primaryHex}
              size={26}
            />
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs font-black text-[#2B2118] truncate max-w-[85px] sm:max-w-[120px]">
                  Lv.{userProfile?.level ?? 1}{' '}
                  {userProfile?.displayName || 'PalGuest'}
                </span>
                <span
                  className={`px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase ${
                    userProfile?.isGuest
                      ? 'bg-[#F59E0B] text-[#2B2118]'
                      : 'bg-[#84CC16] text-[#2B2118]'
                  }`}
                >
                  {userProfile?.isGuest ? 'GUEST' : 'MEMBER'}
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#7D6854] tabular-nums whitespace-nowrap">
                🪙 {userProfile?.coins ?? 250} · CP {combatStats.combatPower}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Single-Row App Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={onOpenHeroSkillLocker}
            data-testid="home-open-heroes-btn"
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="heroes" size={18} />
            <span className="hidden xs:inline sm:inline">HEROES</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('armory')}
            data-testid="home-open-armory-btn"
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="gear" size={18} />
            <span className="hidden xs:inline sm:inline">GEAR</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('leaderboard')}
            data-testid="home-open-leaderboard-btn"
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#FACC15] hover:bg-[#FDE047] text-[#2B2118] border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="ranks" size={18} />
            <span className="hidden sm:inline">RANKS</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            data-testid="home-open-account-btn"
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="account" size={18} />
            <span>ACCOUNT</span>
          </button>

          <button
            type="button"
            onClick={onOpenStudio}
            title="3D Character Studio"
            className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="studio" size={18} />
            <span className="hidden md:inline">STUDIO</span>
          </button>

          <button
            type="button"
            onClick={onOpenGitHub}
            title="Git Agent Hub (TASK-003)"
            data-testid="home-open-github-btn"
            className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 shrink-0 shadow"
          >
            <MenuIconEmblem icon="git" size={18} />
            <span className="hidden lg:inline">GIT BUS</span>
          </button>
        </div>
      </header>

      {/* ==================== 2. LOCKED SINGLE-SCREEN STAGE: 3D HERO + 3 VISUAL MODE CARDS ==================== */}
      <div className="w-full max-w-7xl mx-auto flex-1 min-h-0 grid grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-rows-1 lg:grid-cols-12 gap-2 sm:gap-4 items-stretch overflow-hidden">
        {/* LEFT / TOP (5 Cols on Desktop, Top 45% on Mobile): 3D Main Character Stage */}
        <div className="lg:col-span-5 min-h-0 bg-[#FFFDF9] text-[#2B2118] border-2 sm:border-4 border-[#1A130D] rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 flex flex-col justify-between gap-2 shadow-2xl overflow-hidden">
          <div className="relative flex-1 min-h-0 flex flex-col">
            <LobbyCharacterPreview
              character={selectedCharacter}
              loadout={playerLoadout}
            />

            {/* Prev / Next Character Arrows */}
            <button
              type="button"
              onClick={() =>
                onSelectCharacterByIndex(selectedCharacter.index - 1)
              }
              aria-label="Previous Character"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFFDF9]/95 hover:bg-[#FDE047] text-[#2B2118] border-2 border-[#1A130D] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.8]" />
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectCharacterByIndex(selectedCharacter.index + 1)
              }
              aria-label="Next Character"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFFDF9]/95 hover:bg-[#FDE047] text-[#2B2118] border-2 border-[#1A130D] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.8]" />
            </button>
          </div>

          {/* Minimal Hero Footer Bar: Active Skill Icons + Change Hero/Gear */}
          <div className="shrink-0 bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <ActiveSkillEmblem skillId={selectedActiveSkillId} size={28} />
              <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={28} />
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-black text-[#2B2118] truncate">
                  {selectedCharacter.name}
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-[#7D6854] truncate">
                  {activeSkill.name} · {passiveSkill.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenHeroSkillLocker}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] text-[10px] sm:text-xs font-black flex items-center gap-1 whitespace-nowrap"
              >
                <MenuIconEmblem icon="heroes" size={16} />
                <span>SWAP PAL</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('armory')}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] border-2 border-[#1A130D] text-[10px] sm:text-xs font-black flex items-center gap-1 whitespace-nowrap"
              >
                <MenuIconEmblem icon="gear" size={16} />
                <span>GEAR</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT / BOTTOM (7 Cols on Desktop, Bottom 55% on Mobile): 3 Visual Image Game Mode Cards */}
        <div className="lg:col-span-7 min-h-0 flex flex-col justify-between gap-2 sm:gap-3.5 overflow-hidden">
          {/* CARD 1: PARTY RACE (HERO IMAGE CARD) */}
          <div
            onClick={onOpenHeroSkillLocker}
            className="group cursor-pointer relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#1A130D] overflow-hidden shadow-2xl flex flex-col justify-between p-2.5 sm:p-4 transition-transform active:scale-[0.99]"
          >
            <VisualImageCard
              variant="mode_party_race"
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/90 via-[#1A130D]/45 to-transparent" />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-[#84CC16] text-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase border border-[#1A130D] whitespace-nowrap">
                  FAIR PLAY
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/55 text-[#FDE047] text-[9px] sm:text-[10px] font-black uppercase border border-white/15 truncate">
                  {TRACK_CATALOG[selectedTrackId].name}
                </span>
              </div>

              <span
                className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black border border-[#1A130D] tabular-nums whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: raceTier.bgHex,
                  color: raceTier.colorHex,
                }}
              >
                {raceTier.tierName.split(' ')[0]} · {raceRp} RP
              </span>
            </div>

            <div className="relative z-10 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-3xl font-black text-white tracking-tight game-text-shadow leading-none">
                  PARTY RACE
                </h2>
                <p className="text-[10px] sm:text-xs font-bold text-[#E5D9C5] mt-0.5 truncate">
                  8-Player Obstacle Sprint · Pick Map, Pal &amp; Skills
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenHeroSkillLocker();
                  }}
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] text-[10px] sm:text-xs font-black whitespace-nowrap"
                >
                  SETUP
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartPartyRace();
                  }}
                  data-testid="home-start-race-btn"
                  className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#1A130D] text-xs sm:text-sm font-black flex items-center gap-1 shadow-xl whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  <span>RACE NOW</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2 & CARD 3 SIDE-BY-SIDE ON BOTH MOBILE & DESKTOP */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 flex-1 min-h-0">
            {/* CARD 2: DUNGEON RAID (IMAGE CARD) */}
            <div
              onClick={() => setPreGameModal('dungeon')}
              className="group cursor-pointer relative h-full min-h-0 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#1A130D] overflow-hidden shadow-2xl flex flex-col justify-between p-2.5 sm:p-4 transition-transform active:scale-[0.99]"
            >
              <VisualImageCard
                variant="mode_dungeon_raid"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/40 to-black/20" />

              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className="px-1.5 sm:px-2.5 py-0.5 rounded-md bg-[#F59E0B] text-[#2B2118] text-[8px] sm:text-[10px] font-black uppercase border border-[#1A130D] truncate">
                  BOSS LOOT
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black border border-[#1A130D] tabular-nums shrink-0"
                  style={{
                    backgroundColor: dungeonTier.bgHex,
                    color: dungeonTier.colorHex,
                  }}
                >
                  {dungeonRp} RP
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-1.5 sm:gap-2">
                <div>
                  <h3 className="text-sm sm:text-2xl font-black text-white game-text-shadow leading-tight">
                    DUNGEON RAID
                  </h3>
                  <p className="text-[9px] sm:text-xs font-bold text-[#E5D9C5] truncate">
                    3 Stages · Bosses &amp; Gear
                  </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreGameModal('dungeon');
                    }}
                    className="px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] text-[10px] sm:text-xs font-black whitespace-nowrap"
                  >
                    STAGES
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartDungeonRaid(dungeonStage);
                    }}
                    data-testid="home-start-dungeon-btn"
                    className="flex-1 py-1.5 px-2 sm:py-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#1A130D] text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-lg whitespace-nowrap"
                  >
                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                    <span>ST.{dungeonStage}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 3: BRAWLER PvP (IMAGE CARD) */}
            <div
              onClick={() => setPreGameModal('pvp')}
              className="group cursor-pointer relative h-full min-h-0 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#1A130D] overflow-hidden shadow-2xl flex flex-col justify-between p-2.5 sm:p-4 transition-transform active:scale-[0.99]"
            >
              <VisualImageCard
                variant="mode_brawler_pvp"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/40 to-black/20" />

              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className="px-1.5 sm:px-2.5 py-0.5 rounded-md bg-[#EC4899] text-white text-[8px] sm:text-[10px] font-black uppercase border border-[#1A130D] truncate">
                  1V1 ARENA
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black border border-[#1A130D] tabular-nums shrink-0"
                  style={{
                    backgroundColor: pvpTier.bgHex,
                    color: pvpTier.colorHex,
                  }}
                >
                  {pvpRp} RP
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-1.5 sm:gap-2">
                <div>
                  <h3 className="text-sm sm:text-2xl font-black text-white game-text-shadow leading-tight">
                    BRAWLER PvP
                  </h3>
                  <p className="text-[9px] sm:text-xs font-bold text-[#E5D9C5] tabular-nums truncate">
                    CP {combatStats.combatPower} · ATK {combatStats.atk}
                  </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreGameModal('pvp');
                    }}
                    className="px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] text-[10px] sm:text-xs font-black whitespace-nowrap"
                  >
                    SETUP
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartPvpBrawler();
                    }}
                    data-testid="home-start-pvp-btn"
                    className="flex-1 py-1.5 px-2 sm:py-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#EC4899] hover:bg-[#F472B6] text-white border-2 border-[#1A130D] text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-lg whitespace-nowrap"
                  >
                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                    <span>BRAWL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. COMPACT FOOTER STATUS BAR ==================== */}
      <footer className="w-full max-w-7xl mx-auto shrink-0 bg-[#2B2118]/90 border border-white/15 rounded-xl sm:rounded-2xl px-3 py-1 sm:py-1.5 flex items-center justify-between gap-2 text-[10px] sm:text-xs">
        <span className="text-[#E5D9C5] font-bold truncate">
          Shared 16 Pals &amp; 4-Slot 3D Gear Across All Modes
        </span>
        <div className="flex items-center gap-2 font-black text-[#FDE047] tabular-nums whitespace-nowrap shrink-0">
          <span>🏁 {raceRp} RP</span>
          <span>·</span>
          <span>🏰 {dungeonRp} RP</span>
          <span>·</span>
          <span>⚔️ {pvpRp} RP</span>
        </div>
      </footer>

      {/* ==================== PRE-GAME SETUP MODAL: DUNGEON RAID (SINGLE SCREEN, NO SCROLL) ==================== */}
      {preGameModal === 'dungeon' && (
        <div
          onClick={() => setPreGameModal(null)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Dungeon Raid Setup"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] text-[#2B2118] border-3 border-[#2B2118] rounded-3xl max-w-4xl w-full p-3 sm:p-5 shadow-2xl max-h-[94dvh] overflow-hidden flex flex-col justify-between gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#EDE3D2] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MenuIconEmblem icon="gear" size={26} />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-[#2B2118] truncate">
                    DUNGEON RAID — SELECT STAGE
                  </h2>
                  <p className="text-[11px] font-bold text-[#7D6854] truncate">
                    Pick a Boss Stage, Hero &amp; Gear Loadout (CP {combatStats.combatPower})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreGameModal(null)}
                className="h-9 px-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#2B2118] text-xs font-black flex items-center gap-1 shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.8]" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* 3 Visual Dungeon Stage Cards (3 Columns even on mobile so zero vertical scroll!) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {DUNGEON_STAGE_CARDS.map((card) => {
                const active = dungeonStage === card.stage;
                return (
                  <button
                    key={card.stage}
                    type="button"
                    onClick={() => onSelectDungeonStage(card.stage)}
                    className={`relative h-28 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-3 text-left p-2 sm:p-3.5 flex flex-col justify-between transition-colors ${
                      active
                        ? 'border-[#F59E0B] ring-3 ring-[#F59E0B]/40 shadow-xl'
                        : 'border-[#2B2118] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <VisualImageCard
                      variant={card.variant}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/30 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between gap-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-[#2B2118]/90 text-[#FDE047] text-[8px] sm:text-[10px] font-black">
                        {card.recCp}
                      </span>
                      {active && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#84CC16] text-[#2B2118] text-[8px] sm:text-[10px] font-black">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <div className="text-[11px] sm:text-sm font-black text-white leading-tight">
                        {card.title}
                      </div>
                      <div className="text-[9px] sm:text-[11px] font-bold text-[#FDE047] truncate">
                        {card.boss}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick 16-Character Picker Strip (8x2 Grid so zero scrolling needed) */}
            <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-black uppercase text-[#2B2118]">
                  SELECT RAIDER ({selectedCharacter.name})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreGameModal(null);
                    onOpenModal('armory');
                  }}
                  className="text-[11px] sm:text-xs font-black text-[#9333EA] hover:underline"
                >
                  Customize 4-Slot Gear →
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onSelectCharacterById(char.id)}
                    className={`p-1 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-colors ${
                      char.id === selectedCharacter.id
                        ? 'bg-[#F59E0B] border-[#2B2118]'
                        : 'bg-[#FFFDF9] border-[#E5D9C5]'
                    }`}
                  >
                    <CharacterAvatarEmblem
                      characterId={char.id}
                      primaryHex={char.primaryHex}
                      size={26}
                    />
                    <span className="text-[8px] sm:text-[9px] font-black truncate max-w-full">
                      {char.shortName}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreGameModal(null)}
                className="px-3.5 py-2.5 rounded-xl bg-[#2B2118] text-white text-xs font-black"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreGameModal(null);
                  onStartDungeonRaid(dungeonStage);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ENTER STAGE {dungeonStage}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRE-GAME SETUP MODAL: BRAWLER PvP (SINGLE SCREEN, NO SCROLL) ==================== */}
      {preGameModal === 'pvp' && (
        <div
          onClick={() => setPreGameModal(null)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Brawler PvP Setup"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] text-[#2B2118] border-3 border-[#2B2118] rounded-3xl max-w-3xl w-full p-3 sm:p-5 shadow-2xl max-h-[94dvh] overflow-hidden flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#EDE3D2] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MenuIconEmblem icon="weapon" size={26} />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-[#2B2118] truncate">
                    3D BRAWLER PvP — ARENA SETUP
                  </h2>
                  <p className="text-[11px] font-bold text-[#7D6854] truncate">
                    1v1 Colosseum Duel · Gear Stats Active
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreGameModal(null)}
                className="h-9 px-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#2B2118] text-xs font-black flex items-center gap-1 shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.8]" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Visual Arena Banner */}
            <div className="relative h-28 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#2B2118] p-3 sm:p-4 flex flex-col justify-between">
              <VisualImageCard
                variant="mode_brawler_pvp"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/90 via-[#1A130D]/40 to-transparent" />
              <div className="relative z-10">
                <span className="px-2 py-0.5 rounded-md bg-[#EC4899] text-white text-[9px] sm:text-[10px] font-black uppercase">
                  RANKED ARENA · {pvpRp} RP
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                  COLOSSEUM DUEL
                </h3>
              </div>
              <div className="relative z-10 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-black text-[#FDE047] tabular-nums">
                <span>CP {combatStats.combatPower}</span>
                <span>·</span>
                <span>ATK {combatStats.atk}</span>
                <span>·</span>
                <span>HP {combatStats.maxHp}</span>
                <span>·</span>
                <span>CRIT {combatStats.critPct}%</span>
              </div>
            </div>

            {/* 4-Slot Equipped Gear Preview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['weapon', 'headgear', 'cape', 'aura'] as EquipmentSlot[]).map(
                (slot) => {
                  const itemId = playerLoadout[slot];
                  const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setPreGameModal(null);
                        onOpenModal('armory');
                      }}
                      className="p-2 rounded-xl bg-[#FAF3E8] border-2 border-[#E5D9C5] hover:border-[#2B2118] flex items-center gap-2 text-left"
                    >
                      <MenuIconEmblem icon={slot} size={24} />
                      <div className="min-w-0">
                        <div className="text-[8px] sm:text-[9px] font-black text-[#7D6854] uppercase">
                          {SLOT_META[slot].label}
                        </div>
                        <div className="text-[11px] sm:text-xs font-black text-[#2B2118] truncate">
                          {item ? item.name : 'None'}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPreGameModal(null);
                  onOpenModal('armory');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#A855F7] text-white border-2 border-[#2B2118] text-xs font-black"
              >
                CHANGE GEAR
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreGameModal(null);
                  onStartPvpBrawler();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#F472B6] text-white border-2 border-[#2B2118] text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>FIGHT IN ARENA!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
