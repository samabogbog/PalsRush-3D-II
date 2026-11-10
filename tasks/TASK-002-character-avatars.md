# TASK-002: 16 Playable Character Avatar Icons (`512×512` PNG Portrait Atlas)

- **Task ID**: `TASK-002`
- **Title**: 16 Chibi Animal Character Avatar Icons for Selection Grid, Live Standings, Spectator Bar & Podium UI
- **Status**: `READY_FOR_REVIEW` *(16 avatar PNGs and manifest delivered; awaiting Lead Architect review)*
- **Assigned To**: `agent-asset-gen` (Agent 2 — Visual Asset Specialist)
- **Author / Reviewer**: `agent-lead-architect` (Agent 1 — Lead Architect & Integrator)
- **Target Branch**: `agent/asset-gen/character-avatars`
- **Base Branch**: `main`
- **Related Plan**: `plans/PLAN-002-character-avatars-and-3d-lobby.md`

---

## 1. Objective & Workflow Contract

We need **16 high-craft character avatar icons** (`.png`) representing each of the 16 playable blocky chibi animals in **BlockyPals 3D — Party Race Game**.

### Multi-Agent Handoff Rules:
1. **`agent-lead-architect` (Agent 1)** has authored this specification and prepared `<CharacterAvatarEmblem character={...} />` in `src/components/GameAssetIcons.tsx`, which automatically binds to `/assets/game/avatars/avatar_<id>.png` and renders a clean color-block fallback until Agent 2's Pull Request is merged.
2. **`agent-asset-gen` (Agent 2)** will branch off `main` into `agent/asset-gen/character-avatars`, generate all **16 PNG avatar files** + **`avatar_manifest.json`**, update `Status: READY_FOR_REVIEW` in this file, and open a Pull Request.
3. Once Agent 2 submits the Pull Request, **`agent-lead-architect` (Agent 1)** will audit the deliverables in `reviews/PR-002-character-avatars-review.md`, merge into `main`, and verify all 16 character portraits across the Pre-Race Character Picker, In-Race Standings HUD, Live Spectator Switcher, and Post-Race Podium.

---

## 2. Strict Path Ownership Boundaries

- **Permitted Write Paths for `agent-asset-gen` (Agent 2)**:
  - `public/assets/game/avatars/*.png`
  - `public/assets/game/avatars/avatar_manifest.json`
  - `tasks/TASK-002-character-avatars.md` *(status field & delivery checklist update only)*
- **Strictly Forbidden Paths for `agent-asset-gen` (Agent 2)**:
  - `src/**` *(Do NOT modify React components, Three.js scenes, or game engine code)*
  - `plans/**`, `reviews/**`, `memory/**`

---

## 3. Global Art Direction & Technical Specifications (PNG-First Policy)

Every avatar icon **MUST** follow the unified **Tactile Vinyl Chibi Arcade** aesthetic established in `memory/shared_context.md`:

- **Format**: `.png` (lossless PNG)
- **Dimensions**: `512 × 512 px` (1:1 square aspect ratio)
- **Framing & Composition**:
  - Close-up **3/4-angle bust portrait (head, ears, and upper shoulders with signature neck/chest accessory)** centered inside the frame, occupying **82%–88%** of the canvas so the face remains unmistakably readable even at `28×28 px` in the live race standings and `48×48 px` in the character picker.
  - **Proportions**: Oversized rounded blocky chibi head (`1.35 : 1` head-to-body ratio), soft bevelled edges (`bevelRadius ~0.34u`), glossy dark-espresso button eyes with crisp white catchlights, rosy pastel cheek blushes, and cheerful/confident expression.
  - **Material & Lighting**: Matte soft-touch vinyl/clay toy finish (`roughness 0.50`) with warm key light from top-left, soft golden rim light, and a bold **Dark Espresso (`#2B2118`)** outer contour/badge frame so every icon pops against both Warm Cream (`#FFFDF9`) and Dark Espresso (`#2B2118`) UI surfaces.
  - **Zero Text Rule**: Strictly **NO text, NO numbers, NO letters, and NO watermarks** inside any avatar image.

---

## 4. Exact 16-Character Avatar Deliverables (`public/assets/game/avatars/`)

All 16 files must be saved under `public/assets/game/avatars/` using the exact filenames below:

### Row 1 — Woodland Pals (`01` – `04`)

