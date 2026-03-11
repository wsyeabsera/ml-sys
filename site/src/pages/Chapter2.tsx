import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import TensorCubes from "../components/three/TensorCubes";
import ShapeExplorer from "../components/viz/ShapeExplorer";
import StrideCalculator from "../components/viz/StrideCalculator";
import StrideDiagram from "../components/three/StrideDiagram";
import MemoryLayoutViz from "../components/viz/MemoryLayoutViz";
import TransposeViz from "../components/viz/TransposeViz";
import StrideComputationViz from "../components/viz/StrideComputationViz";

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
            how to interpret them. That's it. Everything else — strides,
            transpose, reshape — is metadata tricks on top of flat memory.
          </motion.p>
        </div>

        {/* Analogy */}
        <InfoCard title="Think of it like..." accent="emerald">
          <p>
            Imagine a long strip of numbered boxes laid out on a table. That's
            your data — just numbers sitting in a line in memory. Now imagine
            someone hands you a cookie cutter — "cut this into 2 rows of 3."
            The boxes don't move, you just <em>look at them differently</em>. A
            different cookie cutter — "3 rows of 2" — same boxes, different
            grid. That's what shape does to data.
          </p>
          <p className="mt-2">
            This isn't just an analogy — it's literally how PyTorch, NumPy, and
            our Rust library work. The data is always flat. Shape is always
            interpretation.
          </p>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: What's Row-Major Order? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What's Row-Major Order?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Computers don't understand "rows" and "columns." Memory is a flat,
              one-dimensional sequence of bytes. When you write a 2D array, the
              language has to decide how to flatten it. There are two conventions:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Row-major</strong> (C, Rust, Python/NumPy): store row 0
                first, then row 1, then row 2...
              </li>
              <li>
                <strong>Column-major</strong> (Fortran, MATLAB, Julia): store
                column 0 first, then column 1...
              </li>
            </ul>
            <p>
              For the matrix{" "}
              <code>[[1,2,3],[4,5,6]]</code>, row-major stores{" "}
              <code>[1,2,3,4,5,6]</code> — the first row followed by the second.
              Column-major stores <code>[1,4,2,5,3,6]</code> — the first column
              followed by the second.
            </p>
            <p>
              Same logical data, different physical layout. This choice ripples
              through everything: which operations are fast, how strides work,
              and whether your code plays nice with CPU caches. We use row-major
              because that's what C, Rust, and NumPy use.
            </p>
          </div>
        </div>

        {/* Memory Layout Viz */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            See It: Row-Major vs Column-Major
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Toggle between layouts. Watch how the same flat data maps to
            different grid positions. Notice that in row-major, elements within
            the same row are neighbors in memory.
          </p>
          <MemoryLayoutViz />
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Tensor Struct */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Two Ingredients (Plus a Secret Third)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Every tensor has exactly two things you set, and one thing that's
              computed:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>data</strong> — a flat <code>Vec&lt;f32&gt;</code> in
                row-major order. This is the actual memory allocation. Whether
                your tensor is 1D, 5D, or 100D, the data is always a flat array.
              </li>
              <li>
                <strong>shape</strong> — a <code>Vec&lt;usize&gt;</code> that
                says how to slice the flat data into dimensions.{" "}
                <code>[2, 3]</code> means "interpret this as 2 rows of 3
                columns."
              </li>
              <li>
                <strong>strides</strong> — computed from shape. Strides tell you
                how many elements to skip when moving one step along each
                dimension. This is what makes reshape and transpose cheap (or
                free).
              </li>
            </ol>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub struct Tensor {
    pub data: Vec<f32>,      // [1, 2, 3, 4, 5, 6]  ← always flat
    pub shape: Vec<usize>,   // [2, 3] → 2 rows, 3 cols
    pub strides: Vec<usize>, // [3, 1] → computed from shape
}

// Indexing: element at [i, j] = data[i * strides[0] + j * strides[1]]
// For shape [2,3]: element [1,2] = data[1*3 + 2*1] = data[5] = 6`}
        />

        {/* ============================================================ */}
        {/* SECTION: Shape Changes Everything */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            See It: Shape Changes Everything
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Click through the shapes below and watch the same 6 numbers
              rearrange in 3D. Drag to rotate. Pay attention to the indices
              shown on each cube:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Shape [6]:</strong> All cubes in a line — this is how
                the data actually sits in memory. No interpretation, just raw
                flat data.
              </li>
              <li>
                <strong>Shape [2,3]:</strong> The cubes rearrange into 2 rows of
                3. But in memory, nothing moved. We just changed how we read the
                flat array — first 3 elements are row 0, next 3 are row 1.
              </li>
              <li>
                <strong>Shape [3,2]:</strong> Same 6 numbers, now 3 rows of 2.
                Notice element "4" is at position [1,0] in shape [2,3] but at
                position [1,1] in shape [3,2] — same data, different
                coordinates.
              </li>
            </ul>
          </div>
          <TensorCubes />
        </div>

        {/* 2D Shape Explorer */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Shape Explorer
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Same idea in 2D. Each colored box is an element — watch them
            smoothly rearrange as you pick different shapes. The index on each
            box tells you its coordinate in the tensor. The <em>color</em> never
            changes — it's tied to the element's flat position, proving the data
            doesn't move.
          </p>
          <ShapeExplorer />
        </div>

        {/* ============================================================ */}
        {/* SECTION: Strides Deep Dive */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Strides: The Secret Sauce
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Strides answer one question:{" "}
              <strong>
                if I move one step along dimension d, how many elements do I
                skip in the flat array?
              </strong>
            </p>
            <p>
              For a shape [2,3] tensor, the strides are [3,1]:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Moving one step along dim 0 (next row) skips{" "}
                <strong>3 elements</strong>. Why? Because each row has 3
                columns, so the next row starts 3 positions later.
              </li>
              <li>
                Moving one step along dim 1 (next column) skips{" "}
                <strong>1 element</strong>. Adjacent columns are adjacent in
                memory.
              </li>
            </ul>
          </div>
        </div>

        <InfoCard title="Worked example: 3D strides" accent="blue">
          <p className="mb-2">
            Shape <code>[2, 3, 4]</code> → strides <code>[12, 4, 1]</code>.
            Let's trace the logic:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Dim 2</strong> (innermost): stride = 1. Adjacent elements
              in the last dimension are adjacent in memory.
            </li>
            <li>
              <strong>Dim 1</strong>: stride = 4. Each step along dim 1 skips
              one "row" of 4 elements (the size of dim 2).
            </li>
            <li>
              <strong>Dim 0</strong> (outermost): stride = 12. Each step along
              dim 0 skips one entire "slice" of 3×4 = 12 elements.
            </li>
          </ul>
          <p className="mt-2">
            The pattern: <code>strides[i] = product of all dimensions after i</code>.
            The rightmost stride is always 1 (in row-major).
          </p>
        </InfoCard>

        {/* Stride Computation Animation */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            See It: How Strides Are Computed
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Pick a shape and click "Animate" to watch the formula{" "}
            <code>strides[i] = product(shape[i+1:])</code> computed step by
            step, from the rightmost dimension inward.
          </p>
          <StrideComputationViz />
        </div>

        {/* 3D Stride Diagram */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            See It: Stride Jumps in Memory
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Click the dimension buttons to see which elements each stride
            connects. When you select dim 0 (stride=3), notice the highlighted
            elements are 3 apart. Dim 1 (stride=1) highlights adjacent elements.
          </p>
          <StrideDiagram />
        </div>

        {/* Stride Calculator */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Try It: The Indexing Formula
          </h3>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The formula{" "}
              <code>flat_index = sum(indices[i] * strides[i])</code> converts
              multi-dimensional coordinates to a position in the flat array.
              This is the only math the CPU needs — no division, no modulo, just
              multiply-and-add. That's why it's fast.
            </p>
            <p>
              Type in a shape and indices to see the formula evaluated step by
              step. Try shape <code>2,3,4</code> with indices <code>1,2,3</code>{" "}
              to see how a 3D lookup works.
            </p>
          </div>
          <StrideCalculator />
        </div>

        {/* ============================================================ */}
        {/* SECTION: What Transpose Really Does */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Transpose Really Does
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Here's the punchline most tutorials skip:{" "}
              <strong>transpose doesn't move any data</strong>. It swaps the
              strides.
            </p>
            <p>
              Take a [2,3] tensor with strides [3,1]. Transpose it:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Shape becomes [3,2] (dimensions swap)
              </li>
              <li>
                Strides become [1,3] (strides swap)
              </li>
              <li>
                Data stays <code>[1,2,3,4,5,6]</code> — untouched
              </li>
            </ul>
            <p>
              This is a <strong>zero-copy operation</strong>. No allocation, no
              memcpy, just swapping two numbers in the metadata. That's why
              transpose is O(1) in NumPy and PyTorch.
            </p>
          </div>
        </div>

        <TransposeViz />

        <InfoCard title="Non-Contiguous: When Strides Go Wrong" accent="amber">
          <div className="space-y-2">
            <p>
              After transpose, strides are [1,3]. Moving along dim 0 jumps 1
              element (fine). But moving along dim 1 jumps <strong>3</strong>{" "}
              elements — you're leaping over data, not reading it
              sequentially.
            </p>
            <p>
              The data is now <strong>non-contiguous</strong>: the logical order
              of elements doesn't match their physical order in memory. The
              flat array hasn't changed, but our path through it has become
              scattered.
            </p>
            <p>
              <strong>Why does this matter?</strong> If you try to{" "}
              <code>reshape()</code> a non-contiguous tensor, the library can't
              just change the shape metadata — the data isn't laid out right.
              It has to allocate a new buffer and copy elements into contiguous
              order. That's called <em>materialization</em>, and it's expensive.
            </p>
            <p>
              In PyTorch, this is why you sometimes see{" "}
              <code>.contiguous()</code> before <code>.view()</code>. In NumPy,
              it's why <code>.reshape()</code> on a transposed array returns a
              copy, not a view.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Why Cache Lines Matter */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Why Cache Lines Matter
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              CPUs don't load one number at a time from RAM. They load{" "}
              <strong>cache lines</strong> — 64-byte chunks. Since a{" "}
              <code>f32</code> is 4 bytes, one cache line holds 16 floats.
            </p>
            <p>
              When you read <code>data[0]</code>, the CPU actually fetches{" "}
              <code>data[0]</code> through <code>data[15]</code> into the
              cache. If you then read <code>data[1]</code>, it's already
              there — <strong>cache hit</strong>, essentially free.
            </p>
            <p>
              But if you read <code>data[0]</code>, then <code>data[1000]</code>,
              then <code>data[1]</code>, then <code>data[1001]</code>... each
              access fetches a new cache line and evicts the old one —{" "}
              <strong>cache misses</strong> everywhere. This can be 10-100x
              slower for the same number of reads.
            </p>
          </div>
        </div>

        <InfoCard title="The Connection to Strides" accent="rose">
          <div className="space-y-2">
            <p>
              This is exactly why row-major order + row-wise access is fast.
              When you iterate over a [1000, 1000] matrix row by row:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Row-wise access on row-major data:</strong> stride = 1.
                Every element is adjacent in memory. The CPU prefetcher loads
                cache lines ahead of you. Nearly optimal.
              </li>
              <li>
                <strong>Column-wise access on row-major data:</strong> stride =
                1000. Every access jumps 1000 elements (4000 bytes = 62 cache
                lines). Every single read is a cache miss.
              </li>
            </ul>
            <p className="mt-1">
              Same data, same algorithm, same number of operations — but the
              column-wise version can be <strong>10x slower</strong> because of
              cache misses. This is why memory layout isn't an abstract concept.
              It's the foundation of fast numerical computing.
            </p>
          </div>
        </InfoCard>

        <InfoCard title="In Practice" accent="emerald">
          <div className="space-y-2">
            <p>
              When you multiply two matrices, the naive triple loop accesses one
              matrix row-wise and the other column-wise. That column-wise access
              is the bottleneck — it's why naive matmul is slow on large
              matrices.
            </p>
            <p>
              Every optimization (loop tiling, transposing B first, BLAS
              libraries, GPU shared memory) is fundamentally about fixing this
              access pattern to keep data in cache. Strides and memory layout are
              the reason all of these techniques exist.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* Key Takeaway */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            Key Takeaways
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A tensor is <em>not</em> a multidimensional array. It's a flat
              chunk of memory plus metadata (shape, strides) that gives it
              structure.
            </li>
            <li>
              <strong>Reshape</strong> changes the shape and recomputes strides.
              Zero-copy — data doesn't move.
            </li>
            <li>
              <strong>Transpose</strong> swaps the strides. Also zero-copy —
              but now the data is non-contiguous.
            </li>
            <li>
              <strong>Non-contiguous data</strong> means logical order doesn't
              match physical order. Reshaping a non-contiguous tensor forces a
              copy (materialization).
            </li>
            <li>
              <strong>Cache lines</strong> make sequential access fast and
              scattered access slow. Strides determine whether your access
              pattern is sequential or scattered.
            </li>
          </ul>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This separation of data from interpretation is the foundation
            everything else builds on — operations in Chapter 3, the MCP server
            in Chapter 4, and autograd in Chapter 5 all depend on these ideas.
          </p>
        </div>

        <ChapterNav current={2} />
      </div>
    </PageTransition>
  );
}
