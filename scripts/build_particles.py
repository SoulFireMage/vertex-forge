#!/usr/bin/env python3
"""Build src/data/particles.json from the Particle Data Group's own database.

Every mass, width and lifetime in the app comes from this script, never from
hand-typed numbers. Quantum numbers (charge, spin) are cross-checked against
PDG; flavour numbers and baryon number are *derived* from quark content using
the PDG Quark Model review §15.2 sign convention, so they cannot drift.

Usage (from the repo root):
    python3 -m venv .venv && .venv/bin/pip install pdg
    .venv/bin/python scripts/build_particles.py

The `pdg` package downloads the PDG SQLite file for its edition (2026.0 at the
time of writing). Re-run when PDG publishes a new edition and review the diff.
"""
import json
import math
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
import pdg  # noqa: E402

# hbar in MeV·s. Exact in the 2019 SI (hbar and e are both defined constants).
HBAR_MEV_S = 6.582119569e-22

QUARK = {  # id: (charge3, S, C, B, T)  — PDG Quark Model review, Table 15.1
    "u": (2, 0, 0, 0, 0), "d": (-1, 0, 0, 0, 0), "s": (-1, -1, 0, 0, 0),
    "c": (2, 0, 1, 0, 0), "b": (-1, 0, 0, -1, 0), "t": (2, 0, 0, 0, 1),
}


def content_numbers(content):
    q3 = b3 = 0
    flav = {"S": 0, "C": 0, "B": 0, "T": 0}
    for tok in content:
        anti = tok.endswith("bar")
        base = tok[:-3] if anti else tok
        sign = -1 if anti else 1
        c3, S, C, B, T = QUARK[base]
        q3 += sign * c3
        b3 += sign * 1
        for k, v in zip("SCBT", (S, C, B, T)):
            flav[k] += sign * v
    return q3, b3, flav


SUPERPOSITION = "superposition"

