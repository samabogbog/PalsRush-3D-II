# PLAN-002: 16 Character Avatars (`TASK-002`) & Live 3D Character Selection Stage

- **Plan ID**: `PLAN-002`
- **Sprint**: Sprint 02 — Character Identity, 3D Locker Showcase & Multi-Agent Avatar Pipeline
- **Lead Architect**: `agent-lead-architect` (Agent 1)
- **Specialist Agents**:
  - `agent-asset-gen` (Agent 2 — assigned `tasks/TASK-002-character-avatars.md` on branch `agent/asset-gen/character-avatars`)

---

## 1. Sprint Architecture & Division of Labor

### Track A — Multi-Agent Task Dispatch for 16 Character Avatar Icons (`agent-asset-gen` / Agent 2)
- **Why**: Every playable chibi animal (`bear`, `panda`, `red_panda`, `raccoon`, `cat`, `dog`, `sheep`, `pig`, `elephant`, `hippo`, `lion`, `tiger`, `penguin`, `duck`, `owl`, `frog`) needs a dedicated `512×512` glossy 3D vinyl/clay portrait icon (`public/assets/game/avatars/avatar_<id>.png`) for the Character Selection Grid, Top-Right Live Standings, Spectator Switcher, and Post-Race Podium.
- **Protocol**:
  1. `agent-lead-architect` authors `tasks/TASK-002-character-avatars.md` with `Status: OPEN` and exact color/accessory/prompt specs for all 16 characters.
  2. `agent-lead-architect` prepares `CHARACTER_AVATAR_PATHS` and `<CharacterAvatarEmblem />` in `src/components/GameAssetIcons.tsx` with automatic PNG loading and a clean color-block badge fallback while `TASK-002` is `OPEN`.
  3. `agent-asset-gen` (Agent 2) executes `TASK-002` on branch `agent/asset-gen/character-avatars` and opens PR #2.
  4. Upon PR #2 submission, `agent-lead-architect` reviews and merges the 16 PNGs into `main`.

### Track B — Live 3D Character Preview Stage & Cool Hero Stance (`agent-lead-architect` / Agent 1)
- **Why**: Players selecting their racer in the Pre-Race Locker Modal should immediately see the actual **3D Blocky Chibi Model** of the selected character standing right next to the selection grid, striking a **cool, confident hero idle animation (`'cool'`)** shared across all 16 characters.
- **Deliverables Implemented in `main` Immediately**:
  1. **Unified Cool Hero Stance (`'cool'` pose in `src/models/characterTypes.ts`)**:
     - Added `'cool'` to `AnimationPose` and implemented its procedural kinematics in `computeCharacterKinematics`:
       - Confident wide-stance rhythmic groove bounce (`tempoBpm: 124`).
       - Left hand cocked confidently on the hip (`leftArmRotZ` flared out, `leftArmRotX` angled back) while the right arm performs a smooth rhythmic hero flex / wave.
       - Charismatic head nod with cool side-to-side swagger glance, perky ear twitches, proud chest tilt (`rootRotX: -0.06`), and brisk tail wag.
  2. **Interactive 3D Character Preview Pedestal (`src/components/LobbyCharacterPreview.tsx`)**:
     - Dedicated Three.js WebGL stage rendered inside the Pre-Race Locker Modal alongside the 16-character grid.
     - Automatically swaps and animates whichever of the 16 characters is currently selected (`selectedCharacter`).
     - Supports drag-to-rotate turntable inspection, click-to-poke reaction, and quick pose preview pills (`Cool Pose`, `Happy Hop`, `Sprint`).
  3. **Side-by-Side Locker Layout (`src/components/RaceHudOverlay.tsx`)**:
     - Places the **Live 3D Character Preview Stage** on the left/side column and the **16-Character Picker + Active/Passive Skill Selectors** on the right column so selecting any character updates the 3D model in real time.
