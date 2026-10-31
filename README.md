# The Vertex Forge

A deterministic trainer for Standard Model bookkeeping: conservation laws, hadron structure, vertex legality and process diagnosis. The full specification is in [`SPEC.md`](SPEC.md). It's the third app in a family, after [rhetoric-salle](https://github.com/SoulFireMage/rhetoric-salle) and [systemics-forge](https://github.com/SoulFireMage/systemics-forge).

It's intended to be real particle physics. Material will be checked and rechecked, and corrected when it's wrong.

**How it is being built:** an AI coding agent (Claude Code) is writing it from Richard's spec, in three reviewed phases.

## Status: phase 2 of 3 (engine + app shell + the five drill players)

| Phase | Contents | State |
|---|---|---|
| 1 | Ledger engine + golden tests (spec §5–6) | done, reviewed |
| 2 | App shell from systemics-forge + the five drill players, 15 starter drills | **done, awaiting review** |
| 3 | Seed content, REVIEW.md, Guide, Pages deploy | not started |

Discrepancies between the spec and the sources are listed in [`docs/spec-notes.md`](docs/spec-notes.md).

## The engine (`src/engine/`)

Pure TypeScript, no UI dependencies.

| File | What it does |
|---|---|
| `particles.ts` | Loads `src/data/particles.json`. Antiparticles are generated here, so their quantum numbers can't drift. |
| `notation.ts` | Parses `"Lambda -> p pi-"` or `"Λ⁰ → p + π⁻"`, and formats values stored in thirds as fractions. |
| `audit.ts` | The conservation audit. Accounts, in headline order: Q, B, L, Lₑ, L_μ, L_τ, the half-integer-spin count (necessary, not sufficient), colour, the energy threshold, and four-momentum vetoes. S, C, B and T are tallied for force identification but never forbid. |
| `force.ts` | The rule-ordered force identification (spec §5.3 plus two flagged extensions). |
| `vertex.ts` | The tree-level vertex grammar, with all legs incoming. A charge sum ≠ 0 marks a vertex malformed before any rule is looked up. CKM notes use PDG magnitudes. |
| `lifetime.ts` | Lifetime bands, the caveat, and the exceptions, each checked against the data. |

`src/data/curated.ts` holds the beyond-tree-level facts (loops, Furry, Landau–Yang, C-parity), each with a source.

## The app

Preact + TypeScript + Vite with hash routing, adapted from systemics-forge. Kept: Glicko-2 ratings, FSRS-lite readiness, telemetry merge, optional Skapi sync (table `vx_telemetry`), the dual register, Daily Calibration, Blitz, Telemetry, Codex, Guide, Settings and Account. Removed for v1: the Generative Forge, the Crisis Desk, the Admin Studio and every LLM call.

- **No network calls** unless you have signed in on that browser before: Skapi is not even contacted otherwise. The app uses system fonts instead of Google Fonts for the same reason.
- **Five drill players** (`src/components/players/`). Each one grades by calling the engine. The `expected` block in a drill's JSON is only there so `npm test` can check it against the engine (spec §8.2).
- **Particle table drawer** in every drill, and SVG vertex diagrams (wavy γ/W/Z, curly g, dashed h, fermion arrows).
- Seed drills live in `src/data/drills/*.json`, the taxonomy in `src/data/taxonomy.ts`.

`.github/workflows/deploy.yml` tests, builds and deploys to GitHub Pages on every push to `main`.

## Where the numbers come from

`src/data/particles.json` is **generated, not typed**: 48 particles, plus generated antiparticles, from the PDG 2026 database.

```sh
python3 -m venv .venv && .venv/bin/pip install pdg
.venv/bin/python scripts/build_particles.py
```

The script:
- takes charge and spin from PDG and asserts that each hadron's quark content reproduces PDG's charge;
- derives baryon number and S/C/B/T from the quark content, using the PDG Quark Model review §15.2 sign convention (S(s) = −1, C(c) = +1, B(b) = −1, T(t) = +1);
- records the PDG identifier on every row.

Re-run it when PDG publishes a new edition, and review the diff.

## Development

```sh
npm ci
npm test           # golden cases (spec §6) and engine tests
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
```
