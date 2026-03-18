import { useState } from "react";
import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";

// ─── Inline Visualizer Components ────────────────────────────────────────────

function LossCurveViz() {
  const [preset, setPreset] = useState<"healthy" | "too_high" | "too_low">(
    "healthy"
  );

  // SVG viewport: 400 × 200. Axes margin: left=40, bottom=30, top=10, right=10.
  // Plot area: x in [40, 390], y in [10, 170].
  // Epochs 0–100 mapped to x. Loss 0–3 mapped to y (inverted: higher loss → lower y).
  const W = 400;
  const H = 200;
  const ML = 44; // margin left
  const MT = 12; // margin top
  const MW = W - ML - 10; // plot width
  const MH = H - MT - 32; // plot height

  function toSvgX(epoch: number) {
    return ML + (epoch / 100) * MW;
  }
  function toSvgY(loss: number) {
    const maxLoss = 3;
    const clamped = Math.min(Math.max(loss, 0), maxLoss);
    return MT + MH - (clamped / maxLoss) * MH;
  }

  // Build curve data as [epoch, loss] pairs
  function buildHealthy(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    for (let e = 0; e <= 100; e++) {
      // fast exponential decay levelling off near 0.1
      const loss = 0.1 + 2.4 * Math.exp(-0.06 * e);
      pts.push({ x: toSvgX(e), y: toSvgY(loss) });
    }
    return pts;
  }

  function buildTooHigh(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    for (let e = 0; e <= 100; e++) {
      let loss: number;
      if (e < 8) {
        loss = 2.5 - e * 0.15; // brief initial drop
      } else if (e < 20) {
        loss = 1.3 + (e - 8) * 0.1; // starts rising
      } else {
        loss = Math.min(2.5 + (e - 20) * 0.02, 3.0); // diverges / saturates
      }
      pts.push({ x: toSvgX(e), y: toSvgY(loss) });
    }
    return pts;
  }

  function buildTooLow(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    for (let e = 0; e <= 100; e++) {
      const loss = 2.5 - e * 0.003; // barely decreases to ~2.2
      pts.push({ x: toSvgX(e), y: toSvgY(loss) });
    }
    return pts;
  }

  const curves = {
    healthy: buildHealthy(),
    too_high: buildTooHigh(),
    too_low: buildTooLow(),
  };

  const colors = {
    healthy: "#34d399",
    too_high: "#f87171",
    too_low: "#fbbf24",
  };

  const pts = curves[preset];
  const polylinePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");

  const labels: Record<string, string> = {
    healthy: "Healthy (lr=0.5)",
    too_high: "Too High (lr=2.0)",
    too_low: "Too Low (lr=0.01)",
  };

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
        Loss Curve Visualizer
      </p>

      {/* Preset selector */}
      <div className="flex gap-4 text-xs">
        {(["healthy", "too_high", "too_low"] as const).map((p) => (
          <label key={p} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="loss-preset"
              checked={preset === p}
              onChange={() => setPreset(p)}
              className="accent-[var(--color-accent-blue)]"
            />
            <span
              style={{ color: preset === p ? colors[p] : undefined }}
              className="font-mono"
            >
              {labels[p]}
            </span>
          </label>
        ))}
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[500px] mx-auto"
        style={{ height: 180 }}
      >
        {/* Axes */}
        <line
          x1={ML}
          y1={MT}
          x2={ML}
          y2={MT + MH}
          stroke="var(--color-text-secondary)"
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        <line
          x1={ML}
          y1={MT + MH}
          x2={W - 10}
          y2={MT + MH}
          stroke="var(--color-text-secondary)"
          strokeWidth={1}
          strokeOpacity={0.4}
        />

        {/* Y axis tick labels */}
        {[0, 1, 2, 3].map((v) => (
          <text
            key={v}
            x={ML - 4}
            y={toSvgY(v) + 4}
            textAnchor="end"
            fontSize={9}
            fill="var(--color-text-secondary)"
            opacity={0.6}
          >
            {v}
          </text>
        ))}

        {/* X axis tick labels */}
        {[0, 25, 50, 75, 100].map((e) => (
          <text
            key={e}
            x={toSvgX(e)}
            y={MT + MH + 14}
            textAnchor="middle"
            fontSize={9}
            fill="var(--color-text-secondary)"
            opacity={0.6}
          >
            {e}
          </text>
        ))}

        {/* Axis labels */}
        <text
          x={ML + MW / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-text-secondary)"
          opacity={0.7}
        >
          Epochs
        </text>
        <text
          x={10}
          y={MT + MH / 2}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-text-secondary)"
          opacity={0.7}
          transform={`rotate(-90, 10, ${MT + MH / 2})`}
        >
          Loss
        </text>

        {/* Curve */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={colors[preset]}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Annotation: "guessing randomly" at epoch 0 */}
        {preset === "healthy" && (
          <>
            <text
              x={toSvgX(0) + 4}
              y={toSvgY(2.5) - 6}
              fontSize={8}
              fill={colors.healthy}
              opacity={0.85}
            >
              guessing randomly
            </text>
            <text
              x={toSvgX(80)}
              y={toSvgY(0.1) - 6}
              fontSize={8}
              fill={colors.healthy}
              opacity={0.85}
            >
              converged ✓
            </text>
          </>
        )}
        {preset === "too_high" && (
          <text
            x={toSvgX(30)}
            y={toSvgY(1.8) - 6}
            fontSize={8}
            fill={colors.too_high}
            opacity={0.85}
          >
            diverging!
          </text>
        )}
        {preset === "too_low" && (
          <text
            x={toSvgX(40)}
            y={toSvgY(2.35) - 6}
            fontSize={8}
            fill={colors.too_low}
            opacity={0.85}
          >
            barely moving
          </text>
        )}
      </svg>

      <p className="text-xs text-[var(--color-text-secondary)] opacity-70">
        Switch presets to see how learning rate affects the loss curve shape.
      </p>
    </div>
  );
}

