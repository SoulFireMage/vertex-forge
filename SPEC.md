# Domain & Functional Specification: The Vertex Forge (v1)

*A deterministic trainer for Standard Model bookkeeping: conservation laws, hadron structure, vertex legality and process diagnosis.*

---

## 0. Read this first (instructions for the coding agent)

1. **Parent architecture.** Build on `SoulFireMage/systemics-forge`, which itself descends from `SoulFireMage/rhetoric-salle`. Reuse unchanged: Preact + TypeScript + Vite, hash routing, GitHub Pages deploy workflow, Glicko-2 ratings, FSRS-lite readiness, telemetry merge, Skapi sync, Dual-register toggle, Daily Calibration, Blitz, Telemetry, Codex, Guide, Settings, Account. Read both repos’ READMEs before starting.
2. **Remove for v1:** the Generative Forge, the Crisis Desk, and the LLM drill generator. **v1 makes no LLM calls at all.** The OpenRouter key UI can be hidden.
3. **Accuracy is the product.** Every physics fact comes from the sources in §2, never from model memory. Where this spec and the source disagree, the source wins. Flag the discrepancy in the PR description, and don’t silently “fix” either.
4. **The engine is the judge.** Every right/wrong answer that can be computed must be computed by the ledger engine (§5), and every hand-written drill is tested against the engine (§8).
5. **Repo setup lesson:** the new repo must have at least one commit on `main` before any agent clones it. An empty repo has no `main` branch and some agents fail to start.

---

## 1. Philosophy & scope

At the level drilled here, the Standard Model behaves like strict double-entry bookkeeping. A process happens only if every conserved quantity balances, the energy is there, and every vertex in its diagram is a legal Standard Model vertex. The site trains the reflex of looking at a reaction and knowing whether nature allows it, which force carries it, and why.

**Pedagogical stance:** no flashcard memorisation of tables. The particle table is always one tap away (a reference drawer in every drill). The skill being trained is *applying* the ledger, not recalling it.

**Structural link to the Systems Forge (for the Guide):** a conserved charge obeys a continuity equation, ∂ρ/∂t + ∇·j = 0. That is the bathtub law: the stock changes only by net flow across the boundary. Charge, baryon number and lepton number are all bookkept this way.

### In scope (v1)
Wings I–IV in §3: quantum-number ledger, hadron composition, tree-level vertex grammar, process diagnosis (conservation, thresholds, force identification, lifetime scales, mediator selection, Cabibbo suppression, qualitatively).

### Out of scope (v1). Do not build.
- Electroweak symmetry breaking, running couplings and renormalisation, anomaly cancellation, effective field theory, Lagrangian parsing.
- Any LLM-graded writing, any LLM opponent, any LLM-generated physics content.
- Beyond-Standard-Model counterfactuals.
- Detector-event reading (candidate for v1.1, see §10).

---

## 2. Sources of truth & conventions

| Purpose | Source |
|---|---|
| Concepts, conventions, worked examples | D. Griffiths, *Introduction to Elementary Particles*, 2nd revised ed. (Wiley-VCH, 2008) |
| Masses, lifetimes, widths, quark content | Particle Data Group, *Review of Particle Physics*, current edition (pdg.lbl.gov) |

**Citation rule:** every drill and every taxonomy node carries a `source` field (e.g. `"Griffiths 2e §2.x"` or `"PDG 2024, Λ listing"`). **Do not invent section or page numbers.** If the agent can’t verify the exact section, cite at chapter level and mark `"verify": true`.

**Conventions (fix once, print in the Guide):**
- Units: MeV/c² for masses, seconds for lifetimes. Natural-unit shorthand “MeV” is fine in UI.
- Electric charge in units of e. **Store all charges as integers in thirds** (u = +2, d = −1, e⁻ = −3) to avoid floating-point error.
- Baryon number: quark +⅓, antiquark −⅓. Store in thirds.
- Strangeness: s quark has S = −1 (so K⁻ = sū has S = −1, K⁺ = us̄ has S = +1). Analogously C = +1 for c, B̃ = −1 for b, T = +1 for t.
- Neutrinos are written in the **flavour basis** (νₑ, ν_μ, ν_τ). Consequence: the tree-level W vertex pairs each charged lepton with its own-flavour neutrino. State this convention in the Guide, because in the mass basis lepton mixing (PMNS) appears at the W vertex instead.
- The minimal Standard Model has massless neutrinos and no h–ν–ν vertex. Treat neutrino mass, and anything that depends on it, as an explicitly flagged note, never as a drill answer.
- If hypercharge appears at all (Codex only in v1), use the convention Griffiths uses and state it (believed to be Q = I₃ + Y/2; **verify** in Griffiths before printing).

