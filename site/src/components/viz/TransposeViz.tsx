import { useState } from "react";
import { motion } from "framer-motion";

const DATA = [1, 2, 3, 4, 5, 6];
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4",
];

// Original: shape [2,3], strides [3,1]
// Transposed: shape [3,2], strides [1,3]
const ORIGINAL = {
  shape: [2, 3] as [number, number],
  strides: [3, 1] as [number, number],
};
const TRANSPOSED = {
  shape: [3, 2] as [number, number],
  strides: [1, 3] as [number, number],
};

function Grid({
  title,
  shape,
  strides,
  highlightDim,
  isContiguous,
}: {
  title: string;
  shape: [number, number];
  strides: [number, number];
  highlightDim: number | null;
  isContiguous: boolean;
}) {
  const [rows, cols] = shape;

  // Build grid: element at [r,c] has flat index = r*strides[0] + c*strides[1]
  const cells: { row: number; col: number; flatIdx: number; value: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: typeof cells[0] = [];
    for (let c = 0; c < cols; c++) {
      const flatIdx = r * strides[0] + c * strides[1];
      row.push({ row: r, col: c, flatIdx, value: DATA[flatIdx] });
    }
    cells.push(row);
  }

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isContiguous
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {isContiguous ? "contiguous" : "non-contiguous"}
        </span>
      </div>
      <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
        shape=[{shape.join(",")}] strides=[{strides.join(",")}]
      </p>

      <div className="flex flex-col gap-1 items-start">
        {cells.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((cell) => {
              const dimHighlight =
                highlightDim === 0
                  ? cell.col === 0 // highlight first col to show row stride
                  : highlightDim === 1
                    ? cell.row === 0 // highlight first row to show col stride
                    : false;

              return (
                <motion.div
                  key={`${cell.row}-${cell.col}`}
                  layoutId={`transpose-${cell.value}`}
                  className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center text-white font-bold text-sm shadow-md ${
                    dimHighlight ? "ring-2 ring-white/60" : ""
                  }`}
                  style={{ backgroundColor: COLORS[cell.flatIdx] }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <span className="text-sm">{cell.value}</span>
                  <span className="text-[9px] opacity-60 font-mono">
                    [{cell.row},{cell.col}]
                  </span>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransposeViz() {
  const [highlightDim, setHighlightDim] = useState<number | null>(null);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 space-y-5">
      {/* Dim highlight buttons */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-[var(--color-text-muted)]">
          Highlight stride for:
        </span>
        {["dim 0 (rows)", "dim 1 (cols)", "none"].map((label, i) => {
          const val = i < 2 ? i : null;
          return (
            <button
              key={label}
              onClick={() => setHighlightDim(val)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                highlightDim === val
                  ? "bg-[var(--color-accent-blue)] text-white"
                  : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Side by side grids */}
      <div className="flex gap-8 flex-wrap">
        <Grid
          title="Original"
          shape={ORIGINAL.shape}
          strides={ORIGINAL.strides}
          highlightDim={highlightDim}
          isContiguous={true}
        />
        <Grid
          title="After transpose()"
          shape={TRANSPOSED.shape}
          strides={TRANSPOSED.strides}
          highlightDim={highlightDim}
          isContiguous={false}
        />
      </div>

      {/* Shared flat data */}
      <div className="space-y-1">
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          shared flat data (unchanged)
        </p>
        <div className="flex gap-1.5 justify-center">
          {DATA.map((v, i) => (
            <div
              key={i}
              className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: COLORS[i] }}
            >
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-1">
        <p>
          <strong className="text-[var(--color-text-primary)]">Key insight:</strong>{" "}
          Transpose swaps the strides, not the data. Strides go from [3,1] to [1,3].
        </p>
        <p>
          After transpose, moving along dim 1 jumps <strong>3</strong> elements
          in memory (scattered). The data is <strong>non-contiguous</strong> —
          if you now reshape, the library must copy data into a fresh buffer.
          That's <em>materialization</em>.
        </p>
      </div>
    </div>
  );
}
