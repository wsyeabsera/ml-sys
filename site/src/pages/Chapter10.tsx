import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import TransformerBlockViz from "../components/viz/TransformerBlockViz";

export default function Chapter10() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 10
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Loading a Real Model
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Everything we've built — tensors, autograd, attention, GGUF, RMSNorm,
            SwiGLU, RoPE — comes together. Load a LLaMA model from a GGUF file
            and run inference.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Big Picture */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Putting It All Together
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A LLaMA model is surprisingly regular. It's just the same
              transformer block repeated N times, bookended by an embedding
              table and an output projection. Every operation inside is
              something we've already built:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Token embedding lookup → <code>tensor.row(token)</code></li>
              <li>Normalization → <code>tensor.rms_norm(weight, eps)</code></li>
              <li>Q/K/V projections → <code>weight.matvec(x)</code></li>
              <li>Position encoding → <code>apply_rope_to_heads(...)</code></li>
              <li>Attention with caching → <code>multi_head_attention(...)</code></li>
              <li>SwiGLU FFN → <code>silu</code> + <code>mul</code> + <code>matvec</code></li>
              <li>Residual connections → <code>x.add(&result)</code></li>
            </ul>
            <p>
              The model struct just holds the weight tensors. The forward pass
              is pure function calls on tensors.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Model Structure */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Model Structure</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The model has three parts: a config (hyperparameters from GGUF
              metadata), global tensors (embedding, output projection, final
              norm), and a list of transformer blocks (one per layer).
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub struct LlamaConfig {
    pub dim: usize,         // embedding dimension (e.g., 288)
    pub n_layers: usize,    // number of transformer blocks (e.g., 6)
    pub n_heads: usize,     // number of attention heads (e.g., 6)
    pub n_kv_heads: usize,  // KV heads (may differ for GQA)
    pub vocab_size: usize,  // vocabulary size (e.g., 32000)
    pub ffn_dim: usize,     // feedforward hidden dim (e.g., 768)
    pub head_dim: usize,    // dim / n_heads
    pub rms_eps: f32,       // RMSNorm epsilon (1e-5)
}

pub struct TransformerBlock {
    pub attn_q: Tensor,       // [dim, dim]
    pub attn_k: Tensor,       // [dim, kv_dim]
    pub attn_v: Tensor,       // [dim, kv_dim]
    pub attn_output: Tensor,  // [dim, dim]
    pub attn_norm: Tensor,    // [dim]
    pub ffn_gate: Tensor,     // [dim, ffn_dim]
    pub ffn_down: Tensor,     // [ffn_dim, dim]
    pub ffn_up: Tensor,       // [dim, ffn_dim]
    pub ffn_norm: Tensor,     // [dim]
}

