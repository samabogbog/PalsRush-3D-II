import React from 'react';
import {
  Play,
  Flame,
  Swords,
  Shield,
  Trophy,
  UserCheck,
  Users,
  Box,
  Snowflake,
  Trees,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderGit2,
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
  PassiveSkillEmblem,
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
  onSelectTrack,
  onSelectDungeonStage,
  onStartPartyRace,
  onOpenHeroSkillLocker,
  onStartDungeonRaid,
  onStartPvpBrawler,
  onOpenModal,
  onOpenStudio,
  onOpenGitHub,
}) => {
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
      {/* ==================== 1. TOP NAVIGATION & MEMBER BAR ==================== */}
      <header className="w-full max-w-7xl mx-auto bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Game Brand + Member Account Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] border-3 border-[#2B2118] flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-[#2B2118]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#2B2118] leading-none">
                PALS RUSH 3D
              </h1>
              <p className="text-[11px] font-bold text-[#7D6854] mt-0.5">
                Party Race & 3D Dungeon Brawler
              </p>
            </div>
          </div>

          {/* Member Profile Status Button */}
          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            data-testid="home-open-auth-btn"
            className="px-3 py-1.5 rounded-2xl bg-[#FAF3E8] hover:bg-[#FEF3C7] border-2 border-[#2B2118] flex items-center gap-2 transition-all shadow-sm"
          >
            <img
              src={`/assets/game/avatars/avatar_${selectedCharacter.id}.png`}
              alt={selectedCharacter.shortName}
              className="w-7 h-7 rounded-xl border border-[#2B2118] bg-white object-cover"
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
                  {userProfile?.isGuest ? 'Guest · กดผูกบัญชี' : 'Member'}
                </span>
              </div>
              <div className="text-[10px] font-bold text-[#7D6854] tabular-nums">
                🪙 {userProfile?.coins ?? 250} Coins · CP {combatStats.combatPower}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Quick Global Menu Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenHeroSkillLocker}
            data-testid="home-open-heroes-btn"
            className="h-10 px-3.5 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>ตัวละคร & สกิล</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('armory')}
            data-testid="home-open-armory-btn"
            className="h-10 px-3.5 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Shield className="w-4 h-4" />
            <span>คลังอุปกรณ์ 4 ช่อง</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('leaderboard')}
            data-testid="home-open-leaderboard-btn"
            className="h-10 px-3.5 rounded-2xl bg-[#FACC15] hover:bg-[#FDE047] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Trophy className="w-4 h-4" />
            <span>อันดับ 3 โหมด</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            className="h-10 px-3 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <UserCheck className="w-4 h-4 text-[#C86D3B]" />
            <span>ล็อกอิน / สมาชิก</span>
          </button>

          <button
            type="button"
            onClick={onOpenStudio}
            title="3D Character Studio"
            className="h-10 px-3 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Box className="w-4 h-4 text-[#0284C7]" />
            <span className="hidden sm:inline">3D Studio</span>
          </button>

          <button
            type="button"
            onClick={onOpenGitHub}
            title="Git Agent Hub"
            className="w-10 h-10 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] border-b-4 flex items-center justify-center shrink-0"
          >
            <FolderGit2 className="w-4 h-4 text-[#C86D3B]" />
          </button>
        </div>
      </header>

      {/* ==================== 2. MAIN CENTER HUB: 3D HERO STAGE + 3 GAME MODE CARDS ==================== */}
      <div className="w-full max-w-7xl mx-auto my-auto py-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT COLUMN (5 Cols): Main 3D Character Showcase + Quick Pal & Gear Bar */}
        <div className="lg:col-span-5 bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl p-3.5 flex flex-col justify-between gap-3 shadow-2xl">
          {/* 3D Live Character Stage with Prev/Next Switchers */}
          <div className="relative flex-1 flex flex-col">
            <LobbyCharacterPreview
              character={selectedCharacter}
              loadout={playerLoadout}
            />

            {/* Prev / Next Character Floating Buttons */}
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

          {/* Quick 16-Character Scroller Strip */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase text-[#5C4938]">
                เลือกตัวละครหลัก (16 Pals — ใช้ร่วมกันทุกโหมด)
              </span>
              <button
                type="button"
                onClick={onOpenHeroSkillLocker}
                className="text-xs font-black text-[#C86D3B] hover:underline"
              >
                ตั้งค่าสกิล Q / Passive →
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CHARACTERS.map((char) => {
                const active = char.id === selectedCharacter.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onSelectCharacterById(char.id)}
                    className={`p-1.5 rounded-2xl border-2 shrink-0 flex flex-col items-center gap-0.5 transition-all ${
                      active
                        ? 'bg-[#F59E0B] border-[#2B2118] scale-105 shadow'
                        : 'bg-[#FAF3E8] border-[#E5D9C5] hover:bg-[#EFE5D5]'
                    }`}
                  >
                    <CharacterAvatarEmblem
                      characterId={char.id}
                      primaryHex={char.primaryHex}
                      secondaryHex={char.secondaryHex}
                      accentHex={char.accentHex}
                      size={32}
                    />
                    <span className="text-[9px] font-black text-[#2B2118]">
                      {char.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Skill Deck & 4-Slot Equipped Gear Summary */}
          <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenHeroSkillLocker}
                className="flex items-center gap-2 hover:opacity-85"
              >
                <ActiveSkillEmblem skillId={selectedActiveSkillId} size={28} />
                <div className="text-left">
                  <div className="text-[10px] font-black text-[#C86D3B]">
                    [Q] {activeSkill.name}
                  </div>
                  <div className="text-[10px] font-bold text-[#6580B2]">
                    [Auto] {passiveSkill.name}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onOpenModal('armory')}
                className="px-2.5 py-1 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] text-[11px] font-black flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>สลับของ 4 ช่อง (CP {combatStats.combatPower})</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(['weapon', 'headgear', 'cape', 'aura'] as EquipmentSlot[]).map(
                (slot) => {
                  const itemId = playerLoadout[slot];
                  const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onOpenModal('armory')}
                      className="p-1.5 rounded-xl bg-[#FFFDF9] border border-[#D9C8B0] hover:border-[#2B2118] text-left truncate"
                    >
                      <div className="text-[9px] font-black text-[#7D6854]">
                        {SLOT_META[slot].thaiLabel}
                      </div>
                      <div className="text-[10px] font-black text-[#2B2118] truncate">
                        {item ? item.thaiName : '-'}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 Cols): 3 Main Game Mode Launch Cards */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
          {/* MODE 1: PARTY RACE MODE (เล่นสนุก เอาฮา เท่าเทียม 100%) */}
          <div className="bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl p-4 shadow-2xl flex flex-col justify-between gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#84CC16] text-[#2B2118] text-[10px] font-black uppercase border border-[#2B2118]">
                    MODE 1 · เล่นสนุก เอาฮาเอามัน
                  </span>
                  <span className="text-xs font-black text-[#15803D]">
                    ✓ Fair Play 100% (เท่าเทียมทุกคน โชว์สกิน & ออร่า 3D)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2B2118] mt-1">
                  🏁 โหมดวิ่งปาร์ตี้วิบาก (3D Party Race)
                </h2>
                <p className="text-xs font-bold text-[#5C4938]">
                  วิ่งแข่ง 8 ตัวละคร กระโดดข้ามโขดหิน/ภูเขาน้ำแข็ง ใช้สกิล Q และไอเท็มแกล้งเพื่อน!
                </p>
              </div>

              <div className="text-right">
                <div
                  className="px-2.5 py-1 rounded-xl text-xs font-black border border-[#2B2118]"
                  style={{
                    backgroundColor: raceTier.bgHex,
                    color: raceTier.colorHex,
                  }}
                >
                  {raceTier.tierName} · {raceRp} RP
                </div>
              </div>
            </div>

            {/* 2-Map Selector right on the Home Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['woodland', 'snow_glacier'] as const).map((tId) => {
                const meta = TRACK_CATALOG[tId];
                const active = selectedTrackId === tId;
                const isSnow = tId === 'snow_glacier';
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => onSelectTrack(tId)}
                    data-testid={`home-select-track-${tId}`}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                      active
                        ? isSnow
                          ? 'bg-[#0284C7] text-white border-[#1A130D] shadow-md'
                          : 'bg-[#15803D] text-white border-[#1A130D] shadow-md'
                        : 'bg-[#FAF3E8] text-[#2B2118] border-[#E5D9C5] hover:bg-[#EFE5D5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSnow
                            ? 'bg-[#38BDF8] text-[#082F49]'
                            : 'bg-[#A3E635] text-[#1A130D]'
                        }`}
                      >
                        {isSnow ? (
                          <Snowflake className="w-5 h-5" />
                        ) : (
                          <Trees className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">
                          {meta.name}
                        </div>
                        <div className="text-[10px] font-bold opacity-85 truncate">
                          {meta.badgeText} · {meta.lengthLabel}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FDE047] text-[#2B2118] text-[9px] font-black shrink-0">
                        เลือกอยู่
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenHeroSkillLocker}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>ตั้งค่าตัวละคร & สกิลก่อนวิ่ง</span>
              </button>

              <button
                type="button"
                onClick={onStartPartyRace}
                data-testid="home-start-race-btn"
                className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-xl active:translate-y-0.5"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>เริ่มวิ่งแข่งทันที! (START RACE)</span>
              </button>
            </div>
          </div>

          {/* MODE 2 & MODE 3 SIDE-BY-SIDE: DUNGEON RAID & 3D BRAWLER PvP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            {/* MODE 2: 3D DUNGEON RAID (เก็บเวล ฟาร์มของ ล่าบอส) */}
            <div className="bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl p-4 shadow-2xl flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-[#F59E0B] text-[#2B2118] text-[10px] font-black uppercase border border-[#2B2118]">
                    MODE 2 · เก็บเวล & ฟาร์มของ
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                    style={{
                      backgroundColor: dungeonTier.bgHex,
                      color: dungeonTier.colorHex,
                    }}
                  >
                    {dungeonRp} RP
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#2B2118] mt-1.5">
                  🏰 ลุยดันเจี้ยนล่าบอส 3D
                </h3>
                <p className="text-xs font-bold text-[#5C4938] mt-0.5">
                  ตะลุยฝูงมอนสเตอร์ 3 เวฟและปราบบอสใหญ่ท้ายด่านเพื่อดรอปอาวุธ หมวก ผ้าคลุม และออร่าระดับตำนาน!
                </p>

                {/* Stage 1 / 2 / 3 Selector */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {[
                    { st: 1, label: 'ด่าน 1: สไลม์' },
                    { st: 2, label: 'ด่าน 2: กระทะไฟ' },
                    { st: 3, label: 'ด่าน 3: ทุเรียนน้ำแข็ง' },
                  ].map((item) => (
                    <button
                      key={item.st}
                      type="button"
                      onClick={() => onSelectDungeonStage(item.st)}
                      className={`py-1.5 px-2 rounded-xl border-2 text-[10px] font-black transition-all truncate ${
                        dungeonStage === item.st
                          ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D]'
                          : 'bg-[#FAF3E8] text-[#5C4938] border-[#E5D9C5] hover:bg-[#EFE5D5]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartDungeonRaid(dungeonStage)}
                data-testid="home-start-dungeon-btn"
                className="w-full py-2.5 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-sm font-black flex items-center justify-center gap-2 shadow-lg active:translate-y-0.5"
              >
                <Flame className="w-4 h-4" />
                <span>เข้าดันเจี้ยนด่าน {dungeonStage}!</span>
              </button>
            </div>

            {/* MODE 3: 3D BRAWLER PvP ARENA (ประลองยุทธ์อาวุธกวนๆ) */}
            <div className="bg-[#FFFDF9] text-[#2B2118] border-4 border-[#1A130D] border-b-8 rounded-3xl p-4 shadow-2xl flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-[#EC4899] text-white text-[10px] font-black uppercase border border-[#2B2118]">
                    MODE 3 · ประลองของจริง
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                    style={{
                      backgroundColor: pvpTier.bgHex,
                      color: pvpTier.colorHex,
                    }}
                  >
                    {pvpRp} RP
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#2B2118] mt-1.5">
                  ⚔️ สังเวียน 3D Brawler PvP
                </h3>
                <p className="text-xs font-bold text-[#5C4938] mt-0.5">
                  นำอุปกรณ์ที่ฟาร์มมาวัดพลังกันในสังเวียน 3D ฟาดด้วยค้อนเป็ดยาง รองเท้าแตะแม่จ๋า และกระบองหนามทุเรียน!
                </p>

                <div className="mt-2.5 bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2 flex items-center justify-between text-xs font-black">
                  <span className="text-[#5C4938]">พลังรบของคุณ (CP):</span>
                  <span className="text-[#7E22CE] tabular-nums">
                    ⚡ {combatStats.combatPower} (ATK {combatStats.atk} · HP{' '}
                    {combatStats.maxHp})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartPvpBrawler}
                data-testid="home-start-pvp-btn"
                className="w-full py-2.5 rounded-2xl bg-[#EC4899] hover:bg-[#F472B6] text-white border-3 border-[#2B2118] border-b-6 text-sm font-black flex items-center justify-center gap-2 shadow-lg active:translate-y-0.5"
              >
                <Swords className="w-4 h-4" />
                <span>เข้าสังเวียน 3D Brawler PvP!</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. BOTTOM SEASON STATUS BAR ==================== */}
      <footer className="w-full max-w-7xl mx-auto bg-[#2B2118]/90 border-2 border-white/15 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#FDE047] text-[#2B2118] font-black text-[10px]">
            {userProfile?.rankings.seasonName || 'Season 1: Frost & Fury'}
          </span>
          <span className="text-[#E5D9C5] font-bold">
            เล่นโหมดไหนก็ได้แต้ม Rank แยกตามโหมด และรีเซ็ตพร้อมรับเกียรติยศทุกซีซั่น!
          </span>
        </div>
        <div className="flex items-center gap-3 font-black text-[#FDE047] tabular-nums">
          <span>🏁 Race: {raceRp} RP</span>
          <span>·</span>
          <span>🏰 Dungeon: {dungeonRp} RP</span>
          <span>·</span>
          <span>⚔️ PvP: {pvpRp} RP</span>
        </div>
      </footer>
    </div>
  );
};
