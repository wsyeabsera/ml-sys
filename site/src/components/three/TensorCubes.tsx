import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox } from "@react-three/drei";
import { useTensorShape } from "../../hooks/useTensorShape";
import { shapeExamples, defaultData } from "../../data/tensor-examples";
import { animated, useSpring } from "@react-spring/three";
import { useState } from "react";

function Cube({
  position,
  value,
  flatIndex,
  indices,
  isActive,
}: {
  position: [number, number, number];
  value: number;
  flatIndex: number;
  indices: number[];
  isActive: boolean;
}) {
  const spring = useSpring({
    position,
    scale: isActive ? 1.15 : 1,
    config: { mass: 1, tension: 200, friction: 20 },
  });

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4",
  ];
  const color = colors[flatIndex % colors.length];

  return (
    <animated.group position={spring.position as any} scale={spring.scale as any}>
      <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Value label */}
      <Text position={[0, 0, 0.46]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {value}
      </Text>
      {/* Index label */}
      <Text position={[0, -0.46, 0]} fontSize={0.15} color="#94a3b8" anchorX="center" anchorY="top" rotation={[-Math.PI / 2, 0, 0]}>
        [{indices.join(",")}]
      </Text>
    </animated.group>
  );
}

export default function TensorCubes() {
  const { elements, shape, setShape, strides } = useTensorShape(defaultData);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Shape selector */}
      <div className="flex flex-wrap gap-2">
        {shapeExamples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setShape(ex.shape)}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
              JSON.stringify(shape) === JSON.stringify(ex.shape)
                ? "bg-[var(--color-accent-blue)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
            }`}
          >
            [{ex.shape.join(",")}]
          </button>
        ))}
      </div>

      {/* Info bar */}
      <div className="flex gap-6 text-sm font-mono">
        <span className="text-[var(--color-text-muted)]">
          shape: <span className="text-[var(--color-accent-blue)]">[{shape.join(", ")}]</span>
        </span>
        <span className="text-[var(--color-text-muted)]">
          strides: <span className="text-[var(--color-accent-emerald)]">[{strides.join(", ")}]</span>
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="h-[400px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] overflow-hidden">
        <Canvas camera={{ position: [3, 3, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#3b82f6" />

          {elements.map((el) => (
            <Cube
              key={el.flatIndex}
              position={el.position}
              value={el.value}
              flatIndex={el.flatIndex}
              indices={el.indices}
              isActive={hoveredIndex === el.flatIndex}
            />
          ))}

          <OrbitControls enableDamping dampingFactor={0.05} />
          <gridHelper args={[10, 10, "#1e293b", "#1e293b"]} position={[0, -1.5, 0]} />
        </Canvas>
      </div>

      {/* Flat data reference */}
      <div className="flex gap-1 items-center">
        <span className="text-xs text-[var(--color-text-muted)] mr-2">data:</span>
        {defaultData.map((v, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm font-mono cursor-pointer transition-all ${
              hoveredIndex === i
                ? "bg-[var(--color-accent-blue)] text-white scale-110"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
            }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
