import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import GgufLayoutViz from "../components/viz/GgufLayoutViz";

export default function Chapter8() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 08
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            GGUF — Reading Real Model Files
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            We've built layers and attention from scratch. But real models live
            in files — here's how to crack them open and read the weights.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: What is GGUF? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">What is GGUF?</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              GGUF (<strong>GGML Universal File</strong>) is the format used by
              llama.cpp and most open-source LLM tooling. One file contains
              everything needed for inference: metadata describing the model
              architecture, tensor headers listing every weight's name/shape/dtype,
              and the raw weight data itself.
            </p>
            <p>
              It replaced the older GGML format, which lacked versioned metadata
              and was harder to extend. GGUF was designed so that a loader can
              read just the header to know what model it's looking at — without
              touching the (potentially gigabytes of) tensor data.
            </p>
            <p>
              Think of it like a self-describing archive: the model tells you
              its own name, architecture, context length, vocabulary size, and
              exactly where each weight lives in the file.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Anatomy of a GGUF File */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Anatomy of a GGUF File</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A GGUF file has three regions laid out sequentially. The header
              and tensor info are small; the data blob is where the size lives.
              Between the headers and data there's alignment padding (32 bytes
              by default) so the data blob starts at a clean boundary — this
              matters for memory-mapped I/O.
            </p>
          </div>
        </div>

        <GgufLayoutViz />

        <InfoCard title="Why Alignment Matters" accent="blue">
          <div className="space-y-2">
            <p>
              The 32-byte alignment isn't arbitrary. When you memory-map a file,
              the OS maps pages directly into your address space. If tensor data
              starts at an aligned offset, SIMD instructions (which often
              require 16- or 32-byte alignment) can read directly from the
              mapped memory without copying. For a 7B model, that's the
              difference between loading in seconds vs. minutes.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Metadata */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Metadata: What the Model Tells You
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              GGUF metadata is a list of key-value pairs. Keys are dot-separated
              strings following a convention. The most important ones:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code>general.architecture</code> — what kind of model this is
                (e.g., "llama", "gpt2", "falcon")
              </li>
              <li>
                <code>general.name</code> — human-readable model name
              </li>
              <li>
                <code>llama.context_length</code> — maximum sequence length
              </li>
              <li>
                <code>llama.embedding_length</code> — hidden dimension size
              </li>
              <li>
                <code>llama.block_count</code> — number of transformer layers
              </li>
              <li>
                <code>general.alignment</code> — data alignment (default 32)
              </li>
            </ul>
            <p>
              This is how you know what kind of model you're loading without
              any external documentation. The loader reads these first, then
              decides how to interpret the weights.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`// Reading metadata after parsing
let arch = file.metadata.get("general.architecture")
    .and_then(|v| v.as_str())
    .unwrap_or("unknown");

let name = file.metadata.get("general.name")
    .and_then(|v| v.as_str())
    .unwrap_or("unnamed");

println!("Model: {} ({})", name, arch);`}
        />

        {/* ============================================================ */}
        {/* SECTION: Tensor Storage and Data Types */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tensor Storage and Data Types
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Each tensor in a GGUF file has a data type that determines how its
              values are stored. The main types:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>F32</strong> — 4 bytes per value, full precision
              </li>
              <li>
                <strong>F16</strong> — 2 bytes per value, half precision
                (sufficient for inference)
              </li>
              <li>
                <strong>Q4_0, Q4_1, Q5_0, Q5_1, Q8_0</strong> — quantized
                formats that pack multiple values into blocks. A Q4_0 block
                stores 32 values in 18 bytes (vs. 128 bytes for F32).
              </li>
            </ul>
            <p>
              Our loader handles <strong>F32 and F16</strong> (with automatic
              F16-to-F32 conversion). Quantized formats are a Phase 4 topic —
              they trade precision for size, which matters when you're trying
              to fit a 7B model in 4GB of RAM.
            </p>
          </div>
        </div>

        <InfoCard title="Column-Major to Row-Major" accent="amber">
          <div className="space-y-2">
            <p>
              GGUF stores tensor shapes in <strong>column-major</strong> order
              (the GGML convention), but our tensor library uses row-major. So
              a tensor stored as shape <code>[3, 2]</code> in GGUF becomes{" "}
              <code>[2, 3]</code> in our system — we reverse the shape on load.
            </p>
            <p>
              This is a subtle detail that causes real bugs if you get it wrong.
              The data bytes are the same — it's the interpretation of the shape
              that changes.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Loading a Tensor */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Loading a Tensor</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Loading a tensor from GGUF is a multi-step process:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <strong>Parse headers</strong> — read magic, version, metadata,
                and tensor info structs
              </li>
              <li>
                <strong>Find the tensor by name</strong> — look up its shape,
                dtype, and byte offset
              </li>
              <li>
                <strong>Seek to data</strong> — jump to{" "}
                <code>data_offset + tensor.offset</code>
              </li>
              <li>
                <strong>Read raw bytes</strong> — read{" "}
                <code>num_elements * bytes_per_element</code>
              </li>
              <li>
                <strong>Convert to f32</strong> — decode from F32 or F16
              </li>
              <li>
                <strong>Reverse the shape</strong> — column-major to row-major
              </li>
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

    // Seek to this tensor's data
    let abs_offset = self.data_offset + info.offset;
    self.reader.seek(SeekFrom::Start(abs_offset))?;

    let num_elements = info.num_elements();

    let data = match info.dtype {
        GgmlDtype::F32 => {
            let mut buf = vec![0u8; num_elements * 4];
            self.reader.read_exact(&mut buf)?;
            buf.chunks_exact(4)
                .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
                .collect()
        }
        GgmlDtype::F16 => {
            let mut buf = vec![0u8; num_elements * 2];
            self.reader.read_exact(&mut buf)?;
            buf.chunks_exact(2)
                .map(|c| f16_to_f32(u16::from_le_bytes([c[0], c[1]])))
                .collect()
        }
        other => return Err(/* unsupported dtype */),
    };

    // Reverse shape: GGUF column-major → our row-major
    let shape: Vec<usize> = info.shape.iter().rev().copied().collect();
    Ok(Tensor::new(data, shape))
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: Try It via MCP */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Try It: GGUF via MCP</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Two MCP tools let you work with GGUF files interactively:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code>gguf_inspect</code> — shows version, metadata,
                architecture, and a full tensor catalog
              </li>
              <li>
                <code>gguf_load_tensor</code> — loads a specific tensor by
                name into the tensor store, where you can inspect it with
                the regular tensor tools
              </li>
            </ul>
          </div>
        </div>

        <CodeBlock
          lang="json"
          code={`// Inspect a GGUF file
{
  "tool": "gguf_inspect",
  "path": "model-files/tiny-llama.gguf"
}

// Returns:
// GGUF v3: 'TinyLlama-1.1B' (llama)
//   291 tensors, 23 metadata keys
//   token_embd.weight: shape=[2048, 32000], dtype=Q4_0
//   blk.0.attn_q.weight: shape=[2048, 2048], dtype=Q4_0
//   ...`}
        />

        <CodeBlock
          lang="json"
          code={`// Load a specific tensor into the store
{
  "tool": "gguf_load_tensor",
  "path": "model-files/tiny-llama.gguf",
  "tensor_name": "token_embd.weight",
  "store_as": "embeddings"
}

// Now you can use tensor_inspect, tensor_get, etc.
// on the "embeddings" tensor`}
        />

        <InfoCard title="What About Quantized Tensors?" accent="emerald">
          <div className="space-y-2">
            <p>
              Our loader currently only handles F32 and F16. If you try to load
              a Q4_0 tensor, you'll get an "unsupported dtype" error. That's
              intentional — quantization is a deep topic involving block
              packing, scale factors, and precision trade-offs. It's on the
              Phase 4 roadmap.
            </p>
            <p>
              For now, you can still <em>inspect</em> quantized tensors to see
              their names, shapes, and types — you just can't load their data
              into our tensor store yet.
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
              <strong>GGUF</strong> is a self-describing binary format — one
              file holds metadata, tensor headers, and weight data.
            </li>
            <li>
              The file is designed for <strong>efficient loading</strong>:
              metadata is tiny, data is aligned for mmap, and you can inspect
              without reading weights.
            </li>
            <li>
              <strong>Shapes are column-major</strong> in GGUF (the GGML
              convention). We reverse them to row-major on load.
            </li>
            <li>
              <strong>F32 and F16</strong> are the uncompressed formats we
              support. Quantized formats (Q4_0, Q8_0, etc.) pack values into
              blocks for smaller files — that's Phase 4.
            </li>
            <li>
              The <code>gguf_inspect</code> and{" "}
              <code>gguf_load_tensor</code> MCP tools let you explore real
              model files interactively.
            </li>
          </ul>
        </div>

        <ChapterNav current={8} />
      </div>
    </PageTransition>
  );
}