### Banned metaphors (all registers)
“God particle”; “spin is a spinning ball”; virtual particles “borrowing energy/time”; “the Higgs gives everything its mass” (most of the proton’s mass is not from the Higgs); “right-handed particles don’t feel the weak force” (they don’t couple to the W, but charged ones do couple to the Z).

---

## 3. Taxonomy (four wings, 24 nodes)

Each node: `id`, `wing`, `group`, `formal`, `intuitive`, `summary`, optional `note`, `source`.

The intuitive register uses a **ledger / permission** metaphor, and it must never be false. If a street name can’t be both vivid and true, use a plainer one.

### Wing I: The Ledger (particle properties)
| id | Formal | Intuitive |
|---|---|---|
| `generations` | Three Fermion Generations | Three Copies of the Same Kit |
| `antiparticles` | Charge Conjugation of Additive Quantum Numbers | The Mirror Account (every additive charge flips sign) |
| `electric_charge` | Electric Charge Conservation | The Charge Ledger |
| `baryon_number` | Baryon Number | The Quark Count (in thirds) |
| `lepton_number` | Lepton Number & Lepton Family Numbers | The Lepton Count, and Its Three Sub-Accounts |
| `colour_charge` | SU(3) Colour Representations (1, 3, 3̄, 8) | Colour Passports |
| `spin_statistics` | Spin–Statistics & Angular Momentum Counting | Half-Integer In, Half-Integer Out |

Note for `lepton_number`: total L and the family numbers are conserved in every process drilled here, but family numbers are violated by neutrino oscillations, and B and L are accidental symmetries. The Codex must say this; drills must not call family-number conservation “exact”.

### Wing II: Composites (hadrons)
| id | Formal | Intuitive |
|---|---|---|
| `colour_singlets` | Colour Singlet Requirement (Confinement) | Colour-Neutral at the Door |
| `meson_content` | Meson Quark Content (qq̄) | Quark + Antiquark |
| `baryon_content` | Baryon Quark Content (qqq) | Three Quarks, One of Each Colour |
| `flavour_numbers` | Strangeness, Charm, Beauty, Truth | Flavour Sub-Accounts |
| `colour_statistics` | The Δ⁺⁺ Puzzle & Antisymmetric Colour | Why uuu Needs Colour |

### Wing III: Vertex Grammar (tree-level)
| id | Formal | Intuitive |
|---|---|---|
| `qed_vertex` | QED Vertex (f f̄ γ) | The Photon Talks to Charge, Never Changes Flavour |
| `qcd_vertex` | QCD Vertices (q q̄ g; ggg; gggg) | Gluons Talk to Colour, Including Each Other |
| `weak_charged_vertex` | Charged-Current Vertex (W±) | The Flavour-Changing Desk (left-handed only) |
| `weak_neutral_vertex` | Neutral-Current Vertex (Z) | The Z Talks to Everyone, Changes Nothing |
| `boson_self_couplings` | Electroweak Gauge-Boson Self-Couplings | Which Bosons Talk to Each Other |
| `higgs_vertices` | Higgs Couplings | The Higgs Talks in Proportion to Mass |
| `crossing` | Crossing Symmetry | Turn a Leg Round, Flip It to Its Antiparticle |

### Wing IV: Process Diagnosis
| id | Formal | Intuitive |
|---|---|---|
| `conservation_audit` | Full Conservation Audit | Balance Every Account |
| `energy_threshold` | Kinematic Thresholds & Four-Momentum | Can It Afford the Decay? |
| `force_identification` | Identifying the Mediating Interaction | Which Desk Handled It? |
| `lifetime_scales` | Characteristic Lifetimes | The Clock Tells You the Force (Usually) |
| `mediator_selection` | Tree-Level Mediator Selection | Fill the Bridge |

---

## 4. Drill types (all deterministic, zero API cost)

Every drill: `id`, `drill_type`, `taxonomy_nodes`, `difficulty_elo` (800–2000), `register_tags {formal, intuitive}`, `prompt_instruction`, `explanation_formal`, `explanation_intuitive`, `source`, `reviewed` (bool), plus type-specific fields below. Explanations offer **two routes**: a short shape-level account and a stepwise account. Use the register toggle or a “Show the steps” expander.

