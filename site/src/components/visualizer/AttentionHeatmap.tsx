import { useState } from "react";
import { motion } from "framer-motion";

interface AttentionData {
  output: { data: number[]; shape: number[] };
  attention_weights: { data: number[]; shape: number[] };
  Q_grad: number[];
  K_grad: number[];
  V_grad: number[];
}

export default function AttentionHeatmap({ data }: { data: AttentionData }) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const seqLen = data.attention_weights.shape[0];
  const dV = data.output.shape[1];

  // Reshape flat attention weights into 2D
  const weights: number[][] = [];
  for (let i = 0; i < seqLen; i++) {
    const row: number[] = [];
    for (let j = 0; j < seqLen; j++) {
      row.push(data.attention_weights.data[i * seqLen + j]);
    }
    weights.push(row);
  }

  // Reshape output into 2D
  const output: number[][] = [];
  for (let i = 0; i < seqLen; i++) {
    const row: number[] = [];
    for (let j = 0; j < dV; j++) {
      row.push(data.output.data[i * dV + j]);
    }
    output.push(row);
  }

  const maxWeight = Math.max(...data.attention_weights.data);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] font-mono font-semibold">
          attention
        </span>
        <span className="text-[var(--color-text-muted)]">
          {seqLen} tokens, d_v={dV}
        </span>
      </div>

      {/* Attention weight heatmap */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Attention Weights
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Row = query token, Column = key token. Color intensity = how much attention.
          Each row sums to 1.
        </p>

        <div className="inline-block">
          {/* Column headers */}
          <div className="flex ml-16">
            {Array.from({ length: seqLen }, (_, j) => (
              <div
                key={j}
                className="w-16 text-center text-xs font-mono text-[var(--color-text-muted)]"
              >
                Key {j}
              </div>
            ))}
          </div>

          {/* Rows */}
          {weights.map((row, i) => (
            <div key={i} className="flex items-center">
              <div className="w-16 text-xs font-mono text-[var(--color-text-muted)] text-right pr-2">
                Query {i}
              </div>
              {row.map((weight, j) => {
                const intensity = weight / maxWeight;
                const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                return (
                  <motion.div
                    key={j}
                    className="w-16 h-12 border border-[var(--color-surface-overlay)] flex items-center justify-center cursor-pointer relative"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${intensity * 0.8 + 0.05})`,
                    }}
                    onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                    onMouseLeave={() => setHoveredCell(null)}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className={`text-xs font-mono ${intensity > 0.5 ? "text-white" : "text-[var(--color-text-primary)]"}`}>
                      {weight.toFixed(2)}
                    </span>
                    {isHovered && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[var(--color-surface-base)] border border-[var(--color-surface-overlay)] text-xs whitespace-nowrap z-10 shadow-lg">
                        Q{i} → K{j}: {(weight * 100).toFixed(1)}%
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Output
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Each row is the weighted sum of value vectors, using the attention weights above.
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs font-mono">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="pr-4 pb-1 text-left font-medium">Token</th>
                {Array.from({ length: dV }, (_, j) => (
                  <th key={j} className="px-3 pb-1 text-right font-medium">d{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {output.map((row, i) => (
                <tr key={i} className="border-t border-[var(--color-surface-overlay)]">
                  <td className="pr-4 py-1 text-[var(--color-accent-blue)]">Token {i}</td>
                  {row.map((val, j) => (
                    <td key={j} className="px-3 py-1 text-right text-[var(--color-text-primary)]">
                      {val.toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gradients */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Gradients
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <GradPanel label="Q gradients" data={data.Q_grad} seqLen={seqLen} dim={data.output.shape[1]} />
          <GradPanel label="K gradients" data={data.K_grad} seqLen={seqLen} dim={data.output.shape[1]} />
          <GradPanel label="V gradients" data={data.V_grad} seqLen={seqLen} dim={data.output.shape[1]} />
        </div>
      </div>
    </div>
  );
}

function GradPanel({ label, data, seqLen, dim }: { label: string; data: number[]; seqLen: number; dim: number }) {
  return (
    <div className="bg-[var(--color-surface-base)] rounded-lg p-3 space-y-1">
      <div className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</div>
      <div className="space-y-0.5">
        {Array.from({ length: seqLen }, (_, i) => (
          <div key={i} className="flex gap-1">
            {Array.from({ length: dim }, (_, j) => {
              const val = data[i * dim + j];
              const abs = Math.abs(val);
              const maxAbs = Math.max(...data.map(Math.abs)) || 1;
              return (
                <div
                  key={j}
                  className="flex-1 h-6 rounded flex items-center justify-center text-[10px] font-mono"
                  style={{
                    backgroundColor: val > 0
                      ? `rgba(16, 185, 129, ${(abs / maxAbs) * 0.6 + 0.1})`
                      : val < 0
                        ? `rgba(244, 63, 94, ${(abs / maxAbs) * 0.6 + 0.1})`
                        : "transparent",
                    color: abs / maxAbs > 0.3 ? "white" : "var(--color-text-muted)",
                  }}
                  title={`[${i},${j}]: ${val.toFixed(4)}`}
                >
                  {val.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