# id, PDG MC id, name, antiparticle id ("self" if self-conjugate), antiparticle display name, kind, extras
DEFS = [
    # ── quarks ────────────────────────────────────────────
    ("u", 2, "u", "ubar", "ū", "quark", dict(generation=1, weak_type="up")),
    ("d", 1, "d", "dbar", "d̄", "quark", dict(generation=1, weak_type="down")),
    ("c", 4, "c", "cbar", "c̄", "quark", dict(generation=2, weak_type="up")),
    ("s", 3, "s", "sbar", "s̄", "quark", dict(generation=2, weak_type="down")),
    ("t", 6, "t", "tbar", "t̄", "quark", dict(generation=3, weak_type="up")),
    ("b", 5, "b", "bbar", "b̄", "quark", dict(generation=3, weak_type="down")),
    # ── leptons ───────────────────────────────────────────
    ("e_minus", 11, "e⁻", "e_plus", "e⁺", "lepton", dict(generation=1, weak_type="charged_lepton")),
    ("nu_e", 12, "νₑ", "nubar_e", "ν̄ₑ", "lepton", dict(generation=1, weak_type="neutrino")),
    ("mu_minus", 13, "μ⁻", "mu_plus", "μ⁺", "lepton", dict(generation=2, weak_type="charged_lepton")),
    ("nu_mu", 14, "ν_μ", "nubar_mu", "ν̄_μ", "lepton", dict(generation=2, weak_type="neutrino")),
    ("tau_minus", 15, "τ⁻", "tau_plus", "τ⁺", "lepton", dict(generation=3, weak_type="charged_lepton")),
    ("nu_tau", 16, "ν_τ", "nubar_tau", "ν̄_τ", "lepton", dict(generation=3, weak_type="neutrino")),
    # ── bosons ────────────────────────────────────────────
    ("photon", 22, "γ", "self", None, "gauge_boson", {}),
    ("gluon", 21, "g", "self", None, "gauge_boson", {}),
    ("w_plus", 24, "W⁺", "w_minus", "W⁻", "gauge_boson", {}),
    ("z0", 23, "Z", "self", None, "gauge_boson", {}),
    ("higgs", 25, "h", "self", None, "scalar_boson", {}),
    # ── mesons ────────────────────────────────────────────
    ("pi_plus", 211, "π⁺", "pi_minus", "π⁻", "meson", dict(content=["u", "dbar"])),
    ("pi0", 111, "π⁰", "self", None, "meson", dict(content=SUPERPOSITION, content_note="(dd̄ − uū)/√2 (PDG sign convention)")),
    ("k_plus", 321, "K⁺", "k_minus", "K⁻", "meson", dict(content=["u", "sbar"])),
    ("k0", 311, "K⁰", "antik0", "K̄⁰", "meson", dict(content=["d", "sbar"])),
    ("eta", 221, "η", "self", None, "meson", dict(content=SUPERPOSITION, content_note="mixture of uū, dd̄ and ss̄ (octet–singlet mixing)")),
    ("eta_prime", 331, "η′", "self", None, "meson", dict(content=SUPERPOSITION, content_note="mixture of uū, dd̄ and ss̄ (octet–singlet mixing)")),
    ("rho_plus", 213, "ρ⁺", "rho_minus", "ρ⁻", "meson", dict(content=["u", "dbar"])),
    ("rho0", 113, "ρ⁰", "self", None, "meson", dict(content=SUPERPOSITION, content_note="(dd̄ − uū)/√2, the vector partner of π⁰")),
    ("d_plus", 411, "D⁺", "d_minus", "D⁻", "meson", dict(content=["c", "dbar"])),
    ("d0", 421, "D⁰", "antid0", "D̄⁰", "meson", dict(content=["c", "ubar"])),
    ("ds_plus", 431, "D_s⁺", "ds_minus", "D_s⁻", "meson", dict(content=["c", "sbar"])),
    ("b_plus", 521, "B⁺", "b_minus", "B⁻", "meson", dict(content=["u", "bbar"])),
    ("b0", 511, "B⁰", "antib0", "B̄⁰", "meson", dict(content=["d", "bbar"])),
    ("bs0", 531, "B_s⁰", "antibs0", "B̄_s⁰", "meson", dict(content=["s", "bbar"])),
    ("jpsi", 443, "J/ψ", "self", None, "meson", dict(content=["c", "cbar"])),
    ("upsilon1s", 553, "Υ(1S)", "self", None, "meson", dict(content=["b", "bbar"])),
    # ── baryons ───────────────────────────────────────────
    ("proton", 2212, "p", "antiproton", "p̄", "baryon", dict(content=["u", "u", "d"])),
    ("neutron", 2112, "n", "antineutron", "n̄", "baryon", dict(content=["u", "d", "d"])),
    ("lambda0", 3122, "Λ⁰", "antilambda0", "Λ̄⁰", "baryon", dict(content=["u", "d", "s"])),
    ("sigma_plus", 3222, "Σ⁺", "antisigma_plus", "Σ̄⁻", "baryon", dict(content=["u", "u", "s"])),
    ("sigma0", 3212, "Σ⁰", "antisigma0", "Σ̄⁰", "baryon", dict(content=["u", "d", "s"])),
    ("sigma_minus", 3112, "Σ⁻", "antisigma_minus", "Σ̄⁺", "baryon", dict(content=["d", "d", "s"])),
    ("xi0", 3322, "Ξ⁰", "antixi0", "Ξ̄⁰", "baryon", dict(content=["u", "s", "s"])),
    ("xi_minus", 3312, "Ξ⁻", "antixi_minus", "Ξ̄⁺", "baryon", dict(content=["d", "s", "s"])),
    ("omega_minus", 3334, "Ω⁻", "antiomega_minus", "Ω̄⁺", "baryon", dict(content=["s", "s", "s"])),
    ("delta_pp", 2224, "Δ⁺⁺", "antidelta_pp", "Δ̄⁻⁻", "baryon", dict(content=["u", "u", "u"])),
    ("delta_plus", 2214, "Δ⁺", "antidelta_plus", "Δ̄⁻", "baryon", dict(content=["u", "u", "d"])),
    ("delta0", 2114, "Δ⁰", "antidelta0", "Δ̄⁰", "baryon", dict(content=["u", "d", "d"])),
    ("delta_minus", 1114, "Δ⁻", "antidelta_minus", "Δ̄⁺", "baryon", dict(content=["d", "d", "d"])),
    ("lambda_c", 4122, "Λ_c⁺", "antilambda_c", "Λ̄_c⁻", "baryon", dict(content=["u", "d", "c"])),
    ("lambda_b", 5122, "Λ_b⁰", "antilambda_b", "Λ̄_b⁰", "baryon", dict(content=["u", "d", "b"])),
]