### 4.1 Ledger Audit (`ledger_audit`)
Show a reaction, e.g. `Λ → p + π⁻`. The user marks each account (Q, B, L, Lₑ/L_μ/L_τ, energy threshold, angular momentum) as **balances / violated**, then gives a verdict: **allowed** or **forbidden: <first violated account>**. All truth values come from the engine. Show a ledger table afterwards (one column per quantity, in thirds where relevant, rendered as fractions).

### 4.2 Hadron Builder (`hadron_builder`)
Two directions: (a) given a hadron name, assemble its quark content from tiles; (b) given quark tiles, name the hadron or declare “not colour-neutral / not a hadron”. Decoy tiles: wrong flavours, antiquark where a quark belongs. Engine checks colour neutrality, charge and flavour numbers; the PDG table supplies the canonical content. **Exclude** states whose content is a superposition (π⁰, η, η′, K_S/K_L) from direction (b), or handle them only with an explicit note.

### 4.3 Vertex Auditor (`vertex_audit`)
Show a 3- or 4-leg vertex as SVG (fermion arrows; wavy γ/W/Z; curly g; dashed h). Randomise leg order and orientation. Step 1: **tree-level SM vertex: yes / no** (engine). Step 2 if no: **why** (charge, colour, flavour change at a neutral boson, chirality, no such gauge coupling). Optional curated Step 3 for selected items only: **does it occur through loops?** Answers come from a curated, sourced table (§5.4), never inferred.

### 4.4 Decay Diagnosis (`decay_diagnosis`)
A three-step tree: (1) is it allowed? (engine); (2) which force? (engine, §5.3); (3) which lifetime band? (PDG data, with the light-hadron caveat shown).

### 4.5 Mediator Bridge (`mediator_bridge`)
Given initial and final states for a 2→2 process or a decay, choose the internal line(s) from γ, g, W⁺, W⁻, Z, h, plus decoys. The engine checks every vertex in the assembled diagram and charge flow along the propagator. Accept every valid answer; e⁺e⁻ → μ⁺μ⁻ accepts γ **and** Z.

---

## 5. The ledger engine (core of the app)

Pure TypeScript, no UI dependencies, 100% unit-tested.

### 5.1 Particle data (`src/data/particles.json`)
```json
{
  "id": "lambda0", "name": "Λ⁰", "kind": "baryon",
  "charge3": 0, "baryon3": 3, "L_e": 0, "L_mu": 0, "L_tau": 0,
  "S": -1, "C": 0, "B": 0, "T": 0,
  "colour": "1", "spin2": 1,
  "mass_MeV": 1115.683, "lifetime_s": 2.63e-10,
  "quark_content": ["u", "d", "s"],
  "antiparticle": "antilambda0",
  "source": "PDG 2024"
}
```
`spin2` is twice the spin. Fundamental fermions also carry `generation` and `weak_type` (`up`, `down`, `charged_lepton`, `neutrino`). Gauge bosons and h carry `colour` (`8` for g) and charge. Generate antiparticles programmatically from the particle, so they can’t drift.

**Fill all numbers from the current PDG edition.** The values in this spec are for orientation only.

### 5.2 Conservation checks
- Q, B, L, Lₑ, L_μ, L_τ, S/C/B/T: exact integer sums (thirds where needed).
- Angular momentum (necessary condition only): the number of half-integer-spin particles must have the same parity on both sides. Label it “necessary, not sufficient”.
- Decay threshold: m_parent > Σ m_daughters. For scattering, require a stated √s, or skip the check and say so.
- Special kinematic veto: a single massless particle can’t be the sole product of a two-body annihilation (e⁺e⁻ → γ is forbidden by four-momentum conservation).

### 5.3 Force identification (rule order matters; document it in the Guide)
1. Forbidden by any conservation check → **forbidden**.
2. Any neutrino in or out, or any change in S/C/B/T, or any lepton-flavour change between charged leptons and neutrinos → **weak**.
3. Otherwise, any photon in or out → **electromagnetic**.
4. Otherwise, all particles hadrons and flavour numbers conserved → **strong**.
5. Otherwise, charged leptons only and flavour conserved (e.g. e⁺e⁻ → μ⁺μ⁻) → **electromagnetic** (dominant), with a note that a Z-mediated contribution also exists.

Caveat to show to the user: “dominant force”, because a strong path, if available, dominates.