pub struct LlamaModel {
    pub config: LlamaConfig,
    pub token_embd: Tensor,   // [vocab_size, dim]
    pub output: Tensor,       // [vocab_size, dim]
    pub output_norm: Tensor,  // [dim]
    pub blocks: Vec<TransformerBlock>,
}`}
        />

        <InfoCard title="9 Tensors Per Block" accent="blue">
          <div className="space-y-2">
            <p>
              Each transformer block has 9 weight tensors: 4 for attention
              (Q, K, V, output), 1 attention norm, 3 for FFN (gate, up, down),
              and 1 FFN norm. A 6-layer model has 54 block tensors plus 3
              global ones = 57 tensors total. A 32-layer model (like LLaMA-7B)
              has 291 tensors.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Loading from GGUF */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Loading from GGUF</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The <code>from_gguf</code> method reads the GGUF metadata to
              build the config, then loads every weight tensor by name. GGUF
              uses a naming convention:{" "}
              <code>blk.{"{i}"}.attn_q.weight</code>,{" "}
              <code>blk.{"{i}"}.ffn_gate.weight</code>, etc. We just iterate
              over layers and load each one.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`impl LlamaModel {
    pub fn from_gguf<R: Read + Seek>(gguf: &mut GgufFile<R>) -> io::Result<Self> {
        // Read hyperparameters from metadata
        let dim = gguf.metadata.get("llama.embedding_length")
            .and_then(|v| v.as_u32()).unwrap() as usize;
        let n_layers = gguf.metadata.get("llama.block_count")
            .and_then(|v| v.as_u32()).unwrap() as usize;
        // ... more config fields ...

        // Load global tensors
        let token_embd = gguf.load_tensor("token_embd.weight")?;
        let output_norm = gguf.load_tensor("output_norm.weight")?;
        let output = gguf.load_tensor("output.weight")?;

        // Load per-block tensors
        let mut blocks = Vec::with_capacity(n_layers);
        for i in 0..n_layers {
            let block = TransformerBlock {
                attn_q: gguf.load_tensor(&format!("blk.{}.attn_q.weight", i))?,
                attn_k: gguf.load_tensor(&format!("blk.{}.attn_k.weight", i))?,
                // ... remaining 7 tensors ...
            };
            blocks.push(block);
        }
        Ok(LlamaModel { config, token_embd, output, output_norm, blocks })
    }
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: The Forward Pass */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">The Forward Pass</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The forward pass processes <strong>one token at a time</strong>.
              Given a token ID and position, it returns logits (unnormalized
              scores) over the entire vocabulary. The highest-scoring token is
              the model's prediction for the next token.
            </p>
            <p>
              Click through the diagram below to see how data flows through a
              single transformer block. In a 6-layer model, the block section
              repeats 6 times before the final norm and output projection.
            </p>
          </div>
        </div>

        <TransformerBlockViz />

        <CodeBlock
          lang="rust"
          code={`pub fn forward(
    &self,
    token: usize,
    pos: usize,
    key_cache: &mut Vec<Vec<Tensor>>,
    value_cache: &mut Vec<Vec<Tensor>>,
) -> Tensor {
    let mut x = self.token_embd.row(token);

    for (layer, block) in self.blocks.iter().enumerate() {
        let x_norm = x.rms_norm(&block.attn_norm, cfg.rms_eps);

        // Q, K, V + RoPE
        let q = apply_rope(block.attn_q.matvec(&x_norm), pos);
        let k = apply_rope(block.attn_k.matvec(&x_norm), pos);
        let v = block.attn_v.matvec(&x_norm);

        // Cache K, V for future tokens
        key_cache[layer].push(k);
        value_cache[layer].push(v);

        // Multi-head attention over all cached positions
        let attn = multi_head_attention(&q, &key_cache[layer],
            &value_cache[layer], n_heads, n_kv_heads, head_dim);
        x = x.add(&block.attn_output.matvec(&attn));  // residual

        // SwiGLU FFN
        let x_norm2 = x.rms_norm(&block.ffn_norm, cfg.rms_eps);
        let gate = block.ffn_gate.matvec(&x_norm2).silu();
        let up   = block.ffn_up.matvec(&x_norm2);
        let ffn  = block.ffn_down.matvec(&gate.mul(&up));
        x = x.add(&ffn);  // residual
    }

    // Final norm → output projection → logits
    let x_norm = x.rms_norm(&self.output_norm, cfg.rms_eps);
    self.output.matvec(&x_norm)
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: KV Cache */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">The KV Cache</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              When generating text, you predict one token, append it, then
              predict the next. Without caching, you'd recompute K and V for{" "}
              <em>all previous tokens</em> at every step — O(n&sup2;) work.
            </p>
            <p>
              The <strong>KV cache</strong> stores the K and V vectors for each
              layer at each position. When processing token <code>t</code>,
              you only compute the new Q, K, V for position <code>t</code>,
              then attend over the full cache. This makes generation O(n) per
              token instead of O(n&sup2;).
            </p>
            <p>
              In our implementation, the cache is a
              simple <code>Vec&lt;Vec&lt;Tensor&gt;&gt;</code> — a vector of
              vectors indexed by [layer][position]. Production implementations
              pre-allocate contiguous memory for the maximum sequence length.
            </p>
          </div>
        </div>

        <InfoCard title="Group Query Attention (GQA)" accent="amber">
          <div className="space-y-2">
            <p>
              In standard multi-head attention, each head has its own Q, K, and
              V. In <strong>Group Query Attention</strong>, multiple Q heads
              share the same K and V head. If you have 32 Q heads but only 8 KV
              heads, each KV head serves 4 Q heads.
            </p>
            <p>
              This reduces the KV cache size by 4x — a huge win for long
              sequences. Our implementation handles this with{" "}
              <code>kv_head = h / kv_group_size</code>, so multiple Q heads
              index into the same KV slot.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Token Generation */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Token-by-Token Generation
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Text generation is autoregressive: the model predicts one token,
              we append it to the sequence, and repeat. The <code>generate</code>{" "}
              method handles the full loop:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                Process all prompt tokens (filling the KV cache)
              </li>
              <li>
                Sample the next token from the final logits
              </li>
              <li>
                Feed that token back in at the next position
              </li>
              <li>
                Repeat until <code>max_tokens</code>
              </li>
            </ol>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub fn generate(
    &self,
    prompt_tokens: &[usize],
    max_tokens: usize,
    temperature: f32,
) -> Vec<usize> {
    let mut key_cache = /* ... */;
    let mut value_cache = /* ... */;
    let mut tokens = prompt_tokens.to_vec();

    // Process prompt (fill KV cache)
    for (pos, &token) in prompt_tokens.iter().enumerate() {
        let logits = self.forward(token, pos, &mut key_cache, &mut value_cache);
        if pos == prompt_tokens.len() - 1 {
            tokens.push(sample_token(&logits, temperature));
        }
    }

    // Generate new tokens
    for i in 0..max_tokens.saturating_sub(1) {
        let pos = prompt_tokens.len() + i;
        let logits = self.forward(*tokens.last().unwrap(), pos,
            &mut key_cache, &mut value_cache);
        tokens.push(sample_token(&logits, temperature));
    }

    tokens[prompt_tokens.len()..].to_vec()
}`}
        />

        <InfoCard title="Temperature Sampling" accent="emerald">
          <div className="space-y-2">
            <p>
              The <code>temperature</code> parameter controls randomness.
              At <strong>temperature = 0</strong>, we always pick the
              highest-scoring token (greedy/argmax). At <strong>temperature
              = 1</strong>, we sample proportional to the softmax
              probabilities. Higher temperature = more random, lower = more
              deterministic.
            </p>
            <p>
              The formula is <code>softmax(logits / temperature)</code>.
              Dividing by a large temperature flattens the distribution;
              dividing by a small temperature sharpens it. It's the same
              "temperature" concept from Chapter 7's softmax discussion — just
              now we're using it for generation.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Tokenization */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tokenization
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The model works with integer token IDs, not text. The vocabulary
              is stored in the GGUF metadata under{" "}
              <code>tokenizer.ggml.tokens</code> — an array of strings indexed
              by token ID. Our code extracts this to convert between text and
              IDs.
            </p>
            <p>
              LLaMA uses <strong>SentencePiece</strong> tokenization, where the
              special character <code>&lsquo;▁&rsquo;</code> (U+2581) represents a
              space. So the token <code>&ldquo;▁the&rdquo;</code> decodes to{" "}
              <code>&ldquo; the&rdquo;</code>. Our decoder handles this
              replacement.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`/// Extract vocabulary from GGUF metadata.
pub fn extract_vocab<R: Read + Seek>(gguf: &GgufFile<R>) -> Vec<String> {
    match gguf.metadata.get("tokenizer.ggml.tokens") {
        Some(MetadataValue::Array(tokens)) => tokens.iter()
            .map(|v| match v {
                MetadataValue::String(s) => s.clone(),
                _ => "?".to_string(),
            })
            .collect(),
        _ => Vec::new(),
    }
}

/// Decode token IDs to text.
pub fn decode_tokens(vocab: &[String], tokens: &[usize]) -> String {
    tokens.iter()
        .filter_map(|&id| vocab.get(id))
        .map(|t| t.replace('▁', " "))
        .collect()
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
              A LLaMA model is <strong>embedding → N transformer blocks →
              output projection</strong>. Each block: RMSNorm → attention →
              residual → RMSNorm → SwiGLU FFN → residual.
            </li>
            <li>
              <strong>from_gguf</strong> reads metadata for the config and loads
              each tensor by its GGUF name. A naming convention (
              <code>blk.N.attn_q.weight</code>) makes this mechanical.
            </li>
            <li>
              The <strong>KV cache</strong> makes generation O(n) per token
              instead of O(n&sup2;). Store K and V from all past positions,
              only compute the new ones.
            </li>
            <li>
              <strong>Group Query Attention</strong> shares KV heads across
              multiple Q heads — reduces cache memory with minimal quality loss.
            </li>
            <li>
              <strong>Generation</strong> is autoregressive: predict one token,
              feed it back, repeat. Temperature controls the randomness of
              sampling.
            </li>
            <li>
              Every operation in the forward pass — matvec, rms_norm, silu,
              rope, softmax, add — is something we built from scratch in
              earlier chapters.
            </li>
          </ul>
        </div>

        <ChapterNav current={10} />
      </div>
    </PageTransition>
  );
}
