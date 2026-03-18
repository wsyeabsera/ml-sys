import { motion } from "framer-motion";

const nodes = [
  { id: "claude", label: "Claude Code", x: 80, y: 100, color: "var(--color-accent-blue)" },
  { id: "stdio", label: "stdin/stdout", x: 280, y: 100, color: "var(--color-text-muted)" },
  { id: "mcp", label: "MCP Binary", x: 480, y: 100, color: "var(--color-accent-emerald)" },
  { id: "server", label: "TensorServer", x: 480, y: 220, color: "var(--color-accent-amber)" },
  { id: "store", label: "HashMap<String, Tensor>", x: 480, y: 340, color: "var(--color-accent-rose)" },
];

const arrows = [
  { from: "claude", to: "stdio" },
  { from: "stdio", to: "mcp" },
  { from: "mcp", to: "server" },
  { from: "server", to: "store" },
];

export default function DataFlowDiagram() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 overflow-x-auto">
      <svg width="620" height="400" viewBox="0 0 620 400" className="mx-auto">
        {/* Arrows */}
        {arrows.map((arrow, i) => {
          const from = nodes.find((n) => n.id === arrow.from)!;
          const to = nodes.find((n) => n.id === arrow.to)!;
          return (
            <motion.g key={i}>
              <motion.line
                x1={from.x + 65}
                y1={from.y}
                x2={to.x - 65}
                y2={to.y}
                stroke="var(--color-surface-overlay)"
                strokeWidth={2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              />
              {/* Animated packet */}
              <motion.circle
                r={4}
                fill="var(--color-accent-blue)"
                initial={{ cx: from.x + 65, cy: from.y, opacity: 0 }}
                animate={{
                  cx: [from.x + 65, to.x - 65],
                  cy: [from.y, to.y],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  delay: 1 + i * 0.3,
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </motion.g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <rect
              x={node.x - 60}
              y={node.y - 22}
              width={120}
              height={44}
              rx={8}
              fill="var(--color-surface-raised)"
              stroke={node.color}
              strokeWidth={1.5}
            />
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-text-primary)"
              fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {node.label}
            </text>
          </motion.g>
        ))}

        {/* Protocol labels */}
        <text x={180} y={82} textAnchor="middle" fill="var(--color-text-muted)" fontSize={9} fontFamily="var(--font-mono)">
          JSON-RPC
        </text>
        <text x={480} y={165} textAnchor="middle" fill="var(--color-text-muted)" fontSize={9} fontFamily="var(--font-mono)">
          Arc{"<Mutex<...>>"}
        </text>
      </svg>
    </div>
  );
}
