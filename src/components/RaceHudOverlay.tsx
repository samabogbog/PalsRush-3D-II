import React, { useRef, useState, useCallback } from 'react';
import {
  RotateCcw,
  Play,
  Users,
  FolderGit2,
  Box,
  Sparkles,
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
import { RaceHudSnapshot } from './RaceGameCanvas';
import {
  ActionButtonEmblem,
  ActiveSkillEmblem,
  ArcadeRankShield,
  GAME_BANNER_ASSETS,
  PassiveSkillEmblem,
  PendingBannerSlot,
  PrankItemEmblem,
} from './GameAssetIcons';

export interface RaceHudOverlayProps {
  selectedCharacter: CharacterSpec;
  selectedActiveSkillId: ActiveSkillId;
  selectedPassiveSkillId: PassiveSkillId;
  hud: RaceHudSnapshot;
  isLobbyOpen: boolean;
  onSelectCharacter: (id: CharacterId) => void;
  onSelectActiveSkill: (id: ActiveSkillId) => void;
  onSelectPassiveSkill: (id: PassiveSkillId) => void;
  onStartRace: () => void;
  onRestartRace: () => void;
  onOpenLobby: () => void;
  onOpenGitHub: () => void;
  onSwitchToStudio: () => void;
  onTriggerAction: (type: 'q' | 'e' | 'f' | 'jump') => void;
  onJoystickChange?: (x: number, y: number) => void;
}

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
  selectedCharacter,
  selectedActiveSkillId,
  selectedPassiveSkillId,
  hud,
  isLobbyOpen,
  onSelectCharacter,
  onSelectActiveSkill,
  onSelectPassiveSkill,
  onStartRace,
  onRestartRace,
  onOpenLobby,
  onOpenGitHub,
  onSwitchToStudio,
  onTriggerAction,
  onJoystickChange,
}) => {
  const activeSkill = ACTIVE_SKILLS[selectedActiveSkillId];
  const passiveSkill = PASSIVE_SKILLS[selectedPassiveSkillId];
  const heldItemSpec = hud.heldItem ? ITEMS[hud.heldItem] : null;

  // Virtual Analog Thumbstick state for Mobile & Touch controls
  const stickBaseRef = useRef<HTMLDivElement | null>(null);
  const stickPointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const MAX_STICK_RADIUS = 38;

  const updateStickFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const base = stickBaseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_STICK_RADIUS) {
        dx = (dx / dist) * MAX_STICK_RADIUS;
        dy = (dy / dist) * MAX_STICK_RADIUS;
      }
      setKnobOffset({ x: dx, y: dy });
      const normX = Math.max(-1, Math.min(1, dx / MAX_STICK_RADIUS));
      const normY = Math.max(-1, Math.min(1, -dy / MAX_STICK_RADIUS));
      onJoystickChange?.(normX, normY);
    },
    [onJoystickChange]
  );

  const handleStickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    stickPointerIdRef.current = e.pointerId;
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
    setKnobOffset({ x: 0, y: 0 });
    onJoystickChange?.(0, 0);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* TOP GAME HUD ROW: Icon-First Rank Shield & Track Bar (Left) + Floating Icon Buttons & Mini Leaderboard (Right) */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Sculpted Rank Shield + Compact Progress Bar + Passive Icon Badge */}
        <div className="flex flex-col gap-2">
          <div className="pointer-events-auto flex items-center gap-2.5">
            {/* Dynamic SVG Rank Shield with Hover Tooltip */}
            <div className="relative group">
              <div className="bg-[#2B2118]/95 border-3 border-[#1A130D] border-b-6 rounded-3xl p-1.5 shadow-xl flex items-center gap-3 pr-4">
                <ArcadeRankShield rank={hud.playerRank} size={60} />

                <div className="min-w-[135px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-black text-[#FDE047] tracking-wide game-text-shadow">
                      {formatRaceTime(hud.elapsedRaceSec)}
                    </span>
                    <span className="text-xs font-black text-[#A3E635]">
                      {hud.progressPercent}%
                    </span>
                  </div>

                  {/* Chunky Visual Track Bar */}
                  <div className="mt-1.5 w-full h-3.5 bg-black/50 rounded-full overflow-hidden border-2 border-[#1A130D] p-0.5">
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
              <div className="w-14 h-14 rounded-2xl bg-[#FFFDF9] border-3 border-[#2B2118] border-b-6 shadow-lg flex items-center justify-center cursor-help transition-transform group-hover:scale-105">
                <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={42} />
                <span className="absolute -bottom-1.5 px-1.5 py-0.2 rounded-full bg-[#2B2118] text-[#38BDF8] text-[9px] font-black tracking-wider uppercase">
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
                  className="text-xs font-bold text-[#2B2118] bg-[#FEF08A] px-3 py-1 rounded-2xl border-2 border-[#2B2118] border-b-4 w-fit shadow-md"
                >
                  {ev.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-Right: Tactile Icon-Only Arcade Buttons (with Hover Tooltips) + Compact Standings */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Loadout Locker Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={onOpenLobby}
                aria-label="Hero & Skill Locker"
                className="h-12 px-3.5 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 transition-all flex items-center gap-2 shadow-lg"
              >
                <Users className="w-5 h-5 stroke-[2.5]" />
                <span className="text-sm font-black">HEROES</span>
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
                className="w-12 h-12 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 transition-all flex items-center justify-center shadow-lg"
              >
                <Box className="w-5 h-5 text-[#6580B2] stroke-[2.5]" />
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
                className="w-12 h-12 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 transition-all flex items-center justify-center shadow-lg"
              >
                <FolderGit2 className="w-5 h-5 text-[#C86D3B] stroke-[2.5]" />
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
                className="w-12 h-12 rounded-2xl bg-[#2B2118] hover:bg-[#423326] text-[#FDE047] border-3 border-[#1A130D] border-b-6 active:translate-y-0.5 transition-all flex items-center justify-center shadow-lg"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-xl px-2.5 py-1.5 text-xs shadow-lg">
                Restart Race
              </div>
            </div>
          </div>

          {/* Compact Arcade Top-4 Standings Pill Board */}
          <div className="bg-[#2B2118]/90 text-[#FFFDF9] border-3 border-[#1A130D] border-b-6 rounded-2xl px-3 py-2 shadow-lg w-44 space-y-1">
            {hud.standings.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between text-xs font-bold px-2 py-0.5 rounded-lg ${
                  r.isPlayer
                    ? 'bg-[#F59E0B] text-[#2B2118]'
                    : 'text-[#F3E8D6]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-black">{r.rank}.</span>
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-black/40"
                    style={{ backgroundColor: r.primaryHex }}
                  />
                  <span className="truncate">{r.shortName}</span>
                </div>
                <span className="text-[11px] opacity-90">
                  {r.finished ? 'WIN' : `${r.progressPercent}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COUNTDOWN OR CALLOUT POPUP */}
      <div className="flex flex-col items-center justify-center my-auto">
        {hud.phase === 'countdown' && !isLobbyOpen && (
          <div className="bg-[#2B2118] text-[#FFFDF9] px-10 py-6 rounded-3xl shadow-2xl border-4 border-[#F59E0B] border-b-8 text-center animate-bounce">
            <p className="text-sm font-black text-[#FDE047] tracking-wider uppercase">
              GET READY!
            </p>
            <div className="text-7xl font-black tracking-tight mt-1 text-[#FFFDF9] game-text-shadow">
              {Math.ceil(hud.countdownSec)}
            </div>
          </div>
        )}

        {hud.bannerCallout && hud.phase === 'racing' && !isLobbyOpen && (
          <div
            className="px-6 py-2.5 rounded-3xl bg-[#2B2118] font-black text-lg tracking-wide shadow-2xl border-3 border-[#FFFDF9]/30 border-b-6"
            style={{ color: hud.bannerCallout.colorHex }}
          >
            {hud.bannerCallout.text}
          </div>
        )}
      </div>

      {/* BOTTOM GAMEPAD BAR: Virtual Analog Thumbstick (Left) + Floating Action Cluster (Right/Center) */}
      <div className="w-full flex items-end justify-between gap-3 pb-1">
        {/* BOTTOM-LEFT: Virtual Analog Thumbstick for Mobile, Tablet & Touch/Mouse Steering */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5">
          <div
            ref={stickBaseRef}
            onPointerDown={handleStickPointerDown}
            onPointerMove={handleStickPointerMove}
            onPointerUp={handleStickPointerUp}
            onPointerCancel={handleStickPointerUp}
            aria-label="Virtual Analog Steering Thumbstick"
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#2B2118]/80 border-3 border-[#FFFDF9]/45 border-b-6 shadow-2xl touch-none flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {/* Outer Directional Markers */}
            <span className="pointer-events-none absolute top-1.5 text-[10px] font-black text-[#FDE047]/80">
              ▲
            </span>
            <span className="pointer-events-none absolute bottom-1.5 text-[10px] font-black text-[#FDE047]/80">
              ▼
            </span>
            <span className="pointer-events-none absolute left-2 text-[10px] font-black text-[#FDE047]/80">
              ◀
            </span>
            <span className="pointer-events-none absolute right-2 text-[10px] font-black text-[#FDE047]/80">
              ▶
            </span>

            {/* Inner Ring Guide */}
            <div className="pointer-events-none w-16 h-16 rounded-full border-2 border-dashed border-[#FFFDF9]/25" />

            {/* Draggable Thumb Knob */}
            <div
              className="pointer-events-none w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-3 border-[#2B2118] border-b-5 shadow-xl flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-[#FFFDF9]/80 border border-[#2B2118]/40" />
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-[#2B2118]/85 text-[#FDE047] border border-[#1A130D] text-[10px] font-black tracking-wide uppercase shadow">
            MOVE / WASD
          </span>
        </div>

        {/* CENTER-BOTTOM HINT PILL (Hidden on extra small screens) */}
        <div className="hidden lg:flex flex-col items-center pb-2">
          <div className="px-3.5 py-1 rounded-full bg-[#2B2118]/80 text-[#FFFDF9] border-2 border-[#1A130D] text-[11px] font-bold shadow-md">
            Click 3D Track for Unlimited 360° Mouse Look (ESC to unlock) · Swipe Sky on Mobile
          </div>
        </div>

        {/* BOTTOM-RIGHT: FLOATING ICON-FIRST ACTION PAD (Touch + Mouse + Keyboard) */}
        <div className="pointer-events-auto flex items-end justify-end gap-2.5 sm:gap-3.5">
          {/* SLOT 1: [Q] ACTIVE SKILL BIG ICON BUTTON */}
          <div className="relative group">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onTriggerAction('q');
              }}
              disabled={hud.qCooldown > 0}
              aria-label={`Active Skill ${activeSkill.name}`}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-3 border-b-8 touch-none transition-all flex flex-col items-center justify-center shadow-2xl ${
                hud.qCooldown <= 0
                  ? 'bg-[#FFFDF9] border-[#2B2118] hover:scale-105 hover:bg-[#FEF3C7] active:translate-y-1'
                  : 'bg-[#3D3024] border-[#1A130D] opacity-85'
              }`}
            >
              {/* Keycap Badge */}
              <span className="absolute -top-2.5 -left-1.5 px-2 py-0.5 rounded-xl bg-[#2B2118] text-[#FDE047] border-2 border-[#FFFDF9] text-xs font-black shadow-sm">
                Q
              </span>

              <ActiveSkillEmblem skillId={selectedActiveSkillId} size={52} />

              {/* Cooldown Overlay or Ready Pill */}
              {hud.qCooldown > 0 ? (
                <div className="absolute inset-0 rounded-3xl bg-black/65 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-black text-[#FDE047] game-text-shadow">
                    {hud.qCooldown.toFixed(1)}s
                  </span>
                </div>
              ) : (
                <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#84CC16] text-[#2B2118] border-2 border-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase">
                  READY
                </span>
              )}
            </button>

            {/* Hover Tooltip for [Q] Skill */}
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 w-56 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-3 shadow-2xl text-xs">
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

          {/* SLOT 2: [E] PRANK ITEM BIG ICON BUTTON */}
          <div className="relative group">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onTriggerAction('e');
              }}
              disabled={!heldItemSpec}
              aria-label={heldItemSpec ? `Use ${heldItemSpec.name}` : 'Empty Item Slot'}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-3 border-b-8 touch-none transition-all flex flex-col items-center justify-center shadow-2xl ${
                heldItemSpec
                  ? 'bg-[#FEF08A] border-[#2B2118] hover:scale-105 hover:bg-[#FDE047] active:translate-y-1 animate-pulse'
                  : 'bg-[#2B2118]/90 border-[#1A130D]'
              }`}
            >
              {/* Keycap Badge */}
              <span className="absolute -top-2.5 -left-1.5 px-2 py-0.5 rounded-xl bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FFFDF9] text-xs font-black shadow-sm">
                E
              </span>

              <PrankItemEmblem itemId={hud.heldItem} size={52} />

              <span
                className={`absolute -bottom-2 px-2 py-0.5 rounded-full border-2 border-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase ${
                  heldItemSpec
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#3D3024] text-[#D8C5AC]'
                }`}
              >
                {heldItemSpec ? 'USE!' : 'ITEM'}
              </span>
            </button>

            {/* Hover Tooltip for [E] Item Slot */}
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 w-56 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#F59E0B] rounded-2xl p-3 shadow-2xl text-xs">
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

          {/* SLOT 3: [F] SIDEWAYS SLAP ICON BUTTON */}
          <div className="relative group">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onTriggerAction('f');
              }}
              disabled={hud.fCooldown > 0}
              aria-label="Sideways Slap"
              className={`relative w-15 h-15 sm:w-18 sm:h-18 rounded-3xl border-3 border-b-8 touch-none transition-all flex flex-col items-center justify-center shadow-2xl ${
                hud.fCooldown <= 0
                  ? 'bg-[#C86D3B] hover:bg-[#D97706] border-[#2B2118] hover:scale-105 active:translate-y-1'
                  : 'bg-[#3D3024] border-[#1A130D] opacity-85'
              }`}
            >
              <span className="absolute -top-2.5 -left-1.5 px-2 py-0.5 rounded-xl bg-[#2B2118] text-[#FDE047] border-2 border-[#FFFDF9] text-xs font-black shadow-sm">
                F
              </span>

              <ActionButtonEmblem action="slap" size={44} />

              {hud.fCooldown > 0 ? (
                <div className="absolute inset-0 rounded-3xl bg-black/65 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-black text-[#FDE047] game-text-shadow">
                    {hud.fCooldown.toFixed(1)}s
                  </span>
                </div>
              ) : (
                <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#FFFDF9] text-[#2B2118] border-2 border-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase">
                  SLAP
                </span>
              )}
            </button>

            {/* Hover Tooltip for [F] Slap */}
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 w-52 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#C86D3B] rounded-2xl p-3 shadow-2xl text-xs">
              <div className="font-black text-[#FDE047]">[F] Sideways Slap</div>
              <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                Smack nearby rivals sideways off narrow bridges or into water!
              </p>
            </div>
          </div>

          {/* SLOT 4: [SPACE] HOP / JUMP ICON BUTTON */}
          <div className="relative group">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onTriggerAction('jump');
              }}
              aria-label="Hop Jump"
              className="relative w-15 h-15 sm:w-18 sm:h-18 rounded-3xl border-3 border-b-8 border-[#2B2118] bg-[#84CC16] hover:bg-[#A3E635] hover:scale-105 active:translate-y-1 touch-none transition-all flex flex-col items-center justify-center shadow-2xl"
            >
              <span className="absolute -top-2.5 -left-1.5 px-2 py-0.5 rounded-xl bg-[#2B2118] text-[#A3E635] border-2 border-[#FFFDF9] text-[10px] font-black shadow-sm">
                SPC
              </span>

              <ActionButtonEmblem action="hop" size={44} />

              <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#FFFDF9] text-[#2B2118] border-2 border-[#2B2118] text-[9px] sm:text-[10px] font-black uppercase">
                HOP
              </span>
            </button>

            {/* Hover Tooltip for [Space] Hop */}
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-3 z-30 w-48 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#84CC16] rounded-2xl p-3 shadow-2xl text-xs">
              <div className="font-black text-[#A3E635]">[Space] Hop Jump</div>
              <p className="text-[11px] text-[#F3E8D6] mt-1 leading-snug">
                Leap over spinning beams, sticky slime & water ponds!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PRE-RACE LOCKER MODAL (VISUAL ICON GRID + HOVER TOOLTIPS, MINIMAL TEXT!) */}
      {isLobbyOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose Racer, 1 Active Skill and 1 Passive Skill"
        >
          <div className="bg-[#FFFDF9] border-4 border-[#2B2118] border-b-10 rounded-4xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto">
            {/* Visual Game Banner Header + Map Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-4 border-b-3 border-[#EDE3D2] items-stretch">
              <div className="md:col-span-8 relative rounded-3xl overflow-hidden border-3 border-[#2B2118] bg-[#2B2118] min-h-[136px] flex flex-col justify-end p-4 shadow-md">
                <PendingBannerSlot
                  src={GAME_BANNER_ASSETS.raceCrestBanner}
                  alt="BlockyPals 3D Party Race Banner"
                  fileName="race_crest_banner.png"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 flex items-end justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#2B2118] text-[11px] font-black uppercase border border-[#2B2118]">
                      PARTY RACE LOCKER
                    </span>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-wide game-text-shadow">
                      PALS RUSH 3D!
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onStartRace}
                    className="px-6 py-3 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 text-base font-black flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xl"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>RACE!</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-4 relative group rounded-3xl overflow-hidden border-3 border-[#2B2118] bg-[#2B2118] min-h-[136px] flex flex-col justify-end p-3.5 shadow-md">
                <PendingBannerSlot
                  src={GAME_BANNER_ASSETS.circuitMapCard}
                  alt="Grand Circuit Map Preview"
                  fileName="circuit_map_card.png"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2B2118]/90 text-[#A3E635] text-xs font-black border border-[#A3E635]/50">
                    SKYLINE CIRCUIT
                  </span>
                  <span className="text-xs font-black text-white game-text-shadow">
                    1 LAP
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 1: 16 Chibi Characters (Compact Visual Tiles + Hover Tooltip) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-[#2B2118] uppercase tracking-wide">
                  1. Pick Your Pal
                </span>
                <span className="text-xs font-bold text-[#7D6854]">
                  Hover any icon for details
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {CHARACTERS.map((char) => {
                  const isSelected = char.id === selectedCharacter.id;
                  return (
                    <div key={char.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => onSelectCharacter(char.id)}
                        className={`w-full py-2 px-2 rounded-2xl border-3 border-b-5 transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-[#F59E0B] text-[#2B2118] border-[#2B2118] scale-105 shadow-md'
                            : 'bg-[#F8F2E8] text-[#2B2118] border-[#D9C8B0] hover:bg-[#EFE5D5]'
                        }`}
                      >
                        <div className="relative w-8 h-8 rounded-xl border-2 border-[#2B2118] flex items-center justify-center shadow-2xs"
                          style={{ backgroundColor: char.primaryHex }}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: char.secondaryHex }}
                          />
                        </div>
                        <span className="text-xs font-black truncate max-w-full">
                          {char.shortName}
                        </span>
                      </button>

                      {/* Character Hover Tooltip */}
                      <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 w-44 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#F59E0B] rounded-2xl p-2.5 shadow-xl text-center">
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
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* STEP 2: 5 Active Skills [Key Q] */}
              <div className="bg-[#F8F2E8] border-3 border-[#E5D9C5] rounded-3xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-black text-[#C86D3B] uppercase tracking-wide">
                    2. Active Skill [Q]
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#2B2118] text-[#FDE047] text-xs font-black">
                    {activeSkill.name}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ACTIVE_SKILL_LIST.map((skillId) => {
                    const sk = ACTIVE_SKILLS[skillId];
                    const isSelected = skillId === selectedActiveSkillId;
                    return (
                      <div key={sk.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => onSelectActiveSkill(sk.id)}
                          className={`w-full p-2 rounded-2xl border-3 border-b-6 transition-all flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#2B2118] text-[#FDE047] border-[#1A130D] scale-105 shadow-lg'
                              : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#FEF3C7]'
                          }`}
                        >
                          <ActiveSkillEmblem skillId={sk.id} size={52} />
                          <span className="text-[11px] font-black leading-tight text-center truncate w-full">
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
              <div className="bg-[#F8F2E8] border-3 border-[#E5D9C5] rounded-3xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-black text-[#6580B2] uppercase tracking-wide">
                    3. Passive Perk [Auto]
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#2B2118] text-[#38BDF8] text-xs font-black">
                    {passiveSkill.name}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {PASSIVE_SKILL_LIST.map((pId) => {
                    const pk = PASSIVE_SKILLS[pId];
                    const isSelected = pId === selectedPassiveSkillId;
                    return (
                      <div key={pk.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => onSelectPassiveSkill(pk.id)}
                          className={`w-full p-2 rounded-2xl border-3 border-b-6 transition-all flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#2B2118] text-[#38BDF8] border-[#1A130D] scale-105 shadow-lg'
                              : 'bg-[#FFFDF9] text-[#2B2118] border-[#D9C8B0] hover:bg-[#E0F2FE]'
                          }`}
                        >
                          <PassiveSkillEmblem passiveId={pk.id} size={52} />
                          <span className="text-[11px] font-black leading-tight text-center truncate w-full">
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

            {/* Compact Visual Loadout Strip + Big GO Button */}
            <div className="mt-4 pt-3 border-t-3 border-[#EDE3D2] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 bg-[#F8F2E8] px-3.5 py-2 rounded-2xl border-2 border-[#D9C8B0]">
                <span
                  className="w-5 h-5 rounded-lg border-2 border-[#2B2118]"
                  style={{ backgroundColor: selectedCharacter.primaryHex }}
                />
                <span className="text-sm font-black text-[#2B2118]">
                  {selectedCharacter.shortName}
                </span>
                <span className="text-[#C8B69E]">+</span>
                <ActiveSkillEmblem skillId={selectedActiveSkillId} size={32} />
                <span className="text-[#C8B69E]">+</span>
                <PassiveSkillEmblem passiveId={selectedPassiveSkillId} size={32} />
              </div>

              <button
                type="button"
                onClick={onStartRace}
                className="px-8 py-3 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#2B2118] border-3 border-[#2B2118] border-b-6 active:translate-y-0.5 text-base font-black flex items-center gap-2 shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                <span>GO TO STARTING GRID!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST-RACE PODIUM MODAL WITH PR #1 VICTORY TROPHY PNG */}
      {hud.phase === 'finished' && !isLobbyOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Race Results"
        >
          <div className="bg-[#FFFDF9] border-4 border-[#2B2118] border-b-10 rounded-4xl max-w-md w-full p-6 shadow-2xl text-center">
            <PendingBannerSlot
              src={GAME_BANNER_ASSETS.victoryTrophyEmblem}
              alt="Champion Trophy Emblem"
              fileName="victory_trophy_emblem.png"
              className="w-28 h-28 rounded-3xl mx-auto object-cover border-3 border-[#2B2118] shadow-lg"
            />
            <h2 className="mt-3 text-3xl font-black text-[#2B2118]">
              {hud.playerRank === 1
                ? 'CHAMPION!'
                : `${formatOrdinal(hud.playerRank)} PLACE!`}
            </h2>
            <p className="mt-1 text-sm font-bold text-[#6E5A47]">
              {formatRaceTime(hud.elapsedRaceSec)} · {hud.slapsLanded} Slaps
            </p>

            <div className="mt-4 bg-[#F8F2E8] border-3 border-[#E5D9C5] rounded-3xl p-3 text-left space-y-1.5">
              {hud.standings.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between text-xs font-bold px-3 py-1.5 rounded-xl ${
                    r.isPlayer
                      ? 'bg-[#2B2118] text-[#FDE047]'
                      : 'text-[#2B2118]'
                  }`}
                >
                  <span>
                    {r.rank}. {r.shortName} {r.isPlayer ? '(YOU)' : ''}
                  </span>
                  <span>
                    {r.finishTimeSec
                      ? formatRaceTime(r.finishTimeSec)
                      : `${r.progressPercent}%`}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenLobby}
                className="px-4 py-2.5 rounded-2xl border-3 border-[#2B2118] border-b-6 bg-[#F8F2E8] hover:bg-[#EFE5D5] text-sm font-black text-[#2B2118]"
              >
                HEROES
              </button>
              <button
                type="button"
                onClick={onRestartRace}
                className="px-6 py-2.5 rounded-2xl border-3 border-[#2B2118] border-b-6 bg-[#84CC16] hover:bg-[#A3E635] text-sm font-black text-[#2B2118]"
              >
                PLAY AGAIN!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
