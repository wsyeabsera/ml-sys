import { parseResult } from "../../lib/result-parser";
import TensorViz from "./TensorViz";
import AutogradViz from "./AutogradViz";

interface ReplOutputProps {
  output: string;
  isError: boolean;
}

export default function ReplOutput({ output, isError }: ReplOutputProps) {
  const result = parseResult(output, isError);

  switch (result.type) {
    case "empty":
      return null;

    case "tensor":
      return <TensorViz tensor={result.data as never} />;

    case "autograd":
      return <AutogradViz data={result.data as never} />;

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

    case "array":
    case "object":
      return (
        <pre className="whitespace-pre-wrap text-xs p-3 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] font-mono">
          {JSON.stringify(result.data, null, 2)}
        </pre>
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
