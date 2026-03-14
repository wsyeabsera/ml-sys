import { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import ConnectionStatus from "../components/playground/ConnectionStatus";
import { useBridge } from "../hooks/useBridge";

interface HistoryEntry {
  id: number;
  input: string;
  output: string;
  isError: boolean;
}

export default function Playground() {
  const { status, callTool } = useBridge();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);

  let nextId = 0;

  async function execute() {
    const code = input.trim();
    if (!code) return;
    if (status !== "connected") return;

    setRunning(true);
    setInput("");

    // Parse as MCP tool call: tool_name(arg1, arg2, ...)
    // For Phase 1, expect JSON-ish format: tool_name {"key": "value"}
    // Or simple: tool_name(json_args)
    const match = code.match(/^(\w+)\s*\((.+)\)\s*$/s);
    let output: string;
    let isError = false;

    if (match) {
      const toolName = match[1];
      const argsStr = match[2];

      try {
        // Try to parse positional args into the right shape
        const args = parseToolArgs(toolName, argsStr);
        const result = await callTool(toolName, args);

        if (result.ok && result.result) {
          const text = result.result.content
            .map((c) => c.text)
            .join("\n");
          output = text;
        } else {
          output = result.error ?? "Unknown error";
          isError = true;
        }
      } catch (err) {
        output = `Parse error: ${err}`;
        isError = true;
      }
    } else {
      output = "Could not parse as tool call. Use: tool_name(args...)";
      isError = true;
    }

    setHistory((prev) => [
      ...prev,
      { id: nextId++, input: code, output, isError },
    ]);
    setRunning(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      execute();
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Playground</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Call rs-tensor MCP tools interactively
            </p>
          </div>
          <ConnectionStatus status={status} />
        </div>

        {/* Output history */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 font-mono text-sm">
          {history.length === 0 && (
            <div className="text-[var(--color-text-muted)] text-sm py-8 text-center">
              Try: tensor_create("a", [1,2,3,4], [2,2])
            </div>
          )}
          {history.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <div className="text-[var(--color-accent-blue)]">
                {">"} {entry.input}
              </div>
              <pre
                className={`whitespace-pre-wrap text-xs p-3 rounded-lg ${
                  entry.isError
                    ? "bg-red-500/10 text-[var(--color-accent-rose)] border-l-2 border-red-500"
                    : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
                }`}
              >
                {entry.output}
              </pre>
            </motion.div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)] animate-pulse" />
              Running...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border border-[var(--color-surface-overlay)] rounded-lg bg-[var(--color-surface-raised)] p-3 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status === "connected"
                ? 'tensor_create("a", [1,2,3,4], [2,2])'
                : "Bridge not connected..."
            }
            disabled={status !== "connected"}
            className="flex-1 bg-transparent text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none resize-none"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
          />
          <button
            onClick={execute}
            disabled={status !== "connected" || running || !input.trim()}
            className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--color-accent-blue)] text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            Run
          </button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Shift+Enter to run
        </p>
      </div>
    </PageTransition>
  );
}

/**
 * Parse positional args for known MCP tools.
 * e.g., tensor_create("a", [1,2,3,4], [2,2]) → { name: "a", data: [...], shape: [...] }
 */
function parseToolArgs(tool: string, argsStr: string): Record<string, unknown> {
  // Wrap in array brackets and parse as JSON array
  const parsed = JSON.parse(`[${argsStr}]`);

  const schemas: Record<string, string[]> = {
    tensor_create: ["name", "data", "shape"],
    tensor_inspect: ["name"],
    tensor_list: [],
    tensor_add: ["a", "b", "result_name"],
    tensor_mul: ["a", "b", "result_name"],
    tensor_matmul: ["a", "b", "result_name"],
    tensor_transpose: ["name", "dim0", "dim1", "result_name"],
    tensor_reshape: ["name", "new_shape", "result_name"],
    tensor_get: ["name", "indices"],
    tensor_get_2d: ["name", "row", "col"],
    autograd_expr: ["values", "ops", "backward_from"],
    autograd_neuron: ["inputs", "weights", "bias"],
  };

  const keys = schemas[tool];
  if (!keys) {
    // Unknown tool — try to pass first arg as-is if it's an object
    if (parsed.length === 1 && typeof parsed[0] === "object" && !Array.isArray(parsed[0])) {
      return parsed[0];
    }
    throw new Error(`Unknown tool: ${tool}. Pass args as a JSON object.`);
  }

  const result: Record<string, unknown> = {};
  keys.forEach((key, i) => {
    if (i < parsed.length) {
      result[key] = parsed[i];
    }
  });
  return result;
}
