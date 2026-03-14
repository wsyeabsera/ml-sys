import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import TryThis from "../components/ui/TryThis";
import TensorCubes from "../components/three/TensorCubes";
import ShapeExplorer from "../components/viz/ShapeExplorer";
import StrideCalculator from "../components/viz/StrideCalculator";
import StrideDiagram from "../components/three/StrideDiagram";
import MemoryLayoutViz from "../components/viz/MemoryLayoutViz";
import TransposeViz from "../components/viz/TransposeViz";
import StrideComputationViz from "../components/viz/StrideComputationViz";
import LearnNav from "../components/ui/LearnNav";

export default function Chapter2() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 02
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Tensors — Spreadsheets That Got Too Ambitious
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Every AI model, every neural network, every "intelligent" thing a
            computer does — it all starts with a flat array of numbers and a
            sticky note that says "pretend this is 2D."
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="Here's the dirty secret of AI" accent="emerald">
          <div className="space-y-2">
            <p>
              A tensor is not some magical mathematical object. It's literally
              just a list of numbers. <code>[1, 2, 3, 4, 5, 6]</code>. That's it.
              The entire multi-billion-dollar AI industry is built on flat arrays
              with delusions of grandeur.
            </p>
            <p>
              The "magic" is a tiny piece of metadata called <strong>shape</strong>{" "}
              that says "hey, pretend this flat list is actually a 2x3 grid."
              The numbers don't move. Nothing gets rearranged. You just... squint
              differently.
            </p>
            <p>
              If that sounds too simple to be true — good. Let's prove it.
            </p>
          </div>
        </InfoCard>

        <TryThis
          commands={[
            'tensor_create("first", [1, 2, 3, 4, 5, 6], [6])',
            'tensor_create("matrix", [1, 2, 3, 4, 5, 6], [2, 3])',
            'tensor_create("also_matrix", [1, 2, 3, 4, 5, 6], [3, 2])',
          ]}
          label="Create the same data with 3 different shapes"
        />

        {/* ============================================================ */}
        {/* SECTION: Shape Changes Everything */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Same Data, Totally Different Vibes
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Click through the shapes below. The <em>same six numbers</em> will
              rearrange themselves into different grids. Drag to rotate in 3D.
              Notice how the colors stay the same? That's because the data hasn't
              moved — only your interpretation of it changed.
            </p>
            <p>
              This is the most important idea in this entire project:{" "}
              <strong>shape is just metadata</strong>. The flat array{" "}
              <code>[1,2,3,4,5,6]</code> is always the same six numbers sitting
              in the same six memory addresses. Shape is a lens you hold up to it.
            </p>
          </div>
          <TensorCubes />
        </div>

        <ShapeExplorer />

        {/* ============================================================ */}
        {/* SECTION: Memory Layout */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            How Computers Actually Store This Stuff
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Your computer's memory is a very long hallway of numbered rooms.
              Room 0, Room 1, Room 2... all the way to Room
              Several-Billion. There's no concept of "rows" or "columns" — just
              a line.
            </p>
            <p>
              So when you say "give me a 2x3 matrix," the computer has to
              decide: <em>do I put row 0 first, or column 0 first?</em>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Row-major</strong> (C, Rust, Python): row 0 first, then
                row 1. Like reading a book left-to-right, top-to-bottom.
              </li>
              <li>
                <strong>Column-major</strong> (Fortran, MATLAB): column 0 first,
                then column 1. Like reading a newspaper column-by-column.
              </li>
            </ul>
            <p>
              We use row-major. So does NumPy. So does PyTorch. If you ever wonder
              "why does this thing work in NumPy but give weird results in MATLAB?"
              — this is probably why.
            </p>
          </div>
          <MemoryLayoutViz />
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Struct */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Three Ingredients
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Every tensor in our Rust library (and in PyTorch, and in NumPy, and
              in TensorFlow, and in literally every tensor library ever written)
              has exactly three things:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>data</strong> — the flat array.{" "}
                <code>[1, 2, 3, 4, 5, 6]</code>. This is the actual memory.
                The stuff taking up space on your RAM. The important bit.
              </li>
              <li>
                <strong>shape</strong> — the sticky note. <code>[2, 3]</code>{" "}
                means "treat this as 2 rows of 3 columns." The sticky note is
                free to change — the data doesn't care.
              </li>
              <li>
                <strong>strides</strong> — the cheat sheet. Tells you "to move
                one step in dimension X, skip Y numbers in the flat array."
                Computed automatically from the shape. This is where the real
                magic lives.
              </li>
            </ol>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub struct Tensor {
    pub data: Vec<f32>,      // [1, 2, 3, 4, 5, 6]  ← always flat
    pub shape: Vec<usize>,   // [2, 3] → 2 rows, 3 cols
    pub strides: Vec<usize>, // [3, 1] → skip 3 for next row, 1 for next col
}

// Want element at row 1, col 2?
// flat_index = 1 * strides[0] + 2 * strides[1]
//            = 1 * 3 + 2 * 1
//            = 5
// data[5] = 6  ← boom, that's your answer`}
        />

        <TryThis
          commands={[
            'tensor_create("t", [1, 2, 3, 4, 5, 6], [2, 3])',
            'tensor_inspect("t")',
            'tensor_get_2d("t", 1, 2)',
          ]}
          label="Create a tensor and inspect its strides"
        />

        {/* ============================================================ */}
        {/* SECTION: Strides Deep Dive */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Strides: How to Navigate a Flat Array Like a Pro
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Here's the question strides answer: "I'm at some element.
              I want to move one step in dimension X. How many numbers do I
              hop over in the flat array?"
            </p>
            <p>
              For a <code>[2, 3]</code> tensor, strides are{" "}
              <code>[3, 1]</code>:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Next row?</strong> Skip 3. Because each row is 3
                elements long, duh.
              </li>
              <li>
                <strong>Next column?</strong> Skip 1. Columns are next-door
                neighbors in memory.
              </li>
            </ul>
            <p>
              The formula for any shape:{" "}
              <code>strides[i] = product of all dimensions after i</code>. The
              last dimension's stride is always 1 (because that's just "next door").
            </p>
          </div>
        </div>

        <InfoCard title="Pop quiz: what are the strides for shape [2, 3, 4]?" accent="blue">
          <div className="space-y-2">
            <p>
              Work backward from the right:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Dim 2</strong> (rightmost): stride = 1. Always.</li>
              <li><strong>Dim 1</strong>: stride = 4. Skip one "row" of 4 elements.</li>
              <li><strong>Dim 0</strong>: stride = 3 × 4 = 12. Skip an entire "slice."</li>
            </ul>
            <p className="mt-2">
              Answer: <code>[12, 4, 1]</code>. If you got that right, you
              understand strides better than most people who use PyTorch daily.
              Not even joking.
            </p>
          </div>
        </InfoCard>

        <StrideComputationViz />
        <StrideDiagram />
        <StrideCalculator />

        {/* ============================================================ */}
        {/* SECTION: Transpose */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Transpose: The Greatest Trick a Tensor Ever Pulled
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Most people think transpose rearranges data. It doesn't.{" "}
              <strong>Transpose doesn't move a single byte.</strong>
            </p>
            <p>
              Take a <code>[2, 3]</code> tensor with strides{" "}
              <code>[3, 1]</code>. Transpose it:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Shape: [2, 3] → [3, 2] (swap the dimensions)</li>
              <li>Strides: [3, 1] → [1, 3] (swap the strides)</li>
              <li>Data: unchanged. Not copied. Not touched. Same memory address.</li>
            </ul>
            <p>
              That's it. Two numbers get swapped in the metadata. The data sits
              there untouched, probably wondering what all the fuss is about.
              This is a <strong>zero-copy operation</strong> — it takes the same
              time whether your tensor has 6 numbers or 6 billion.
            </p>
          </div>
        </div>

        <TransposeViz />

        <TryThis
          commands={[
            'tensor_create("m", [1, 2, 3, 4, 5, 6], [2, 3])',
            'tensor_inspect("m")',
            'tensor_transpose("m", 0, 1, "m_T")',
            'tensor_inspect("m_T")',
          ]}
          label="Transpose a tensor and compare strides"
        />

        <InfoCard title="The catch: non-contiguous data" accent="amber">
          <div className="space-y-2">
            <p>
              After transpose, your strides are [1, 3]. Moving along dim 1 now
              jumps 3 elements — you're zigzagging through memory instead of
              reading it sequentially. The data is <strong>non-contiguous</strong>.
            </p>
            <p>
              This matters because: if you try to <code>reshape()</code> a
              non-contiguous tensor, the library can't just change the metadata.
              It has to actually copy the data into a new, contiguous layout. In
              PyTorch, this is why you sometimes need{" "}
              <code>.contiguous()</code> before <code>.view()</code>.
            </p>
            <p>
              It's also why column-wise access on row-major data is slow — you're
              hitting a different CPU cache line on every single read. More on
              that in a second.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Cache Lines */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Why Your CPU Hates Bad Strides
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Your CPU doesn't fetch one number at a time from RAM. That would be
              agonizingly slow (RAM is far away, like "other side of the city"
              far in CPU terms). Instead, it grabs a <strong>cache line</strong>{" "}
              — 64 bytes, which is 16 floats.
            </p>
            <p>
              So when you read <code>data[0]</code>, the CPU secretly grabs{" "}
              <code>data[0]</code> through <code>data[15]</code> and stashes
              them in a tiny, blazing-fast memory called the cache. If your next
              read is <code>data[1]</code> — already in cache. Free. Lightning
              fast. The CPU is basically psychic.
            </p>
            <p>
              But if your next read is <code>data[1000]</code>? That's in a
              completely different cache line. The CPU fetches a new 64-byte
              chunk, evicts the old one, and your <code>data[1]</code> is
              gone. Every. Single. Read. Is. Slow.
            </p>
          </div>
        </div>

        <InfoCard title="The punchline" accent="rose">
          <div className="space-y-2">
            <p>
              Iterating over a <code>[1000, 1000]</code> matrix:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Row by row</strong> (stride = 1): each element is right next
                to the previous one. Cache hit after cache hit. The CPU prefetcher
                is having the time of its life.
              </li>
              <li>
                <strong>Column by column</strong> (stride = 1000): each element is
                4000 bytes away. Every single read misses the cache. The CPU
                prefetcher has given up and is doom-scrolling.
              </li>
            </ul>
            <p className="mt-1">
              Same data. Same number of reads. <strong>10x speed difference.</strong>{" "}
              This is why memory layout isn't academic trivia — it's the single
              biggest factor in whether your ML code runs fast or makes you want
              to throw your laptop out a window.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
              Mini Project: Your First Matrix Multiplication
            </h2>
            <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <p>
                Time to get your hands dirty. You're going to create two matrices,
                multiply them together, and verify the result makes sense. This is
                the single most important operation in all of machine learning —
                literally every neural network is just matmuls all the way down.
              </p>
              <p>
                Here's what to do:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Create a 2x3 matrix <code>A</code> with values [1,2,3,4,5,6]</li>
                <li>Create a 3x2 matrix <code>B</code> with values [7,8,9,10,11,12]</li>
                <li>Multiply them: A (2x3) × B (3x2) = C (2x2)</li>
                <li>Inspect the result — you should get [[58, 64], [139, 154]]</li>
                <li>Now transpose B and try to multiply A × B_T. What happens? (Hint: it should fail — the shapes don't match!)</li>
              </ol>
            </div>
            <TryThis
              commands={[
                'tensor_create("A", [1,2,3,4,5,6], [2,3])',
                'tensor_create("B", [7,8,9,10,11,12], [3,2])',
                'tensor_matmul("A", "B", "C")',
                'tensor_inspect("C")',
              ]}
              label="Start the mini project"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* WHAT YOU BUILT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            What You Just Learned
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A tensor is a flat array + shape metadata. The data never moves —
              only your interpretation of it changes.
            </li>
            <li>
              <strong>Strides</strong> tell you how to navigate the flat array as
              if it were multidimensional. The formula:{" "}
              <code>flat_index = sum(indices[i] * strides[i])</code>.
            </li>
            <li>
              <strong>Transpose</strong> just swaps strides — zero copy, O(1),
              doesn't touch the data. But it makes the tensor non-contiguous.
            </li>
            <li>
              <strong>Cache lines</strong> make sequential access fast and
              scattered access slow. Good strides = fast code.
            </li>
            <li>
              You did a <strong>matrix multiplication</strong> — the most important
              operation in ML. Every neural network layer is basically this.
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* NEXT UP TEASER + NAV */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Coming up next...
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You can create tensors and multiply them. Cool. But how does a
            neural network <em>learn</em>? It needs to know "if I change this
            weight by a tiny bit, how much does the error change?" That's what
            gradients tell you — and autograd computes them automatically. No
            calculus required (mostly).
          </p>
        </div>

        <LearnNav current={2} />
      </div>
    </PageTransition>
  );
}
