import { useState, useEffect } from "react";
import PageTransition from "../components/layout/PageTransition";

interface SettingsState {
  bridgeUrl: string;
  fontSize: number;
  autoScroll: boolean;
  maxHistory: number;
}

const STORAGE_KEY = "playground:settings";

const defaults: SettingsState = {
  bridgeUrl: "http://localhost:3001",
  fontSize: 13,
  autoScroll: true,
  maxHistory: 200,
};

export function loadSettings(): SettingsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaults;
}

function saveSettings(settings: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function resetDefaults() {
    setSettings(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <PageTransition>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Playground configuration
          </p>
        </div>

        {/* Bridge connection */}
        <SettingsSection title="Connection">
          <SettingsField label="Bridge URL" description="Socket.io bridge server address">
            <input
              type="text"
              value={settings.bridgeUrl}
              onChange={(e) => update("bridgeUrl", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-surface-overlay)] text-sm font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
            />
          </SettingsField>
        </SettingsSection>

        {/* Editor */}
        <SettingsSection title="Editor">
          <SettingsField label="Font size" description="Editor and output font size in pixels">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={20}
                value={settings.fontSize}
                onChange={(e) => update("fontSize", Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono text-[var(--color-text-primary)] w-8 text-right">
                {settings.fontSize}px
              </span>
            </div>
          </SettingsField>
          <SettingsField label="Auto-scroll" description="Scroll to bottom when new output appears">
            <Toggle
              checked={settings.autoScroll}
              onChange={(v) => update("autoScroll", v)}
            />
          </SettingsField>
        </SettingsSection>

        {/* History */}
        <SettingsSection title="History">
          <SettingsField label="Max commands" description="Maximum number of commands to persist in IndexedDB">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={settings.maxHistory}
                onChange={(e) => update("maxHistory", Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono text-[var(--color-text-primary)] w-12 text-right">
                {settings.maxHistory}
              </span>
            </div>
          </SettingsField>
        </SettingsSection>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-surface-overlay)]">
          <button
            onClick={resetDefaults}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
          >
            Reset to defaults
          </button>
          {saved && (
            <span className="text-xs text-[var(--color-accent-emerald)]">
              Settings saved
            </span>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {title}
      </h2>
      <div className="space-y-4 bg-[var(--color-surface-raised)] rounded-xl p-4 border border-[var(--color-surface-overlay)]">
        {children}
      </div>
    </div>
  );
}

function SettingsField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-[var(--color-accent-blue)]" : "bg-[var(--color-surface-overlay)]"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