| # | Character ID | Target File Path | Name & Species | Primary / Secondary / Accent Hex | Mandatory Visual Details & Prompt Spec |
| :- | :--- | :--- | :--- | :--- | :--- |
| **01** | `bear` | `public/assets/game/avatars/avatar_bear.png` | **Bramble Bear** *(Honey Brown Bear Cub)* | Primary: `#8B5A3C`<br>Secondary: `#E8C39E`<br>Accent: `#D94E41` | Warm honey-brown rounded blocky bear cub head, cream muzzle (`#E8C39E`), round teddy ears, wearing a **Cozy Red Knitted Scarf (`#D94E41`)** around the neck, cheerful confident grin, soft amber-cream badge backdrop with `#2B2118` border. |
| **02** | `panda` | `public/assets/game/avatars/avatar_panda.png` | **Mochi Panda** *(Giant Bamboo Panda)* | Primary: `#F7F4EB`<br>Secondary: `#2B2927`<br>Accent: `#68A357` | Creamy-white blocky chibi panda head (`#F7F4EB`), charcoal-black round ears and iconic eye patches (`#2B2927`), rosy cheeks, wearing a **Fresh Green Bamboo Leaf Collar (`#68A357`)** with a tiny leaf sprout, `#2B2118` border. |
| **03** | `red_panda` | `public/assets/game/avatars/avatar_red_panda.png` | **Rusty Red Panda** *(Himalayan Red Panda)* | Primary: `#D45B3E`<br>Secondary: `#F5E1C8`<br>Accent: `#4A3228` | Cinnamon-rust blocky red panda head (`#D45B3E`), cream-white cheek masks & eyebrows (`#F5E1C8`), pointed fluffy ears, wearing an **Explorer Satchel Strap (`#4A3228`)** across the shoulder, curious peppy smile, `#2B2118` border. |
| **04** | `raccoon` | `public/assets/game/avatars/avatar_raccoon.png` | **Bandit Raccoon** *(Rascal Trash Panda)* | Primary: `#7A7D85`<br>Secondary: `#2F3136`<br>Accent: `#E59838` | Slate-grey blocky raccoon head (`#7A7D85`), dark charcoal bandit mask across the eyes (`#2F3136`) with white brow trim, wearing a **Gold Star Bandana (`#E59838`)** tied at the neck, cheeky mischievous smirk, `#2B2118` border. |

### Row 2 — Farm & Pet Pals (`05` – `08`)

| # | Character ID | Target File Path | Name & Species | Primary / Secondary / Accent Hex | Mandatory Visual Details & Prompt Spec |
| :- | :--- | :--- | :--- | :--- | :--- |
| **05** | `cat` | `public/assets/game/avatars/avatar_cat.png` | **Marmalade Cat** *(Ginger Tabby Kitten)* | Primary: `#F09B48`<br>Secondary: `#FFF3E0`<br>Accent: `#D94E4E` | Sunny ginger-orange blocky kitten head (`#F09B48`) with darker tabby forehead stripes, cream chin/cheeks (`#FFF3E0`), triangular ears, wearing a **Crimson Collar & Golden Brass Bell (`#D94E4E`)**, sassy confident wink/smile, `#2B2118` border. |
| **06** | `dog` | `public/assets/game/avatars/avatar_dog.png` | **Biscuit Puppy** *(Golden Retriever Pup)* | Primary: `#E6B87D`<br>Secondary: `#8C583A`<br>Accent: `#4A90E2` | Biscuit-gold blocky puppy head (`#E6B87D`), chocolate-brown floppy asymmetric ears (`#8C583A`), happy pink tongue blep, wearing a **Sky-Blue Scarf (`#4A90E2`)**, loyal bouncy expression, `#2B2118` border. |
| **07** | `sheep` | `public/assets/game/avatars/avatar_sheep.png` | **Cloudy Sheep** *(Fluffy Wool Lamb)* | Primary: `#F8F2E6`<br>Secondary: `#F2CCB0`<br>Accent: `#6580B2` | Puffy cloud-white wool poof crown & fleece (`#F8F2E6`), warm peach-beige face (`#F2CCB0`), droopy lamb ears, wearing a **Periwinkle Blue Bow Tie (`#6580B2`)**, dreamy gentle smile, `#2B2118` border. |
| **08** | `pig` | `public/assets/game/avatars/avatar_pig.png` | **Peachy Piglet** *(Rosy Meadow Piglet)* | Primary: `#F3A79D`<br>Secondary: `#E68A7F`<br>Accent: `#F2B53D` | Rosy peach-pink blocky piglet head (`#F3A79D`), prominent rounded snout (`#E68A7F`) with two nostrils, perky folded ears, wearing a **Golden Yellow Bandana (`#F2B53D`)**, upbeat joyful grin, `#2B2118` border. |

### Row 3 — Safari Crew (`09` – `12`)

