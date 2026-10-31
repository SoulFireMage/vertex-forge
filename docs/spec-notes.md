# Spec notes: where the engine and SPEC.md part company

Spec §0.3 says that where the spec and the sources disagree, the source wins, and every discrepancy is flagged. This file is that flag list. It's kept in the repo rather than a PR description because each phase is pushed straight to `main`.

Sources checked (all PDG 2026: F. Takahashi et al., Int. J. Mod. Phys. A 41, 2630011 (2026)):
- the PDG database, through the `pdg` Python package, edition 2026.0
- the Quark Model review (§15)
- the CKM review (§12)
- Status of Higgs Boson Physics (§11)
- Tests of Conservation Laws
- the Quark summary table

**Griffiths was not available to this build.** Nothing in phase 1 cites Griffiths. Every Griffiths citation added later will carry `"verify": true` until someone checks it against the book.

## 1. Golden cases (§6)

None of the 20 golden reactions or the 25 golden vertices has a wrong verdict. All of them pass as the spec states them. Three need comment:

| Case | Spec says | Engine says | Comment |
|---|---|---|---|
| n → p e⁻ | forbidden: lepton number; also angular momentum | violated: L, Lₑ, half-integer count | Lₑ fails as well. The engine reports every violated account; the first is L. |
| p → e⁺ π⁰ | forbidden: B and L | violated: B, L, Lₑ | Same: Lₑ fails as well. B − L is conserved (1 → 1); a test checks it. |
| μ⁻ → e⁻ γ | "~10⁻⁵⁴" with neutrino mass | (note text) | PDG states it as an upper bound, B < 10⁻⁵⁴ (Tests of Conservation Laws §5, Eq. 27). The note now says "below 10⁻⁵⁴". |

## 2. Orientation values (§6) that PDG 2026 changes

