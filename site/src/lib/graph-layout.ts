import type { GraphNode, GraphEdge } from "../data/autograd-examples";

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

/**
 * Simple layered layout for DAGs.
 * Assigns each node to a layer based on longest path from roots,
 * then spaces nodes horizontally within each layer.
 */
export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: { layerGap?: number; nodeGap?: number } = {}
): { nodes: LayoutNode[]; edges: GraphEdge[] } {
  const { layerGap = 120, nodeGap = 100 } = options;

  // Build adjacency
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  for (const n of nodes) {
    children.set(n.id, []);
    parents.set(n.id, []);
  }
  for (const e of edges) {
    children.get(e.from)?.push(e.to);
    parents.get(e.to)?.push(e.from);
  }

  // Assign layers via longest path from roots
  const layers = new Map<string, number>();

  function assignLayer(id: string): number {
    if (layers.has(id)) return layers.get(id)!;
    const pars = parents.get(id) || [];
    const layer = pars.length === 0 ? 0 : Math.max(...pars.map(assignLayer)) + 1;
    layers.set(id, layer);
    return layer;
  }

  for (const n of nodes) assignLayer(n.id);

  // Group nodes by layer
  const maxLayer = Math.max(...layers.values());
  const layerGroups: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const [id, layer] of layers) {
    layerGroups[layer].push(id);
  }

  // Position nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const layoutNodes: LayoutNode[] = [];

  for (let layer = 0; layer <= maxLayer; layer++) {
    const group = layerGroups[layer];
    const totalWidth = (group.length - 1) * nodeGap;
    const startX = -totalWidth / 2;

    for (let i = 0; i < group.length; i++) {
      const node = nodeMap.get(group[i])!;
      layoutNodes.push({
        ...node,
        x: startX + i * nodeGap,
        y: layer * layerGap,
      });
    }
  }

  return { nodes: layoutNodes, edges };
}
