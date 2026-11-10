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
  PassiveSkillEmblem,
  PendingBannerSlot,
  PrankItemEmblem,
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
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-4 select-none overflow-hidden">
      {/* MOBILE PORTRAIT -> LANDSCAPE ROTATION PROMPT BANNER */}
      {isPortraitMobile && !dismissedPortraitBanner && (
        <div className="pointer-events-auto mx-auto mb-1.5 z-40 flex items-center gap-2.5 bg-[#2B2118]/95 text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl px-3 py-1.5 shadow-2xl max-w-full">
          <Smartphone className="w-4 h-4 text-[#FDE047] rotate-90 shrink-0 animate-pulse" />
          <span className="text-[11px] font-black tracking-wide">
            Best in Landscape!
          </span>
          <button
            type="button"
            onClick={handleToggleFullscreenLandscape}
            className="px-2.5 py-1 rounded-xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] text-[10px] font-black uppercase border border-[#1A130D] shrink-0"
          >
            Fullscreen Landscape
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

      {/* TOP GAME HUD ROW: Icon-First Rank Shield & Track Bar (Left) + Floating Icon Buttons & Mini Leaderboard (Right) */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Sculpted Rank Shield + Compact Progress Bar + Passive Icon Badge */}
        <div className="flex flex-col gap-1.5">
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Dynamic SVG Rank Shield with Hover Tooltip */}
            <div className="relative group">
              <div className="bg-[#2B2118]/95 border-3 border-[#1A130D] border-b-5 rounded-3xl p-1 sm:p-1.5 shadow-xl flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4">
                <div className="sm:hidden">
                  <ArcadeRankShield rank={hud.playerRank} size={44} />
                </div>
                <div className="hidden sm:block">
                  <ArcadeRankShield rank={hud.playerRank} size={56} />
                </div>

                <div className="min-w-[105px] sm:min-w-[135px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs sm:text-base font-black text-[#FDE047] tracking-wide game-text-shadow">
                      {formatRaceTime(hud.elapsedRaceSec)}
                    </span>
                    <span className="text-[11px] sm:text-xs font-black text-[#A3E635]">
                      {hud.progressPercent}%
                    </span>
                  </div>

                  {/* Chunky Visual Track Bar */}
                  <div className="mt-1 w-full h-2.5 sm:h-3.5 bg-black/50 rounded-full overflow-hidden border-2 border-[#1A130D] p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#84CC16] to-[#FDE047] rounded-full transition-all duration-150"
                      style={{ width: `${Math.max(6, hud.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Hover Tooltip for Zone & Telemetry */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 z-30 w-56 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-2.5 shadow-xl text-xs">
                <div className="font-bold text-[#FDE047]">{hud.zoneName}</div>
                <div className="text-[11px] text-[#E5D9C5] mt-0.5">
                  Altitude: +{hud.elevationMeters}m · Slaps Landed: {hud.slapsLanded}
                </div>
              </div>
            </div>

            {/* Floating Passive Perk Medallion (Icon Only + Hover Tooltip!) */}
            <div className="relative group">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#FFFDF9] border-3 border-[#2B2118] border-b-5 shadow-lg flex items-center justify-center cursor-help transition-transform group-hover:scale-105">
                <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={36} />
                <span className="absolute -bottom-1.5 px-1.5 py-0.2 rounded-full bg-[#2B2118] text-[#38BDF8] text-[8px] sm:text-[9px] font-black tracking-wider uppercase">
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

          {/* Short Pop-up Event Pills (Max 2, super concise) */}
          {hud.events.length > 0 && (
            <div className="space-y-1">
              {hud.events.slice(0, 2).map((ev) => (
                <div
                  key={ev.id}
                  className="text-[11px] sm:text-xs font-bold text-[#2B2118] bg-[#FEF08A] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-2xl border-2 border-[#2B2118] border-b-4 w-fit shadow-md"
                >
                  {ev.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-Right: Tactile Arcade Buttons (including Home, Fullscreen Landscape Lock) + Compact Standings */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {/* Back to Main Home Screen Button */}
            {onGoHome && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={onGoHome}
                  data-testid="race-go-home-btn"
                  aria-label="Back to Main Home Screen"
                  className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  <span className="text-xs sm:text-sm font-black">หน้าแรก</span>
                </button>
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                  กลับสู่หน้าแรก (Main Home Menu)
                </div>
              </div>
            )}

            {/* Fullscreen + Landscape Orientation Lock Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleToggleFullscreenLandscape}
                aria-label={
                  isFullscreen
                    ? 'Exit Fullscreen'
                    : 'Fullscreen Landscape Mode'
                }
                className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-2xl border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shadow-lg ${
                  isFullscreen
                    ? 'bg-[#84CC16] text-[#2B2118]'
                    : 'bg-[#2B2118] hover:bg-[#423326] text-[#FDE047]'
                }`}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                ) : (
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                )}
                <span className="text-[11px] sm:text-xs font-black uppercase">
                  {isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}
                </span>
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#84CC16] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                {isFullscreen
                  ? 'Exit Fullscreen Mode'
                  : 'Play Fullscreen & Lock Landscape'}
              </div>
            </div>

            {/* 3D Dungeon Raid & PvP Mode Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => onLaunchCombatMode?.('dungeon')}
                data-testid="hud-open-dungeon-btn"
                aria-label="3D Dungeon Raid & Brawler PvP"
                className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#F87171] text-white border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shadow-lg"
              >
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span className="text-xs sm:text-sm font-black">DUNGEON</span>
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#EF4444] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                โหมดลงดันเจี้ยน 3D & ประลอง Brawler PvP
              </div>
            </div>

            {/* 4-Slot Gear Armory & Seasonal Ranks Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => onOpenArmoryModal?.('armory')}
                data-testid="hud-open-armory-btn"
                aria-label="4-Slot Gear & Seasonal Ranks"
                className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shadow-lg"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span className="text-xs sm:text-sm font-black">GEAR</span>
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#A855F7] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                คลังอุปกรณ์ 4 ช่อง · ล็อกอิน SQLite · อันดับซีซั่น
              </div>
            </div>

            {/* Loadout Locker Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={onOpenLobby}
                aria-label="Hero & Skill Locker"
                className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shadow-lg"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span className="text-xs sm:text-sm font-black">HEROES</span>
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#F59E0B] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                Pick Racer & 2-Skill Deck
              </div>
            </div>

            {/* 3D Studio Icon Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={onSwitchToStudio}
                aria-label="3D Model Studio"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center justify-center shadow-lg"
              >
                <Box className="w-4 h-4 sm:w-5 sm:h-5 text-[#6580B2] stroke-[2.5]" />
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#38BDF8] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                3D Character Studio
              </div>
            </div>

            {/* Git Agent Hub Icon Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={onOpenGitHub}
                aria-label="Git Agent Hub"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-5 active:translate-y-0.5 transition-all flex items-center justify-center shadow-lg"
              >
                <FolderGit2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#C86D3B] stroke-[2.5]" />
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#C86D3B] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                Git Agent Hub (PR #1 Merged)
              </div>
            </div>

            {/* Restart Icon Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={onRestartRace}
                aria-label="Restart Race"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] border-3 border-[#1A130D] border-b-5 active:translate-y-0.5 transition-all flex items-center justify-center shadow-lg"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                Restart Race
              </div>
            </div>
          </div>

          {/* Compact Arcade Top-3 Standings Pill Board + Live Track Minimap (Side-by-side for zero vertical crowding on mobile & desktop) */}
          <div className="flex items-start gap-1.5 sm:gap-2">
            <div className="bg-[#2B2118]/90 text-[#FFFDF9] border-3 border-[#1A130D] border-b-5 rounded-2xl px-2 py-1.5 shadow-lg w-38 sm:w-46 space-y-0.5 sm:space-y-1">
              {hud.standings.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                    r.isPlayer
                      ? 'bg-[#F59E0B] text-[#2B2118]'
                      : 'text-[#F3E8D6]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-black">{r.rank}.</span>
                    <CharacterAvatarEmblem
                      characterId={r.id}
                      primaryHex={r.primaryHex}
                      size={20}
                    />
                    <span className="truncate">{r.shortName}</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] opacity-90">
                    {r.finished ? 'WIN' : `${r.progressPercent}%`}
                  </span>
                </div>
              ))}
            </div>

            {/* Compact Real-Time Track Minimap (Desktop & Mobile) */}
            <TrackMinimap
              trackId={selectedTrackId}
              standings={hud.standings}
              zoneName={hud.zoneName}
            />
          </div>
        </div>
      </div>

      {/* CENTER COUNTDOWN OR CALLOUT POPUP */}
      <div className="flex flex-col items-center justify-center my-auto">
        {hud.phase === 'countdown' && !isLobbyOpen && (
          <div className="bg-[#2B2118] text-[#FFFDF9] px-8 py-4 sm:px-10 sm:py-6 rounded-3xl shadow-2xl border-4 border-[#F59E0B] border-b-8 text-center animate-bounce">
            <p className="text-xs sm:text-sm font-black text-[#FDE047] tracking-wider uppercase">
              GET READY!
            </p>
            <div className="text-5xl sm:text-7xl font-black tracking-tight mt-0.5 text-[#FFFDF9] game-text-shadow">
              {Math.ceil(hud.countdownSec)}
            </div>
          </div>
        )}

        {hud.bannerCallout && hud.phase === 'racing' && !isLobbyOpen && (
          <div
            className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-3xl bg-[#2B2118] font-black text-base sm:text-lg tracking-wide shadow-2xl border-3 border-[#FFFDF9]/30 border-b-6"
            style={{ color: hud.bannerCallout.colorHex }}
          >
            {hud.bannerCallout.text}
          </div>
        )}
      </div>

      {/* BOTTOM GAMEPAD BAR: Ergonomic Mobile Landscape Layout
          - Bottom-Left: Responsive Analog Thumbstick with generous touch zone
          - Bottom-Right: Radial Action Cluster (Skills, Prank Item, Slap & Hop) */}
      <div className="w-full flex items-end justify-between gap-2 pb-0.5 sm:pb-1">
        {/* BOTTOM-LEFT: Virtual Analog Thumbstick for Mobile Landscape, Tablet & Touch Steering */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 pl-1 sm:pl-2">
          <div
            ref={stickBaseRef}
            onPointerDown={handleStickPointerDown}
            onPointerMove={handleStickPointerMove}
            onPointerUp={handleStickPointerUp}
            onPointerCancel={handleStickPointerUp}
            aria-label="Virtual Analog Steering Thumbstick"
            className={`relative w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-[#2B2118]/85 border-3 border-b-6 shadow-2xl touch-none flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
              isStickActive
                ? 'border-[#FDE047] ring-4 ring-[#FDE047]/30'
                : 'border-[#FFFDF9]/50'
            }`}
          >
            {/* Outer Directional Chevrons */}
            <span className="pointer-events-none absolute top-1.5 text-[10px] font-black text-[#FDE047]/90">
              ▲
            </span>
            <span className="pointer-events-none absolute bottom-1.5 text-[10px] font-black text-[#FDE047]/90">
              ▼
            </span>
            <span className="pointer-events-none absolute left-2 text-[10px] font-black text-[#FDE047]/90">
              ◀
            </span>
            <span className="pointer-events-none absolute right-2 text-[10px] font-black text-[#FDE047]/90">
              ▶
            </span>

            {/* Inner Ring Guide */}
            <div className="pointer-events-none w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#FFFDF9]/25" />

            {/* Draggable Thumb Knob */}
            <div
              className="pointer-events-none w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-3 border-[#2B2118] border-b-5 shadow-xl flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#FFFDF9]/85 border border-[#2B2118]/40" />
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-[#2B2118]/90 text-[#FDE047] border border-[#1A130D] text-[9px] sm:text-[10px] font-black tracking-wide uppercase shadow">
            JOYSTICK / WASD
          </span>
        </div>

        {/* CENTER-BOTTOM HINT PILL (Visible on wide screens) */}
        <div className="hidden xl:flex flex-col items-center pb-2">
          <div className="px-3.5 py-1 rounded-full bg-[#2B2118]/80 text-[#FFFDF9] border-2 border-[#1A130D] text-[11px] font-bold shadow-md">
            Swipe Screen to Rotate Camera · Click 3D Track for 360° Mouse Look (ESC to unlock)
          </div>
        </div>

        {/* BOTTOM-RIGHT: ERGONOMIC MOBILE ACTION ARC / CLUSTER
            - Upper Arc: [Q] Active Skill + [E] Prank Item
            - Lower Arc: [F] Sideways Slap + Giant [SPC] Hop Anchor */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 sm:gap-2.5 pr-1 sm:pr-2">
          {/* UPPER ARC ROW: [Q] ACTIVE SKILL + [E] PRANK ITEM (Shifted slightly left in a thumb arc) */}
          <div className="flex items-center gap-2.5 sm:gap-3 mr-3 sm:mr-4">
            {/* SLOT 1: [Q] ACTIVE SKILL BUTTON */}
            <div className="relative group">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('q');
                }}
                disabled={hud.qCooldown > 0}
                aria-label={`Active Skill ${activeSkill.name}`}
                className={`relative w-15 h-15 sm:w-18 sm:h-18 rounded-3xl border-3 border-b-7 touch-none transition-all flex flex-col items-center justify-center shadow-2xl ${
                  hud.qCooldown <= 0
                    ? 'bg-[#FFFDF9] border-[#2B2118] hover:scale-105 hover:bg-[#FEF3C7] active:translate-y-1'
                    : 'bg-[#3D3024] border-[#1A130D] opacity-85'
                }`}
              >
                <span className="absolute -top-2 -left-1.5 px-1.5 py-0.2 rounded-xl bg-[#2B2118] text-[#FDE047] border-2 border-[#FFFDF9] text-[10px] sm:text-xs font-black shadow-sm">
                  Q
                </span>

                <ActiveSkillEmblem skillId={selectedActiveSkillId} size={44} />

                {hud.qCooldown > 0 ? (
                  <div className="absolute inset-0 rounded-3xl bg-black/65 flex items-center justify-center">
                    <span className="text-sm sm:text-base font-black text-[#FDE047] game-text-shadow">
                      {hud.qCooldown.toFixed(1)}s
                    </span>
                  </div>
                ) : (
                  <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#84CC16] text-[#2B2118] border-2 border-[#2B2118] text-[8px] sm:text-[9px] font-black uppercase">
                    SKILL
                  </span>
                )}
              </button>

              {/* Hover Tooltip for [Q] Skill */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="flex items-center justify-between font-black text-[#FDE047]">
                  <span>[Q] {activeSkill.name}</span>
                  <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">
                    CD {activeSkill.cooldownSec}s
                  </span>
                </div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  {activeSkill.activeDescription}
                </p>
              </div>
            </div>

            {/* SLOT 2: [E] PRANK ITEM BUTTON */}
            <div className="relative group">
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
                className={`relative w-15 h-15 sm:w-18 sm:h-18 rounded-3xl border-3 border-b-7 touch-none transition-all flex flex-col items-center justify-center shadow-2xl ${
                  heldItemSpec
                    ? 'bg-[#FEF08A] border-[#2B2118] hover:scale-105 hover:bg-[#FDE047] active:translate-y-1 animate-pulse'
                    : 'bg-[#2B2118]/90 border-[#1A130D]'
                }`}
              >
                <span className="absolute -top-2 -left-1.5 px-1.5 py-0.2 rounded-xl bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FFFDF9] text-[10px] sm:text-xs font-black shadow-sm">
                  E
                </span>

                <PrankItemEmblem itemId={hud.heldItem} size={44} />

                <span
                  className={`absolute -bottom-2 px-2 py-0.5 rounded-full border-2 border-[#2B2118] text-[8px] sm:text-[9px] font-black uppercase ${
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
            {/* SLOT 3: [F] SIDEWAYS SLAP BUTTON */}
            <div className="relative group">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('f');
                }}
                disabled={hud.fCooldown > 0}
                aria-label="Sideways Slap"
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-3xl border-3 border-b-7 touch-none transition-all flex flex-col items-center justify-center shadow-2xl ${
                  hud.fCooldown <= 0
                    ? 'bg-[#C86D3B] hover:bg-[#D97706] border-[#2B2118] hover:scale-105 active:translate-y-1'
                    : 'bg-[#3D3024] border-[#1A130D] opacity-85'
                }`}
              >
                <span className="absolute -top-2 -left-1.5 px-1.5 py-0.2 rounded-xl bg-[#2B2118] text-[#FDE047] border-2 border-[#FFFDF9] text-[10px] sm:text-xs font-black shadow-sm">
                  F
                </span>

                <ActionButtonEmblem action="slap" size={38} />

                {hud.fCooldown > 0 ? (
                  <div className="absolute inset-0 rounded-3xl bg-black/65 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-black text-[#FDE047] game-text-shadow">
                      {hud.fCooldown.toFixed(1)}s
                    </span>
                  </div>
                ) : (
                  <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#FFFDF9] text-[#2B2118] border-2 border-[#2B2118] text-[8px] sm:text-[9px] font-black uppercase">
                    SLAP
                  </span>
                )}
              </button>

              {/* Hover Tooltip for [F] Slap */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-48 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#C86D3B] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="font-black text-[#FDE047]">[F] Sideways Slap</div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  Smack nearby rivals sideways off wooden bridges or into deep water!
                </p>
              </div>
            </div>

            {/* SLOT 4: PRIMARY [SPACE] HOP / JUMP ANCHOR BUTTON (Largest for easy thumb reach) */}
            <div className="relative group">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTriggerAction('jump');
                }}
                aria-label="Hop Jump"
                className="relative w-17 h-17 sm:w-20 sm:h-20 rounded-full border-3 border-b-8 border-[#2B2118] bg-[#84CC16] hover:bg-[#A3E635] hover:scale-105 active:translate-y-1 touch-none transition-all flex flex-col items-center justify-center shadow-2xl"
              >
                <span className="absolute -top-2 -left-1 px-1.5 py-0.2 rounded-xl bg-[#2B2118] text-[#A3E635] border-2 border-[#FFFDF9] text-[9px] sm:text-[10px] font-black shadow-sm">
                  SPC
                </span>

                <ActionButtonEmblem action="hop" size={46} />

                <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-[#FFFDF9] text-[#2B2118] border-2 border-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase">
                  HOP
                </span>
              </button>

              {/* Hover Tooltip for [Space] Hop */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2.5 z-30 w-48 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#84CC16] rounded-2xl p-2.5 shadow-2xl text-xs">
                <div className="font-black text-[#A3E635]">[Space] Hop Jump</div>
                <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                  Hop across deep river stepping stones, spinning logs & slime!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRE-RACE LOCKER MODAL (VISUAL ICON GRID + HOVER TOOLTIPS + EASY CLOSE & HOME BUTTONS) */}
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
            className="bg-[#FFFDF9] border-4 border-[#2B2118] border-b-10 rounded-4xl max-w-4xl w-full p-3.5 sm:p-5 shadow-2xl max-h-[94dvh] overflow-y-auto"
          >
            {/* Top Navigation & Close Bar for Locker Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-[#EDE3D2]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[#2B2118] text-[#FDE047] text-xs font-black">
                  เลือกตัวละคร 3D · สกิล [Q] / [Auto] · สนามแข่ง
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {onGoHome && (
                  <button
                    type="button"
                    onClick={onGoHome}
                    data-testid="locker-go-home-btn"
                    className="h-9 px-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
                  >
                    <Home className="w-4 h-4" />
                    <span>กลับหน้าแรก (Home)</span>
                  </button>
                )}
                {onCloseLobby && (
                  <button
                    type="button"
                    onClick={onCloseLobby}
                    data-testid="close-locker-modal-btn"
                    aria-label="Close Hero Locker Modal"
                    className="h-9 px-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#2B2118] border-b-4 text-xs font-black flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
                  >
                    <X className="w-4 h-4 stroke-[2.8]" />
                    <span>ปิดหน้าต่าง (Close)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Game Banner Header + 2-Circuit Map Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3.5 border-b-3 border-[#EDE3D2] items-stretch">
              <div className="md:col-span-7 relative rounded-3xl overflow-hidden border-3 border-[#2B2118] bg-[#2B2118] min-h-[120px] sm:min-h-[144px] flex flex-col justify-end p-3.5 sm:p-4 shadow-md">
                <PendingBannerSlot
                  src={GAME_BANNER_ASSETS.raceCrestBanner}
                  alt="BlockyPals 3D Party Race Banner"
                  fileName="race_crest_banner.png"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 flex flex-wrap items-end justify-between gap-2.5">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#2B2118] text-[10px] sm:text-[11px] font-black uppercase border border-[#2B2118]">
                      PARTY RACE LOCKER
                    </span>
                    <h2 className="mt-1 text-xl sm:text-3xl font-black text-white tracking-wide game-text-shadow">
                      PALS RUSH 3D!
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFullscreenLandscape}
                      className="px-3 py-2.5 rounded-2xl bg-[#2B2118]/90 hover:bg-[#423326] text-[#FDE047] border-2 border-[#FDE047] text-xs font-black flex items-center gap-1.5 shadow-lg"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                      <span>{isFullscreen ? 'WINDOW' : 'FULLSCREEN'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onStartRace}
                      className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 text-sm sm:text-base font-black flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xl"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      <span>RACE!</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive 2-Circuit Selector Card: Woodland Forest vs Glacier Peak (Snow & Ice) */}
              <div className="md:col-span-5 rounded-3xl border-3 border-[#2B2118] bg-[#2B2118] p-3 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-[#FDE047] uppercase tracking-wider">
                    SELECT CIRCUIT MAP (2 MAPS)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-[#FFFDF9] text-[10px] font-black">
                    {TRACK_CATALOG[selectedTrackId].lengthLabel} · 1 LAP
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                        className={`relative rounded-2xl p-2.5 border-2 text-left transition-all flex flex-col justify-between min-h-[78px] ${
                          active
                            ? isSnowMap
                              ? 'bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#1E1B4B] border-[#38BDF8] text-white shadow-lg scale-[1.02]'
                              : 'bg-gradient-to-br from-[#15803D] via-[#166534] to-[#1D2B19] border-[#A3E635] text-white shadow-lg scale-[1.02]'
                            : 'bg-[#3A2C20] border-white/15 text-[#E5D9C5] hover:bg-[#4A3828]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              isSnowMap
                                ? 'bg-[#38BDF8] text-[#082F49]'
                                : 'bg-[#A3E635] text-[#1A130D]'
                            }`}
                          >
                            {isSnowMap ? (
                              <Snowflake className="w-3 h-3" />
                            ) : (
                              <Trees className="w-3 h-3" />
                            )}
                            {meta.badgeText}
                          </span>
                          {active && (
                            <span className="text-[9px] font-black text-[#FDE047] uppercase">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <div className="text-xs font-black leading-tight text-white">
                            {meta.name}
                          </div>
                          <div className="text-[10px] font-bold opacity-85 truncate mt-0.5">
                            {meta.features.join(' • ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DUAL-PILLAR MODE BAR: Member Profile + Quick Switch to Dungeon/PvP + 4-Slot Gear + Seasonal Ranks */}
            <div className="mt-2.5 bg-[#2B2118] text-[#FFFDF9] rounded-2xl px-3 py-2 border-2 border-[#1A130D] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenArmoryModal?.('auth')}
                  data-testid="locker-open-auth-btn"
                  className="px-2.5 py-1 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] text-xs font-black flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    Lv.{userProfile?.level ?? 1}{' '}
                    {userProfile?.displayName || 'PalGuest'} (
                    {userProfile?.isGuest ? 'Guest · ผูกบัญชีได้' : 'SQLite Member'})
                  </span>
                </button>
                <span className="hidden sm:inline text-[11px] font-bold text-[#A3E635]">
                  🏁 โหมดวิ่ง: Fair Play 100% (อุปกรณ์โชว์สกินและออร่า 3D เท่ๆ ไม่บวกสปีด)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenArmoryModal?.('armory')}
                  data-testid="locker-open-armory-btn"
                  className="px-3 py-1 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white text-xs font-black flex items-center gap-1 shadow"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>แต่งอุปกรณ์ 4 ช่อง</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenArmoryModal?.('leaderboard')}
                  data-testid="locker-open-ranks-btn"
                  className="px-3 py-1 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] text-xs font-black flex items-center gap-1 shadow"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>อันดับ 3 โหมด ({userProfile?.rankings.raceRp ?? 1000} RP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLaunchCombatMode?.('dungeon')}
                  data-testid="locker-launch-dungeon-btn"
                  className="px-3 py-1 rounded-xl bg-[#EF4444] hover:bg-[#F87171] text-white text-xs font-black flex items-center gap-1 shadow"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>ลงดันเจี้ยน 3D & PvP!</span>
                </button>
              </div>
            </div>

            {/* MAIN LOCKER STAGE: Live 3D Character Model Preview alongside 16-Character Grid & Skill Deck */}
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
              {/* Left Column (4 cols on desktop): Live 3D Character Preview Stage with Cool Hero Stance + 4-Slot 3D Gear */}
              <div className="lg:col-span-4 flex flex-col">
                <LobbyCharacterPreview
                  character={selectedCharacter}
                  loadout={userProfile?.loadout}
                />
              </div>

              {/* Right Column (8 cols on desktop): 16-Character Picker + Active & Passive Skill Deck */}
              <div className="lg:col-span-8 flex flex-col justify-between gap-3.5">
                {/* STEP 1: 16 Chibi Characters (Avatar Emblems + Short Name + Hover Tooltip) */}
                <div className="bg-[#F8F2E8]/70 border-3 border-[#E5D9C5] rounded-3xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#2B2118] uppercase tracking-wide">
                      1. Pick Your Pal (16 Heroes)
                    </span>
                    <span className="text-xs font-bold text-[#7D6854]">
                      Click any pal to preview in 3D
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
                    {CHARACTERS.map((char) => {
                      const isSelected = char.id === selectedCharacter.id;
                      return (
                        <div key={char.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => onSelectCharacter(char.id)}
                            className={`w-full py-1.5 px-1 sm:py-2 sm:px-1.5 rounded-2xl border-3 border-b-5 transition-all flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'bg-[#F59E0B] text-[#2B2118] border-[#2B2118] scale-105 shadow-md'
                                : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#EFE5D5]'
                            }`}
                          >
                            <CharacterAvatarEmblem
                              characterId={char.id}
                              primaryHex={char.primaryHex}
                              secondaryHex={char.secondaryHex}
                              accentHex={char.accentHex}
                              size={42}
                            />
                            <span className="text-[10px] sm:text-[11px] font-black truncate max-w-full">
                              {char.shortName}
                            </span>
                          </button>

                          {/* Character Hover Tooltip */}
                          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 w-48 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#F59E0B] rounded-2xl p-2.5 shadow-xl text-center">
                            <CharacterAvatarEmblem
                              characterId={char.id}
                              primaryHex={char.primaryHex}
                              secondaryHex={char.secondaryHex}
                              accentHex={char.accentHex}
                              size={44}
                              className="mx-auto mb-1"
                            />
                            <div className="text-xs font-black text-[#FDE047]">
                              #{char.index + 1} {char.name}
                            </div>
                            <div className="text-[10px] text-[#E5D9C5] mt-0.5">
                              {char.personality} · {char.accessory}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2 & STEP 3 SIDE-BY-SIDE: Big PNG Icons + Short Name Only, Descriptions in Hover Tooltips! */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* STEP 2: 5 Active Skills [Key Q] */}
                  <div className="bg-[#F8F2E8] border-3 border-[#E5D9C5] rounded-3xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-[#C86D3B] uppercase tracking-wide">
                        2. Active Skill [Q]
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-[#2B2118] text-[#FDE047] text-xs font-black">
                        {activeSkill.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {ACTIVE_SKILL_LIST.map((skillId) => {
                        const sk = ACTIVE_SKILLS[skillId];
                        const isSelected = skillId === selectedActiveSkillId;
                        return (
                          <div key={sk.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => onSelectActiveSkill(sk.id)}
                              className={`w-full p-1.5 rounded-2xl border-3 border-b-6 transition-all flex flex-col items-center gap-1 ${
                                isSelected
                                  ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D] scale-105 shadow-lg'
                                  : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#FEF3C7]'
                              }`}
                            >
                              <ActiveSkillEmblem skillId={sk.id} size={42} />
                              <span className="text-[10px] font-black leading-tight text-center truncate w-full">
                                {sk.name.split(' ')[0]}
                              </span>
                            </button>

                            {/* Hover Tooltip for Skill Card */}
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-40 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-3 shadow-2xl text-xs">
                              <div className="flex items-center justify-between font-black text-[#FDE047]">
                                <span>{sk.name}</span>
                                <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">
                                  {sk.cooldownSec}s
                                </span>
                              </div>
                              <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                                {sk.activeDescription}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: 5 Passive Skills [Auto] */}
                  <div className="bg-[#F8F2E8] border-3 border-[#E5D9C5] rounded-3xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-[#6580B2] uppercase tracking-wide">
                        3. Passive Perk [Auto]
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-[#2B2118] text-[#38BDF8] text-xs font-black">
                        {passiveSkill.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {PASSIVE_SKILL_LIST.map((pId) => {
                        const pk = PASSIVE_SKILLS[pId];
                        const isSelected = pId === selectedPassiveSkillId;
                        return (
                          <div key={pk.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => onSelectPassiveSkill(pk.id)}
                              className={`w-full p-1.5 rounded-2xl border-3 border-b-6 transition-all flex flex-col items-center gap-1 ${
                                isSelected
                                  ? 'bg-[#2B2118] text-[#38BDF8] border-[#1A130D] scale-105 shadow-lg'
                                  : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#E0F2FE]'
                              }`}
                            >
                              <PassiveSkillEmblem passiveId={pk.id} size={42} />
                              <span className="text-[10px] font-black leading-tight text-center truncate w-full">
                                {pk.name.split(' ')[0]}
                              </span>
                            </button>

                            {/* Hover Tooltip for Passive Card */}
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-40 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#38BDF8] rounded-2xl p-3 shadow-2xl text-xs">
                              <div className="flex items-center justify-between font-black text-[#38BDF8]">
                                <span>{pk.name}</span>
                                <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">
                                  AUTO
                                </span>
                              </div>
                              <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                                {pk.passiveDescription}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Visual Loadout Strip + Big GO Button */}
            <div className="mt-3.5 pt-3 border-t-3 border-[#EDE3D2] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 bg-[#F8F2E8] px-3 py-1.5 rounded-2xl border-2 border-[#D9C8B0]">
                <CharacterAvatarEmblem
                  characterId={selectedCharacter.id}
                  primaryHex={selectedCharacter.primaryHex}
                  secondaryHex={selectedCharacter.secondaryHex}
                  accentHex={selectedCharacter.accentHex}
                  size={28}
                />
                <span className="text-sm font-black text-[#2B2118]">
                  {selectedCharacter.name}
                </span>
                <span className="text-[#C8B69E]">+</span>
                <ActiveSkillEmblem skillId={selectedActiveSkillId} size={30} />
                <span className="text-[#C8B69E]">+</span>
                <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={30} />
              </div>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {onGoHome && (
                  <button
                    type="button"
                    onClick={onGoHome}
                    className="px-4 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-xs sm:text-sm font-black flex items-center gap-1.5"
                  >
                    <Home className="w-4 h-4" />
                    <span>หน้าแรก</span>
                  </button>
                )}
                {onCloseLobby && (
                  <button
                    type="button"
                    onClick={onCloseLobby}
                    className="px-4 py-2.5 rounded-2xl bg-[#2B2118] hover:bg-[#EF4444] text-white border-3 border-[#1A130D] border-b-6 text-xs sm:text-sm font-black flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>ปิดหน้าต่าง</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onStartRace}
                  className="px-6 py-2.5 sm:px-7 sm:py-3 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 text-sm sm:text-base font-black flex items-center gap-2 shadow-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>GO TO STARTING GRID!</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST-RACE PODIUM MODAL (COLLAPSIBLE) + LIVE SPECTATOR CAMERA SWITCHER */}
      {hud.phase === 'finished' && !isLobbyOpen && (
        <>
          {isResultsCollapsed ? (
            /* COLLAPSED MODE: Floating Spectator & Podium Control Bar (Unobstructed 3D View!) */
            <div className="pointer-events-auto fixed inset-x-0 top-16 sm:top-18 z-30 flex justify-center px-2.5">
              <div className="bg-[#2B2118]/95 text-[#FFFDF9] border-3 border-[#F59E0B] border-b-6 rounded-3xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xl max-w-2xl w-full flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Prev / Next Spectator Switcher + Current Watched Racer */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleCycleSpectatedRacer(-1)}
                      aria-label="Watch Previous Racer"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] border-b-4 active:translate-y-0.5 flex items-center justify-center shadow"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.8]" />
                    </button>

                    <div className="flex items-center gap-2 bg-[#1A130D]/80 px-2.5 py-1 rounded-2xl border border-[#FFFDF9]/20">
                      <Eye className="w-4 h-4 text-[#38BDF8] shrink-0" />
                      {spectatedEntry && (
                        <>
                          <CharacterAvatarEmblem
                            characterId={spectatedEntry.id}
                            primaryHex={spectatedEntry.primaryHex}
                            size={24}
                          />
                          <span className="text-xs sm:text-sm font-black text-[#FDE047]">
                            #{spectatedEntry.rank} {spectatedEntry.shortName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black uppercase ${
                              spectatedEntry.finished
                                ? 'bg-[#84CC16] text-[#2B2118]'
                                : 'bg-[#38BDF8] text-[#2B2118] animate-pulse'
                            }`}
                          >
                            {spectatedEntry.finished
                              ? 'FINISHED'
                              : `RUNNING ${spectatedEntry.progressPercent}%`}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCycleSpectatedRacer(1)}
                      aria-label="Watch Next Racer"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-2 border-[#1A130D] border-b-4 active:translate-y-0.5 flex items-center justify-center shadow"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.8]" />
                    </button>
                  </div>

                  {/* Right: Expand Results Window + Play Again */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setIsResultsCollapsed(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-2 border-[#1A130D] border-b-4 text-xs font-black flex items-center gap-1 shadow"
                    >
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                      <span>RESULTS ({formatOrdinal(hud.playerRank)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRestartRace}
                      className="px-3 py-1.5 rounded-xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-2 border-[#1A130D] border-b-4 text-xs font-black shadow"
                    >
                      PLAY AGAIN!
                    </button>
                  </div>
                </div>

                {/* Quick-Select Racer Pills (Tap any racer to watch them live!) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {hud.standings.map((r) => {
                    const isWatched = r.id === spectatedEntry?.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelectSpectatedRacer?.(r.id)}
                        className={`px-2 py-1 rounded-xl border text-[10px] sm:text-[11px] font-black flex items-center gap-1 shrink-0 transition-all ${
                          isWatched
                            ? 'bg-[#FDE047] text-[#2B2118] border-[#1A130D] scale-105 shadow'
                            : 'bg-[#1A130D]/70 text-[#F3E8D6] border-[#FFFDF9]/15 hover:bg-[#3D3024]'
                        }`}
                      >
                        <CharacterAvatarEmblem
                          characterId={r.id}
                          primaryHex={r.primaryHex}
                          size={20}
                        />
                        <span>
                          {r.rank}. {r.shortName}
                        </span>
                        {!r.finished && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* EXPANDED MODE: Full Podium Results Modal with Collapse & Watch Buttons */
            <div
              className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-3 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Race Results"
            >
              <div className="relative bg-[#FFFDF9] border-4 border-[#2B2118] border-b-10 rounded-4xl max-w-md w-full p-4 sm:p-6 shadow-2xl text-center max-h-[92dvh] overflow-y-auto">
                {/* Top-Right Minimize / Watch & Close Buttons */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCollapseAndWatchRunners}
                    aria-label="Minimize Results and Watch Racers"
                    className="px-2.5 py-1.5 rounded-2xl bg-[#2B2118] hover:bg-[#423326] text-[#38BDF8] border-2 border-[#1A130D] border-b-4 text-[11px] font-black flex items-center gap-1 shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>WATCH</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAndWatchRunners}
                    aria-label="Close Podium Modal"
                    className="px-2.5 py-1.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#1A130D] border-b-4 text-[11px] font-black flex items-center gap-1 shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ปิด</span>
                  </button>
                </div>

                <PendingBannerSlot
                  src={GAME_BANNER_ASSETS.victoryTrophyEmblem}
                  alt="Champion Trophy Emblem"
                  fileName="victory_trophy_emblem.png"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mx-auto object-cover border-3 border-[#2B2118] shadow-lg"
                />
                <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#2B2118]">
                  {hud.playerRank === 1
                    ? 'CHAMPION!'
                    : `${formatOrdinal(hud.playerRank)} PLACE!`}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#6E5A47]">
                  {formatRaceTime(hud.elapsedRaceSec)} · {hud.slapsLanded} Slaps
                </p>

                {/* Standings List (All 8 Racers — Click any row to Watch them live!) */}
                <div className="mt-3 bg-[#F8F2E8] border-3 border-[#E5D9C5] rounded-3xl p-2.5 text-left space-y-1 max-h-52 overflow-y-auto">
                  {hud.standings.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        onSelectSpectatedRacer?.(r.id);
                        setIsResultsCollapsed(true);
                      }}
                      className={`cursor-pointer flex items-center justify-between text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors ${
                        r.isPlayer
                          ? 'bg-[#2B2118] text-[#FDE047]'
                          : 'text-[#2B2118] hover:bg-[#EFE5D5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black">{r.rank}.</span>
                        <CharacterAvatarEmblem
                          characterId={r.id}
                          primaryHex={r.primaryHex}
                          size={26}
                        />
                        <span className="truncate">
                          {r.shortName} {r.isPlayer ? '(YOU)' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span>
                          {r.finishTimeSec
                            ? formatRaceTime(r.finishTimeSec)
                            : `${r.progressPercent}%`}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                            r.finished
                              ? 'bg-black/10 text-[#6E5A47]'
                              : 'bg-[#38BDF8] text-[#2B2118]'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          {r.finished ? 'VIEW' : 'LIVE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {onGoHome && (
                    <button
                      type="button"
                      onClick={onGoHome}
                      className="px-3.5 py-2.5 rounded-2xl border-3 border-[#2B2118] border-b-6 bg-[#FDE047] hover:bg-[#FACC15] text-xs sm:text-sm font-black text-[#2B2118] flex items-center gap-1.5"
                    >
                      <Home className="w-4 h-4 stroke-[2.5]" />
                      <span>หน้าแรก</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCollapseAndWatchRunners}
                    className="px-3.5 py-2.5 rounded-2xl border-3 border-[#2B2118] border-b-6 bg-[#38BDF8] hover:bg-[#7DD3FC] text-xs sm:text-sm font-black text-[#2B2118] flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 stroke-[2.5]" />
                    <span>WATCH OTHERS</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLobby}
                    className="px-3.5 py-2.5 rounded-2xl border-3 border-[#2B2118] border-b-6 bg-[#F8F2E8] hover:bg-[#EFE5D5] text-xs sm:text-sm font-black text-[#2B2118]"
                  >
                    HEROES
                  </button>
                  <button
                    type="button"
                    onClick={onRestartRace}
                    className="px-5 py-2.5 rounded-2xl border-3 border-[#2B2118] border-b-6 bg-[#84CC16] hover:bg-[#A3E635] text-xs sm:text-sm font-black text-[#2B2118]"
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