| Quantity | Spec | PDG 2026 |
|---|---|---|
| τ(Λ) | 2.63 × 10⁻¹⁰ s | **2.617 × 10⁻¹⁰ s** |
| τ(n) | ≈ 879 s | **878.3 s** |
| τ(π⁰) | 8.5 × 10⁻¹⁷ s | 8.43 × 10⁻¹⁷ s (agrees to the spec's two figures, just) |
| m(Δ) | ≈ 1232 | PDG gives a range, 1230–1234 MeV (≈1232), for all four charge states together; width 114–120 MeV (≈117) |

Every other orientation value agrees with PDG 2026 to the precision the spec quotes. `tests/engine.test.ts` pins both lists, so a future PDG edition that moves them will fail loudly.

## 3. Force identification (§5.3): two gaps, filled and flagged

1. **Charged leptons together with hadrons fall through every rule.** Examples: e⁻p → e⁻p and e⁺e⁻ → π⁺π⁻. Rule 4 needs all hadrons and rule 5 needs charged leptons only. *Extension:* rule 5 now allows hadrons alongside the charged leptons (still electromagnetic, still with the Z note).
2. **An external W or Z with no neutrino and no flavour change also falls through.** Examples: Z → e⁺e⁻, and W⁺ → u d̄ at parton level. *Extension:* rule 2 also fires on an external W or Z.
3. **An external Higgs boson** with no photon, W or Z (h → b b̄) matches no rule. The engine returns `unclassified` rather than guessing. (h → γγ hits rule 3, so it is labelled electromagnetic, with a note that the label is only partly meaningful.)

`FORCE_RULES` in `src/engine/force.ts` holds the exact rule text, extensions marked, for the Guide to print.

## 4. What the ledger cannot see (and drills must avoid)

The spec's checks are additive quantum numbers, a necessary angular-momentum parity and kinematics. They don't include parity, C-parity, G-parity or isospin. So:
- **η → π⁺π⁻** passes every account and the engine calls it "allowed, strong". It is forbidden by P and CP.
- **η → π⁺π⁻π⁰** comes out "strong". It actually goes through isospin breaking, and η's lifetime (5.0 × 10⁻¹⁹ s) sits in the electromagnetic band.
- **π⁰ → 3γ** and **Z → γγ** pass the ledger. C-parity and Landau–Yang forbid them; these are the curated facts.

The engine attaches `LEDGER_LIMITS_NOTE` to every strong verdict. A test pins η → π⁺π⁻ as a known blind spot. Seed drills must not use these cases as "allowed" answers. A sourced table of curated symmetry vetoes would fix this properly (v1.1).

## 5. Vertex rules (§5.4)

- **h f f̄ needs "same flavour".** The spec's table omits it. In the SM the Higgs couplings are flavour-diagonal, so h μ⁻ e⁺ is not a vertex. The engine enforces it.
- **Curated loop fact, "h → γγ, h → gg via loops (top quark, W)", lumps two different things together.** PDG Higgs review §11.2.1: h–g–g comes from a top-quark loop (minor contributions from lighter quarks; no W, since the W has no colour). h–γ–γ is dominated by the W loop, which interferes destructively with the smaller top loop. `src/data/curated.ts` says it that way.
- **Chirality on an antifermion leg** (the spec's "u_R d̄ W⁻") is ambiguous. The engine reads a leg's chirality as the chirality of the field. The W couples only to left-chiral fields, and the antiparticles of a left-chiral field are right-handed in helicity in the massless limit. The Guide will need to say this in words.
- **Quark–lepton vertices** can't even pass the charge-sum check with one SM boson: no combination of ±⅓/±⅔ with 0/±1 sums to 0 or ±1. The engine's quark–lepton "mismatch" branches are therefore defensive and unreachable, which is why coverage is 98.7% rather than 100%.

## 6. Kinematics (§5.2): two vetoes added

The spec has one four-momentum veto (a single massless particle as the sole product). Two more are added and flagged:
- A massless particle can't decay (γ → e⁺e⁻ in vacuum).
- A 1 → 1 "decay" is impossible (Σ⁰ → Λ alone).
- 2 → 1 into a massive particle counts as resonance formation, allowed only for √s within the width.

**Colour** is a new account: free quarks or gluons as external states are vetoed unless the reaction is marked `parton: true`. The threshold check is skipped at parton level, because quark masses are scheme-dependent (PDG: MS-bar at 2 GeV for u, d, s; m(m) for c, b).

## 7. Lifetime caveat (§6) is incomplete

The PDG data show two more cases where the clock points at the wrong force. J/ψ (7.1 × 10⁻²¹ s) and Υ(1S) (1.2 × 10⁻²⁰ s) decay mainly strongly, but their strong decays are suppressed (the OZI rule), which puts them in the electromagnetic band. They're added to the caveat and to `BAND_EXCEPTIONS`, and a test checks each exception against the data. **The OZI explanation is from memory and is marked verify.** η′ (3.5 × 10⁻²¹ s) is a similar case, but I haven't sourced why, so it is not in the list.

## 8. Codex wording to fix before it is written

- §2/§3 "B and L are accidental symmetries". PDG (Tests of Conservation Laws §6) is more precise: B − L is an accidental symmetry of the SM, and B + L is violated at loop level by the anomaly, a highly suppressed non-perturbative effect.
- Banned-metaphor list: "right-handed particles don't feel the weak force". The accurate version should say **right-chiral**. Chirality and helicity coincide only for massless particles.
- §2 hypercharge "believed to be Q = I₃ + Y/2". PDG §15.2 uses the generalised Gell-Mann–Nishijima formula Q = I_z + (B + S + C + B′ + T)/2, with Y = B + S − (C − B′ + T)/3 (B′ here is bottomness). Griffiths' own convention is **unverified**.
- PDG writes π⁰ = (dd̄ − uū)/√2. Some texts flip the sign; it is a phase convention, and the table follows PDG.
