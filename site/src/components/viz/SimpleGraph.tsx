import { useState, useCallback } from "react";
import { motion } from "framer-motion";

/**
 * Simple computation graph for y = a * b + c
 * Used as a gentle introduction before the neuron graph.
 *
 * Nodes:
 *   a=2, b=3 → mul=6
 *   mul=6, c=1 → add=7
 *   add=7 → y=7
 *
 * Backward:
 *   dy/dy = 1
 *   dy/d(add) = 1 (add passes gradient through)
 *   dy/d(mul) = 1 (add passes gradient through)
 *   dy/dc = 1 (add passes gradient through)
 *   dy/da = b * 1 = 3 (mul: local grad for a is b)
 *   dy/db = a * 1 = 2 (mul: local grad for b is a)
 */

interface Node {
  id: string;
  label: string;
  value: number;
  grad: number;
  type: "leaf" | "op" | "output";
  x: number;
  y: number;
  forwardExplanation: string;
  backwardExplanation: string;
}

interface Edge {
  from: string;
  to: string;
}

const NODES: Node[] = [
  { id: "a", label: "a", value: 2, grad: 3, type: "leaf", x: 80, y: 60,
    forwardExplanation: "Input a = 2",
    backwardExplanation: "dy/da = b * incoming = 3 * 1 = 3" },
  { id: "b", label: "b", value: 3, grad: 2, type: "leaf", x: 80, y: 180,
    forwardExplanation: "Input b = 3",
    backwardExplanation: "dy/db = a * incoming = 2 * 1 = 2" },
  { id: "c", label: "c", value: 1, grad: 1, type: "leaf", x: 330, y: 220,
    forwardExplanation: "Input c = 1",
    backwardExplanation: "dy/dc = 1 * incoming = 1 * 1 = 1 (add passes gradient through)" },
  { id: "mul", label: "a * b", value: 6, grad: 1, type: "op", x: 210, y: 120,
    forwardExplanation: "Multiply: a * b = 2 * 3 = 6",
    backwardExplanation: "dy/d(mul) = 1 (passed from add). Distribute: da = b*1 = 3, db = a*1 = 2" },
  { id: "add", label: "add", value: 7, grad: 1, type: "op", x: 400, y: 120,
    forwardExplanation: "Add: mul + c = 6 + 1 = 7",
    backwardExplanation: "dy/d(add) = 1 (from output). Distribute: d(mul) = 1, dc = 1" },
  { id: "y", label: "y", value: 7, grad: 1, type: "output", x: 520, y: 120,
    forwardExplanation: "Output y = 7",
    backwardExplanation: "Start: dy/dy = 1 (seed gradient)" },
];

const EDGES: Edge[] = [
  { from: "a", to: "mul" },
  { from: "b", to: "mul" },
  { from: "mul", to: "add" },
  { from: "c", to: "add" },
  { from: "add", to: "y" },
];

const FORWARD_ORDER = ["a", "b", "c", "mul", "add", "y"];
const BACKWARD_ORDER = ["y", "add", "mul", "c", "a", "b"];

type Phase = "idle" | "forward" | "backward" | "done";

export default function SimpleGraph() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(-1);
  const [explanation, setExplanation] = useState("Click 'Step Forward' to begin the forward pass.");

  const nodeMap = new Map(NODES.map((n) => [n.id, n]));

  const currentOrder = phase === "backward" ? BACKWARD_ORDER : FORWARD_ORDER;
  const activeId = step >= 0 && step < currentOrder.length ? currentOrder[step] : null;

  const stepForward = useCallback(() => {
    setPhase("forward");
    setStep((prev) => {
      const next = prev + 1;
      if (next >= FORWARD_ORDER.length) {
        setPhase("backward");
        setExplanation("Forward pass complete! Click 'Step Backward' to propagate gradients.");
        return -1;
      }
      const node = nodeMap.get(FORWARD_ORDER[next])!;
      setExplanation(node.forwardExplanation);
      return next;
    });
  }, []);

  const stepBackward = useCallback(() => {
    setPhase("backward");
    setStep((prev) => {
      const next = prev + 1;
      if (next >= BACKWARD_ORDER.length) {
        setPhase("done");
        setExplanation("Done! All gradients computed. a.grad=3, b.grad=2, c.grad=1.");
        return BACKWARD_ORDER.length - 1;
      }
      const node = nodeMap.get(BACKWARD_ORDER[next])!;
      setExplanation(node.backwardExplanation);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setStep(-1);
    setExplanation("Click 'Step Forward' to begin the forward pass.");
  }, []);

  const showGrads = phase === "backward" || phase === "done";

  const nodeColors = {
    leaf: "var(--color-accent-blue)",
    op: "var(--color-accent-amber)",
    output: "var(--color-accent-emerald)",
  };

  // Which nodes have been revealed in forward pass
  const revealedForward = new Set(
    phase === "forward"
      ? FORWARD_ORDER.slice(0, step + 1)
      : phase !== "idle"
        ? FORWARD_ORDER
        : []
  );

  // Which nodes have been revealed in backward pass
  const revealedBackward = new Set(
    phase === "backward" || phase === "done"
      ? BACKWARD_ORDER.slice(0, step + 1)
      : []
  );

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 space-y-4">
      {/* SVG Graph */}
      <div className="overflow-x-auto">
        <svg width="600" height="280" viewBox="0 0 600 280" className="mx-auto">
          {/* Edges */}
          {EDGES.map((edge, i) => {
            const from = nodeMap.get(edge.from)!;
            const to = nodeMap.get(edge.to)!;
            const isBackwardActive =
              showGrads && (activeId === edge.from || activeId === edge.to);

            return (
              <motion.line
                key={i}
                x1={from.x + 25}
                y1={from.y}
                x2={to.x - 25}
                y2={to.y}
                stroke={isBackwardActive ? "var(--color-accent-rose)" : "var(--color-surface-overlay)"}
                strokeWidth={isBackwardActive ? 2.5 : 1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const isActive = activeId === node.id;
            const isValueShown = revealedForward.has(node.id);
            const isGradShown = revealedBackward.has(node.id);

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 24 : 20}
                  fill="var(--color-surface-raised)"
                  stroke={nodeColors[node.type]}
                  strokeWidth={isActive ? 3 : 1.5}
                  style={{ transition: "r 0.2s, stroke-width 0.2s" }}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y - 30}
                  textAnchor="middle"
                  fill="var(--color-text-secondary)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                >
                  {node.label}
                </text>

                {/* Value */}
                {(isValueShown || phase === "backward" || phase === "done") && (
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--color-text-primary)"
                    fontSize={12}
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    {node.value}
                  </text>
                )}

                {/* Gradient */}
                {isGradShown && (
                  <motion.text
                    x={node.x + 26}
                    y={node.y - 12}
                    textAnchor="start"
                    fill="var(--color-accent-rose)"
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    grad={node.grad}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Explanation panel */}
      <motion.div
        key={explanation}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface-raised)] rounded-lg p-3 text-sm font-mono text-[var(--color-text-secondary)] min-h-[40px]"
      >
        {explanation}
      </motion.div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={stepForward}
          disabled={phase === "backward" || phase === "done"}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent-blue)] text-white disabled:opacity-30 hover:brightness-110 transition-all"
        >
          Step Forward
        </button>
        <button
          onClick={stepBackward}
          disabled={phase === "idle" || phase === "done"}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent-rose)] text-white disabled:opacity-30 hover:brightness-110 transition-all"
        >
          Step Backward
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
