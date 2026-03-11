import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DATA = [1, 2, 3, 4, 5, 6];
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4",
];

type Layout = "row-major" | "col-major";

/**
 * Given flat index and a layout, return the [row, col] in a 2×3 (row-major)
 * or 3×2 (col-major interpretation of a 2×3 logical matrix) grid.
 *
 * Row-major: flat[0..5] maps to rows first  → (0,0),(0,1),(0,2),(1,0),(1,1),(1,2)
 * Col-major: flat[0..5] maps to cols first  → (0,0),(1,0),(0,1),(1,1),(0,2),(1,2)
 *
 * We always show a 2-row × 3-col logical grid. The mapping changes.
 */
function flatTo2D(flatIdx: number, layout: Layout): [number, number] {
  if (layout === "row-major") {
    return [Math.floor(flatIdx / 3), flatIdx % 3];
  }
  // col-major: columns fill first → row = flatIdx % 2, col = floor(flatIdx / 2)
  return [flatIdx % 2, Math.floor(flatIdx / 2)];
}

function Cell({
  value,
  color,
  label,
  small,
}: {
  value: number;
  color: string;
  label?: string;
  small?: boolean;
}) {
  const size = small ? "w-10 h-10" : "w-12 h-12";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`${size} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
        style={{ backgroundColor: color }}
      >
        {value}
      </div>
      {label && (
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}

export default function MemoryLayoutViz() {
  const [layout, setLayout] = useState<Layout>("row-major");

  // Build grid mapping
  const grid: { value: number; flatIdx: number; row: number; col: number }[][] = [
    [], [],
  ];
  for (let f = 0; f < DATA.length; f++) {
    const [r, c] = flatTo2D(f, layout);
    if (!grid[r]) grid[r] = [];
    grid[r][c] = { value: DATA[f], flatIdx: f, row: r, col: c };
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 space-y-5">
      {/* Toggle */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-[var(--color-text-muted)]">Layout:</span>
        {(["row-major", "col-major"] as Layout[]).map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              layout === l
                ? "bg-[var(--color-accent-blue)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Flat memory strip */}
      <div className="space-y-1">
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          flat memory (contiguous)
        </p>
        <div className="flex gap-1.5 justify-center">
          {DATA.map((v, i) => (
            <Cell key={i} value={v} color={COLORS[i]} label={`[${i}]`} />
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center text-[var(--color-text-muted)] text-lg">
        {layout === "row-major" ? "row 0 first, then row 1" : "col 0 first, then col 1, then col 2"}
      </div>

      {/* 2D grid interpretation */}
      <div className="space-y-1">
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          2D interpretation (2 rows x 3 cols)
        </p>
        <div className="flex flex-col gap-1.5 items-center">
          <AnimatePresence mode="popLayout">
            {grid.map((row, ri) => (
              <motion.div
                key={`row-${ri}`}
                className="flex gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: ri * 0.05 }}
              >
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] w-10 flex items-center">
                  row {ri}
                </span>
                {row.map((cell) => (
                  <motion.div
                    key={`grid-${cell.value}`}
                    layoutId={`mem-${cell.value}`}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Cell
                      value={cell.value}
                      color={COLORS[cell.flatIdx]}
                      label={`[${cell.row},${cell.col}]`}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Cache line note */}
      <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {layout === "row-major" ? (
          <>
            <strong className="text-[var(--color-accent-emerald)]">Row-major (C/Rust/Python):</strong>{" "}
            Elements within the same row are adjacent in memory. Reading row-by-row
            hits consecutive addresses — the CPU cache loves this.
          </>
        ) : (
          <>
            <strong className="text-[var(--color-accent-amber)]">Column-major (Fortran/MATLAB/Julia):</strong>{" "}
            Elements within the same column are adjacent in memory. Reading column-by-column
            is fast, but reading row-by-row jumps through memory — cache misses everywhere.
          </>
        )}
      </div>
    </div>
  );
}