// ─── Gradient Descent Visualizer ─────────────────────────────────────────────

function GradientDescentViz() {
  const [w, setW] = useState(2.5);
  const [lr, setLr] = useState(0.3);
  const [history, setHistory] = useState<number[]>([2.5]);

  // loss = (w - 1)², gradient = 2*(w-1)
  const loss = (wv: number) => (wv - 1) ** 2;
  const grad = (wv: number) => 2 * (wv - 1);

  function step() {
    const newW = w - lr * grad(w);
    setW(newW);
    setHistory((h) => [...h, newW]);
  }

  function reset() {
    setW(2.5);
    setHistory([2.5]);
  }

  // SVG layout: viewBox="0 0 300 200", w in [-1, 3], loss in [0, 4.5]
  const VW = 300;
  const VH = 200;
  const PAD_L = 36;
  const PAD_B = 28;
  const PAD_T = 12;
  const PAD_R = 10;
  const plotW = VW - PAD_L - PAD_R;
  const plotH = VH - PAD_T - PAD_B;

  const wMin = -1;
  const wMax = 3;
  const lossMax = 4.5;

  function sx(wv: number) {
    return PAD_L + ((wv - wMin) / (wMax - wMin)) * plotW;
  }
  function sy(lv: number) {
    const clamped = Math.min(Math.max(lv, 0), lossMax);
    return PAD_T + plotH - (clamped / lossMax) * plotH;
  }

  // Build parabola polyline
  const parabolaPts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const wv = wMin + (i / 80) * (wMax - wMin);
    parabolaPts.push(`${sx(wv)},${sy(loss(wv))}`);
  }

  const currentLoss = loss(w);
  const currentGrad = grad(w);
  const ballX = sx(w);
  const ballY = sy(currentLoss);

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
        Gradient Descent on L(w) = (w − 1)²
      </p>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full max-w-[380px] mx-auto"
        style={{ height: 180 }}
      >
        {/* Axes */}
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={PAD_T + plotH}
          stroke="var(--color-text-secondary)"
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={VW - PAD_R}
          y2={PAD_T + plotH}
          stroke="var(--color-text-secondary)"
          strokeWidth={1}
          strokeOpacity={0.4}
        />

        {/* Axis labels */}
        <text
          x={PAD_L + plotW / 2}
          y={VH - 4}
          textAnchor="middle"
          fontSize={9}
          fill="var(--color-text-secondary)"
          opacity={0.7}
        >
          w
        </text>
        <text
          x={10}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          fontSize={9}
          fill="var(--color-text-secondary)"
          opacity={0.7}
          transform={`rotate(-90, 10, ${PAD_T + plotH / 2})`}
        >
          Loss
        </text>

        {/* Minimum marker */}
        <line
          x1={sx(1)}
          y1={PAD_T}
          x2={sx(1)}
          y2={PAD_T + plotH}
          stroke="#34d399"
          strokeWidth={1}
          strokeDasharray="3,3"
          strokeOpacity={0.5}
        />
        <text x={sx(1) + 3} y={PAD_T + 10} fontSize={8} fill="#34d399" opacity={0.8}>
          w=1 (min)
        </text>

        {/* Parabola */}
        <polyline
          points={parabolaPts.join(" ")}
          fill="none"
          stroke="var(--color-accent-blue)"
          strokeWidth={2}
        />

        {/* History trail (faded dots) */}
        {history.slice(0, -1).map((hw, i) => (
          <circle
            key={i}
            cx={sx(hw)}
            cy={sy(loss(hw))}
            r={3}
            fill="#94a3b8"
            opacity={0.35 + (i / history.length) * 0.3}
          />
        ))}

        {/* Current ball */}
        <circle cx={ballX} cy={ballY} r={6} fill="#f472b6" />
        <circle cx={ballX} cy={ballY} r={6} fill="none" stroke="white" strokeWidth={1} />
      </svg>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
        <div className="bg-[var(--color-surface-base)] rounded p-2">
          <div className="text-[var(--color-text-secondary)] opacity-60 mb-0.5">w</div>
          <div className="text-[var(--color-text-primary)]">{w.toFixed(4)}</div>
        </div>
        <div className="bg-[var(--color-surface-base)] rounded p-2">
          <div className="text-[var(--color-text-secondary)] opacity-60 mb-0.5">loss</div>
          <div className="text-[var(--color-text-primary)]">{currentLoss.toFixed(4)}</div>
        </div>
        <div className="bg-[var(--color-surface-base)] rounded p-2">
          <div className="text-[var(--color-text-secondary)] opacity-60 mb-0.5">gradient</div>
          <div className="text-[var(--color-text-primary)]">{currentGrad.toFixed(4)}</div>
        </div>
      </div>

      <p className="text-xs font-mono text-[var(--color-text-secondary)] opacity-70 text-center">
        update: w ← {w.toFixed(3)} − {lr} × {currentGrad.toFixed(3)} = {(w - lr * currentGrad).toFixed(4)}
      </p>

      {/* Learning rate slider */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[var(--color-text-secondary)] opacity-70 w-20 shrink-0">
          lr = {lr.toFixed(2)}
        </span>
        <input
          type="range"
          min={0.01}
          max={1.0}
          step={0.01}
          value={lr}
          onChange={(e) => setLr(parseFloat(e.target.value))}
          className="flex-1"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={step}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/30 transition-colors"
        >
          Step →
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]/80 transition-colors"
        >
          Reset
        </button>
        <span className="text-xs text-[var(--color-text-secondary)] opacity-50 self-center ml-1">
          step {history.length - 1}
        </span>
      </div>
    </div>
  );
}

