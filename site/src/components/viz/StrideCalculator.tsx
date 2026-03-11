import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { computeStrides, multiIndexToFlat } from "../../lib/tensor-math";

export default function StrideCalculator() {
  const [shapeInput, setShapeInput] = useState("2,3");
  const [indicesInput, setIndicesInput] = useState("1,2");

  const shape = useMemo(
    () => shapeInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n)),
    [shapeInput]
  );
  const strides = useMemo(() => (shape.length > 0 ? computeStrides(shape) : []), [shape]);

  const indices = useMemo(
    () => indicesInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n)),
    [indicesInput]
  );

  const isValid = indices.length === shape.length && indices.every((idx, i) => idx >= 0 && idx < shape[i]);
  const flatIndex = isValid ? multiIndexToFlat(indices, strides) : null;

  // Build the formula string
  const formulaParts = indices.map((idx, i) => ({
    index: idx,
    stride: strides[i],
    product: idx * strides[i],
  }));

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 space-y-5">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Stride Calculator
      </h4>

      {/* Inputs */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-[var(--color-text-muted)] block mb-1">
            Shape
          </label>
          <input
            type="text"
            value={shapeInput}
            onChange={(e) => setShapeInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] text-sm font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
            placeholder="2,3"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-[var(--color-text-muted)] block mb-1">
            Indices
          </label>
          <input
            type="text"
            value={indicesInput}
            onChange={(e) => setIndicesInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] text-sm font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
            placeholder="1,2"
          />
        </div>
      </div>

      {/* Strides */}
      <div className="text-sm font-mono">
        <span className="text-[var(--color-text-muted)]">strides = </span>
        <span className="text-[var(--color-accent-emerald)]">[{strides.join(", ")}]</span>
      </div>

      {/* Formula breakdown */}
      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="text-sm font-mono text-[var(--color-text-secondary)]">
            flat_index = {formulaParts.map((p, i) => (
              <span key={i}>
                {i > 0 && <span className="text-[var(--color-text-muted)]"> + </span>}
                <span className="text-[var(--color-accent-blue)]">{p.index}</span>
                <span className="text-[var(--color-text-muted)]">×</span>
                <span className="text-[var(--color-accent-emerald)]">{p.stride}</span>
              </span>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            {formulaParts.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[var(--color-text-muted)] mx-1">+</span>}
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-[var(--color-surface-raised)] text-sm font-mono text-[var(--color-accent-amber)]"
                >
                  {p.product}
                </motion.span>
              </span>
            ))}
            <span className="text-[var(--color-text-muted)] mx-1">=</span>
            <motion.span
              key={flatIndex}
              initial={{ scale: 1.3, color: "#3b82f6" }}
              animate={{ scale: 1, color: "#f1f5f9" }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-accent-blue)]/20 border border-[var(--color-accent-blue)]/40 text-lg font-bold font-mono"
            >
              {flatIndex}
            </motion.span>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            data[{flatIndex}] is at position [{indices.join(", ")}] in the tensor
          </p>
        </motion.div>
      )}

      {!isValid && indices.length > 0 && (
        <p className="text-xs text-[var(--color-accent-rose)]">
          Indices must match shape dimensions and be within bounds
        </p>
      )}
    </div>
  );
}
