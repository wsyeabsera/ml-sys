import { motion } from "framer-motion";
import { useComputationGraph } from "../../hooks/useComputationGraph";
import { layoutGraph } from "../../lib/graph-layout";
import type { GraphNode, GraphEdge } from "../../data/autograd-examples";

export default function GradientFlow({
  nodes: rawNodes,
  edges,
  title,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  title: string;
}) {
  const graph = useComputationGraph(rawNodes, edges);
  const layout = layoutGraph(rawNodes, edges, { layerGap: 100, nodeGap: 110 });

  const nodeMap = new Map(layout.nodes.map((n) => [n.id, n]));

  const nodeColors = {
    leaf: "var(--color-accent-blue)",
    op: "var(--color-accent-amber)",
    output: "var(--color-accent-emerald)",
  };

  // Offset to center in SVG
  const ox = 300;
  const oy = 40;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h4>

      <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-4 overflow-x-auto">
        <svg width="600" height={layout.nodes.length > 6 ? 500 : 350} viewBox={`0 0 600 ${layout.nodes.length > 6 ? 500 : 350}`} className="mx-auto">
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap.get(edge.from)!;
            const to = nodeMap.get(edge.to)!;
            const isActive =
              graph.showGrads &&
              (graph.activeNodeId === edge.from || graph.activeNodeId === edge.to);

            return (
              <motion.line
                key={i}
                x1={from.x + ox}
                y1={from.y + oy + 20}
                x2={to.x + ox}
                y2={to.y + oy - 20}
                stroke={isActive ? "var(--color-accent-rose)" : "var(--color-surface-overlay)"}
                strokeWidth={isActive ? 2.5 : 1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            );
          })}

          {/* Nodes */}
          {layout.nodes.map((node) => {
            const isActive = graph.activeNodeId === node.id;
            const isRevealed =
              graph.showValues &&
              graph.forwardOrder.indexOf(node.id) <= graph.activeStep;

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Node circle */}
                <motion.circle
                  cx={node.x + ox}
                  cy={node.y + oy}
                  r={isActive ? 24 : 20}
                  fill="var(--color-surface-raised)"
                  stroke={nodeColors[node.type]}
                  strokeWidth={isActive ? 3 : 1.5}
                  animate={{
                    r: isActive ? 24 : 20,
                    strokeWidth: isActive ? 3 : 1.5,
                  }}
                />

                {/* Label */}
                <text
                  x={node.x + ox}
                  y={node.y + oy - 30}
                  textAnchor="middle"
                  fill="var(--color-text-secondary)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                >
                  {node.label}
                </text>

                {/* Value */}
                {(isRevealed || graph.phase === "backward" || graph.phase === "done") && (
                  <text
                    x={node.x + ox}
                    y={node.y + oy + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--color-text-primary)"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    {node.value.toFixed(2)}
                  </text>
                )}

                {/* Gradient */}
                {graph.showGrads && (
                  <motion.text
                    x={node.x + ox + 28}
                    y={node.y + oy - 10}
                    textAnchor="start"
                    fill="var(--color-accent-rose)"
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ∇{node.grad.toFixed(2)}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={graph.stepForward}
          disabled={graph.phase === "backward" || graph.phase === "done"}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent-blue)] text-white disabled:opacity-30 hover:brightness-110 transition-all"
        >
          Step Forward
        </button>
        <button
          onClick={graph.stepBackward}
          disabled={graph.phase === "idle" || graph.phase === "done"}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent-rose)] text-white disabled:opacity-30 hover:brightness-110 transition-all"
        >
          Step Backward
        </button>
        <button
          onClick={graph.reset}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] transition-all"
        >
          Reset
        </button>
      </div>

      <div className="text-center text-xs text-[var(--color-text-muted)] font-mono">
        {graph.phase === "idle" && "Click 'Step Forward' to compute values"}
        {graph.phase === "forward" && `Forward pass — computing node values (${graph.activeStep + 1}/${graph.forwardOrder.length})`}
        {graph.phase === "backward" && `Backward pass — propagating gradients (${graph.activeStep + 1}/${graph.backwardOrder.length})`}
        {graph.phase === "done" && "Done — all gradients computed!"}
      </div>
    </div>
  );
}
