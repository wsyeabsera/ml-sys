import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import Badge from "../components/ui/Badge";
import ChapterNav from "../components/ui/ChapterNav";
import { phases } from "../data/roadmap";

const fileLayout = [
  { path: "src/tensor.rs", desc: "Tensor struct, strides, ops, matmul", lines: 240 },
  { path: "src/autograd.rs", desc: "Scalar Value type, backward pass", lines: 273 },
  { path: "src/tensor_value.rs", desc: "Tensor-level autograd", lines: 363 },
  { path: "src/lib.rs", desc: "Library root, re-exports", lines: 10 },
  { path: "src/bin/main.rs", desc: "Example usage binary", lines: 42 },
  { path: "src/bin/mcp.rs", desc: "MCP server entry point", lines: 15 },
  { path: "src/mcp/mod.rs", desc: "TensorServer + handler", lines: 80 },
  { path: "src/mcp/tools/mod.rs", desc: "All 15 MCP tool implementations", lines: 660 },
];

/** Expanded checklist with explanations */
const taskExplanations: Record<string, string> = {
  "Tensor struct with shape + strides":
    "The core data structure: a flat Vec<f32> plus shape and strides metadata. This is the same design as NumPy's ndarray — everything else is built on top of this.",
  "get_2d and N-dim get via strides":
    "Index into the tensor using the formula flat_index = sum(indices[i] * strides[i]). This O(1) operation is the reason strides exist — no loops, no searching, just multiply-and-add.",
  "Element-wise add and mul":
    "Apply an operation to every element independently. These are embarrassingly parallel — each element can be computed without knowing any other element. On a GPU, that means one thread per element.",
  "Reshape (with materialization)":
    "Change the shape metadata without copying data — unless the tensor is non-contiguous (e.g., after a transpose), in which case we must allocate a new buffer and copy elements into contiguous order. That copy is 'materialization.'",
  "Transpose (zero-copy via stride swap)":
    "Swap two entries in the strides vector. The data doesn't move — we just reinterpret the same flat array with swapped dimensions. O(1) time, O(0) extra memory. The catch: the tensor becomes non-contiguous.",
  "Matrix multiply (naive triple loop)":
    "The naive O(n³) algorithm: three nested for loops. It's slow, but it's correct, and it exposes exactly why memory layout matters — the inner loop's access pattern on one of the matrices is column-wise (cache-unfriendly).",
  "MCP server exposing all tensor ops":
    "A JSON-RPC server that lets Claude call tensor operations as tools. State (tensors) lives in a HashMap behind Arc<Mutex<>>. This turns our library into something conversational — no test scripts needed.",
};

