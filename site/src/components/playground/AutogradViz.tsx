import { motion } from "framer-motion";

interface AutogradExprResult {
  values: { name: string; data: number; grad: number }[];
}

interface AutogradNeuronResult {
  output: number;
  output_grad: number;
  bias: { value: number; grad: number };
  inputs: { value: number; grad: number }[];
  weights: { value: number; grad: number }[];
}

type AutogradData = AutogradExprResult | AutogradNeuronResult;

export default function AutogradViz({ data }: { data: AutogradData }) {
  if ("values" in data) {
    return <ExprViz data={data} />;
  }
  return <NeuronViz data={data} />;
}

function ExprViz({ data }: { data: AutogradExprResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono">
          autograd
        </span>
        <span className="text-[var(--color-text-muted)]">
          {data.values.length} values
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs font-mono w-full">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left pr-4 pb-1 font-medium">name</th>
              <th className="text-right pr-4 pb-1 font-medium">value</th>
              <th className="text-right pb-1 font-medium">grad</th>
            </tr>
          </thead>
          <tbody>
            {data.values.map((v, i) => (
              <tr key={i} className="border-t border-[var(--color-surface-overlay)]">
                <td className="pr-4 py-1 text-[var(--color-accent-blue)]">
                  {v.name}
                </td>
                <td className="text-right pr-4 py-1 text-[var(--color-text-primary)]">
                  {formatNum(v.data)}
                </td>
                <td className="text-right py-1">
                  <span
                    className={
                      v.grad > 0
                        ? "text-[var(--color-accent-emerald)]"
                        : v.grad < 0
                          ? "text-[var(--color-accent-rose)]"
                          : "text-[var(--color-text-muted)]"
                    }
                  >
                    {v.grad > 0 ? "+" : ""}
                    {formatNum(v.grad)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function NeuronViz({ data }: { data: AutogradNeuronResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-raised)] rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono">
          neuron
        </span>
        <span className="text-[var(--color-text-muted)]">
          out = tanh(sum(x·w) + b) = {formatNum(data.output)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs font-mono w-full">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left pr-4 pb-1 font-medium">param</th>
              <th className="text-right pr-4 pb-1 font-medium">value</th>
              <th className="text-right pb-1 font-medium">grad</th>
            </tr>
          </thead>
          <tbody>
            {data.inputs.map((v, i) => (
              <tr key={`x${i}`} className="border-t border-[var(--color-surface-overlay)]">
                <td className="pr-4 py-1 text-[var(--color-accent-blue)]">x{i}</td>
                <td className="text-right pr-4 py-1 text-[var(--color-text-primary)]">{formatNum(v.value)}</td>
                <td className="text-right py-1"><GradSpan grad={v.grad} /></td>
              </tr>
            ))}
            {data.weights.map((v, i) => (
              <tr key={`w${i}`} className="border-t border-[var(--color-surface-overlay)]">
                <td className="pr-4 py-1 text-[var(--color-accent-amber)]">w{i}</td>
                <td className="text-right pr-4 py-1 text-[var(--color-text-primary)]">{formatNum(v.value)}</td>
                <td className="text-right py-1"><GradSpan grad={v.grad} /></td>
              </tr>
            ))}
            <tr className="border-t border-[var(--color-surface-overlay)]">
              <td className="pr-4 py-1 text-[var(--color-accent-amber)]">bias</td>
              <td className="text-right pr-4 py-1 text-[var(--color-text-primary)]">{formatNum(data.bias.value)}</td>
              <td className="text-right py-1"><GradSpan grad={data.bias.grad} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function GradSpan({ grad }: { grad: number }) {
  return (
    <span
      className={
        grad > 0
          ? "text-[var(--color-accent-emerald)]"
          : grad < 0
            ? "text-[var(--color-accent-rose)]"
            : "text-[var(--color-text-muted)]"
      }
    >
      {grad > 0 ? "+" : ""}
      {formatNum(grad)}
    </span>
  );
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  if (Math.abs(n) < 0.001) return n.toExponential(2);
  return n.toFixed(4);
}