LEPTON_FAMILY = {"e_minus": "L_e", "nu_e": "L_e", "mu_minus": "L_mu", "nu_mu": "L_mu", "tau_minus": "L_tau", "nu_tau": "L_tau"}
QUARK_FLAVOUR = {k: dict(zip("SCBT", v[1:])) for k, v in QUARK.items()}


def is_limit(summary):
    # The pdg package's is_limit flag is set on some ordinary values (e.g. the
    # u-quark mass 2.16 ± 0.07 MeV), so decide from the displayed text instead.
    text = summary.display_value_text or ""
    return "<" in text or ">" in text


def to_mev(value, units):
    return value * {"GeV": 1000.0, "MeV": 1.0, "keV": 1e-3, "eV": 1e-6}[units]


def pdg_mass(p):
    """Return (mass_MeV, err_MeV, description, note)."""
    for m in p.masses():
        if not m.has_best_summary():
            continue
        s = m.best_summary()
        if s.value is None or s.units not in ("GeV", "MeV", "keV", "eV"):
            continue  # e.g. the proton's mass in atomic mass units
        if is_limit(s):
            return None, None, m.description, "PDG quotes only a limit"
        if "~" in (s.display_value_text or ""):
            return to_mev(s.value, s.units), None, m.description, f"PDG estimate {s.display_value_text} {s.units}"
        err = s.error_positive if s.error_positive is not None else None
        return to_mev(s.value, s.units), (to_mev(err, s.units) if err is not None else None), m.description, None
    for m in p.masses():  # range-valued entries such as Δ(1232) "1230 to 1234 (~1232)"
        if m.display_value_text and "~" in m.display_value_text:
            central = float(m.display_value_text.split("~")[1].rstrip(") "))
            return central, None, m.description, f"PDG estimate {m.display_value_text} MeV"
    return None, None, None, None


def pdg_width(p):
    for w in p.widths():
        if w.has_best_summary() and w.best_summary().value is not None and not is_limit(w.best_summary()):
            s = w.best_summary()
            return to_mev(s.value, s.units), w.description, None
    for w in p.widths():
        if w.display_value_text and "~" in w.display_value_text:
            central = float(w.display_value_text.split("~")[1].rstrip(") "))
            return central, w.description, f"PDG estimate {w.display_value_text} MeV"
    return None, None, None


def pdg_lifetime(p):
    for t in p.lifetimes():
        if t.has_best_summary() and t.best_summary().value is not None and not is_limit(t.best_summary()):
            s = t.best_summary()
            assert s.units == "s", s.units
            return s.value, t.description
    return None, None