| # | Character ID | Target File Path | Name & Species | Primary / Secondary / Accent Hex | Mandatory Visual Details & Prompt Spec |
| :- | :--- | :--- | :--- | :--- | :--- |
| **09** | `elephant` | `public/assets/game/avatars/avatar_elephant.png` | **Bumbo Elephant** *(Powder-Blue Baby Elephant)* | Primary: `#8FAAC2`<br>Secondary: `#F0B0AD`<br>Accent: `#E5AE4E` | Powder-blue blocky baby elephant head (`#8FAAC2`), wide fan ears with pastel-pink inner ear panels (`#F0B0AD`), cute curved blocky trunk, wearing an **Ochre Buttoned Vest (`#E5AE4E`)**, `#2B2118` border. |
| **10** | `hippo` | `public/assets/game/avatars/avatar_hippo.png` | **Bubbles Hippo** *(Lavender River Hippo)* | Primary: `#A688B0`<br>Secondary: `#CBB1D3`<br>Accent: `#DF665F` | Lavender-purple blocky hippo head (`#A688B0`) with extra-wide lilac muzzle (`#CBB1D3`), two tiny white chibi tusks, tiny round ears on top, wearing a **Coral Neck Bandana (`#DF665F`)**, jolly smile, `#2B2118` border. |
| **11** | `lion` | `public/assets/game/avatars/avatar_lion.png` | **Sunny Lion** *(Golden Savannah Cub)* | Primary: `#F4BC52`<br>Secondary: `#C96631`<br>Accent: `#FBE0A2` | Golden-yellow blocky lion cub face (`#F4BC52`) framed by a **12-Block Terracotta Crown Mane (`#C96631`)**, cream muzzle (`#FBE0A2`), proud fearless hero grin, `#2B2118` border. |
| **12** | `tiger` | `public/assets/game/avatars/avatar_tiger.png` | **Tango Tiger** *(Striped Bengal Tiger Cub)* | Primary: `#E88035`<br>Secondary: `#59311C`<br>Accent: `#7E9B6B` | Bright tangerine-orange blocky tiger head (`#E88035`) with espresso-brown forehead & cheek stripes (`#59311C`), cream muzzle puffs, wearing a **Sage-Green Bandana (`#7E9B6B`)**, energetic grin, `#2B2118` border. |

### Row 4 — Birds & Pond Pals (`13` – `16`)

| # | Character ID | Target File Path | Name & Species | Primary / Secondary / Accent Hex | Mandatory Visual Details & Prompt Spec |
| :- | :--- | :--- | :--- | :--- | :--- |
| **13** | `penguin` | `public/assets/game/avatars/avatar_penguin.png` | **Puddle Penguin** *(Chilly Chick Penguin)* | Primary: `#55525D`<br>Secondary: `#F6F0E4`<br>Accent: `#6581A8` | Slate-charcoal blocky penguin head (`#55525D`) with snow-cream face/belly patch (`#F6F0E4`), bright orange triangular beak, wearing a **Cozy Sky-Blue Winter Scarf (`#6581A8`)**, peppy cool look, `#2B2118` border. |
| **14** | `duck` | `public/assets/game/avatars/avatar_duck.png` | **Quackers Duck** *(Buttercup Pond Duckling)* | Primary: `#F6CD61`<br>Secondary: `#E88035`<br>Accent: `#E0675F` | Buttercup-yellow blocky duckling head (`#F6CD61`) with bouncy top head feather tuft, wide tangerine-orange bill (`#E88035`), wearing a **Coral Bow Tie (`#E0675F`)**, giddy cheerful look, `#2B2118` border. |
| **15** | `owl` | `public/assets/game/avatars/avatar_owl.png` | **Hooty Owl** *(Chestnut Woodland Owl)* | Primary: `#A26B4F`<br>Secondary: `#F5E5CE`<br>Accent: `#F0A83A` | Chestnut-brown blocky owl head (`#A26B4F`) with large cream facial discs (`#F5E5CE`), angled feather ear tufts, golden beak (`#F0A83A`), and **Scalloped Feather ChestPlumage**, wise alert expression, `#2B2118` border. |
| **16** | `frog` | `public/assets/game/avatars/avatar_frog.png` | **Matcha Frog** *(Tree-Top Hopper Frog)* | Primary: `#B2C180`<br>Secondary: `#D8E2B0`<br>Accent: `#A47FB3` | Matcha-green blocky frog head (`#B2C180`) with two big top-mounted eyes, wide happy smile, pale-green chin (`#D8E2B0`), wearing a **Lavender Buttoned Vest (`#A47FB3`)**, hyper springy expression, `#2B2118` border. |

---

## 5. Required Manifest File (`public/assets/game/avatars/avatar_manifest.json`)

In addition to the 16 `.png` files, `agent-asset-gen` must create `public/assets/game/avatars/avatar_manifest.json` with the following schema so automated checks and the Lead Architect can verify completeness:

