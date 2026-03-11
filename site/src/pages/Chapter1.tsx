import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import InfoCard from "../components/ui/InfoCard";
import Badge from "../components/ui/Badge";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import { phases } from "../data/roadmap";

export default function Chapter1() {
  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <motion.p
            className="text-sm font-mono text-[var(--color-accent-blue)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Chapter 01
          </motion.p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Getting Started
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            This is a learning project. The goal is to understand ML systems by
            building broken versions of them — not to ship production code.
          </motion.p>
        </div>

        {/* Learning philosophy */}
        <motion.div
          className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-6 transition-colors duration-200"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-semibold mb-3">The Learning Philosophy</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
            Most ML tutorials show you how to <em>use</em> PyTorch or TensorFlow.
            This project is different — we're building the thing that PyTorch is
            made of. Not because we'll make a better framework, but because you
            don't truly understand something until you've built a broken version
            of it.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Along the way, we'll hit questions that matter at scale: Why does
            memory layout affect performance? Why do GPUs need special data
            formats? What is a gradient, really, when you strip away the math
            notation? Each chapter answers these questions by writing code, not
            by reading formulas.
          </p>
        </motion.div>

        {/* ============================================================ */}
        {/* SECTION: What Even Is a Tensor Library? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Even Is a Tensor Library?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              When people say "PyTorch" or "TensorFlow," they're talking about
              three things glued together:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>A tensor engine</strong> — flat arrays of numbers with
                shape metadata, plus operations like matmul, reshape, and
                transpose. This is the foundation. Everything is built on top
                of "how do you store and manipulate multidimensional data
                efficiently?"
              </li>
              <li>
                <strong>An autograd engine</strong> — records every operation
                during the forward pass, then replays them backward to compute
                gradients automatically. This is what makes "training" possible
                without hand-deriving calculus for every model architecture.
              </li>
              <li>
                <strong>GPU kernels and optimizers</strong> — CUDA code that
                runs operations on the GPU in parallel, plus optimization
                algorithms (SGD, Adam) that use the gradients to update weights.
                This is what makes it fast enough to be useful.
              </li>
            </ol>
            <p>
              We're building #1 and #2 from scratch. We won't touch #3 yet
              (that's Phase 4). But by the time you understand tensors and
              autograd at the systems level, the GPU parts will make a lot more
              sense.
            </p>
          </div>
        </div>

        {/* Why memory layout matters */}
        <InfoCard title="Why Memory Layout Matters (A Preview)" accent="amber">
          <div className="space-y-2">
            <p>
              Here's a concrete example that motivates everything in Chapter 2.
              Imagine a 1000×1000 matrix of floats stored in row-major order
              (row 0 first, then row 1, etc.).
            </p>
            <p>
              <strong>Reading row-by-row:</strong> each element is right next to
              the previous one in memory. The CPU loads 16 floats at a time
              (a cache line), so 15 out of 16 reads are "free" — they're
              already in cache. Fast.
            </p>
            <p>
              <strong>Reading column-by-column:</strong> each element is 1000
              positions away from the previous one. Every single read misses the
              cache and fetches a new 64-byte chunk from RAM. 10x slower, for
              the exact same data and the same number of reads.
            </p>
            <p>
              This is why tensor libraries care about memory layout, strides, and
              contiguity. It's not academic — it's the difference between code
              that runs in 1 second and code that runs in 10.
            </p>
          </div>
        </InfoCard>

        {/* What this is */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="What we're building" accent="blue">
            <p>
              A tensor library in Rust, from scratch. No PyTorch, no TensorFlow.
              Just a flat array, a shape vector, and the math to make them work.
              Then we'll add autograd, an inference engine, and see how deep the
              rabbit hole goes.
            </p>
          </InfoCard>
          <InfoCard title="Why Rust?" accent="emerald">
            <p>
              ML frameworks are systems software. Memory layout, cache lines,
              and zero-cost abstractions matter. Rust makes these concepts
              explicit — when you allocate a <code>Vec&lt;f32&gt;</code>, you
              know exactly where it lives and how it's laid out. No garbage
              collector, no hidden copies, no magic.
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* Learning Arc Timeline */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">The Learning Arc</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            We're following a 4-phase progression. Each phase builds on the last,
            going from "what even is a tensor" to "let's write a CUDA kernel."
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--color-surface-overlay)]" />

            <div className="space-y-6">
              {phases.map((phase, i) => (
                <motion.div
                  key={phase.num}
                  className="flex gap-4 items-start pl-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {/* Dot */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                      phase.status === "done"
                        ? "bg-emerald-500 text-white"
                        : phase.status === "in-progress"
                          ? "bg-blue-500 text-white"
                          : "bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {phase.num}
                  </div>

                  <div className="flex-1 bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-4 transition-colors duration-200">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold">
                        Phase {phase.num}: {phase.title}
                      </h3>
                      <Badge status={phase.status} />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                      {phase.description}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {phase.num === 1 && "Key insight: data is always flat — shape and strides are just metadata that determine how you interpret it."}
                      {phase.num === 2 && "Key insight: the chain rule lets you decompose any gradient into simple local operations chained together."}
                      {phase.num === 3 && "Key insight: an LLM is just matrix multiplications and attention — all built on the same tensor ops."}
                      {phase.num === 4 && "Key insight: the algorithm is the same on GPU — the speedup comes from doing thousands of operations in parallel."}
                    </p>
                    {phase.readings.length > 0 && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-2">
                        Reading: {phase.readings.join(", ")}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* How to run */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Running the Project</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Everything lives in the <code>rs-tensor</code> directory. You'll need
            Rust installed (<code>rustup</code> is the easiest way).
          </p>
          <CodeBlock
            lang="bash"
            code={`cd rs-tensor
cargo build          # compile the library
cargo run            # run the example binary
cargo test           # run all tests
cargo doc --open     # generate API docs`}
          />
        </div>

        <ChapterNav current={1} />
      </div>
    </PageTransition>
  );
}
