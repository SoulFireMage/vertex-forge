import { useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { shuffle } from '../lib/scheduler';

export interface Choice {
  id: string;
  label: ComponentChildren;
  correct: boolean;
  /** Shown after answering, for the picked and the correct options. */
  feedback?: ComponentChildren;
}

/** A single-answer question. Options are shuffled once unless `fixedOrder`. */
export function Question({ label, question, choices, onAnswer, fixedOrder }: {
  label?: string;
  question: ComponentChildren;
  choices: Choice[];
  onAnswer: (correct: boolean, id: string) => void;
  fixedOrder?: boolean;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => (fixedOrder ? choices : shuffle(choices)), [choices, fixedOrder]);
  return (
    <div class="question">
      {label && <div class="step-label">{label}</div>}
      <div style={{ fontWeight: 500 }}>{question}</div>
      <div class="options" role="list">
        {options.map((o) => {
          const cls = !picked ? '' : o.correct ? 'correct' : picked === o.id ? 'wrong' : 'dim';
          return (
            <div role="listitem">
              <button class={`option ${cls}`} disabled={!!picked} aria-pressed={picked === o.id}
                onClick={() => { setPicked(o.id); onAnswer(o.correct, o.id); }}>
                {o.label}
              </button>
              {picked && (picked === o.id || o.correct) && o.feedback && (
                <div class="feedback">{o.correct ? '✓ ' : '✗ '}{o.feedback}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
