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
  CHARACTER_AVATAR_PATHS,
  DUNGEON_STAGE_CARD_PATHS,
  MAP_CARD_PATHS,
  MENU_ICON_PATHS,
  MODE_CARD_PATHS,
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
                TASK-001, TASK-002 &amp; TASK-003 (16 Mode/Map/Dungeon Cards &amp; Menu Icons by Agent 2) Audited, Approved &amp; Merged
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
            { id: 'topology' as const, label: 'Git Branch & PR #2 Merged' },
            { id: 'reviews' as const, label: 'reviews/PR-003 (APPROVED)' },
            { id: 'tasks' as const, label: 'tasks/TASK-003 (MERGED)' },
            { id: 'plans' as const, label: 'plans/PLAN-003 (DONE)' },
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
              {/* Left: Real Git Branch Graph & Merged TASK-003 */}
              <div className="lg:col-span-6 bg-[#2B2118] text-[#FFFDF9] rounded-2xl p-4 border-2 border-[#2B2118] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
                    <span className="text-xs font-extrabold text-[#F59E0B] flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4" />
                      <span>GitHub PalsRush-3D-II · Multi-Agent Git Bus</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#A3E635] flex items-center gap-1">
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>TASK-003 MERGED</span>
                    </span>
                  </div>

                  <pre className="mt-3 text-xs font-mono leading-relaxed text-[#F3E8D6] overflow-x-auto">
{`* commit (HEAD -> main) [agent-lead-architect]
| feat(ui): review PR-003 & integrate 16 mode/map/dungeon cards & menu icons
*   Merge pull request #2 (TASK-003) from agent/asset-gen/mode-cards-and-menu-icons
|\\  • Audited in: reviews/PR-003-mode-cards-and-menu-icons-review.md (16/16 PASS)
| * 2e74978 (origin/pr/2, origin/agent/asset-gen/mode-cards-and-menu-icons)
|/  feat(assets): deliver TASK-003 game cards and menu icons
* 5ecbfed feat(task-003): declutter Home & dispatch TASK-003
*   Merge pull request #1 (TASK-002) from agent/asset-gen/character-avatars
|\\  • Audited in: reviews/PR-002-character-avatars-review.md`}
                  </pre>
                </div>

                <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">tasks/</div>
                    <div className="text-xs font-extrabold text-[#A3E635] mt-0.5">
                      TASK-003 (MERGED)
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">plans/</div>
                    <div className="text-xs font-extrabold text-[#38BDF8] mt-0.5">
                      PLAN-003 (DONE)
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">memory/</div>
                    <div className="text-xs font-extrabold text-[#FDE047] mt-0.5">
                      shared_context.md
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-[10px] text-[#D8C5AC]">reviews/</div>
                    <div className="text-xs font-extrabold text-[#F472B6] mt-0.5">
                      PR-003 (APPROVED)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview of PR-003 (16 Mode/Map/Dungeon Cards & Menu Icons) + PR-002 Avatars */}
              <div className="lg:col-span-6 bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#2B2118] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C86D3B]" />
                      <span>Agent 2 Delivered TASK-003 (8× 1280×720 Cards + 8× 512×512 Icons)</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#15803D] font-bold">
                      16/16 SHA-256 PASS
                    </span>
                  </div>

                  {/* 3 Mode Cards + 2 Map Cards + 3 Dungeon Cards */}
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'Party Race', src: MODE_CARD_PATHS.party_race },
                      { id: 'Dungeon Raid', src: MODE_CARD_PATHS.dungeon_raid },
                      { id: 'Brawler PvP', src: MODE_CARD_PATHS.brawler_pvp },
                      { id: 'Woodland Map', src: MAP_CARD_PATHS.woodland },
                      { id: 'Glacier Map', src: MAP_CARD_PATHS.snow_glacier },
                      { id: 'Stage 1 Slime', src: DUNGEON_STAGE_CARD_PATHS[1] },
                      { id: 'Stage 2 Lava', src: DUNGEON_STAGE_CARD_PATHS[2] },
                      { id: 'Stage 3 Frost', src: DUNGEON_STAGE_CARD_PATHS[3] },
                    ].map((card) => (
                      <div
                        key={card.id}
                        className="rounded-lg overflow-hidden border border-[#2B2118] bg-[#2B2118]"
                      >
                        <img
                          src={card.src}
                          alt={card.id}
                          className="w-full h-11 object-cover"
                        />
                        <div className="px-1.5 py-0.5 text-[9px] font-bold text-[#FFFDF9] truncate">
                          {card.id}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 8 Menu & Slot Icons */}
                  <div className="mt-2 grid grid-cols-8 gap-1.5 bg-[#2B2118] p-2 rounded-xl border border-[#1A130D]">
                    {[
                      { id: 'menu_home', src: MENU_ICON_PATHS.home },
                      { id: 'menu_heroes', src: MENU_ICON_PATHS.heroes },
                      { id: 'menu_gear', src: MENU_ICON_PATHS.gear },
                      { id: 'menu_ranks', src: MENU_ICON_PATHS.ranks },
                      { id: 'menu_account', src: MENU_ICON_PATHS.account },
                      { id: 'slot_weapon', src: MENU_ICON_PATHS.weapon },
                      { id: 'slot_headgear', src: MENU_ICON_PATHS.headgear },
                      { id: 'slot_cape_aura', src: MENU_ICON_PATHS.cape },
                    ].map((ic) => (
                      <div
                        key={ic.id}
                        className="flex items-center justify-center"
                        title={ic.id}
                      >
                        <img
                          src={ic.src}
                          alt={ic.id}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    ))}
                  </div>

                  {/* 16 Character Avatars Strip */}
                  <div className="mt-2 grid grid-cols-16 gap-1 bg-[#2B2118]/90 p-1.5 rounded-xl">
                    {CHARACTERS.map((char) => (
                      <img
                        key={char.id}
                        src={CHARACTER_AVATAR_PATHS[char.id]}
                        alt={char.name}
                        title={char.name}
                        className="w-6 h-6 object-contain"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5D9C5] text-[11px] text-[#5C4938] flex items-center justify-between">
                  <span>Branch: agent/asset-gen/mode-cards-and-menu-icons (2e74978)</span>
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
                    <span>/reviews/PR-003-mode-cards-and-menu-icons-review.md — Lead Architect Audit</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#15803D] font-bold flex items-center gap-1">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>APPROVED &amp; MERGED (2e74978)</span>
                  </span>
                </div>
                <ul className="space-y-1.5 text-[#5C4938]">
                  <li>
                    • <strong>Path Isolation:</strong> PASS — 18 files in{' '}
                    <code>public/assets/game/{'{modes,maps,dungeons,icons}'}/**</code> +{' '}
                    <code>mode_card_manifest.json</code> +{' '}
                    <code>tasks/TASK-003-mode-cards-and-menu-icons.md</code>. Zero files modified in{' '}
                    <code>src/</code>.
                  </li>
                  <li>
                    • <strong>8 Landscape Cards (1280×720) &amp; 8 Square Icons (512×512):</strong> PASS — All 16 PNGs verified against{' '}
                    <code>mode_card_manifest.json</code> SHA-256 checksums and PNG IHDR headers (<code>16/16 PASS</code>).
                  </li>
                  <li>
                    • <strong>UI Mount Points Wired:</strong> Main Home Mode Deck, Top Icon Navigation Bar, Party Race Circuit Cards, Dungeon Raid Stage 1–3 Cards, and 4-Slot Gear Armory Tabs.
                  </li>
                </ul>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#7E9B6B] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                    <span>/reviews/PR-002-character-avatars-review.md — Lead Architect Audit</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#15803D] font-bold">
                    APPROVED &amp; MERGED (2e4f29b)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  16 Playable Character Avatars (<code>512×512</code> RGBA PNG) + <code>avatar_manifest.json</code> audited and merged in Sprint 02.
                </p>
              </div>

              <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#7E9B6B]" />
                    <span>/reviews/PR-001-hud-assets-review.md — Lead Architect Audit</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#7E9B6B] font-bold">
                    APPROVED &amp; MERGED (26273c0)
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
              <div className="bg-[#F8F2E8] border-2 border-[#7E9B6B] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    <span>/tasks/TASK-003-mode-cards-and-menu-icons.md — Delivered by agent-asset-gen (Agent 2)</span>
                  </span>
                  <span className="font-mono text-[11px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold">
                    Status: MERGED (2e74978)
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  All 16 visual assets — 3 Game Mode Banner Cards (<code>modes/mode_*.png</code>), 2 Circuit Map Cards (<code>maps/map_*.png</code>), 3 Dungeon Stage Cards (<code>dungeons/stage_*.png</code>), and 8 Menu &amp; Gear Slot Icons (<code>icons/menu_*.png</code>, <code>slot_*.png</code>) + <code>mode_card_manifest.json</code> — delivered on branch <code>agent/asset-gen/mode-cards-and-menu-icons</code>, audited in <code>reviews/PR-003-mode-cards-and-menu-icons-review.md</code>, and integrated into the game UI.
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
                  <code>agent/asset-gen/character-avatars</code>.
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
              <div className="bg-[#F8F2E8] border-2 border-[#7E9B6B] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                  <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                    <GitPullRequest className="w-4 h-4 text-[#15803D]" />
                    <span>/plans/PLAN-003-mode-cards-and-menu-icons.md — Sprint 03 Blueprint</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#15803D] font-bold">
                    Track A &amp; Track B Complete
                  </span>
                </div>
                <p className="text-[#5C4938]">
                  <strong>Track A (Agent 2):</strong> Delivered 16 high-impact visual cards &amp; menu icons in <code>public/assets/game/{'{modes,maps,dungeons,icons}'}/</code>.<br />
                  <strong>Track B (Lead Architect):</strong> Decluttered English Home Screen + Pre-Game Mode Setup Modals + <code>&lt;VisualImageCard /&gt;</code> &amp; <code>&lt;MenuIconEmblem /&gt;</code> wired with Agent 2&apos;s PNGs.
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
                  Reviewed &amp; merged Agent 2&apos;s 16 character avatar PNGs (<code>TASK-002</code>) alongside the Live 3D Character Preview Stage.
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
                across <code>TASK-001</code> (HUD icons), <code>TASK-002</code> (16 Character Avatars), and <code>TASK-003</code> (16 Mode/Map/Dungeon Cards &amp; Menu Icons).
              </p>
            </div>
          )}

          {activeTab === 'agents_md' && (
            <div className="bg-[#F8F2E8] border-2 border-[#E5D9C5] rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-2">
                <span className="font-extrabold text-[#2B2118] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#C86D3B]" />
                  <span>/agents.md — Multi-Agent Constitution &amp; Path Ownership</span>
                </span>
                <span className="text-[11px] font-mono text-[#6E5A47]">
                  Enforced on PR #1 &amp; PR #2
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
