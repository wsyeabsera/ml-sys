import { motion, AnimatePresence } from "framer-motion";

/**
 * A text panel that provides math explanations for each step
 * of the computation graph visualization.
 * Used alongside ComputationGraph3D and GradientFlow.
 */

export interface StepInfo {
  nodeId: string;
  label: string;
  explanation: string;
}

// Forward step explanations for the neuron graph
export const neuronForwardSteps: StepInfo[] = [
  { nodeId: "x1", label: "x1", explanation: "Input x1 = 2.00 (given)" },
  { nodeId: "x2", label: "x2", explanation: "Input x2 = 0.00 (given)" },
  { nodeId: "w1", label: "w1", explanation: "Weight w1 = -3.00 (given)" },
  { nodeId: "w2", label: "w2", explanation: "Weight w2 = 1.00 (given)" },
  { nodeId: "b", label: "b", explanation: "Bias b = 6.8814 (given)" },
  { nodeId: "x1w1", label: "x1*w1", explanation: "Multiply: x1 * w1 = 2 * (-3) = -6.00" },
  { nodeId: "x2w2", label: "x2*w2", explanation: "Multiply: x2 * w2 = 0 * 1 = 0.00" },
  { nodeId: "sum1", label: "x1w1+x2w2", explanation: "Add: x1w1 + x2w2 = -6 + 0 = -6.00" },
  { nodeId: "sum2", label: "sum+b", explanation: "Add: sum + b = -6 + 6.8814 = 0.8814" },
  { nodeId: "out", label: "tanh", explanation: "Activation: tanh(0.8814) = 0.7071" },
];

// Backward step explanations for the neuron graph
export const neuronBackwardSteps: StepInfo[] = [
  { nodeId: "out", label: "tanh", explanation: "Seed: d(out)/d(out) = 1.0 (starting point)" },
  { nodeId: "sum2", label: "sum+b", explanation: "tanh backward: (1 - 0.7071^2) * 1.0 = 0.50. Both inputs (sum1, b) get grad = 0.50" },
  { nodeId: "sum1", label: "x1w1+x2w2", explanation: "add backward: grad passes through unchanged. Both x1w1 and x2w2 get grad = 0.50" },
  { nodeId: "b", label: "b", explanation: "Leaf node: b.grad = 0.50 (received from sum2)" },
  { nodeId: "x1w1", label: "x1*w1", explanation: "mul backward: x1.grad += w1 * 0.50 = -3 * 0.50 = -1.50. w1.grad += x1 * 0.50 = 2 * 0.50 = 1.00" },
  { nodeId: "x2w2", label: "x2*w2", explanation: "mul backward: x2.grad += w2 * 0.50 = 1 * 0.50 = 0.50. w2.grad += x2 * 0.50 = 0 * 0.50 = 0.00" },
  { nodeId: "x1", label: "x1", explanation: "Leaf node: x1.grad = -1.50. If x1 increased by 0.001, output would decrease by 0.0015" },
  { nodeId: "w1", label: "w1", explanation: "Leaf node: w1.grad = 1.00. If w1 increased by 0.001, output would increase by 0.001" },
  { nodeId: "x2", label: "x2", explanation: "Leaf node: x2.grad = 0.50. A positive nudge to x2 would increase output" },
  { nodeId: "w2", label: "w2", explanation: "Leaf node: w2.grad = 0.00. Since x2=0, changing w2 has no effect (0 * anything = 0)" },
];

export default function StepExplanation({
  phase,
  step,
  forwardSteps = neuronForwardSteps,
  backwardSteps = neuronBackwardSteps,
}: {
  phase: "idle" | "forward" | "backward" | "done";
  step: number;
  forwardSteps?: StepInfo[];
  backwardSteps?: StepInfo[];
}) {
  let text = "";
  let accent = "var(--color-text-secondary)";

  if (phase === "idle") {
    text = "Click 'Step Forward' to begin computing values node by node.";
  } else if (phase === "forward" && step >= 0 && step < forwardSteps.length) {
    text = forwardSteps[step].explanation;
    accent = "var(--color-accent-blue)";
  } else if (phase === "backward" && step >= 0 && step < backwardSteps.length) {
    text = backwardSteps[step].explanation;
    accent = "var(--color-accent-rose)";
  } else if (phase === "done") {
    text = "All gradients computed! Each leaf node now knows how much the output would change if it were nudged.";
    accent = "var(--color-accent-emerald)";
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${phase}-${step}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-4 min-h-[50px] flex items-center"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: accent }}
          />
          <p className="text-sm font-mono text-[var(--color-text-secondary)] leading-relaxed">
            {text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
