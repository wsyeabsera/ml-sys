import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";
import TransformerBlockViz from "../components/viz/TransformerBlockViz";

export default function Chapter10() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 08
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Running a Real LLM — The Grand Finale
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Everything comes together. Load a LLaMA model from a GGUF file and
            generate text, token by token, with the engine you built from
            scratch.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="You already built everything" accent="emerald">
          <div className="space-y-2">
            <p>
              Here's what a LLaMA forward pass does: embed a token, normalize it,
              project to Q/K/V, rotate with RoPE, attend, residual add, normalize
              again, run through SwiGLU, residual add, repeat for N layers, final
              norm, project to logits.
            </p>
            <p>
              Every single one of those operations is something you already
              understand. <code>matvec</code>, <code>rms_norm</code>,{" "}
              <code>rope</code>, <code>silu</code>, <code>softmax</code>,{" "}
              <code>add</code>. There's nothing new. It's just all of them,
              stacked together, running on real weights from a real model file.
            </p>
            <p>
              Let's wire it up.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Model Structure */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Model Is Just a Bag of Tensors
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A LLaMA model has three parts: a config (from GGUF metadata),
              some global tensors (embedding table, output projection, final
              norm), and a list of transformer blocks. Each block has exactly
              9 weight tensors — the same 9 from the previous chapter.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub struct LlamaModel {
    pub config: LlamaConfig,       // dim, n_layers, n_heads, vocab_size, ...
    pub token_embd: Tensor,        // [vocab_size, dim] — lookup table
    pub output: Tensor,            // [vocab_size, dim] — final projection
    pub output_norm: Tensor,       // [dim] — final RMSNorm weights
    pub blocks: Vec<TransformerBlock>,  // N identical blocks, different weights
}

