# Shared Agent Memory (`memory/shared_context.md`)

> **Last Updated**: Sprint 01 — Full Game HUD Overhaul & Asset Generation
> **Maintainer**: `agent-lead-architect`
> **Mandatory Read**: All agents (`agent-asset-gen`, `agent-ui-hud`, `agent-gameplay-sim`) must read this file prior to executing any task in `tasks/`.

---

## 1. Visual & Aesthetic Invariants (Toy-Craft Arcade Party Game)

- **Genre & Tone**: 3D Chibi Block Party Obstacle Racing Game (*BlockyPals 3D*). Mischievous, bouncy, colorful, tactile vinyl/clay designer-toy aesthetic.
- **UI Philosophy**: **Game HUD First — Zero Website Chrome**. In Race Mode, the viewport must feel like a full-screen console/arcade party game with floating angled badges, chunky 3D-beveled buttons (`border-b-4`), illustrated skill/item emblems, and a sculpted rank shield.
- **Core Color Tokens**:
  - **Espresso Game Frame**: `#2B2118` (Primary dark HUD plate) / `#1A130D` (Bottom 3D bevel edge)
  - **Warm Ivory Plate**: `#FFFDF9` (Light HUD card surface) / `#D9C8B0` (Card bevel border)
  - **Primary Terracotta / Amber Action**: `#C86D3B` / `#F59E0B`
  - **5 Active Skill Semantic Colors**:
    1. `dash` (*Turbo Dash*): `#F59E0B` (Amber)
    2. `shield` (*Bubble Shield*): `#06B6D4` (Cyan)
    3. `spring` (*Spring Hop*): `#84CC16` (Lime)
    4. `quake` (*Shockwave Stomp*): `#EC4899` (Magenta)
    5. `whirlwind` (*Cyclone Spin*): `#8B5CF6` (Violet)
  - **5 Passive Skill Semantic Colors**:
    1. `nimble_paws` (*Nimble Paws*): `#F59E0B`
    2. `bouncy_belly` (*Bouncy Belly*): `#06B6D4`
    3. `feather_hop` (*Feather Hop*): `#84CC16`
    4. `slime_boots` (*Slime Boots*): `#EC4899`
    5. `lucky_magnet` (*Lucky Pocket*): `#8B5CF6`
  - **5 Prank Item Semantic Colors**:
    1. `glove` (*Boing Boxing Glove*): `#EF4444` (Crimson)
    2. `honey` (*Sticky Honey Trap*): `#F59E0B` (Honey Gold)
    3. `pie` (*Cream Pie Toss*): `#F472B6` (Strawberry Pink)
    4. `pepper` (*Golden Pepper Turbo*): `#EA580C` (Spicy Orange)
    5. `magnet` (*Dizzy Magnet Pull*): `#6366F1` (Indigo)

---

## 2. Asset Naming & Delivery Standards (`agent-asset-gen` — PNG-First Policy)

1. **PNG-First Rule (`20 PNG Files`)**:
   - All banners, skill badges, passive medallions, prank items, and action button icons **MUST** be delivered as `.png` files so they feature rich 3D toy-craft shading, specular highlights, and vinyl textures:
     - **Banners (`public/assets/game/`)**: `race_crest_banner.png` (`16:9`), `victory_trophy_emblem.png` (`1:1`), `circuit_map_card.png` (`16:9`).
     - **Active Skills (`public/assets/game/icons/`)**: `skill_dash.png`, `skill_shield.png`, `skill_spring.png`, `skill_quake.png`, `skill_whirlwind.png`.
     - **Passive Skills (`public/assets/game/icons/`)**: `passive_nimble_paws.png`, `passive_bouncy_belly.png`, `passive_feather_hop.png`, `passive_slime_boots.png`, `passive_lucky_magnet.png`.
     - **Prank Items (`public/assets/game/icons/`)**: `item_glove.png`, `item_honey.png`, `item_pie.png`, `item_pepper.png`, `item_magnet.png`.
     - **Action Controls (`public/assets/game/icons/`)**: `hud_action_slap.png`, `hud_action_hop.png`.
2. **SVG Exception Rule (`1 Dynamic SVG File`)**:
   - Use `.svg` **only** where static PNGs cannot support dynamic runtime parameters:
     - `public/assets/game/icons/hud_rank_shield_frame.svg`: Dynamic `1st–8th` rank shield frame supporting runtime CSS color variables (`Gold`, `Silver`, `Bronze`, `Slate`) and live ordinal text overlay.

