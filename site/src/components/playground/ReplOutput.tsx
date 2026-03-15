import { Link } from "react-router-dom";
import { parseResult } from "../../lib/result-parser";
import TensorViz from "./TensorViz";
import AutogradViz from "./AutogradViz";

interface ReplOutputProps {
  output: string;
  isError: boolean;
  outputId?: string | null;
  hasRichViz?: boolean;
}

export default function ReplOutput({ output, isError, outputId, hasRichViz }: ReplOutputProps) {
  const result = parseResult(output, isError);

  const vizLink = hasRichViz && outputId ? (
    <Link
      to={`/visualize?outputId=${outputId}`}
      className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--color-accent-blue)] hover:underline"
    >
      Open in Visualizer
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </Link>
  ) : null;

  switch (result.type) {
    case "empty":
      return null;

    case "tensor":
      return (
        <div>
          <TensorViz tensor={result.data as never} />
          {vizLink}
        </div>
      );

    case "autograd":
      return (
        <div>
          <AutogradViz data={result.data as never} />
          {vizLink}
        </div>
      );

    case "tensor_list": {
      const list = result.data as {
        op: string;
        count: number;
        tensors: { name: string; shape: number[]; num_elements: number }[];
      };
      if (list.count === 0) {
        return (
          <pre className="text-xs p-3 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]">
            No tensors stored.
          </pre>
        );
      }
      return (
        <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
          <div className="text-xs text-[var(--color-text-muted)]">
            {list.count} tensor{list.count !== 1 ? "s" : ""} in store:
          </div>
          {list.tensors.map((t) => (
            <div key={t.name} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[var(--color-accent-blue)]">"{t.name}"</span>
              <span className="text-[var(--color-text-muted)]">
                [{t.shape.join(" × ")}]
              </span>
              <span className="text-[var(--color-text-muted)]">
                ({t.num_elements} elements)
              </span>
            </div>
          ))}
        </div>
      );
    }

    case "tensor_scalar": {
      const scalar = result.data as {
        name: string;
        indices: number[];
        value: number;
      };
      return (
        <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 text-xs font-mono">
          <span className="text-[var(--color-accent-blue)]">"{scalar.name}"</span>
          <span className="text-[var(--color-text-muted)]">
            [{scalar.indices.join(", ")}]
          </span>
          <span className="text-[var(--color-text-primary)]"> = </span>
          <span className="text-[var(--color-accent-emerald)] text-sm font-semibold">
            {scalar.value}
          </span>
        </div>
      );
    }

    case "number":
      return (
        <pre className="text-xs p-3 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-accent-emerald)] font-mono text-sm font-semibold">
          {String(result.data)}
        </pre>
      );

    case "error":
      return (
        <pre
          className="whitespace-pre-wrap text-xs p-3 rounded-lg border-l-2"
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.15)",
            color: "#f43f5e",
            borderLeftColor: "#f43f5e",
          }}
        >
          {output}
        </pre>
      );

    case "attention": {
      const attn = result.data as { attention_weights: { shape: number[] }; output: { shape: number[] } };
      return (
        <div>
          <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] font-mono">
                attention
              </span>
              <span className="text-[var(--color-text-muted)]">
                {attn.attention_weights.shape[0]} tokens, weights [{attn.attention_weights.shape.join("x")}], output [{attn.output.shape.join("x")}]
              </span>
            </div>
          </div>
          {vizLink}
        </div>
      );
    }

    case "mlp": {
      const mlp = result.data as { output: { shape: number[] }; layers: { layer: number }[] };
      return (
        <div>
          <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono">
                mlp
              </span>
              <span className="text-[var(--color-text-muted)]">
                {mlp.layers.length} layers, output [{mlp.output.shape.join("x")}]
              </span>
            </div>
          </div>
          {vizLink}
        </div>
      );
    }

    case "training": {
      const train = result.data as { mlp: string; epochs: number; initial_loss: number; final_loss: number };
      return (
        <div>
          <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono">
                trained
              </span>
              <span className="text-[var(--color-text-muted)]">
                {train.epochs} epochs, loss: {train.initial_loss.toFixed(4)} → {train.final_loss.toFixed(4)}
              </span>
            </div>
          </div>
          {vizLink}
        </div>
      );
    }

    case "dataset": {
      const ds = result.data as { type: string; n_samples: number; input_name: string; target_name: string };
      return (
        <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] font-mono">
              dataset
            </span>
            <span className="text-[var(--color-text-muted)]">
              {ds.type} — {ds.n_samples} samples → "{ds.input_name}", "{ds.target_name}"
            </span>
          </div>
        </div>
      );
    }

    case "evaluation": {
      const ev = result.data as { predictions: { data: number[] }; loss?: number; accuracy?: number };
      const preds = ev.predictions.data.map(p => p.toFixed(2)).join(", ");
      return (
        <div>
          <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] font-mono">
                eval
              </span>
              <span className="text-[var(--color-text-muted)]">
                predictions: [{preds}]
                {ev.accuracy !== undefined ? ` — accuracy: ${(ev.accuracy * 100).toFixed(0)}%` : ""}
                {ev.loss !== undefined ? ` — loss: ${ev.loss.toFixed(4)}` : ""}
              </span>
            </div>
          </div>
          {vizLink}
        </div>
      );
    }

    case "prediction": {
      const pred = result.data as { input: number[]; output: number[]; prediction: number };
      return (
        <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 text-xs font-mono">
          <span className="text-[var(--color-text-muted)]">input</span>{" "}
          <span className="text-[var(--color-accent-blue)]">[{pred.input.join(", ")}]</span>
          <span className="text-[var(--color-text-muted)]"> → </span>
          <span className="text-[var(--color-accent-emerald)] text-sm font-semibold">
            {pred.output.map(v => v.toFixed(3)).join(", ")}
          </span>
          <span className="text-[var(--color-text-muted)]"> (prediction: {pred.prediction})</span>
        </div>
      );
    }

    case "neuron": {
      const neuron = result.data as { output: number; inputs: { value: number }[] };
      return (
        <div>
          <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono">
                neuron
              </span>
              <span className="text-[var(--color-text-muted)]">
                {neuron.inputs.length} inputs, out = tanh(sum(x*w) + b) = {neuron.output.toFixed(4)}
              </span>
            </div>
          </div>
          {vizLink}
        </div>
      );
    }

    case "array":
    case "object":
      return (
        <div>
          <pre className="whitespace-pre-wrap text-xs p-3 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] font-mono">
            {JSON.stringify(result.data, null, 2)}
          </pre>
          {vizLink}
        </div>
      );

    case "string":
    default:
      return (
        <pre className="whitespace-pre-wrap text-xs p-3 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
          {output}
        </pre>
      );
  }
}
