import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import GgufLayoutViz from "../components/viz/GgufLayoutViz";

export default function Chapter8() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 06
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Model Files — What's Actually Inside a .gguf?
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            You've built tensors, autograd, layers, and attention. But where do
            the actual weights come from? They live in files. Let's crack one
            open.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="Every AI model is just a zip file with delusions" accent="emerald">
          <div className="space-y-2">
            <p>
              When someone says "I downloaded a 7B model," what they actually got
              is a file — maybe 4GB — that contains literally nothing except:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>A header saying "hi, I'm a LLaMA model with 32 layers"</li>
              <li>A list of tensor names and shapes ("attention weights for layer 0 are [4096, 4096]")</li>
              <li>Billions of floating-point numbers</li>
            </ol>
            <p>
              That's it. No code. No logic. No intelligence. Just a self-describing
              archive of numbers that some other program knows how to interpret.
              The "intelligence" is entirely in how you multiply these numbers
              together — which is what we've been building for the last five
              chapters.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: What is GGUF */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            GGUF: The Format Everyone Actually Uses
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              GGUF (<strong>GGML Universal File</strong>) is the format used by
              llama.cpp and most open-source LLM tools. One file contains
              everything needed for inference: metadata about the model,
              tensor headers listing every weight, and the raw weight data.
            </p>
            <p>
              It replaced the older GGML format, which had no versioned metadata
              and was a pain to extend. GGUF was designed so a loader can read
              just the header to know what model it's looking at — without
              touching the potentially gigabytes of weight data. Smart.
            </p>
            <p>
              Think of it like a self-describing archive: the model introduces
              itself. "Hi, I'm TinyLlama. I have 22 transformer layers, a
              context length of 2048, and here's where each of my 291 tensors
              starts in this file."
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Anatomy */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Anatomy of a GGUF File
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Three regions, laid out sequentially. The header is tiny, the
              tensor info is small, and the data blob is where all the size
              lives. Between the headers and data there's alignment padding
              (32 bytes by default) so the data starts at a clean boundary.
            </p>
          </div>
        </div>

        <GgufLayoutViz />

        <InfoCard title="Why 32-byte alignment?" accent="blue">
          <div className="space-y-2">
            <p>
              When you memory-map a file, the OS maps pages directly into your
              address space. If tensor data starts at an aligned offset, SIMD
              instructions (which often require 16 or 32-byte alignment) can
              read directly from mapped memory without copying.
            </p>
            <p>
              For a 7B model, that's the difference between loading in seconds
              (mmap, zero copies) vs. minutes (read + copy + align). The 32-byte
              padding costs you maybe 31 bytes. The speedup is enormous.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Metadata */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Metadata: The Model's Self-Introduction
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              GGUF metadata is key-value pairs with dot-separated keys. The
              important ones:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code>general.architecture</code> — "llama", "gpt2",
                "falcon"... tells you what architecture to use
              </li>
              <li>
                <code>general.name</code> — human-readable name like
                "TinyLlama-1.1B-Chat"
              </li>
              <li>
                <code>llama.block_count</code> — number of transformer layers
              </li>
              <li>
                <code>llama.embedding_length</code> — hidden dimension (e.g.,
                2048)
              </li>
              <li>
                <code>llama.context_length</code> — max sequence length
              </li>
            </ul>
            <p>
              This is how your loader knows what it's dealing with. Read the
              metadata, set up the right architecture, then read the weights.
              No external config files, no guessing.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Tensor Names */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tensor Names: A Map of the Model's Brain
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Every tensor has a name that tells you exactly what it does. The
              naming convention is consistent across models:
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-3">
{`token_embd.weight          → token embedding table
blk.0.attn_q.weight        → layer 0, attention Q projection
blk.0.attn_k.weight        → layer 0, attention K projection
blk.0.attn_v.weight        → layer 0, attention V projection
blk.0.attn_output.weight   → layer 0, attention output projection
blk.0.attn_norm.weight     → layer 0, pre-attention RMSNorm
blk.0.ffn_gate.weight      → layer 0, feedforward gate
blk.0.ffn_down.weight      → layer 0, feedforward down projection
blk.0.ffn_up.weight        → layer 0, feedforward up projection
blk.0.ffn_norm.weight      → layer 0, pre-FFN RMSNorm
...                         → repeat for blk.1, blk.2, ...
output.weight              → final output projection
output_norm.weight         → final RMSNorm`}
            </pre>
            <p>
              See the pattern? Every transformer layer has the same set of
              weights (attention Q/K/V/output, FFN gate/down/up, two norms),
              just with a different block number. A 32-layer model has
              <code>blk.0</code> through <code>blk.31</code>, each with the
              same structure.
            </p>
            <p>
              This is why you could build a transformer with a for loop — the
              architecture is the same at every layer, just with different
              weight values. The names map directly to the operations from
              the previous chapters.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Data Types */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Data Types: Why Your 7B Model Fits in 4GB
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A 7B model has 7 billion parameters. At full precision (F32, 4
              bytes each), that's 28GB. Nobody wants to download that. So
              models are <strong>quantized</strong> — stored in smaller formats:
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--color-surface-overlay)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-raised)]">
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">Format</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">Bits/value</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">7B model size</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { fmt: "F32", bits: "32", size: "~28 GB", note: "Full precision, huge" },
                { fmt: "F16", bits: "16", size: "~14 GB", note: "Half precision, good for inference" },
                { fmt: "Q8_0", bits: "~8", size: "~7 GB", note: "Block quantized, barely any quality loss" },
                { fmt: "Q4_0", bits: "~4.5", size: "~4 GB", note: "Aggressive quantization, some quality loss" },
              ].map((row) => (
                <tr key={row.fmt} className="border-t border-[var(--color-surface-overlay)]">
                  <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-blue)]">{row.fmt}</td>
                  <td className="px-4 py-2 text-xs">{row.bits}</td>
                  <td className="px-4 py-2 text-xs font-mono">{row.size}</td>
                  <td className="px-4 py-2 text-xs text-[var(--color-text-muted)]">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
          <p>
            Our loader handles <strong>F32 and F16</strong> (with automatic
            F16→F32 conversion). Quantized formats (Q4_0, Q8_0) pack values
            into blocks with shared scale factors — that's a deeper topic for
            later. The key insight: quantization is a trade of precision for
            size, and for inference the quality loss is often negligible.
          </p>
        </div>

        <InfoCard title="Column-major gotcha" accent="amber">
          <div className="space-y-2">
            <p>
              GGUF stores shapes in <strong>column-major</strong> order (the
              GGML convention), but we use row-major. So a tensor stored as
              shape <code>[4096, 2048]</code> in GGUF becomes{" "}
              <code>[2048, 4096]</code> in our system — we reverse the shape on
              load.
            </p>
            <p>
              Same data, different shape interpretation. Sound familiar? It's
              the same concept from the tensors chapter — shape is metadata,
              data doesn't move. Except here, two different ecosystems disagree
              on the metadata convention, and if you forget to reverse, every
              matmul gives garbage.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Loading Code */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Loading Process
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Loading a tensor from GGUF follows a simple recipe:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Parse the header — read magic bytes, version, counts</li>
              <li>Read metadata — key-value pairs describing the model</li>
              <li>Read tensor info — name, shape, dtype, byte offset for each tensor</li>
              <li>Seek to the right offset in the data blob</li>
              <li>Read raw bytes, convert to f32</li>
              <li>Reverse the shape (column-major → row-major)</li>
            </ol>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub fn load_tensor(&mut self, name: &str) -> io::Result<Tensor> {
    let info = self.tensor_infos.iter()
        .find(|t| t.name == name)
        .ok_or_else(|| io::Error::new(
            io::ErrorKind::NotFound,
            format!("Tensor '{}' not found", name),
        ))?.clone();

    // Seek to this tensor's data in the file
    self.reader.seek(SeekFrom::Start(self.data_offset + info.offset))?;

    // Read and convert based on dtype
    let data = match info.dtype {
        GgmlDtype::F32 => { /* read 4 bytes per element */ }
        GgmlDtype::F16 => { /* read 2 bytes, convert to f32 */ }
        _ => return Err(/* unsupported dtype */),
    };

    // Reverse shape: GGUF column-major → our row-major
    let shape: Vec<usize> = info.shape.iter().rev().copied().collect();
    Ok(Tensor::new(data, shape))
}`}
        />

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Mini Project: Explore a Real Model File
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              If you have a GGUF model file (even a tiny one like TinyLlama or
              SmolLM), you can crack it open and explore what's inside. If you
              don't have one, you can still read through the steps to understand
              the structure.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                Use <code>gguf_inspect</code> with your model file path. Read
                the metadata — what architecture is it? How many layers? What's
                the embedding dimension?
              </li>
              <li>
                Look at the tensor list. How many tensors are there? Can you
                spot the pattern — <code>blk.N.attn_q.weight</code> repeating
                for each layer?
              </li>
              <li>
                If your model has F32 or F16 tensors, try loading one with{" "}
                <code>gguf_load_tensor</code>. Then inspect it — check its
                shape and look at some values. These are the actual learned
                weights!
              </li>
              <li>
                Find the <code>token_embd.weight</code> tensor. Its shape tells
                you [vocab_size, embedding_dim]. How many tokens does the model
                know? How big is each token's embedding vector?
              </li>
            </ol>
            <p className="text-xs text-[var(--color-text-muted)] italic">
              Note: gguf_inspect and gguf_load_tensor need a path to a .gguf
              file on disk. If you don't have one, the next chapter will use
              <code>llama_load</code> which handles the full loading pipeline.
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
              A model file is just <strong>metadata + tensor headers + raw
              weight data</strong>. No code, no logic. Just numbers with
              labels.
            </li>
            <li>
              <strong>GGUF</strong> is self-describing: the model tells you its
              own name, architecture, layer count, and where each weight lives.
            </li>
            <li>
              <strong>Tensor names</strong> follow a pattern:{" "}
              <code>blk.N.attn_q.weight</code>, <code>blk.N.ffn_gate.weight</code>,
              etc. Every layer has the same structure.
            </li>
            <li>
              <strong>Quantization</strong> (Q4, Q8) compresses 28GB to 4GB by
              storing values in fewer bits. For inference, the quality loss is
              usually negligible.
            </li>
            <li>
              <strong>Column-major vs row-major</strong> strikes again — GGUF
              uses one convention, we use the other. Reverse the shape on load
              or everything breaks.
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
            You know what's in a model file — tensors with names like{" "}
            <code>blk.0.attn_q.weight</code>. But how do those weights combine
            into a working transformer? Next up: putting all the pieces together
            — RMSNorm, SiLU, RoPE, and the full transformer block.
          </p>
        </div>

        <LearnNav current={6} />
        <ClaudePrompts chapter={6} />
      </div>
    </PageTransition>
  );
}
