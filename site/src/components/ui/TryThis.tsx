import { useNavigate, useLocation } from "react-router-dom";

interface TryThisProps {
  commands: string[];
  label?: string;
}

/**
 * A button that opens the REPL with pre-filled commands.
 * Used in chapter pages to make concepts interactive.
 */
export default function TryThis({ commands, label = "Try this in the REPL" }: TryThisProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick() {
    const encoded = btoa(JSON.stringify(commands));
    const from = encodeURIComponent(location.pathname);
    navigate(`/playground?commands=${encoded}&from=${from}`);
  }

  return (
    <button
      onClick={handleClick}
      title="Opens the REPL with these commands pre-filled"
      className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/20 text-sm text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/20 transition-colors"
    >
      <span className="font-mono text-xs opacity-60 group-hover:opacity-100 transition-opacity">
        {">_"}
      </span>
      <span>{label}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
}
