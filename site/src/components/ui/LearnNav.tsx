import { Link } from "react-router-dom";

const chapters = [
  { num: 1, title: "What Are We Building?", path: "/learn/1" },
  { num: 2, title: "Tensors", path: "/learn/2" },
  { num: 3, title: "Autograd", path: "/learn/3" },
  { num: 4, title: "Neural Networks", path: "/learn/4" },
  { num: 5, title: "Attention", path: "/learn/5" },
  { num: 6, title: "Model Files", path: "/learn/6" },
  { num: 7, title: "Transformers", path: "/learn/7" },
  { num: 8, title: "Running a Real LLM", path: "/learn/8" },
];

export default function LearnNav({ current }: { current: number }) {
  const prev = chapters.find((c) => c.num === current - 1);
  const next = chapters.find((c) => c.num === current + 1);

  return (
    <div className="flex items-center justify-between pt-8 border-t border-[var(--color-surface-overlay)]">
      {prev ? (
        <Link
          to={prev.path}
          className="group flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Previous</div>
            <div className="font-medium">
              {String(prev.num).padStart(2, "0")}. {prev.title}
            </div>
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
            <div className="text-xs text-[var(--color-text-muted)]">Next</div>
            <div className="font-medium">
              {String(next.num).padStart(2, "0")}. {next.title}
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:translate-x-0.5 transition-transform"
          >
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
