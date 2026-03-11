import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import DataFlowDiagram from "../components/viz/DataFlowDiagram";
import { mcpTools, categories } from "../data/mcp-tools";
import { useState } from "react";

export default function Chapter4() {
  const [openCategory, setOpenCategory] = useState<string | null>("tensor");

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 04
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            The MCP Server
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            How we turned a Rust library into something you can talk to from
            Claude Code — no scripts, no CLI, just conversation.
          </motion.p>
        </div>

        {/* Why MCP */}
        <InfoCard title="Why MCP?" accent="blue">
          <p>
            The Model Context Protocol lets Claude call your tools directly via JSON-RPC
            over stdin/stdout. Instead of writing test scripts, you describe what you
            want and Claude orchestrates the tensor operations.
          </p>
        </InfoCard>

        {/* Architecture Diagram */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            The MCP server is a separate binary that holds a{" "}
            <code>HashMap&lt;String, Tensor&gt;</code> in memory. Claude sends JSON-RPC
            calls, the server executes operations, and returns results.
          </p>
          <DataFlowDiagram />
        </div>

        {/* Named tensors explanation */}
        <InfoCard title="Why Named Tensors?" accent="amber">
          <p>
            MCP tools communicate via JSON — you can't pass Rust references. So the
            server stores tensors by name in a <code>Arc&lt;Mutex&lt;HashMap&gt;&gt;</code>.
            When you say "create tensor A", the server stores it. When you say "multiply
            A by B", it looks them up, computes, and stores the result.
          </p>
        </InfoCard>

        {/* Tool Catalog */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tool Catalog</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            15 tools across three categories. Click to expand.
          </p>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.key} className="border border-[var(--color-surface-overlay)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenCategory(openCategory === cat.key ? null : cat.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)] transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {cat.label}
                  </span>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    {cat.count} tools {openCategory === cat.key ? "−" : "+"}
                  </span>
                </button>

                {openCategory === cat.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[var(--color-surface-overlay)]"
                  >
                    {mcpTools
                      .filter((t) => t.category === cat.key)
                      .map((tool) => (
                        <div
                          key={tool.name}
                          className="px-4 py-3 border-b border-[var(--color-surface-overlay)] last:border-b-0"
                        >
                          <div className="flex items-start gap-3">
                            <code className="text-xs text-[var(--color-accent-emerald)] shrink-0 mt-0.5">
                              {tool.name}
                            </code>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {tool.description}
                            </span>
                          </div>
                          {tool.params.length > 0 && (
                            <div className="mt-1 flex gap-1.5 ml-[calc(0.75rem+var(--spacing))]">
                              {tool.params.map((p) => (
                                <span
                                  key={p}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Adding new tools */}
        <InfoCard title="Pattern for Adding Tools" accent="emerald">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Implement the operation in the library (tensor.rs or autograd.rs)</li>
            <li>Add an args struct in the appropriate ops file</li>
            <li>Add the tool method to TensorServer in tools/mod.rs</li>
            <li>Rebuild: <code>cargo build --bin mcp</code></li>
          </ol>
        </InfoCard>
      </div>
    </PageTransition>
  );
}
