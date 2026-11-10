# Shared Agent Memory (`memory/shared_context.md`)

> **Last Updated**: Sprint 02 — 16 Character Avatar Icons (`TASK-002`) & Live 3D Locker Stage (`PLAN-002`)
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

1. **PNG-First Rule (`TASK-001` — 20 HUD PNGs + `TASK-002` — 16 Character Avatar PNGs)**:
   - All banners, skill badges, passive medallions, prank items, action button icons, and character avatar portraits **MUST** be delivered as `.png` files so they feature rich 3D toy-craft shading, specular highlights, and vinyl textures:
     - **Banners (`public/assets/game/`)**: `race_crest_banner.png` (`16:9`), `victory_trophy_emblem.png` (`1:1`), `circuit_map_card.png` (`16:9`).
     - **Active Skills (`public/assets/game/icons/`)**: `skill_dash.png`, `skill_shield.png`, `skill_spring.png`, `skill_quake.png`, `skill_whirlwind.png`.
     - **Passive Skills (`public/assets/game/icons/`)**: `passive_nimble_paws.png`, `passive_bouncy_belly.png`, `passive_feather_hop.png`, `passive_slime_boots.png`, `passive_lucky_magnet.png`.
     - **Prank Items (`public/assets/game/icons/`)**: `item_glove.png`, `item_honey.png`, `item_pie.png`, `item_pepper.png`, `item_magnet.png`.
     - **Action Controls (`public/assets/game/icons/`)**: `hud_action_slap.png`, `hud_action_hop.png`.
     - **16 Playable Character Avatars (`public/assets/game/avatars/` — `TASK-002`)**:
       - `avatar_bear.png` (`#8B5A3C` / `#E8C39E` / `#D94E41` — Cozy Red Scarf)
       - `avatar_panda.png` (`#F7F4EB` / `#2B2927` / `#68A357` — Bamboo Leaf Collar)
       - `avatar_red_panda.png` (`#D45B3E` / `#F5E1C8` / `#4A3228` — Explorer Satchel Strap)
       - `avatar_raccoon.png` (`#7A7D85` / `#2F3136` / `#E59838` — Gold Star Bandana)
       - `avatar_cat.png` (`#F09B48` / `#FFF3E0` / `#D94E4E` — Crimson Collar & Brass Bell)
       - `avatar_dog.png` (`#E6B87D` / `#8C583A` / `#4A90E2` — Sky-Blue Scarf)
       - `avatar_sheep.png` (`#F8F2E6` / `#F2CCB0` / `#6580B2` — Periwinkle Blue Bow Tie)
       - `avatar_pig.png` (`#F3A79D` / `#E68A7F` / `#F2B53D` — Golden Bandana)
       - `avatar_elephant.png` (`#8FAAC2` / `#F0B0AD` / `#E5AE4E` — Ochre Buttoned Vest)
       - `avatar_hippo.png` (`#A688B0` / `#CBB1D3` / `#DF665F` — Coral Bandana & Chibi Tusks)
       - `avatar_lion.png` (`#F4BC52` / `#C96631` / `#FBE0A2` — 12-Block Crown Mane)
       - `avatar_tiger.png` (`#E88035` / `#59311C` / `#7E9B6B` — Sage Bandana & Stripes)
       - `avatar_penguin.png` (`#55525D` / `#F6F0E4` / `#6581A8` — Sky-Blue Winter Scarf)
       - `avatar_duck.png` (`#F6CD61` / `#E88035` / `#E0675F` — Coral Bow Tie & Head Tuft)
       - `avatar_owl.png` (`#A26B4F` / `#F5E5CE` / `#F0A83A` — Scalloped Feather Chest)
       - `avatar_frog.png` (`#B2C180` / `#D8E2B0` / `#A47FB3` — Lavender Buttoned Vest)
2. **SVG Exception Rule (`1 Dynamic SVG File`)**:
   - Use `.svg` **only** where static PNGs cannot support dynamic runtime parameters:
     - `public/assets/game/icons/hud_rank_shield_frame.svg`: Dynamic `1st–8th` rank shield frame supporting runtime CSS color variables (`Gold`, `Silver`, `Bronze`, `Slate`) and live ordinal text overlay.


