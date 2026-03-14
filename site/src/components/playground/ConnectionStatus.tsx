import type { ConnectionStatus as Status } from "../../hooks/useBridge";

const config: Record<Status, { color: string; label: string }> = {
  connected: { color: "bg-emerald-500", label: "Connected" },
  connecting: { color: "bg-amber-500 animate-pulse", label: "Connecting..." },
  disconnected: { color: "bg-red-500", label: "Bridge offline" },
};

export default function ConnectionStatus({ status }: { status: Status }) {
  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
