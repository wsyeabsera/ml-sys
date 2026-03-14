import type { ConnectionStatus as Status } from "../../hooks/useBridge";

interface ToolbarProps {
  status: Status;
  onClear: () => void;
  onResetMcp: () => void;
  onExport: () => void;
}

const statusConfig: Record<Status, { color: string; label: string }> = {
  connected: { color: "bg-emerald-500", label: "Connected" },
  connecting: { color: "bg-amber-500 animate-pulse", label: "Connecting..." },
  disconnected: { color: "bg-red-500", label: "Offline" },
};

export default function Toolbar({
  status,
  onClear,
  onResetMcp,
  onExport,
}: ToolbarProps) {
  const { color, label } = statusConfig[status];

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Playground</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          JS expressions + rs-tensor MCP tools
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ToolbarButton onClick={onClear} label="Clear">
          <TrashIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={onResetMcp}
          label="Reset MCP"
          disabled={status !== "connected"}
        >
          <RefreshIcon />
        </ToolbarButton>
        <ToolbarButton onClick={onExport} label="Export">
          <DownloadIcon />
        </ToolbarButton>

        <div className="ml-2 pl-2 border-l border-[var(--color-surface-overlay)] flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
