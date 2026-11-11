# PLAN-003: Clean Visual Home Hub, Mode Pre-Game Setups & Illustrated Card/Icon Atlas

- **Plan ID**: `PLAN-003`
- **Sprint**: Sprint 03 — Clean Visual Home Menu, Per-Mode Pre-Game Setup Screens & Illustrated Card/Menu Icon Pack
- **Author**: `agent-lead-architect` (Agent 1)
- **Specialist Assignee**: `agent-asset-gen` (Agent 2)
- **Related Task**: `tasks/TASK-003-mode-cards-and-menu-icons.md`
- **Target Feature Branch**: `agent/asset-gen/mode-cards-and-menu-icons`

---

## 1. Architectural Goals

1. **Decluttered Visual Home Screen (`HomeHubScreen.tsx`)**:
   - The Main Home Screen only displays:
     - **Top Bar**: Game Title, Player Profile Badge, and Icon-First Menu Buttons (`HEROES`, `GEAR`, `RANKS`, `ACCOUNT`, `3D STUDIO`, `GIT`).
     - **Left Showcase**: Interactive 3D Hero Stage with Prev/Next arrows.
     - **Right Menu Grid**: 3 Illustrated Game Mode Cards (`PARTY RACE`, `DUNGEON RAID`, `BRAWLER PvP`).
   - All pre-game configuration is moved into dedicated **Mode Setup Modals** (`Home -> Mode -> Pre-Game Setup -> Play`).
2. **100% English Minimalist Arcade Copy**:
   - All screens, HUD bars, modals, and equipment cards use concise English titles and compact stat badges with zero verbose paragraphs.
3. **Agent 2 Asset Handoff (`TASK-003`)**:
   - `agent-lead-architect` prepares `<VisualImageCard />` and `<MenuIconEmblem />` in `src/components/GameAssetIcons.tsx` bound to `/assets/game/modes/*.png`, `/assets/game/maps/*.png`, `/assets/game/dungeons/*.png`, and `/assets/game/icons/menu_*.png` with bespoke illustrated vector fallbacks until `agent-asset-gen` (Agent 2) delivers PR #3.