export default function Chapter3() {
  const phase1 = phases[0];

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 03
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Phase 1 Recap
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Everything we built in Phase 1 — a strided N-dimensional array with
            basic operations — and why each piece matters.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Explained Checklist */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">What We Built</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Each task below is something we implemented from scratch. The
            explanations describe what it is and why it matters.
          </p>
          <div className="space-y-3">
            {phase1.tasks.map((task, i) => (
              <motion.div
                key={task.label}
                className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06, type: "spring" }}
                  >
                    {task.status === "done" ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--color-surface-overlay)]" />
                    )}
                  </motion.div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {task.label}
                  </span>
                  <div className="ml-auto">
                    <Badge status={task.status} />
                  </div>
                </div>
                {taskExplanations[task.label] && (
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed ml-8">
                    {taskExplanations[task.label]}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: How Operations Compose */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">How Operations Compose</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              All tensor operations boil down to combinations of simpler ones.
              Understanding this is key to understanding autograd in Chapter 5.
            </p>
            <p>
              Take matrix multiplication: a [2,3] @ [3,2] matmul produces a
              [2,2] output. Each element of the output is a{" "}
              <strong>dot product</strong> — 3 multiplications and 2 additions:
            </p>
            <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-lg p-4 font-mono text-xs">
              <p className="text-[var(--color-text-muted)]">{"// C[i,j] = sum(A[i,k] * B[k,j]) for k = 0..2"}</p>
              <p>C[0,0] = A[0,0]*B[0,0] + A[0,1]*B[1,0] + A[0,2]*B[2,0]</p>
              <p>C[0,1] = A[0,0]*B[0,1] + A[0,1]*B[1,1] + A[0,2]*B[2,1]</p>
              <p>C[1,0] = A[1,0]*B[0,0] + A[1,1]*B[1,0] + A[1,2]*B[2,0]</p>
              <p>C[1,1] = A[1,0]*B[0,1] + A[1,1]*B[1,1] + A[1,2]*B[2,1]</p>
            </div>
            <p>
              That's 12 multiplications and 8 additions to produce 4 output
              values. Matmul is just organized add + mul. This matters because
              when we build autograd, we'll need the gradient of matmul — and
              it's easier to derive if you remember that matmul is "many dot
              products arranged in a grid."
            </p>
          </div>
        </div>

        <InfoCard title="The Access Pattern Problem" accent="rose">
          <div className="space-y-2">
            <p>
              Look at the matmul formula: <code>C[i,j] = sum(A[i,k] * B[k,j])</code>.
              The inner loop varies <code>k</code>.
            </p>
            <p>
              For matrix A, we're reading <code>A[i,0], A[i,1], A[i,2]</code> —
              elements in the same row, which are adjacent in memory (row-major).
              Cache friendly.
            </p>
            <p>
              For matrix B, we're reading <code>B[0,j], B[1,j], B[2,j]</code> —
              elements in the same column, which are{" "}
              <strong>not adjacent</strong> in memory. Each access jumps by an
              entire row width. Cache hostile.
            </p>
            <p>
              This is the fundamental problem that every matmul optimization
              (loop tiling, transposing B, blocked algorithms) tries to solve.
              The naive triple loop works, but it wastes cache on every access
              to B.
            </p>
          </div>
        </InfoCard>

        {/* File layout */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">File Layout</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--color-surface-overlay)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-raised)]">
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">File</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">Purpose</th>
                  <th className="text-right px-4 py-2 font-medium text-[var(--color-text-muted)]">Lines</th>
                </tr>
              </thead>
              <tbody>
                {fileLayout.map((f, i) => (
                  <motion.tr
                    key={f.path}
                    className="border-t border-[var(--color-surface-overlay)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-blue)]">
                      {f.path}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                      {f.desc}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-[var(--color-text-muted)]">
                      {f.lines}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: What We Learned */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-emerald)]">
            What We Learned
          </h3>
          <div className="text-sm text-[var(--color-text-secondary)] space-y-3">
            <p>
              <strong>Tensors are flat data + metadata.</strong> The data never
              moves during reshape or transpose — only the shape and strides
              change. This "data stays put, interpretation changes" pattern is
              the fundamental design principle of every tensor library.
            </p>
            <p>
              <strong>Strides make N-dimensional indexing O(1).</strong> The
              formula <code>flat_index = sum(indices[i] * strides[i])</code> is
              a simple dot product. No loops over dimensions, no division. This
              is why tensors can be 100-dimensional without indexing getting
              slower.
            </p>
            <p>
              <strong>Transpose is free, but creates non-contiguity.</strong>{" "}
              Swapping strides is O(1), but the resulting tensor's logical order
              no longer matches its physical memory order. Reshaping it forces a
              copy. In production ML, tracking contiguity is how you avoid
              surprise allocations that blow your memory budget.
            </p>
            <p>
              <strong>Matmul reveals why cache matters.</strong> The naive triple
              loop is O(n³) in compute but much worse in practice because of
              cache misses on one of the matrices. Understanding this motivates
              every performance optimization we'll see later.
            </p>
          </div>
        </div>

        {/* What's next */}
        <InfoCard title="What's Next: Phase 2 — Autograd" accent="emerald">
          <p>
            Now that we have tensors with operations, we need to teach the
            library to compute its own gradients. We'll build a computation
            graph that records the forward pass, then implement backpropagation
            by walking the graph in reverse. This is where "machine learning"
            actually starts — without autograd, there's no training.
          </p>
        </InfoCard>

        <ChapterNav current={3} />
      </div>
    </PageTransition>
  );
}
