import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import ConnectionStatus from "../components/playground/ConnectionStatus";
import ReplInput from "../components/playground/ReplInput";
import { useRepl } from "../hooks/useRepl";

export default function Playground() {
  const { history, running, status, execute, navigateHistory } = useRepl();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, running]);

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Playground</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              JS expressions + rs-tensor MCP tools
            </p>
          </div>
          <ConnectionStatus status={status} />
        </div>

        {/* Output history */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 mb-4 font-mono text-sm"
        >
          {history.length === 0 && (
            <div className="text-[var(--color-text-muted)] text-sm py-8 text-center space-y-1">
              <p>Try a JS expression: <code className="text-[var(--color-accent-blue)]">2 + 2</code></p>
              <p>Or an MCP tool: <code className="text-[var(--color-accent-blue)]">tensor_create("a", [1,2,3,4], [2,2])</code></p>
            </div>
          )}
          {history.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <div className="text-[var(--color-accent-blue)]">
                <span className="select-none">{">"} </span>
                {entry.input}
              </div>
              {entry.output && (
                <pre
                  className={`whitespace-pre-wrap text-xs p-3 rounded-lg ${
                    entry.isError
                      ? "bg-red-500/10 text-[var(--color-accent-rose)] border-l-2 border-red-500"
                      : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {entry.output}
                </pre>
              )}
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
        <ReplInput
          onExecute={execute}
          onNavigateHistory={navigateHistory}
          disabled={false}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Shift+Enter to run &middot; Up/Down for history &middot; Type <code>clear</code> to reset
        </p>
      </div>
    </PageTransition>
  );
}
