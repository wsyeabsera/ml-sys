import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import TensorCubes from "../components/three/TensorCubes";
import ShapeExplorer from "../components/viz/ShapeExplorer";
import StrideCalculator from "../components/viz/StrideCalculator";
import StrideDiagram from "../components/three/StrideDiagram";

export default function Chapter2() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 02
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            What is a Tensor?
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            A tensor is just a flat array of numbers plus a shape that tells you
            how to interpret them. That's it. Everything else is convenience.
          </motion.p>
        </div>

        {/* The core idea */}
        <InfoCard title="The Two Ingredients" accent="blue">
          <p className="mb-2">
            Every tensor has exactly two things:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <strong>data</strong> — a flat <code>Vec&lt;f32&gt;</code> in row-major order
            </li>
            <li>
              <strong>shape</strong> — a <code>Vec&lt;usize&gt;</code> that says how to slice the data into dimensions
            </li>
          </ol>
        </InfoCard>

        <CodeBlock
          lang="rust"
          code={`pub struct Tensor {
    pub data: Vec<f32>,      // [1, 2, 3, 4, 5, 6]
    pub shape: Vec<usize>,   // [2, 3] → 2 rows, 3 cols
    pub strides: Vec<usize>, // [3, 1] → computed from shape
}`}
        />

        {/* 3D Visualization */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            See It: Shape Changes Everything
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            The same 6 numbers can be a flat list, a 2x3 matrix, or a 3x2 matrix.
            Click a shape and watch the cubes rearrange.
          </p>
          <TensorCubes />
        </div>

        {/* 2D Shape Explorer */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Shape Explorer
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Same data, different interpretations. Watch how the indices change
            as you reshape.
          </p>
          <ShapeExplorer />
        </div>

        {/* Strides */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Strides: The Secret Sauce
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Strides tell you how many elements to skip in memory when you move
            one step along each dimension. For shape [2,3], strides are [3,1] —
            moving to the next row skips 3 elements, moving to the next column skips 1.
          </p>
          <StrideDiagram />
        </div>

        {/* Stride Calculator */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Try It: The Indexing Formula
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            The formula <code>flat_index = sum(indices[i] * strides[i])</code> converts
            multi-dimensional indices to a position in the flat array. Type in a
            shape and indices to see it work.
          </p>
          <StrideCalculator />
        </div>

        {/* Why this matters */}
        <InfoCard title="Why This Matters at Scale" accent="amber">
          <p>
            Strides are why <code>transpose()</code> is free — you just swap
            the strides, no data copying. This is how NumPy and PyTorch achieve
            zero-copy views. When you reshape a transposed tensor, that's when
            you pay the cost (materialization).
          </p>
        </InfoCard>
      </div>
    </PageTransition>
  );
}
