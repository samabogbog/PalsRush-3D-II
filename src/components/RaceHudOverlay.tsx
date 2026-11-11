import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Play,
  Users,
  FolderGit2,
  Box,
  Sparkles,
  Maximize2,
  Minimize2,
  Smartphone,
  Eye,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Trees,
  Swords,
  Shield,
  Trophy,
  UserCheck,
  Flame,
  Home,
  X,
} from 'lucide-react';
import {
  ACTIVE_SKILL_LIST,
  ACTIVE_SKILLS,
  ActiveSkillId,
  CHARACTERS,
  CharacterId,
  CharacterSpec,
  ITEMS,
  PASSIVE_SKILL_LIST,
  PASSIVE_SKILLS,
  PassiveSkillId,
} from '../models/characterTypes';
import { TRACK_CATALOG, TRACK_SEGMENTS, TrackId, setActiveTrack } from '../game/raceEngine';
import { RaceHudSnapshot } from './RaceGameCanvas';
import {
  ActionButtonEmblem,
  ActiveSkillEmblem,
  ArcadeRankShield,
  CharacterAvatarEmblem,
  GAME_BANNER_ASSETS,
  MenuIconEmblem,
  PassiveSkillEmblem,
  PendingBannerSlot,
  PrankItemEmblem,
  VisualImageCard,
} from './GameAssetIcons';
import { LobbyCharacterPreview } from './LobbyCharacterPreview';
import { UserProfileData } from '../models/equipmentTypes';

export interface RaceHudOverlayProps {
  selectedTrackId: TrackId;
  onSelectTrack: (id: TrackId) => void;
  selectedCharacter: CharacterSpec;
  selectedActiveSkillId: ActiveSkillId;
  selectedPassiveSkillId: PassiveSkillId;
  userProfile?: UserProfileData | null;
  hud: RaceHudSnapshot;
  isLobbyOpen: boolean;
  onSelectCharacter: (id: CharacterId) => void;
  onSelectActiveSkill: (id: ActiveSkillId) => void;
  onSelectPassiveSkill: (id: PassiveSkillId) => void;
  onStartRace: () => void;
  onRestartRace: () => void;
  onOpenLobby: () => void;
  onCloseLobby?: () => void;
  onGoHome?: () => void;
  onOpenGitHub: () => void;
  onSwitchToStudio: () => void;
  onOpenArmoryModal?: (tab: 'auth' | 'armory' | 'leaderboard') => void;
  onLaunchCombatMode?: (subMode: 'dungeon' | 'pvp') => void;
  onTriggerAction: (type: 'q' | 'e' | 'f' | 'jump') => void;
  onJoystickChange?: (x: number, y: number) => void;
  spectatedRacerId?: CharacterId | null;
  onSelectSpectatedRacer?: (id: CharacterId | null) => void;
}

// Compute 2D Minimap projection & SVG path geometry for the active circuit
function computeMinimapGeometry(trackId: TrackId) {
  setActiveTrack(trackId);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const seg of TRACK_SEGMENTS) {
    if (seg.x0 < minX) minX = seg.x0;
    if (seg.x0 > maxX) maxX = seg.x0;
    if (seg.z0 < minZ) minZ = seg.z0;
    if (seg.z0 > maxZ) maxZ = seg.z0;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const maxSpan = Math.max(spanX, spanZ);
  const pad = 11;
  const usable = 100 - pad * 2;
  const offsetX = pad + (usable - (spanX / maxSpan) * usable) * 0.5;
  const offsetY = pad + (usable - (spanZ / maxSpan) * usable) * 0.5;

  const project = (x: number, z: number): { mx: number; my: number } => ({
    mx: offsetX + ((x - minX) / maxSpan) * usable,
    my: offsetY + ((z - minZ) / maxSpan) * usable,
  });

  // Downsample every 2nd segment for ultra-crisp SVG path rendering
  const loopPts: string[] = [];
  const shallowLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const deepLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const bridgeLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  for (let i = 0; i < TRACK_SEGMENTS.length; i++) {
    const seg = TRACK_SEGMENTS[i];
    const p0 = project(seg.x0, seg.z0);
    const p1 = project(seg.x1, seg.z1);
    if (i % 2 === 0 || i === TRACK_SEGMENTS.length - 1) {
      loopPts.push(
        `${i === 0 ? 'M' : 'L'}${p0.mx.toFixed(1)},${p0.my.toFixed(1)}`
      );
    }
    if (seg.isDeepWaterHazard) {
      deepLines.push({ x1: p0.mx, y1: p0.my, x2: p1.mx, y2: p1.my });
    } else if (seg.isShallowWater) {
      shallowLines.push({ x1: p0.mx, y1: p0.my, x2: p1.mx, y2: p1.my });
    } else if (seg.isPlankBridge) {
      bridgeLines.push({ x1: p0.mx, y1: p0.my, x2: p1.mx, y2: p1.my });
    }
  }

  const startPos =
    TRACK_SEGMENTS.length > 0
      ? project(TRACK_SEGMENTS[0].x0, TRACK_SEGMENTS[0].z0)
      : { mx: 50, my: 50 };

  return {
    project,
    fullPathD: `${loopPts.join(' ')} Z`,
    shallowLines,
    deepLines,
    bridgeLines,
    startPos,
  };
}

