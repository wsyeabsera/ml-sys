import { useState } from "react";
import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";
import RopeViz from "../components/viz/RopeViz";
import TryThis from "../components/ui/TryThis";

// ============================================================
// TransformerBlockFlow — animated stepper through one block
// ============================================================
const BLOCK_STEPS = [
  {
    id: "input",
    label: "Input x",
    shape: "[seq, d_model]  e.g. [1, 2048]",
    desc: "A token has been looked up from the embedding table. It's a vector of size d_model (2048 for TinyLlama). This is x.",
  },
  {
    id: "norm1",
    label: "RMSNorm",
    shape: "[1, 2048]  (same shape)",
    desc: "Normalize x so the values don't explode. RMSNorm divides by the root-mean-square — no mean subtraction, no bias. Shape unchanged.",
  },
  {
    id: "qkv",
    label: "Q / K / V projections",
    shape: "Q: [1, n_heads, head_dim]  K: [1, n_kv, head_dim]  V: same",
    desc: "Three linear projections produce queries, keys, and values. For TinyLlama: 32 heads, 64-dim each. RoPE is applied to Q and K before attention.",
  },
  {
    id: "attn",
    label: "Attention",
    shape: "[1, n_heads, head_dim] → [1, d_model]",
    desc: "softmax(QKᵀ / √head_dim) · V. Each head attends over all past tokens in the KV cache. Heads are concatenated and projected back to d_model.",
  },
  {
    id: "res1",
    label: "+ x  (residual)",
    shape: "[1, 2048]",
    desc: "Add the original x back in. This is the residual connection. Gradients flow back through this path unchanged — crucial for training deep models.",
  },
  {
    id: "norm2",
    label: "RMSNorm",
    shape: "[1, 2048]  (same shape)",
    desc: "Normalize again before the feedforward network. Pre-norm stabilizes training — the FFN always sees a well-scaled input.",
  },
  {
    id: "ffn",
    label: "SwiGLU FFN",
    shape: "[1, 2048] → [1, 5632] → [1, 2048]",
    desc: "FFN(x) = W_down @ (silu(x @ W_gate) * (x @ W_up)). Expands to ~2.75× d_model, then projects back. The gate selectively amplifies useful features.",
  },
  {
    id: "res2",
    label: "+ x  (residual)",
    shape: "[1, 2048]",
    desc: "Add x again. Output of this block is the same shape as input — ready to be fed into the next block. Repeat 22× (TinyLlama) or 80× (LLaMA 70B).",
  },
];

