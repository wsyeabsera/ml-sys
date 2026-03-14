import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition";
import { loadOutput, listOutputs, type StoredOutput } from "../lib/db";
import { parseResult } from "../lib/result-parser";
import TensorViz from "../components/playground/TensorViz";
import AutogradViz from "../components/playground/AutogradViz";
import AttentionHeatmap from "../components/visualizer/AttentionHeatmap";
import AutogradGraphViz from "../components/visualizer/AutogradGraphViz";
import MLPLayerViz from "../components/visualizer/MLPLayerViz";
import TensorExplorer from "../components/visualizer/TensorExplorer";
import NeuronGraphViz from "../components/visualizer/NeuronGraphViz";

export default function Visualize() {
  const [searchParams] = useSearchParams();
  const [output, setOutput] = useState<StoredOutput | null>(null);
  const [recentOutputs, setRecentOutputs] = useState<StoredOutput[]>([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(true);

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

        {/* Recent outputs dropdown */}
        {!output && !loading && recentOutputs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Recent Outputs
            </h2>
            <div className="space-y-1">
              {recentOutputs
                .filter((o) => o.hasRichViz)
                .map((stored) => (
                  <button
                    key={stored.id}
                    onClick={() => selectOutput(stored)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-[var(--color-surface-overlay)] hover:bg-[var(--color-surface-overlay)]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono text-[var(--color-accent-blue)] truncate max-w-md">
                        {stored.input}
                      </code>
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
                        {timeAgo(stored.timestamp)}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {stored.type}
                    </span>
                  </button>
                ))}
              {recentOutputs.filter((o) => o.hasRichViz).length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">
                  No visualizable outputs yet. Run some MCP tool calls in the REPL first.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[var(--color-text-muted)]">
            Loading...
          </div>
        )}

        {/* No output selected */}
        {!loading && !output && recentOutputs.filter((o) => o.hasRichViz).length === 0 && (
          <div className="py-12 text-center space-y-2">
            <p className="text-[var(--color-text-muted)]">
              No output to visualize
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Run an MCP tool in the REPL and click "Open in Visualizer", or paste JSON above.
            </p>
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
                </p>
              </div>
              <button
                onClick={() => setOutput(null)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Close
              </button>
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

    default:
      return (
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            Rich visualization for this type ({result.type}) is coming soon. Showing formatted data:
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