def main():
    api = pdg.connect()
    edition = api.edition
    out = []
    for pid, mcid, name, anti, anti_name, kind, extra in DEFS:
        p = api.get_particle_by_mcid(mcid)
        rec = {"id": pid, "name": name, "kind": kind, "pdg_id": p.pdgid.split("/")[0], "pdg_name": p.name, "mc_id": mcid}
        q3 = round(3 * p.charge)
        J = p.quantum_J
        spin2 = round(2 * (float(J.split("/")[0]) / float(J.split("/")[1]) if "/" in J else float(J)))
        flav = {"S": 0, "C": 0, "B": 0, "T": 0}
        b3 = 0
        content = extra.get("content")
        if kind == "quark":
            b3 = 1
            flav = dict(QUARK_FLAVOUR[pid])
            assert q3 == QUARK[pid][0], pid
        elif isinstance(content, list):
            cq3, b3, flav = content_numbers(content)
            assert cq3 == q3, f"{pid}: quark content charge {cq3}/3 != PDG charge {q3}/3"
        elif content == SUPERPOSITION:
            b3 = 0  # all listed superposition states are flavourless mesons
        rec.update({"charge3": q3, "baryon3": b3})
        for fam in ("L_e", "L_mu", "L_tau"):
            rec[fam] = 1 if LEPTON_FAMILY.get(pid) == fam else 0
        rec.update(flav)
        rec["colour"] = {"quark": "3", "gluon": "8"}.get(kind, "8" if pid == "gluon" else "1")
        rec["spin2"] = spin2
        for k in ("generation", "weak_type"):
            if k in extra:
                rec[k] = extra[k]
        if kind in ("meson", "baryon"):
            rec["quark_content"] = content if isinstance(content, list) else None
            if "content_note" in extra:
                rec["content_note"] = extra["content_note"]

        notes = []
        mass, err, mdesc, mnote = pdg_mass(p)
        if kind == "quark" and pid in ("u", "d", "s"):
            notes.append("MS-bar mass at μ = 2 GeV (PDG convention). Quark masses are scheme-dependent; never use them for decay thresholds.")
        if kind == "quark" and pid in ("c", "b"):
            notes.append("MS-bar mass m(m) (PDG convention). Scheme-dependent; never use for decay thresholds.")
        if pid == "t":
            notes.append("From direct measurements (event kinematics), as in the PDG summary table.")
        if pid in ("photon", "gluon"):
            mass, err, mnote = 0.0, None, "Massless in the Standard Model."
        if kind == "lepton" and extra.get("weak_type") == "neutrino":
            mass, err = 0.0, None
            mnote = ("Massless in the minimal Standard Model (the convention used for drill answers). "
                     "Oscillations show neutrinos have tiny non-zero masses; PDG gives only upper limits on absolute masses.")
        if mnote:
            notes.append(mnote)
        rec["mass_MeV"] = None if mass is None else float(f"{mass:.10g}")
        if err is not None:
            rec["mass_err_MeV"] = float(f"{err:.3g}")

        tau, tdesc = pdg_lifetime(p)
        width, wdesc, wnote = pdg_width(p)
        stable = pid in ("proton", "e_minus", "photon", "gluon") or extra.get("weak_type") == "neutrino"
        if tau is not None:
            rec["lifetime_s"] = float(f"{tau:.4g}")
            rec["lifetime_basis"] = "mean_life"
        elif width is not None and width > 0:
            rec["width_MeV"] = float(f"{width:.4g}")
            rec["lifetime_s"] = float(f"{HBAR_MEV_S / width:.3g}")
            rec["lifetime_basis"] = "from_width"
            notes.append(f"Lifetime = ħ/Γ from the PDG width{' (' + wnote + ')' if wnote else ''}.")
        elif stable:
            rec["lifetime_s"] = None
            rec["lifetime_basis"] = "stable"
            if pid == "proton":
                notes.append("Stable as far as anyone has measured: PDG 2026 quotes τ(p → e⁺π⁰) > 2.4 × 10³⁴ yr (Tests of Conservation Laws review §6).")
        else:
            rec["lifetime_s"] = None
            rec["lifetime_basis"] = "not_applicable"
        if pid == "k0":
            ks = api.get_particle_by_mcid(310)
            kl = api.get_particle_by_mcid(130)
            tks, _ = pdg_lifetime(ks)
            tkl, _ = pdg_lifetime(kl)
            notes.append(f"K⁰ and K̄⁰ are strangeness eigenstates, not mass eigenstates: they propagate and decay as K_S (τ = {tks:.4g} s) and K_L (τ = {tkl:.4g} s).")
        if kind == "quark" and pid != "t":
            rec["lifetime_basis"] = "not_applicable"
            notes.append("Confined: no free-quark lifetime.")
        rec["antiparticle"] = anti
        if anti_name:
            rec["anti_name"] = anti_name
        if notes:
            rec["note"] = " ".join(notes)
        rec["source"] = f"PDG {edition} ({rec['pdg_id']})"
        out.append(rec)

    doc = {
        "edition": f"PDG {edition}",
        "citation": api.citation.replace("<i>", "").replace("</i>", ""),
        "hbar_MeV_s": HBAR_MEV_S,
        "generated_by": "scripts/build_particles.py (pdg Python package)",
        "conventions": "Charges and baryon number in thirds. Flavour signs follow PDG Quark Model review §15.2: S(s) = −1, C(c) = +1, B(b) = −1, T(t) = +1. Antiparticles are generated in code, never stored.",
        "particles": out,
    }
    path = Path(__file__).resolve().parent.parent / "src" / "data" / "particles.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {len(out)} particles from PDG {edition} to {path}", file=sys.stderr)


if __name__ == "__main__":
    main()