// ─── Main Chapter Component ───────────────────────────────────────────────────

export default function Chapter11() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 09
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Training — Teaching Machines to Actually Learn
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            You know how to compute gradients. But gradients are useless unless
            you actually <em>use</em> them. This is the chapter where your
            networks stop being calculators and start being learners.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="The missing piece" accent="emerald">
          <div className="space-y-2">
            <p>
              So far you've built: tensors, autograd, layers, attention,
              transformers. You can compute anything and differentiate everything.
              But you've been <em>hand-picking</em> the weights. A real ML model
              has millions of weights — you can't hand-pick those.
            </p>
            <p>
              Training is the answer: show the network examples, measure how
              wrong it is, compute gradients that say "which direction to nudge
              each weight," then nudge. Repeat a few thousand times. The model
              discovers the pattern <strong>by itself</strong>.
            </p>
            <p>
              This is the chapter that connects "I understand the math" to
              "I can make things learn." Five new tools, one loop, and suddenly
              everything clicks.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Loss Function */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 1: How Wrong Am I? (The Loss Function)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Before you can improve, you need to measure how bad you are.
              That's what a <strong>loss function</strong> does — it takes the
              model's prediction and the correct answer, and outputs a single
              number: the error.
            </p>
            <p>
              The most common one is <strong>Mean Squared Error (MSE)</strong>:
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
{`MSE = mean((prediction - target)²)

Example: prediction = 0.7, target = 1.0
MSE = (0.7 - 1.0)² = (-0.3)² = 0.09`}
            </pre>
            <p>
              Why squared? Because (1) it makes all errors positive (no
              cancellation between over and under-predictions), and (2) it
              punishes big errors more than small ones. Being off by 0.5 is
              4x worse than being off by 0.25.
            </p>
          </div>
        </div>

        <PredictExercise
          question="If your model predicts [0.2, 0.8] and the targets are [0.0, 1.0], what's the MSE?"
          hint="MSE = mean of squared differences. (0.2-0)² = 0.04, (0.8-1.0)² = 0.04."
          answer="MSE = (0.04 + 0.04) / 2 = 0.04"
          explanation="Both predictions are off by 0.2, so each contributes 0.04 to the squared error. The mean is 0.04. A perfect model would have MSE = 0."
        />

        <PredictExercise
          question="The loss gradient tells you how to change each prediction to reduce the error. For MSE, the gradient is 2*(prediction - target)/n. If prediction = 0.8 and target = 1.0, is the gradient positive or negative?"
          hint="prediction - target = 0.8 - 1.0 = -0.2. What's the sign?"
          answer="Negative (gradient = -0.2). This means: increase the prediction to reduce the error."
          explanation="A negative gradient says 'the prediction is too low.' Gradient descent would push the prediction upward (subtracting a negative = adding). If the prediction were 1.3 (too high), the gradient would be positive, pushing it down."
          commands={[
            'mse_loss("predictions", "targets")',
          ]}
        />

        {/* ============================================================ */}
        {/* SECTION: Gradient Descent */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 2: Which Way to Nudge (Gradient Descent)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              You have the loss. You run backward to get gradients for every
              weight. Now what? The simplest optimizer: <strong>SGD
              (Stochastic Gradient Descent)</strong>.
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
{`new_weight = old_weight - learning_rate × gradient

Example:
  weight = 0.5, gradient = 0.3, lr = 0.1
  new_weight = 0.5 - 0.1 × 0.3 = 0.47`}
            </pre>
            <p>
              That's it. Subtract a fraction of the gradient from each weight.
              The gradient says "moving this direction increases the loss," so
              we move the <em>opposite</em> direction. The learning rate controls
              how big each step is.
            </p>
          </div>
        </div>

        <PredictExercise
          question="Weight = 2.0, gradient = -0.5, learning rate = 0.1. What's the new weight after one SGD step?"
          hint="new = old - lr × gradient = 2.0 - 0.1 × (-0.5)"
          answer="new_weight = 2.0 - 0.1 × (-0.5) = 2.0 + 0.05 = 2.05"
          explanation="The gradient is negative, meaning 'increasing this weight would decrease the loss.' SGD subtracts a negative → adds → weight goes up. The model learned that this weight should be slightly larger."
        />

        {/* ── Worked example: 5 SGD steps ── */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Worked Example: 5 SGD Steps
          </h3>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Let's make this concrete. Use the simplest possible loss landscape:
              L(w) = (w − 1)². The minimum is at w = 1 — that's where the loss
              is zero. We start at w = 2.0 and watch gradient descent find it.
            </p>
            <p>
              Gradient of L(w) = (w − 1)² is dL/dw = 2(w − 1). Each step:
              w ← w − lr × 2(w − 1).
            </p>
          </div>
          <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3 leading-relaxed overflow-x-auto">
{`loss landscape:  L(w) = (w - 1)²    ← minimum at w=1
gradient:        dL/dw = 2(w - 1)
learning rate:   0.3

Step 0: w=2.000  loss=1.000  grad= 2.000  update=-0.600  → new w=1.400
Step 1: w=1.400  loss=0.160  grad= 0.800  update=-0.240  → new w=1.160
Step 2: w=1.160  loss=0.026  grad= 0.320  update=-0.096  → new w=1.064
Step 3: w=1.064  loss=0.004  grad= 0.128  update=-0.038  → new w=1.026
Step 4: w=1.026  loss=0.001  grad= 0.051  update=-0.016  → new w=1.010`}
          </pre>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            Notice the pattern: each step reduces the loss by about 64%. That's
            because with lr = 0.3, the update is{" "}
            <code className="font-mono text-xs">−0.3 × 2(w−1) = −0.6(w−1)</code>,
            so w − 1 shrinks by 60% each time. The updates get smaller
            automatically — no need to schedule the learning rate down.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
            Try it interactively below — drag the learning rate slider and click
            Step to see how step size changes the trajectory:
          </p>
        </div>

        <GradientDescentViz />

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Learning rate too high" accent="rose">
            <p>
              The model overshoots — it jumps past the optimal value, then
              overcorrects, then overshoots again. Loss oscillates wildly or
              explodes to infinity. If your loss suddenly becomes NaN, your
              learning rate is probably too high.
            </p>
          </InfoCard>
          <InfoCard title="Learning rate too low" accent="amber">
            <p>
              The model barely moves. Loss decreases painfully slowly. You
              might need 100,000 epochs instead of 100. Not wrong, just
              wasteful. Start high, reduce if unstable.
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Training Loop */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 3: The Loop (Where Learning Happens)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Training is a loop. The same loop. Every time. For every model.
              For every dataset. For GPT-4 and for your tiny AND gate.
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3">
{`for epoch in range(num_epochs):
    prediction = model.forward(input)     # 1. Forward
    loss = mse(prediction, target)        # 2. Compute loss
    gradients = backward(loss)            # 3. Backward
    for weight in model.weights:          # 4. Update
        weight -= lr * weight.gradient
    print(f"Epoch {epoch}: loss = {loss}")  # Watch it decrease!`}
            </pre>
            <p>
              Four steps, repeated. Forward → Loss → Backward → Update. The
              loss should decrease each epoch. If it doesn't, something is
              wrong (learning rate, architecture, or data).
            </p>
          </div>
        </div>

        <InfoCard title="What's an epoch?" accent="blue">
          <p>
            One epoch = one complete pass through all training data. If you have
            4 samples and train for 500 epochs, that's 2000 total forward+backward
            passes. Each epoch, the model sees every example once and adjusts its
            weights. Early epochs show big loss drops. Later epochs show diminishing
            returns — the model is fine-tuning.
          </p>
        </InfoCard>

        {/* Loss curve visualizer goes right after the training loop section */}
        <LossCurveViz />

        {/* ============================================================ */}
        {/* SECTION: Try It */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Let's Train Something Right Now
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Enough theory. Let's train a network to learn the AND function.
              Five commands, from nothing to a trained model:
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'create_dataset("and")',
            'init_mlp([2, 1], "demo")',
            'train_mlp("demo", "and_inputs", "and_targets", 0.5, 200)',
            'evaluate_mlp("demo", "and_inputs", "and_targets")',
            'mlp_predict("demo", [1, 1])',
          ]}
          label="Train AND in 5 commands"
        />

        <PredictExercise
          question="After training, you run mlp_predict('demo', [1, 1]). The AND of 1,1 is 1. Will the prediction be exactly 1.0?"
          hint="The network uses tanh, which outputs between -1 and 1. Can tanh ever output exactly 1?"
          answer="No — it'll be close (like 0.8 or 0.95) but never exactly 1.0. Tanh asymptotically approaches 1."
          explanation="This is normal! We threshold at 0.5 for classification: output > 0.5 → predict 1, else predict 0. The raw output being 0.95 vs 1.0 doesn't matter for accuracy. Real models use sigmoid (0 to 1) instead of tanh (-1 to 1) for binary classification, but tanh works fine for learning."
        />

        {/* ============================================================ */}
        {/* SECTION: What Happens Inside train_mlp */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What's Happening Inside <code className="font-mono text-xl">train_mlp</code>?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              When you call{" "}
              <code className="font-mono text-xs">
                train_mlp("demo", "and_inputs", "and_targets", 0.5, 200)
              </code>
              , the Rust code runs 200 iterations of the training loop. Here's
              what actually happens on each epoch, traced through with real
              numbers from the AND problem:
            </p>
          </div>
          <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3 leading-relaxed overflow-x-auto">
{`Epoch 1:
  Forward pass: inputs → hidden layer → output
  Prediction: [0.23, 0.67, 0.12, -0.45]  (random weights → garbage output)
  Loss (MSE): 0.847  ← this is what we want to drive down

  Backward pass: compute dLoss/d(each weight)
    Output layer gradient: 2 * (pred - target) / n    ← the MSE gradient
    Hidden layer gradient: chain rule through tanh
      dL/dW0 = dL/d(hidden) × d(hidden)/d(W0 × input)
               (the tanh derivative = 1 - tanh²)

  Weight update (SGD, lr=0.5):
    w ← w - 0.5 * gradient      ← all weights shift slightly

Epoch 2:   Loss = 0.612   (26% better already)
Epoch 10:  Loss = 0.089   (learning fast — gradients are still large)
Epoch 50:  Loss = 0.012   (converging — gradients getting small)
Epoch 200: Loss = 0.003   (done — further training gives diminishing returns)`}
          </pre>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Notice the pattern: most of the learning happens in the first
              10–20 epochs. That's because early on, predictions are far from
              targets, so gradients are large and weight updates are big. As
              the model improves, gradients shrink, updates shrink, and the
              loss decreases more slowly.
            </p>
            <p>
              The chain rule through tanh is why you need autograd. With 2
              layers and 4 hidden neurons, you'd need to track{" "}
              <strong>12 separate weight gradients</strong> by hand each epoch.
              Autograd does this automatically by replaying the computation
              graph in reverse.
            </p>
          </div>
        </div>

        <PredictExercise
          question="After 100 epochs with lr=0.1 on the AND problem, the loss is 0.09. Is the model converged? What would you try?"
          hint="0.09 is high for a 4-example dataset. A converged AND network typically reaches below 0.01. What could cause slow training?"
          answer="Not converged yet. lr=0.1 is conservative for this problem. Try lr=0.5 for faster convergence, or train for more epochs."
          explanation="For a tiny dataset like AND (4 examples), a well-tuned network can reach MSE below 0.005. lr=0.1 is fine but slow — it'll get there eventually. The bigger issue to watch: if loss plateaued at 0.09 and stopped decreasing entirely, you might be stuck in a local minimum or the architecture might be too small."
        />

        {/* ============================================================ */}
        {/* SECTION: Learning Rate Experiments */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Learning Rate: Your Most Important Knob
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The learning rate is the single most important hyperparameter.
              Too high: training explodes. Too low: training crawls. Let's see
              both failure modes live.
            </p>
          </div>
        </div>

        {/* InfoCards first, then predict, then TryThis */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Learning rate too high" accent="rose">
            <p>
              The model overshoots — it jumps past the optimal value, then
              overcorrects, then overshoots again. Loss oscillates wildly or
              explodes to infinity. If your loss suddenly becomes NaN, your
              learning rate is probably too high.
            </p>
          </InfoCard>
          <InfoCard title="Learning rate too low" accent="amber">
            <p>
              The model barely moves. Loss decreases painfully slowly. You
              might need 100,000 epochs instead of 100. Not wrong, just
              wasteful. Start high, reduce if unstable.
            </p>
          </InfoCard>
        </div>

        <PredictExercise
          question="You trained with lr=2.0 and lr=0.01 for 200 epochs each. Which one has lower final loss?"
          hint="lr=2.0 might overshoot and oscillate. lr=0.01 is stable but very slow. 200 epochs might not be enough for either extreme."
          answer="It depends on the initialization, but likely neither works well. lr=2.0 may oscillate or explode, lr=0.01 barely moves. lr=0.5 is the sweet spot for this problem."
          explanation="This is why learning rate tuning matters. In practice, people start with lr=0.001 or 0.01 and adjust. Modern optimizers like Adam adapt the learning rate per-parameter, but understanding SGD gives you the foundation."
          commands={[
            'init_mlp([2, 4, 1], "good")',
            'train_mlp("good", "xor_inputs", "xor_targets", 0.5, 500)',
            'evaluate_mlp("good", "xor_inputs", "xor_targets")',
          ]}
          commandLabel="Try lr=0.5 (just right)"
        />

        <TryThis
          commands={[
            'create_dataset("xor")',
            'init_mlp([2, 4, 1], "fast")',
            'train_mlp("fast", "xor_inputs", "xor_targets", 2.0, 200)',
          ]}
          label="Try lr=2.0 (too high) on XOR"
        />

        <TryThis
          commands={[
            'init_mlp([2, 4, 1], "slow")',
            'train_mlp("slow", "xor_inputs", "xor_targets", 0.01, 200)',
          ]}
          label="Try lr=0.01 (too low) on XOR"
        />

        {/* ============================================================ */}
        {/* SECTION: What Training Actually Changes */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Training Actually Changes
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Training modifies <strong>only the weights and biases</strong>.
              The architecture doesn't change. The data doesn't change. The
              forward pass logic doesn't change. Just the numbers inside the
              weight matrices.
            </p>
            <p>
              Before training: random weights → random output → high loss.
              After training: learned weights → correct output → low loss.
              Same network, different numbers. That's all learning is.
            </p>
            <p>
              You can inspect what the weights look like after training:
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'tensor_inspect("good_w0")',
            'tensor_inspect("good_w1")',
          ]}
          label="Inspect the learned weights"
        />

        <InfoCard title="What do the weights mean?" accent="blue">
          <div className="space-y-2">
            <p>
              For the XOR problem with a 2→4→1 network: <code>W0</code> (shape
              [2,4]) is the first layer — it transforms 2 inputs into 4 hidden
              features. Each column is one hidden neuron's "recipe" for combining
              the inputs. <code>W1</code> (shape [4,1]) combines those 4 hidden
              features into the final output.
            </p>
            <p>
              The hidden layer has learned to represent XOR in a way that's
              linearly separable. You can't see "XOR" by looking at the numbers
              directly — but the network found a representation that works.
              That's the magic of learned representations.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Overfitting */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Overfitting: When Your Model Memorizes Instead of Learns
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              There's a trap hiding in every training run: if training loss keeps
              dropping but test loss starts rising, your model is{" "}
              <strong>overfitting</strong> — it's memorizing the training
              examples instead of learning the underlying pattern.
            </p>
            <p>
              For tiny datasets like AND (4 examples), a 2→4→1 network has{" "}
              <strong>more parameters than examples</strong>. It can memorize
              every training case perfectly — loss = 0 — without learning
              anything generalizable. For real datasets, overfitting is a
              constant battle.
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3">
{`Signs of overfitting:
  Training loss: 0.001  (nearly perfect)
  Test loss:     0.847  (terrible on new examples)
  Train accuracy: 100%
  Test accuracy:   61%  ← the model memorized, didn't learn

Common fixes:
  - More training data          (hardest but best)
  - Simpler architecture        (fewer parameters)
  - Dropout                     (randomly disable neurons during training)
  - L2 regularization           (penalize large weights in the loss)`}
            </pre>
            <p>
              For your AND and XOR experiments you won't hit overfitting because
              the dataset covers all possible inputs — there's nothing to
              generalize to beyond what's shown. But keep this in mind when you
              move to real datasets: training accuracy is a vanity metric.
              Test accuracy is what matters.
            </p>
          </div>
        </div>

        <InfoCard title="Training loss vs test loss" accent="rose">
          <div className="space-y-2">
            <p>
              Always evaluate on data the model has <em>never seen during
              training</em>. Split your data: 80% training, 20% test. Train
              only on the training set. Check test loss periodically. If test
              loss starts climbing while training loss falls, stop early —
              that's the overfitting cliff.
            </p>
            <p>
              The gap between training loss and test loss tells you how well
              the model generalizes. A well-trained model should have similar
              loss on both. A huge gap means the model has learned noise, not
              signal.
            </p>
          </div>
        </InfoCard>

        <PredictExercise
          question="You train a network to 100% accuracy on 10 training examples. When you test it on 100 new examples, accuracy is 60%. What's happening?"
          hint="The model performs perfectly on training data but poorly on new data. What does that gap tell you?"
          answer="The model is overfitting — it memorized the 10 training examples instead of learning the underlying pattern."
          explanation="With only 10 training examples, even a small network can memorize them exactly. The 40% error on new examples shows the model hasn't learned anything generalizable. Fix: collect more data (hard), use a simpler model with fewer parameters, or add dropout/regularization to prevent memorization."
        />

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Mini Project: Train OR and Compare
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Train a network on OR (output is 1 if either input is 1) and
              compare it to AND. Which one trains faster? Which needs fewer
              epochs? Can a single neuron (no hidden layer) learn both?
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Create the OR dataset and train a 2→1 network for 200 epochs</li>
              <li>Check the loss curve — how fast does it converge?</li>
              <li>Compare to AND: create AND dataset, train same architecture</li>
              <li>Which has lower final loss? Why? (Hint: OR has 3 positive examples, AND has only 1)</li>
              <li>Bonus: try a 2→4→1 network on OR. Is the hidden layer needed?</li>
            </ol>
          </div>
          <TryThis
            commands={[
              'create_dataset("or")',
              'init_mlp([2, 1], "or_net")',
              'train_mlp("or_net", "or_inputs", "or_targets", 0.5, 200)',
              'evaluate_mlp("or_net", "or_inputs", "or_targets")',
            ]}
            label="Start the mini project"
          />
        </div>

        {/* ============================================================ */}
        {/* WHAT YOU LEARNED */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            What You Just Learned
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A <strong>loss function</strong> (MSE) measures how wrong the
              model is. Lower loss = better predictions.
            </li>
            <li>
              <strong>SGD</strong> updates weights by subtracting lr × gradient.
              The gradient points toward higher loss, so we go the opposite way.
            </li>
            <li>
              The <strong>training loop</strong> is: forward → loss → backward →
              update. Same loop for every model, every dataset.
            </li>
            <li>
              <strong>Learning rate</strong> controls step size. Too high =
              explodes. Too low = crawls. Start moderate, adjust.
            </li>
            <li>
              Training only changes <strong>weights and biases</strong>. The
              architecture and code stay the same — only the numbers change.
            </li>
            <li>
              You trained a network that <strong>learned from data</strong>.
              No one told it the rule — it discovered the pattern by minimizing
              the loss.
            </li>
            <li>
              <strong>Overfitting</strong> is when training loss is low but
              test loss stays high — memorization, not learning. Always
              evaluate on held-out data.
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* NEXT UP + NAV */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Ready for the projects?
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You now understand every piece: tensors, autograd, layers, attention,
            transformers, model files, AND training. Head to the Projects section
            in the sidebar to put it all together — train an AND gate, crack the
            XOR problem, and see why depth matters.
          </p>
        </div>

        <LearnNav current={9} />
        <ClaudePrompts chapter={9} />
      </div>
    </PageTransition>
  );
}
