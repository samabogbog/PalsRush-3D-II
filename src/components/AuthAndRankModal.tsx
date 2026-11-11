import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Swords,
  Flame,
  Flag,
  RotateCcw,
  Lock,
  Check,
  LogIn,
  UserPlus,
  Trophy,
} from 'lucide-react';
import { CharacterId, CHARACTERS, CharacterSpec } from '../models/characterTypes';
import {
  computeCharacterCombatStats,
  EQUIPMENT_CATALOG,
  EQUIPMENT_LIST,
  EquipmentSlot,
  EquippedLoadout,
  getRankTierByRp,
  RARITY_META,
  SLOT_META,
  UserProfileData,
} from '../models/equipmentTypes';
import { LobbyCharacterPreview } from './LobbyCharacterPreview';
import { MenuIconEmblem } from './GameAssetIcons';

export interface LeaderboardEntry {
  userId: number;
  displayName: string;
  characterId: CharacterId;
  level: number;
  isBot: boolean;
  loadout: EquippedLoadout;
  combatPower: number;
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

export interface SeasonArchiveEntry {
  id: number;
  season_number: number;
  season_name: string;
  mode: string;
  champion_name: string;
  champion_character_id: CharacterId;
  final_rp: number;
  archived_at: string;
}

export interface AuthAndRankModalProps {
  isOpen: boolean;
  initialTab: 'auth' | 'armory' | 'leaderboard';
  userProfile: UserProfileData | null;
  selectedCharacter: CharacterSpec;
  onClose: () => void;
  onGoHome?: () => void;
  onAuthSuccess: (profile: UserProfileData) => void;
  onUpdateLoadout: (nextLoadout: Partial<EquippedLoadout>) => void;
  onUnlockItemWithCoins?: (itemId: string) => void;
  onLaunchCombatMode: (subMode: 'dungeon' | 'pvp') => void;
}

export const AuthAndRankModal: React.FC<AuthAndRankModalProps> = ({
  isOpen,
  initialTab,
  userProfile,
  selectedCharacter,
  onClose,
  onGoHome,
  onAuthSuccess,
  onUpdateLoadout,
  onLaunchCombatMode,
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'armory' | 'leaderboard'>(
    initialTab
  );
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Armory State
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('weapon');

  // Leaderboard State
  const [rankTab, setRankTab] = useState<'race' | 'dungeon' | 'pvp' | 'archives'>(
    'dungeon'
  );
  const [leaderboardData, setLeaderboardData] = useState<{
    season: {
      seasonNumber: number;
      name: string;
      theme: string;
    };
    raceLeaderboard: LeaderboardEntry[];
    dungeonLeaderboard: LeaderboardEntry[];
    pvpLeaderboard: LeaderboardEntry[];
    archives: SeasonArchiveEntry[];
  } | null>(null);
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setAuthMessage(null);
    }
  }, [isOpen, initialTab]);

  const fetchLeaderboards = async () => {
    setIsLoadingRanks(true);
    try {
      const res = await fetch('/api/leaderboards');
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      }
    } catch {
      // ignore fetch error
    } finally {
      setIsLoadingRanks(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'leaderboard') {
      fetchLeaderboards();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentLoadout: EquippedLoadout = userProfile?.loadout || {
    weapon: 'w_squeaky_duck',
    headgear: 'h_propeller_cap',
    cape: 'c_towel_cape',
    aura: 'a_soap_bubbles',
  };
  const combatStats = computeCharacterCombatStats(
    userProfile?.level || 1,
    currentLoadout
  );

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setIsSubmitting(true);
    try {
      const endpoint =
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        authMode === 'register'
          ? {
              username,
              displayName: displayName || username,
              password,
              guestToken: userProfile?.isGuest
                ? userProfile.sessionToken
                : undefined,
            }
          : { username, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthMessage({
          type: 'error',
          text: data.error || 'Authentication failed. Please try again.',
        });
      } else if (data.user) {
        onAuthSuccess(data.user);
        setUsername('');
        setPassword('');
        setDisplayName('');
        setAuthMessage({
          type: 'success',
          text: data.upgradedFromGuest
            ? 'Account bound! All level, gear, and rank progress saved.'
            : authMode === 'register'
              ? 'Account registered to SQLite!'
              : 'Signed in successfully!',
        });
      }
    } catch {
      setAuthMessage({
        type: 'error',
        text: 'Could not connect to server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreshGuest = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.user) {
        onAuthSuccess(data.user);
        setAuthMessage({
          type: 'success',
          text: `Quick Play profile (${data.user.displayName}) created!`,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeasonReset = async () => {
    setIsLoadingRanks(true);
    try {
      const res = await fetch('/api/seasons/reset', { method: 'POST' });
      if (res.ok) {
        await fetchLeaderboards();
        if (userProfile?.sessionToken) {
          const profRes = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${userProfile.sessionToken}` },
          });
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData.user) onAuthSuccess(profData.user);
          }
        }
      }
    } finally {
      setIsLoadingRanks(false);
    }
  };

  const slotItems = EQUIPMENT_LIST.filter((i) => i.slot === selectedSlot);
  const ownedSet = new Set(userProfile?.inventory || []);

  const activeLeaderboardRows =
    rankTab === 'race'
      ? leaderboardData?.raceLeaderboard || []
      : rankTab === 'pvp'
        ? leaderboardData?.pvpLeaderboard || []
        : leaderboardData?.dungeonLeaderboard || [];

  return (
    <div
      onClick={onClose}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Account, 4-Slot Gear and Seasonal Leaderboards"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFDF9] border-4 border-[#2B2118] rounded-[28px] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#2B2118]"
      >
        {/* ==================== HEADER & TOP 3 ICON TABS ==================== */}
        <div className="bg-[#2B2118] text-[#FFFDF9] px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b-4 border-[#1A130D]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              data-testid="modal-tab-auth"
              className={`h-10 px-3.5 rounded-2xl border-2 text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'auth'
                  ? 'bg-[#FDE047] text-[#2B2118] border-[#1A130D]'
                  : 'bg-[#3A2C20] text-[#F3E8D6] border-white/15 hover:bg-[#4E3B2B]'
              }`}
            >
              <MenuIconEmblem icon="account" className="w-5 h-5" />
              <span>ACCOUNT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('armory')}
              data-testid="modal-tab-armory"
              className={`h-10 px-3.5 rounded-2xl border-2 text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'armory'
                  ? 'bg-[#A855F7] text-white border-[#1A130D]'
                  : 'bg-[#3A2C20] text-[#F3E8D6] border-white/15 hover:bg-[#4E3B2B]'
              }`}
            >
              <MenuIconEmblem icon="gear" className="w-5 h-5" />
              <span>4-SLOT GEAR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              data-testid="modal-tab-leaderboard"
              className={`h-10 px-3.5 rounded-2xl border-2 text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'leaderboard'
                  ? 'bg-[#F59E0B] text-[#2B2118] border-[#1A130D]'
                  : 'bg-[#3A2C20] text-[#F3E8D6] border-white/15 hover:bg-[#4E3B2B]'
              }`}
            >
              <MenuIconEmblem icon="ranks" className="w-5 h-5" />
              <span>LEADERBOARDS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                data-testid="modal-go-home-btn"
                className="h-10 px-3.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#1A130D] text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
              >
                <MenuIconEmblem icon="home" className="w-5 h-5" />
                <span>HOME</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchCombatMode('dungeon');
              }}
              data-testid="modal-launch-dungeon-btn"
              className="h-10 px-3.5 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#1A130D] text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              <Flame className="w-4 h-4" />
              <span>DUNGEON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              data-testid="modal-close-btn"
              aria-label="Close Modal"
              className="h-10 px-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#1A130D] text-xs font-black flex items-center gap-1.5 shadow transition-colors whitespace-nowrap shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.8]" />
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        {/* ==================== BODY CONTENT ==================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAF3E8]">
          {/* -------------------- TAB 1: ACCOUNT & SQLITE AUTH -------------------- */}
          {activeTab === 'auth' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left Column: Current Player Profile Card */}
              <div className="lg:col-span-6 bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl p-4 flex flex-col justify-between gap-4 shadow">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        userProfile?.isGuest
                          ? 'bg-[#F59E0B] text-[#2B2118]'
                          : 'bg-[#84CC16] text-[#2B2118]'
                      }`}
                    >
                      {userProfile?.isGuest ? 'GUEST ACCOUNT' : 'MEMBER ACCOUNT'}
                    </span>
                    <span className="text-xs font-black text-[#D97706] tabular-nums">
                      🪙 {userProfile?.coins ?? 250} COINS
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={`/assets/game/avatars/avatar_${selectedCharacter.id}.png`}
                      alt={selectedCharacter.name}
                      className="w-16 h-16 rounded-2xl border-3 border-[#2B2118] bg-[#FAF3E8] object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-[#2B2118]">
                        {userProfile?.displayName || 'PalGuest'}
                      </h3>
                      <p className="text-xs font-bold text-[#7D6854]">
                        @{userProfile?.username || 'guest'} · {selectedCharacter.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-[#2B2118] text-[#FDE047] text-xs font-black tabular-nums">
                          Lv.{userProfile?.level ?? 1}
                        </span>
                        <div className="flex-1 h-3 bg-[#E5D9C5] rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-[#84CC16] rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  ((userProfile?.exp ?? 0) /
                                    Math.max(1, userProfile?.nextLevelExp ?? 120)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#5C4938] tabular-nums">
                          {userProfile?.exp ?? 0}/{userProfile?.nextLevelExp ?? 120} EXP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Season 3-Mode Ranks Summary */}
                  <div className="mt-4">
                    <div className="text-xs font-black text-[#2B2118] mb-2 uppercase">
                      {userProfile?.rankings.seasonName || 'Season 1: Frost & Fury'}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5">
                        <div className="text-[10px] font-black text-[#7D6854]">
                          🏁 PARTY RACE
                        </div>
                        <div className="text-sm font-black text-[#2B2118] tabular-nums mt-0.5">
                          {userProfile?.rankings.raceRp ?? 1000} RP
                        </div>
                        <div className="text-[10px] font-bold text-[#16A34A]">
                          {userProfile?.rankings.raceWins ?? 0} Wins
                        </div>
                      </div>

                      <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5">
                        <div className="text-[10px] font-black text-[#7D6854]">
                          🏰 DUNGEON
                        </div>
                        <div className="text-sm font-black text-[#2B2118] tabular-nums mt-0.5">
                          {userProfile?.rankings.dungeonRp ?? 1000} RP
                        </div>
                        <div className="text-[10px] font-bold text-[#0284C7]">
                          Stage {userProfile?.rankings.highestStage ?? 1}
                        </div>
                      </div>

                      <div className="bg-[#FAF3E8] border-2 border-[#E5D9C5] rounded-2xl p-2.5">
                        <div className="text-[10px] font-black text-[#7D6854]">
                          ⚔️ BRAWLER PvP
                        </div>
                        <div className="text-sm font-black text-[#2B2118] tabular-nums mt-0.5">
                          {userProfile?.rankings.pvpRp ?? 1000} RP
                        </div>
                        <div className="text-[10px] font-bold text-[#7E22CE]">
                          {userProfile?.rankings.pvpWins ?? 0} Wins
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Fair-Play Badge */}
                <div className="bg-[#2B2118] text-[#FFFDF9] rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                  <span className="font-black text-[#FDE047]">
                    RACE: 100% EQUAL SPEED (COSMETIC GEAR)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#84CC16] text-[#2B2118] font-black tabular-nums">
                    COMBAT CP {combatStats.combatPower}
                  </span>
                </div>
              </div>

              {/* Right Column: SQLite Register / Login / Guest Upgrade Form */}
              <div className="lg:col-span-6 bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl p-4 flex flex-col justify-between shadow">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setAuthMessage(null);
                      }}
                      data-testid="auth-switch-register"
                      className={`flex-1 py-2 rounded-2xl border-2 text-xs font-black flex items-center justify-center gap-1.5 ${
                        authMode === 'register'
                          ? 'bg-[#84CC16] text-[#2B2118] border-[#2B2118]'
                          : 'bg-[#FAF3E8] text-[#5C4938] border-[#E5D9C5]'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {userProfile?.isGuest ? 'BIND ACCOUNT' : 'REGISTER'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthMessage(null);
                      }}
                      data-testid="auth-switch-login"
                      className={`flex-1 py-2 rounded-2xl border-2 text-xs font-black flex items-center justify-center gap-1.5 ${
                        authMode === 'login'
                          ? 'bg-[#F59E0B] text-[#2B2118] border-[#2B2118]'
                          : 'bg-[#FAF3E8] text-[#5C4938] border-[#E5D9C5]'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>SIGN IN</span>
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-black text-[#2B2118] mb-1">
                        USERNAME
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. bramble_king"
                        data-testid="auth-input-username"
                        className="w-full px-3.5 py-2 rounded-2xl border-2 border-[#2B2118] bg-[#FAF3E8] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                    </div>

                    {authMode === 'register' && (
                      <div>
                        <label className="block text-xs font-black text-[#2B2118] mb-1">
                          DISPLAY NAME
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. King Bramble"
                          data-testid="auth-input-displayname"
                          className="w-full px-3.5 py-2 rounded-2xl border-2 border-[#2B2118] bg-[#FAF3E8] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-[#2B2118] mb-1">
                        PASSWORD
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        data-testid="auth-input-password"
                        className="w-full px-3.5 py-2 rounded-2xl border-2 border-[#2B2118] bg-[#FAF3E8] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                    </div>

                    {authMessage && (
                      <div
                        className={`p-2.5 rounded-2xl text-xs font-bold border-2 ${
                          authMessage.type === 'success'
                            ? 'bg-[#ECFCCB] text-[#166534] border-[#84CC16]'
                            : 'bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]'
                        }`}
                      >
                        {authMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="auth-submit-btn"
                      className="w-full py-2.5 rounded-2xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] border-3 border-[#1A130D] border-b-6 text-sm font-black shadow transition-all"
                    >
                      {isSubmitting
                        ? 'SAVING...'
                        : authMode === 'register'
                          ? userProfile?.isGuest
                            ? 'BIND GUEST TO ACCOUNT'
                            : 'CREATE ACCOUNT'
                          : 'SIGN IN'}
                    </button>
                  </form>
                </div>

                <div className="pt-3 border-t border-[#E5D9C5] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#7D6854]">
                    Quick Play Guest Session
                  </span>
                  <button
                    type="button"
                    onClick={handleFreshGuest}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF3E8] hover:bg-[#EFE5D5] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black"
                  >
                    NEW GUEST
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- TAB 2: 4-SLOT SHARED GEAR ARMORY -------------------- */}
          {activeTab === 'armory' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left: Live 3D Stage Showing Equipped 4-Slot Gear + Combat Stats */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <LobbyCharacterPreview
                  character={selectedCharacter}
                  loadout={currentLoadout}
                />

                {/* Total Combat Stats Card */}
                <div className="bg-[#2B2118] text-[#FFFDF9] border-3 border-[#1A130D] rounded-3xl p-3.5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#FDE047]">
                      COMBAT STATS (DUNGEON &amp; PvP)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F59E0B] text-[#2B2118] text-xs font-black tabular-nums">
                      CP {combatStats.combatPower}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-[#3A2C20] rounded-xl p-1.5">
                      <div className="text-[9px] text-[#E5D9C5] font-bold">
                        ATK
                      </div>
                      <div className="text-xs font-black text-[#F87171] tabular-nums">
                        {combatStats.atk}
                      </div>
                    </div>
                    <div className="bg-[#3A2C20] rounded-xl p-1.5">
                      <div className="text-[9px] text-[#E5D9C5] font-bold">
                        MAX HP
                      </div>
                      <div className="text-xs font-black text-[#4ADE80] tabular-nums">
                        {combatStats.maxHp}
                      </div>
                    </div>
                    <div className="bg-[#3A2C20] rounded-xl p-1.5">
                      <div className="text-[9px] text-[#E5D9C5] font-bold">
                        DEF
                      </div>
                      <div className="text-xs font-black text-[#38BDF8] tabular-nums">
                        {combatStats.def}
                      </div>
                    </div>
                    <div className="bg-[#3A2C20] rounded-xl p-1.5">
                      <div className="text-[9px] text-[#E5D9C5] font-bold">
                        CRIT
                      </div>
                      <div className="text-xs font-black text-[#FACC15] tabular-nums">
                        {combatStats.critPct}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-[#A3E635]">
                    ✓ PARTY RACE: 3D Cosmetic Visuals Only (100% Equal Speed)
                  </div>
                </div>
              </div>

              {/* Right: 4-Slot Selector & Item Cards */}
              <div className="lg:col-span-7 bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl p-4 flex flex-col justify-between shadow">
                <div>
                  {/* 4 Equipment Slot Tabs with Icon Emblems */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {(
                      ['weapon', 'headgear', 'cape', 'aura'] as EquipmentSlot[]
                    ).map((slot) => {
                      const equippedId = currentLoadout[slot];
                      const equippedSpec = equippedId
                        ? EQUIPMENT_CATALOG[equippedId]
                        : null;
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          data-testid={`armory-slot-${slot}`}
                          className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#2B2118] text-[#FFFDF9] border-[#1A130D] shadow-md'
                              : 'bg-[#FAF3E8] text-[#2B2118] border-[#E5D9C5] hover:bg-[#EFE5D5]'
                          }`}
                        >
                          <MenuIconEmblem
                            icon={slot}
                            className="w-7 h-7 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase text-[#F59E0B] truncate">
                              {SLOT_META[slot].label}
                            </div>
                            <div className="text-xs font-black truncate mt-0.5">
                              {equippedSpec ? equippedSpec.name : 'Empty'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Items List for Selected Slot */}
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {slotItems.map((item) => {
                      const isOwned = ownedSet.has(item.id);
                      const isEquipped = currentLoadout[selectedSlot] === item.id;
                      const rMeta = RARITY_META[item.rarity];
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all"
                          style={{
                            backgroundColor: isEquipped
                              ? rMeta.bgHex
                              : '#FAF3E8',
                            borderColor: isEquipped
                              ? '#2B2118'
                              : rMeta.borderHex,
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-2xl border-2 border-[#2B2118] flex items-center justify-center shrink-0 shadow-inner"
                              style={{ backgroundColor: item.primaryHex }}
                            >
                              <Sparkles className="w-5 h-5 text-white drop-shadow" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md border"
                                  style={{
                                    backgroundColor: rMeta.bgHex,
                                    color: rMeta.colorHex,
                                    borderColor: rMeta.borderHex,
                                  }}
                                >
                                  {rMeta.label}
                                </span>
                                <span className="text-sm font-black text-[#2B2118] truncate">
                                  {item.name}
                                </span>
                              </div>
                              <div className="text-[11px] font-black text-[#5C4938] tabular-nums mt-1">
                                ATK +{item.bonusAtk} · HP +{item.bonusHp} · DEF +
                                {item.bonusDef} · CRIT +{item.bonusCritPct}%
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isEquipped ? (
                              <span className="px-3 py-1.5 rounded-xl bg-[#84CC16] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>EQUIPPED</span>
                              </span>
                            ) : isOwned ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateLoadout({ [selectedSlot]: item.id })
                                }
                                data-testid={`equip-item-${item.id}`}
                                className="px-3.5 py-1.5 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] text-xs font-black shadow"
                              >
                                EQUIP
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateLoadout({ [selectedSlot]: item.id })
                                }
                                data-testid={`preview-equip-item-${item.id}`}
                                title="Try 3D model or farm in Dungeon Stage"
                                className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#2B2118] text-[11px] font-black flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3 text-[#D97706]" />
                                <span>TRY / STAGE {item.dropStageMin}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="mt-3 pt-3 border-t border-[#E5D9C5] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#5C4938]">
                    Shared 3D Loadout across Race, Dungeon &amp; PvP
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchCombatMode('dungeon');
                      }}
                      className="px-3.5 py-2 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black"
                    >
                      DUNGEON RAID
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchCombatMode('pvp');
                      }}
                      className="px-3.5 py-2 rounded-2xl bg-[#EC4899] hover:bg-[#F472B6] text-white border-2 border-[#2B2118] text-xs font-black"
                    >
                      BRAWLER PvP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- TAB 3: SEASONAL LEADERBOARDS & RESET -------------------- */}
          {activeTab === 'leaderboard' && (
            <div className="flex flex-col gap-3">
              {/* Season Banner & Season Reset Trigger */}
              <div className="bg-[#2B2118] text-[#FFFDF9] border-3 border-[#1A130D] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F59E0B] text-[#2B2118] text-[10px] font-black uppercase">
                      ACTIVE SEASON
                    </span>
                    <span className="text-xs font-bold text-[#38BDF8]">
                      3 Mode Ladders · Hall of Fame Archive
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#FDE047] mt-1">
                    {leaderboardData?.season.name ||
                      userProfile?.rankings.seasonName ||
                      'Season 1: Frost & Fury'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleSeasonReset}
                  disabled={isLoadingRanks}
                  data-testid="season-reset-btn"
                  className="px-4 py-2.5 rounded-2xl bg-[#EF4444] hover:bg-[#F87171] text-white border-3 border-[#1A130D] border-b-6 text-xs font-black flex items-center gap-1.5 shadow-lg whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>NEW SEASON RESET</span>
                </button>
              </div>

              {/* 4 Sub-Tabs: Dungeon / PvP / Race / Hall of Fame */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRankTab('dungeon')}
                  data-testid="leaderboard-subtab-dungeon"
                  className={`px-3.5 py-2 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 ${
                    rankTab === 'dungeon'
                      ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D]'
                      : 'bg-[#FFFDF9] text-[#2B2118] border-[#E5D9C5]'
                  }`}
                >
                  <Flame className="w-4 h-4 text-[#F97316]" />
                  <span>DUNGEON RAID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRankTab('pvp')}
                  data-testid="leaderboard-subtab-pvp"
                  className={`px-3.5 py-2 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 ${
                    rankTab === 'pvp'
                      ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D]'
                      : 'bg-[#FFFDF9] text-[#2B2118] border-[#E5D9C5]'
                  }`}
                >
                  <Swords className="w-4 h-4 text-[#EC4899]" />
                  <span>BRAWLER PvP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRankTab('race')}
                  data-testid="leaderboard-subtab-race"
                  className={`px-3.5 py-2 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 ${
                    rankTab === 'race'
                      ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D]'
                      : 'bg-[#FFFDF9] text-[#2B2118] border-[#E5D9C5]'
                  }`}
                >
                  <Flag className="w-4 h-4 text-[#84CC16]" />
                  <span>PARTY RACE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRankTab('archives')}
                  data-testid="leaderboard-subtab-archives"
                  className={`px-3.5 py-2 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 ${
                    rankTab === 'archives'
                      ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D]'
                      : 'bg-[#FFFDF9] text-[#2B2118] border-[#E5D9C5]'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-[#F59E0B]" />
                  <span>HALL OF FAME</span>
                </button>
              </div>

              {/* Leaderboard Table or Archives */}
              {rankTab === 'archives' ? (
                <div className="bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl p-4 shadow">
                  <h4 className="text-sm font-black text-[#2B2118] mb-2">
                    PAST SEASON CHAMPIONS
                  </h4>
                  {!leaderboardData?.archives ||
                  leaderboardData.archives.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-[#7D6854]">
                      No past seasons archived yet. Click &ldquo;NEW SEASON RESET&rdquo; to crown champions and start the next season!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {leaderboardData.archives.map((arc) => (
                        <div
                          key={arc.id}
                          className="p-3 rounded-2xl bg-[#FAF3E8] border-2 border-[#E5D9C5] flex items-center gap-3"
                        >
                          <img
                            src={`/assets/game/avatars/avatar_${arc.champion_character_id}.png`}
                            alt={arc.champion_name}
                            className="w-11 h-11 rounded-2xl border-2 border-[#2B2118] bg-white object-cover"
                          />
                          <div>
                            <div className="text-[10px] font-black uppercase text-[#D97706]">
                              {arc.season_name} · {arc.mode.toUpperCase()}
                            </div>
                            <div className="text-sm font-black text-[#2B2118]">
                              👑 {arc.champion_name}
                            </div>
                            <div className="text-xs font-bold text-[#5C4938] tabular-nums">
                              {arc.final_rp} RP
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl overflow-hidden shadow">
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-[#E5D9C5]">
                    {activeLeaderboardRows.map((row, idx) => {
                      const rp =
                        rankTab === 'race'
                          ? row.raceRp
                          : rankTab === 'pvp'
                            ? row.pvpRp
                            : row.dungeonRp;
                      const tier = getRankTierByRp(rp);
                      const isCurrentUser = row.userId === userProfile?.id;
                      const weaponSpec =
                        EQUIPMENT_CATALOG[row.loadout.weapon || 'w_squeaky_duck'];
                      const auraSpec =
                        EQUIPMENT_CATALOG[row.loadout.aura || 'a_soap_bubbles'];

                      return (
                        <div
                          key={row.userId}
                          className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
                            isCurrentUser ? 'bg-[#FEF3C7]' : 'hover:bg-[#FAF3E8]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 tabular-nums ${
                                idx === 0
                                  ? 'bg-[#FACC15] text-[#2B2118] border-2 border-[#2B2118]'
                                  : idx === 1
                                    ? 'bg-[#E2E8F0] text-[#2B2118] border-2 border-[#2B2118]'
                                    : idx === 2
                                      ? 'bg-[#FDBA74] text-[#2B2118] border-2 border-[#2B2118]'
                                      : 'bg-[#FAF3E8] text-[#5C4938]'
                              }`}
                            >
                              #{idx + 1}
                            </span>

                            <img
                              src={`/assets/game/avatars/avatar_${
                                CHARACTERS.some((c) => c.id === row.characterId)
                                  ? row.characterId
                                  : 'bear'
                              }.png`}
                              alt={row.displayName}
                              className="w-10 h-10 rounded-2xl border-2 border-[#2B2118] bg-[#FAF3E8] object-cover shrink-0"
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-black text-[#2B2118] truncate">
                                  {row.displayName}
                                  {isCurrentUser ? ' (YOU)' : ''}
                                </span>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#2B2118] text-[#FDE047] tabular-nums">
                                  Lv.{row.level}
                                </span>
                                <span
                                  className="text-[10px] font-black px-2 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor: tier.bgHex,
                                    color: tier.colorHex,
                                  }}
                                >
                                  {tier.tierName}
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-[#7D6854] truncate">
                                {weaponSpec?.name || 'Squeaky Duck'} ·{' '}
                                {auraSpec?.name || 'Soap Bubbles'} · CP {row.combatPower}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 tabular-nums">
                            <div className="text-sm font-black text-[#2B2118]">
                              {rp} RP
                            </div>
                            <div className="text-[10px] font-bold text-[#5C4938]">
                              {rankTab === 'race'
                                ? `${row.raceWins}/${row.raceMatches} Wins`
                                : rankTab === 'pvp'
                                  ? `${row.pvpWins}/${row.pvpMatches} Wins`
                                  : `Stage ${row.highestStage} · ${row.bossesDefeated} Bosses`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== COMPACT FOOTER ==================== */}
        <div className="bg-[#F3E8D6] border-t-3 border-[#2B2118] px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#5C4938]">
            Press <strong className="text-[#2B2118]">ESC</strong> or click outside to close
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5"
              >
                <MenuIconEmblem icon="home" className="w-4 h-4" />
                <span>HOME</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              data-testid="modal-footer-close-btn"
              className="px-4 py-1.5 rounded-xl bg-[#2B2118] hover:bg-[#EF4444] text-white border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>CLOSE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
