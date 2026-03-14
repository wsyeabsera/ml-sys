import { useState } from "react";

interface TensorData {
  op?: string;
  name?: string;
  result_name?: string;
  shape: number[];
  data: number[];
  strides?: number[];
  original_shape?: number[];
  num_elements?: number;
}

const cellColors = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500",
  "bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-rose-400", "bg-violet-400", "bg-cyan-400",
];

export default function TensorExplorer({ tensor }: { tensor: TensorData }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "flat" | "stats">("grid");

  const name = tensor.result_name ?? tensor.name ?? "tensor";
  const shape = tensor.shape;
  const data = tensor.data;
  const strides = tensor.strides ?? computeStrides(shape);
  const op = tensor.op?.replace("tensor_", "") ?? "tensor";

  // Stats
  const min = Math.min(...data);
  const max = Math.max(...data);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
  const std = Math.sqrt(variance);

  // Build 2D grid rows
  const rows: number[][] = [];
  if (shape.length <= 1) {
    rows.push(data);
  } else {
    const cols = shape[shape.length - 1];
    for (let i = 0; i < data.length; i += cols) {
      rows.push(data.slice(i, i + cols));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] font-mono font-semibold">
          {op}
        </span>
        <span className="font-mono text-[var(--color-text-primary)] font-semibold">
          "{name}"
        </span>
      </div>

      {/* Shape / Strides / Stats bar */}
      <div className="flex flex-wrap gap-4 text-xs font-mono">
        <div>
          <span className="text-[var(--color-text-muted)]">shape</span>{" "}
          <span className="text-[var(--color-text-primary)]">[{shape.join(", ")}]</span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">strides</span>{" "}
          <span className="text-[var(--color-text-primary)]">[{strides.join(", ")}]</span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">elements</span>{" "}
          <span className="text-[var(--color-text-primary)]">{data.length}</span>
        </div>
        {tensor.original_shape && (
          <div>
            <span className="text-[var(--color-text-muted)]">from</span>{" "}
            <span className="text-[var(--color-text-primary)]">[{tensor.original_shape.join(", ")}]</span>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(["grid", "flat", "stats"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-xs rounded-lg capitalize ${
              viewMode === mode
                ? "bg-[var(--color-accent-blue)] text-white"
                : "bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="space-y-2 overflow-x-auto">
          {shape.length >= 2 && (
            <div className="text-xs text-[var(--color-text-muted)]">
              {shape.length === 2
                ? `${shape[0]} rows × ${shape[1]} cols`
                : `${shape.slice(0, -1).join(" × ")} blocks of ${shape[shape.length - 1]}`}
            </div>
          )}
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {shape.length >= 2 && (
                <div className="w-8 text-right text-xs font-mono text-[var(--color-text-muted)] self-center pr-1">
                  {ri}
                </div>
              )}
              {row.map((val, ci) => {
                const flatIdx = ri * (shape[shape.length - 1] || row.length) + ci;
                const isHovered = hoveredIdx === flatIdx;
                return (
                  <div
                    key={ci}
                    className={`${cellColors[flatIdx % cellColors.length]} min-w-[3rem] h-10 rounded flex flex-col items-center justify-center transition-transform ${isHovered ? "scale-110 ring-2 ring-white" : ""}`}
                    onMouseEnter={() => setHoveredIdx(flatIdx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <span className="text-white text-xs font-mono font-medium">
                      {formatNumber(val)}
                    </span>
                    <span className="text-white/50 text-[9px] font-mono">
                      [{shape.length <= 1 ? flatIdx : `${ri},${ci}`}]
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Flat view */}
      {viewMode === "flat" && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-muted)]">
            Flat memory layout (data as stored in memory):
          </div>
          <div className="flex flex-wrap gap-1">
            {data.map((val, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <div
                  key={i}
                  className={`${cellColors[i % cellColors.length]} w-12 h-10 rounded flex flex-col items-center justify-center transition-transform ${isHovered ? "scale-110 ring-2 ring-white" : ""}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <span className="text-white text-xs font-mono font-medium">
                    {formatNumber(val)}
                  </span>
                  <span className="text-white/50 text-[9px] font-mono">[{i}]</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Indexing: flat_index = {shape.map((_, i) => `idx[${i}]×${strides[i]}`).join(" + ")}
          </div>
        </div>
      )}

      {/* Stats view */}
      {viewMode === "stats" && (
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label="Min" value={min} />
          <StatCard label="Max" value={max} />
          <StatCard label="Mean" value={mean} />
          <StatCard label="Std Dev" value={std} />
          <StatCard label="Variance" value={variance} />
          <StatCard label="Sum" value={data.reduce((a, b) => a + b, 0)} />
          <StatCard label="L2 Norm" value={Math.sqrt(data.reduce((a, b) => a + b * b, 0))} />
          <StatCard label="Elements" value={data.length} />
        </div>
      )}

      {/* Hovered element detail */}
      {hoveredIdx !== null && (
        <div className="bg-[var(--color-surface-base)] rounded-lg p-3 text-xs font-mono space-y-1">
          <div>
            flat index: <span className="text-[var(--color-text-primary)]">{hoveredIdx}</span>
          </div>
          <div>
            nd index: <span className="text-[var(--color-text-primary)]">[{flatToNd(hoveredIdx, shape, strides).join(", ")}]</span>
          </div>
          <div>
            value: <span className="text-[var(--color-accent-emerald)] font-semibold">{data[hoveredIdx]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--color-surface-base)] rounded-lg p-3">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="text-sm font-mono text-[var(--color-text-primary)] font-semibold">
        {formatNumber(value)}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 10000) return String(n);
  if (Math.abs(n) < 0.001) return n.toExponential(2);
  if (Math.abs(n) > 10000) return n.toExponential(2);
  return n.toFixed(4);
}

function computeStrides(shape: number[]): number[] {
  const strides = new Array(shape.length);
  let stride = 1;
  for (let i = shape.length - 1; i >= 0; i--) {
    strides[i] = stride;
    stride *= shape[i];
  }
  return strides;
}

function flatToNd(flatIdx: number, shape: number[], strides: number[]): number[] {
  const indices = new Array(shape.length);
  let remaining = flatIdx;
  for (let i = 0; i < shape.length; i++) {
    indices[i] = Math.floor(remaining / strides[i]);
    remaining %= strides[i];
  }
  return indices;
}
