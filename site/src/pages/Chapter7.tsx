import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import AttentionViz from "../components/viz/AttentionViz";

export default function Chapter7() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 07
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Attention — The Key Mechanism
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Demystifying <code>softmax(QK^T/&radic;d_k)V</code>. Attention lets
            the model learn which parts of the input matter for each part of
            the output.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: What Problem Does Attention Solve? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Problem Does Attention Solve?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              In a sequence like "The cat sat on the mat," not all tokens matter
              equally when processing each position. When figuring out what "sat"
              relates to, "cat" is far more relevant than "the" or "mat."
            </p>
            <p>
              An MLP treats every input the same — it has no mechanism to say
              "pay more attention to position 1 than position 0." Attention
              fixes this by letting each position <strong>dynamically
              weight</strong> which other positions matter to it.
            </p>
            <p>
              The key insight: the relevance scores are{" "}
              <strong>learned, not hardcoded</strong>. The model learns what to
              look for (queries), what to advertise (keys), and what to
              retrieve (values).
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Queries, Keys, and Values */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Queries, Keys, and Values
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Think of a database: you have a <strong>query</strong> (what
              you're looking for), <strong>keys</strong> (labels on each
              item), and <strong>values</strong> (the actual content).
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Q (Query):</strong> "What am I looking for?" — each
                token broadcasts what information it needs.
              </li>
              <li>
                <strong>K (Key):</strong> "What do I contain?" — each token
                advertises what it can provide.
              </li>
              <li>
                <strong>V (Value):</strong> "Here's my actual content." — the
                information that gets retrieved.
              </li>
            </ul>
            <p>
              The score between query <em>i</em> and key <em>j</em> is their
              dot product. High dot product = the query matches the key = this
              value is relevant. The output for position <em>i</em> is a
              weighted sum of all values, where the weights come from how well
              query <em>i</em> matches each key.
            </p>
          </div>
        </div>

        <InfoCard title="Why Separate Q, K, V?" accent="amber">
          <div className="space-y-2">
            <p>
              You might wonder: why not just use the input directly? The
              answer is <strong>flexibility</strong>. By projecting the input
              into separate Q, K, V spaces, the model can learn:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Different queries for the same token in different contexts
              </li>
              <li>
                Keys that highlight different aspects of the token
              </li>
              <li>
                Values that carry different information than what the key
                advertises
              </li>
            </ul>
            <p>
              In our implementation, we skip the projection step and use Q, K,
              V directly. In a real transformer, there's a learned linear
              layer before each: <code>Q = x @ W_q</code>,{" "}
              <code>K = x @ W_k</code>, <code>V = x @ W_v</code>.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Full Formula */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Full Formula, Step by Step
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              <code>Attention(Q, K, V) = softmax(Q @ K^T / &radic;d_k) @ V</code>
            </p>
            <p>
              Looks intimidating, but it's just 4 operations. The interactive
              visualization below breaks it down step by step with real
              numbers. Step through it — watch how the score matrix turns into
              attention weights, and how those weights select which values to
              use.
            </p>
          </div>
        </div>

        <AttentionViz />

        {/* ============================================================ */}
        {/* SECTION: Why Scale by √d_k? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Why Scale by &radic;d_k?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The dot product of two random vectors with d_k dimensions has
              variance proportional to d_k. As d_k grows, dot products get
              larger. Large values push softmax outputs toward one-hot
              distributions (all weight on one token, zero on the rest).
            </p>
            <p>
              When softmax is nearly one-hot, its gradients vanish — the
              Jacobian is almost zero everywhere. Training stalls because the
              model can't adjust which tokens to attend to.
            </p>
            <p>
              Dividing by <code>&radic;d_k</code> normalizes the variance back
              to ~1, keeping softmax in its "useful" range where it can
              smoothly distribute attention and gradients flow properly. It's
              a simple trick with a huge impact.
            </p>
          </div>
        </div>

        <InfoCard title="Softmax Temperature" accent="emerald">
          <div className="space-y-2">
            <p>
              The scaling factor <code>1/&radic;d_k</code> acts like an
              inverse temperature. Lower temperature (larger divisor) makes
              the distribution sharper — more focused attention. Higher
              temperature makes it softer — more uniform. The{" "}
              <code>&radic;d_k</code> value is chosen to keep the "temperature"
              independent of the model dimension.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Gradients Through Attention */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Gradients Through Attention
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The backward pass flows through the same operations in reverse:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <strong>weights @ V backward:</strong> Standard matmul
                gradient — <code>d(weights) = grad @ V^T</code>,{" "}
                <code>d(V) = weights^T @ grad</code>
              </li>
              <li>
                <strong>Softmax backward:</strong> The hardest part. The
                Jacobian of softmax is{" "}
                <code>diag(s) - s @ s^T</code>. Each row's gradient depends
                on all elements in that row.
              </li>
              <li>
                <strong>Scale backward:</strong> Just multiply grad by the
                same constant <code>1/&radic;d_k</code>
              </li>
              <li>
                <strong>Q @ K^T backward:</strong>{" "}
                <code>d(Q) = grad @ K</code>,{" "}
                <code>d(K) = grad^T @ Q</code>
              </li>
            </ol>
            <p>
              The key insight: <strong>Q, K, and V all receive
              gradients</strong>. This means the model learns what to query,
              what to advertise as keys, and what to store as values — all
              simultaneously, all through gradient descent.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub fn scaled_dot_product_attention(
    q: &TensorValue,
    k: &TensorValue,
    v: &TensorValue,
) -> (TensorValue, TensorValue) {
    let d_k = q.data().shape[1] as f32;

    let kt = k.transpose(0, 1);       // K^T
    let scores = q.matmul(&kt);        // Q @ K^T → [seq, seq]
    let scaled = scores.scale(1.0 / d_k.sqrt());  // / √d_k
    let weights = scaled.softmax();    // row-wise softmax
    let output = weights.matmul(v);    // weights @ V → [seq, d_v]

    (output, weights)
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: Attention via MCP */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Try It: Attention via MCP
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The <code>attention_forward</code> tool runs the full attention
              computation — forward pass, attention weights, and backward pass
              with gradients for Q, K, and V.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="json"
          code={`// Example: 3 tokens, d_k = 2
{
  "tool": "attention_forward",
  "q": { "data": [1,0, 0,1, 0.5,0.5], "shape": [3, 2] },
  "k": { "data": [1,0, 0,1, 0.7,0.7], "shape": [3, 2] },
  "v": { "data": [1,0, 0,1, 0.5,0.5], "shape": [3, 2] }
}

// Returns:
// - output: [3, 2] — the attended values
// - attention_weights: [3, 3] — who attends to whom
// - gradients for q, k, v`}
        />

        <InfoCard title="Reading the Attention Weights" accent="blue">
          <div className="space-y-2">
            <p>
              The attention weight matrix is [seq_len, seq_len]. Entry [i, j]
              means "how much does token i attend to token j." Each row sums
              to 1. If row 0 is [0.6, 0.1, 0.3], then token 0 gets 60% of
              its information from token 0 (itself), 10% from token 1, and
              30% from token 2.
            </p>
            <p>
              This is interpretable — you can literally see what the model is
              "looking at." This interpretability is one reason attention
              became so popular.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* Key Takeaways */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            Key Takeaways
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              <strong>Attention</strong> lets each position dynamically
              weight which other positions matter. It solves the "which
              tokens are relevant?" problem.
            </li>
            <li>
              <strong>Q, K, V</strong> are the query (what to look for),
              key (what's available), and value (the actual content). The
              score is Q dot K — high score means relevant.
            </li>
            <li>
              <strong>Scaling by &radic;d_k</strong> prevents softmax
              saturation. Without it, attention becomes nearly one-hot and
              gradients vanish.
            </li>
            <li>
              <strong>All of Q, K, V get gradients.</strong> The model
              simultaneously learns what to ask for, what to advertise,
              and what to store.
            </li>
            <li>
              The formula <code>softmax(QK^T/&radic;d_k)V</code> is just
              4 operations: matmul, scale, softmax, matmul. Each is
              differentiable, so autograd handles backward automatically.
            </li>
          </ul>
        </div>

        <ChapterNav current={7} />
      </div>
    </PageTransition>
  );
}
