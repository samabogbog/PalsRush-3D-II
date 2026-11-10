import React, { useState } from 'react';
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
  GAME_BANNER_ASSETS,
  PRANK_ITEM_ICON_PATHS,
} from './GameAssetIcons';

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

  if (!isOpen) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Multi-Agent Git Collaboration Hub"
    >
      <div className="bg-[#FFFDF9] border-2 border-[#2B2118] border-b-8 rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-3.5 border-b-2 border-[#E5D9C5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B2118] text-[#F59E0B] flex items-center justify-center border-2 border-[#2B2118]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2B2118]">
                Multi-Agent Git Message Bus & PR #1 Review Hub
              </h2>
              <p className="text-xs text-[#6E5A47]">
                PR #1 from agent-asset-gen Reviewed, Approved & Merged into main (20 PNGs + 1 Dynamic SVG)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-[#2B2118] text-[#FFFDF9] text-xs font-extrabold border-2 border-[#2B2118] border-b-4 active:translate-y-0.5 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Back to Game</span>
          </button>
        </div>

        {/* Navigation Tabs for Repo Folders */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 bg-[#F3E8D6] p-1.5 rounded-2xl border border-[#DFC9AE]">
          {[
            { id: 'topology' as const, label: 'Git Branch & Task Queue' },
            { id: 'tasks' as const, label: 'tasks/TASK-002 (OPEN → Agent 2)' },
            { id: 'plans' as const, label: 'plans/PLAN-002' },
            { id: 'reviews' as const, label: 'reviews/PR-001 (APPROVED)' },
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
              {/* Left: Real Git Branch Graph & Merged PR #1 + Open TASK-002 */}
              <div className="lg:col-span-7 bg-[#2B2118] text-[#FFFDF9] rounded-2xl p-4 border-2 border-[#2B2118]">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
                  <span className="text-xs font-extrabold text-[#F59E0B] flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4" />
                    <span>GitHub PalsRush-3D · Multi-Agent Git Bus</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#FDE047] flex items-center gap-1">
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>TASK-002 DISPATCHED → AGENT 2</span>
                  </span>
                </div>

                <pre className="mt-3 text-xs font-mono leading-relaxed text-[#F3E8D6] overflow-x-auto">
{`* commit (HEAD -> main) [agent-lead-architect]
| feat(lobby): add TASK-002 spec for Agent 2 + 3D character preview & cool pose
|   • Dispatched: tasks/TASK-002-character-avatars.md (Status: OPEN)
|   • Target branch for Agent 2: agent/asset-gen/character-avatars
* commit [agent-lead-architect]
| feat(hud): review PR-001 & wire 20 PNGs + dynamic SVG rank shield into HUD
*   Merge pull request #1 from agent/asset-gen/hud-icons-and-banners
|\\  • Audited in: reviews/PR-001-hud-assets-review.md (0 src/ conflicts)
| * 26273c0 (origin/pr/1, agent/asset-gen/hud-icons-and-banners)
|/  • 20 PNGs + 1 Dynamic SVG + hud_icon_manifest.json (SHA-256 verified)
* d8f2432 (origin/main) fix: transition game assets to PNG-first policy`}
                </pre>

                <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">tasks/</div>
                    <div className="text-xs font-extrabold text-[#FDE047] mt-0.5">
                      TASK-002 (OPEN)
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">plans/</div>
                    <div className="text-xs font-extrabold text-[#38BDF8] mt-0.5">
                      PLAN-002 (ACTIVE)
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
                      PR-001 (APPROVED)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview of PR #1 Delivered PNG Assets */}
              <div className="lg:col-span-5 bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#2B2118] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C86D3B]" />
                      <span>PR #1 Delivered Assets (20 PNGs + 1 SVG)</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#7E9B6B] font-bold">
                      SHA-256 Verified
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="rounded-xl overflow-hidden border border-[#D9C8B0] bg-[#2B2118]">
                      <img
                        src={GAME_BANNER_ASSETS.raceCrestBanner}
                        alt="race_crest_banner.png"
                        className="w-full h-24 object-cover"
                      />
                      <div className="px-2.5 py-1 text-[10px] font-mono text-[#FFFDF9] flex justify-between">
                        <span>race_crest_banner.png (1280×720)</span>
                        <span className="text-[#A3E635]">PR #1 Merged</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl overflow-hidden border border-[#D9C8B0] bg-[#2B2118]">
                        <img
                          src={GAME_BANNER_ASSETS.circuitMapCard}
                          alt="circuit_map_card.png"
                          className="w-full h-20 object-cover"
                        />
                        <div className="px-2 py-1 text-[10px] font-mono text-[#FFFDF9] truncate">
                          circuit_map_card.png
                        </div>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-[#D9C8B0] bg-[#2B2118] flex items-center gap-2 p-2">
                        <img
                          src={GAME_BANNER_ASSETS.victoryTrophyEmblem}
                          alt="victory_trophy_emblem.png"
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex flex-wrap gap-1">
                          <img
                            src={ACTIVE_SKILL_ICON_PATHS.dash}
                            alt="skill_dash.png"
                            className="w-6 h-6 object-contain"
                          />
                          <img
                            src={PRANK_ITEM_ICON_PATHS.glove}
                            alt="item_glove.png"
                            className="w-6 h-6 object-contain"
                          />
                          <img
                            src={ACTION_ICON_PATHS.slap}
                            alt="hud_action_slap.png"
                            className="w-6 h-6 object-contain"
                          />
                          <img
                            src={ACTION_ICON_PATHS.hop}
                            alt="hud_action_hop.png"
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E5D9C5] text-[11px] text-[#5C4938] flex items-center justify-between">
                  <span>Next PR: agent/asset-gen/character-avatars</span>
                  <span className="font-bold text-[#C86D3B]">TASK-002 OPEN</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7E9B6B]" />
                  <span>/reviews/PR-001-hud-assets-review.md — Lead Architect Audit</span>
                </span>
                <span className="font-mono text-[11px] text-[#7E9B6B] font-bold flex items-center gap-1">
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>APPROVED & MERGED</span>
                </span>
              </div>
              <ul className="space-y-1.5 text-[#5C4938]">
                <li>
                  • <strong>Path Isolation:</strong> PASS — 22 asset files in{' '}
                  <code>public/assets/game/**</code> + 1 update in{' '}
                  <code>tasks/TASK-001-hud-assets.md</code>. Zero files modified in{' '}
                  <code>src/</code>.
                </li>
                <li>
                  • <strong>PNG-First Policy:</strong> PASS — 3 PNG banners
                  (1280×720, 800×800) + 17 PNG HUD icons (512×512 with transparent
                  corners) verified against SHA-256 manifest.
                </li>
                <li>
                  • <strong>Dynamic SVG Exception:</strong> PASS — Inlined{' '}
                  <code>hud_rank_shield_frame.svg</code> with dynamic{' '}
                  <code>--shield-outer</code> / <code>--shield-inner</code> rank
                  colors and live ordinal text at <code>(32, 38)</code>.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#F8F2E8] border-2 border-[#F59E0B] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    <span>/tasks/TASK-002-character-avatars.md — Assigned to agent-asset-gen (Agent 2)</span>
                  </span>
                  <span className="font-mono text-[11px] bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded font-bold border border-[#F59E0B]">
                    Status: OPEN (Awaiting Agent 2 PR)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  Specifies all <strong>16 playable character avatar PNG portraits</strong> (<code>512×512</code>) in{' '}
                  <code>public/assets/game/avatars/avatar_&lt;char_id&gt;.png</code> +{' '}
                  <code>avatar_manifest.json</code> on branch <code>agent/asset-gen/character-avatars</code>.
                  UI components are pre-wired with <code>&lt;CharacterAvatarEmblem /&gt;</code> so icons auto-populate upon PR merge.
                </p>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7E9B6B]" />
                    <span>/tasks/TASK-001-hud-assets.md — Delivered by agent-asset-gen</span>
                  </span>
                  <span className="font-mono text-[11px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold">
                    Status: MERGED (PR #1)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  All 7 checklist items completed by <code>agent-asset-gen</code> on
                  branch <code>agent/asset-gen/hud-icons-and-banners</code> (commit{' '}
                  <code>26273c0</code>) and merged into <code>main</code> after review.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#F8F2E8] border-2 border-[#38BDF8] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <GitPullRequest className="w-4 h-4 text-[#0284C7]" />
                    <span>/plans/PLAN-002-character-avatars-and-3d-lobby.md — Sprint 02 Blueprint</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#0284C7] font-bold">
                    Track B Live · Track A Dispatched
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  <strong>Track A:</strong> Dispatched <code>TASK-002</code> to Agent 2 (<code>agent-asset-gen</code>) for 16 character avatar PNGs.<br />
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
