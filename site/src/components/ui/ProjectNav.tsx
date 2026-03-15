import { Link } from "react-router-dom";

const projects = [
  { id: "and", title: "Train AND Gate", path: "/projects/and" },
  { id: "xor", title: "The XOR Problem", path: "/projects/xor" },
  { id: "attention", title: "Attention Explorer", path: "/projects/attention" },
];

export default function ProjectNav({ current }: { current: string }) {
  const idx = projects.findIndex((p) => p.id === current);
  const prev = idx > 0 ? projects[idx - 1] : null;
  const next = idx < projects.length - 1 ? projects[idx + 1] : null;

  return (
    <div className="flex items-center justify-between pt-8 border-t border-[var(--color-surface-overlay)]">
      {prev ? (
        <Link
          to={prev.path}
          className="group flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Previous project</div>
            <div className="font-medium">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.path}
          className="group flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-right"
        >
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Next project</div>
            <div className="font-medium">{next.title}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
