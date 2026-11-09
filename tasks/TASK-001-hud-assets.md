# TASK-001: Generate Party Race Game Banners & HUD Icons (PNG-First + Dynamic SVG Frame)

- **Task ID**: `TASK-001`
- **Assigned To**: `agent-asset-gen`
- **Created By**: `agent-lead-architect`
- **Target Branch**: `agent/asset-gen/hud-icons-and-banners`
- **Related Plan**: `plans/PLAN-001-game-hud-overhaul.md`
- **Shared Context**: `memory/shared_context.md`
- **Status**: `MERGED` *(PR #1 reviewed in `reviews/PR-001-hud-assets-review.md` & integrated into HUD)*

---

## 1. Scope & Strict Format Policy (PNG-First Rule)

> **CRITICAL RULES FOR `agent-asset-gen`**:
> 1. **PNG-First Asset Policy**: Generate **almost all assets as high-contrast, glossy 3D toy-craft PNG images (`.png`)** so the Game HUD has rich, tactile arcade textures, lighting, and depth.
> 2. **SVG Exception Rule**: Use `.svg` **ONLY** where a static PNG cannot work dynamically at runtime — specifically the **Dynamic Rank Shield Frame (`hud_rank_shield_frame.svg`)**, which must dynamically change fill colors (Gold `1st`, Silver `2nd`, Bronze `3rd`, Slate `4th–8th`) and inject live rank numbers (`1st`–`8th`) at 60 FPS.
> 3. **Strict Path Isolation**: Work exclusively on branch `agent/asset-gen/hud-icons-and-banners`. Place files **only** inside `public/assets/game/` and update this task file (`tasks/TASK-001-hud-assets.md`). **DO NOT** touch any file inside `src/`.

---

## 2. Required PNG Deliverables (20 PNG Files)

### A. Game Banners & Trophy Key Art (`public/assets/game/*.png` — 3 PNG Files)

| File Path | Dimensions | Visual Prompt & Style Specification | Target HUD Mount Point |
| :--- | :--- | :--- | :--- |
| `public/assets/game/race_crest_banner.png` | `1280×720` (`16:9` PNG) | Cheerful chibi 3D blocky/voxel animals (bear, panda, cat, frog) sprinting across a vibrant obstacle race track with a high suspension bridge, cyan lagoon, and colorful hot air balloons. Glossy Nintendo/Party arcade key art, no text watermark. | Pre-Race Loadout Locker Header Banner |
| `public/assets/game/victory_trophy_emblem.png` | `800×800` (`1:1` PNG, transparent or `#2B2118` plate) | Chunky golden 3D champion trophy cup decorated with cute block animal ears, sparkling stars, and red/amber victory ribbons. Toy-craft vinyl sheen. | Post-Race Podium & 1st Place Victory Modal |
| `public/assets/game/circuit_map_card.png` | `1280×720` (`16:9` PNG) | Isometric miniature toy diorama overview of the curving race circuit showing the Skyline High Bridge (`+28m`), Roller-Coaster Downhill Slope, Sticky Slime Valley, and Crystal Lagoon. | Pre-Race Track Preview Card |

---

### B. Active Skill Icons (`[Key Q]` — 5 PNG Files in `public/assets/game/icons/`)
*Format*: `512×512` `.png`, rounded arcade badge or transparent background with thick dark espresso (`#2B2118`) outer rim and glossy 3D toy rendering:

1. `public/assets/game/icons/skill_dash.png` — **Turbo Dash (`dash`)**:
   - Glossy 3D rocket-powered chibi running boots shooting bright amber/gold flames (`#F59E0B`) and speed lightning bolts.
2. `public/assets/game/icons/skill_shield.png` — **Bubble Shield (`shield`)**:
   - Iridescent 3D aqua-cyan (`#06B6D4`) elastic bubble sphere with glossy star reflections and a cute block-paw emblem inside.
3. `public/assets/game/icons/skill_spring.png` — **Spring Hop (`spring`)**:
   - Chunky coiled metallic bounce spring on a bright lime (`#84CC16`) game badge with white cartoon jump wings.
4. `public/assets/game/icons/skill_quake.png` — **Shockwave Stomp (`quake`)**:
   - Heavy toy mallet/paw slamming down with glowing magenta (`#EC4899`) and golden seismic shockwave rings.
5. `public/assets/game/icons/skill_whirlwind.png` — **Cyclone Spin (`whirlwind`)**:
   - Swirling 3D violet (`#8B5CF6`) cartoon tornado vortex with flying star blocks and wind ribbons.

---

### C. Passive Skill Icons (`[Automatic Perk]` — 5 PNG Files in `public/assets/game/icons/`)
*Format*: `512×512` `.png`, circular or hexagonal toy medallion badge with glossy 3D relief:

1. `public/assets/game/icons/passive_nimble_paws.png` — **Nimble Paws (`nimble_paws`)**:
   - Golden 3D animal paw print emblem with miniature white speed wings (`#F59E0B` accent).
2. `public/assets/game/icons/passive_bouncy_belly.png` — **Bouncy Belly (`bouncy_belly`)**:
   - Glossy cyan (`#06B6D4`) cushion-shield belly badge deflecting a cartoon impact star.
3. `public/assets/game/icons/passive_feather_hop.png` — **Feather Hop (`feather_hop`)**:
   - Glowing lime-mint (`#84CC16`) magical breeze feather floating over an upward air current.
4. `public/assets/game/icons/passive_slime_boots.png` — **Slime Boots (`slime_boots`)**:
   - Chunky pink/magenta (`#EC4899`) waterproof toy boot with thick lime treads splashing effortlessly through sticky green slime.
5. `public/assets/game/icons/passive_lucky_magnet.png` — **Lucky Pocket (`lucky_magnet`)**:
   - Sparkling four-leaf golden clover tucked into a royal violet (`#8B5CF6`) pouch with a mini cooldown stopwatch spark.

---

### D. Prank Item Icons (`[Key E]` — 5 PNG Files in `public/assets/game/icons/`)
*Format*: `512×512` `.png`, high-contrast 3D toy item icon for the bottom-center Item Slot:

1. `public/assets/game/icons/item_glove.png` — **Boing Boxing Glove (`glove`)**:
   - Bright crimson (`#EF4444`) 3D boxing glove mounted on a compressed silver accordion spring.
2. `public/assets/game/icons/item_honey.png` — **Sticky Honey Trap (`honey`)**:
   - Cute ceramic honey pot overflowing with thick, glossy golden-amber (`#F59E0B`) honey drips and a wooden dipper.
3. `public/assets/game/icons/item_pie.png` — **Cream Pie Toss (`pie`)**:
   - Fluffy whipped-cream pie in a tin dish topped with a shiny red cherry and pink (`#F472B6`) sprinkles.
4. `public/assets/game/icons/item_pepper.png` — **Golden Pepper Turbo (`pepper`)**:
   - Glowing fiery orange-gold (`#EA580C` / `#FDE047`) chili pepper surrounded by cartoon turbo flames.
5. `public/assets/game/icons/item_magnet.png` — **Dizzy Magnet Pull (`magnet`)**:
   - Chunky red-and-blue U-shaped horseshoe magnet shooting indigo/yellow (`#6366F1`) electric arcs.

---

### E. Core Action Button Icons (`[Key F]` & `[Space]` — 2 PNG Files in `public/assets/game/icons/`)
*Format*: `512×512` `.png`, expressive arcade button emblems:

1. `public/assets/game/icons/hud_action_slap.png` — **Sideways Slap (`[F] Slap`)**:
   - Cartoon 3D block-paw slap with comic "POW!" starburst impact lines.
2. `public/assets/game/icons/hud_action_hop.png` — **Hop / Jump (`[Space] Hop`)**:
   - Bouncy 3D upward jump arrow with cartoon dust puffs at the base.

---

## 3. Required SVG Deliverable (ONLY Where PNG Cannot Work — 1 SVG File + Manifest)

### A. Dynamic Parametric Rank Shield (`public/assets/game/icons/hud_rank_shield_frame.svg`)
- **Why SVG Instead of PNG**: The live race rank badge changes continuously between `1st` through `8th` place at 60 FPS and must dynamically recolor its metallic crest (`Gold` for 1st, `Silver` for 2nd, `Bronze` for 3rd, `Slate` for 4th–8th) and render live crisp typography (`1ST`–`8TH`) at any DPI scale.
- **Specification**:
  - `viewBox="0 0 64 64"`, sculpted 3D-beveled shield silhouette with `#2B2118` 4px outer stroke, inner crown/star trim, and CSS variable hooks (`var(--shield-outer, #F59E0B)`, `var(--shield-inner, #FEF08A)`) so `RaceHudOverlay.tsx` can inject live rank colors and ordinal text.

### B. Asset Manifest (`public/assets/game/hud_icon_manifest.json`)
- JSON manifest listing all 20 `.png` paths and 1 `.svg` path, along with their checksum/dimensions and semantic color hex codes from `memory/shared_context.md`.

---

## 4. Acceptance Criteria for Pull Request Review (`reviews/PR-001-hud-assets-review.md`)

When `agent-asset-gen` opens the Pull Request from `agent/asset-gen/hud-icons-and-banners` into `main`, `agent-lead-architect` will verify:
1. **Strict Path Isolation**: `git diff --name-only main...agent/asset-gen/hud-icons-and-banners` touches **only** `public/assets/game/**` and `tasks/TASK-001-hud-assets.md` (zero files modified in `src/`).
2. **PNG-First Compliance**: All 3 banners, 5 Active Skills, 5 Passive Skills, 5 Prank Items, and 2 Action Icons are delivered as `.png` files (`20 PNGs` total).
3. **Minimal SVG Exception**: Only `hud_rank_shield_frame.svg` is delivered as `.svg` for dynamic rank coloring/text overlay.

---

## 5. Agent Execution Checklist (To be completed by `agent-asset-gen`)

- `[x]` Read `agents.md` and `memory/shared_context.md`.
- `[x]` Checked out branch `agent/asset-gen/hud-icons-and-banners`.
- `[x]` Generated 3 PNG banners (`race_crest_banner.png`, `victory_trophy_emblem.png`, `circuit_map_card.png`) in `public/assets/game/`.
- `[x]` Generated 17 PNG HUD icons (5 Active Skills, 5 Passive Skills, 5 Prank Items, 2 Action Buttons) in `public/assets/game/icons/*.png`.
- `[x]` Generated 1 dynamic SVG frame (`public/assets/game/icons/hud_rank_shield_frame.svg`) + `public/assets/game/hud_icon_manifest.json`.
- `[x]` Verified `git status` shows zero changes to `src/`.
- `[x]` Updated `Status` to `READY_FOR_REVIEW` and opened Pull Request #1 to `main`.

## 6. Delivery & Validation (2026-11-09)

- Generated all 20 raster assets using the built-in `image_gen` tool, one generation per asset; normalized to required delivery dimensions with high-quality bicubic resampling, preserving alpha.
- Prompt set: subjects and semantic palette from sections 2A–2E above. Shared direction: single centered readable silhouette, glossy chunky 3D vinyl designer-toy rendering, espresso rim and warm ivory highlights, padding, no watermark. Banners use wide scene composition; icons use transparent backgrounds. Slap uses comic impact lines without lettering.
- Delivered 20 PNGs, one dynamic SVG, and manifest containing dimensions, semantic colors, and SHA-256 checksums.
- Validation passed: all PNG dimensions, transparent corners on all 17 icons, all 21 checksums, SVG XML and 64×64 viewBox; no source-code changes.
- Rank frame integration: inline the SVG so `--shield-outer` and `--shield-inner` inherit from the HUD. An external `<img>` does not inherit parent CSS variables. Overlay ordinal text centered at SVG coordinate (32,38); the frame deliberately contains no static rank. Gold defaults: #F59E0B / #FEF08A; suggested silver #CBD5E1 / #F8FAFC, bronze #C86D3B / #FED7AA, slate #64748B / #CBD5E1. Keep ordinal text accessible in the consuming HUD.
- Pushed task branch and opened PR #1 via the connected GitHub plugin: https://github.com/samabogbog/PalsRush-3D/pull/1. GitHub CLI authentication is invalid, but SSH push and connector PR creation succeeded. No merge performed; lead review remains required.
