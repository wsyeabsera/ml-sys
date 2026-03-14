import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import AttentionViz from "../components/viz/AttentionViz";

export default function Chapter7() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 05
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Attention — The "Just Look at the Important Stuff" Mechanism
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            That scary formula <code>softmax(QK^T/&radic;d_k)V</code> is just
            four operations you already know, duct-taped together. Let's take
            it apart.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="Why MLPs aren't enough" accent="emerald">
          <div className="space-y-2">
            <p>
              In the sentence "The cat sat on the mat because <strong>it</strong>{" "}
              was tired," what does "it" refer to? The cat, obviously. But an MLP
              processes each position independently — it has no way to say
              "hey, position 7 should look at position 1."
            </p>
            <p>
              Attention solves this by letting every token ask a question:
              "which other tokens are relevant to me right now?" and then{" "}
              <em>dynamically</em> weighting the answer. Not hardcoded. Not
              fixed-distance. The model <strong>learns</strong> where to look.
            </p>
            <p>
              This one idea — "let positions talk to each other" — is the
              reason transformers demolished every previous NLP architecture.
              Let's understand exactly how it works.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Q, K, V */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Queries, Keys, Values: A Search Engine Inside Your Model
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The best analogy is a search engine:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Query (Q):</strong> "What am I looking for?" Each token
                broadcasts a search query describing the information it needs.
              </li>
              <li>
                <strong>Key (K):</strong> "What do I have?" Each token
                advertises a label describing what information it can provide.
              </li>
              <li>
                <strong>Value (V):</strong> "Here's the actual content." The
                information that gets retrieved when a query matches a key.
              </li>
            </ul>
            <p>
              The <strong>score</strong> between query <em>i</em> and key{" "}
              <em>j</em> is their dot product. High score = good match = "this
              token has what I'm looking for." The output for each position is a
              weighted average of all values, where the weights come from the
              scores.
            </p>
            <p>
              If you've ever used a database — <code>SELECT value WHERE key
              MATCHES query</code> — attention is the fuzzy, differentiable
              version of that. Instead of exact matches, it does soft matches
              via dot products.
            </p>
          </div>
        </div>

        <InfoCard title="Why separate Q, K, V?" accent="amber">
          <div className="space-y-2">
            <p>
              Why not just use the input directly? Because separation gives
              flexibility. The same word can have a different query ("what do I
              need?") than its key ("what do I offer?") than its value ("what
              do I contain?").
            </p>
            <p>
              In our implementation, Q, K, V are provided directly. In a real
              transformer, they're projections of the input:{" "}
              <code>Q = x @ W_q</code>, <code>K = x @ W_k</code>,{" "}
              <code>V = x @ W_v</code>. Those projection matrices are learned
              during training.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Formula */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Formula: Four Operations, That's It
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p className="font-mono text-base text-[var(--color-text-primary)]">
              Attention(Q, K, V) = softmax(Q @ K^T / &radic;d_k) @ V
            </p>
            <p>
              Looks scary. It's not. Let's break it into four embarrassingly
              simple steps:
            </p>
            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li>
                <strong>Q @ K^T</strong> — dot product of every query with
                every key. Result: a [seq_len, seq_len] score matrix. Entry
                [i, j] = "how much does token i care about token j?"
              </li>
              <li>
                <strong>/ &radic;d_k</strong> — scale the scores down so they
                don't blow up. Without this, softmax would go nearly one-hot
                (all attention on one token) and gradients would vanish.
              </li>
              <li>
                <strong>softmax</strong> — normalize each row so it sums to 1.
                Now entry [i, j] is a proper weight: "token i puts X% of its
                attention on token j."
              </li>
              <li>
                <strong>@ V</strong> — weighted sum of values. Each token's
                output is a mixture of all values, weighted by the attention
                scores.
              </li>
            </ol>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Worked Example */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Let's Trace It With Real Numbers
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Two tokens, d_k = 2. Q and K are identity-like (token 0 looks
              in one direction, token 1 in the other):
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`Q = [[1, 0],    K = [[1, 0],    V = [[1, 2],
     [0, 1]]         [0, 1]]         [3, 4]]`}
            </pre>
            <p><strong>Step 1: Q @ K^T</strong></p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`scores = Q @ K^T = [[1*1+0*0, 1*0+0*1],   = [[1, 0],
                     [0*1+1*0, 0*0+1*1]]      [0, 1]]`}
            </pre>
            <p>
              Token 0's query matches token 0's key perfectly (score=1) and
              doesn't match token 1's key at all (score=0). Makes sense —
              they're looking in orthogonal directions.
            </p>
            <p><strong>Step 2: Scale by &radic;d_k = &radic;2 &asymp; 1.41</strong></p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`scaled = [[1/1.41, 0/1.41],  = [[0.71, 0.00],
           [0/1.41, 1/1.41]]     [0.00, 0.71]]`}
            </pre>
            <p><strong>Step 3: Softmax (row-wise)</strong></p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`weights = softmax([[0.71, 0.00],   = [[0.67, 0.33],
                   [0.00, 0.71]])      [0.33, 0.67]]`}
            </pre>
            <p>
              Even though the raw score for the "wrong" token was 0, softmax
              gives it 33% weight. Attention is always soft — it never
              completely ignores a token (unless you use masking).
            </p>
            <p><strong>Step 4: Weighted sum of values</strong></p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`output = weights @ V = [[0.67*1+0.33*3, 0.67*2+0.33*4],
                         [0.33*1+0.67*3, 0.33*2+0.67*4]]
                      = [[1.66, 2.66],
                         [2.34, 3.34]]`}
            </pre>
            <p>
              Token 0's output is mostly value 0 (67%) with some value 1 (33%).
              Token 1 is the opposite. Each token got a personalized blend of
              all values, weighted by relevance.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'attention_forward(2, 2, [1,0,0,1], [1,0,0,1], [1,2,3,4])',
          ]}
          label="Run this attention example and verify the numbers"
        />

        {/* ============================================================ */}
        {/* SECTION: Interactive Viz */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            See It: Step Through Attention
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Step through each phase of the attention computation. Watch the
              score matrix form, see softmax normalize it, and then see how the
              values get blended.
            </p>
          </div>
        </div>

        <AttentionViz />

        {/* ============================================================ */}
        {/* SECTION: Why Scale */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Why &radic;d_k? (The Exploding Dot Product Problem)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Here's a surprisingly important detail. The dot product of two
              random vectors with d_k dimensions has variance proportional to
              d_k. So as your model gets bigger (larger d_k), dot products get
              larger.
            </p>
            <p>
              Large inputs to softmax → nearly one-hot output (all attention on
              one token, zero on the rest). Nearly one-hot softmax → near-zero
              gradients. Near-zero gradients → the model stops learning which
              tokens to attend to. Disaster.
            </p>
            <p>
              Dividing by &radic;d_k normalizes the variance back to ~1. It's a
              one-line fix that makes training actually work. The difference
              between "my transformer learns" and "my transformer outputs
              garbage" is often this single division.
            </p>
          </div>
        </div>

        <InfoCard title="Softmax temperature intuition" accent="blue">
          <div className="space-y-2">
            <p>
              Think of 1/&radic;d_k as a temperature knob. Low temperature
              (big divisor) → sharp attention, focused on one token. High
              temperature (small divisor) → uniform attention, spread across
              all tokens. &radic;d_k is chosen so the temperature is "just
              right" regardless of model size.
            </p>
            <p>
              When people talk about "temperature" in LLM sampling
              (temperature=0.7, etc.), it's the same idea — they're scaling
              the logits before softmax to make the output more or less random.
            </p>
          </div>
        </InfoCard>

        <TryThis
          commands={[
            'attention_forward(3, 2, [1,0, 0,1, 0.5,0.5], [1,0, 0,1, 0.7,0.7], [1,0, 0,1, 0.5,0.5])',
          ]}
          label="Try with 3 tokens and see the attention weight matrix"
        />

        {/* ============================================================ */}
        {/* SECTION: Gradients */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Gradients Through Attention
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The backward pass flows through the same four ops in reverse:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <strong>weights @ V backward:</strong> standard matmul gradient
              </li>
              <li>
                <strong>Softmax backward:</strong> the tricky one — each row's
                gradient depends on all elements in that row (the Jacobian is
                dense)
              </li>
              <li>
                <strong>Scale backward:</strong> just multiply by 1/&radic;d_k
                again
              </li>
              <li>
                <strong>Q @ K^T backward:</strong> gives gradients for both Q
                and K
              </li>
            </ol>
            <p>
              The critical insight: <strong>Q, K, and V all get
              gradients</strong>. The model learns what to search for (Q), what
              to advertise (K), and what to store (V) — all simultaneously, all
              through gradient descent. One mechanism, three learnable
              components.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub fn scaled_dot_product_attention(
    q: &TensorValue, k: &TensorValue, v: &TensorValue,
) -> (TensorValue, TensorValue) {
    let d_k = q.data().shape[1] as f32;
    let kt = k.transpose(0, 1);         // K^T
    let scores = q.matmul(&kt);          // Q @ K^T → [seq, seq]
    let scaled = scores.scale(1.0 / d_k.sqrt());  // / √d_k
    let weights = scaled.softmax();      // row-wise softmax
    let output = weights.matmul(v);      // weights @ V → [seq, d_v]
    (output, weights)
}`}
        />

        <InfoCard title="Reading the attention weight matrix" accent="emerald">
          <div className="space-y-2">
            <p>
              The weight matrix is [seq_len × seq_len]. Entry [i, j] means
              "how much does token i attend to token j." Each row sums to 1.
            </p>
            <p>
              If row 0 is [0.6, 0.1, 0.3], token 0 gets 60% of its info from
              itself, 10% from token 1, 30% from token 2. You can literally
              read what the model is "looking at." This interpretability is one
              reason attention became so popular.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Mini Project: Decode the Attention Weights
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Time to build intuition for how attention distributes weight
              across tokens. You'll run attention with different inputs and
              learn to read the weight matrix.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                Run the 2-token identity example (Q and K both identity). Check
                the weights — each token attends mostly to itself. Why? (Their
                queries and keys point in orthogonal directions.)
              </li>
              <li>
                Now try identical Q and K: all [1,0]. What happens to the
                weights? (They become uniform — every token looks the same to
                every other token.)
              </li>
              <li>
                Try 3 tokens where token 0 and 2 have similar keys, but token
                1 is different. Which tokens does token 0 attend to the most?
              </li>
              <li>
                Look at the Q, K, V gradients. Which has the largest gradient?
                That's the component the model would adjust the most during
                training.
              </li>
              <li>
                Bonus: try making d_k = 4 instead of 2 (use 4-dimensional Q,
                K, V). Do the attention weights get sharper or softer? Why?
              </li>
            </ol>
          </div>
          <TryThis
            commands={[
              'attention_forward(2, 2, [1,0,0,1], [1,0,0,1], [1,2,3,4])',
              'attention_forward(2, 2, [1,0,1,0], [1,0,1,0], [1,2,3,4])',
              'attention_forward(3, 2, [1,0, 0,1, 1,0.1], [1,0, 0,1, 0.9,0.1], [10,20, 30,40, 50,60])',
            ]}
            label="Start exploring attention"
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
              <strong>Attention</strong> lets each token dynamically decide
              which other tokens are relevant. It's a learned, soft,
              differentiable lookup.
            </li>
            <li>
              <strong>Q, K, V</strong> = query (what to search for), key (what
              to advertise), value (the content). Score = Q dot K.
            </li>
            <li>
              The formula is four ops: <strong>matmul → scale → softmax →
              matmul</strong>. Each one you've already seen.
            </li>
            <li>
              <strong>&radic;d_k scaling</strong> prevents softmax from going
              one-hot, which would kill gradients. It's the difference between
              "model learns" and "model outputs garbage."
            </li>
            <li>
              The attention weight matrix is <strong>interpretable</strong> —
              you can read which tokens attend to which.
            </li>
            <li>
              Q, K, V all get gradients — the model learns what to ask, what
              to offer, and what to store, simultaneously.
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
            You've built tensors, autograd, layers, and attention — all the
            pieces of a transformer. But how are real models actually{" "}
            <em>stored</em>? Next up: cracking open a real model file (GGUF
            format) and seeing what's inside. Spoiler: it's just tensors with
            funny names.
          </p>
        </div>

        <LearnNav current={5} />
        <ClaudePrompts chapter={5} />
      </div>
    </PageTransition>
  );
}
