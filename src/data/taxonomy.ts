import type { TaxonomyNode, Wing, WingId } from '../lib/types';

// Spec §3: four wings, 24 nodes. Summaries cite the PDG text they were checked
// against. Nodes whose natural source is Griffiths carry verify: true until
// someone checks them against the book (the app has no copy yet).

export const WINGS: Wing[] = [
  { id: 'ledger', numeral: 'I', title: 'The Ledger', focus: 'Particle properties: the accounts every process must balance' },
  { id: 'composites', numeral: 'II', title: 'Composites', focus: 'Hadrons: what quarks can build, and what they cannot' },
  { id: 'vertices', numeral: 'III', title: 'Vertex Grammar', focus: 'Tree-level Standard Model vertices: who talks to whom' },
  { id: 'diagnosis', numeral: 'IV', title: 'Process Diagnosis', focus: 'Allowed or forbidden, which force, how fast, through which boson' },
];

const GRIFFITHS = 'Griffiths 2e (chapter to be confirmed)';
const QM = 'PDG 2026, Quark Model review §15.2';
const CONS = 'PDG 2026, Tests of Conservation Laws §5–6';
const HIGGS = 'PDG 2026, Status of Higgs Boson Physics §11.2.1';

const n = (
  id: string, wing: WingId, group: string, formal: string, intuitive: string, summary: string,
  source: string, opts: { note?: string; verify?: boolean } = {},
): TaxonomyNode => ({ id, wing, group, formal, intuitive, summary, source, ...opts });

