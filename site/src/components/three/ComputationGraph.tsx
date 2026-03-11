import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useComputationGraph } from "../../hooks/useComputationGraph";
import { layoutGraph } from "../../lib/graph-layout";
import type { GraphNode, GraphEdge } from "../../data/autograd-examples";
import { animated, useSpring } from "@react-spring/three";

function GraphNodeSphere({
  node,
  x,
  y,
  isActive,
  showValue,
  showGrad,
}: {
  node: GraphNode;
  x: number;
  y: number;
  isActive: boolean;
  showValue: boolean;
  showGrad: boolean;
}) {
  const colors = {
    leaf: "#3b82f6",
    op: "#f59e0b",
    output: "#10b981",
  };

  const spring = useSpring({
    scale: isActive ? 1.4 : 1,
    emissiveIntensity: isActive ? 0.8 : 0.1,
    config: { tension: 300, friction: 20 },
  });

  const posX = x / 60;
  const posY = -y / 60;

  return (
    <animated.group position={[posX, posY, 0]} scale={spring.scale as any}>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <animated.meshStandardMaterial
          color={colors[node.type]}
          emissive={colors[node.type]}
          emissiveIntensity={spring.emissiveIntensity as any}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      {/* Label */}
      <Text position={[0, 0.5, 0]} fontSize={0.15} color="#94a3b8" anchorX="center">
        {node.label}
      </Text>
      {/* Value */}
      {showValue && (
        <Text position={[0, -0.45, 0]} fontSize={0.14} color="#f1f5f9" anchorX="center" fontWeight="bold">
          {node.value.toFixed(2)}
        </Text>
      )}
      {/* Gradient */}
      {showGrad && (
        <Text position={[0.5, 0.2, 0]} fontSize={0.12} color="#f43f5e" anchorX="left">
          {"∇" + node.grad.toFixed(2)}
        </Text>
      )}
    </animated.group>
  );
}

function GraphEdgeLine({
  from,
  to,
  isActive,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
}) {
  const points: [number, number, number][] = [
    [from.x / 60, -from.y / 60, 0],
    [to.x / 60, -to.y / 60, 0],
  ];

  return (
    <Line
      points={points}
      color={isActive ? "#f43f5e" : "#334155"}
      lineWidth={isActive ? 3 : 1.5}
    />
  );
}

export default function ComputationGraph3D({
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

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h4>

      <div className="h-[450px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] overflow-hidden">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.6} />
          <pointLight position={[-5, -5, 3]} intensity={0.3} color="#3b82f6" />

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap.get(edge.from)!;
            const to = nodeMap.get(edge.to)!;
            const isActive =
              graph.showGrads &&
              (graph.activeNodeId === edge.from || graph.activeNodeId === edge.to);
            return (
              <GraphEdgeLine
                key={i}
                from={from}
                to={to}
                isActive={isActive}
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
              <GraphNodeSphere
                key={node.id}
                node={node}
                x={node.x}
                y={node.y}
                isActive={isActive}
                showValue={isRevealed || graph.phase === "backward" || graph.phase === "done"}
                showGrad={graph.showGrads}
              />
            );
          })}

          <OrbitControls enableDamping dampingFactor={0.05} />
        </Canvas>
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
        {graph.phase === "idle" && "Click 'Step Forward' to compute values — drag to rotate in 3D"}
        {graph.phase === "forward" && `Forward pass (${graph.activeStep + 1}/${graph.forwardOrder.length})`}
        {graph.phase === "backward" && `Backward pass (${graph.activeStep + 1}/${graph.backwardOrder.length})`}
        {graph.phase === "done" && "All gradients computed!"}
      </div>
    </div>
  );
}