### 5.4 Vertex rules
Represent each vertex with all legs **incoming** (crossing turns an outgoing particle into an incoming antiparticle), so **the charges on every vertex sum to zero**. Assert that in code for every rule below. A vertex is a tree-level SM vertex iff it matches one of the following up to leg order:

| Vertex | Condition |
|---|---|
| f f̄ γ | f electrically charged; same flavour |
| q q̄ g | quarks only; same flavour |
| ggg, gggg | always |
| f f̄ Z | any fermion including neutrinos; same flavour (no tree-level flavour-changing neutral currents) |
| u_i d̄_j W⁻ (and conjugate ū_i d_j W⁺) | up-type quark with down-type antiquark, any generations (CKM); left-handed chirality only. Charges: +⅔ + ⅓ − 1 = 0. Read with crossing, this is u d̄ → W⁺ |
| ℓ⁻ ν̄_ℓ W⁺ (and conjugate ℓ⁺ ν_ℓ W⁻) | charged lepton with its own-flavour antineutrino (flavour basis); left-handed only. Charges: −1 + 0 + 1 = 0 |
| W⁺W⁻γ, W⁺W⁻Z | always |
| W⁺W⁻W⁺W⁻, W⁺W⁻ZZ, W⁺W⁻γγ, W⁺W⁻Zγ | always |
| h f f̄ | massive fermions; strength ∝ mass |
| hW⁺W⁻, hZZ, hhW⁺W⁻, hhZZ, hhh, hhhh | always |

Not tree-level (must be rejected): γγγ, Zγγ, ZZγ, ZZZ, hγγ, hgg, hZγ, ℓℓg, any neutral-boson vertex changing flavour, W coupling to a right-handed chiral fermion.

**Curated loop/forbidden facts (Step 3 of the Vertex Auditor; each must be sourced before use):**
- h → γγ, h → gg: occur via loops (top quark, W).
- Three-photon amplitudes vanish to all orders in QED (Furry’s theorem, charge-conjugation invariance).
- A massive spin-1 particle cannot decay to two photons (Landau–Yang theorem), so Z → γγ is forbidden.
- π⁰ → 3γ is forbidden by C-parity.

---

## 6. Golden test cases (seed the test suite; verify each against the sources)

**Reactions:**
| Reaction | Expected |
|---|---|
| n → p e⁻ ν̄ₑ | allowed, weak |
| p → n e⁺ νₑ (free proton) | forbidden: energy (m_p < m_n) |
| n → p e⁻ | forbidden: lepton number; also fails the angular-momentum parity check |
| π⁰ → γγ | allowed, EM |
| π⁺ → μ⁺ ν_μ | allowed, weak |
| μ⁻ → e⁻ ν̄ₑ ν_μ | allowed, weak |
| μ⁻ → e⁻ γ | forbidden: L_μ and Lₑ (note: with neutrino mass, allowed but suppressed to ~10⁻⁵⁴; never observed) |
| Λ → p π⁻ | allowed, weak (ΔS = 1) |
| Δ⁺⁺ → p π⁺ | allowed, strong |
| Σ⁰ → Λ γ | allowed, EM |
| K⁺ → π⁺ π⁰ | allowed, weak |
| Ω⁻ → Λ K⁻ | allowed, weak (ΔS = 1) |
| τ⁻ → μ⁻ ν̄_μ ν_τ | allowed, weak |
| p → e⁺ π⁰ | forbidden: B and L (note: B − L is conserved; not observed) |
| e⁺ e⁻ → γ | forbidden: four-momentum |
| e⁺ e⁻ → μ⁺ μ⁻ | allowed, EM (+ Z) |
| ν_μ n → μ⁻ p | allowed, weak |
| ν̄ₑ p → e⁺ n | allowed, weak |
| π⁻ p → K⁰ Λ | allowed, strong (associated production) |
| π⁻ p → K⁻ p | not strong: charge balances (0 → 0) but strangeness goes 0 → −1, so it can only proceed weakly |

**Vertices (all legs incoming):**
legal: e⁻e⁺γ, u ū g, ggg, νₑ ν̄ₑ Z, u d̄ W⁻, u s̄ W⁻ (Cabibbo-suppressed), e⁻ ν̄ₑ W⁺, W⁺W⁻γ, W⁺W⁻Z, hhh, h e⁻ e⁺.
not tree-level: e⁻ e⁺ g, u c̄ Z, γγγ, Zγγ, ZZZ, hγγ, hgg, νₑ ν̄ₑ γ, u_R d̄ W⁻ (right-handed u), e⁻ ν̄_μ W⁺.
malformed (charges don’t sum to zero, so reject before any rule lookup): u d̄ W⁺, e⁻ ν̄ₑ W⁻.

