import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import PredictExercise from "../components/ui/PredictExercise";
import ProjectNav from "../components/ui/ProjectNav";

export default function ProjectAttention() {
  return (
    <PageTransition>
      <div className="space-y-10 max-w-4xl">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-emerald)]">
            Project 03
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Attention Explorer — See What the Model is Looking At
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            You'll craft different Q, K, V matrices and watch how the attention
            pattern changes. By the end, you'll <em>feel</em> what attention does,
            not just understand the math.
          </motion.p>
        </div>

        {/* HOOK */}
        <InfoCard title="Attention is just a fancy lookup table" accent="emerald">
          <div className="space-y-2">
            <p>
              The attention formula looks intimidating: softmax(QK^T/&radic;d_k)V.
              But here's what it actually does: each token asks "who has what I
              need?" (via Q and K), gets a relevance score, then takes a weighted
              average of everyone's values (V).
            </p>
            <p>
              The best way to understand it? <strong>Break it.</strong> Give it
              weird inputs and see what happens. Make all queries identical — does
              every token attend to the same thing? Make keys orthogonal — do
              tokens ignore each other? That's what this project is about.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* EXPERIMENT 1: Identity attention */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Experiment 1: "I Only Care About Myself"
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              What happens when each token's query perfectly matches only its own
              key? We use identity-like Q and K: token 0 looks in direction [1,0],
              token 1 looks in direction [0,1]. They're orthogonal — neither cares
              about the other.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'attention_forward(2, 2, [1,0, 0,1], [1,0, 0,1], [10,20, 30,40])',
          ]}
          label="Run identity attention"
        />

        <PredictExercise
          question="Token 0's Q is [1,0] and token 1's K is [0,1]. Their dot product is 0. But after softmax, will token 0 give ZERO attention to token 1?"
          hint="Softmax never produces exactly zero. exp(0) is still positive."
          answer="No! Token 0 gives ~33% attention to token 1. Softmax of [0.71, 0] ≈ [0.67, 0.33]."
          explanation="This is a key insight: attention is always soft. Even with zero raw score, softmax distributes some weight. The model would need very large negative scores (via masking) to truly ignore a token. In practice, the √d_k scaling keeps scores moderate, so attention is always somewhat distributed."
        />

        {/* ============================================================ */}
        {/* EXPERIMENT 2: Uniform attention */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Experiment 2: "Everyone Looks the Same to Me"
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              What if all queries and keys are identical? Every token asks for the
              same thing, and every token offers the same thing. The attention
              should become <strong>uniform</strong> — every token attends equally
              to every other token.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'attention_forward(3, 2, [1,0, 1,0, 1,0], [1,0, 1,0, 1,0], [1,0, 0,1, 0.5,0.5])',
          ]}
          label="Run uniform attention (all Q and K identical)"
        />

        <PredictExercise
          question="With 3 tokens and uniform attention, what are the attention weights? What's the output?"
          hint="All scores are equal, so softmax gives [1/3, 1/3, 1/3] for each row."
          answer="Each row is [0.33, 0.33, 0.33]. The output is the average of all three value vectors."
          explanation="When attention is uniform, the output for every token is just the mean of all values. This is like averaging — no token is special. Real models start with near-uniform attention and learn to sharpen it during training."
        />

        {/* ============================================================ */}
        {/* EXPERIMENT 3: One token dominates */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Experiment 3: "Everyone Looks at Token 0"
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              What if all queries point in the same direction as token 0's key,
              but NOT token 1 or 2's key? Every token should attend mostly to
              token 0. This is like a "copy token 0's value to everyone" pattern.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'attention_forward(3, 2, [1,0, 1,0, 1,0], [1,0, 0,1, 0,1], [100,0, 0,100, 50,50])',
          ]}
          label="All queries match only token 0's key"
        />

        <PredictExercise
          question="Token 0 has value [100, 0]. If all tokens attend mostly to token 0, what will the outputs approximately look like?"
          hint="If attention to token 0 is ~50% and the rest is split, the output is dominated by [100, 0]."
          answer="All outputs will be close to [100, 0] — token 0's value dominates because everyone attends to it."
          explanation="This 'copy from position 0' pattern actually appears in real transformers! When a model learns that position 0 (often the BOS token) contains important context, attention heads learn to point there. You just created one of the simplest attention heads found in real models."
        />

        {/* ============================================================ */}
        {/* EXPERIMENT 4: Values matter more than you think */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Experiment 4: Same Attention, Different Values
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Here's something people miss: Q and K determine <em>where</em> to
              look, but V determines <em>what you get</em>. Let's run the same
              Q/K pattern with two completely different V matrices and see how
              the output changes.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'attention_forward(2, 2, [1,0, 0,1], [1,0, 0,1], [1,0, 0,1])',
            'attention_forward(2, 2, [1,0, 0,1], [1,0, 0,1], [100,200, 300,400])',
          ]}
          label="Same Q/K, different V — compare outputs"
        />

        <PredictExercise
          question="The attention weights are identical in both runs (same Q and K). But the outputs are completely different. Why?"
          hint="Output = attention_weights @ V. Same weights, different V = different output."
          answer="The attention weights only determine the mixing ratios. V provides the actual content being mixed. Same recipe, different ingredients."
          explanation="This is why separate Q/K/V matters. Q and K learn what's relevant (the attention pattern). V learns what information to pass forward. A model might learn 'look at the previous noun' (Q/K) and 'copy its embedding features' (V) as two independent things."
        />

        {/* ============================================================ */}
        {/* EXPERIMENT 5: Gradients tell the story */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Experiment 5: What Would Training Change?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              When you run attention, the Visualizer also shows Q, K, and V
              gradients. These tell you: if this were part of a larger model
              being trained, which component would change the most? Large V
              gradient = "the model needs different values." Large Q/K gradient
              = "the model needs to look at different tokens."
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'attention_forward(3, 2, [1,0, 0,1, 0.5,0.5], [1,0, 0,1, 0.7,0.7], [1,0, 0,1, 0.5,0.5])',
          ]}
          label="Run 3-token attention and check gradients in Visualizer"
        />

        <InfoCard title="Reading the gradients" accent="blue">
          <div className="space-y-2">
            <p>
              Click "Open in Visualizer" on the result. In the gradient panels:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Q gradients near zero</strong> → the query directions are fine, no need to change what we're looking for</li>
              <li><strong>K gradients near zero</strong> → the key directions are fine, no need to change what we're advertising</li>
              <li><strong>V gradients large</strong> → the values need to change — the model wants different information passed through</li>
            </ul>
            <p>
              In a real transformer, these gradients flow back through the W_q,
              W_k, W_v projection matrices, adjusting how the model computes
              Q, K, V from the input embeddings.
            </p>
          </div>
        </InfoCard>

        {/* WHAT YOU BUILT */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            You Now Have Attention Intuition
          </h2>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              Most people learn attention from the formula. You learned it by
              breaking it — by seeing what happens when you make all queries
              identical, when you force attention to one token, when you swap
              values while keeping the pattern fixed.
            </p>
            <p>
              This intuition is more valuable than memorizing softmax(QK^T/&radic;d_k)V.
              When you see attention visualizations of real models — the colorful
              heatmaps people share on Twitter — you'll actually know what they
              mean. "This head copies from position 0." "This head attends
              uniformly." "This head looks at the previous token." You've seen
              all of these patterns.
            </p>
          </div>
        </div>

        {/* Bonus */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Bonus Experiments</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>4 tokens instead of 3:</strong> Add a fourth token and
                see how the attention pattern changes. Does the extra token
                "steal" attention from the others?
              </li>
              <li>
                <strong>High-dimensional Q/K:</strong> Try d_k = 4 instead of 2.
                Do the attention weights get sharper? (Hint: the √d_k scaling
                adjusts for this.)
              </li>
              <li>
                <strong>Make a "look at the previous token" pattern:</strong>
                Can you craft Q and K so that token 1 attends mostly to token 0,
                and token 2 attends mostly to token 1? This is a real attention
                pattern found in language models.
              </li>
            </ol>
          </div>
        </div>

        <ProjectNav current="attention" />
      </div>
    </PageTransition>
  );
}
