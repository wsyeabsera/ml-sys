import { Link } from "react-router-dom";

const chapters = [
  { path: "/ch/1", title: "Getting Started" },
  { path: "/ch/2", title: "What is a Tensor" },
  { path: "/ch/3", title: "Phase 1 Recap" },
  { path: "/ch/4", title: "The MCP Server" },
  { path: "/ch/5", title: "Autograd Engine" },
  { path: "/ch/6", title: "Layers & MLPs" },
  { path: "/ch/7", title: "Attention" },
  { path: "/ch/8", title: "GGUF Model Files" },
];

export default function ChapterNav({ current }: { current: number }) {
  const prev = current > 1 ? chapters[current - 2] : null;
  const next = current < chapters.length ? chapters[current] : null;

  return (
    <div className="flex justify-between items-center pt-10 mt-10 border-t border-[var(--color-surface-overlay)]">
      {prev ? (
        <Link
          to={prev.path}
          className="group flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
          <span>{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.path}
          className="group flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] transition-colors"
        >
          <span>{next.title}</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