const TrackMinimap: React.FC<{
  trackId: TrackId;
  standings: RaceHudSnapshot['standings'];
  zoneName: string;
}> = ({ trackId, standings, zoneName }) => {
  const geo = useMemo(() => computeMinimapGeometry(trackId), [trackId]);
  const isSnow = trackId === 'snow_glacier';
  const playerEntry = standings.find((r) => r.isPlayer) || standings[0];
  const playerMapPos = playerEntry
    ? geo.project(playerEntry.x, playerEntry.z)
    : geo.startPos;

  // Heading vector in map coordinates (world forward is -sin(yaw), -cos(yaw))
  const headingDeg = playerEntry
    ? (Math.atan2(-Math.sin(playerEntry.yaw), -Math.cos(playerEntry.yaw)) *
        180) /
      Math.PI
    : -90;

  return (
    <div className="pointer-events-auto relative group">
      <div
        aria-label={
          isSnow ? 'Glacier Peak Circuit Minimap' : 'Woodland Circuit Minimap'
        }
        className={`relative w-20 h-20 sm:w-26 sm:h-26 rounded-2xl border-3 border-[#1A130D] border-b-5 shadow-xl overflow-hidden flex items-center justify-center ${
          isSnow ? 'bg-[#0C2238]/95' : 'bg-[#1D2B19]/95'
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible select-none"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={
              isSnow
                ? 'rgba(56, 189, 248, 0.18)'
                : 'rgba(163, 230, 53, 0.12)'
            }
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Track Outer Dark Outline */}
          <path
            d={geo.fullPathD}
            fill="none"
            stroke="#14110D"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main Circuit Road */}
          <path
            d={geo.fullPathD}
            fill="none"
            stroke={isSnow ? '#E0F2FE' : '#C89D6C'}
            strokeWidth="4.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Shallow Water / Slush Highlight */}
          {geo.shallowLines.map((ln, idx) => (
            <line
              key={`sh-${idx}`}
              x1={ln.x1}
              y1={ln.y1}
              x2={ln.x2}
              y2={ln.y2}
              stroke="#22D3EE"
              strokeWidth="5.0"
              strokeLinecap="round"
            />
          ))}

          {/* Deep Water / Arctic Fjord Highlight */}
          {geo.deepLines.map((ln, idx) => (
            <line
              key={`dp-${idx}`}
              x1={ln.x1}
              y1={ln.y1}
              x2={ln.x2}
              y2={ln.y2}
              stroke="#0284C7"
              strokeWidth="5.6"
              strokeLinecap="round"
            />
          ))}

          {/* Plank / Crystal Sky Bridges Highlight */}
          {geo.bridgeLines.map((ln, idx) => (
            <line
              key={`br-${idx}`}
              x1={ln.x1}
              y1={ln.y1}
              x2={ln.x2}
              y2={ln.y2}
              stroke={isSnow ? '#A855F7' : '#F59E0B'}
              strokeWidth="4.4"
            />
          ))}

          {/* Start / Finish Gate Marker */}
          <rect
            x={geo.startPos.mx - 3.5}
            y={geo.startPos.my - 1.8}
            width="7"
            height="3.6"
            rx="1"
            fill="#FFFDF9"
            stroke="#1A130D"
            strokeWidth="1.2"
          />

          {/* AI Rival Dots */}
          {standings
            .filter((r) => !r.isPlayer)
            .map((r) => {
              const pos = geo.project(r.x, r.z);
              return (
                <circle
                  key={r.id}
                  cx={pos.mx}
                  cy={pos.my}
                  r="3.2"
                  fill={r.primaryHex}
                  stroke="#1A130D"
                  strokeWidth="1.3"
                />
              );
            })}

          {/* Highlighted Player Position + Directional Pointer */}
          {playerEntry && (
            <g
              transform={`translate(${playerMapPos.mx.toFixed(1)}, ${playerMapPos.my.toFixed(1)})`}
            >
              {/* Outer Radar Pulse Ring */}
              <circle
                cx="0"
                cy="0"
                r="7.4"
                fill="rgba(253, 224, 71, 0.26)"
                stroke="#FDE047"
                strokeWidth="1.4"
              />
              {/* Directional Heading Arrow */}
              <g transform={`rotate(${headingDeg.toFixed(1)})`}>
                <polygon
                  points="8.2,0 2.2,-3.4 2.2,3.4"
                  fill="#FDE047"
                  stroke="#1A130D"
                  strokeWidth="1"
                />
              </g>
              {/* Player Core Dot */}
              <circle
                cx="0"
                cy="0"
                r="4.4"
                fill="#A3E635"
                stroke="#1A130D"
                strokeWidth="1.7"
              />
              <circle cx="0" cy="0" r="1.6" fill="#FFFDF9" />
            </g>
          )}
        </svg>

        {/* Tiny "MAP" Corner Tag */}
        <span className="pointer-events-none absolute bottom-1 left-1.5 px-1 py-0.1 rounded bg-[#2B2118]/90 text-[#FDE047] text-[8px] font-black tracking-wider uppercase border border-[#1A130D]">
          MAP
        </span>
      </div>

      {/* Hover Tooltip with Live Zone & Map Legend */}
      <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#A3E635] rounded-2xl p-2.5 shadow-2xl text-xs">
        <div className="font-black text-[#A3E635] truncate">{zoneName}</div>
        <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-[#F3E8D6] font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635] border border-[#FDE047]" />
            You (Player)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border border-black" />
            Bridge
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            Shallow Creek
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
            Deep River
          </span>
        </div>
      </div>
    </div>
  );
};

function formatOrdinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function formatRaceTime(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  const whole = Math.floor(rem);
  const tenths = Math.floor((rem - whole) * 10);
  return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${tenths}`;
}

export const RaceHudOverlay: React.FC<RaceHudOverlayProps> = ({
  selectedTrackId,
  onSelectTrack,
  selectedCharacter,
  selectedActiveSkillId,
  selectedPassiveSkillId,
  userProfile,
  hud,
  isLobbyOpen,
  onSelectCharacter,
  onSelectActiveSkill,
  onSelectPassiveSkill,
  onStartRace,
  onRestartRace,
  onOpenLobby,
  onCloseLobby,
  onGoHome,
  onOpenGitHub,
  onSwitchToStudio,
  onOpenArmoryModal,
  onLaunchCombatMode,
  onTriggerAction,
  onJoystickChange,
  spectatedRacerId,
  onSelectSpectatedRacer,
}) => {
  const activeSkill = ACTIVE_SKILLS[selectedActiveSkillId];
  const passiveSkill = PASSIVE_SKILLS[selectedPassiveSkillId];
  const heldItemSpec = hud.heldItem ? ITEMS[hud.heldItem] : null;

  // Post-Race Results Modal Collapse & Live Spectator state
  const [isResultsCollapsed, setIsResultsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (!isLobbyOpen || !onCloseLobby) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseLobby();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLobbyOpen, onCloseLobby]);

  useEffect(() => {
    if (hud.phase !== 'finished') {
      setIsResultsCollapsed(false);
      onSelectSpectatedRacer?.(null);
    }
  }, [hud.phase, onSelectSpectatedRacer]);

  const handleCollapseAndWatchRunners = useCallback(() => {
    setIsResultsCollapsed(true);
    if (!spectatedRacerId) {
      const firstRunning =
        hud.standings.find((r) => !r.finished && !r.isPlayer) ||
        hud.standings.find((r) => !r.isPlayer) ||
        hud.standings[0];
      if (firstRunning) {
        onSelectSpectatedRacer?.(firstRunning.id);
      }
    }
  }, [hud.standings, spectatedRacerId, onSelectSpectatedRacer]);

  const handleCycleSpectatedRacer = useCallback(
    (delta: -1 | 1) => {
      if (hud.standings.length === 0) return;
      // Prefer cycling among racers who are still running; if all finished, cycle all 8 racers
      const runningPool = hud.standings.filter((r) => !r.finished);
      const pool = runningPool.length > 0 ? runningPool : hud.standings;
      const currentIdx = pool.findIndex((r) => r.id === spectatedRacerId);
      const nextIdx =
        currentIdx === -1
          ? 0
          : (currentIdx + delta + pool.length) % pool.length;
      onSelectSpectatedRacer?.(pool[nextIdx].id);
    },
    [hud.standings, spectatedRacerId, onSelectSpectatedRacer]
  );

  const spectatedEntry =
    hud.standings.find((r) => r.id === spectatedRacerId) ||
    hud.standings.find((r) => r.isPlayer) ||
    hud.standings[0];

  // Fullscreen & Landscape Orientation state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [dismissedPortraitBanner, setDismissedPortraitBanner] =
    useState<boolean>(false);

  useEffect(() => {
    const checkViewportAndFullscreen = () => {
      const docAny = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      setIsFullscreen(
        Boolean(document.fullscreenElement || docAny.webkitFullscreenElement)
      );
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsPortraitMobile(h > w && w < 768);
    };

    checkViewportAndFullscreen();
    window.addEventListener('resize', checkViewportAndFullscreen);
    window.addEventListener('orientationchange', checkViewportAndFullscreen);
    document.addEventListener('fullscreenchange', checkViewportAndFullscreen);
    document.addEventListener(
      'webkitfullscreenchange',
      checkViewportAndFullscreen
    );
    return () => {
      window.removeEventListener('resize', checkViewportAndFullscreen);
      window.removeEventListener(
        'orientationchange',
        checkViewportAndFullscreen
      );
      document.removeEventListener(
        'fullscreenchange',
        checkViewportAndFullscreen
      );
      document.removeEventListener(
        'webkitfullscreenchange',
        checkViewportAndFullscreen
      );
    };
  }, []);

  const handleToggleFullscreenLandscape = useCallback(async () => {
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const docAny = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };

    try {
      const currentlyFull = Boolean(
        document.fullscreenElement || docAny.webkitFullscreenElement
      );
      if (!currentlyFull) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }
        // Attempt to lock mobile screen orientation to landscape
        const orientationAny = screen.orientation as unknown as {
          lock?: (mode: string) => Promise<void>;
        };
        if (orientationAny && typeof orientationAny.lock === 'function') {
          await orientationAny.lock('landscape').catch(() => {
            // Orientation lock is optional on desktop/iOS browsers
          });
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (docAny.webkitExitFullscreen) {
          await docAny.webkitExitFullscreen();
        }
        const orientationAny = screen.orientation as unknown as {
          unlock?: () => void;
        };
        if (orientationAny && typeof orientationAny.unlock === 'function') {
          try {
            orientationAny.unlock();
          } catch {
            // ignore
          }
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback toggle state if iframe restricts native fullscreen
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Virtual Analog Thumbstick state for Mobile & Touch controls
  const stickBaseRef = useRef<HTMLDivElement | null>(null);
  const stickPointerIdRef = useRef<number | null>(null);
  const [isStickActive, setIsStickActive] = useState<boolean>(false);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const updateStickFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const base = stickBaseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const maxRadius = Math.max(28, rect.width * 0.34);
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      setKnobOffset({ x: dx, y: dy });
      const normX = Math.max(-1, Math.min(1, dx / maxRadius));
      const normY = Math.max(-1, Math.min(1, -dy / maxRadius));
      onJoystickChange?.(normX, normY);
    },
    [onJoystickChange]
  );

  const handleStickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    stickPointerIdRef.current = e.pointerId;
    setIsStickActive(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    updateStickFromEvent(e.clientX, e.clientY);
  };

  const handleStickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateStickFromEvent(e.clientX, e.clientY);
  };

  const handleStickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    stickPointerIdRef.current = null;
    setIsStickActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onJoystickChange?.(0, 0);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden">
      {/* MOBILE PORTRAIT -> LANDSCAPE ROTATION PROMPT BANNER (Floating overlay, zero layout push) */}
      {isPortraitMobile && !dismissedPortraitBanner && !isLobbyOpen && (
        <div className="pointer-events-auto absolute top-[76px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#2B2118]/95 text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl px-2.5 py-1 shadow-2xl whitespace-nowrap">
          <Smartphone className="w-3.5 h-3.5 text-[#FDE047] rotate-90 shrink-0" />
          <span className="text-[10px] font-black tracking-wide">
            Best in Landscape
          </span>
          <button
            type="button"
            onClick={handleToggleFullscreenLandscape}
            className="px-2 py-0.5 rounded-lg bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] text-[9px] font-black uppercase border border-[#1A130D] shrink-0"
          >
            Fullscreen
          </button>
          <button
            type="button"
            onClick={() => setDismissedPortraitBanner(true)}
            className="text-[10px] font-black text-[#D8C5AC] hover:text-white px-1"
            aria-label="Dismiss rotate notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================== PINNED TOP GAME HUD ROW (NEVER SHIFTS BOTTOM CONTROLS) ==================== */}
      <div className="absolute top-2 inset-x-2 sm:top-3.5 sm:inset-x-4 z-10 flex items-start justify-between gap-2">
        {/* Top-Left: Sculpted Rank Shield + Fixed-Width Tabular Progress Bar + Passive Icon Badge */}
        <div className="relative flex flex-col">
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            {/* Dynamic SVG Rank Shield with Hover Tooltip */}
            <div className="relative group shrink-0">
              <div className="bg-[#2B2118]/95 border-2 sm:border-3 border-[#1A130D] rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 shadow-xl flex items-center gap-2 sm:gap-2.5 pr-2.5 sm:pr-3.5">
                <div className="sm:hidden shrink-0">
                  <ArcadeRankShield rank={hud.playerRank} size={38} />
                </div>
                <div className="hidden sm:block shrink-0">
                  <ArcadeRankShield rank={hud.playerRank} size={52} />
                </div>

                <div className="w-[106px] sm:w-[136px] shrink-0">
                  <div className="flex items-center justify-between gap-1 tabular-nums">
                    <span className="text-xs sm:text-base font-black text-[#FDE047] tracking-wide game-text-shadow tabular-nums">
                      {formatRaceTime(hud.elapsedRaceSec)}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-[#A3E635] tabular-nums">
                      {hud.progressPercent}%
                    </span>
                  </div>

                  {/* Chunky Visual Track Bar */}
                  <div className="mt-1 w-full h-2 sm:h-3 bg-black/50 rounded-full overflow-hidden border border-[#1A130D] p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#84CC16] to-[#FDE047] rounded-full transition-[width] duration-150"
                      style={{ width: `${Math.max(6, hud.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Hover Tooltip for Zone & Telemetry */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 z-30 w-56 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-2.5 shadow-xl text-xs">
                <div className="font-bold text-[#FDE047]">{hud.zoneName}</div>
                <div className="text-[11px] text-[#E5D9C5] mt-0.5 tabular-nums">
                  Altitude: +{hud.elevationMeters}m · Slaps Landed: {hud.slapsLanded}
                </div>
              </div>
            </div>

            {/* Floating Passive Perk Medallion (Fixed Size, Zero Shift) */}
            <div className="relative group shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FFFDF9] border-2 sm:border-3 border-[#2B2118] shadow-lg flex items-center justify-center cursor-help">
                <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={32} />
                <span className="pointer-events-none absolute -bottom-1.5 px-1.5 py-0.2 rounded-full bg-[#2B2118] text-[#38BDF8] text-[8px] font-black tracking-wider uppercase">
                  AUTO
                </span>
              </div>

              {/* Hover Tooltip for Passive Perk */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-30 w-56 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#38BDF8] rounded-2xl p-3 shadow-xl text-xs">
                <div className="font-bold text-[#38BDF8] flex items-center justify-between">
                  <span>{passiveSkill.name}</span>
                  <span className="text-[10px] bg-[#38BDF8]/20 px-1.5 py-0.5 rounded">
                    PASSIVE
                  </span>
                </div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  {passiveSkill.passiveDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Floating Pop-up Event Pills (Absolutely positioned below Rank Shield so they NEVER push layout!) */}
          {hud.events.length > 0 && (
            <div className="pointer-events-none absolute left-0 top-full mt-2 space-y-1 z-20 w-60">
              {hud.events.slice(0, 2).map((ev) => (
                <div
                  key={ev.id}
                  className="text-[10px] sm:text-xs font-bold text-[#2B2118] bg-[#FEF08A]/95 px-2.5 py-0.5 rounded-xl border-2 border-[#2B2118] w-fit shadow-md truncate max-w-full"
                >
                  {ev.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-Right: Compact Single-Row Arcade Buttons + Standings & Minimap */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="pointer-events-auto flex items-center justify-end gap-1 sm:gap-1.5">
            {/* Back to Main Home Screen Button */}
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                data-testid="race-go-home-btn"
                aria-label="Back to Main Home Screen"
                className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#2B2118] active:scale-95 transition-transform flex items-center gap-1 shadow-lg shrink-0"
              >
                <MenuIconEmblem icon="home" size={18} />
                <span className="text-[11px] sm:text-xs font-black">HOME</span>
              </button>
            )}

            {/* Fullscreen + Landscape Orientation Lock Button */}
            <button
              type="button"
              onClick={handleToggleFullscreenLandscape}
              aria-label={
                isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Landscape Mode'
              }
              className={`h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl border-2 border-[#2B2118] active:scale-95 transition-transform flex items-center gap-1 shadow-lg shrink-0 ${
                isFullscreen
                  ? 'bg-[#84CC16] text-[#2B2118]'
                  : 'bg-[#2B2118] hover:bg-[#423326] text-[#FDE047]'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Maximize2 className="w-4 h-4 stroke-[2.5]" />
              )}
              <span className="hidden md:inline text-[11px] font-black uppercase">
                {isFullscreen ? 'EXIT' : 'FULL'}
              </span>
            </button>

            {/* 3D Dungeon Raid & PvP Mode Button */}
            <button
              type="button"
              onClick={() => onLaunchCombatMode?.('dungeon')}
              data-testid="hud-open-dungeon-btn"
              aria-label="3D Dungeon Raid & Brawler PvP"
              className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#EF4444] hover:bg-[#F87171] text-white border-2 border-[#2B2118] active:scale-95 transition-transform flex items-center gap-1 shadow-lg shrink-0"
            >
              <MenuIconEmblem icon="weapon" size={18} />
              <span className="hidden sm:inline text-xs font-black">DUNGEON</span>
            </button>

            {/* 4-Slot Gear Armory & Seasonal Ranks Button */}
            <button
              type="button"
              onClick={() => onOpenArmoryModal?.('armory')}
              data-testid="hud-open-armory-btn"
              aria-label="4-Slot Gear & Seasonal Ranks"
              className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#2B2118] active:scale-95 transition-transform flex items-center gap-1 shadow-lg shrink-0"
            >
              <MenuIconEmblem icon="gear" size={18} />
              <span className="hidden sm:inline text-xs font-black">GEAR</span>
            </button>

            {/* Loadout Locker Button */}
            <button
              type="button"
              onClick={onOpenLobby}
              aria-label="Hero & Skill Locker"
              className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#2B2118] active:scale-95 transition-transform flex items-center gap-1 shadow-lg shrink-0"
            >
              <MenuIconEmblem icon="heroes" size={18} />
              <span className="text-[11px] sm:text-xs font-black">HEROES</span>
            </button>

            {/* 3D Studio Icon Button */}
            <button
              type="button"
              onClick={onSwitchToStudio}
              aria-label="3D Model Studio"
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#2B2118] active:scale-95 transition-transform items-center justify-center shadow-lg shrink-0"
            >
              <Box className="w-4 h-4 text-[#6580B2] stroke-[2.5]" />
            </button>

            {/* Git Agent Hub Icon Button */}
            <button
              type="button"
              onClick={onOpenGitHub}
              aria-label="Git Agent Hub"
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#2B2118] active:scale-95 transition-transform items-center justify-center shadow-lg shrink-0"
            >
              <FolderGit2 className="w-4 h-4 text-[#C86D3B] stroke-[2.5]" />
            </button>

            {/* Restart Icon Button */}
            <button
              type="button"
              onClick={onRestartRace}
              aria-label="Restart Race"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] border-2 border-[#1A130D] active:scale-95 transition-transform flex items-center justify-center shadow-lg shrink-0"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Compact Arcade Top-3 Standings Pill Board + Live Track Minimap */}
          <div className="flex items-start gap-1.5">
            <div className="bg-[#2B2118]/90 text-[#FFFDF9] border-2 border-[#1A130D] rounded-2xl px-2 py-1 shadow-lg w-36 sm:w-44 space-y-0.5 tabular-nums">
              {hud.standings.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                    r.isPlayer
                      ? 'bg-[#F59E0B] text-[#2B2118]'
                      : 'text-[#F3E8D6]'
                  }`}
                >
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-black tabular-nums">{r.rank}.</span>
                    <CharacterAvatarEmblem
                      characterId={r.id}
                      primaryHex={r.primaryHex}
                      size={18}
                    />
                    <span className="truncate">{r.shortName}</span>
                  </div>
                  <span className="text-[10px] opacity-90 tabular-nums shrink-0">
                    {r.finished ? 'WIN' : `${r.progressPercent}%`}
                  </span>
                </div>
              ))}
            </div>

            {/* Compact Real-Time Track Minimap */}
            <TrackMinimap
              trackId={selectedTrackId}
              standings={hud.standings}
              zoneName={hud.zoneName}
            />
          </div>
        </div>
      </div>

      {/* ==================== PINNED CENTER COUNTDOWN OR CALLOUT POPUP (ZERO LAYOUT IMPACT) ==================== */}
      <div className="pointer-events-none absolute inset-x-4 top-1/3 -translate-y-1/2 z-10 flex flex-col items-center justify-center">
        {hud.phase === 'countdown' && !isLobbyOpen && (
          <div className="bg-[#2B2118] text-[#FFFDF9] px-7 py-3 sm:px-10 sm:py-5 rounded-3xl shadow-2xl border-4 border-[#F59E0B] text-center">
            <p className="text-xs sm:text-sm font-black text-[#FDE047] tracking-wider uppercase">
              GET READY!
            </p>
            <div className="text-4xl sm:text-6xl font-black tracking-tight mt-0.5 text-[#FFFDF9] game-text-shadow tabular-nums">
              {Math.ceil(hud.countdownSec)}
            </div>
          </div>
        )}

        {hud.bannerCallout && hud.phase === 'racing' && !isLobbyOpen && (
          <div
            className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-2xl bg-[#2B2118]/95 font-black text-sm sm:text-lg tracking-wide shadow-2xl border-2 border-[#FFFDF9]/30 text-center"
            style={{ color: hud.bannerCallout.colorHex }}
          >
            {hud.bannerCallout.text}
          </div>
        )}
      </div>

      {/* ==================== PINNED BOTTOM GAMEPAD BAR (LOCKED GEOMETRY, ZERO CLS) ==================== */}
      <div className="absolute bottom-2 inset-x-2 sm:bottom-3.5 sm:inset-x-4 z-10 flex items-end justify-between gap-2">
        {/* BOTTOM-LEFT: Fixed-Size Virtual Analog Thumbstick */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 pl-0.5 sm:pl-1 shrink-0">
          <div
            ref={stickBaseRef}
            onPointerDown={handleStickPointerDown}
            onPointerMove={handleStickPointerMove}
            onPointerUp={handleStickPointerUp}
            onPointerCancel={handleStickPointerUp}
            aria-label="Virtual Analog Steering Thumbstick"
            className={`relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-full bg-[#2B2118]/85 border-3 shadow-2xl touch-none flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
              isStickActive ? 'border-[#FDE047]' : 'border-[#FFFDF9]/50'
            }`}
          >
            <span className="pointer-events-none absolute top-1.5 text-[9px] font-black text-[#FDE047]/90">
              ▲
            </span>
            <span className="pointer-events-none absolute bottom-1.5 text-[9px] font-black text-[#FDE047]/90">
              ▼
            </span>
            <span className="pointer-events-none absolute left-2 text-[9px] font-black text-[#FDE047]/90">
              ◀
            </span>
            <span className="pointer-events-none absolute right-2 text-[9px] font-black text-[#FDE047]/90">
              ▶
            </span>

            <div className="pointer-events-none w-14 h-14 sm:w-18 sm:h-18 rounded-full border-2 border-dashed border-[#FFFDF9]/25" />

            {/* Draggable Thumb Knob (Compositor-only transform) */}
            <div
              className="pointer-events-none w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-2 border-[#2B2118] shadow-xl flex items-center justify-center will-change-transform"
              style={{
                transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              }}
            >
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#FFFDF9]/85 border border-[#2B2118]/40" />
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-[#2B2118]/90 text-[#FDE047] border border-[#1A130D] text-[8px] sm:text-[9px] font-black tracking-wide uppercase shadow whitespace-nowrap">
            JOYSTICK / WASD
          </span>
        </div>

        {/* CENTER-BOTTOM HINT PILL (Desktop only) */}
        <div className="hidden xl:flex flex-col items-center pb-1">
          <div className="px-3.5 py-1 rounded-full bg-[#2B2118]/80 text-[#FFFDF9] border border-[#1A130D] text-[11px] font-bold shadow-md whitespace-nowrap">
            Swipe Screen to Rotate Camera · Click 3D Track for 360° Mouse Look (ESC to unlock)
          </div>
        </div>

        {/* BOTTOM-RIGHT: LOCKED-GEOMETRY ACTION CLUSTER (Zero Layout Shift during Cooldown or Item Pickup) */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5 pr-0.5 sm:pr-1 shrink-0">
          {/* UPPER ARC ROW: [Q] ACTIVE SKILL + [E] PRANK ITEM */}
          <div className="flex items-center gap-2.5 sm:gap-3 mr-2 sm:mr-3">
            {/* SLOT 1: [Q] ACTIVE SKILL BUTTON (Fixed 60x60 / 68x68 box) */}
            <div className="relative group w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] shrink-0">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('q');
                }}
                disabled={hud.qCooldown > 0}
                aria-label={`Active Skill ${activeSkill.name}`}
                className={`relative w-full h-full rounded-2xl sm:rounded-3xl border-3 touch-none transition-transform duration-75 active:scale-95 will-change-transform flex flex-col items-center justify-center shadow-2xl ${
                  hud.qCooldown <= 0
                    ? 'bg-[#FFFDF9] border-[#2B2118] hover:bg-[#FEF3C7]'
                    : 'bg-[#3D3024] border-[#1A130D]'
                }`}
              >
                <span className="pointer-events-none absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-lg bg-[#2B2118] text-[#FDE047] border border-[#FFFDF9] text-[9px] sm:text-[10px] font-black shadow-xs">
                  Q
                </span>

                <ActiveSkillEmblem skillId={selectedActiveSkillId} size={38} />

                {hud.qCooldown > 0 && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl bg-black/70 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-black text-[#FDE047] game-text-shadow tabular-nums">
                      {hud.qCooldown.toFixed(1)}s
                    </span>
                  </div>
                )}

                <span
                  className={`pointer-events-none absolute -bottom-2 px-2 py-0.2 rounded-full border border-[#2B2118] text-[8px] font-black uppercase whitespace-nowrap ${
                    hud.qCooldown > 0
                      ? 'bg-[#2B2118] text-[#FDE047]'
                      : 'bg-[#84CC16] text-[#2B2118]'
                  }`}
                >
                  SKILL
                </span>
              </button>

              {/* Hover Tooltip for [Q] Skill */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="flex items-center justify-between font-black text-[#FDE047]">
                  <span>[Q] {activeSkill.name}</span>
                  <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded tabular-nums">
                    CD {activeSkill.cooldownSec}s
                  </span>
                </div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  {activeSkill.activeDescription}
                </p>
              </div>
            </div>

            {/* SLOT 2: [E] PRANK ITEM BUTTON (Fixed 58x58 / 68x68 box, no animate-pulse layout jitter) */}
            <div className="relative group w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] shrink-0">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('e');
                }}
                disabled={!heldItemSpec}
                aria-label={
                  heldItemSpec ? `Use ${heldItemSpec.name}` : 'Empty Item Slot'
                }
                className={`relative w-full h-full rounded-2xl sm:rounded-3xl border-3 touch-none transition-transform duration-75 active:scale-95 will-change-transform flex flex-col items-center justify-center shadow-2xl ${
                  heldItemSpec
                    ? 'bg-[#FEF08A] border-[#2B2118] hover:bg-[#FDE047]'
                    : 'bg-[#2B2118]/90 border-[#1A130D]'
                }`}
              >
                <span className="pointer-events-none absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-lg bg-[#2B2118] text-[#FFFDF9] border border-[#FFFDF9] text-[9px] sm:text-[10px] font-black shadow-xs">
                  E
                </span>

                <PrankItemEmblem itemId={hud.heldItem} size={38} />

                <span
                  className={`pointer-events-none absolute -bottom-2 px-2 py-0.2 rounded-full border border-[#2B2118] text-[8px] font-black uppercase whitespace-nowrap ${
                    heldItemSpec
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-[#3D3024] text-[#D8C5AC]'
                  }`}
                >
                  {heldItemSpec ? 'USE!' : 'ITEM'}
                </span>
              </button>

              {/* Hover Tooltip for [E] Item Slot */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#F59E0B] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="font-black text-[#FDE047]">
                  [E] {heldItemSpec ? heldItemSpec.name : 'Mystery Item Slot'}
                </div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  {heldItemSpec
                    ? heldItemSpec.description
                    : 'Run through a spinning gold box on the track to grab a prank item!'}
                </p>
              </div>
            </div>
          </div>

          {/* LOWER ARC ROW: [F] SIDEWAYS SLAP + PRIMARY GIANT [SPC] HOP BUTTON */}
          <div className="flex items-end gap-2.5 sm:gap-3">
            {/* SLOT 3: [F] SIDEWAYS SLAP BUTTON (Fixed 56x56 / 64x64 box) */}
            <div className="relative group w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] shrink-0">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('f');
                }}
                disabled={hud.fCooldown > 0}
                aria-label="Sideways Slap"
                className={`relative w-full h-full rounded-2xl sm:rounded-3xl border-3 touch-none transition-transform duration-75 active:scale-95 will-change-transform flex flex-col items-center justify-center shadow-2xl ${
                  hud.fCooldown <= 0
                    ? 'bg-[#C86D3B] hover:bg-[#D97706] border-[#2B2118]'
                    : 'bg-[#3D3024] border-[#1A130D]'
                }`}
              >
                <span className="pointer-events-none absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-lg bg-[#2B2118] text-[#FDE047] border border-[#FFFDF9] text-[9px] sm:text-[10px] font-black shadow-xs">
                  F
                </span>

                <ActionButtonEmblem action="slap" size={34} />

                {hud.fCooldown > 0 && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl bg-black/70 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-black text-[#FDE047] game-text-shadow tabular-nums">
                      {hud.fCooldown.toFixed(1)}s
                    </span>
                  </div>
                )}

                <span className="pointer-events-none absolute -bottom-2 px-2 py-0.2 rounded-full bg-[#FFFDF9] text-[#2B2118] border border-[#2B2118] text-[8px] font-black uppercase whitespace-nowrap">
                  SLAP
                </span>
              </button>

              {/* Hover Tooltip for [F] Slap */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-48 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#C86D3B] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="font-black text-[#FDE047]">[F] Sideways Slap</div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  Smack nearby rivals sideways off wooden bridges or into deep water!
                </p>
              </div>
            </div>

            {/* SLOT 4: PRIMARY [SPACE] HOP / JUMP ANCHOR BUTTON (Fixed 64x64 / 74x74 circle) */}
            <div className="relative group w-[64px] h-[64px] sm:w-[74px] sm:h-[74px] shrink-0">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('jump');
                }}
                aria-label="Hop Jump"
                className="relative w-full h-full rounded-full border-3 border-[#2B2118] bg-[#84CC16] hover:bg-[#A3E635] active:scale-95 touch-none transition-transform duration-75 will-change-transform flex flex-col items-center justify-center shadow-2xl"
              >
                <span className="pointer-events-none absolute -top-1.5 -left-1 px-1.5 py-0.2 rounded-lg bg-[#2B2118] text-[#A3E635] border border-[#FFFDF9] text-[8px] sm:text-[9px] font-black shadow-xs">
                  SPC
                </span>

                <ActionButtonEmblem action="hop" size={40} />

                <span className="pointer-events-none absolute -bottom-2 px-2 py-0.2 rounded-full bg-[#FFFDF9] text-[#2B2118] border border-[#2B2118] text-[8px] sm:text-[9px] font-black uppercase whitespace-nowrap">
                  HOP
                </span>
              </button>

              {/* Hover Tooltip for [Space] Hop */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-48 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#84CC16] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="font-black text-[#A3E635]">[Space] Hop Jump</div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  Hop across deep river stepping stones, spinning logs &amp; slime!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PRE-RACE LOCKER MODAL (SINGLE SCREEN, ZERO SCROLL ON MOBILE & DESKTOP) ==================== */}
      {isLobbyOpen && (
        <div
          onClick={() => onCloseLobby?.()}
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose Racer, 1 Active Skill and 1 Passive Skill"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border-3 sm:border-4 border-[#2B2118] rounded-3xl sm:rounded-4xl max-w-5xl w-full h-[min(680px,95dvh)] p-2.5 sm:p-4 shadow-2xl overflow-hidden flex flex-col justify-between gap-2 sm:gap-3"
          >
            {/* Top Navigation & Close Bar for Locker Modal */}
            <div className="flex items-center justify-between gap-2 pb-1.5 sm:pb-2.5 border-b-2 border-[#EDE3D2] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MenuIconEmblem icon="heroes" size={22} />
                <span className="text-xs sm:text-base font-black text-[#2B2118] truncate">
                  PARTY RACE SETUP — MAP, PAL &amp; SKILLS
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onGoHome && (
                  <button
                    type="button"
                    onClick={onGoHome}
                    data-testid="locker-go-home-btn"
                    className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#2B2118] text-[11px] sm:text-xs font-black flex items-center gap-1 shadow whitespace-nowrap"
                  >
                    <MenuIconEmblem icon="home" size={16} />
                    <span>HOME</span>
                  </button>
                )}
                {onCloseLobby && (
                  <button
                    type="button"
                    onClick={onCloseLobby}
                    data-testid="close-locker-modal-btn"
                    aria-label="Close Hero Locker Modal"
                    className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#2B2118] text-[11px] sm:text-xs font-black flex items-center gap-1 shadow whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.8]" />
                    <span>CLOSE</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Circuit Map Image Cards (Always 2 Columns side-by-side so zero vertical stacking!) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
              {(['woodland', 'snow_glacier'] as const).map((tId) => {
                const meta = TRACK_CATALOG[tId];
                const active = selectedTrackId === tId;
                const isSnowMap = tId === 'snow_glacier';
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => onSelectTrack(tId)}
                    data-testid={`select-track-${tId}`}
                    className={`relative h-16 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-3 text-left p-2 sm:p-3 flex flex-col justify-between transition-colors ${
                      active
                        ? 'border-[#F59E0B] ring-2 sm:ring-4 ring-[#F59E0B]/40 shadow-lg'
                        : 'border-[#2B2118] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <VisualImageCard
                      variant={isSnowMap ? 'map_glacier' : 'map_woodland'}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A130D]/95 via-[#1A130D]/35 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black uppercase ${
                          isSnowMap
                            ? 'bg-[#38BDF8] text-[#082F49]'
                            : 'bg-[#A3E635] text-[#1A130D]'
                        }`}
                      >
                        {isSnowMap ? (
                          <Snowflake className="w-2.5 h-2.5" />
                        ) : (
                          <Trees className="w-2.5 h-2.5" />
                        )}
                        {meta.badgeText}
                      </span>

                      {active && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#FDE047] text-[#2B2118] text-[8px] sm:text-[10px] font-black uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <div className="text-xs sm:text-base font-black text-white leading-tight truncate">
                        {meta.name}
                      </div>
                      <div className="hidden sm:block text-[10px] font-bold text-[#E5D9C5] truncate">
                        {meta.lengthLabel} · {meta.features.slice(0, 2).join(' · ')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MAIN LOCKER STAGE: Elastic 3D Preview + 8x2 Character Grid + Side-by-Side Skill Deck */}
            <div className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:grid-rows-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch overflow-hidden">
              {/* Left / Top: Live 3D Character Preview Stage */}
              <div className="lg:col-span-4 min-h-0 flex flex-col">
                <LobbyCharacterPreview
                  character={selectedCharacter}
                  loadout={userProfile?.loadout}
                />
              </div>

              {/* Right / Bottom: 16-Character 8x2 Picker + Active & Passive Skill Deck */}
              <div className="lg:col-span-8 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
                {/* STEP 1: 16 Chibi Characters in an 8x2 Grid on ALL viewports */}
                <div className="bg-[#F8F2E8]/80 border-2 border-[#E5D9C5] rounded-2xl p-2 sm:p-2.5 flex-1 min-h-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] sm:text-xs font-black text-[#2B2118] uppercase tracking-wide">
                      1. Pick Your Pal (16 Heroes)
                    </span>
                    <span className="text-[10px] font-bold text-[#7D6854]">
                      #{selectedCharacter.index + 1} {selectedCharacter.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-1 sm:gap-1.5 flex-1 items-center">
                    {CHARACTERS.map((char) => {
                      const isSelected = char.id === selectedCharacter.id;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => onSelectCharacter(char.id)}
                          className={`w-full py-1 px-0.5 sm:py-1.5 sm:px-1 rounded-xl border-2 transition-colors flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-[#F59E0B] text-[#2B2118] border-[#2B2118] shadow-xs'
                              : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#EFE5D5]'
                          }`}
                        >
                          <CharacterAvatarEmblem
                            characterId={char.id}
                            primaryHex={char.primaryHex}
                            secondaryHex={char.secondaryHex}
                            accentHex={char.accentHex}
                            size={26}
                          />
                          <span className="text-[8px] sm:text-[10px] font-black truncate max-w-full leading-none">
                            {char.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2 & STEP 3 SIDE-BY-SIDE ON BOTH MOBILE & DESKTOP */}
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  {/* STEP 2: 5 Active Skills [Key Q] */}
                  <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-2">
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <span className="text-[10px] sm:text-xs font-black text-[#C86D3B] uppercase truncate">
                        2. Skill [Q]
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#2B2118] text-[#FDE047] text-[9px] sm:text-[10px] font-black truncate">
                        {activeSkill.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {ACTIVE_SKILL_LIST.map((skillId) => {
                        const sk = ACTIVE_SKILLS[skillId];
                        const isSelected = skillId === selectedActiveSkillId;
                        return (
                          <button
                            key={sk.id}
                            type="button"
                            onClick={() => onSelectActiveSkill(sk.id)}
                            title={`${sk.name}: ${sk.activeDescription}`}
                            className={`w-full p-1 rounded-xl border-2 transition-colors flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D]'
                                : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#FEF3C7]'
                            }`}
                          >
                            <ActiveSkillEmblem skillId={sk.id} size={26} />
                            <span className="text-[8px] sm:text-[9px] font-black leading-none truncate w-full text-center">
                              {sk.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: 5 Passive Skills [Auto] */}
                  <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-2">
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <span className="text-[10px] sm:text-xs font-black text-[#6580B2] uppercase truncate">
                        3. Perk [Auto]
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#2B2118] text-[#38BDF8] text-[9px] sm:text-[10px] font-black truncate">
                        {passiveSkill.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {PASSIVE_SKILL_LIST.map((pId) => {
                        const pk = PASSIVE_SKILLS[pId];
                        const isSelected = pId === selectedPassiveSkillId;
                        return (
                          <button
                            key={pk.id}
                            type="button"
                            onClick={() => onSelectPassiveSkill(pk.id)}
                            title={`${pk.name}: ${pk.passiveDescription}`}
                            className={`w-full p-1 rounded-xl border-2 transition-colors flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? 'bg-[#2B2118] text-[#38BDF8] border-[#1A130D]'
                                : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#E0F2FE]'
                            }`}
                          >
                            <PassiveSkillEmblem passiveId={pk.id} size={26} />
                            <span className="text-[8px] sm:text-[9px] font-black leading-none truncate w-full text-center">
                              {pk.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Visual Loadout Strip + Big GO Button */}
            <div className="pt-1.5 sm:pt-2 border-t-2 border-[#EDE3D2] flex items-center justify-between gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-2 bg-[#F8F2E8] px-2.5 py-1 rounded-xl border border-[#D9C8B0]">
                <CharacterAvatarEmblem
                  characterId={selectedCharacter.id}
                  primaryHex={selectedCharacter.primaryHex}
                  secondaryHex={selectedCharacter.secondaryHex}
                  accentHex={selectedCharacter.accentHex}
                  size={24}
                />
                <span className="text-xs font-black text-[#2B2118]">
                  {selectedCharacter.name}
                </span>
                <span className="text-[#C8B69E]">+</span>
                <ActiveSkillEmblem skillId={selectedActiveSkillId} size={24} />
                <span className="text-[#C8B69E]">+</span>
                <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={24} />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onGoHome && (
                  <button
                    type="button"
                    onClick={onGoHome}
                    className="px-3 py-2 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#2B2118] text-xs font-black flex items-center gap-1"
                  >
                    <MenuIconEmblem icon="home" size={16} />
                    <span>HOME</span>
                  </button>
                )}
                {onCloseLobby && (
                  <button
                    type="button"
                    onClick={onCloseLobby}
                    className="px-3 py-2 rounded-xl bg-[#2B2118] hover:bg-[#EF4444] text-white border-2 border-[#1A130D] text-xs font-black flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>CLOSE</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onStartRace}
                  className="flex-1 sm:flex-initial px-5 py-2 sm:px-7 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#2B2118] active:scale-95 transition-transform text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-xl"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START RACE!</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== POST-RACE PODIUM MODAL (SINGLE SCREEN, COLLAPSIBLE) ==================== */}
      {hud.phase === 'finished' && !isLobbyOpen && (
        <>
          {isResultsCollapsed ? (
            <div className="pointer-events-auto fixed inset-x-0 top-14 sm:top-16 z-30 flex justify-center px-2.5">
              <div className="bg-[#2B2118]/95 text-[#FFFDF9] border-2 border-[#F59E0B] rounded-2xl px-3 py-2 shadow-2xl max-w-2xl w-full flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCycleSpectatedRacer(-1)}
                      aria-label="Watch Previous Racer"
                      className="w-8 h-8 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border border-[#1A130D] flex items-center justify-center shadow"
                    >
                      <ChevronLeft className="w-4 h-4 stroke-[2.8]" />
                    </button>

                    <div className="flex items-center gap-1.5 bg-[#1A130D]/80 px-2.5 py-1 rounded-xl border border-[#FFFDF9]/20">
                      <Eye className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                      {spectatedEntry && (
                        <>
                          <CharacterAvatarEmblem
                            characterId={spectatedEntry.id}
                            primaryHex={spectatedEntry.primaryHex}
                            size={20}
                          />
                          <span className="text-xs font-black text-[#FDE047] tabular-nums">
                            #{spectatedEntry.rank} {spectatedEntry.shortName}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCycleSpectatedRacer(1)}
                      aria-label="Watch Next Racer"
                      className="w-8 h-8 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border border-[#1A130D] flex items-center justify-center shadow"
                    >
                      <ChevronRight className="w-4 h-4 stroke-[2.8]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsResultsCollapsed(false)}
                      className="px-2.5 py-1 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border border-[#1A130D] text-xs font-black flex items-center gap-1 shadow"
                    >
                      <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>RESULTS ({formatOrdinal(hud.playerRank)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRestartRace}
                      className="px-2.5 py-1 rounded-xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border border-[#1A130D] text-xs font-black shadow"
                    >
                      PLAY AGAIN!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-2.5 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Race Results"
            >
              <div className="relative bg-[#FFFDF9] border-3 border-[#2B2118] rounded-3xl max-w-md w-full max-h-[94dvh] p-3.5 sm:p-5 shadow-2xl text-center overflow-hidden flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-left">
                    <PendingBannerSlot
                      src={GAME_BANNER_ASSETS.victoryTrophyEmblem}
                      alt="Champion Trophy Emblem"
                      fileName="victory_trophy_emblem.png"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#2B2118] shadow shrink-0"
                    />
                    <div>
                      <h2 className="text-lg sm:text-2xl font-black text-[#2B2118] leading-tight">
                        {hud.playerRank === 1
                          ? 'CHAMPION!'
                          : `${formatOrdinal(hud.playerRank)} PLACE!`}
                      </h2>
                      <p className="text-xs font-bold text-[#6E5A47] tabular-nums">
                        {formatRaceTime(hud.elapsedRaceSec)} · {hud.slapsLanded} Slaps
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCollapseAndWatchRunners}
                      aria-label="Minimize Results and Watch Racers"
                      className="px-2 py-1.5 rounded-xl bg-[#2B2118] text-[#38BDF8] text-[10px] font-black flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>WATCH</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAndWatchRunners}
                      aria-label="Close Podium Modal"
                      className="px-2 py-1.5 rounded-xl bg-[#EF4444] text-white text-[10px] font-black flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* All 8 Racers in a compact 2-column grid so zero scrolling needed */}
                <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-2 text-left grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {hud.standings.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        onSelectSpectatedRacer?.(r.id);
                        setIsResultsCollapsed(true);
                      }}
                      className={`cursor-pointer flex items-center justify-between text-[11px] font-bold px-2 py-1 rounded-xl transition-colors tabular-nums ${
                        r.isPlayer
                          ? 'bg-[#2B2118] text-[#FDE047]'
                          : 'bg-[#FFFDF9] text-[#2B2118] hover:bg-[#EFE5D5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black">{r.rank}.</span>
                        <CharacterAvatarEmblem
                          characterId={r.id}
                          primaryHex={r.primaryHex}
                          size={20}
                        />
                        <span className="truncate">
                          {r.shortName} {r.isPlayer ? '(YOU)' : ''}
                        </span>
                      </div>
                      <span className="text-[10px] shrink-0">
                        {r.finishTimeSec
                          ? formatRaceTime(r.finishTimeSec)
                          : `${r.progressPercent}%`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  {onGoHome && (
                    <button
                      type="button"
                      onClick={onGoHome}
                      className="px-3 py-2 rounded-xl border-2 border-[#2B2118] bg-[#FDE047] hover:bg-[#FACC15] text-xs font-black text-[#2B2118] flex items-center gap-1"
                    >
                      <MenuIconEmblem icon="home" size={16} />
                      <span>HOME</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenLobby}
                    className="px-3 py-2 rounded-xl border-2 border-[#2B2118] bg-[#F8F2E8] hover:bg-[#EFE5D5] text-xs font-black text-[#2B2118]"
                  >
                    HEROES
                  </button>
                  <button
                    type="button"
                    onClick={onRestartRace}
                    className="flex-1 py-2 px-4 rounded-xl border-2 border-[#2B2118] bg-[#84CC16] hover:bg-[#A3E635] text-xs font-black text-[#2B2118]"
                  >
                    PLAY AGAIN!
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

