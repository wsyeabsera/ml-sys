import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";
import RopeViz from "../components/viz/RopeViz";

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

        <InfoCard title="Pre-norm vs post-norm" accent="blue">
          <div className="space-y-2">
            <p>
              The original transformer normalized <em>after</em> attention and
              FFN. LLaMA normalizes <em>before</em>. Why? With pre-norm, the
              residual connection adds unnormalized values — the raw signal
              flows through without being squashed at every step. This makes
              training more stable, especially for deep models.
            </p>
          </div>
        </InfoCard>

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

        {/* ============================================================ */}
        {/* SECTION: Putting it together */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Full Transformer Block
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              One transformer block is all of this combined:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>RMSNorm</strong> the input</li>
              <li>Compute Q, K, V projections</li>
              <li>Apply <strong>RoPE</strong> to Q and K</li>
              <li>Run <strong>attention</strong> (the formula from Ch5)</li>
              <li><strong>Residual add</strong>: x = x + attention_output</li>
              <li><strong>RMSNorm</strong> again</li>
              <li>Run <strong>SwiGLU FFN</strong></li>
              <li><strong>Residual add</strong>: x = x + ffn_output</li>
            </ol>
            <p>
              Repeat this block 22 times (for TinyLlama) or 80 times (for
              LLaMA 70B). Same structure, different weights. That's the entire
              model.
            </p>
          </div>
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
              <strong>SiLU</strong> = x &times; sigmoid(x). Smooth, no dead neurons.{" "}
              <strong>SwiGLU</strong> adds a gating mechanism with 3 weight matrices.
            </li>
            <li>
              <strong>RoPE</strong> rotates Q/K by position angles. Dot product
              encodes relative position from the geometry — no learned embeddings.
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
