import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 3 tokens, d_k = 2
// Q, K, V are [3, 2]
const Q = [
  [1.0, 0.0],
  [0.0, 1.0],
  [0.5, 0.5],
];
const K = [
  [1.0, 0.0],
  [0.0, 1.0],
  [0.7, 0.7],
];
const V = [
  [1.0, 0.0],
  [0.0, 1.0],
  [0.5, 0.5],
];

const D_K = 2;

type Step = 0 | 1 | 2 | 3 | 4;

function matmul2d(a: number[][], b: number[][]): number[][] {
  const m = a.length;
  const n = b[0].length;
  const k = b.length;
  const result: number[][] = [];
  for (let i = 0; i < m; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let p = 0; p < k; p++) sum += a[i][p] * b[p][j];
      result[i][j] = sum;
    }
  }
  return result;
}

function transpose2d(a: number[][]): number[][] {
  const m = a.length;
  const n = a[0].length;
  const result: number[][] = [];
  for (let j = 0; j < n; j++) {
    result[j] = [];
    for (let i = 0; i < m; i++) {
      result[j][i] = a[i][j];
    }
  }
  return result;
}

function scale2d(a: number[][], s: number): number[][] {
  return a.map((row) => row.map((v) => v * s));
}

function softmaxRows(a: number[][]): number[][] {
  return a.map((row) => {
    const max = Math.max(...row);
    const exps = row.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  });
}

// Precompute all steps
const KT = transpose2d(K);
const scores = matmul2d(Q, KT); // [3,3]
const scaled = scale2d(scores, 1.0 / Math.sqrt(D_K)); // [3,3]
const weights = softmaxRows(scaled); // [3,3]
const output = matmul2d(weights, V); // [3,2]

const TOKEN_LABELS = ["token 0", "token 1", "token 2"];

function MatrixDisplay({
  data,
  label,
  rowLabels,
  colLabels,
  highlight,
  isHeatmap,
}: {
  data: number[][];
  label: string;
  rowLabels?: string[];
  colLabels?: string[];
  highlight?: boolean;
  isHeatmap?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        {label}
      </p>
      <div className="overflow-hidden rounded border border-[var(--color-surface-overlay)]">
        <table className="text-xs font-mono">
          {colLabels && (
            <thead>
              <tr>
                <th className="px-1" />
                {colLabels.map((l, i) => (
                  <th
                    key={i}
                    className="px-2 py-1 text-[var(--color-text-muted)] font-normal"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {rowLabels && (
                  <td className="px-2 py-1 text-[var(--color-text-muted)]">
                    {rowLabels[i]}
                  </td>
                )}
                {row.map((val, j) => {
                  const bg = isHeatmap
                    ? `rgba(59, 130, 246, ${Math.min(val, 1) * 0.5})`
                    : undefined;
                  return (
                    <td
                      key={j}
                      className="px-2 py-1 text-center"
                      style={{
                        backgroundColor: bg,
                        color: isHeatmap && val > 0.4
                          ? "white"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {val.toFixed(3)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STEP_INFO: { title: string; formula: string; explanation: string }[] = [
  {
    title: "Step 1: Q @ K^T",
    formula: "scores = Q @ K^T → [3, 3]",
    explanation:
      "Each entry scores[i][j] measures how much query i matches key j. Higher score = more relevant.",
  },
  {
    title: "Step 2: Scale",
    formula: "scaled = scores / √d_k = scores / √2",
    explanation:
      "Without scaling, dot products grow with d_k. Large values push softmax into saturation (nearly one-hot), killing gradients.",
  },
  {
    title: "Step 3: Softmax",
    formula: "weights = softmax(scaled) row-wise",
    explanation:
      "Each row becomes a probability distribution (sums to 1). This is where the model decides how much to attend to each token.",
  },
  {
    title: "Step 4: weights @ V",
    formula: "output = weights @ V → [3, 2]",
    explanation:
      "Each output row is a weighted combination of value vectors. Token 0 attends mostly to itself (high self-score), so its output ≈ V[0].",
  },
  {
    title: "Summary",
    formula: "Attention(Q,K,V) = softmax(QK^T / √d_k) @ V",
    explanation:
      "That's the full attention formula. Q asks questions, K provides labels, V holds the answers. The model learns all three projections.",
  },
];

export default function AttentionViz() {
  const [step, setStep] = useState<Step>(0);

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, 4) as Step);
  }, []);

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0) as Step);
  }, []);

  const reset = useCallback(() => {
    setStep(0);
  }, []);

  const info = STEP_INFO[step];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Attention Step-Through: 3 tokens, d_k = 2
      </h4>

      {/* Input matrices — always visible */}
      <div className="grid grid-cols-3 gap-4">
        <MatrixDisplay
          data={Q}
          label="Q (Queries)"
          rowLabels={TOKEN_LABELS}
          colLabels={["d0", "d1"]}
        />
        <MatrixDisplay
          data={K}
          label="K (Keys)"
          rowLabels={TOKEN_LABELS}
          colLabels={["d0", "d1"]}
        />
        <MatrixDisplay
          data={V}
          label="V (Values)"
          rowLabels={TOKEN_LABELS}
          colLabels={["d0", "d1"]}
        />
      </div>

      {/* Step result */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-4"
        >
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-[var(--color-accent-blue)]">
              {info.title}
            </h5>
            <p className="text-xs font-mono text-[var(--color-text-primary)]">
              {info.formula}
            </p>
          </div>

          {/* Show the matrix for this step */}
          <div className="flex gap-6 flex-wrap">
            {step >= 0 && step < 4 && (
              <MatrixDisplay
                data={step === 0 ? scores : step === 1 ? scaled : step === 2 ? weights : output}
                label={
                  step === 0
                    ? "Scores (Q @ K^T)"
                    : step === 1
                    ? "Scaled Scores"
                    : step === 2
                    ? "Attention Weights"
                    : "Output"
                }
                rowLabels={TOKEN_LABELS}
                colLabels={step === 3 ? ["d0", "d1"] : TOKEN_LABELS}
                isHeatmap={step === 2}
              />
            )}
            {step === 4 && (
              <>
                <MatrixDisplay
                  data={weights}
                  label="Attention Weights"
                  rowLabels={TOKEN_LABELS}
                  colLabels={TOKEN_LABELS}
                  isHeatmap
                />
                <MatrixDisplay
                  data={output}
                  label="Final Output"
                  rowLabels={TOKEN_LABELS}
                  colLabels={["d0", "d1"]}
                />
              </>
            )}
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {info.explanation}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={prev}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] disabled:opacity-30 hover:bg-[var(--color-surface-overlay)] transition-all"
        >
          &larr; Prev
        </button>
        <button
          onClick={next}
          disabled={step === 4}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent-blue)] text-white disabled:opacity-30 hover:brightness-110 transition-all"
        >
          Next &rarr;
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] transition-all"
        >
          Reset
        </button>
      </div>

      <div className="text-center text-xs text-[var(--color-text-muted)] font-mono">
        Step {step + 1} of 5
      </div>
    </div>
  );
}
