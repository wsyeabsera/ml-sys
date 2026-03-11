import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Interactive RoPE (Rotary Position Embedding) visualization.
 * Shows how pairs of values rotate by position-dependent angles.
 */

const HEAD_DIM = 4; // 2 pairs
const INITIAL_VEC = [1.0, 0.0, 0.7, 0.7];

function computeRope(vec: number[], pos: number, headDim: number): number[] {
  const out = [...vec];
  for (let i = 0; i < headDim; i += 2) {
    const freq = 1.0 / Math.pow(10000, i / headDim);
    const angle = pos * freq;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x0 = out[i];
    const x1 = out[i + 1];
    out[i] = x0 * cos - x1 * sin;
    out[i + 1] = x0 * sin + x1 * cos;
  }
  return out;
}

function Arrow({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={2} markerEnd={`url(#arrow-${color.replace("#", "")})`}
    />
  );
}

function PairPlot({ pair, pairIndex, pos }: { pair: [number, number]; pairIndex: number; pos: number }) {
  const freq = 1.0 / Math.pow(10000, (pairIndex * 2) / HEAD_DIM);
  const angle = pos * freq;
  const angleDeg = (angle * 180) / Math.PI;
  const color = pairIndex === 0 ? "var(--color-accent-blue)" : "#f59e0b";
  const cx = 80;
  const cy = 80;
  const scale = 55;

  const ox = INITIAL_VEC[pairIndex * 2];
  const oy = INITIAL_VEC[pairIndex * 2 + 1];

  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-[var(--color-text-muted)]">
        Pair {pairIndex}: freq={freq.toFixed(4)}, angle={angleDeg.toFixed(1)}°
      </p>
      <svg width={160} height={160} className="bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-surface-overlay)]">
        <defs>
          <marker id={`arrow-${String(color).replace(/[^a-zA-Z0-9]/g, "")}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        </defs>
        {/* Grid */}
        <line x1={0} y1={cy} x2={160} y2={cy} stroke="var(--color-surface-overlay)" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={160} stroke="var(--color-surface-overlay)" strokeWidth={1} />
        {/* Unit circle */}
        <circle cx={cx} cy={cy} r={scale} fill="none" stroke="var(--color-surface-overlay)" strokeWidth={1} strokeDasharray="4 4" />
        {/* Original vector (dim) */}
        <Arrow x1={cx} y1={cy} x2={cx + ox * scale} y2={cy - oy * scale} color="var(--color-text-muted)" />
        {/* Rotated vector */}
        <motion.g
          initial={false}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Arrow x1={cx} y1={cy} x2={cx + pair[0] * scale} y2={cy - pair[1] * scale} color={String(color)} />
          <circle cx={cx + pair[0] * scale} cy={cy - pair[1] * scale} r={3} fill={String(color)} />
        </motion.g>
        {/* Labels */}
        <text x={4} y={14} fontSize={10} fill="var(--color-text-muted)" fontFamily="monospace">
          [{pair[0].toFixed(2)}, {pair[1].toFixed(2)}]
        </text>
      </svg>
    </div>
  );
}

export default function RopeViz() {
  const [pos, setPos] = useState(0);
  const rotated = computeRope(INITIAL_VEC, pos, HEAD_DIM);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        RoPE: Rotating Pairs by Position
      </h4>
      <p className="text-xs text-[var(--color-text-muted)]">
        Each pair of values rotates at a different frequency. Earlier pairs rotate faster; later pairs rotate slower. Drag the position slider to see how the rotation changes.
      </p>

      {/* Position slider */}
      <div className="flex items-center gap-4">
        <label className="text-xs font-mono text-[var(--color-text-muted)]">
          pos = {pos}
        </label>
        <input
          type="range"
          min={0}
          max={20}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="flex-1 accent-[var(--color-accent-blue)]"
        />
      </div>

      {/* Pair plots */}
      <div className="grid grid-cols-2 gap-4">
        <PairPlot pair={[rotated[0], rotated[1]]} pairIndex={0} pos={pos} />
        <PairPlot pair={[rotated[2], rotated[3]]} pairIndex={1} pos={pos} />
      </div>

      {/* Value table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pos}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-3"
        >
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <p className="text-[var(--color-text-muted)] mb-1">Original</p>
              <p className="text-[var(--color-text-primary)]">
                [{INITIAL_VEC.map((v) => v.toFixed(3)).join(", ")}]
              </p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] mb-1">After RoPE (pos={pos})</p>
              <p className="text-[var(--color-text-primary)]">
                [{rotated.map((v) => v.toFixed(3)).join(", ")}]
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-[var(--color-text-muted)]">
        Gray arrow = original vector. Colored arrow = rotated. Notice pair 0 (blue) rotates much faster than pair 1 (amber) — the frequency decreases exponentially with pair index.
      </p>
    </div>
  );
}
