import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import RopeViz from "../components/viz/RopeViz";

export default function Chapter9() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 09
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Transformer Building Blocks
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            RMSNorm, SiLU, and RoPE — the three operations that separate a real
            LLaMA transformer from our toy attention mechanism.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Why These Matter */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Beyond Toy Attention
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              In Chapter 7 we built <code>softmax(QK^T/&radic;d_k)V</code> — the
              core attention formula. But a real transformer block has several
              more operations around it. LLaMA (and most modern models) use
              three key building blocks we haven't covered:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>RMSNorm</strong> — normalizes activations before each
                sub-layer
              </li>
              <li>
                <strong>SiLU / SwiGLU</strong> — the activation function in the
                feedforward network
              </li>
              <li>
                <strong>RoPE</strong> — encodes token positions without learned
                embeddings
              </li>
            </ul>
            <p>
              Each of these replaced an older approach (LayerNorm, ReLU,
              absolute position embeddings) for good reasons. Let's understand
              each one.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: RMSNorm */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            RMSNorm — Simpler Normalization
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Normalization keeps activations from exploding or vanishing as
              data flows through many layers. The original transformer used{" "}
              <strong>LayerNorm</strong>, which subtracts the mean and divides
              by the standard deviation:
            </p>
            <p className="font-mono text-xs">
              LayerNorm(x) = (x - mean(x)) / std(x) * weight + bias
            </p>
            <p>
              LLaMA uses <strong>RMSNorm</strong> instead — it drops the mean
              subtraction and the bias term:
            </p>
            <p className="font-mono text-xs">
              RMSNorm(x) = (x / rms(x)) * weight
            </p>
            <p>
              where <code>rms(x) = &radic;(mean(x&sup2;) + &epsilon;)</code>.
            </p>
            <p>
              Why is this better? Empirically it works just as well, but it's
              computationally cheaper — you save one pass over the data (no mean
              computation) and one vector operation (no subtraction). In a model
              doing this at every layer for every token, those savings add up.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`/// RMSNorm: normalize by root-mean-square, then scale by weights.
/// out[i] = (x[i] / rms(x)) * weight[i]
/// where rms(x) = sqrt(mean(x²) + eps)
pub fn rms_norm(&self, weight: &Tensor, eps: f32) -> Tensor {
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

        <InfoCard title="Pre-Norm vs Post-Norm" accent="blue">
          <div className="space-y-2">
            <p>
              The original transformer applied normalization <em>after</em> the
              attention and FFN (post-norm). LLaMA applies it <em>before</em>{" "}
              (pre-norm). Pre-norm makes training more stable because the
              residual connection adds unnormalized values — the signal flows
              through without being squashed by normalization at every step.
            </p>
            <p>
              In our code you'll see <code>x_norm = x.rms_norm(...)</code> used
              as input to attention and FFN, while the original <code>x</code>{" "}
              is used for the residual: <code>x = x.add(&result)</code>.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: SiLU and SwiGLU */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            SiLU and SwiGLU — Better Activations
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              In Chapter 6, our MLP used <code>tanh</code> as the activation
              function. The original transformer used <strong>ReLU</strong>
              (<code>max(0, x)</code>). LLaMA uses <strong>SiLU</strong> inside
              a <strong>SwiGLU</strong> structure — and it makes a real
              difference.
            </p>
            <p>
              <strong>SiLU</strong> (Sigmoid Linear Unit) is:
            </p>
            <p className="font-mono text-xs">
              silu(x) = x * sigmoid(x) = x * (1 / (1 + e^(-x)))
            </p>
            <p>
              Unlike ReLU, SiLU is smooth everywhere (no kink at zero) and
              allows small negative values through. This means gradients never
              fully die — no "dead neurons" like ReLU can produce.
            </p>
            <p>
              <strong>SwiGLU</strong> wraps SiLU in a gated structure with three
              weight matrices instead of two:
            </p>
            <p className="font-mono text-xs">
              SwiGLU(x) = (silu(x @ W_gate)) * (x @ W_up)
            </p>
            <p>
              The "gate" path decides how much signal to let through; the "up"
              path provides the signal. The output is then projected back down
              by <code>W_down</code>. This gating mechanism lets the model learn
              more complex non-linear transformations.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`/// SiLU (Sigmoid Linear Unit): silu(x) = x * sigmoid(x)
/// Used in SwiGLU, the FFN activation in LLaMA.
pub fn silu(&self) -> Tensor {
    let data = self.data.iter()
        .map(|x| x * (1.0 / (1.0 + (-x).exp())))
        .collect();
    Tensor::new(data, self.shape.clone())
}

