import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import InfoCard from "../components/ui/InfoCard";
import Badge from "../components/ui/Badge";
import CodeBlock from "../components/ui/CodeBlock";
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
            This is a learning project. The goal is to understand ML systems by building
            broken versions of them — not to ship production code.
          </motion.p>
        </div>

        {/* What this is */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="What we're building" accent="blue">
            <p>
              A tensor library in Rust, from scratch. No PyTorch, no TensorFlow.
              Just a flat array, a shape vector, and the math to make them work.
            </p>
          </InfoCard>
          <InfoCard title="Why Rust?" accent="emerald">
            <p>
              ML frameworks are systems software. Memory layout, cache lines, and
              zero-cost abstractions matter. Rust makes these concepts explicit.
            </p>
          </InfoCard>
        </div>

        {/* Learning Arc Timeline */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">The Learning Arc</h2>
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

                  <div className="flex-1 bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold">
                        Phase {phase.num}: {phase.title}
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

        {/* How to run */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Running the Project</h2>
          <CodeBlock
            lang="bash"
            code={`cd rs-tensor
cargo build          # compile the library
cargo run            # run the example binary
cargo test           # run all tests
cargo doc --open     # generate API docs`}
          />
        </div>
      </div>
    </PageTransition>
  );
}
