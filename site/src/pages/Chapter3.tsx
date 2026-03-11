import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import Badge from "../components/ui/Badge";
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
            basic operations.
          </motion.p>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Checklist</h2>
          <div className="space-y-2">
            {phase1.tasks.map((task, i) => (
              <motion.div
                key={task.label}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
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
                <span className="text-sm text-[var(--color-text-primary)]">
                  {task.label}
                </span>
                <div className="ml-auto">
                  <Badge status={task.status} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

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

        {/* What's next */}
        <InfoCard title="What's Next: Phase 2" accent="emerald">
          <p>
            Autograd — teaching the tensor library to compute its own gradients.
            We'll build a computation graph, implement the chain rule, and make
            backpropagation work from scratch.
          </p>
        </InfoCard>
      </div>
    </PageTransition>
  );
}
