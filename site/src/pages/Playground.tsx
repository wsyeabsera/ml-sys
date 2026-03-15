import { useRef, useEffect, useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import Toolbar from "../components/playground/Toolbar";
import ReplInput from "../components/playground/ReplInput";
import ReplOutput from "../components/playground/ReplOutput";
import { useRepl } from "../hooks/useRepl";
import { loadSettings } from "./Settings";

export default function Playground() {
  const [settings] = useState(loadSettings);
  const { history, running, status, execute, navigateHistory, resetMcp, commandHistory } = useRepl();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasLoadedParams = useRef(false);
  const [prefill, setPrefill] = useState<{ text: string; seq: number } | undefined>(undefined);
  const prefillSeq = useRef(0);

  // Load commands from URL query params (from TryThis buttons)
  useEffect(() => {
    if (hasLoadedParams.current) return;
    const encoded = searchParams.get("commands");
    if (encoded && status === "connected") {
      hasLoadedParams.current = true;
      try {
        const commands: string[] = JSON.parse(atob(encoded));
        // Clear existing history first, then run commands sequentially
        execute("clear");
        (async () => {
          for (const cmd of commands) {
            await execute(cmd);
          }
        })();
        // Clean up the URL
        setSearchParams({}, { replace: true });
      } catch {
        // Invalid params, ignore
      }
    }
  }, [searchParams, status, execute, setSearchParams]);

  useEffect(() => {
    if (settings.autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, running, settings.autoScroll]);

  const handleClear = useCallback(() => {
    execute("clear");
  }, [execute]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(
      { commands: commandHistory, exportedAt: new Date().toISOString() },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playground-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [commandHistory]);

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl">
        <Toolbar
          status={status}
          onClear={handleClear}
          onResetMcp={resetMcp}
          onExport={handleExport}
        />

        {/* Output history */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 mb-4 font-mono text-sm"
        >
          {history.length === 0 && (
            <div className="text-[var(--color-text-muted)] text-sm py-8 text-center space-y-1">
              <p>
                Try a JS expression:{" "}
                <code className="text-[var(--color-accent-blue)]">2 + 2</code>
              </p>
              <p>
                Or an MCP tool:{" "}
                <code className="text-[var(--color-accent-blue)]">
                  tensor_create("a", [1,2,3,4], [2,2])
                </code>
              </p>
            </div>
          )}
          {history.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`space-y-1 ${entry.restored ? "opacity-40" : ""}`}
            >
              <div
                className={`cursor-pointer hover:bg-[var(--color-surface-overlay)]/50 rounded px-1 -mx-1 transition-colors ${
                  entry.restored
                    ? "text-[var(--color-text-muted)]"
                    : "text-[var(--color-accent-blue)]"
                }`}
                onClick={() => {
                  setPrefill({ text: entry.input, seq: ++prefillSeq.current });
                }}
                title="Click to load into input"
              >
                <span className="select-none">{">"} </span>
                {entry.input}
              </div>
              {!entry.restored && (
                <ReplOutput
                  output={entry.output}
                  isError={entry.isError}
                  outputId={entry.outputId}
                  hasRichViz={entry.hasRichViz}
                />
              )}
            </motion.div>
          ))}
          {history.some((e) => e.restored) &&
            !history.some((e) => !e.restored) && (
              <div className="text-xs text-[var(--color-text-muted)] text-center py-2">
                Session restored — re-run commands to see results
              </div>
            )}
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
          fontSize={settings.fontSize}
          prefill={prefill}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Shift+Enter or Cmd+Enter to run &middot; Up/Down for history &middot; Type{" "}
          <code>clear</code> to reset &middot; Start typing a tool name for autocomplete
        </p>
      </div>
    </PageTransition>
  );
}