```json
{
  "taskId": "TASK-002",
  "agent": "agent-asset-gen",
  "resolution": "512x512",
  "format": "png",
  "avatars": [
    { "id": "bear", "name": "Bramble Bear", "path": "/assets/game/avatars/avatar_bear.png" },
    { "id": "panda", "name": "Mochi Panda", "path": "/assets/game/avatars/avatar_panda.png" },
    { "id": "red_panda", "name": "Rusty Red Panda", "path": "/assets/game/avatars/avatar_red_panda.png" },
    { "id": "raccoon", "name": "Bandit Raccoon", "path": "/assets/game/avatars/avatar_raccoon.png" },
    { "id": "cat", "name": "Marmalade Cat", "path": "/assets/game/avatars/avatar_cat.png" },
    { "id": "dog", "name": "Biscuit Puppy", "path": "/assets/game/avatars/avatar_dog.png" },
    { "id": "sheep", "name": "Cloudy Sheep", "path": "/assets/game/avatars/avatar_sheep.png" },
    { "id": "pig", "name": "Peachy Piglet", "path": "/assets/game/avatars/avatar_pig.png" },
    { "id": "elephant", "name": "Bumbo Elephant", "path": "/assets/game/avatars/avatar_elephant.png" },
    { "id": "hippo", "name": "Bubbles Hippo", "path": "/assets/game/avatars/avatar_hippo.png" },
    { "id": "lion", "name": "Sunny Lion", "path": "/assets/game/avatars/avatar_lion.png" },
    { "id": "tiger", "name": "Tango Tiger", "path": "/assets/game/avatars/avatar_tiger.png" },
    { "id": "penguin", "name": "Puddle Penguin", "path": "/assets/game/avatars/avatar_penguin.png" },
    { "id": "duck", "name": "Quackers Duck", "path": "/assets/game/avatars/avatar_duck.png" },
    { "id": "owl", "name": "Hooty Owl", "path": "/assets/game/avatars/avatar_owl.png" },
    { "id": "frog", "name": "Matcha Frog", "path": "/assets/game/avatars/avatar_frog.png" }
  ]
}
```

---

## 6. UI Integration Points (Prepared by `agent-lead-architect`)

Once `agent-asset-gen` opens the Pull Request and `agent-lead-architect` merges `agent/asset-gen/character-avatars` into `main`, these 16 avatars will populate:
1. **Pre-Race Character Selection Grid (`RaceHudOverlay.tsx`)**: All 16 character cards in Step 1 (`1. Pick Your Pal`) alongside the Live 3D Character Preview Stage.
2. **Loadout Summary Pill (`RaceHudOverlay.tsx`)**: Bottom loadout bar next to the Active Skill & Passive Skill emblems.
3. **Top-Right Live Standings Board (`RaceHudOverlay.tsx`)**: Compact `24×24 px` racer portraits next to rank numbers (`1st`–`8th`).
4. **Post-Race Podium & Live Spectator Bar (`RaceHudOverlay.tsx`)**: Winner/Runner-up standings rows and spectator target switcher pills.

---

## 7. Acceptance Criteria Checklist (For `agent-asset-gen` PR Submission)

- [x] All 16 `avatar_<id>.png` files exist in `public/assets/game/avatars/` at `512×512` resolution.
- [x] `public/assets/game/avatars/avatar_manifest.json` exists and lists all 16 character IDs.
- [x] Each avatar matches the character's primary/secondary/accent hex colors and signature accessory in §4.
- [x] Zero text/letters/numbers baked into any PNG image.
- [x] Zero modifications to `src/**` files in the `agent/asset-gen/character-avatars` branch.


### Delivery checklist — 2026-11-10

- [x] Generated one image per character using built-in `image_gen` (16 generations); no CLI/API fallback.
- [x] Prompt set: each character specification from section 4, with centered 3/4 rounded-block chibi bust, soft-touch vinyl/clay, warm top-left key and golden rim light, espresso outline and cream badge, transparent outside, no text/numbers/watermark.
- [x] Preserved alpha and proportionally normalized each silhouette into centered 450px bounds on a 512px transparent canvas (87.9% occupancy).
- [x] Manifest lists all 16 exact IDs, names, paths, dimensions, SHA-256 checksums, and generation provenance.
- [x] Verified all files decode as 512x512 RGBA PNG, transparent corners, complete unique IDs, valid paths and matching checksums.
- [x] Visually inspected all portraits together on warm ivory and at 24/28/48px on espresso; character identities and signature accessories remain distinguishable. No baked text observed.
- [x] Changes limited to avatar delivery paths and this task's status/checklist; no source changes.
- [ ] Lead Architect review, merge and in-game verification at every planned UI mount point.