export const NODES: TaxonomyNode[] = [
  // ── Wing I: The Ledger ────────────────────────────────
  n('generations', 'ledger', 'The kit', 'Three Fermion Generations', 'Three Copies of the Same Kit',
    'Matter comes in three generations with the same charges and colours: (u, d, e⁻, νₑ), (c, s, μ⁻, ν_μ), (t, b, τ⁻, ν_τ). Each charged fermion is heavier than its partner in the generation before.',
    'PDG 2026 summary tables (masses)'),
  n('antiparticles', 'ledger', 'The kit', 'Charge Conjugation of Additive Quantum Numbers', 'The Mirror Account (every additive charge flips sign)',
    'Every particle has an antiparticle with the same mass and spin and every additive quantum number reversed: charge, baryon number, the lepton numbers, S, C, B and T. Some neutral particles, such as γ, Z, h and π⁰, are their own antiparticles.',
    'PDG 2026 (particle listings); antiparticles in this app are generated from that rule'),
  n('electric_charge', 'ledger', 'Additive accounts', 'Electric Charge Conservation', 'The Charge Ledger',
    'The total electric charge is the same before and after every process. Quarks carry +⅔ or −⅓, so the app keeps every charge in thirds and adds whole numbers.',
    QM),
  n('baryon_number', 'ledger', 'Additive accounts', 'Baryon Number', 'The Quark Count (in thirds)',
    'Each quark carries B = +⅓ and each antiquark −⅓, so baryons have B = 1, antibaryons −1 and mesons 0. No process has ever been seen to change the total.',
    `${QM}; ${CONS}`,
    { note: 'In the Standard Model, B − L is an accidental symmetry; B + L is broken only by a highly suppressed non-perturbative effect. Proton decay has never been seen: τ(p → e⁺π⁰) > 2.4 × 10³⁴ years.' }),
  n('lepton_number', 'ledger', 'Additive accounts', 'Lepton Number & Lepton Family Numbers', 'The Lepton Count, and Its Three Sub-Accounts',
    'Each lepton carries L = +1 and each antilepton −1, kept in three sub-accounts: Lₑ, L_μ, L_τ. Every process drilled here conserves the total and each sub-account.',
    CONS,
    { note: 'Not exact laws. Neutrino oscillations change the family numbers (so drills never call them exact), and total L is an accidental symmetry. Charged-lepton family violation has never been observed: B(μ → eγ) < 1.5 × 10⁻¹³.' }),
  n('colour_charge', 'ledger', 'Colour and spin', 'SU(3) Colour Representations (1, 3, 3̄, 8)', 'Colour Passports',
    'Quarks carry one of three colours (the triplet, 3), antiquarks an anticolour (3̄), and gluons a colour–anticolour combination (the octet, 8). Leptons, γ, W, Z and h are colourless (the singlet, 1).',
    GRIFFITHS, { verify: true }),
  n('spin_statistics', 'ledger', 'Colour and spin', 'Spin–Statistics & Angular Momentum Counting', 'Half-Integer In, Half-Integer Out',
    'Quarks and leptons have spin ½, gauge bosons spin 1 and the Higgs spin 0. Half-integer spins only add up to a whole number in pairs, so the number of half-integer-spin particles must be odd on both sides or even on both sides. That is a necessary condition, not a sufficient one.',
    'PDG 2026 (spins in the particle listings)'),

  // ── Wing II: Composites ───────────────────────────────
  n('colour_singlets', 'composites', 'Building rules', 'Colour Singlet Requirement (Confinement)', 'Colour-Neutral at the Door',
    'Only colour-neutral combinations exist as free particles: a quark with an antiquark (a meson) or three quarks (a baryon), plus rarer exotic states. A lone quark or a pair of quarks is never seen.',
    'PDG 2026, Quark Model review §15.2–15.5', { note: 'Tetraquark and pentaquark candidates exist; PDG updated its naming scheme for them in 2023. Drills here stick to two- and three-quark states.' }),
  n('meson_content', 'composites', 'Building rules', 'Meson Quark Content (qq̄)', 'Quark + Antiquark',
    'A meson is a quark plus an antiquark. Its charge and flavour numbers are the sums of its two constituents’. Some neutral mesons (π⁰, η, η′) are superpositions of several quark–antiquark pairs, so they have no single quark content.',
    'PDG 2026, Quark Model review §15.3'),
  n('baryon_content', 'composites', 'Building rules', 'Baryon Quark Content (qqq)', 'Three Quarks, One of Each Colour',
    'A baryon is three quarks, one of each colour. Its quantum numbers are the sums over the three. The same quarks can build more than one baryon: uud is both the proton (spin ½) and the Δ⁺ (spin 3/2).',
    'PDG 2026, Quark Model review §15.5'),
  n('flavour_numbers', 'composites', 'Flavour', 'Strangeness, Charm, Beauty, Truth', 'Flavour Sub-Accounts',
    'S, C, B and T count s, c, b and t quarks with the PDG signs: S = −1 for s, C = +1 for c, B = −1 for b, T = +1 for t. So K⁺ (us̄) has S = +1 and B⁺ (ub̄) has B = +1. The strong and electromagnetic interactions conserve them; the weak interaction can change them.',
    QM),
  n('colour_statistics', 'composites', 'Flavour', 'The Δ⁺⁺ Puzzle & Antisymmetric Colour', 'Why uuu Needs Colour',
    'Δ⁺⁺ is uuu with all three spins aligned and no orbital motion, so its space, spin and flavour parts are all symmetric. Quarks are fermions and the whole state must be antisymmetric; the colour part provides the antisymmetry.',
    'PDG 2026, Quark Model review §15.5 (Eq. 15.25)', { note: 'The historical puzzle is told in Griffiths; that citation is still to be checked.' }),

  // ── Wing III: Vertex Grammar ──────────────────────────
  n('qed_vertex', 'vertices', 'Gauge couplings', 'QED Vertex (f f̄ γ)', 'The Photon Talks to Charge, Never Changes Flavour',
    'The photon couples to every electrically charged fermion, with strength proportional to its charge, and never changes flavour: the two fermion legs are the same species.',
    GRIFFITHS, { verify: true }),
  n('qcd_vertex', 'vertices', 'Gauge couplings', 'QCD Vertices (q q̄ g; ggg; gggg)', 'Gluons Talk to Colour, Including Each Other',
    'The gluon couples to colour, so only quarks attach, without changing flavour. Gluons carry colour themselves, so three- and four-gluon vertices exist too.',
    GRIFFITHS, { verify: true }),
  n('weak_charged_vertex', 'vertices', 'Gauge couplings', 'Charged-Current Vertex (W±)', 'The Flavour-Changing Desk (left-handed only)',
    'The W joins an up-type quark to a down-type quark (any generations, weighted by the CKM matrix) or a charged lepton to its own neutrino, and couples only to left-chiral fields. It is the only vertex that changes flavour.',
    'PDG 2026, CKM review §12 (magnitudes); Griffiths for the vertex rules', { verify: true, note: 'Neutrinos are written in the flavour basis, so each charged lepton pairs with its own neutrino. In the mass basis, lepton mixing (PMNS) appears at this vertex instead.' }),
  n('weak_neutral_vertex', 'vertices', 'Gauge couplings', 'Neutral-Current Vertex (Z)', 'The Z Talks to Everyone, Changes Nothing',
    'The Z couples to every fermion, neutrinos included, and never changes flavour at tree level.',
    GRIFFITHS, { verify: true, note: 'Flavour-changing neutral currents appear only through loops.' }),
  n('boson_self_couplings', 'vertices', 'Boson couplings', 'Electroweak Gauge-Boson Self-Couplings', 'Which Bosons Talk to Each Other',
    'The W is charged, so it couples to the photon and the Z: W⁺W⁻γ, W⁺W⁻Z, and four-boson vertices with two or four W’s. Neutral bosons never meet each other alone at tree level: there is no γγγ, Zγγ, ZZγ or ZZZ vertex.',
    GRIFFITHS, { verify: true }),
  n('higgs_vertices', 'vertices', 'Boson couplings', 'Higgs Couplings', 'The Higgs Talks in Proportion to Mass',
    'The Higgs couples to massive particles, more strongly the heavier they are: h f f̄, hW⁺W⁻, hZZ and the self-couplings hhh and hhhh. It is neutral and colourless, so it has no tree-level coupling to photons or gluons.',
    HIGGS, { note: 'The minimal Standard Model has massless neutrinos and no h–ν–ν vertex.' }),
  n('crossing', 'vertices', 'Reading diagrams', 'Crossing Symmetry', 'Turn a Leg Round, Flip It to Its Antiparticle',
    'An incoming particle is equivalent to an outgoing antiparticle. One vertex therefore describes several processes: e⁻e⁺ → γ, e⁻ → e⁻γ and γ → e⁻e⁺ are the same vertex read in different directions (with virtual particles where the kinematics require it).',
    GRIFFITHS, { verify: true }),

  // ── Wing IV: Process Diagnosis ────────────────────────
  n('conservation_audit', 'diagnosis', 'Allowed or not', 'Full Conservation Audit', 'Balance Every Account',
    'Check every account: charge, baryon number, lepton number and its three sub-accounts, the half-integer-spin count, energy and momentum. One failed account is enough to forbid the process.',
    'This app’s ledger engine (spec §5.2); conservation laws per PDG 2026'),
  n('energy_threshold', 'diagnosis', 'Allowed or not', 'Kinematic Thresholds & Four-Momentum', 'Can It Afford the Decay?',
    'A particle can only decay into products whose masses add up to less than its own. In a collision, the centre-of-mass energy √s must cover the final masses. A single massless particle can never be the only product of a collision.',
    GRIFFITHS, { verify: true }),
  n('force_identification', 'diagnosis', 'Which force', 'Identifying the Mediating Interaction', 'Which Desk Handled It?',
    'A neutrino, or any change of flavour, means weak. Otherwise a photon means electromagnetic. Otherwise, hadrons only with every flavour number conserved means strong.',
    'This app’s rules (spec §5.3, Guide)', { note: 'This names the dominant force: if a strong path is open, it dominates.' }),
  n('lifetime_scales', 'diagnosis', 'Which force', 'Characteristic Lifetimes', 'The Clock Tells You the Force (Usually)',
    'For light hadrons and leptons, strong decays take about 10⁻²³ s, electromagnetic ones 10⁻²⁰–10⁻¹⁶ s, and weak ones 10⁻¹³ s or longer. The exceptions matter: top, W and Z decay weakly in about 10⁻²⁵ s, the neutron lives about 15 minutes, and J/ψ and Υ decay strongly but slowly.',
    'PDG 2026 lifetimes and widths', { note: 'The explanation for J/ψ and Υ (the OZI rule) is still to be checked against a source.', verify: true }),
  n('mediator_selection', 'diagnosis', 'Which boson', 'Tree-Level Mediator Selection', 'Fill the Bridge',
    'Choose the internal line of a tree diagram: the boson must make both vertices legal and carry the charge from one vertex to the other. More than one boson can work.',
    'This app’s vertex engine (spec §5.4)'),
];

export const NODE_MAP: Record<string, TaxonomyNode> = Object.fromEntries(NODES.map((x) => [x.id, x]));

export const nodesByWing = (wing: WingId) => NODES.filter((x) => x.wing === wing);

export const groupsOfWing = (wing: WingId) => {
  const groups: { group: string; nodes: TaxonomyNode[] }[] = [];
  for (const node of nodesByWing(wing)) {
    const g = groups.find((x) => x.group === node.group);
    if (g) g.nodes.push(node);
    else groups.push({ group: node.group, nodes: [node] });
  }
  return groups;
};
