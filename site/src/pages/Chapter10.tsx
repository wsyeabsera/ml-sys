import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";
import TryThis from "../components/ui/TryThis";
import TransformerBlockViz from "../components/viz/TransformerBlockViz";
import { useState } from "react";

// ---------------------------------------------------------------------------
// GenerationLoopViz — interactive autoregressive loop demonstration
// ---------------------------------------------------------------------------

const NEXT_TOKENS = ["on", "the", "mat", ".", "It", "was", "warm"];
const MAX_CONTEXT = 10;

function GenerationLoopViz() {
  const [tokens, setTokens] = useState<string[]>(["The", "cat", "sat"]);
  const [nextIdx, setNextIdx] = useState(0);

  function handleGenerate() {
    if (tokens.length >= MAX_CONTEXT) return;
    const tok = NEXT_TOKENS[nextIdx % NEXT_TOKENS.length];
    setTokens((prev) => [...prev, tok]);
    setNextIdx((prev) => prev + 1);
  }

  function handleReset() {
    setTokens(["The", "cat", "sat"]);
    setNextIdx(0);
  }

  const fillPct = (tokens.length / MAX_CONTEXT) * 100;
  const cacheFull = tokens.length >= MAX_CONTEXT;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
          Autoregressive Generation
        </span>
        <button
          onClick={handleReset}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-border-raised)]"
        >
          Reset
        </button>
      </div>

      {/* Token strip */}
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        <AnimatePresence initial={false}>
          {tokens.map((tok, i) => (
            <motion.span
              key={`${tok}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`inline-block px-3 py-1 rounded-full text-sm font-mono border ${
                i < 3
                  ? "bg-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]/30 text-[var(--color-accent-blue)]"
                  : "bg-[var(--color-accent-emerald)]/10 border-[var(--color-accent-emerald)]/30 text-[var(--color-accent-emerald)]"
              }`}
            >
              {tok}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* KV cache bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>KV cache</span>
          <span>
            {tokens.length} / {MAX_CONTEXT} tokens
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              cacheFull
                ? "bg-[var(--color-accent-rose)]"
                : "bg-[var(--color-accent-blue)]"
            }`}
            animate={{ width: `${fillPct}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        {cacheFull && (
          <p className="text-xs text-[var(--color-accent-rose)]">
            Context window full — generation would stop here.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={cacheFull}
          className="px-4 py-2 rounded-lg bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/20 text-sm text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate Next Token
        </button>
        <span className="text-xs text-[var(--color-text-muted)]">
          Blue = prompt &nbsp;·&nbsp; Green = generated
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter10 page
// ---------------------------------------------------------------------------

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

        {/* Parameter counting worked example */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Where Do "7 Billion" Parameters Come From?</h3>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              "7B parameters" isn't magic. You can count them yourself from the
              config. Let's do it for LLaMA-7B:{" "}
              <code>dim=4096</code>, <code>n_heads=32</code>,{" "}
              <code>ffn_dim=11008</code>, <code>vocab=32000</code>,{" "}
              <code>32 layers</code>.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 font-mono text-sm space-y-2">
            <div className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3">
              Parameter count — LLaMA-7B
            </div>
            <div className="space-y-1 text-[var(--color-text-secondary)]">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>
                  <span className="text-[var(--color-accent-blue)]">token_embd</span>
                  {" "}[32000 × 4096]
                </span>
                <span className="text-right">131M params</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>
                  <span className="text-[var(--color-accent-amber)]">attn</span>
                  {" "}4 × [4096 × 4096] (Q, K, V, out)
                </span>
                <span className="text-right">67M per block</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>
                  <span className="text-[var(--color-accent-amber)]">FFN</span>
                  {" "}3 × [4096 × 11008] (gate, up, down)
                </span>
                <span className="text-right">134M per block</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-2 grid grid-cols-[1fr_auto] gap-4">
                <span>
                  per-block total (attn + FFN)
                </span>
                <span className="text-right">≈ 201M per block</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>
                  32 blocks × 201M
                </span>
                <span className="text-right">≈ 6.4B</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>
                  output projection + output_norm
                </span>
                <span className="text-right">≈ 131M</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-2 grid grid-cols-[1fr_auto] gap-4 font-bold text-[var(--color-text-primary)]">
                <span>Total</span>
                <span className="text-right text-[var(--color-accent-emerald)]">≈ 6.8B ≈ "7B"</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-[var(--color-text-secondary)] max-w-3xl">
            <p>
              The dominant cost is FFN: <code>ffn_dim</code> is 2.7× wider than{" "}
              <code>dim</code>, and there are 3 FFN matrices vs 4 attention matrices.
              FFN is roughly 2× the parameter count of attention per block. Most
              of "7B" lives in the FFN layers.
            </p>
          </div>
        </div>

        <PredictExercise
          question="If you double the number of layers from 32 to 64, roughly how many parameters does the model have?"
          hint="The per-block cost stays the same (201M). Only the number of blocks changes. The global tensors (embeddings, output projection) don't scale with layer count."
          answer="6.4B × 2 + 262M ≈ 13.1B — roughly a '13B' model."
          explanation="This is exactly how LLaMA-13B is derived from LLaMA-7B. Doubling layers approximately doubles the parameter count, because the block cost (6.4B) dominates the fixed global cost (262M). The config only changes n_layers from 32 to 40 for 13B (not 64 — they also tune other dimensions). The key insight: parameter count scales linearly with depth."
        />

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

        {/* KV cache memory cost */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">How Much Memory Does the KV Cache Actually Use?</h3>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              This isn't academic. When you run a 7B model locally and wonder why
              it uses 6 GB of RAM for a short conversation — this is why.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 font-mono text-sm space-y-2">
            <div className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3">
              KV cache memory — LLaMA-7B, 4096-token context
            </div>
            <div className="space-y-1.5 text-[var(--color-text-secondary)]">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>kv_dim = n_kv_heads × head_dim = 8 × 128</span>
                <span className="text-right">1024</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>per token, per layer: 2 × kv_dim × 2 bytes (fp16)</span>
                <span className="text-right">4 KB</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span>× 32 layers</span>
                <span className="text-right">128 KB per token</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-2 grid grid-cols-[1fr_auto] gap-4 font-bold text-[var(--color-text-primary)]">
                <span>× 4096 tokens</span>
                <span className="text-right text-[var(--color-accent-rose)]">512 MB — just for KV cache</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-[var(--color-text-secondary)] max-w-3xl">
            <p>
              And the model weights themselves need ~14 GB in fp16. So a fully-loaded
              7B model at 4096 context costs roughly{" "}
              <strong>14.5 GB of VRAM</strong>. That's why consumer GPUs (8–16 GB)
              struggle with 7B models at long contexts. GQA cuts the 512 MB to
              ~128 MB — a real win at scale.
            </p>
          </div>
        </div>

        <PredictExercise
          question="If you double the context window from 4096 to 8192 tokens, how much more KV cache memory do you need? (Assume the same 7B model.)"
          hint="The KV cache size scales linearly with the number of tokens in context. The model weights don't change."
          answer="512 MB × 2 = 1024 MB — an extra 512 MB, for a total of 1 GB just for KV cache."
          explanation="KV cache is strictly linear in context length. This is why long-context models (100K, 1M tokens) are so memory-hungry. At 1M context, the KV cache alone would be ~125 GB for a 7B model — far more than the weights themselves. This is why techniques like sliding-window attention (Mistral), streaming LLM, and grouped-query attention matter so much for long-context inference."
        />

        <TryThis
          commands={["gguf_inspect()"]}
          label="Inspect the GGUF file structure"
        />

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

        <GenerationLoopViz />

        <TryThis
          commands={['llama_generate("Hello, the capital of France is", 5, 0.0)']}
          label="Generate with low max_tokens to trace the loop"
        />

        {/* ============================================================ */}
        {/* SECTION: What Sampling Actually Does */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Sampling Actually Does
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The forward pass returns <strong>logits</strong> — one raw score
              per vocabulary token. Logits have no natural scale; a logit of 3.0
              for token "Paris" and 1.5 for "London" doesn't directly tell you
              probabilities. You have to convert with softmax.
            </p>
            <p>
              Temperature scales the logits <em>before</em> the softmax:
            </p>
            <div className="font-mono text-center py-2">
              <code>p_i = softmax(logits / temperature)[i]</code>
            </div>
            <p>
              Low temperature sharpens the distribution (model gets more
              confident). High temperature flattens it (model gets more random).
              Temperature = 0 is the limit where you just pick the argmax.
            </p>
          </div>

          {/* Concrete logits example */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 space-y-4">
            <div className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest">
              Same logits [3.0, 1.5, 0.5] at different temperatures
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  temp: "temp = 0",
                  desc: "argmax only",
                  bars: [1, 0, 0],
                  labels: ["1.00", "0.00", "0.00"],
                  accent: "var(--color-accent-blue)",
                },
                {
                  temp: "temp = 1.0",
                  desc: "softmax(3.0, 1.5, 0.5)",
                  bars: [0.68, 0.24, 0.08],
                  labels: ["0.68", "0.24", "0.08"],
                  accent: "var(--color-accent-emerald)",
                },
                {
                  temp: "temp = 2.0",
                  desc: "softmax(1.5, 0.75, 0.25)",
                  bars: [0.48, 0.35, 0.17],
                  labels: ["0.48", "0.35", "0.17"],
                  accent: "var(--color-accent-amber)",
                },
              ].map(({ temp, desc, bars, labels, accent }) => (
                <div key={temp} className="space-y-2">
                  <div className="text-xs font-mono text-[var(--color-text-primary)]">{temp}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{desc}</div>
                  <div className="space-y-1">
                    {bars.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-16 h-4 bg-[var(--color-surface)] rounded overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${b * 100}%`,
                              background: accent,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                          {labels[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Token 0 = "Paris", Token 1 = "London", Token 2 = "Berlin"
            </p>
          </div>
        </div>

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

        <PredictExercise
          question="At temperature=0.1, the probabilities get very 'spiky'. What does this mean for repeated generation — if you run the same prompt 10 times?"
          hint="Temperature 0.1 means logits are divided by 0.1 before softmax — they get multiplied by 10, making the differences huge. What happens when one probability is near 1.0?"
          answer="You'll almost always get the same output. The top token gets probability close to 1.0, and the others get crushed near 0."
          explanation="Temperature=0.1 is nearly deterministic. It's useful when you want consistent, focused outputs (like code generation or structured extraction) but still want a tiny bit of variation. Temperature=0.0 is perfectly deterministic. Temperature=1.5–2.0 is for creative text where variety matters more than accuracy. Real applications often use top-p (nucleus) sampling alongside temperature to avoid sampling from the long tail of bizarre tokens."
        />

        {/* ============================================================ */}
        {/* SECTION: Tokenization */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tokenization: Words Are Just Numbers
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The model doesn't see text — it sees integer token IDs. Before
              anything else can happen, your input string has to be converted
              into a list of integers. After generation, those integers get
              converted back to text. The vocabulary (stored in the GGUF
              metadata) is the map between the two.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">BPE: Why "unhappy" Isn't One Token</h3>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              LLaMA uses{" "}
              <strong>Byte Pair Encoding (BPE)</strong>. The algorithm is
              simple: start with individual characters as your vocabulary, then
              repeatedly find the most frequent adjacent pair and merge it into
              a new token. Repeat until you hit your vocabulary size (32,000 for
              LLaMA).
            </p>
            <p>
              The result: common words become single tokens. Common prefixes and
              suffixes become their own tokens. Rare words get split.{" "}
              <code>"unhappy"</code> tokenizes as{" "}
              <code>["un", "happy"]</code> — not character-by-character — because
              both <code>"un"</code> and <code>"happy"</code> appear frequently
              enough in the training corpus to earn their own tokens, but{" "}
              <code>"unhappy"</code> as a unit might not.
            </p>
            <p>
              The special character <code>▁</code> (U+2581) represents a
              leading space, so{" "}
              <code>▁the</code> decodes to <code>" the"</code>. This lets the
              tokenizer encode word boundaries without special whitespace tokens.
            </p>
          </div>

          {/* Worked example */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 space-y-4">
            <div className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest">
              Worked example: "The cat sat"
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-[var(--color-text-secondary)]">Input:</span>
                <code className="text-sm px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                  "The cat sat"
                </code>
                <span className="text-[var(--color-text-muted)] text-sm">→</span>
                {[
                  { token: "▁The", id: "450" },
                  { token: "▁cat", id: "6635" },
                  { token: "▁sat", id: "3290" },
                ].map(({ token, id }) => (
                  <div
                    key={id}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/20 text-sm font-mono text-[var(--color-accent-blue)]">
                      {token}
                    </span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {id}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                The ▁ prefix encodes the leading space. Token IDs are just
                indices into the vocabulary table — the model embeds these
                integers into 4096-dimensional vectors.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Token Count ≠ Word Count</h3>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Context windows are measured in <em>tokens</em>, not words. This
              trips people up constantly. English text averages roughly{" "}
              <strong>1.3 tokens per word</strong> (simple words → 1 token,
              rare/long words → multiple tokens). But the variance is huge:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code>"ChatGPT"</code> → <code>["Chat", "G", "PT"]</code> (3 tokens)
              </li>
              <li>
                <code>"pneumonoultramicroscopicsilicovolcanoconiosis"</code> →
                20+ tokens (extremely rare word, BPE falls back to small subwords)
              </li>
              <li>
                Code is often 1.5–2× denser in tokens than prose (operators,
                identifiers, indentation all cost tokens)
              </li>
              <li>
                Non-English text can be 2–3× denser if the model was trained
                mostly on English
              </li>
            </ul>
          </div>
        </div>

        <PredictExercise
          question="A model has a 4096-token context window. You paste in a Wikipedia article that's about 2000 words long. Will it fit?"
          hint="English prose averages about 1.3 tokens per word. What does 2000 words × 1.3 give you? How close is that to 4096?"
          answer="About 2600 tokens — it probably fits, but you're using 63% of your context window on just the article."
          explanation="2000 words × 1.3 ≈ 2600 tokens, leaving about 1500 tokens for your prompt and the model's response. If you then ask a long follow-up question or want a detailed answer, you might hit the limit. This is why context-window size matters for RAG (retrieval-augmented generation) systems — you need to budget tokens carefully across the retrieved document, your question, and the expected answer."
        />

        <PredictExercise
          question="Why does BPE treat 'un' and 'happy' as separate tokens for 'unhappy'? What would have to be true about the training corpus for 'unhappy' to become a single token?"
          hint="BPE merges the most frequent adjacent pairs first. Think about what 'frequent' means in terms of how often 'unhappy' appears as a unit vs. 'un' and 'happy' separately."
          answer="'unhappy' would need to appear as a complete unit more often than 'un' and 'happy' separately. In practice, 'un-' and 'happy' appear in many different contexts (unkind, unusual; happily, happiness) so they earn tokens first."
          explanation="BPE is a greedy frequency-based algorithm. 'happy' appears in 'happy', 'happily', 'happiness', 'unhappy' — all those appearances count. 'un' appears in 'unkind', 'unlikely', 'unusual', 'unhappy' — again, many contexts. But 'unhappy' only appears as itself. Unless the training corpus is dominated by negative sentiment text, 'happy' and 'un' will merge into tokens long before 'unhappy' earns its own. This also explains why technical jargon and proper nouns often tokenize poorly — they're rare."
        />

        <TryThis
          commands={["llama_inspect()"]}
          label="Inspect the model vocab and architecture"
        />

        <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
          <p>
            Our tokenizer in the project is deliberately naive — whitespace
            splitting + vocabulary lookup. That's fine for understanding the
            pipeline. Real tokenizers run the full BPE merge sequence and handle
            Unicode normalization, but the output is the same: a list of
            integers fed into <code>token_embd.row(token_id)</code>.
          </p>
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
              Parameter count scales linearly with depth. For LLaMA-7B, FFN
              dominates: ~2× the parameter count of attention per block.
            </li>
            <li>
              The <strong>KV cache</strong> makes generation O(n) per token instead
              of O(n&sup2;). It's the most important optimization in LLM serving.
              At 4096 context, the cache costs ~512 MB for a 7B model.
            </li>
            <li>
              <strong>GQA</strong> shares KV heads across Q heads for 4x cache
              reduction.
            </li>
            <li>
              <strong>Generation</strong> is autoregressive: predict → append →
              repeat. Temperature divides logits before softmax — lower = spikier
              distribution = more deterministic.
            </li>
            <li>
              <strong>BPE tokenization</strong> merges frequent character pairs.
              Context windows are in tokens (~1.3 per English word), not words.
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
