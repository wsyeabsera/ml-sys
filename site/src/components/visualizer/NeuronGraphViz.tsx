interface NeuronData {
  output: number;
  output_grad: number;
  bias: { value: number; grad: number };
  inputs: { value: number; grad: number }[];
  weights: { value: number; grad: number }[];
}

export default function NeuronGraphViz({ data }: { data: NeuronData }) {
  const numInputs = data.inputs.length;
  const products = data.inputs.map((x, i) => x.value * data.weights[i].value);
  const sum = products.reduce((a, b) => a + b, 0);
  const preActivation = sum + data.bias.value;

  // Layout constants — spread things out more
  const nodeW = 100;
  const nodeH = 44;
  const smallW = 70;
  const smallH = 28;
  const rowGap = 100; // more vertical space between input rows
  const startX = 20;
  const startY = 20;

  // Column X positions
  const colInput = startX;
  const colWeight = colInput + nodeW + 10;
  const colProduct = colWeight + smallW + 30;
  const colSum = colProduct + nodeW + 50;
  const colBias = colSum + nodeW + 50;
  const colOutput = colBias + nodeW + 50;

  // Row Y positions for inputs
  const totalInputHeight = (numInputs - 1) * rowGap;
  const inputStartY = startY + 20;
  const midY = inputStartY + totalInputHeight / 2;

  const svgWidth = colOutput + nodeW + 30;
  const svgHeight = Math.max(inputStartY + totalInputHeight + nodeH + 60, midY + 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono font-semibold">
          neuron
        </span>
        <span className="text-[var(--color-text-muted)]">
          out = tanh(sum(x·w) + b) = {data.output.toFixed(4)}
        </span>
      </div>

      {/* Graph */}
      <div className="overflow-x-auto bg-[var(--color-surface-base)] rounded-xl p-4">
        <svg width={svgWidth} height={svgHeight}>
          {data.inputs.map((x, i) => {
            const y = inputStartY + i * rowGap;
            const w = data.weights[i];
            const prod = products[i];

            return (
              <g key={i}>
                {/* Input node */}
                <GraphNode x={colInput} y={y} w={nodeW} h={nodeH}
                  label={`x${i}`} value={fmt(x.value)} sublabel={`grad: ${fmtGrad(x.grad)}`}
                  color="#3b82f6" />

                {/* Weight node (below input) */}
                <GraphNode x={colWeight} y={y + nodeH + 4} w={smallW} h={smallH}
                  label={`w${i}`} value={fmt(w.value)}
                  color="#f59e0b" small />

                {/* Edge: input → product */}
                <Edge x1={colInput + nodeW} y1={y + nodeH / 2}
                      x2={colProduct} y2={y + nodeH / 2} />
                {/* Edge: weight → product */}
                <Edge x1={colWeight + smallW} y1={y + nodeH + 4 + smallH / 2}
                      x2={colProduct} y2={y + nodeH / 2 + 8} dashed />

                {/* Product node */}
                <GraphNode x={colProduct} y={y} w={nodeW} h={nodeH}
                  label="multiply" value={fmt(prod)}
                  color="#f59e0b" />

                {/* Edge: product → sum */}
                <Edge x1={colProduct + nodeW} y1={y + nodeH / 2}
                      x2={colSum} y2={midY + nodeH / 2} />
              </g>
            );
          })}

          {/* Sum node */}
          <GraphNode x={colSum} y={midY} w={nodeW} h={nodeH}
            label="sum" value={fmt(sum)}
            color="#f59e0b" />

          {/* Edge: sum → bias add */}
          <Edge x1={colSum + nodeW} y1={midY + nodeH / 2}
                x2={colBias} y2={midY + nodeH / 2} />

          {/* Bias node (below the add node) */}
          <GraphNode x={colBias + 15} y={midY + nodeH + 12} w={smallW} h={smallH}
            label="bias" value={fmt(data.bias.value)}
            color="#f59e0b" small />
          {/* Edge: bias → add */}
          <Edge x1={colBias + 15 + smallW / 2} y1={midY + nodeH + 12}
                x2={colBias + nodeW / 2} y2={midY + nodeH} dashed />

          {/* Bias add node */}
          <GraphNode x={colBias} y={midY} w={nodeW} h={nodeH}
            label="+ bias" value={fmt(preActivation)}
            color="#f59e0b" />

          {/* Edge: bias add → tanh */}
          <Edge x1={colBias + nodeW} y1={midY + nodeH / 2}
                x2={colOutput} y2={midY + nodeH / 2} />

          {/* Output (tanh) */}
          <GraphNode x={colOutput} y={midY} w={nodeW} h={nodeH}
            label="tanh" value={fmt(data.output)} sublabel={`grad: ${fmtGrad(data.output_grad)}`}
            color="#10b981" />
        </svg>
      </div>

      {/* Parameter table */}
      <div className="overflow-x-auto">
        <table className="text-xs font-mono w-full">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left pr-4 pb-2 font-medium">param</th>
              <th className="text-right pr-4 pb-2 font-medium">value</th>
              <th className="text-right pr-4 pb-2 font-medium">gradient</th>
              <th className="text-left pl-4 pb-2 font-medium">meaning</th>
            </tr>
          </thead>
          <tbody>
            {data.inputs.map((x, i) => (
              <tr key={`x${i}`} className="border-t border-[var(--color-surface-overlay)]">
                <td className="pr-4 py-1.5 text-[var(--color-accent-blue)]">x{i}</td>
                <td className="text-right pr-4 py-1.5">{x.value}</td>
                <td className="text-right pr-4 py-1.5"><GradVal v={x.grad} /></td>
                <td className="text-left pl-4 py-1.5 text-[var(--color-text-muted)]">input</td>
              </tr>
            ))}
            {data.weights.map((w, i) => (
              <tr key={`w${i}`} className="border-t border-[var(--color-surface-overlay)]">
                <td className="pr-4 py-1.5 text-[var(--color-accent-amber)]">w{i}</td>
                <td className="text-right pr-4 py-1.5">{w.value}</td>
                <td className="text-right pr-4 py-1.5"><GradVal v={w.grad} /></td>
                <td className="text-left pl-4 py-1.5 text-[var(--color-text-muted)]">
                  weight{w.grad !== 0 ? ` — lr=0.01 would adjust by ${fmt(-w.grad * 0.01)}` : ""}
                </td>
              </tr>
            ))}
            <tr className="border-t border-[var(--color-surface-overlay)]">
              <td className="pr-4 py-1.5 text-[var(--color-accent-amber)]">bias</td>
              <td className="text-right pr-4 py-1.5">{fmt(data.bias.value)}</td>
              <td className="text-right pr-4 py-1.5"><GradVal v={data.bias.grad} /></td>
              <td className="text-left pl-4 py-1.5 text-[var(--color-text-muted)]">
                bias{data.bias.grad !== 0 ? ` — lr=0.01 would adjust by ${fmt(-data.bias.grad * 0.01)}` : ""}
              </td>
            </tr>
            <tr className="border-t-2 border-[var(--color-surface-overlay)] font-semibold">
              <td className="pr-4 py-1.5 text-[var(--color-accent-emerald)]">output</td>
              <td className="text-right pr-4 py-1.5">{data.output.toFixed(4)}</td>
              <td className="text-right pr-4 py-1.5"><GradVal v={data.output_grad} /></td>
              <td className="text-left pl-4 py-1.5 text-[var(--color-text-muted)]">tanh(sum + bias)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GraphNode({
  x, y, w, h, label, value, sublabel, color, small,
}: {
  x: number; y: number; w: number; h: number;
  label: string; value: string; sublabel?: string;
  color: string; small?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
        fill={color} fillOpacity={0.2}
        stroke={color} strokeOpacity={0.4} strokeWidth={1} />
      <text x={x + w / 2} y={y + (small ? 11 : 15)} textAnchor="middle"
        fill="white" fontSize={small ? 10 : 11} fontWeight="600" fontFamily="monospace">
        {label}
      </text>
      <text x={x + w / 2} y={y + (small ? 23 : 30)} textAnchor="middle"
        fill="white" fillOpacity={0.8} fontSize={small ? 9 : 11} fontFamily="monospace">
        {value}
      </text>
      {sublabel && !small && (
        <text x={x + w / 2} y={y + 42} textAnchor="middle"
          fill="white" fillOpacity={0.5} fontSize={9} fontFamily="monospace">
          {sublabel}
        </text>
      )}
    </g>
  );
}

function Edge({
  x1, y1, x2, y2, dashed,
}: {
  x1: number; y1: number; x2: number; y2: number; dashed?: boolean;
}) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="white" strokeOpacity={0.2} strokeWidth={1}
      strokeDasharray={dashed ? "4 3" : undefined} />
  );
}

function GradVal({ v }: { v: number }) {
  return (
    <span className={v > 0 ? "text-[var(--color-accent-emerald)]" : v < 0 ? "text-rose-400" : "text-[var(--color-text-muted)]"}>
      {v > 0 ? "+" : ""}{v.toFixed(4)}
    </span>
  );
}

function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 10000) return String(n);
  if (Math.abs(n) < 0.001) return n.toExponential(2);
  return n.toFixed(2);
}

function fmtGrad(n: number): string {
  return (n > 0 ? "+" : "") + n.toFixed(3);
}
