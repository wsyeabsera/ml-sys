import { useState } from "react";
import { motion } from "framer-motion";

const cellColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
];

interface TensorData {
  op?: string;
  name?: string;
  result_name?: string;
  shape: number[];
  data: number[];
  strides?: number[];
  original_shape?: number[];
}

export default function TensorViz({ tensor }: { tensor: TensorData }) {
  const [expanded, setExpanded] = useState(false);

  const name = tensor.result_name ?? tensor.name ?? "tensor";
  const shape = tensor.shape;
  const data = tensor.data;
  const label = tensor.op?.replace("tensor_", "") ?? "result";

  const totalElements = data.length;
  const maxInlineElements = 24;
  const shouldCollapse = totalElements > maxInlineElements && !expanded;
  const displayData = shouldCollapse
    ? data.slice(0, maxInlineElements)
    : data;

  // Build 2D grid rows from shape
  const rows: number[][] = [];
  if (shape.length === 0 || shape.length === 1) {
    rows.push(displayData);
  } else {
    const cols = shape[shape.length - 1];
    for (let i = 0; i < displayData.length; i += cols) {
      rows.push(displayData.slice(i, i + cols));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-2"
    >
      {/* Header: op + name + shape */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] font-mono">
          {label}
        </span>
        <span className="font-mono text-[var(--color-text-primary)] font-semibold">
          "{name}"
        </span>
        <span className="font-mono text-[var(--color-text-muted)]">
          [{shape.join(" × ")}]
        </span>
        {tensor.strides && (
          <span className="font-mono text-[var(--color-text-muted)]">
            strides=[{tensor.strides.join(",")}]
          </span>
        )}
        {tensor.original_shape && (
          <span className="font-mono text-[var(--color-text-muted)]">
            from [{tensor.original_shape.join(" × ")}]
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="space-y-1 overflow-x-auto">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((val, ci) => {
              const flatIdx = ri * (shape[shape.length - 1] || row.length) + ci;
              return (
                <div
                  key={ci}
                  className={`${cellColors[flatIdx % cellColors.length]} min-w-[2.5rem] h-8 rounded flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-mono font-medium">
                    {formatNumber(val)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      {totalElements > maxInlineElements && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[var(--color-accent-blue)] hover:underline"
        >
          {expanded
            ? "Show less"
            : `Show all ${totalElements} elements (${totalElements - maxInlineElements} hidden)`}
        </button>
      )}
    </motion.div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  if (Math.abs(n) < 0.01) return n.toExponential(1);
  return n.toFixed(2);
}
