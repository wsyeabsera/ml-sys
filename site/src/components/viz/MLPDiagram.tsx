import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A small MLP: 2 → 3 → 1
// Weights and biases chosen to produce interesting numbers
const NETWORK = {
  layers: [
    { in: 2, out: 3, label: "Layer 0" },
    { in: 3, out: 1, label: "Layer 1" },
  ],
  // x: [1.0, 2.0]
  input: [1.0, 2.0],
  // Layer 0: w=[2,3], b=[1,3]
  weights: [
    // L0: w shape [2,3] row-major
    [0.5, -0.3, 0.8, -0.4, 0.6, -0.2],
    // L1: w shape [3,1] row-major
    [0.7, -0.5, 0.9],
  ],
  biases: [
    // L0: b [3]
    [0.1, -0.1, 0.2],
    // L1: b [1]
    [0.0],
  ],
};

type Phase = "idle" | "forward" | "backward" | "done";

interface NeuronState {
  layerIdx: number; // -1 for input layer
  neuronIdx: number;
  label: string;
  value: number | null;
  grad: number | null;
  x: number;
  y: number;
}

interface ConnectionState {
  from: [number, number]; // [layerIdx, neuronIdx]
  to: [number, number];
  weight: number;
  grad: number | null;
}

function computeForward() {
  const x = NETWORK.input;

  // Layer 0: tanh(x @ W0 + b0)
  const w0 = NETWORK.weights[0];
  const b0 = NETWORK.biases[0];
  const pre0 = [
    x[0] * w0[0] + x[1] * w0[3] + b0[0],
    x[0] * w0[1] + x[1] * w0[4] + b0[1],
    x[0] * w0[2] + x[1] * w0[5] + b0[2],
  ];
  const h = pre0.map((v) => Math.tanh(v));

  // Layer 1: tanh(h @ W1 + b1)
  const w1 = NETWORK.weights[1];
  const b1 = NETWORK.biases[1];
  const pre1 = [h[0] * w1[0] + h[1] * w1[1] + h[2] * w1[2] + b1[0]];
  const out = pre1.map((v) => Math.tanh(v));

  return { pre0, h, pre1, out, x };
}

function computeBackward() {
  const { pre0, h, pre1, out, x } = computeForward();
  const w0 = NETWORK.weights[0];
  const w1 = NETWORK.weights[1];

  // d(out)/d(pre1) = 1 - tanh(pre1)^2
  const dout = 1.0; // seed
  const dpre1 = dout * (1 - out[0] * out[0]);

  // Gradients for w1: dw1[j] = h[j] * dpre1
  const dw1 = [h[0] * dpre1, h[1] * dpre1, h[2] * dpre1];
  // db1 = dpre1
  const db1 = dpre1;

  // dh[j] = w1[j] * dpre1
  const dh = [w1[0] * dpre1, w1[1] * dpre1, w1[2] * dpre1];

  // dpre0[j] = dh[j] * (1 - h[j]^2)
  const dpre0 = dh.map((dhi, j) => dhi * (1 - h[j] * h[j]));

  // dx[i] = sum_j dpre0[j] * w0[i*3 + j]... wait, w0 is [2,3] row-major
  // w0[row=i, col=j] = w0[i*3+j]
  const dx = [
    dpre0[0] * w0[0] + dpre0[1] * w0[1] + dpre0[2] * w0[2],
    dpre0[0] * w0[3] + dpre0[1] * w0[4] + dpre0[2] * w0[5],
  ];

  // dw0[i,j] = x[i] * dpre0[j]
  const dw0 = [
    x[0] * dpre0[0], x[0] * dpre0[1], x[0] * dpre0[2],
    x[1] * dpre0[0], x[1] * dpre0[1], x[1] * dpre0[2],
  ];

  return {
    inputGrads: dx,
    hiddenGrads: dh,
    outputGrad: dout,
    dw0,
    dw1,
    dpre0,
    dpre1,
  };
}

function buildNeurons(): NeuronState[] {
  const neurons: NeuronState[] = [];
  const layerSizes = [2, 3, 1];
  const xPositions = [80, 260, 440];

  for (let li = 0; li < layerSizes.length; li++) {
    const size = layerSizes[li];
    const totalHeight = (size - 1) * 80;
    const startY = 140 - totalHeight / 2;

    for (let ni = 0; ni < size; ni++) {
      const labels =
        li === 0
          ? [`x${ni + 1}`]
          : li === 1
          ? [`h${ni + 1}`]
          : ["out"];
      neurons.push({
        layerIdx: li - 1,
        neuronIdx: ni,
        label: labels[0],
        value: null,
        grad: null,
        x: xPositions[li],
        y: startY + ni * 80,
      });
    }
  }
  return neurons;
}