// SwiGLU FFN in the forward pass:
let gate = block.ffn_gate.matvec(&x_norm).silu();
let up   = block.ffn_up.matvec(&x_norm);
let ffn  = block.ffn_down.matvec(&gate.mul(&up));`}
        />

        <InfoCard title="Three Weight Matrices, Not Two" accent="amber">
          <div className="space-y-2">
            <p>
              A standard FFN has two weight matrices: up-project and
              down-project. SwiGLU has three:{" "}
              <code>W_gate</code>, <code>W_up</code>, <code>W_down</code>. To
              keep the same parameter count, the hidden dimension is typically
              reduced (LLaMA uses <code>2/3 * 4 * dim</code> instead of{" "}
              <code>4 * dim</code>). Same cost, better quality.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: RoPE */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            RoPE — Rotary Position Embedding
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A transformer with just attention has no sense of token order —
              "the cat sat" and "sat cat the" would produce the same attention
              scores. Position encoding fixes this by injecting position
              information.
            </p>
            <p>
              The original transformer used <strong>absolute position
              embeddings</strong> — a learned vector added to each position.
              The problem: it can't generalize to sequence lengths longer than
              what it was trained on.
            </p>
            <p>
              LLaMA uses <strong>RoPE</strong> (Rotary Position Embedding),
              which works differently. Instead of adding a position vector, it{" "}
              <em>rotates</em> pairs of values in Q and K by
              position-dependent angles:
            </p>
            <p className="font-mono text-xs">
              [x₀, x₁] → [x₀·cos(θ) - x₁·sin(θ), x₀·sin(θ) + x₁·cos(θ)]
            </p>
            <p>
              where <code>θ = pos * freq</code> and{" "}
              <code>freq = 1/10000^(2i/d)</code>. Each pair of dimensions
              rotates at a different frequency — early pairs rotate fast
              (capturing local position), later pairs rotate slowly (capturing
              global position).
            </p>
            <p>
              The key insight: the dot product <code>q·k</code> after rotation
              depends only on the <strong>relative</strong> distance between
              positions, not their absolute values. This means the model
              naturally learns relative position relationships.
            </p>
          </div>
        </div>

        <RopeViz />

        <CodeBlock
          lang="rust"
          code={`/// Apply RoPE to a vector.
/// Rotates pairs of elements by position-dependent angles.
pub fn rope(&self, pos: usize, head_dim: usize) -> Tensor {
    let mut data = self.data.clone();
    for i in (0..head_dim).step_by(2) {
        let freq = 1.0 / (10000.0_f32).powf(i as f32 / head_dim as f32);
        let angle = pos as f32 * freq;
        let cos = angle.cos();
        let sin = angle.sin();
        let x0 = data[i];
        let x1 = data[i + 1];
        data[i]     = x0 * cos - x1 * sin;
        data[i + 1] = x0 * sin + x1 * cos;
    }
    Tensor::new(data, self.shape.clone())
}`}
        />

        <InfoCard title="Why Rotation Encodes Relative Position" accent="emerald">
          <div className="space-y-2">
            <p>
              If you rotate vector <code>q</code> by angle <code>θ_m</code>{" "}
              (position m) and vector <code>k</code> by angle{" "}
              <code>θ_n</code> (position n), their dot product equals the
              dot product of the originals rotated by{" "}
              <code>θ_m - θ_n</code>. The absolute positions cancel out —
              only the relative distance <code>m - n</code> matters.
            </p>
            <p>
              This is a mathematical property of rotation matrices:{" "}
              <code>R(a)^T · R(b) = R(b - a)</code>. It's elegant — position
              sensitivity comes for free from the geometry.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: matvec */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Matrix-Vector Multiply for Inference
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              During training, you process batches of sequences — so the input
              is a matrix and you use full matrix multiply. During{" "}
              <strong>inference</strong>, you typically process one token at a
              time — so the input is a <strong>vector</strong>.
            </p>
            <p>
              A dedicated <code>matvec</code> operation avoids the overhead of
              reshaping the vector to a [1, N] matrix and back. It's a simpler
              loop: for each row of the weight matrix, compute the dot product
              with the input vector.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`/// Matrix-vector multiply: [M, N] @ [N] -> [M].
/// More efficient than reshaping and using matmul.
pub fn matvec(&self, vec: &Tensor) -> Tensor {
    let (m, n) = (self.shape[0], self.shape[1]);
    let mut result = vec![0.0f32; m];
    for i in 0..m {
        let mut sum = 0.0f32;
        for j in 0..n {
            sum += self.data[i * n + j] * vec.data[j];
        }
        result[i] = sum;
    }
    Tensor::new(result, vec![m])
}`}
        />

        {/* ============================================================ */}
        {/* Key Takeaways */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            Key Takeaways
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              <strong>RMSNorm</strong> normalizes by root-mean-square only — no
              mean subtraction, no bias. Cheaper than LayerNorm, works just as
              well. Applied <em>before</em> each sub-layer (pre-norm).
            </li>
            <li>
              <strong>SiLU</strong> is <code>x * sigmoid(x)</code> — smooth,
              no dead neurons. <strong>SwiGLU</strong> wraps it in a gated
              structure with three weight matrices for better expressiveness.
            </li>
            <li>
              <strong>RoPE</strong> rotates Q/K pairs by position-dependent
              angles. The dot product naturally encodes <em>relative</em>{" "}
              position — no learned position embeddings needed.
            </li>
            <li>
              <strong>matvec</strong> is the inference-time workhorse — one
              token at a time means matrix-vector, not matrix-matrix.
            </li>
          </ul>
        </div>

        <ChapterNav current={9} />
      </div>
    </PageTransition>
  );
}
