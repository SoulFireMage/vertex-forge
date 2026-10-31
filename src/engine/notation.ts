// Text notation for reactions: "Lambda -> p pi-" or "Λ⁰ → p + π⁻".
// Tokens are separated by spaces; a lone "+" between tokens is ignored.

import { PARTICLES, getParticle } from './particles';
import type { Reaction } from './types';

const ASCII: Record<string, string> = {
  'e-': 'e_minus', 'e+': 'e_plus', 'mu-': 'mu_minus', 'mu+': 'mu_plus', 'tau-': 'tau_minus', 'tau+': 'tau_plus',
  nu_e: 'nu_e', nubar_e: 'nubar_e', nu_mu: 'nu_mu', nubar_mu: 'nubar_mu', nu_tau: 'nu_tau', nubar_tau: 'nubar_tau',
  gamma: 'photon', g: 'gluon', 'W+': 'w_plus', 'W-': 'w_minus', Z: 'z0', Z0: 'z0', h: 'higgs', H: 'higgs',
  'pi+': 'pi_plus', 'pi-': 'pi_minus', pi0: 'pi0', 'K+': 'k_plus', 'K-': 'k_minus', K0: 'k0', K0bar: 'antik0',
  eta: 'eta', "eta'": 'eta_prime', 'rho+': 'rho_plus', 'rho-': 'rho_minus', rho0: 'rho0',
  'D+': 'd_plus', 'D-': 'd_minus', D0: 'd0', D0bar: 'antid0', 'Ds+': 'ds_plus', 'Ds-': 'ds_minus',
  'B+': 'b_plus', 'B-': 'b_minus', B0: 'b0', B0bar: 'antib0', Bs0: 'bs0', Bs0bar: 'antibs0',
  'J/psi': 'jpsi', Upsilon: 'upsilon1s',
  p: 'proton', pbar: 'antiproton', n: 'neutron', nbar: 'antineutron',
  Lambda: 'lambda0', Lambda0: 'lambda0', Lambdabar: 'antilambda0', Lambda0bar: 'antilambda0',
  'Sigma+': 'sigma_plus', Sigma0: 'sigma0', 'Sigma-': 'sigma_minus',
  'Sigmabar-': 'antisigma_plus', Sigma0bar: 'antisigma0', 'Sigmabar+': 'antisigma_minus',
  Xi0: 'xi0', 'Xi-': 'xi_minus', Xi0bar: 'antixi0', 'Xibar+': 'antixi_minus',
  'Omega-': 'omega_minus', 'Omegabar+': 'antiomega_minus',
  'Delta++': 'delta_pp', 'Delta+': 'delta_plus', Delta0: 'delta0', 'Delta-': 'delta_minus',
  'Lambda_c+': 'lambda_c', Lambda_b0: 'lambda_b',
  u: 'u', d: 'd', s: 's', c: 'c', b: 'b', t: 't', ubar: 'ubar', dbar: 'dbar', sbar: 'sbar', cbar: 'cbar', bbar: 'bbar', tbar: 'tbar',
};

const ALIASES: Record<string, string> = (() => {
  const m: Record<string, string> = { 'Λ': 'lambda0', 'Z⁰': 'z0' };
  for (const p of Object.values(PARTICLES)) {
    m[p.id] = p.id;
    m[p.name] = p.id;
  }
  for (const [k, v] of Object.entries(ASCII)) {
    if (!PARTICLES[v]) throw new Error(`notation alias ${k} → unknown particle ${v}`);
    m[k] = v;
  }
  return m;
})();

export function resolveToken(tok: string): string {
  const id = ALIASES[tok.normalize('NFC')] ?? ALIASES[tok];
  if (!id) throw new Error(`unknown particle token "${tok}"`);
  return id;
}

function side(text: string): string[] {
  return text.trim().split(/\s+/).filter((t) => t && t !== '+').map(resolveToken);
}

/** Parse "A B -> C D". Options are copied onto the reaction. */
export function parseReaction(text: string, opts: Omit<Reaction, 'initial' | 'final'> = {}): Reaction {
  const parts = text.split(/→|->/);
  if (parts.length !== 2) throw new Error(`reaction needs exactly one arrow: "${text}"`);
  const initial = side(parts[0]);
  const final = side(parts[1]);
  if (!initial.length || !final.length) throw new Error(`reaction needs particles on both sides: "${text}"`);
  return { initial, final, ...opts };
}

export function formatSide(ids: string[]): string {
  return ids.map((id) => getParticle(id).name).join(' ');
}

export function formatReaction(r: Reaction): string {
  return `${formatSide(r.initial)} → ${formatSide(r.final)}`;
}

/** Format a value stored in thirds as a fraction: 3 → "1", −1 → "−⅓", 4 → "4/3". */
export function formatThirds(n: number): string {
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a % 3 === 0) return `${sign}${a / 3}`;
  return `${sign}${a === 1 ? '⅓' : a === 2 ? '⅔' : `${a}/3`}`;
}