function TransformerBlockFlow() {
  const [step, setStep] = useState(0);

  return (
    <div className="rounded-xl border border-[var(--color-surface-overlay)] bg-[var(--color-surface-raised)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          One Token Through a Transformer Block
        </h3>
        <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
          Step {step + 1} / {BLOCK_STEPS.length}
        </span>
      </div>

      {/* Step boxes */}
      <div className="flex flex-col items-center gap-1">
        {BLOCK_STEPS.map((s, i) => {
          const isActive = i === step;
          const isPast = i < step;
          return (
            <div key={s.id} className="flex flex-col items-center w-full max-w-sm">
              <motion.div
                animate={{
                  backgroundColor: isActive
                    ? "rgba(59,130,246,0.18)"
                    : isPast
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(0,0,0,0)",
                  borderColor: isActive
                    ? "rgba(59,130,246,0.6)"
                    : isPast
                    ? "rgba(16,185,129,0.35)"
                    : "rgba(255,255,255,0.08)",
                }}
                transition={{ duration: 0.25 }}
                className="w-full rounded-lg border px-3 py-2 text-center cursor-pointer select-none"
                onClick={() => setStep(i)}
              >
                <span
                  className="text-xs font-mono font-semibold"
                  style={{
                    color: isActive
                      ? "var(--color-accent-blue)"
                      : isPast
                      ? "var(--color-accent-emerald)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {s.label}
                </span>
              </motion.div>
              {i < BLOCK_STEPS.length - 1 && (
                <div
                  className="w-px h-3 mt-0.5"
                  style={{
                    backgroundColor:
                      i < step
                        ? "rgba(16,185,129,0.4)"
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active step detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-accent-blue)]/20 p-4 space-y-2"
        >
          <p className="text-xs font-mono text-[var(--color-accent-blue)]">
            {BLOCK_STEPS[step].shape}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {BLOCK_STEPS[step].desc}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)]/40 disabled:opacity-30 transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={() => setStep((s) => Math.min(BLOCK_STEPS.length - 1, s + 1))}
          disabled={step === BLOCK_STEPS.length - 1}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/20 disabled:opacity-30 transition-colors"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}

export default function Chapter9() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 07
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Transformers — Assembling the Final Boss
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            RMSNorm, SiLU, RoPE — the three operations that separate a real
            LLaMA model from our toy attention. Each one replaced something
            older for a good reason.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="You're 90% of the way there" accent="emerald">
          <div className="space-y-2">
            <p>
              You already have tensors, autograd, layers, and attention. A real
              transformer block is just attention + a feedforward network, with
              three extra operations sprinkled in: one for normalization, one for
              a better activation function, and one for position encoding.
            </p>
            <p>
              None of these are conceptually hard. They're all "someone tried
              the obvious thing, found a problem, and this was the fix." Let's
              understand each fix.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: RMSNorm */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            RMSNorm: "LayerNorm, But Lazier (and Faster)"
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              As data flows through dozens of layers, activations can explode or
              vanish. Normalization fixes this. The original transformer used
              LayerNorm:
            </p>
            <p className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
              LayerNorm(x) = (x - mean(x)) / std(x) * weight + bias
            </p>
            <p>
              LLaMA uses RMSNorm instead — it just drops the mean subtraction
              and the bias:
            </p>
            <p className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
              RMSNorm(x) = (x / rms(x)) * weight &nbsp;&nbsp; where rms(x) = &radic;(mean(x&sup2;) + &epsilon;)
            </p>
            <p>
              Why is this better? Empirically it works just as well, but it's
              cheaper — you skip one pass over the data (no mean) and one
              subtraction. In a 32-layer model doing this twice per layer for
              every token, that's 64 fewer operations per forward pass. Laziness
              pays off.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub fn rms_norm(&self, weight: &Tensor, eps: f32) -> Tensor {
    let n = self.data.len() as f32;
    let ss: f32 = self.data.iter().map(|x| x * x).sum::<f32>() / n;
    let rms = (ss + eps).sqrt();
    let data = self.data.iter()
        .zip(weight.data.iter())
        .map(|(x, w)| (x / rms) * w)
        .collect();
    Tensor::new(data, self.shape.clone())
}`}
        />

        {/* Exercise: RMSNorm */}
        <PredictExercise
          question="RMSNorm divides by the root-mean-square. If x = [3, 4], what is rms(x)? (Ignore epsilon.)"
          hint="rms = √(mean(x²)) = √((9 + 16) / 2) = √(12.5)"
          answer="rms(x) = √12.5 ≈ 3.54. After RMSNorm: [3/3.54, 4/3.54] ≈ [0.85, 1.13]."
          explanation="RMSNorm normalizes the vector so its root-mean-square is 1. It's simpler than LayerNorm because it skips the mean subtraction — just divide by rms. The weight vector then rescales each dimension independently."
        />

        {/* Worked example with real numbers */}
        <div className="rounded-xl border border-[var(--color-surface-overlay)] bg-[var(--color-surface-raised)] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Worked Example: x = [2, -1, 3]
          </h3>
          <div className="space-y-2 text-sm font-mono text-[var(--color-text-secondary)]">
            <p>
              <span className="text-[var(--color-text-tertiary)]">step 1 — sum of squares:</span>
              {"  "}2² + (-1)² + 3² = 4 + 1 + 9 = 14
            </p>
            <p>
              <span className="text-[var(--color-text-tertiary)]">step 2 — mean of squares:</span>
              {"  "}14 / 3 ≈ 4.667
            </p>
            <p>
              <span className="text-[var(--color-text-tertiary)]">step 3 — rms:</span>
              {"             "}√4.667 ≈ 2.160
            </p>
            <p>
              <span className="text-[var(--color-text-tertiary)]">step 4 — normalize:</span>
              {"         "}[2/2.16, -1/2.16, 3/2.16] = [0.93, -0.46, 1.39]
            </p>
            <p>
              <span className="text-[var(--color-text-tertiary)]">step 5 — apply weight [1,1,1]:</span>
              {"  "}[0.93, -0.46, 1.39]  ← unchanged (identity weights)
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            In practice, learned weights let each dimension scale independently after normalization.
            Setting all weights to 1 is the neutral baseline the model trains away from.
          </p>
        </div>

        <TryThis
          label="Compute one RMSNorm step manually"
          commands={[
            'autograd_expr {"expr": "sqrt((4 + 1 + 9) / 3)", "description": "rms([2,-1,3])"}',
            'autograd_expr {"expr": "2 / 2.16", "description": "normalize first element"}',
            'autograd_expr {"expr": "-1 / 2.16", "description": "normalize second element"}',
            'autograd_expr {"expr": "3 / 2.16", "description": "normalize third element"}',
          ]}
        />

        {/* ============================================================ */}
        {/* SECTION: Pre-norm vs Post-norm (expanded) */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Pre-norm vs Post-norm</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The original transformer normalized <em>after</em> each sub-layer
              (post-norm). LLaMA normalizes <em>before</em> (pre-norm). The
              difference matters most at the start of training.
            </p>
            <p>
              With <strong>post-norm</strong>: the residual add happens first,
              then normalize. Early in training, weights are random and outputs
              are noisy — so you're adding noise to noise, then normalizing. The
              gradient signal is weak because the normalizer is constantly
              rescaling noisy values in unpredictable directions.
            </p>
            <p>
              With <strong>pre-norm</strong>: normalize first, then run the
              sub-layer, then add back. The residual path carries the raw signal
              directly. Even if the sub-layer's weights are garbage early on,
              the model doesn't collapse — x passes through the residual
              unchanged. This makes loss go down reliably from step one.
            </p>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="rounded-lg border border-[var(--color-surface-overlay)] bg-[var(--color-surface-base)] p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Post-norm (original transformer)
              </p>
              <p className="text-xs font-mono text-[var(--color-text-secondary)] space-y-1">
                <span className="block">x_attn = attention(x)</span>
                <span className="block">x = norm(x + x_attn)  ← norm AFTER</span>
                <span className="block">x_ffn = ffn(x)</span>
                <span className="block">x = norm(x + x_ffn)   ← norm AFTER</span>
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Gradient flows through normalizer. Unstable early in training,
                requires careful learning rate warmup.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-accent-blue)]/25 bg-[var(--color-accent-blue)]/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--color-accent-blue)] uppercase tracking-wider">
                Pre-norm (LLaMA)
              </p>
              <p className="text-xs font-mono text-[var(--color-text-secondary)] space-y-1">
                <span className="block">x_attn = attention(norm(x))  ← norm BEFORE</span>
                <span className="block">x = x + x_attn</span>
                <span className="block">x_ffn = ffn(norm(x))         ← norm BEFORE</span>
                <span className="block">x = x + x_ffn</span>
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Residual path is clean. Stable from step one. No warmup needed.
                Used by virtually all modern LLMs.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: SiLU / SwiGLU */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            SiLU & SwiGLU: "ReLU Had a Good Run"
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Our MLP used tanh. The original transformer used ReLU{" "}
              (<code>max(0, x)</code>). LLaMA uses <strong>SiLU</strong> inside
              a <strong>SwiGLU</strong> structure.
            </p>
            <p>
              <strong>SiLU</strong> is <code>x * sigmoid(x)</code> — smooth
              everywhere (no kink at zero like ReLU), and it lets small negative
              values through. No dead neurons.
            </p>
            <p>
              <strong>SwiGLU</strong> wraps SiLU in a gated structure:
            </p>
            <p className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
              FFN(x) = W_down @ (silu(x @ W_gate) * (x @ W_up))
            </p>
            <p>
              Three weight matrices instead of two. The "gate" path decides how
              much signal to let through; the "up" path provides the signal.
              Same parameter budget (hidden dim is reduced to compensate), but
              better quality. The extra matrix pays for itself.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`// SiLU: x * sigmoid(x)
pub fn silu(&self) -> Tensor {
    let data = self.data.iter()
        .map(|x| x * (1.0 / (1.0 + (-x).exp())))
        .collect();
    Tensor::new(data, self.shape.clone())
}

// SwiGLU FFN in the forward pass:
let gate = block.ffn_gate.matvec(&x_norm).silu();  // gate path
let up   = block.ffn_up.matvec(&x_norm);            // signal path
let ffn  = block.ffn_down.matvec(&gate.mul(&up));    // combine + project down`}
        />

        <TryThis
          label="Trace FFN gate operation (SwiGLU)"
          commands={[
            'tensor_create {"id": "x_small", "data": [0.5, 1.2, -0.3, 0.8], "shape": [4]}',
            'tensor_matmul {"a": "x_small", "b": "x_small", "description": "W_gate @ x (simulated)"}',
            'autograd_expr {"expr": "0.5 * (1 / (1 + exp(-0.5)))", "description": "silu(0.5) — gate element 0"}',
            'autograd_expr {"expr": "1.2 * (1 / (1 + exp(-1.2)))", "description": "silu(1.2) — gate element 1"}',
          ]}
        />

        {/* ============================================================ */}
        {/* SECTION: RoPE */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            RoPE: "Just Rotate It" (Position Encoding)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Without position encoding, "the cat sat" and "sat cat the" produce
              identical attention scores. The model can't tell word order. The
              original transformer solved this with <em>learned</em> position
              embeddings — a lookup table of position vectors. Problem: it can't
              handle sequences longer than it was trained on.
            </p>
            <p>
              RoPE (Rotary Position Embedding) takes a different approach: it{" "}
              <em>rotates</em> pairs of values in Q and K by position-dependent
              angles:
            </p>
            <p className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
              [x₀, x₁] → [x₀·cos(&theta;) - x₁·sin(&theta;), x₀·sin(&theta;) + x₁·cos(&theta;)]
            </p>
            <p>
              Each pair of dimensions rotates at a different frequency. Early
              pairs rotate fast (capturing local position — "is this the next
              word?"). Later pairs rotate slowly (capturing global position —
              "are we near the beginning or end?").
            </p>
            <p>
              The beautiful property: after rotation, the dot product{" "}
              <code>q·k</code> depends only on the <strong>relative</strong>{" "}
              distance between positions, not their absolute values. The model
              learns relative relationships for free, from the geometry of
              rotations.
            </p>
          </div>
        </div>

        {/* Exercise: SwiGLU */}
        <PredictExercise
          question="SwiGLU has THREE weight matrices (gate, up, down) instead of the standard two. Why is the extra matrix worth the cost?"
          hint="The gate path decides HOW MUCH signal to let through. The up path provides the signal. Together they learn a more selective transformation."
          answer="The gate learns to selectively amplify or suppress different features. This gating mechanism is more expressive than a simple nonlinearity."
          explanation="Think of it like a mixer board: the 'up' path is the audio signal, and the 'gate' path is the volume knob for each channel. The model can learn to turn up important features and mute irrelevant ones. Standard FFN just applies the same transformation to everything. SwiGLU is selective."
        />

        {/* Exercise: RoPE */}
        <PredictExercise
          question="Without any position encoding, would the sentence 'the cat sat' and 'sat cat the' produce different attention scores?"
          hint="Attention scores come from Q dot K. If the embeddings don't encode position, does word order matter?"
          answer="No! They'd produce identical attention scores. The model has no way to tell word order without position encoding."
          explanation="This is why position encoding is essential, not optional. Without it, a transformer is a bag-of-words model — it sees WHAT tokens are present but not WHERE they are. RoPE solves this by rotating Q and K so the dot product naturally depends on relative position."
        />

        <RopeViz />

        <CodeBlock
          lang="rust"
          code={`pub fn rope(&self, pos: usize, head_dim: usize) -> Tensor {
    let mut data = self.data.clone();
    for i in (0..head_dim).step_by(2) {
        let freq = 1.0 / (10000.0_f32).powf(i as f32 / head_dim as f32);
        let angle = pos as f32 * freq;
        let (cos, sin) = (angle.cos(), angle.sin());
        let (x0, x1) = (data[i], data[i + 1]);
        data[i]     = x0 * cos - x1 * sin;  // rotate pair
        data[i + 1] = x0 * sin + x1 * cos;
    }
    Tensor::new(data, self.shape.clone())
}`}
        />

        {/* Exercise: RoPE relative position */}
        <PredictExercise
          question="RoPE rotates Q and K by position-dependent angles. If token at position 5 queries token at position 3, and token at position 10 queries token at position 8 — will the attention scores be the same?"
          hint="Both pairs have the same relative distance: 5-3 = 2 and 10-8 = 2. RoPE encodes relative position..."
          answer="Yes! Both get the same score because RoPE makes the dot product depend only on the relative distance (2), not the absolute positions."
          explanation="This is the key property of RoPE: R(5)^T · R(3) = R(5-3) = R(2), and R(10)^T · R(8) = R(10-8) = R(2). Same relative distance, same rotation, same score. This means the model automatically generalizes position relationships — it doesn't need to see every absolute position during training."
        />

        <InfoCard title="Why rotation encodes relative position" accent="emerald">
          <div className="space-y-2">
            <p>
              Rotate Q by angle &theta;_m (position m) and K by &theta;_n
              (position n). Their dot product equals the original dot product
              rotated by &theta;_m - &theta;_n. The absolute positions cancel
              out — only the distance (m - n) matters.
            </p>
            <p>
              Mathematically: <code>R(a)^T &middot; R(b) = R(b - a)</code>.
              Position sensitivity emerges from the geometry. No learned
              parameters, no lookup table, generalizes to any length.
            </p>
          </div>
        </InfoCard>

        <TryThis
          label="Trace Q/K/V composition with attention"
          commands={[
            'tensor_create {"id": "q_vec", "data": [1.0, 0.5, -0.3, 0.8], "shape": [1, 4]}',
            'tensor_create {"id": "k_vec", "data": [0.7, 0.9, 0.2, -0.5], "shape": [1, 4]}',
            'tensor_create {"id": "v_vec", "data": [1.0, 0.0, 0.0, 1.0], "shape": [1, 4]}',
            'attention_forward {"q": "q_vec", "k": "k_vec", "v": "v_vec"}',
          ]}
        />

        {/* ============================================================ */}
        {/* SECTION: Full Transformer Block (expanded) */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Full Transformer Block
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Let's walk one token through a complete block with real shapes.
              Assume TinyLlama: d_model = 2048, n_heads = 32, head_dim = 64,
              ffn_hidden = 5632.
            </p>
          </div>

          {/* Token journey table */}
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-surface-overlay)]">
                  <th className="text-left py-2 pr-4 font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Step</th>
                  <th className="text-left py-2 pr-4 font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Operation</th>
                  <th className="text-left py-2 font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Shape</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-surface-overlay)]/50">
                {[
                  ["1", "Input x (embedding lookup)", "[2048]"],
                  ["2", "x_norm₁ = RMSNorm(x)", "[2048]"],
                  ["3", "Q = x_norm₁ @ W_Q", "[32, 64]  (32 heads × 64 dim)"],
                  ["3", "K = x_norm₁ @ W_K", "[8, 64]   (grouped-query: 8 kv heads)"],
                  ["3", "V = x_norm₁ @ W_V", "[8, 64]"],
                  ["4", "Q, K = RoPE(Q, K, pos)", "[32, 64], [8, 64]"],
                  ["5", "attn_out = Attention(Q, K, V)", "[32, 64] → [2048]"],
                  ["6", "x = x + attn_out  (residual)", "[2048]"],
                  ["7", "x_norm₂ = RMSNorm(x)", "[2048]"],
                  ["8", "gate = silu(x_norm₂ @ W_gate)", "[5632]"],
                  ["8", "up = x_norm₂ @ W_up", "[5632]"],
                  ["8", "ffn_out = (gate * up) @ W_down", "[2048]"],
                  ["9", "x = x + ffn_out  (residual)", "[2048]  ← same as input!"],
                ].map(([step, op, shape], idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors">
                    <td className="py-2 pr-4 font-mono text-[var(--color-accent-blue)]">{step}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{op}</td>
                    <td className="py-2 font-mono text-[var(--color-text-tertiary)]">{shape}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
            The output is exactly the same shape as the input. Stack this block
            22× (TinyLlama) or 80× (LLaMA 70B). Same structure, different
            weights. The final output goes through one more RMSNorm and a
            linear layer (the "lm_head") to produce logits over the vocabulary.
          </p>
        </div>

        <PredictExercise
          question="After step 2 (x_norm₁ = RMSNorm(x)), what is the shape of x_norm₁ for a single token in TinyLlama?"
          hint="RMSNorm doesn't change the shape — it only changes the values. What was the shape going in?"
          answer="[2048]. RMSNorm is applied element-wise and the output shape always matches the input shape."
          explanation="This is true for all normalization operations: LayerNorm, RMSNorm, BatchNorm all produce outputs with the same shape as their input. They only change the scale of the values, not the structure. This is why they can be inserted anywhere in the network without changing the architecture."
        />

        {/* TransformerBlockFlow interactive stepper */}
        <TransformerBlockFlow />

        {/* ============================================================ */}
        {/* SECTION: Why Residual Connections? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Why Residual Connections?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Every transformer block ends with <code>x = x + sublayer(x)</code>.
              This "residual connection" is not incidental — it's load-bearing.
              Without it, training 32-layer networks is nearly impossible.
            </p>
            <p>
              The reason: the <strong>vanishing gradient problem</strong>. During
              backpropagation, gradients are multiplied as they flow backward
              through each layer. If each layer shrinks gradients slightly — say
              by a factor of 0.9 — after 32 layers you have:
            </p>
            <p className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3">
              0.9³² ≈ 0.034  →  97% of the gradient signal is gone
            </p>
            <p>
              Layers near the input see essentially zero gradient. They don't
              learn. You've spent compute training a model where only the last
              few layers do any real work.
            </p>
            <p>
              Residual connections create a <strong>gradient highway</strong>.
              The derivative of <code>x + f(x)</code> with respect to x is{" "}
              <code>1 + f'(x)</code>. That constant <code>1</code> is
              everything. Gradients now flow backward through the direct path
              without multiplication — they arrive at early layers at full
              strength.
            </p>
            <PredictExercise
              question="Without residual connections, after 32 layers each multiplying the gradient by 0.9×, only ~3% of the original gradient signal reaches layer 1. What happens to those weights?"
              hint="If a weight gets a gradient of 0.03 instead of 1.0, how much does it update per step?"
              answer="The first layer's weights barely update — they're stuck near their random initialization. The model learns its later layers but the early feature extractors stay broken."
              explanation="This is why deep networks without residuals (like very deep vanilla RNNs) are hard to train. The 'vanishing gradient problem' isn't just theoretical — it's why ResNet (2015) was a breakthrough. By adding residual connections, gradients flow directly to early layers with magnitude ~1.0, not 0.03. Every layer gets a real training signal."
            />
          </div>

          {/* Concrete comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                Without residuals
              </p>
              <div className="text-xs font-mono text-[var(--color-text-secondary)] space-y-1">
                <p>gradient at layer 32: 1.0</p>
                <p>gradient at layer 30: 0.81</p>
                <p>gradient at layer 20: 0.12</p>
                <p>gradient at layer 10: 0.019</p>
                <p className="text-red-400">gradient at layer 1:  0.003 ← dead</p>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Assuming each layer multiplies gradient by 0.9×. Layers near the
                input learn nothing.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-accent-emerald)]/25 bg-[var(--color-accent-emerald)]/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--color-accent-emerald)] uppercase tracking-wider">
                With residuals
              </p>
              <div className="text-xs font-mono text-[var(--color-text-secondary)] space-y-1">
                <p>gradient = <span className="text-[var(--color-accent-emerald)]">1</span> + f'(x)  ← direct path</p>
                <p>gradient at layer 32: ≈ 1.9</p>
                <p>gradient at layer 20: ≈ 1.9</p>
                <p>gradient at layer 10: ≈ 1.9</p>
                <p className="text-[var(--color-accent-emerald)]">gradient at layer 1:  ≈ 1.9 ← alive</p>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                The "1" from the direct path dominates. All layers receive strong
                gradient. Deep networks can actually train.
              </p>
            </div>
          </div>

          <InfoCard title="ResNet → Transformer" accent="blue">
            <p>
              Residual connections were first introduced in ResNet (2015) for
              image classification, enabling 152-layer networks. The transformer
              paper borrowed the idea directly. It's one of the few architectural
              choices that appears in essentially every large neural network
              built since 2016 — CNNs, transformers, diffusion models, all of
              them.
            </p>
          </InfoCard>
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
              <strong>RMSNorm</strong> = LayerNorm minus the mean. Cheaper, works
              just as well. Applied before each sub-layer (pre-norm).
            </li>
            <li>
              <strong>Pre-norm</strong> stabilizes early training: the residual
              path carries raw signal, so the model can't collapse even when
              sub-layer weights are random.
            </li>
            <li>
              <strong>SiLU</strong> = x &times; sigmoid(x). Smooth, no dead neurons.{" "}
              <strong>SwiGLU</strong> adds a gating mechanism with 3 weight matrices.
            </li>
            <li>
              <strong>RoPE</strong> rotates Q/K by position angles. Dot product
              encodes relative position from the geometry — no learned embeddings.
            </li>
            <li>
              <strong>Residual connections</strong> are a gradient highway: the
              derivative of x + f(x) is 1 + f'(x). That constant 1 means
              gradients reach all 32+ layers without vanishing.
            </li>
            <li>
              A <strong>transformer block</strong> is: RMSNorm → Attention (with RoPE)
              → residual add → RMSNorm → SwiGLU FFN → residual add. Stack N times.
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* NEXT UP + NAV */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Coming up next...
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You know every operation in a transformer. You know how model files
            store the weights. Time for the grand finale: loading a real LLaMA
            model and generating text, token by token, with the engine you built.
          </p>
        </div>

        <LearnNav current={7} />
        <ClaudePrompts chapter={7} />
      </div>
    </PageTransition>
  );
}
