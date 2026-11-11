import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  GitMerge,
  GitPullRequest,
  FileText,
  CheckCircle2,
  FolderGit2,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  ACTION_ICON_PATHS,
  ACTIVE_SKILL_ICON_PATHS,
  CHARACTER_AVATAR_PATHS,
  GAME_BANNER_ASSETS,
  PRANK_ITEM_ICON_PATHS,
} from './GameAssetIcons';
import { CHARACTERS } from '../models/characterTypes';

export interface GitAgentHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HubTab = 'topology' | 'reviews' | 'tasks' | 'plans' | 'memory' | 'agents_md';

export const GitAgentHubModal: React.FC<GitAgentHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('topology');

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

  return (
    <div
      onClick={onClose}
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Multi-Agent Git Collaboration Hub"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFDF9] border-2 border-[#2B2118] border-b-8 rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-3.5 border-b-2 border-[#E5D9C5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B2118] text-[#F59E0B] flex items-center justify-center border-2 border-[#2B2118]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2B2118]">
                Multi-Agent Git Message Bus &amp; PR Review Hub
              </h2>
              <p className="text-xs text-[#6E5A47]">
                TASK-001 &amp; TASK-002 Merged · TASK-003 (16 Mode/Map/Dungeon Cards &amp; Menu Icons) Dispatched to Agent 2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-extrabold border-2 border-[#2B2118] border-b-4 active:translate-y-0.5 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.8]" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Navigation Tabs for Repo Folders */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 bg-[#F3E8D6] p-1.5 rounded-2xl border border-[#DFC9AE]">
          {[
            { id: 'topology' as const, label: 'Git Branch & Tasks' },
            { id: 'tasks' as const, label: 'tasks/TASK-003 (OPEN)' },
            { id: 'plans' as const, label: 'plans/PLAN-003 (ACTIVE)' },
            { id: 'reviews' as const, label: 'reviews/PR-002 (APPROVED)' },
            { id: 'memory' as const, label: 'memory/shared_context' },
            { id: 'agents_md' as const, label: 'agents.md' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#2B2118] text-[#FFFDF9] shadow-xs'
                  : 'text-[#5C4938] hover:text-[#2B2118] hover:bg-[#FFFDF9]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Viewport */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'topology' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Real Git Branch Graph & Dispatched TASK-003 */}
              <div className="lg:col-span-7 bg-[#2B2118] text-[#FFFDF9] rounded-2xl p-4 border-2 border-[#2B2118]">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
                  <span className="text-xs font-extrabold text-[#F59E0B] flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4" />
                    <span>GitHub PalsRush-3D-II · Multi-Agent Git Bus</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#FDE047] flex items-center gap-1">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>TASK-003 DISPATCHED TO AGENT 2</span>
                  </span>
                </div>

                <pre className="mt-3 text-xs font-mono leading-relaxed text-[#F3E8D6] overflow-x-auto">
{`* commit (HEAD -> main) [agent-lead-architect]
| feat(task-003): dispatch TASK-003 (16 Mode/Map/Dungeon cards & Menu icons) for Agent 2
* commit [agent-lead-architect]
| feat(ui): review PR-002 & wire 16 character avatars across Lobby, HUD & Podium
*   Merge pull request #1 (TASK-002) from agent/asset-gen/character-avatars
|\\  • Audited in: reviews/PR-002-character-avatars-review.md (0 src/ conflicts)
| * 2e4f29b (origin/agent/asset-gen/character-avatars)
|/  feat(assets): deliver TASK-002 character avatars and manifest`}
                </pre>

                <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">tasks/</div>
                    <div className="text-xs font-extrabold text-[#FDE047] mt-0.5">
                      TASK-003 (OPEN)
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">plans/</div>
                    <div className="text-xs font-extrabold text-[#38BDF8] mt-0.5">
                      PLAN-003 (ACTIVE)
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">memory/</div>
                    <div className="text-xs font-extrabold text-[#A3E635] mt-0.5">
                      shared_context.md
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">reviews/</div>
                    <div className="text-xs font-extrabold text-[#F472B6] mt-0.5">
                      PR-002 (APPROVED)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview of PR-002 (16 Character Avatars) + PR-001 Assets */}
              <div className="lg:col-span-5 bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#2B2118] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C86D3B]" />
                      <span>Agent 2 Delivered Avatars (16× 512×512 PNG)</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#15803D] font-bold">
                      16/16 SHA-256 PASS
                    </span>
                  </div>

                  {/* 16 Character Avatars Grid */}
                  <div className="mt-2.5 grid grid-cols-8 gap-1.5 bg-[#2B2118] p-2.5 rounded-2xl border border-[#1A130D]">
                    {CHARACTERS.map((char) => (
                      <div
                        key={char.id}
                        className="flex flex-col items-center"
                        title={`#${char.index + 1} ${char.name} (${CHARACTER_AVATAR_PATHS[char.id]})`}
                      >
                        <img
                          src={CHARACTER_AVATAR_PATHS[char.id]}
                          alt={char.name}
                          className="w-9 h-9 object-contain"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden border border-[#D9C8B0] bg-[#2B2118]">
                      <img
                        src={GAME_BANNER_ASSETS.raceCrestBanner}
                        alt="race_crest_banner.png"
                        className="w-full h-16 object-cover"
                      />
                      <div className="px-2 py-0.5 text-[10px] font-mono text-[#FFFDF9] truncate">
                        TASK-001 Banners &amp; HUD
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-[#D9C8B0] bg-[#2B2118] flex items-center justify-center gap-1.5 p-2">
                      <img
                        src={ACTIVE_SKILL_ICON_PATHS.dash}
                        alt="skill_dash.png"
                        className="w-7 h-7 object-contain"
                      />
                      <img
                        src={PRANK_ITEM_ICON_PATHS.glove}
                        alt="item_glove.png"
                        className="w-7 h-7 object-contain"
                      />
                      <img
                        src={ACTION_ICON_PATHS.slap}
                        alt="hud_action_slap.png"
                        className="w-7 h-7 object-contain"
                      />
                      <img
                        src={ACTION_ICON_PATHS.hop}
                        alt="hud_action_hop.png"
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E5D9C5] text-[11px] text-[#5C4938] flex items-center justify-between">
                  <span>Branch: agent/asset-gen/character-avatars (2e4f29b)</span>
                  <span className="font-bold text-[#15803D]">MERGED</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#F8F2E8] border-2 border-[#7E9B6B] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                    <span>/reviews/PR-002-character-avatars-review.md — Lead Architect Audit</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#15803D] font-bold flex items-center gap-1">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>APPROVED &amp; MERGED</span>
                  </span>
                </div>
                <ul className="space-y-1.5 text-[#5C4938]">
                  <li>
                    • <strong>Path Isolation:</strong> PASS — 17 files in{' '}
                    <code>public/assets/game/avatars/**</code> + 1 update in{' '}
                    <code>tasks/TASK-002-character-avatars.md</code>. Zero files modified in{' '}
                    <code>src/</code>.
                  </li>
                  <li>
                    • <strong>16 Character Portraits (512×512 RGBA PNG):</strong> PASS — All 16{' '}
                    <code>avatar_&lt;id&gt;.png</code> files verified against{' '}
                    <code>avatar_manifest.json</code> SHA-256 checksums and PNG IHDR headers.
                  </li>
                  <li>
                    • <strong>UI Mount Points Wired:</strong> Character Selection Grid, Hover Tooltips,
                    Loadout Strip, Top-Right Live Standings, Spectator Bar, and Post-Race Podium.
                  </li>
                </ul>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#7E9B6B]" />
                    <span>/reviews/PR-001-hud-assets-review.md — Lead Architect Audit</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#7E9B6B] font-bold">
                    APPROVED &amp; MERGED
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  20 HUD PNGs + 1 Dynamic SVG Rank Shield delivered in Sprint 01.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#FEF3C7] border-2 border-[#D97706] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#FDE68A] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    <span>/tasks/TASK-003-mode-cards-and-menu-icons.md — Assigned to agent-asset-gen (Agent 2)</span>
                  </span>
                  <span className="font-mono text-[11px] bg-[#F59E0B] text-[#2B2118] px-2 py-0.5 rounded font-black">
                    Status: OPEN (Branch: agent/asset-gen/mode-cards-and-menu-icons)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  <strong>16 Visual Assets Requested for Agent 2:</strong> 3 Game Mode Banner Cards (<code>modes/mode_party_race.png</code>, <code>mode_dungeon_raid.png</code>, <code>mode_brawler_pvp.png</code>), 2 Circuit Map Cards (<code>maps/map_woodland_circuit.png</code>, <code>map_glacier_peak.png</code>), 3 Dungeon Stage Cards (<code>dungeons/stage_1..3.png</code>), and 8 Menu &amp; Gear Slot Icons (<code>icons/menu_*.png</code>, <code>slot_*.png</code>) + <code>card_icon_manifest.json</code>.
                </p>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#7E9B6B] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    <span>/tasks/TASK-002-character-avatars.md — Delivered by agent-asset-gen (Agent 2)</span>
                  </span>
                  <span className="font-mono text-[11px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold">
                    Status: MERGED (2e4f29b)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  All 16 playable character avatar PNG portraits (<code>512×512</code>) and{' '}
                  <code>avatar_manifest.json</code> delivered on branch{' '}
                  <code>agent/asset-gen/character-avatars</code>, audited in{' '}
                  <code>reviews/PR-002-character-avatars-review.md</code>, and wired into all UI surfaces.
                </p>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7E9B6B]" />
                    <span>/tasks/TASK-001-hud-assets.md — Delivered by agent-asset-gen</span>
                  </span>
                  <span className="font-mono text-[11px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold">
                    Status: MERGED (26273c0)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  All 7 checklist items completed by <code>agent-asset-gen</code> on
                  branch <code>agent/asset-gen/hud-icons-and-banners</code> and merged into <code>main</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#FEF3C7] border-2 border-[#D97706] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#FDE68A] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <GitPullRequest className="w-4 h-4 text-[#D97706]" />
                    <span>/plans/PLAN-003-mode-cards-and-menu-icons.md — Sprint 03 Blueprint</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#D97706] font-bold">
                    Track B Live · Track A Dispatched to Agent 2
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  <strong>Track A (Agent 2):</strong> Generate 16 high-impact visual cards &amp; menu icons in <code>public/assets/game/{'{modes,maps,dungeons,icons}'}/</code>.<br />
                  <strong>Track B (Lead Architect):</strong> Decluttered English Home Screen + Pre-Game Mode Setup Modals + <code>&lt;VisualImageCard /&gt;</code> &amp; <code>&lt;MenuIconEmblem /&gt;</code> pre-wired to auto-load Agent 2&apos;s PNGs.
                </p>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#7E9B6B] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <GitPullRequest className="w-4 h-4 text-[#15803D]" />
                    <span>/plans/PLAN-002-character-avatars-and-3d-lobby.md — Sprint 02 Blueprint</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#15803D] font-bold">
                    Track A &amp; Track B Complete
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  <strong>Track A:</strong> Reviewed &amp; merged Agent 2&apos;s 16 character avatar PNGs (<code>TASK-002</code>) into all UI mount points.<br />
                  <strong>Track B:</strong> Added unified <code>&apos;cool&apos;</code> hero idle stance animation &amp; Live 3D Character Preview Stage alongside the character selection grid.
                </p>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <GitPullRequest className="w-4 h-4 text-[#C86D3B]" />
                    <span>/plans/PLAN-001-game-hud-overhaul.md — Sprint 01 Blueprint</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#15803D] font-bold">
                    Phase 1–3 Complete
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  Completed full multi-agent cycle: Task Dispatch → Isolated Asset
                  Branch &amp; PR #1 → Lead Architect Review &amp; HUD Integration.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                <span className="font-extrabold text-[#2B2118]">
                  /memory/shared_context.md — Shared Knowledge Base
                </span>
                <span className="font-mono text-[11px] text-[#6E5A47]">
                  Single Source of Truth
                </span>
              </div>
              <p className="text-[#5C4938]">
                Shared semantic colors and PNG-First naming invariants verified
                for both <code>TASK-001</code> (HUD icons) and <code>TASK-002</code> (16 Character Avatars in <code>public/assets/game/avatars/</code>).
              </p>
            </div>
          )}

          {activeTab === 'agents_md' && (
            <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#C86D3B]" />
                  <span>/agents.md — Multi-Agent Constitution & Path Ownership</span>
                </span>
                <span className="text-[11px] font-mono text-[#6E5A47]">
                  Enforced on PR #1
                </span>
              </div>
              <p className="text-[#5C4938]">
                Enforced strict separation of concerns between{' '}
                <code>agent-asset-gen</code> (<code>public/assets/game/</code>) and{' '}
                <code>agent-lead-architect</code> (<code>reviews/</code>,{' '}
                <code>src/</code>).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
