import { useState } from 'preact/hooks';
import { REGISTER_LABEL } from '../components/Term';
import { exportJson, importJson, resetProgress, settings, updateSettings } from '../state/store';

export function SettingsPage() {
  const [importMsg, setImportMsg] = useState('');
  const s = settings.value;

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vertex-forge-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const upload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      importJson(await file.text());
      setImportMsg('Imported and merged with your current progress.');
    } catch (err) {
      setImportMsg(`Could not import: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      <div class="eyebrow">Settings</div>
      <h1>Settings</h1>

      <section class="panel">
        <h2>Display</h2>
        <div class="grid grid-2">
          <div class="field">
            <label>Terminology register</label>
            <div class="seg" role="group" aria-label="Register">
              {(['formal', 'dual', 'intuitive'] as const).map((r) => (
                <button aria-pressed={s.register === r} onClick={() => updateSettings({ register: r })}>{REGISTER_LABEL[r]}</button>
              ))}
            </div>
          </div>
          <div class="field">
            <label>Theme</label>
            <div class="seg" role="group" aria-label="Theme">
              {(['auto', 'light', 'dark'] as const).map((t) => (
                <button aria-pressed={s.theme === t} onClick={() => updateSettings({ theme: t })}>{t === 'auto' ? 'Device' : t === 'light' ? 'Light' : 'Dark'}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>Your data</h2>
        <p class="muted" style={{ fontSize: '0.95rem' }}>Export ratings and history as JSON. Importing merges with what’s here; nothing is overwritten.</p>
        <div class="btn-row" style={{ marginTop: 0 }}>
          <button onClick={download}>Export JSON</button>
          <label class="btn" style={{ margin: 0 }}>
            Import JSON
            <input type="file" accept="application/json,.json" onChange={upload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => confirm('Reset all ratings and history in this browser (and your synced copy, if signed in)? Export first if unsure.') && resetProgress()} style={{ color: 'var(--bad)' }}>
            Reset progress
          </button>
        </div>
        {importMsg && <p class="mono" style={{ fontSize: '0.8rem' }}>{importMsg}</p>}
      </section>
    </div>
  );
}
