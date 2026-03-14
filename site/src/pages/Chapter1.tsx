import ClaudePrompts from "../components/ui/ClaudePrompts";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import Badge from "../components/ui/Badge";
import { phases } from "../data/roadmap";

export default function Chapter1() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 01
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            What Are We Building (And Why Should You Care)?
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            We're rebuilding the guts of an AI framework from scratch. Not
            because the world needs another one, but because you don't
            truly understand something until you've built a broken version of it.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="Let's be honest" accent="emerald">
          <div className="space-y-2">
            <p>
              You've probably used ChatGPT. Maybe you've played with Stable
              Diffusion. You've definitely heard someone at a dinner party say
              "it's just linear algebra" with the confidence of a person who has
              never actually done linear algebra.
            </p>
            <p>
              But here's the thing — they're <em>kind of</em> right. Under the
              hood, every AI model is built from the same handful of operations:
              multiply some matrices, compute some gradients, update some
              weights, repeat a few billion times. The concepts aren't magic.
              They're just... stacked really high.
            </p>
            <p>
              This project is about unstacking them. One layer at a time. By
              building each piece ourselves — in Rust, from scratch — until the
              whole thing makes sense.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Three Layers */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Every AI Framework is Three Things in a Trench Coat
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              When people say "PyTorch" or "TensorFlow," they're talking about
              three systems pretending to be one:
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title="1. Tensor Engine" accent="blue">
            <div className="space-y-2">
              <p>
                Flat arrays of numbers with shape metadata. Plus operations:
                matmul, reshape, transpose. This is the foundation — everything
                else is built on "how do you store and manipulate
                multidimensional data?"
              </p>
              <p className="text-xs text-[var(--color-text-muted)] italic">
                We build this first. It's simpler than you think.
              </p>
            </div>
          </InfoCard>
          <InfoCard title="2. Autograd Engine" accent="emerald">
            <div className="space-y-2">
              <p>
                Records every operation during the forward pass, then replays
                them backward to compute gradients automatically. This is what
                makes "learning" possible without hand-deriving calculus.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] italic">
                We build this second. It's the clever bit.
              </p>
            </div>
          </InfoCard>
          <InfoCard title="3. GPU + Optimizers" accent="amber">
            <div className="space-y-2">
              <p>
                CUDA code that runs operations on the GPU in parallel, plus
                algorithms (SGD, Adam) that use gradients to update weights.
                This is what makes it fast enough to be useful.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] italic">
                We don't build this (yet). But once you understand 1 and 2, it's
                just "do the same thing, but on thousands of cores."
              </p>
            </div>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Why Rust */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            "Why Rust?"
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Because ML frameworks are systems software. Memory layout, cache
              lines, and zero-cost abstractions aren't nice-to-haves — they're
              the reason your model trains in 2 hours instead of 2 days.
            </p>
            <p>
              Rust makes these concepts explicit. When you allocate a{" "}
              <code>Vec&lt;f32&gt;</code>, you know exactly where it lives, how
              it's laid out, and when it gets freed. No garbage collector doing
              mysterious things behind your back. No hidden copies. No "why is
              this slow and I don't know why."
            </p>
            <p>
              Also, honestly? It's fun. There's something deeply satisfying
              about writing <code>tensor.transpose()</code> and knowing it
              happens in O(1) because you built the stride-swapping yourself.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Playground */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Your Secret Weapon: The Playground
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              This isn't a textbook. Throughout every chapter, you'll see "Try
              This" buttons that open the <strong>REPL playground</strong> —
              a live terminal connected to the actual Rust tensor library running
              on your machine. You type a command, it runs on the real engine,
              and you see the result with visualizations.
            </p>
            <p>
              You can also just go to the playground and mess around whenever you
              want. Break things. It's the fastest way to learn.
            </p>
            <p>
              Here — try your very first tensor operation right now:
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'tensor_create("hello", [1, 2, 3, 4], [2, 2])',
            'tensor_inspect("hello")',
          ]}
          label="Create your first tensor"
        />

        <InfoCard title="What just happened?" accent="blue">
          <div className="space-y-2">
            <p>
              You just created a 2x2 matrix with the values [1, 2, 3, 4] and
              stored it under the name "hello." Then you inspected it and saw
              its shape, strides, and data.
            </p>
            <p>
              That tensor is living in the Rust library's memory right now. You
              can create more, multiply them, transpose them — the playground
              remembers everything until you reset it. The entire learning
              experience is built around this loop: read a concept, try it
              immediately, see what happens.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Learning Arc */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">The Journey Ahead</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              We're going from "what even is a tensor" to "let's run a real
              language model." Each chapter builds on the last, and each one
              ends with a mini project where you build something real in the
              playground.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--color-surface-overlay)]" />

            <div className="space-y-4">
              {phases.map((phase, i) => (
                <motion.div
                  key={phase.num}
                  className="flex gap-4 items-start pl-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
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
                        {phase.title}
                      </h3>
                      <Badge status={phase.status} />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {phase.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: What matters at scale */}
        {/* ============================================================ */}
        <InfoCard title="Things we'll point out along the way" accent="amber">
          <div className="space-y-2">
            <p>
              Every chapter has moments where we'll stop and say "this matters
              at scale." These are the things that separate a toy
              implementation from a real one:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Why memory layout is the difference between 1 second and 10
                seconds
              </li>
              <li>
                Why <code>Rc&lt;RefCell&gt;</code> works for learning but
                you'd need <code>Arc&lt;Mutex&gt;</code> in production
              </li>
              <li>
                Why transpose is free but can make everything else slow
              </li>
              <li>
                Why every optimization in ML boils down to "keep data in cache"
              </li>
            </ul>
            <p>
              You don't need to worry about these yet. But when we hit them,
              you'll understand <em>why</em> real frameworks make the choices
              they do.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* WHAT YOU LEARNED */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            What You Now Know
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              AI frameworks are three things: a tensor engine, an autograd
              engine, and GPU kernels. We're building the first two.
            </li>
            <li>
              Rust is the right language because ML is systems programming —
              memory layout and performance matter.
            </li>
            <li>
              The playground is your tool for experimenting — every chapter
              connects to it with live, runnable examples.
            </li>
            <li>
              You just created your first tensor. You're officially more
              dangerous than someone who's only ever called{" "}
              <code>torch.tensor()</code>.
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
            Time to actually understand what a tensor <em>is</em>. Not the
            math-class definition — the "what's actually happening in memory"
            definition. Spoiler: it's a flat array with a sticky note. Seriously.
          </p>
        </div>

        <LearnNav current={1} />
        <ClaudePrompts chapter={1} />
      </div>
    </PageTransition>
  );
}
