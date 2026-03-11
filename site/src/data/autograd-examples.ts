export interface GraphNode {
  id: string;
  label: string;
  value: number;
  grad: number;
  type: "leaf" | "op" | "output";
  op?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

/**
 * The classic neuron example: out = tanh(x1*w1 + x2*w2 + b)
 * x1=2, x2=0, w1=-3, w2=1, b=6.8814
 */
export const neuronGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    // Leaves
    { id: "x1", label: "x1", value: 2.0, grad: -1.5, type: "leaf" },
    { id: "x2", label: "x2", value: 0.0, grad: 0.5, type: "leaf" },
    { id: "w1", label: "w1", value: -3.0, grad: 1.0, type: "leaf" },
    { id: "w2", label: "w2", value: 1.0, grad: 0.0, type: "leaf" },
    { id: "b", label: "b", value: 6.8814, grad: 0.5, type: "leaf" },
    // Ops
    { id: "x1w1", label: "x1*w1", value: -6.0, grad: 0.5, type: "op", op: "mul" },
    { id: "x2w2", label: "x2*w2", value: 0.0, grad: 0.5, type: "op", op: "mul" },
    { id: "sum1", label: "x1w1+x2w2", value: -6.0, grad: 0.5, type: "op", op: "add" },
    { id: "sum2", label: "sum+b", value: 0.8814, grad: 0.5, type: "op", op: "add" },
    // Output
    { id: "out", label: "tanh", value: 0.7071, grad: 1.0, type: "output", op: "tanh" },
  ],
  edges: [
    { from: "x1", to: "x1w1" },
    { from: "w1", to: "x1w1" },
    { from: "x2", to: "x2w2" },
    { from: "w2", to: "x2w2" },
    { from: "x1w1", to: "sum1" },
    { from: "x2w2", to: "sum1" },
    { from: "sum1", to: "sum2" },
    { from: "b", to: "sum2" },
    { from: "sum2", to: "out" },
  ],
};

/** Gradient accumulation example: a used in two paths */
export const gradAccumulationGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: "a", label: "a", value: 2.0, grad: 4.0, type: "leaf" },
    { id: "b", label: "b", value: 3.0, grad: 2.0, type: "leaf" },
    { id: "c", label: "c = a*b", value: 6.0, grad: 1.0, type: "op", op: "mul" },
    { id: "d", label: "d = c+a", value: 8.0, grad: 1.0, type: "output", op: "add" },
  ],
  edges: [
    { from: "a", to: "c" },
    { from: "b", to: "c" },
    { from: "c", to: "d" },
    { from: "a", to: "d" },
  ],
};
