import { useState, useCallback } from "react";
import type { GraphNode, GraphEdge } from "../data/autograd-examples";

type Phase = "idle" | "forward" | "backward" | "done";

export function useComputationGraph(
  initialNodes: GraphNode[],
  edges: GraphEdge[]
) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [showValues, setShowValues] = useState(false);
  const [showGrads, setShowGrads] = useState(false);

  // Forward order: topological sort (parents before children)
  const forwardOrder = topologicalSort(initialNodes, edges);
  // Backward order: reverse
  const backwardOrder = [...forwardOrder].reverse();

  const stepForward = useCallback(() => {
    setPhase("forward");
    setShowValues(true);
    setShowGrads(false);
    setActiveStep((prev) => {
      const next = prev + 1;
      if (next >= forwardOrder.length) {
        setPhase("backward");
        return -1;
      }
      return next;
    });
  }, [forwardOrder.length]);

  const stepBackward = useCallback(() => {
    setPhase("backward");
    setShowGrads(true);
    setActiveStep((prev) => {
      const next = prev + 1;
      if (next >= backwardOrder.length) {
        setPhase("done");
        return backwardOrder.length - 1;
      }
      return next;
    });
  }, [backwardOrder.length]);

  const reset = useCallback(() => {
    setPhase("idle");
    setActiveStep(-1);
    setShowValues(false);
    setShowGrads(false);
  }, []);

  const activeNodeId =
    phase === "forward"
      ? forwardOrder[activeStep]
      : phase === "backward"
        ? backwardOrder[activeStep]
        : null;

  return {
    phase,
    activeStep,
    activeNodeId,
    showValues,
    showGrads,
    stepForward,
    stepBackward,
    reset,
    forwardOrder,
    backwardOrder,
  };
}

function topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    children.set(n.id, []);
  }
  for (const e of edges) {
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    children.get(e.from)?.push(e.to);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  const result: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    for (const child of children.get(id) || []) {
      const deg = (inDegree.get(child) || 1) - 1;
      inDegree.set(child, deg);
      if (deg === 0) queue.push(child);
    }
  }

  return result;
}
