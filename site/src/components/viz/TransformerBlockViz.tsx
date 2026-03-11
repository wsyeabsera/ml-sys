import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Interactive diagram of a LLaMA transformer block.
 * Click on components to see details about each operation.
 */

interface BlockComponent {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  bgClass: string;
  borderClass: string;
  description: string;
  code: string;
}

const COMPONENTS: BlockComponent[] = [
  {
    id: "embd",
    label: "Token Embedding",
    sublabel: "token_embd.weight",
    color: "var(--color-accent-blue)",
    bgClass: "bg-[var(--color-accent-blue)]/15",
    borderClass: "border-[var(--color-accent-blue)]/40",
    description:
      "Look up the embedding vector for the input token. The embedding table is [vocab_size, dim] — one row per token in the vocabulary.",
    code: "let x = self.token_embd.row(token);",
  },
  {
    id: "attn_norm",
    label: "RMSNorm",
    sublabel: "attn_norm.weight",
    color: "#a855f7",
    bgClass: "bg-purple-500/15",
    borderClass: "border-purple-500/40",
    description:
      "Normalize the input before attention. RMSNorm divides by root-mean-square and scales by a learned weight vector. Simpler than LayerNorm (no mean subtraction).",
    code: "let x_norm = x.rms_norm(&block.attn_norm, eps);",
  },
  {
    id: "qkv",
    label: "Q, K, V Projections",
    sublabel: "attn_q/k/v.weight",
    color: "#f59e0b",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/40",
    description:
      "Project the normalized input into query, key, and value vectors using learned weight matrices. Each is a matrix-vector multiply: [dim, dim] @ [dim] → [dim].",
    code: `let q = block.attn_q.matvec(&x_norm);
let k = block.attn_k.matvec(&x_norm);
let v = block.attn_v.matvec(&x_norm);`,
  },
  {
    id: "rope",
    label: "RoPE",
    sublabel: "position encoding",
    color: "#ec4899",
    bgClass: "bg-pink-500/15",
    borderClass: "border-pink-500/40",
    description:
      "Apply Rotary Position Embedding to Q and K. Rotates pairs of values by position-dependent angles, so the dot product Q·K naturally encodes relative position.",
    code: `let q = apply_rope_to_heads(&q, pos, n_heads, head_dim);
let k = apply_rope_to_heads(&k, pos, n_kv_heads, head_dim);`,
  },
  {
    id: "attention",
    label: "Multi-Head Attention",
    sublabel: "with KV cache",
    color: "var(--color-accent-blue)",
    bgClass: "bg-[var(--color-accent-blue)]/15",
    borderClass: "border-[var(--color-accent-blue)]/40",
    description:
      "Each head computes scaled dot-product attention over all cached positions. With Group Query Attention, multiple Q heads share the same K/V head, saving memory.",
    code: `// Per head: softmax(q · k_cache / √d) @ v_cache
let attn_out = multi_head_attention(
    &q, &key_cache[layer], &value_cache[layer],
    n_heads, n_kv_heads, head_dim,
);`,
  },
  {
    id: "attn_proj",
    label: "Output Projection + Residual",
    sublabel: "attn_output.weight",
    color: "#10b981",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/40",
    description:
      "Project the attention output back to the model dimension, then add the residual connection. The residual lets gradients flow straight through — critical for training deep networks.",
    code: `let attn_proj = block.attn_output.matvec(&attn_out);
x = x.add(&attn_proj);  // residual`,
  },
  {
    id: "ffn_norm",
    label: "RMSNorm",
    sublabel: "ffn_norm.weight",
    color: "#a855f7",
    bgClass: "bg-purple-500/15",
    borderClass: "border-purple-500/40",
    description: "Normalize again before the feedforward network. Same operation as the attention norm — separate learned weights.",
    code: "let x_norm2 = x.rms_norm(&block.ffn_norm, eps);",
  },
  {
    id: "swiglu",
    label: "SwiGLU FFN",
    sublabel: "ffn_gate/up/down.weight",
    color: "#f59e0b",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/40",
    description:
      'SwiGLU replaces the standard ReLU FFN. It uses a "gate" path with SiLU activation multiplied by an "up" projection, then projects back down. Three weight matrices instead of two, but better performance empirically.',
    code: `let gate = block.ffn_gate.matvec(&x_norm2).silu();
let up   = block.ffn_up.matvec(&x_norm2);
let ffn  = block.ffn_down.matvec(&gate.mul(&up));`,
  },
  {
    id: "ffn_residual",
    label: "Residual",
    sublabel: "x = x + ffn_out",
    color: "#10b981",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/40",
    description:
      "Add the FFN output to the input. This is the second residual connection in the block. After all blocks, a final RMSNorm + output projection gives logits over the vocabulary.",
    code: "x = x.add(&ffn_out);",
  },
];

export default function TransformerBlockViz() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedComp = COMPONENTS.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        LLaMA Transformer Block
      </h4>
      <p className="text-xs text-[var(--color-text-muted)]">
        Click any component to see its implementation.
      </p>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Block diagram */}
        <div className="space-y-1.5 flex-shrink-0">
          {COMPONENTS.map((comp, i) => (
            <div key={comp.id}>
              <motion.button
                onClick={() => setSelected(selected === comp.id ? null : comp.id)}
                className={`w-full px-4 py-2.5 rounded-lg border text-left transition-all ${
                  selected === comp.id
                    ? `${comp.bgClass} ${comp.borderClass}`
                    : "bg-[var(--color-surface-raised)] border-[var(--color-surface-overlay)] hover:border-[var(--color-text-muted)]/30"
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      selected === comp.id ? "" : "text-[var(--color-text-primary)]"
                    }`} style={selected === comp.id ? { color: comp.color } : undefined}>
                      {comp.label}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono">
                      {comp.sublabel}
                    </p>
                  </div>
                  <span className="text-[var(--color-text-muted)] text-xs">
                    {selected === comp.id ? "−" : "+"}
                  </span>
                </div>
              </motion.button>
              {/* Arrow between components */}
              {i < COMPONENTS.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <span className="text-[var(--color-text-muted)]/40 text-xs">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selectedComp && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex-1 ${selectedComp.bgClass} border ${selectedComp.borderClass} rounded-xl p-5 space-y-3 self-start`}
          >
            <h5 className="text-sm font-semibold" style={{ color: selectedComp.color }}>
              {selectedComp.label}
            </h5>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {selectedComp.description}
            </p>
            <pre className="text-xs font-mono bg-[var(--color-surface-base)]/50 rounded-lg p-3 overflow-x-auto text-[var(--color-text-primary)]">
              {selectedComp.code}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
