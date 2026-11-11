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
      className="relative w-full h-full overflow-y-auto bg-gradient-to-b from-[#2B2118] via-[#3A2C20] to-[#1E1610] text-[#FFFDF9] flex flex-col justify-between p-3 sm:p-5 select-none"
      data-testid="home-hub-screen"
    >
      {/* ==================== 1. CLEAN TOP ICON MENU BAR ==================== */}
      <header className="w-full max-w-7xl mx-auto bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Game Logo + Compact Member Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] border-3 border-[#2B2118] flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-[#2B2118]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#2B2118] leading-none">
                PALS RUSH 3D
              </h1>
              <p className="text-[10px] font-extrabold text-[#7D6854] uppercase tracking-wider mt-0.5">
                {userProfile?.rankings.seasonName || 'Season 1: Frost & Fury'}
              </p>
            </div>
          </div>

          {/* Compact Player Profile Pill */}
          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            data-testid="home-open-auth-btn"
            className="px-3 py-1.5 rounded-2xl bg-[#FAF3E8] hover:bg-[#FEF3C7] border-2 border-[#2B2118] flex items-center gap-2.5 transition-all shadow-sm"
          >
            <CharacterAvatarEmblem
              characterId={selectedCharacter.id}
              primaryHex={selectedCharacter.primaryHex}
              size={30}
            />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#2B2118]">
                  Lv.{userProfile?.level ?? 1}{' '}
                  {userProfile?.displayName || 'PalGuest'}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                    userProfile?.isGuest
                      ? 'bg-[#F59E0B] text-[#2B2118]'
                      : 'bg-[#84CC16] text-[#2B2118]'
                  }`}
                >
                  {userProfile?.isGuest ? 'GUEST' : 'MEMBER'}
                </span>
              </div>
              <div className="text-[10px] font-bold text-[#7D6854] tabular-nums">
                🪙 {userProfile?.coins ?? 250} · CP {combatStats.combatPower}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Image-Icon Menu Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenHeroSkillLocker}
            data-testid="home-open-heroes-btn"
            className="h-11 px-3.5 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-5 text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="heroes" size={24} />
            <span>HEROES</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('armory')}
            data-testid="home-open-armory-btn"
            className="h-11 px-3.5 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-3 border-[#2B2118] border-b-5 text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="gear" size={24} />
            <span>GEAR</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('leaderboard')}
            data-testid="home-open-leaderboard-btn"
            className="h-11 px-3.5 rounded-2xl bg-[#FACC15] hover:bg-[#FDE047] text-[#2B2118] border-3 border-[#2B2118] border-b-5 text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="ranks" size={24} />
            <span>RANKS</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            className="h-11 px-3.5 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-3 border-[#2B2118] border-b-5 text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="account" size={24} />
            <span>ACCOUNT</span>
          </button>

          <button
            type="button"
            onClick={onOpenStudio}
            title="3D Character Studio"
            className="h-11 px-3 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-3 border-[#2B2118] border-b-5 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow"
          >
            <MenuIconEmblem icon="studio" size={22} />
            <span className="hidden sm:inline">STUDIO</span>
          </button>

          <button
            type="button"
            onClick={onOpenGitHub}
            title="Git Agent Hub (TASK-003)"
            data-testid="home-open-github-btn"
            className="h-11 px-3 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-3 border-[#2B2118] border-b-5 text-xs font-black flex items-center gap-1.5 shrink-0 shadow"
          >
            <MenuIconEmblem icon="git" size={22} />
            <span className="hidden md:inline">GIT BUS</span>
          </button>
        </div>
      </header>

      {/* ==================== 2. SPACIOUS MAIN STAGE: 3D HERO + 3 VISUAL MODE CARDS ==================== */}
      <div className="w-full max-w-7xl mx-auto my-auto py-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT (5 Cols): Clean 3D Main Character Stage */}
        <div className="lg:col-span-5 bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-2xl">
          <div className="relative flex-1 flex flex-col min-h-[300px]">
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-2xl bg-[#FFFDF9]/95 hover:bg-[#FDE047] text-[#2B2118] border-3 border-[#1A130D] border-b-5 flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.8]" />
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectCharacterByIndex(selectedCharacter.index + 1)
              }
              aria-label="Next Character"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-2xl bg-[#FFFDF9]/95 hover:bg-[#FDE047] text-[#2B2118] border-3 border-[#1A130D] border-b-5 flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.8]" />
            </button>
          </div>

          {/* Minimal Hero Footer Bar: Active Skill Icons + Change Hero/Gear */}
          <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ActiveSkillEmblem skillId={selectedActiveSkillId} size={34} />
              <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={34} />
              <div className="min-w-0">
                <div className="text-xs font-black text-[#2B2118] truncate">
                  {selectedCharacter.name}
                </div>
                <div className="text-[10px] font-bold text-[#7D6854] truncate">
                  {activeSkill.name} · {passiveSkill.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenHeroSkillLocker}
                className="px-3 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5"
              >
                <MenuIconEmblem icon="heroes" size={18} />
                <span>SWAP PAL</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('armory')}
                className="px-3 py-2 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5"
              >
                <MenuIconEmblem icon="gear" size={18} />
                <span>GEAR</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT (7 Cols): 3 Visual Image Game Mode Cards */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* CARD 1: PARTY RACE (HERO IMAGE CARD) */}
          <div
            onClick={onOpenHeroSkillLocker}
            className="group cursor-pointer relative h-52 sm:h-56 rounded-3xl border-4 border-[#1A130D] border-b-8 overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-5 transition-transform hover:scale-[1.01]"
          >
            <VisualImageCard
              variant="mode_party_race"
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/90 via-[#1A130D]/45 to-transparent" />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#84CC16] text-[#2B2118] text-[10px] font-black uppercase border border-[#1A130D]">
                  FAIR PLAY · EQUAL SPEED
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-black/55 text-[#FDE047] text-[10px] font-black uppercase border border-white/15">
                  {TRACK_CATALOG[selectedTrackId].name}
                </span>
              </div>

              <span
                className="px-2.5 py-1 rounded-xl text-xs font-black border border-[#1A130D]"
                style={{
                  backgroundColor: raceTier.bgHex,
                  color: raceTier.colorHex,
                }}
              >
                {raceTier.tierName.split(' ')[0]} · {raceRp} RP
              </span>
            </div>

            <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight game-text-shadow">
                  PARTY RACE
                </h2>
                <p className="text-xs font-bold text-[#E5D9C5] mt-0.5">
                  8-Player Obstacle Sprint · Pick Map, Pal & Skills
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenHeroSkillLocker();
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#1A130D] border-b-6 text-xs font-black"
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
                  className="px-5 py-2.5 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#1A130D] border-b-6 text-sm font-black flex items-center gap-1.5 shadow-xl"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RACE NOW</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2 & CARD 3 SIDE-BY-SIDE: DUNGEON RAID & BRAWLER PvP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* CARD 2: DUNGEON RAID (IMAGE CARD) */}
            <div
              onClick={() => setPreGameModal('dungeon')}
              className="group cursor-pointer relative min-h-[210px] rounded-3xl border-4 border-[#1A130D] border-b-8 overflow-hidden shadow-2xl flex flex-col justify-between p-4 transition-transform hover:scale-[1.01]"
            >
              <VisualImageCard
                variant="mode_dungeon_raid"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/40 to-black/20" />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#F59E0B] text-[#2B2118] text-[10px] font-black uppercase border border-[#1A130D]">
                  BOSS RUSH · LOOT DROPS
                </span>
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black border border-[#1A130D]"
                  style={{
                    backgroundColor: dungeonTier.bgHex,
                    color: dungeonTier.colorHex,
                  }}
                >
                  {dungeonRp} RP
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-2.5">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white game-text-shadow">
                    DUNGEON RAID
                  </h3>
                  <p className="text-xs font-bold text-[#E5D9C5]">
                    3 Stages · Bosses & Mythic Gear
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreGameModal('dungeon');
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#1A130D] border-b-5 text-xs font-black"
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
                    className="flex-1 py-2 px-3 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#1A130D] border-b-5 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>RAID (ST.{dungeonStage})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 3: BRAWLER PvP (IMAGE CARD) */}
            <div
              onClick={() => setPreGameModal('pvp')}
              className="group cursor-pointer relative min-h-[210px] rounded-3xl border-4 border-[#1A130D] border-b-8 overflow-hidden shadow-2xl flex flex-col justify-between p-4 transition-transform hover:scale-[1.01]"
            >
              <VisualImageCard
                variant="mode_brawler_pvp"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/40 to-black/20" />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EC4899] text-white text-[10px] font-black uppercase border border-[#1A130D]">
                  1V1 ARENA · REAL GEAR STATS
                </span>
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black border border-[#1A130D]"
                  style={{
                    backgroundColor: pvpTier.bgHex,
                    color: pvpTier.colorHex,
                  }}
                >
                  {pvpRp} RP
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-2.5">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white game-text-shadow">
                    BRAWLER PvP
                  </h3>
                  <p className="text-xs font-bold text-[#E5D9C5]">
                    Your Power: CP {combatStats.combatPower} · ATK {combatStats.atk}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreGameModal('pvp');
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#1A130D] border-b-5 text-xs font-black"
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
                    className="flex-1 py-2 px-3 rounded-2xl bg-[#EC4899] hover:bg-[#F472B6] text-white border-3 border-[#1A130D] border-b-5 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>BRAWL NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. MINIMAL FOOTER BAR ==================== */}
      <footer className="w-full max-w-7xl mx-auto bg-[#2B2118]/90 border-2 border-white/15 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[#E5D9C5] font-bold">
          Shared 16 Pals & 4-Slot 3D Gear Across All Modes
        </span>
        <div className="flex items-center gap-3 font-black text-[#FDE047] tabular-nums">
          <span>🏁 Race {raceRp} RP</span>
          <span>·</span>
          <span>🏰 Dungeon {dungeonRp} RP</span>
          <span>·</span>
          <span>⚔️ PvP {pvpRp} RP</span>
        </div>
      </footer>

      {/* ==================== PRE-GAME SETUP MODAL: DUNGEON RAID ==================== */}
      {preGameModal === 'dungeon' && (
        <div
          onClick={() => setPreGameModal(null)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Dungeon Raid Setup"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] text-[#2B2118] border-4 border-[#2B2118] border-b-10 rounded-4xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#EDE3D2]">
              <div className="flex items-center gap-2.5">
                <MenuIconEmblem icon="gear" size={30} />
                <div>
                  <h2 className="text-xl font-black text-[#2B2118]">
                    DUNGEON RAID — SELECT STAGE
                  </h2>
                  <p className="text-xs font-bold text-[#7D6854]">
                    Pick a Boss Stage, Hero & Gear Loadout (CP {combatStats.combatPower})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreGameModal(null)}
                className="h-9 px-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5"
              >
                <X className="w-4 h-4 stroke-[2.8]" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* 3 Visual Dungeon Stage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DUNGEON_STAGE_CARDS.map((card) => {
                const active = dungeonStage === card.stage;
                return (
                  <button
                    key={card.stage}
                    type="button"
                    onClick={() => onSelectDungeonStage(card.stage)}
                    className={`relative h-40 rounded-3xl overflow-hidden border-3 text-left p-3.5 flex flex-col justify-between transition-all ${
                      active
                        ? 'border-[#F59E0B] ring-4 ring-[#F59E0B]/40 scale-[1.02] shadow-xl'
                        : 'border-[#2B2118] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <VisualImageCard
                      variant={card.variant}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/30 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-[#2B2118]/90 text-[#FDE047] text-[10px] font-black">
                        {card.recCp}
                      </span>
                      {active && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#84CC16] text-[#2B2118] text-[10px] font-black">
                          SELECTED
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <div className="text-sm font-black text-white">
                        {card.title}
                      </div>
                      <div className="text-[11px] font-bold text-[#FDE047]">
                        Boss: {card.boss}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Character Picker Strip */}
            <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#2B2118]">
                  SELECT RAIDER ({selectedCharacter.name})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreGameModal(null);
                    onOpenModal('armory');
                  }}
                  className="text-xs font-black text-[#9333EA] hover:underline"
                >
                  Customize 4-Slot Gear →
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onSelectCharacterById(char.id)}
                    className={`p-1.5 rounded-2xl border-2 shrink-0 flex flex-col items-center gap-0.5 ${
                      char.id === selectedCharacter.id
                        ? 'bg-[#F59E0B] border-[#2B2118] scale-105'
                        : 'bg-[#FFFDF9] border-[#E5D9C5]'
                    }`}
                  >
                    <CharacterAvatarEmblem
                      characterId={char.id}
                      primaryHex={char.primaryHex}
                      size={32}
                    />
                    <span className="text-[9px] font-black">{char.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPreGameModal(null)}
                className="px-4 py-2.5 rounded-2xl bg-[#2B2118] text-white text-xs font-black"
              >
                BACK TO HOME
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreGameModal(null);
                  onStartDungeonRaid(dungeonStage);
                }}
                className="px-7 py-3 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-sm font-black flex items-center gap-2 shadow-xl"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ENTER STAGE {dungeonStage}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRE-GAME SETUP MODAL: BRAWLER PvP ==================== */}
      {preGameModal === 'pvp' && (
        <div
          onClick={() => setPreGameModal(null)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Brawler PvP Setup"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] text-[#2B2118] border-4 border-[#2B2118] border-b-10 rounded-4xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#EDE3D2]">
              <div className="flex items-center gap-2.5">
                <MenuIconEmblem icon="weapon" size={30} />
                <div>
                  <h2 className="text-xl font-black text-[#2B2118]">
                    3D BRAWLER PvP — ARENA SETUP
                  </h2>
                  <p className="text-xs font-bold text-[#7D6854]">
                    1v1 Colosseum Duel · Gear Stats Active
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreGameModal(null)}
                className="h-9 px-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5"
              >
                <X className="w-4 h-4 stroke-[2.8]" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Visual Arena Banner */}
            <div className="relative h-40 rounded-3xl overflow-hidden border-3 border-[#2B2118] p-4 flex flex-col justify-between">
              <VisualImageCard
                variant="mode_brawler_pvp"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A130D]/90 via-[#1A130D]/40 to-transparent" />
              <div className="relative z-10">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EC4899] text-white text-[10px] font-black uppercase">
                  RANKED ARENA · {pvpRp} RP
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  COLOSSEUM DUEL
                </h3>
              </div>
              <div className="relative z-10 flex items-center gap-3 text-xs font-black text-[#FDE047]">
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
                      className="p-2.5 rounded-2xl bg-[#FAF3E8] border-2 border-[#E5D9C5] hover:border-[#2B2118] flex items-center gap-2 text-left"
                    >
                      <MenuIconEmblem icon={slot} size={28} />
                      <div className="min-w-0">
                        <div className="text-[9px] font-black text-[#7D6854] uppercase">
                          {SLOT_META[slot].label}
                        </div>
                        <div className="text-xs font-black text-[#2B2118] truncate">
                          {item ? item.name : 'None'}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPreGameModal(null);
                  onOpenModal('armory');
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#A855F7] text-white border-2 border-[#2B2118] border-b-4 text-xs font-black"
              >
                CHANGE GEAR
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreGameModal(null);
                  onStartPvpBrawler();
                }}
                className="px-7 py-3 rounded-2xl bg-[#EC4899] hover:bg-[#F472B6] text-white border-3 border-[#2B2118] border-b-6 text-sm font-black flex items-center gap-2 shadow-xl"
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
