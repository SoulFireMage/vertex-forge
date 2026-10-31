// Particle names: "ν_μ" → ν<sub>μ</sub>, "D_s⁺" → D<sub>s</sub>⁺. Superscripts are already Unicode.

import { getParticle } from '../engine';

const SUPER = /[⁺⁻⁰]/;

export function NameText({ text }: { text: string }) {
  const i = text.indexOf('_');
  if (i < 0) return <span class="pname">{text}</span>;
  const base = text.slice(0, i);
  let j = i + 1;
  while (j < text.length && !SUPER.test(text[j])) j++;
  return <span class="pname">{base}<sub>{text.slice(i + 1, j)}</sub>{text.slice(j)}</span>;
}

export function PName({ id }: { id: string }) {
  return <NameText text={getParticle(id).name} />;
}

export function Side({ ids }: { ids: string[] }) {
  return <>{ids.map((id, k) => <>{k > 0 && ' '}<PName id={id} /></>)}</>;
}

export function ReactionText({ initial, final }: { initial: string[]; final: string[] }) {
  return <span class="reaction"><Side ids={initial} /> <span class="arrow">→</span> <Side ids={final} /></span>;
}
