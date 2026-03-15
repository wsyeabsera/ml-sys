interface TrainingData {
  op: string;
  mlp: string;
  epochs: number;
  initial_loss: number;
  final_loss: number;
  loss_history_sampled: number[];
  lr: number;
}

export default function TrainingHistoryViz({ data }: { data: TrainingData }) {
  const losses = data.loss_history_sampled;
  const maxLoss = Math.max(...losses);
  const minLoss = Math.min(...losses);

  const svgW = 600;
  const svgH = 250;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  // Build path
  const points = losses.map((loss, i) => {
    const x = padL + (i / (losses.length - 1)) * plotW;
    const y = padT + (1 - (loss - minLoss) / (maxLoss - minLoss || 1)) * plotH;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;

  // Y-axis labels
  const yLabels = [maxLoss, (maxLoss + minLoss) / 2, minLoss];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono font-semibold">
          training
        </span>
        <span className="text-[var(--color-text-muted)]">
          {data.mlp} — {data.epochs} epochs, lr={data.lr}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--color-surface-base)] rounded-lg p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Initial loss</div>
          <div className="text-lg font-mono font-semibold text-[var(--color-accent-rose)]">
            {data.initial_loss.toFixed(4)}
          </div>
        </div>
        <div className="bg-[var(--color-surface-base)] rounded-lg p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Final loss</div>
          <div className="text-lg font-mono font-semibold text-[var(--color-accent-emerald)]">
            {data.final_loss.toFixed(4)}
          </div>
        </div>
        <div className="bg-[var(--color-surface-base)] rounded-lg p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Reduction</div>
          <div className="text-lg font-mono font-semibold text-[var(--color-text-primary)]">
            {((1 - data.final_loss / data.initial_loss) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Loss curve */}
      <div className="bg-[var(--color-surface-base)] rounded-xl p-4">
        <svg width={svgW} height={svgH} className="w-full" viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Y-axis labels */}
          {yLabels.map((val, i) => {
            const y = padT + (i / (yLabels.length - 1)) * plotH;
            return (
              <g key={i}>
                <text x={padL - 8} y={y + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize={10} fontFamily="monospace">
                  {val.toFixed(3)}
                </text>
                <line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="white" strokeOpacity={0.05} />
              </g>
            );
          })}

          {/* X-axis */}
          <text x={padL} y={svgH - 8} fill="var(--color-text-muted)" fontSize={10} fontFamily="monospace">
            0
          </text>
          <text x={padL + plotW} y={svgH - 8} textAnchor="end" fill="var(--color-text-muted)" fontSize={10} fontFamily="monospace">
            {data.epochs}
          </text>
          <text x={padL + plotW / 2} y={svgH - 8} textAnchor="middle" fill="var(--color-text-muted)" fontSize={10}>
            epochs
          </text>

          {/* Loss curve */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Start and end dots */}
          <circle cx={padL} cy={padT + (1 - (losses[0] - minLoss) / (maxLoss - minLoss || 1)) * plotH} r={4} fill="#f43f5e" />
          <circle cx={padL + plotW} cy={padT + (1 - (losses[losses.length - 1] - minLoss) / (maxLoss - minLoss || 1)) * plotH} r={4} fill="#10b981" />

          {/* Axis labels */}
          <text x={8} y={padT + plotH / 2} textAnchor="middle" fill="var(--color-text-muted)" fontSize={10} transform={`rotate(-90, 8, ${padT + plotH / 2})`}>
            loss
          </text>
        </svg>
      </div>
    </div>
  );
}
