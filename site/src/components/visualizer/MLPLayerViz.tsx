import { useState } from "react";

interface LayerData {
  layer: number;
  w: { shape: number[]; data: number[]; grad: number[] };
  b: { shape: number[]; data: number[]; grad: number[] };
}

interface MLPData {
  output: { data: number[]; shape: number[] };
  input_grad: number[];
  layers: LayerData[];
}

export default function MLPLayerViz({ data }: { data: MLPData }) {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [view, setView] = useState<"weights" | "gradients">("weights");

  const layers = data.layers;
  const dims = [layers[0].w.shape[0]];
  layers.forEach((l) => dims.push(l.w.shape[1]));
  const archStr = dims.join(" → ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono font-semibold">
          mlp
        </span>
        <span className="text-[var(--color-text-muted)]">
          {layers.length} layers, architecture: {archStr}
        </span>
      </div>

      {/* Architecture diagram */}
      <div className="flex items-center justify-center gap-2 py-4">
        {dims.map((dim, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLayer(i < layers.length ? i : null)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                selectedLayer === i
                  ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10"
                  : "border-[var(--color-surface-overlay)] hover:bg-[var(--color-surface-overlay)]/50"
              }`}
            >
              <span className="text-lg font-bold text-[var(--color-text-primary)]">{dim}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {i === 0 ? "input" : i === dims.length - 1 ? "output" : `hidden ${i}`}
              </span>
            </button>
            {i < dims.length - 1 && (
              <svg width="24" height="12" className="text-[var(--color-text-muted)]">
                <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="14,2 20,6 14,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Output</h3>
        <div className="flex gap-1">
          {data.output.data.map((val, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded bg-[var(--color-accent-emerald)]/20 text-xs font-mono text-[var(--color-text-primary)]"
            >
              {val.toFixed(4)}
            </div>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("weights")}
          className={`px-3 py-1 text-xs rounded-lg ${
            view === "weights"
              ? "bg-[var(--color-accent-blue)] text-white"
              : "bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]"
          }`}
        >
          Weights
        </button>
        <button
          onClick={() => setView("gradients")}
          className={`px-3 py-1 text-xs rounded-lg ${
            view === "gradients"
              ? "bg-[var(--color-accent-blue)] text-white"
              : "bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]"
          }`}
        >
          Gradients
        </button>
      </div>

      {/* Layer details */}
      {layers.map((layer, i) => {
        const isSelected = selectedLayer === i || selectedLayer === null;
        if (!isSelected && selectedLayer !== null) return null;

        const [rows, cols] = layer.w.shape;
        const values = view === "weights" ? layer.w.data : layer.w.grad;
        const biasValues = view === "weights" ? layer.b.data : layer.b.grad;
        const maxAbs = Math.max(...values.map(Math.abs), ...biasValues.map(Math.abs)) || 1;

        return (
          <div key={i} className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Layer {i}: W [{rows}×{cols}] + b [{cols}]
            </h3>

            {/* Weight matrix */}
            <div className="overflow-x-auto">
              <div className="inline-block space-y-0.5">
                {Array.from({ length: rows }, (_, r) => (
                  <div key={r} className="flex gap-0.5">
                    {Array.from({ length: cols }, (_, c) => {
                      const val = values[r * cols + c];
                      const abs = Math.abs(val);
                      const intensity = abs / maxAbs;
                      return (
                        <div
                          key={c}
                          className="w-16 h-8 rounded flex items-center justify-center text-[10px] font-mono"
                          style={{
                            backgroundColor: val > 0
                              ? `rgba(59, 130, 246, ${intensity * 0.7 + 0.05})`
                              : val < 0
                                ? `rgba(244, 63, 94, ${intensity * 0.7 + 0.05})`
                                : "var(--color-surface-overlay)",
                            color: intensity > 0.3 ? "white" : "var(--color-text-muted)",
                          }}
                          title={`W[${r},${c}] = ${val.toFixed(4)}`}
                        >
                          {val.toFixed(3)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Bias */}
            <div className="space-y-1">
              <span className="text-xs text-[var(--color-text-muted)]">Bias:</span>
              <div className="flex gap-0.5">
                {biasValues.map((val, j) => {
                  const abs = Math.abs(val);
                  const intensity = abs / maxAbs;
                  return (
                    <div
                      key={j}
                      className="w-16 h-8 rounded flex items-center justify-center text-[10px] font-mono"
                      style={{
                        backgroundColor: val > 0
                          ? `rgba(59, 130, 246, ${intensity * 0.7 + 0.05})`
                          : val < 0
                            ? `rgba(244, 63, 94, ${intensity * 0.7 + 0.05})`
                            : "var(--color-surface-overlay)",
                        color: intensity > 0.3 ? "white" : "var(--color-text-muted)",
                      }}
                      title={`b[${j}] = ${val.toFixed(4)}`}
                    >
                      {val.toFixed(3)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Input gradient */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Input Gradient</h3>
        <div className="flex gap-1">
          {data.input_grad.map((val, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded text-xs font-mono"
              style={{
                backgroundColor: val > 0
                  ? "rgba(16, 185, 129, 0.2)"
                  : val < 0
                    ? "rgba(244, 63, 94, 0.2)"
                    : "var(--color-surface-overlay)",
                color: "var(--color-text-primary)",
              }}
            >
              {val.toFixed(4)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
