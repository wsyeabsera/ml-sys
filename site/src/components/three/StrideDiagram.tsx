import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox } from "@react-three/drei";
import { useMemo, useState } from "react";
import { computeStrides, flatToMultiIndex, shapeSize } from "../../lib/tensor-math";

function Cell({
  position,
  value,
  isHighlighted,
  isStrideJump,
}: {
  position: [number, number, number];
  value: number;
  isHighlighted: boolean;
  isStrideJump: boolean;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[0.85, 0.85, 0.15]} radius={0.06} smoothness={4}>
        <meshStandardMaterial
          color={isHighlighted ? "#3b82f6" : isStrideJump ? "#f59e0b" : "#1e293b"}
          emissive={isHighlighted ? "#3b82f6" : isStrideJump ? "#f59e0b" : "#000000"}
          emissiveIntensity={isHighlighted ? 0.5 : isStrideJump ? 0.3 : 0}
          transparent
          opacity={isHighlighted || isStrideJump ? 1 : 0.4}
        />
      </RoundedBox>
      <Text position={[0, 0, 0.1]} fontSize={0.25} color={isHighlighted ? "white" : "#94a3b8"} anchorX="center" anchorY="middle">
        {value}
      </Text>
    </group>
  );
}

export default function StrideDiagram() {
  const [dim, setDim] = useState(0); // which dimension's stride to highlight
  const shape = [2, 3];
  const data = [1, 2, 3, 4, 5, 6];
  const strides = computeStrides(shape);
  const size = shapeSize(shape);

  // Show which elements are `stride[dim]` apart
  const strideHighlights = useMemo(() => {
    const stride = strides[dim];
    const highlights = new Set<number>();
    for (let i = 0; i < size; i += stride) {
      highlights.add(i);
    }
    return highlights;
  }, [dim, strides, size]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <span className="text-xs text-[var(--color-text-muted)]">Highlight stride for dimension:</span>
        {shape.map((_, d) => (
          <button
            key={d}
            onClick={() => setDim(d)}
            className={`px-3 py-1 rounded-lg text-xs font-mono ${
              dim === d
                ? "bg-[var(--color-accent-amber)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
            }`}
          >
            dim {d} (stride={strides[d]})
          </button>
        ))}
      </div>

      <div className="h-[250px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] overflow-hidden">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} orthographic={false}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={0.5} />

          {/* Flat array row */}
          <group position={[-2.5, 0, 0]}>
            {data.map((v, i) => (
              <Cell
                key={i}
                position={[i * 1, 0, 0]}
                value={v}
                isHighlighted={strideHighlights.has(i)}
                isStrideJump={i > 0 && i % strides[dim] === 0}
              />
            ))}
          </group>

          <OrbitControls enableDamping />
        </Canvas>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] text-center font-mono">
        stride[{dim}] = {strides[dim]} — moving one step along dimension {dim} jumps {strides[dim]} element{strides[dim] > 1 ? "s" : ""} in memory
      </p>
    </div>
  );
}
