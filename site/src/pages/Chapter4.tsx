import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
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

        {/* ============================================================ */}
        {/* SECTION: What is MCP, Really? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">What is MCP, Really?</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The Model Context Protocol (MCP) is a standard that lets AI models
              call your code as <strong>tools</strong>. Think of it as a
              contract: you describe what tools you offer (name, parameters,
              description), and the model decides when and how to call them.
            </p>
            <p>
              The communication is JSON-RPC over stdin/stdout. The server is a
              long-running process. Claude sends a JSON request like "create a
              tensor," the server executes the operation, and sends back a JSON
              response with the result.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Request (Claude → Server)
            </h4>
            <CodeBlock
              lang="json"
              code={`{
  "method": "tools/call",
  "params": {
    "name": "tensor_create",
    "arguments": {
      "name": "A",
      "data": [1, 2, 3, 4, 5, 6],
      "shape": [2, 3]
    }
  }
}`}
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Response (Server → Claude)
            </h4>
            <CodeBlock
              lang="json"
              code={`{
  "content": [{
    "type": "text",
    "text": "Created tensor 'A'\\n  shape: [2, 3]\\n  strides: [3, 1]\\n  data: [1, 2, 3, 4, 5, 6]"
  }]
}`}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Why This Architecture? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Why This Architecture?</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Three design decisions, and why we made them:
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <InfoCard title="1. Stateful Server with Named Tensors" accent="blue">
            <div className="space-y-2">
              <p>
                The server holds a <code>HashMap&lt;String, Tensor&gt;</code> in
                memory. When you say "create tensor A," it stores it by name.
                When you say "multiply A by B," it looks them up, computes, and
                stores the result.
              </p>
              <p>
                Why not stateless? Because MCP tools communicate via JSON — you
                can't pass Rust references or pointers. Named tensors are the
                handle that lets Claude chain operations across multiple tool
                calls. It's the same pattern as file handles in an OS.
              </p>
            </div>
          </InfoCard>

          <InfoCard title="2. Arc<Mutex<>> for Shared State" accent="amber">
            <div className="space-y-2">
              <p>
                The server is async (tokio). Multiple tool calls could arrive
                concurrently — imagine Claude deciding to create two tensors at
                the same time.{" "}
                <code>Arc&lt;Mutex&lt;HashMap&gt;&gt;</code> prevents data
                races:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code>Arc</code> = atomic reference counting. Multiple async
                  tasks can hold a reference to the same HashMap.
                </li>
                <li>
                  <code>Mutex</code> = mutual exclusion. Only one task can
                  read/write the HashMap at a time.
                </li>
              </ul>
              <p>
                In practice, our tool calls are fast enough that the Mutex is
                never contended. But the type system enforces correctness — you
                literally can't compile code that has a data race.
              </p>
            </div>
          </InfoCard>

          <InfoCard title="3. Long-Running Process (Not a CLI)" accent="emerald">
            <div className="space-y-2">
              <p>
                Why not just a CLI that reads a command, runs it, and exits?
                Because <strong>conversation has context</strong>. Claude
                remembers what tensors exist and can chain operations: "create
                A, transpose it to AT, multiply A by AT." Each step builds on
                the previous one.
              </p>
              <p>
                A CLI would lose state between invocations. You'd have to
                serialize tensors to disk and reload them — possible, but
                clunky. The long-running server keeps everything in memory,
                making interaction feel natural.
              </p>
            </div>
          </InfoCard>
        </div>

        {/* Architecture Diagram */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Data Flow</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            JSON-RPC requests flow from Claude through stdin to the MCP binary.
            The binary dispatches to TensorServer, which operates on the shared
            HashMap. Responses flow back through stdout.
          </p>
          <DataFlowDiagram />
        </div>

        {/* ============================================================ */}
        {/* SECTION: Tool Catalog */}
        {/* ============================================================ */}
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
                    {cat.count} tools {openCategory === cat.key ? "\u2212" : "+"}
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

        {/* ============================================================ */}
        {/* SECTION: Common Gotchas */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Common Gotchas</h2>
          <div className="space-y-3">
            <InfoCard title="Tensor Not Found" accent="rose">
              <p>
                If you reference a tensor that doesn't exist (typo, never
                created, or server restarted), you get an error like{" "}
                <code>Tensor 'X' not found</code>. Tensor names are just
                strings — there's no autocomplete or validation. A typo like
                "a" instead of "A" silently fails.
              </p>
            </InfoCard>

            <InfoCard title="State is Ephemeral" accent="rose">
              <p>
                The server holds all tensors in memory. If the server process
                restarts (crash, recompile, or just ctrl+C), all tensors are
                gone. There's no persistence layer. In a production system,
                you'd want checkpointing — but for learning, the simplicity is
                worth it.
              </p>
            </InfoCard>

            <InfoCard title="Autograd Graphs Can't Cross the MCP Boundary" accent="amber">
              <p>
                Our scalar autograd uses <code>Rc&lt;RefCell&gt;</code>, which
                isn't <code>Send</code> — it can't be shared across async task
                boundaries. The MCP tools for autograd (like{" "}
                <code>autograd_neuron</code>) run the entire computation in a
                single synchronous block and return the results. You can't
                build a graph incrementally across multiple tool calls.
              </p>
            </InfoCard>
          </div>
        </div>

        {/* Try it yourself */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Try It Yourself</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            If you have the MCP server running in Claude Code, you can talk to
            your tensor library directly. Here are some things to try:
          </p>
          <CodeBlock
            lang="text"
            code={`"Create a 2x3 tensor called A with values 1 through 6"
→ calls tensor_create(name="A", data=[1,2,3,4,5,6], shape=[2,3])

"What does A look like?"
→ calls tensor_inspect(name="A")

"Transpose A and store it as AT"
→ calls tensor_transpose(name="A", dim0=0, dim1=1, result="AT")

"Multiply A by AT"
→ calls tensor_matmul(a="A", b="AT", result="AAT")

"Inspect AAT — what shape is it?"
→ calls tensor_inspect(name="AAT")
→ shape: [2, 2] (a [2,3] @ [3,2] = [2,2])`}
          />
        </div>

        {/* Adding new tools */}
        <InfoCard title="Pattern for Adding Tools" accent="emerald">
          <div className="space-y-2">
            <p>Adding a new tool follows a consistent pattern:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>Implement the operation</strong> in the library
                (tensor.rs or autograd.rs). Test it with <code>cargo test</code>.
              </li>
              <li>
                <strong>Add an args struct</strong> with serde deserialization
                in the appropriate tools file. MCP sends JSON, so you need a
                struct that maps to the expected parameters.
              </li>
              <li>
                <strong>Add the tool method</strong> to TensorServer in
                tools/mod.rs. This is where you parse args, call the library
                function, and format the result.
              </li>
              <li>
                <strong>Rebuild:</strong> <code>cargo build --bin mcp</code>.
                The new tool is automatically available to Claude.
              </li>
            </ol>
          </div>
        </InfoCard>

        <ChapterNav current={4} />
      </div>
    </PageTransition>
  );
}