Orientation values (verify against PDG): m_p 938.272 MeV; m_n 939.565; m_π± 139.570; m_π⁰ 134.977; m_K± 493.677; m_Λ 1115.683; m_Σ⁰ 1192.64; m_Ω⁻ 1672.45; m_Δ ≈ 1232. τ(π⁺) 2.60×10⁻⁸ s; τ(π⁰) 8.5×10⁻¹⁷ s; τ(μ) 2.20×10⁻⁶ s; τ(n) ≈ 879 s; τ(Λ) 2.63×10⁻¹⁰ s; τ(Σ⁰) 7.4×10⁻²⁰ s; τ(K⁺) 1.24×10⁻⁸ s; τ(τ) 2.90×10⁻¹³ s; Δ lifetime ≈ 5.6×10⁻²⁴ s (from width ≈ 117 MeV); top ≈ 5×10⁻²⁵ s.

**Lifetime-band caveat (must appear in every lifetime drill):** strong ~10⁻²³ s, EM ~10⁻²⁰–10⁻¹⁶ s, weak ≳10⁻¹³ s holds for **light hadrons and leptons**. Exceptions: the top quark, W and Z decay weakly in ~10⁻²⁵ s, and the neutron lives ~15 minutes because its decay barely clears the energy threshold.

---

## 7. UI & aesthetics

- Title: **The Vertex Forge**. Repo: `vertex-forge`.
- Palette (“bubble chamber”), defined as tokens with light and dark variants: vacuum `#0B0E14`, Cherenkov blue `#00E5FF`, synchrotron amber `#FFB300`, vertex crimson `#FF2A54`. Check text contrast (WCAG AA) and soften accents for the light theme.
- Notation: render with Unicode and HTML `<sub>/<sup>` first. Add KaTeX (pinned version) only if fractions or bars become unreadable.
- Vertex SVGs: fermion lines with arrows; wavy γ/W/Z, curly g, dashed h; labels at leg ends. Must be legible at 390 px width.
- A **Particle Table drawer** in every drill (searchable; shows the stored fields). The drill tests applying the table, not recalling it.
- Reuse the Dual register: Formal / Both / Intuitive.

## 8. Accuracy workflow (non-negotiable)

1. Engine first, with the golden tests in §6 passing before any drill content is written.
2. Every hand-written drill is checked in `npm test` against the engine: its stated verdict, force and violated accounts must match the engine’s output exactly.
3. Every drill and node has a `source`; the UI shows it under the Anatomy section.
4. `reviewed: false` drills show a small “not yet expert-reviewed” badge. A human physicist sets `reviewed: true`.
5. Produce `REVIEW.md`: a checklist of every explanation paragraph, grouped by node, so a reviewer can go through them in one sitting.

## 9. Seed content targets (v1)

- Particle table: all quarks, leptons, gauge bosons, h, and about 30 common hadrons (π, K, η, p, n, Λ, Σ, Ξ, Ω, Δ, D, B, J/ψ, Υ).
- At least 40 hand-written drills spread across all five types and four wings, every node covered at least twice.
- Engine-generated practice: a “Random audit” mode that builds reactions from the particle table (biased towards near-misses: one account off by one unit, or just under threshold) and grades them with the engine.

## 10. Later versions (not v1)

- **v1.1, Event reading:** curated real events from CERN Open Data. The user infers the process from the detector signature (tracks, calorimeter deposits, muon hits, missing transverse momentum). Events are fixed data, never generated by an LLM.
- **v1.2, Optional explainer:** an LLM may *rephrase* the engine’s verdict and the sourced explanation. It is never the authority on whether something is allowed.
- Wings on symmetry breaking and mixing only with an expert reviewer involved.

## 11. Acceptance criteria

- `npm test` passes, including all golden cases and every seed drill’s engine cross-check.
- Lighthouse-style smoke test at 390 px: no horizontal scroll; vertex SVGs legible in both themes.
- No network calls other than optional Skapi sync (Skapi tables prefixed `vx_`).
- Guide includes: conventions (§2), force-identification rules (§5.3), lifetime caveat (§6), banned metaphors, and the continuity-equation link to the Systems Forge.