// Each block has the same structure:
pub struct TransformerBlock {
    pub attn_q: Tensor,            // Q projection  [dim, dim]
    pub attn_k: Tensor,            // K projection  [dim, kv_dim]
    pub attn_v: Tensor,            // V projection  [dim, kv_dim]
    pub attn_output: Tensor,       // output proj   [dim, dim]
    pub attn_norm: Tensor,         // pre-attn norm  [dim]
    pub ffn_gate: Tensor,          // SwiGLU gate   [dim, ffn_dim]
    pub ffn_up: Tensor,            // SwiGLU up     [dim, ffn_dim]
    pub ffn_down: Tensor,          // SwiGLU down   [ffn_dim, dim]
    pub ffn_norm: Tensor,          // pre-FFN norm   [dim]
}`}
        />

        <InfoCard title="9 tensors per block, N blocks" accent="blue">
          <p>
            A 6-layer model has 6 &times; 9 = 54 block tensors + 3 global = 57
            total. A 32-layer model (LLaMA-7B) has 291 tensors. A 80-layer
            model (LLaMA-70B) has 723. Same structure every time — just more
            layers with bigger matrices.
          </p>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Forward Pass */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Forward Pass: One Token at a Time
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              During inference, we process <strong>one token at a time</strong>.
              Given a token ID and its position, the model returns logits —
              a score for every token in the vocabulary. The highest score is the
              prediction for the next token.
            </p>
            <p>
              Click through the diagram to see data flow through a block:
            </p>
          </div>
        </div>

        <TransformerBlockViz />

        <CodeBlock
          lang="rust"
          code={`pub fn forward(&self, token: usize, pos: usize,
    key_cache: &mut Cache, value_cache: &mut Cache,
) -> Tensor {
    let mut x = self.token_embd.row(token);    // embed the token

    for (i, block) in self.blocks.iter().enumerate() {
        // === Attention sub-layer ===
        let x_norm = x.rms_norm(&block.attn_norm, eps);
        let q = apply_rope(block.attn_q.matvec(&x_norm), pos);
        let k = apply_rope(block.attn_k.matvec(&x_norm), pos);
        let v = block.attn_v.matvec(&x_norm);
        key_cache[i].push(k);              // cache for future tokens
        value_cache[i].push(v);
        let attn = multi_head_attention(&q, &key_cache[i],
            &value_cache[i], n_heads, n_kv_heads, head_dim);
        x = x.add(&block.attn_output.matvec(&attn));  // residual

        // === FFN sub-layer ===
        let x_norm = x.rms_norm(&block.ffn_norm, eps);
        let gate = block.ffn_gate.matvec(&x_norm).silu();
        let up = block.ffn_up.matvec(&x_norm);
        x = x.add(&block.ffn_down.matvec(&gate.mul(&up)));  // residual
    }

    let x_norm = x.rms_norm(&self.output_norm, eps);
    self.output.matvec(&x_norm)  // → logits [vocab_size]
}`}
        />

        <PredictExercise
          question="A model has 6 layers, each with 9 weight tensors, plus 3 global tensors. If you process one token, how many matvec operations happen in the forward pass?"
          hint="Each layer does: Q projection, K projection, V projection, attention output projection, FFN gate, FFN up, FFN down = 7 matvecs. Plus the final output projection."
          answer="6 × 7 + 1 = 43 matvec operations for a single token."
          explanation="Each layer has 7 matvec calls (4 attention projections + 3 FFN). Times 6 layers = 42. Plus the final output projection (logits) = 43 total. For a 32-layer model, that's 225 matvec operations per token. Now imagine doing that millions of times during training."
        />

        {/* ============================================================ */}
        {/* SECTION: KV Cache */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The KV Cache: Don't Recompute What You Already Know
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              When generating "The cat sat on the ___", by the time you're
              predicting the blank you've already computed K and V for "The",
              "cat", "sat", "on", "the" at every layer. Recomputing them all
              from scratch at every step would be O(n&sup2;) — painfully slow.
            </p>
            <p>
              The <strong>KV cache</strong> stores them. Each new token only
              computes its own Q, K, V, then attends over the full cache. This
              makes generation O(n) per token. It's the single biggest
              optimization in LLM serving.
            </p>
          </div>
        </div>

        <InfoCard title="Group Query Attention (GQA)" accent="amber">
          <div className="space-y-2">
            <p>
              Standard multi-head attention: each head has its own Q, K, V.
              Group Query Attention: multiple Q heads share the same K/V head.
              32 Q heads with 8 KV heads = 4x smaller cache. Minimal quality
              loss, huge memory savings for long sequences.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Generation */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Generation: The Autoregressive Loop
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Text generation is embarrassingly simple: predict one token, append
              it, predict the next. Repeat until you're done.
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Process all prompt tokens (fills the KV cache)</li>
              <li>Sample the next token from the logits</li>
              <li>Feed that token back in at the next position</li>
              <li>Repeat until max_tokens or end-of-sequence</li>
            </ol>
          </div>
        </div>

        <PredictExercise
          question="Without the KV cache, generating 100 tokens means recomputing K and V for all previous tokens at every step. What's the total work? With the cache?"
          hint="Without cache: step 1 computes 1 token, step 2 computes 2, ..., step 100 computes 100. That's 1+2+...+100."
          answer="Without cache: 5050 forward passes (O(n²)). With cache: 100 forward passes (O(n)). That's 50x less work."
          explanation="The KV cache turns O(n²) generation into O(n). For 1000 tokens, it's 500x less work. This is why the KV cache is the single most important optimization in LLM serving — without it, generation would be impossibly slow."
        />

        <CodeBlock
          lang="rust"
          code={`pub fn generate(&self, prompt: &[usize], max_tokens: usize,
    temperature: f32,
) -> Vec<usize> {
    let mut cache = init_cache(self.config.n_layers);
    let mut tokens = prompt.to_vec();

    // Process prompt (fills KV cache)
    for (pos, &tok) in prompt.iter().enumerate() {
        let logits = self.forward(tok, pos, &mut cache);
        if pos == prompt.len() - 1 {
            tokens.push(sample(&logits, temperature));
        }
    }

    // Generate new tokens
    for i in 0..max_tokens - 1 {
        let logits = self.forward(*tokens.last().unwrap(),
            prompt.len() + i, &mut cache);
        tokens.push(sample(&logits, temperature));
    }

    tokens[prompt.len()..].to_vec()
}`}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Temperature = 0" accent="blue">
            <p>
              Always pick the highest-scoring token (greedy/argmax).
              Deterministic — same input always gives same output. Good for
              factual answers, bad for creative text.
            </p>
          </InfoCard>
          <InfoCard title="Temperature = 1" accent="rose">
            <p>
              Sample proportionally to the softmax probabilities. Random but
              sensible — the model's uncertainty is reflected in the output.
              Higher temperature = more chaos, lower = more focused.
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Tokenization */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tokenization: Words Are Just Numbers
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The model doesn't see text — it sees integer token IDs. The
              vocabulary (stored in the GGUF metadata) maps between the two.
              LLaMA uses SentencePiece tokenization where the special character{" "}
              <code>&lsquo;&radic;&rsquo;</code> represents a space, so{" "}
              <code>&ldquo;&radic;the&rdquo;</code> decodes to{" "}
              <code>&ldquo; the&rdquo;</code>.
            </p>
            <p>
              Our tokenizer is naive (whitespace splitting + vocab lookup).
              Real tokenizers do subword segmentation (BPE) to handle unknown
              words. But for understanding the pipeline, naive is fine.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* WHAT YOU BUILT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            What You Just Built
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Over 8 chapters, you built — from scratch, in Rust — every component
              of a working language model:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>Tensors</strong> — flat arrays with shape/stride metadata</li>
              <li><strong>Autograd</strong> — computation graphs with automatic differentiation</li>
              <li><strong>Layers & MLPs</strong> — matmul + bias + nonlinearity, stacked</li>
              <li><strong>Attention</strong> — dynamic token-to-token relevance scoring</li>
              <li><strong>GGUF loader</strong> — parsing real model files</li>
              <li><strong>Transformer blocks</strong> — RMSNorm, RoPE, SwiGLU</li>
              <li><strong>Inference engine</strong> — KV cache, generation loop, sampling</li>
            </ol>
            <p>
              This is not a toy. It's the same architecture that powers ChatGPT,
              Claude, LLaMA, and every other modern language model. The only
              difference is scale — they use bigger matrices on faster hardware.
              The <em>concepts</em> are identical.
            </p>
            <p>
              You now understand, at the systems level, what happens when you
              type a prompt into an AI chatbot. Not "it uses transformers." You
              know what a transformer <em>is</em>, how it computes attention,
              why it needs RoPE, what the KV cache does, how the weights are
              stored, and how generation works token by token.
            </p>
            <p>
              That's not something most people who <em>use</em> these models
              every day can say.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* WHAT YOU LEARNED */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            Key Takeaways
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A LLaMA model = <strong>embedding → N transformer blocks → output
              projection</strong>. Each block: norm → attention → residual → norm →
              SwiGLU → residual.
            </li>
            <li>
              The <strong>KV cache</strong> makes generation O(n) per token instead
              of O(n&sup2;). It's the most important optimization in LLM serving.
            </li>
            <li>
              <strong>GQA</strong> shares KV heads across Q heads for 4x cache
              reduction.
            </li>
            <li>
              <strong>Generation</strong> is autoregressive: predict → append →
              repeat. Temperature controls randomness.
            </li>
            <li>
              Every operation in the forward pass is something you built from
              scratch earlier. Nothing is magic.
            </li>
          </ul>
        </div>

        <LearnNav current={8} />
        <ClaudePrompts chapter={8} />
      </div>
    </PageTransition>
  );
}
