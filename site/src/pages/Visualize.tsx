import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition";

const TYPE_CHAPTER_LINK: Record<string, { label: string; path: string }> = {
  tensor: { label: "Learn 02: Tensors", path: "/learn/2" },
  autograd: { label: "Learn 03: Autograd", path: "/learn/3" },
  neuron: { label: "Learn 03: Autograd", path: "/learn/3" },
  mlp: { label: "Learn 04: Neural Networks", path: "/learn/4" },
  attention: { label: "Learn 05: Attention", path: "/learn/5" },
  training: { label: "Learn 09: Training", path: "/learn/9" },
  evaluation: { label: "Learn 09: Training", path: "/learn/9" },
  prediction: { label: "Learn 09: Training", path: "/learn/9" },
};
import { loadOutput, listOutputs, type StoredOutput } from "../lib/db";
import { parseResult } from "../lib/result-parser";
import TensorViz from "../components/playground/TensorViz";
import AutogradViz from "../components/playground/AutogradViz";
import AttentionHeatmap from "../components/visualizer/AttentionHeatmap";
import AutogradGraphViz from "../components/visualizer/AutogradGraphViz";
import MLPLayerViz from "../components/visualizer/MLPLayerViz";
import TensorExplorer from "../components/visualizer/TensorExplorer";
import NeuronGraphViz from "../components/visualizer/NeuronGraphViz";
import TrainingHistoryViz from "../components/visualizer/TrainingHistoryViz";

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  tensor: { label: "tensor", color: "blue" },
  autograd: { label: "autograd", color: "blue" },
  neuron: { label: "neuron", color: "emerald" },
  attention: { label: "attention", color: "blue" },
  mlp: { label: "mlp", color: "emerald" },
  training: { label: "training", color: "emerald" },
  evaluation: { label: "eval", color: "amber" },
  prediction: { label: "prediction", color: "blue" },
};