function buildConnections(): ConnectionState[] {
  const conns: ConnectionState[] = [];
  const w0 = NETWORK.weights[0];
  const w1 = NETWORK.weights[1];

  // Input → Hidden (w0 is [2,3] row-major)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      conns.push({
        from: [0, i],
        to: [1, j],
        weight: w0[i * 3 + j],
        grad: null,
      });
    }
  }
  // Hidden → Output (w1 is [3,1])
  for (let j = 0; j < 3; j++) {
    conns.push({
      from: [1, j],
      to: [2, 0],
      weight: w1[j],
      grad: null,
    });
  }
  return conns;
}

export default function MLPDiagram() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [forwardStep, setForwardStep] = useState(-1);
  const [backwardStep, setBackwardStep] = useState(-1);

  const fwd = computeForward();
  const bwd = computeBackward();
  const neurons = buildNeurons();
  const connections = buildConnections();

  // Assign values based on forward step
  // Steps: 0=inputs, 1=hidden, 2=output
  const showValues = phase !== "idle";
  const showGrads = phase === "backward" || phase === "done";

  if (showValues) {
    // Input layer always visible once forward starts
    if (forwardStep >= 0) {
      neurons[0].value = fwd.x[0];
      neurons[1].value = fwd.x[1];
    }
    if (forwardStep >= 1) {
      neurons[2].value = fwd.h[0];
      neurons[3].value = fwd.h[1];
      neurons[4].value = fwd.h[2];
    }
    if (forwardStep >= 2) {
      neurons[5].value = fwd.out[0];
    }
  }

  if (showGrads) {
    // Backward steps: 0=output, 1=hidden, 2=inputs
    if (backwardStep >= 0) {
      neurons[5].grad = bwd.outputGrad;
    }
    if (backwardStep >= 1) {
      neurons[2].grad = bwd.hiddenGrads[0];
      neurons[3].grad = bwd.hiddenGrads[1];
      neurons[4].grad = bwd.hiddenGrads[2];
      // Show weight grads on connections from hidden → output
      for (let j = 0; j < 3; j++) {
        connections[6 + j].grad = bwd.dw1[j];
      }
    }
    if (backwardStep >= 2) {
      neurons[0].grad = bwd.inputGrads[0];
      neurons[1].grad = bwd.inputGrads[1];
      // Show weight grads on connections from input → hidden
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          connections[i * 3 + j].grad = bwd.dw0[i * 3 + j];
        }
      }
    }
  }

  const stepForward = useCallback(() => {
    if (phase === "idle") {
      setPhase("forward");
      setForwardStep(0);
    } else if (phase === "forward" && forwardStep < 2) {
      setForwardStep((s) => s + 1);
    } else if (phase === "forward" && forwardStep === 2) {
      // Forward done, switch to backward
      setPhase("backward");
      setBackwardStep(0);
    }
  }, [phase, forwardStep]);

  const stepBackward = useCallback(() => {
    if (phase === "backward" && backwardStep < 2) {
      setBackwardStep((s) => s + 1);
    } else if (phase === "backward" && backwardStep === 2) {
      setPhase("done");
    }
  }, [phase, backwardStep]);

  const reset = useCallback(() => {
    setPhase("idle");
    setForwardStep(-1);
    setBackwardStep(-1);
  }, []);

  // Get position of neuron by layer index (0=input, 1=hidden, 2=output) and neuron index
  const getNeuronPos = (layerIdx: number, neuronIdx: number) => {
    const layerSizes = [2, 3, 1];
    let idx = 0;
    for (let l = 0; l < layerIdx; l++) idx += layerSizes[l];
    idx += neuronIdx;
    return { x: neurons[idx].x, y: neurons[idx].y };
  };

  const explanations: Record<string, string> = {
    idle: "Click \"Step\" to start the forward pass through a 2→3→1 MLP.",
    "forward-0": `Input: x = [${fwd.x[0]}, ${fwd.x[1]}]`,
    "forward-1": `Hidden: h = tanh(x @ W₀ + b₀) = [${fwd.h.map((v) => v.toFixed(3)).join(", ")}]`,
    "forward-2": `Output: out = tanh(h @ W₁ + b₁) = ${fwd.out[0].toFixed(4)}`,
    "backward-0": `Seed: d(out) = 1.0 — \"how much does the output affect itself?\"`,
    "backward-1": `Hidden grads: d(h) = W₁ × d(pre₁) = [${bwd.hiddenGrads.map((v) => v.toFixed(3)).join(", ")}]`,
    "backward-2": `Input grads: d(x) = [${bwd.inputGrads.map((v) => v.toFixed(3)).join(", ")}] — gradients have flowed through both layers`,
    done: "All gradients computed. Every weight knows which direction to move to reduce the output.",
  };

  const getExplanation = () => {
    if (phase === "idle") return explanations.idle;
    if (phase === "forward") return explanations[`forward-${forwardStep}`];
    if (phase === "backward") return explanations[`backward-${backwardStep}`];
    return explanations.done;
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Interactive MLP: 2 → 3 → 1
      </h4>

      <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-4 overflow-x-auto">
        <svg width="520" height="300" viewBox="0 0 520 300" className="mx-auto">
          {/* Layer labels */}
          <text x="80" y="25" textAnchor="middle" fill="var(--color-text-muted)" fontSize={11} fontWeight="600">
            Input
          </text>
          <text x="260" y="25" textAnchor="middle" fill="var(--color-text-muted)" fontSize={11} fontWeight="600">
            Hidden
          </text>
          <text x="440" y="25" textAnchor="middle" fill="var(--color-text-muted)" fontSize={11} fontWeight="600">
            Output
          </text>

          {/* Connections */}
          {connections.map((conn, i) => {
            const from = getNeuronPos(conn.from[0], conn.from[1]);
            const to = getNeuronPos(conn.to[0], conn.to[1]);
            const isGradActive = conn.grad !== null;
            const opacity = showValues ? 0.6 : 0.25;

            return (
              <g key={`conn-${i}`}>
                <motion.line
                  x1={from.x + 22}
                  y1={from.y}
                  x2={to.x - 22}
                  y2={to.y}
                  stroke={isGradActive ? "var(--color-accent-rose)" : "var(--color-surface-overlay)"}
                  strokeWidth={isGradActive ? 2 : 1.2}
                  opacity={opacity}
                  initial={{ opacity: 0 }}
                  animate={{ opacity }}
                  transition={{ delay: i * 0.02 }}
                />
                {/* Weight label on connection */}
                {showValues && (
                  <text
                    x={(from.x + to.x) / 2 + (conn.from[1] % 2 === 0 ? -12 : 12)}
                    y={(from.y + to.y) / 2 + (i % 2 === 0 ? -6 : 8)}
                    textAnchor="middle"
                    fill="var(--color-text-muted)"
                    fontSize={8}
                    fontFamily="var(--font-mono)"
                    opacity={0.6}
                  >
                    {conn.weight.toFixed(1)}
                  </text>
                )}
                {/* Gradient label */}
                {conn.grad !== null && (
                  <motion.text
                    x={(from.x + to.x) / 2 + (conn.from[1] % 2 === 0 ? -12 : 12)}
                    y={(from.y + to.y) / 2 + (i % 2 === 0 ? 8 : -6)}
                    textAnchor="middle"
                    fill="var(--color-accent-rose)"
                    fontSize={8}
                    fontFamily="var(--font-mono)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ∇{conn.grad.toFixed(3)}
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* Neurons */}
          {neurons.map((neuron, i) => {
            const hasValue = neuron.value !== null;
            const hasGrad = neuron.grad !== null;

            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
              >
                <circle
                  cx={neuron.x}
                  cy={neuron.y}
                  r={20}
                  fill="var(--color-surface-raised)"
                  stroke={
                    hasGrad
                      ? "var(--color-accent-rose)"
                      : hasValue
                      ? "var(--color-accent-emerald)"
                      : "var(--color-surface-overlay)"
                  }
                  strokeWidth={hasValue || hasGrad ? 2.5 : 1.5}
                />
                {/* Label */}
                <text
                  x={neuron.x}
                  y={neuron.y - 28}
                  textAnchor="middle"
                  fill="var(--color-text-muted)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                >
                  {neuron.label}
                </text>
                {/* Value */}
                {hasValue && (
                  <text
                    x={neuron.x}
                    y={neuron.y + 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--color-text-primary)"
                    fontSize={10}
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    {neuron.value!.toFixed(2)}
                  </text>
                )}
                {/* Gradient */}
                {hasGrad && (
                  <motion.text
                    x={neuron.x + 26}
                    y={neuron.y - 8}
                    textAnchor="start"
                    fill="var(--color-accent-rose)"
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ∇{neuron.grad!.toFixed(2)}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={phase === "backward" || phase === "done" ? stepBackward : stepForward}
          disabled={phase === "done"}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent-blue)] text-white disabled:opacity-30 hover:brightness-110 transition-all"
        >
          {phase === "backward" ? "Step Backward" : "Step Forward"}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] transition-all"
        >
          Reset
        </button>
      </div>

      {/* Explanation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${forwardStep}-${backwardStep}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-center text-sm text-[var(--color-text-secondary)] font-mono bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg px-4 py-3"
        >
          {getExplanation()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
