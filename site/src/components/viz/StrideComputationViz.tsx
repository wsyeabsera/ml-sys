import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS: { label: string; shape: number[] }[] = [
  { label: "[2, 3]", shape: [2, 3] },
  { label: "[3, 2]", shape: [3, 2] },
  { label: "[2, 3, 4]", shape: [2, 3, 4] },
  { label: "[4, 2, 3]", shape: [4, 2, 3] },
];

interface Step {
  dim: number;
  factors: number[];
  product: number;
  label: string;
}

function computeSteps(shape: number[]): Step[] {
  const steps: Step[] = [];
  for (let i = shape.length - 1; i >= 0; i--) {
    const factors = shape.slice(i + 1);
    const product = factors.length === 0 ? 1 : factors.reduce((a, b) => a * b, 1);
    const label =
      factors.length === 0
        ? "1 (rightmost dimension)"
        : factors.join(" x ") + " = " + product;
    steps.push({ dim: i, factors, product, label });
  }
  return steps.reverse();
}

export default function StrideComputationViz() {
  const [shapeIdx, setShapeIdx] = useState(0);
  const [visibleStep, setVisibleStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const shape = PRESETS[shapeIdx].shape;
  const steps = computeSteps(shape);

  // Reset when shape changes
  useEffect(() => {
    setVisibleStep(-1);
    setPlaying(false);
  }, [shapeIdx]);

  // Auto-advance animation
  useEffect(() => {
    if (!playing) return;
    if (visibleStep >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setVisibleStep((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [playing, visibleStep, steps.length]);

  const handlePlay = () => {
    setVisibleStep(-1);
    setPlaying(true);
    // Kick off first step after reset
    setTimeout(() => setVisibleStep(0), 100);
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 space-y-5">
      {/* Shape selector */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-[var(--color-text-muted)]">Shape:</span>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setShapeIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              shapeIdx === i
                ? "bg-[var(--color-accent-blue)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={handlePlay}
          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--color-accent-emerald)] text-white hover:opacity-90 transition-opacity ml-2"
        >
          {playing ? "..." : "Animate"}
        </button>
      </div>

      {/* Formula */}
      <div className="text-sm font-mono text-[var(--color-text-secondary)]">
        <span className="text-[var(--color-text-muted)]">formula: </span>
        strides[i] = product(shape[i+1:])
      </div>

      {/* Step-by-step breakdown */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const visible = i <= visibleStep;
          return (
            <AnimatePresence key={`step-${step.dim}-${shapeIdx}`}>
              {visible && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 bg-[var(--color-surface-raised)] rounded-lg p-3"
                >
                  {/* Dim label */}
                  <span className="text-xs font-mono text-[var(--color-accent-blue)] w-20 shrink-0">
                    strides[{step.dim}]
                  </span>

                  {/* Computation */}
                  <span className="text-xs font-mono text-[var(--color-text-secondary)] flex-1">
                    = {step.label}
                  </span>

                  {/* Result */}
                  <motion.span
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent-emerald)]/20 border border-[var(--color-accent-emerald)]/40 text-sm font-bold font-mono text-[var(--color-accent-emerald)]"
                  >
                    {step.product}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Final result */}
      {visibleStep >= steps.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-mono text-center"
        >
          <span className="text-[var(--color-text-muted)]">shape=</span>
          <span className="text-[var(--color-accent-blue)]">
            [{shape.join(",")}]
          </span>
          <span className="text-[var(--color-text-muted)]"> → strides=</span>
          <span className="text-[var(--color-accent-emerald)]">
            [{steps.map((s) => s.product).join(",")}]
          </span>
        </motion.div>
      )}

      {/* Show all button */}
      {visibleStep < steps.length - 1 && !playing && (
        <button
          onClick={() => setVisibleStep(steps.length - 1)}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Show all steps
        </button>
      )}
    </div>
  );
}
