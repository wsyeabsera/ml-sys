import { useRef, useEffect, useCallback, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import Toolbar from "../components/playground/Toolbar";
import ReplInput from "../components/playground/ReplInput";
import ReplOutput from "../components/playground/ReplOutput";
import { useRepl } from "../hooks/useRepl";
import { loadSettings } from "./Settings";

function RunningIndicator() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(id);
  }, []);
  const secs = (elapsed / 1000).toFixed(1);
  return (
    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
      <span className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)] animate-pulse" />
      Running... <span className="text-xs font-mono">{secs}s</span>
    </div>
  );
}

function DurationBadge({ ms }: { ms: number }) {
  if (ms < 10) return null;
  const label = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  return (
    <span className="text-[10px] font-mono text-[var(--color-text-muted)] ml-2">
      {label}
    </span>
  );
}

function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const shortcuts = [
    ["Shift+Enter", "Run command"],
    ["Cmd+Enter", "Run command (Mac)"],
    ["Up / Down", "Navigate command history"],
    ["Ctrl+L", "Clear output"],
    ["Escape", "Close this panel"],
    ["Type a tool name", "Autocomplete suggestions"],
    ["help", "List all tools"],
    ["help <tool>", "Tool details + example"],
    ["clear", "Reset session"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <code className="px-2 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] font-mono text-[11px]">
                {key}
              </code>
              <span className="text-[var(--color-text-secondary)]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TOOL_CATEGORIES = [
  {
    name: "Tensor Basics",
    color: "blue",
    tools: [
      { name: "tensor_create", template: 'tensor_create("a", [1,2,3,4], [2,2])' },
      { name: "tensor_inspect", template: 'tensor_inspect("a")' },
      { name: "tensor_list", template: "tensor_list()" },
    ],
  },
  {
    name: "Tensor Ops",
    color: "blue",
    tools: [
      { name: "tensor_add", template: 'tensor_add("a", "b", "c")' },
      { name: "tensor_matmul", template: 'tensor_matmul("a", "b", "c")' },
      { name: "tensor_transpose", template: 'tensor_transpose("a", 0, 1, "aT")' },
    ],
  },
  {
    name: "Autograd",
    color: "emerald",
    tools: [
      { name: "autograd_expr", template: 'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")' },
      { name: "autograd_neuron", template: "autograd_neuron([2, 0], [-3, 1], 6.88)" },
    ],
  },
  {
    name: "Training",
    color: "amber",
    tools: [
      { name: "create_dataset", template: 'create_dataset("xor", 4)' },
      { name: "init_mlp", template: 'init_mlp([2, 3, 1], "net")' },
      { name: "train_mlp", template: 'train_mlp("net", "xor_inputs", "xor_targets", 0.1, 100)' },
    ],
  },
];

const SNIPPETS = [
  {
    label: "Create & inspect a tensor",
    commands: [
      'tensor_create("m", [1,2,3,4,5,6], [2,3])',
      'tensor_inspect("m")',
    ],
  },
  {
    label: "Autograd: y = a * b",
    commands: [
      'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")',
    ],
  },
  {
    label: "Train XOR from scratch",
    commands: [
      'create_dataset("xor", 4)',
      'init_mlp([2, 4, 1], "net")',
      'train_mlp("net", "xor_inputs", "xor_targets", 0.5, 500)',
      'evaluate_mlp("net", "xor_inputs", "xor_targets")',
    ],
  },
  {
    label: "Single neuron with autograd",
    commands: ["autograd_neuron([2, 0], [-3, 1], 6.88)"],
  },
];

export default function Playground() {
  const [settings] = useState(loadSettings);
  const { history, running, status, execute, navigateHistory, resetMcp, commandHistory, activeWorkflow } = useRepl();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasLoadedParams = useRef(false);
  const [prefill, setPrefill] = useState<{ text: string; seq: number } | undefined>(undefined);
  const prefillSeq = useRef(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sourceChapter, setSourceChapter] = useState<string | null>(null);

  // Ctrl+/ to toggle shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load commands from URL query params (from TryThis buttons)
  useEffect(() => {
    if (hasLoadedParams.current) return;
    const encoded = searchParams.get("commands");
    const from = searchParams.get("from");
    if (encoded && status === "connected") {
      hasLoadedParams.current = true;
      if (from) setSourceChapter(from);
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

        {/* Back to chapter banner */}
        {sourceChapter && (
          <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 text-xs">
            <span className="text-[var(--color-text-secondary)]">
              Running examples from a chapter
            </span>
            <Link
              to={sourceChapter}
              className="text-[var(--color-accent-blue)] hover:underline flex items-center gap-1"
              onClick={() => setSourceChapter(null)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to chapter
            </Link>
          </div>
        )}

        {/* Output history */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 mb-4 font-mono text-sm"
        >
          {history.length === 0 && (
            <div className="py-6 space-y-6">
              {/* Quick start snippets */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Quick Start
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SNIPPETS.map((snippet) => (
                    <button
                      key={snippet.label}
                      onClick={async () => {
                        for (const cmd of snippet.commands) {
                          await execute(cmd);
                        }
                      }}
                      className="text-left text-xs px-3 py-2.5 rounded-lg border border-[var(--color-surface-overlay)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/5 transition-colors group"
                    >
                      <span className="text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-blue)] font-medium">
                        {snippet.label}
                      </span>
                      <span className="block text-[var(--color-text-muted)] mt-0.5 font-mono text-[10px] truncate">
                        {snippet.commands[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool browser */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Available Tools — click to insert
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {TOOL_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className={`text-xs font-semibold text-[var(--color-accent-${cat.color})]`}>
                        {cat.name}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cat.tools.map((tool) => (
                          <button
                            key={tool.name}
                            onClick={() => {
                              setPrefill({ text: tool.template, seq: ++prefillSeq.current });
                            }}
                            className="text-[11px] font-mono px-2 py-1 rounded bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] hover:border-[var(--color-accent-blue)]/50 transition-colors"
                          >
                            {tool.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hint */}
              <div className="text-center text-xs text-[var(--color-text-muted)] pt-2">
                Or type any JS expression — <code className="text-[var(--color-accent-blue)]">2 + 2</code>,{" "}
                <code className="text-[var(--color-accent-blue)]">Math.random()</code>,{" "}
                <code className="text-[var(--color-accent-blue)]">help</code>
              </div>
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
                {entry.durationMs !== undefined && <DurationBadge ms={entry.durationMs} />}
              </div>
              {!entry.restored && entry.output.startsWith("__workflow_start__") ? (
                <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-lg px-4 py-3">
                  <div className="text-sm font-semibold text-[var(--color-accent-emerald)]">
                    {activeWorkflow?.workflow.title ?? "Workflow"}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {activeWorkflow?.workflow.description} — Press "Next Step" below to begin
                  </div>
                </div>
              ) : !entry.restored && entry.output.startsWith("__workflow_text__") ? (
                <div className="bg-[var(--color-surface-raised)] border-l-2 border-[var(--color-accent-blue)] rounded-r-lg px-4 py-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {entry.output.slice("__workflow_text__".length)}
                </div>
              ) : !entry.restored && entry.output.startsWith("__workflow_end__") ? (
                <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-lg px-4 py-3 text-sm text-[var(--color-accent-blue)] space-y-1">
                  <div>Workflow complete!</div>
                  {entry.output.length > "__workflow_end__".length && (() => {
                    try {
                      const link = JSON.parse(entry.output.slice("__workflow_end__".length));
                      return (
                        <Link
                          to={link.path}
                          className="inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          Continue with {link.label} →
                        </Link>
                      );
                    } catch { return null; }
                  })()}
                </div>
              ) : !entry.restored ? (
                <ReplOutput
                  output={entry.output}
                  isError={entry.isError}
                  outputId={entry.outputId}
                  hasRichViz={entry.hasRichViz}
                  onExecute={execute}
                />
              ) : null}
            </motion.div>
          ))}
          {history.some((e) => e.restored) &&
            !history.some((e) => !e.restored) && (
              <div className="text-xs text-[var(--color-text-muted)] text-center py-2">
                Session restored — re-run commands to see results
              </div>
            )}
          {running && (
            <RunningIndicator />
          )}
        </div>

        {/* Workflow progress bar */}
        {activeWorkflow && (
          <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-lg bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-accent-emerald)]">
                  {activeWorkflow.workflow.title}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  Step {activeWorkflow.stepIndex + 1}/{activeWorkflow.workflow.steps.length}
                </span>
              </div>
              <div className="w-full h-1 bg-[var(--color-surface-overlay)] rounded-full mt-1.5">
                <div
                  className="h-1 bg-[var(--color-accent-emerald)] rounded-full transition-all"
                  style={{ width: `${((activeWorkflow.stepIndex) / activeWorkflow.workflow.steps.length) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => execute("/next")}
              disabled={running}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent-emerald)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {activeWorkflow.stepIndex === 0 ? "Start" : "Next Step"}
            </button>
            <button
              onClick={() => execute("/workflow stop")}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Stop
            </button>
          </div>
        )}

        {/* Feature pills above input */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <button
            onClick={() => execute("help")}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] hover:border-[var(--color-accent-blue)]/50 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            help
          </button>
          <button
            onClick={() => setPrefill({ text: 'tensor_create("t", [1,2,3,4], [2,2])', seq: ++prefillSeq.current })}
            className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] hover:border-[var(--color-accent-blue)]/50 transition-colors"
          >
            tensor_create
          </button>
          <button
            onClick={() => execute("tensor_list()")}
            className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] hover:border-[var(--color-accent-blue)]/50 transition-colors"
          >
            tensor_list
          </button>
          <button
            onClick={() => setPrefill({ text: 'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")', seq: ++prefillSeq.current })}
            className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] hover:border-[var(--color-accent-blue)]/50 transition-colors"
          >
            autograd
          </button>
          <button
            onClick={() => setPrefill({ text: 'create_dataset("xor", 4)', seq: ++prefillSeq.current })}
            className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-blue)] hover:border-[var(--color-accent-blue)]/50 transition-colors"
          >
            training
          </button>
          {!activeWorkflow && (
            <button
              onClick={() => execute("/workflow list")}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-[var(--color-surface-overlay)] text-[var(--color-accent-emerald)] hover:border-[var(--color-accent-emerald)]/50 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              /workflow
            </button>
          )}
          <div className="flex-1" />
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Shift+Enter to run
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-blue)] transition-colors"
          >
            Shortcuts
          </button>
        </div>

        {/* Input */}
        <ReplInput
          onExecute={execute}
          onNavigateHistory={navigateHistory}
          disabled={false}
          fontSize={settings.fontSize}
          prefill={prefill}
        />
        {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      </div>
    </PageTransition>
  );
}
