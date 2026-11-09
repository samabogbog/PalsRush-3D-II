# Multi-Agent Git Collaboration Protocol (`agents.md`)

> **Repository Role**: Git serves simultaneously as **Source Control**, **Asynchronous Message Bus**, and **Shared Memory** for all AI agents collaborating on **BlockyPals 3D — Party Race Game**.

---

## 1. Repository Architecture & Directory Contract

```text
Repo
├── agents.md          # Multi-Agent Constitution, Role Boundaries & Git Bus Protocol
├── tasks/             # Assigned work tickets created by Lead Architect Agent
├── plans/             # High-level sprint blueprints & integration plans
├── memory/            # Shared knowledge base read by all agents before execution
├── reviews/           # Pull Request reviews, QA audits & merge approvals
├── public/assets/     # Game visual assets (AI PNG banners & SVG icon atlases)
└── src/               # Production TypeScript / React / Three.js game codebase
```

- **`tasks/` (Work Queue Bus)**: Markdown task manifests (`TASK-XXX-<slug>.md`) specifying the target branch, assigned specialist agent, exact deliverables, acceptance criteria, and forbidden paths.
- **`plans/` (Architectural Blueprints)**: Sprint-level plans (`PLAN-XXX-<slug>.md`) authored by the Lead Architect detailing how multi-agent outputs converge into the main game.
- **`memory/` (Shared Knowledge Base)**: Single source of truth (`shared_context.md`) storing visual palette tokens, typography rules, 16-character IDs, 5 Active + 5 Passive skill specifications, and 5 Prank Item definitions. Every agent **MUST** read `memory/shared_context.md` before creating or modifying any file.
- **`reviews/` (PR Audit Trail)**: Formal code & asset inspection logs (`PR-XXX-<slug>-review.md`) written by the Lead Architect before merging any `agent/*` branch into `main`.
- **`src/` (Production Game Code)**: Protected application source code. Specialist asset agents are strictly forbidden from modifying `src/` logic during asset generation branches.

---

## 2. Agent Roster & Strict Path Ownership

| Agent ID | Role Title | Permitted Write Paths | Forbidden Paths | Branch Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **`agent-lead-architect`** | Lead Architect & Integrator | `plans/`, `tasks/`, `reviews/`, `memory/`, `src/`, `agents.md` | None (Full Repo Maintainer) | `main`, `integrate/*` |
| **`agent-asset-gen`** | Visual Asset Specialist (AI PNG + SVG) | `public/assets/game/`, `src/assets/game/`, `tasks/` (status update only) | `src/game/`, `src/models/`, `src/App.tsx` | `agent/asset-gen/<task-slug>` |
| **`agent-ui-hud`** | Arcade Game HUD Engineer | `src/components/`, `tasks/` (status update only) | `src/game/raceEngine.ts`, `plans/`, `reviews/` | `agent/ui-hud/<task-slug>` |
| **`agent-gameplay-sim`** | 3D Track & Physics Specialist | `src/game/`, `src/models/` | `src/components/`, `public/assets/` | `agent/gameplay/<task-slug>` |

---

## 3. Git Message Bus Lifecycle (5-Step Protocol)

1. **Context Sync (`memory/`)**:
   - Before starting any task, every agent reads `agents.md` and `memory/shared_context.md` to align on art direction, color tokens, and domain constraints.
2. **Task Dispatch (`plans/` + `tasks/`)**:
   - `agent-lead-architect` creates a sprint blueprint in `plans/PLAN-XXX.md` and commits a scoped ticket in `tasks/TASK-XXX.md` on `main` with `Status: OPEN`.
3. **Branch Isolation (`git checkout -b agent/<role>/<slug>`)**:
   - The assigned specialist agent branches off `main`, executes **only** the deliverables permitted by its path boundary, updates the task status to `Status: READY_FOR_REVIEW`, and commits all artifacts to its feature branch.
4. **Pull Request & Lead Review (`reviews/`)**:
   - `agent-lead-architect` inspects `git diff main...agent/<role>/<slug>` to verify:
     - Zero unauthorized touches to forbidden paths (e.g., `agent-asset-gen` did not touch `src/` game logic).
     - Full compliance with `memory/shared_context.md` specifications.
   - `agent-lead-architect` records the audit in `reviews/PR-XXX-review.md` with `Verdict: APPROVED`.
5. **Merge & Game Integration (`git merge --no-ff`)**:
   - `agent-lead-architect` merges the specialist branch into `main` using `--no-ff` (preserving the multi-agent branch topology in `git log --graph`) and wires the newly merged assets into `src/` components.