function TypeBadge({ type }: { type: string }) {
  const badge = TYPE_BADGE[type];
  if (!badge) return <span className="text-xs text-[var(--color-text-muted)]">{type}</span>;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[var(--color-accent-${badge.color})]/15 text-[var(--color-accent-${badge.color})]`}>
      {badge.label}
    </span>
  );
}

export default function Visualize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [output, setOutput] = useState<StoredOutput | null>(null);
  const [recentOutputs, setRecentOutputs] = useState<StoredOutput[]>([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Load output from URL param
  useEffect(() => {
    const outputId = searchParams.get("outputId");
    if (outputId) {
      loadOutput(outputId).then((result) => {
        setOutput(result);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    // Load recent outputs for the dropdown
    listOutputs(20).then(setRecentOutputs);
  }, [searchParams]);

  function handlePaste() {
    try {
      const parsed = JSON.parse(pasteText);
      setOutput({
        id: "pasted",
        input: "(pasted data)",
        output: pasteText,
        parsed,
        type: parseResult(pasteText, false).type,
        timestamp: Date.now(),
        isError: false,
        hasRichViz: true,
      });
      setPasteMode(false);
    } catch {
      // Invalid JSON
    }
  }

  function selectOutput(stored: StoredOutput) {
    setOutput(stored);
  }

  return (
    <PageTransition>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visualizer</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Interactive visualizations for MCP results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPasteMode(!pasteMode)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            >
              {pasteMode ? "Cancel" : "Paste JSON"}
            </button>
          </div>
        </div>

        {/* Paste mode */}
        {pasteMode && (
          <div className="space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste MCP tool output JSON here..."
              className="w-full h-40 px-3 py-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-surface-overlay)] text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)] resize-y"
            />
            <button
              onClick={handlePaste}
              className="px-4 py-2 text-sm rounded-lg bg-[var(--color-accent-blue)] text-white hover:opacity-90 transition-opacity"
            >
              Visualize
            </button>
          </div>
        )}

        {/* Recent outputs list */}
        {!output && !loading && recentOutputs.length > 0 && (
          <RecentOutputsList
            outputs={recentOutputs}
            typeFilter={typeFilter}
            onFilterChange={setTypeFilter}
            onSelect={selectOutput}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[var(--color-text-muted)]">
            Loading...
          </div>
        )}

        {/* No output selected — rich empty state */}
        {!loading && !output && recentOutputs.filter((o) => o.hasRichViz).length === 0 && (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-[var(--color-text-secondary)]">
                No outputs to visualize yet
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Run tools in the REPL — results with rich visualizations will appear here automatically.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Available Visualizations
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    title: "Tensor Explorer",
                    desc: "Grid view, stats, and element details",
                    cmd: 'tensor_create("t", [1,2,3,4,5,6], [2,3])',
                    color: "blue",
                  },
                  {
                    title: "Training History",
                    desc: "Loss curves over epochs",
                    cmd: 'create_dataset("xor", 4)',
                    color: "emerald",
                  },
                  {
                    title: "Autograd Graph",
                    desc: "Computation graph with gradient flow",
                    cmd: 'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")',
                    color: "blue",
                  },
                  {
                    title: "Neuron Graph",
                    desc: "Single neuron computation flow",
                    cmd: "autograd_neuron([2, 0], [-3, 1], 6.88)",
                    color: "emerald",
                  },
                  {
                    title: "MLP Architecture",
                    desc: "Layer diagram with weights",
                    cmd: 'mlp_forward([1, 2], [1, 2], [{"in_features": 2, "out_features": 3, "weights": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2], "bias": [0.1, -0.1, 0.2]}, {"in_features": 3, "out_features": 1, "weights": [0.7, -0.5, 0.9], "bias": [0.0]}])',
                    color: "emerald",
                  },
                  {
                    title: "Attention Heatmap",
                    desc: "Token-to-token attention weights",
                    cmd: "attention_forward(3, 4, [1,0,0,0, 0,1,0,0, 0,0,1,0], [1,0,0,0, 0,1,0,0, 0,0,1,0], [1,0,0,0, 0,1,0,0, 0,0,1,0])",
                    color: "amber",
                  },
                ].map((viz) => (
                  <button
                    key={viz.title}
                    onClick={() => {
                      const encoded = btoa(JSON.stringify([viz.cmd]));
                      navigate(`/playground?commands=${encoded}`);
                    }}
                    className="text-left p-3 rounded-lg border border-[var(--color-surface-overlay)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent-blue)]/50 transition-colors group"
                  >
                    <div className={`text-xs font-semibold text-[var(--color-accent-${viz.color})] group-hover:text-[var(--color-accent-blue)]`}>
                      {viz.title}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                      {viz.desc}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" y1="19" x2="20" y2="19" />
                      </svg>
                      Try in REPL
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Visualization */}
        {output && (
          <div className="space-y-4">
            {/* Command header */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
              <div>
                <code className="text-sm font-mono text-[var(--color-accent-blue)]">
                  {output.input}
                </code>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {output.id === "pasted" ? "Pasted data" : timeAgo(output.timestamp)}
                  {" · "}
                  Type: {output.type}
                  {TYPE_CHAPTER_LINK[output.type] && (
                    <>
                      {" · "}
                      <Link
                        to={TYPE_CHAPTER_LINK[output.type].path}
                        className="text-[var(--color-accent-blue)] hover:underline"
                      >
                        {TYPE_CHAPTER_LINK[output.type].label}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {output.id !== "pasted" && (
                  <button
                    onClick={() => {
                      const encoded = btoa(JSON.stringify([output.input]));
                      navigate(`/playground?commands=${encoded}`);
                    }}
                    className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    Run in REPL
                  </button>
                )}
                <button
                  onClick={() => setOutput(null)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Render the visualization */}
            <VizRenderer output={output} input={output.input} />

            {/* Raw data (collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                Raw data
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-surface-overlay)] text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(output.parsed ?? output.output, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function RecentOutputsList({
  outputs,
  typeFilter,
  onFilterChange,
  onSelect,
}: {
  outputs: StoredOutput[];
  typeFilter: string | null;
  onFilterChange: (t: string | null) => void;
  onSelect: (o: StoredOutput) => void;
}) {
  // Deduplicate: keep only the most recent per unique command
  const deduped = useMemo(() => {
    const seen = new Map<string, StoredOutput>();
    for (const o of outputs) {
      if (!o.hasRichViz) continue;
      if (!seen.has(o.input)) {
        seen.set(o.input, o);
      }
    }
    return Array.from(seen.values());
  }, [outputs]);

  // Available types for filter pills
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    for (const o of deduped) types.add(o.type);
    return Array.from(types).sort();
  }, [deduped]);

  const filtered = typeFilter
    ? deduped.filter((o) => o.type === typeFilter)
    : deduped;

  if (deduped.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">
        No visualizable outputs yet. Run some MCP tool calls in the REPL first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Recent Outputs
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Type filter pills */}
      {availableTypes.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onFilterChange(null)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
              typeFilter === null
                ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]"
                : "border-[var(--color-surface-overlay)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            All
          </button>
          {availableTypes.map((t) => (
            <button
              key={t}
              onClick={() => onFilterChange(typeFilter === t ? null : t)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                typeFilter === t
                  ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]"
                  : "border-[var(--color-surface-overlay)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Output list */}
      <div className="space-y-1">
        {filtered.map((stored) => (
          <button
            key={stored.id}
            onClick={() => onSelect(stored)}
            className="w-full text-left px-3 py-2.5 rounded-lg border border-[var(--color-surface-overlay)] hover:bg-[var(--color-surface-overlay)]/50 hover:border-[var(--color-accent-blue)]/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TypeBadge type={stored.type} />
              <code className="text-xs font-mono text-[var(--color-accent-blue)] truncate flex-1">
                {stored.input}
              </code>
              <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                {timeAgo(stored.timestamp)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function VizRenderer({ output, input }: { output: StoredOutput; input: string }) {
  const result = parseResult(output.output, output.isError);

  switch (result.type) {
    case "tensor":
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <TensorExplorer tensor={result.data as never} />
        </div>
      );

    case "neuron":
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <NeuronGraphViz data={result.data as never} />
        </div>
      );

    case "autograd":
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <AutogradGraphViz data={result.data as never} input={input} />
        </div>
      );

    case "attention":
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <AttentionHeatmap data={result.data as never} />
        </div>
      );

    case "mlp":
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <MLPLayerViz data={result.data as never} />
        </div>
      );

    case "training":
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <TrainingHistoryViz data={result.data as never} />
        </div>
      );

    case "evaluation": {
      const ev = result.data as {
        predictions: { data: number[]; shape: number[] };
        loss?: number;
        accuracy?: number;
      };
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] font-mono font-semibold">
              evaluation
            </span>
          </div>
          {ev.accuracy !== undefined && ev.loss !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-base)] rounded-lg p-3">
                <div className="text-xs text-[var(--color-text-muted)]">Accuracy</div>
                <div className="text-2xl font-mono font-bold text-[var(--color-accent-emerald)]">
                  {(ev.accuracy * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-[var(--color-surface-base)] rounded-lg p-3">
                <div className="text-xs text-[var(--color-text-muted)]">Loss</div>
                <div className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                  {ev.loss.toFixed(4)}
                </div>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Predictions</h3>
            <div className="flex flex-wrap gap-2">
              {ev.predictions.data.map((val, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-[var(--color-surface-base)] text-center">
                  <div className="text-xs text-[var(--color-text-muted)]">Sample {i}</div>
                  <div className={`text-sm font-mono font-semibold ${val > 0.5 ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-text-muted)]"}`}>
                    {val.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "prediction": {
      const pred = result.data as { input: number[]; output: number[]; prediction: number };
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] font-mono font-semibold">
              prediction
            </span>
          </div>
          <div className="flex items-center gap-6 justify-center py-4">
            <div className="text-center">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Input</div>
              <div className="flex gap-2">
                {pred.input.map((v, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-[var(--color-surface-base)] font-mono text-sm text-[var(--color-accent-blue)]">
                    {v}
                  </div>
                ))}
              </div>
            </div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <div className="text-center">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Output</div>
              <div className="flex gap-2">
                {pred.output.map((v, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-[var(--color-surface-base)] font-mono text-sm text-[var(--color-accent-emerald)] font-semibold">
                    {v.toFixed(4)}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Prediction</div>
              <div className="px-4 py-2 rounded-lg bg-[var(--color-accent-emerald)]/20 font-mono text-2xl font-bold text-[var(--color-accent-emerald)]">
                {pred.prediction}
              </div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            Showing formatted data:
          </p>
          <pre className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      );
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
