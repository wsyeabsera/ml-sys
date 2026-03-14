import { useState } from "react";
import { motion } from "framer-motion";

interface AutogradValue {
  name: string;
  data: number;
  grad: number;
}

interface AutogradData {
  values: AutogradValue[];
}

export default function AutogradGraphViz({ data, input }: { data: AutogradData; input: string }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Try to parse ops from the input command to get edges
  const edges = parseEdgesFromInput(input);
  const values = data.values;

  // Classify nodes: leaves (no incoming edges) vs computed
  const computedNames = new Set(edges.map((e) => e.target));
  const leaves = values.filter((v) => !computedNames.has(v.name));
  const computed = values.filter((v) => computedNames.has(v.name));

  // Layout: leaves on the left, computed on the right, in order
  const nodePositions = new Map<string, { x: number; y: number }>();
  const colWidth = 180;
  const rowHeight = 70;

  // Leaves column
  leaves.forEach((v, i) => {
    nodePositions.set(v.name, { x: 40, y: 40 + i * rowHeight });
  });

  // Computed nodes in columns based on depth
  const depths = new Map<string, number>();
  function getDepth(name: string): number {
    if (depths.has(name)) return depths.get(name)!;
    const incoming = edges.filter((e) => e.target === name);
    if (incoming.length === 0) {
      depths.set(name, 0);
      return 0;
    }
    const maxParent = Math.max(...incoming.map((e) => getDepth(e.source)));
    const d = maxParent + 1;
    depths.set(name, d);
    return d;
  }
  computed.forEach((v) => getDepth(v.name));

  // Group computed by depth
  const depthGroups = new Map<number, AutogradValue[]>();
  computed.forEach((v) => {
    const d = depths.get(v.name) ?? 1;
    if (!depthGroups.has(d)) depthGroups.set(d, []);
    depthGroups.get(d)!.push(v);
  });

  const sortedDepths = [...depthGroups.keys()].sort((a, b) => a - b);
  sortedDepths.forEach((d, colIdx) => {
    const group = depthGroups.get(d)!;
    group.forEach((v, rowIdx) => {
      nodePositions.set(v.name, {
        x: 40 + (colIdx + 1) * colWidth,
        y: 40 + rowIdx * rowHeight + (leaves.length - group.length) * rowHeight / 2,
      });
    });
  });

  const maxGrad = Math.max(...values.map((v) => Math.abs(v.grad))) || 1;

  const svgWidth = 40 + (sortedDepths.length + 2) * colWidth;
  const svgHeight = Math.max(leaves.length, ...([...depthGroups.values()].map((g) => g.length))) * rowHeight + 80;

  const selected = values.find((v) => v.name === selectedNode);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] font-mono font-semibold">
          autograd
        </span>
        <span className="text-[var(--color-text-muted)]">
          {values.length} values, {edges.length} edges
        </span>
      </div>

      {/* Graph */}
      <div className="overflow-x-auto bg-[var(--color-surface-base)] rounded-xl p-4">
        <svg width={svgWidth} height={svgHeight} className="mx-auto">
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodePositions.get(edge.source);
            const to = nodePositions.get(edge.target);
            if (!from || !to) return null;
            const isSelected = selectedNode === edge.source || selectedNode === edge.target;
            return (
              <line
                key={i}
                x1={from.x + 50}
                y1={from.y + 20}
                x2={to.x}
                y2={to.y + 20}
                stroke={isSelected ? "var(--color-accent-blue)" : "var(--color-surface-overlay)"}
                strokeWidth={isSelected ? 2 : 1}
                opacity={isSelected ? 1 : 0.5}
              />
            );
          })}

          {/* Nodes */}
          {values.map((v) => {
            const pos = nodePositions.get(v.name);
            if (!pos) return null;
            const isLeaf = !computedNames.has(v.name);
            const isOutput = v === values[values.length - 1];
            const gradIntensity = Math.abs(v.grad) / maxGrad;
            const isSelected = selectedNode === v.name;

            const fillColor = isOutput
              ? "var(--color-accent-emerald)"
              : isLeaf
                ? "var(--color-accent-blue)"
                : "var(--color-accent-amber)";

            return (
              <motion.g
                key={v.name}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedNode(isSelected ? null : v.name)}
                className="cursor-pointer"
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={100}
                  height={40}
                  rx={8}
                  fill={fillColor}
                  fillOpacity={0.2 + gradIntensity * 0.4}
                  stroke={isSelected ? fillColor : fillColor}
                  strokeOpacity={isSelected ? 0.8 : 0.3}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x={pos.x + 50}
                  y={pos.y + 16}
                  textAnchor="middle"
                  fill="white"
                  fontSize={12}
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {v.name}
                </text>
                <text
                  x={pos.x + 50}
                  y={pos.y + 32}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={0.7}
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {v.data.toFixed(2)} | g={v.grad.toFixed(3)}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[var(--color-accent-blue)] opacity-50" /> Leaf (input)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[var(--color-accent-amber)] opacity-50" /> Operation
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[var(--color-accent-emerald)] opacity-50" /> Output
        </span>
        <span>Opacity = gradient magnitude</span>
      </div>

      {/* Selected node detail */}
      {selected && (
        <div className="bg-[var(--color-surface-base)] rounded-lg p-3 text-xs font-mono space-y-1">
          <div className="font-semibold text-[var(--color-text-primary)]">{selected.name}</div>
          <div>value = <span className="text-[var(--color-text-primary)]">{selected.data}</span></div>
          <div>
            gradient ={" "}
            <span className={selected.grad > 0 ? "text-[var(--color-accent-emerald)]" : selected.grad < 0 ? "text-rose-400" : "text-[var(--color-text-muted)]"}>
              {selected.grad > 0 ? "+" : ""}{selected.grad}
            </span>
          </div>
          {edges.filter((e) => e.target === selected.name).length > 0 && (
            <div className="text-[var(--color-text-muted)]">
              inputs: {edges.filter((e) => e.target === selected.name).map((e) => e.source).join(", ")}
              {" "}({edges.find((e) => e.target === selected.name)?.op})
            </div>
          )}
        </div>
      )}

      {/* Value table */}
      <div className="overflow-x-auto">
        <table className="text-xs font-mono w-full">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left pr-4 pb-1 font-medium">name</th>
              <th className="text-right pr-4 pb-1 font-medium">value</th>
              <th className="text-right pb-1 font-medium">gradient</th>
            </tr>
          </thead>
          <tbody>
            {values.map((v) => (
              <tr
                key={v.name}
                className={`border-t border-[var(--color-surface-overlay)] cursor-pointer ${selectedNode === v.name ? "bg-[var(--color-surface-overlay)]" : ""}`}
                onClick={() => setSelectedNode(selectedNode === v.name ? null : v.name)}
              >
                <td className="pr-4 py-1 text-[var(--color-accent-blue)]">{v.name}</td>
                <td className="text-right pr-4 py-1">{v.data}</td>
                <td className="text-right py-1">
                  <span className={v.grad > 0 ? "text-[var(--color-accent-emerald)]" : v.grad < 0 ? "text-rose-400" : "text-[var(--color-text-muted)]"}>
                    {v.grad > 0 ? "+" : ""}{v.grad.toFixed(4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Edge {
  source: string;
  target: string;
  op: string;
}

/**
 * Try to parse the ops from the autograd_expr input command.
 * Input looks like: autograd_expr([["a",2],["b",3]], [["d","mul","a","b"],["e","add","d","c"]], "e")
 */
function parseEdgesFromInput(input: string): Edge[] {
  try {
    // Parse the full autograd_expr call to extract the ops array (second arg)
    // Input: autograd_expr([values], [ops], "backward_from")
    // We need the ops array
    const argsMatch = input.match(/autograd_expr\s*\(([\s\S]+)\)/);
    if (!argsMatch) return [];
    // Parse as JSON array: [values, ops, backward_from]
    const allArgs = JSON.parse(`[${argsMatch[1]}]`);
    if (!Array.isArray(allArgs) || allArgs.length < 2) return [];
    const ops: string[][] = allArgs[1];
    const edges: Edge[] = [];
    for (const op of ops) {
      if (op.length >= 3) {
        const target = op[0];
        const opName = op[1];
        // op[2] and op[3] are the sources
        for (let i = 2; i < op.length; i++) {
          edges.push({ source: op[i], target, op: opName });
        }
      }
    }
    return edges;
  } catch {
    return [];
  }
}
