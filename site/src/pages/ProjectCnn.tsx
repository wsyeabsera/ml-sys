import { useState } from "react";
import { Link } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import PredictExercise from "../components/ui/PredictExercise";
import CodeBlock from "../components/ui/CodeBlock";

// ── Pattern preview component ────────────────────────────────────────────────

const PATTERNS: Record<string, number[][]> = {
  stripes_h: [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  stripes_v: [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
  ],
  checker: [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
  ],
  solid: [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
};

function PatternGrid({ pattern }: { pattern: number[][] }) {
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(8, 1.25rem)" }}>
      {pattern.flat().map((v, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-sm"
          style={{ background: v === 1 ? "var(--color-text-primary)" : "var(--color-surface-base)" }}
        />
      ))}
    </div>
  );
}

function PatternShowcase() {
  const [active, setActive] = useState<string>("stripes_h");
  const labels: Record<string, string> = {
    stripes_h: "Horizontal Stripes",
    stripes_v: "Vertical Stripes",
    checker:   "Checkerboard",
    solid:     "Solid",
  };

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.keys(PATTERNS).map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              active === key
                ? "bg-[var(--color-accent-blue)]/20 border border-[var(--color-accent-blue)]/40 text-[var(--color-accent-blue)]"
                : "bg-[var(--color-surface-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      <div className="flex items-start gap-6">
        <PatternGrid pattern={PATTERNS[active]} />
        <div className="text-xs text-[var(--color-text-muted)] space-y-1 font-mono">
          <p className="text-[var(--color-text-secondary)] font-sans font-medium">{labels[active]}</p>
          <p>8×8 pixels, grayscale</p>
          <p>1 = bright, 0 = dark</p>
          <p>shape: [1, 1, 8, 8]</p>
        </div>
      </div>
    </div>
  );
}

// ── Flat data helpers (for TryThis commands) ─────────────────────────────────

function flat(p: number[][]) {
  return p.flat().join(", ");
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectCnn() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono text-[var(--color-accent-emerald)]">
              Project 04
            </p>
            <Link
              to="/learn/10"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              ← Learn 10: Convolutions
            </Link>
          </div>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Pattern Hunter
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Four patterns. Four kernels. One question: can you design a filter
            that fires <em>only</em> on the pattern you're hunting? No training,
            no black box — just you and the math.
          </motion.p>
        </div>

        {/* ================================================================ */}
        {/* SETUP */}
        {/* ================================================================ */}
        <InfoCard title="What you're building" accent="emerald">
          <div className="space-y-2">
            <p>
              Four 8×8 synthetic images: horizontal stripes, vertical stripes,
              checkerboard, and solid. Your job is to design a 3×3 conv kernel
              that produces a <strong>high activation on one pattern</strong> and
              a low activation on all others.
            </p>
            <p>
              This is exactly what a trained CNN does — except the network learns
              its kernels from data. Here, you'll design them yourself. If you
              understand <em>why</em> your kernel works, you understand what every
              conv layer in every CNN on earth is actually doing.
            </p>
          </div>
        </InfoCard>

        {/* ================================================================ */}
        {/* STEP 1: Create the patterns */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] text-sm font-bold">1</span>
            <h2 className="text-2xl font-semibold">The Four Patterns</h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            Click through the patterns below — each one is a distinct visual
            structure. Think about what a 3×3 kernel would need to look like
            to fire specifically on each one before moving on.
          </p>
        </div>

        <PatternShowcase />

        <TryThis
          commands={[
            `// Load all four patterns into the tensor store`,
            `tensor_create("h_stripes", [${flat(PATTERNS.stripes_h)}], [1,1,8,8])`,
            `tensor_create("v_stripes", [${flat(PATTERNS.stripes_v)}], [1,1,8,8])`,
            `tensor_create("checker",   [${flat(PATTERNS.checker)}],   [1,1,8,8])`,
            `tensor_create("solid",     [${flat(PATTERNS.solid)}],     [1,1,8,8])`,
            `tensor_list()`,
          ]}
          label="Load all four patterns"
        />

        {/* ================================================================ */}
        {/* STEP 2: Design the horizontal stripe detector */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] text-sm font-bold">2</span>
            <h2 className="text-2xl font-semibold">Design the Horizontal Stripe Detector</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A horizontal stripe has <strong>entire rows</strong> that are all
              bright or all dark — the variation is top-to-bottom, not
              left-to-right. A kernel that detects this should:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Respond strongly when the top row of its window is bright and the bottom row is dark</li>
              <li>Produce a consistent signal across all columns (left-right symmetry)</li>
            </ul>
            <p>
              Before revealing the kernel — what values would you put in each
              row of a 3×3 kernel to detect a horizontal edge?
            </p>
          </div>
        </div>

        <PredictExercise
          question="Design a 3×3 kernel (flat, row by row) that fires strongly on horizontal stripes. The kernel sees: bright row, then dark row, then bright row. What values maximize the dot product for this pattern?"
          hint="For a bright-dark-bright input, you want the kernel's top weights to match bright (+), and middle weights to respond to darkness (−). The bottom row sees bright again, so..."
          answer="[1,1,1, -2,-2,-2, 1,1,1] — positive top row, negative middle, positive bottom"
          explanation="This kernel fires when the top and bottom thirds are bright and the middle is dark — exactly the horizontal stripe pattern. On a solid image, the +1 and -1 rows cancel out. On vertical stripes, the left-right variation cancels within each row. It's geometrically selective."
        />

        <TryThis
          commands={[
            `// The horizontal stripe detector`,
            `tensor_create("kern_h", [1,1,1, -2,-2,-2, 1,1,1], [1,1,3,3])`,
            `// Test on all four patterns — compare the output magnitudes`,
            `conv2d_forward("h_stripes", "kern_h", null, 1, 0, "out_h_on_h")`,
            `conv2d_forward("v_stripes", "kern_h", null, 1, 0, "out_h_on_v")`,
            `conv2d_forward("checker",   "kern_h", null, 1, 0, "out_h_on_c")`,
            `conv2d_forward("solid",     "kern_h", null, 1, 0, "out_h_on_s")`,
            `tensor_inspect("out_h_on_h")`,
          ]}
          label="Test the horizontal detector"
        />

        <InfoCard title="What to look for in the output" accent="blue">
          <div className="space-y-2">
            <p>
              Compare the output values across the four convolutions. For a good
              detector you want:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>High magnitude</strong> on horizontal stripes (the target)</li>
              <li><strong>Near zero</strong> on solid (uniform input → rows cancel)</li>
              <li><strong>Near zero</strong> on checkerboard (mixed → partial cancellation)</li>
              <li><strong>Different sign</strong> on vertical stripes (only column variation)</li>
            </ul>
            <p>
              Try <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">tensor_inspect</code> on the other three output tensors too.
            </p>
          </div>
        </InfoCard>

        {/* ================================================================ */}
        {/* STEP 3: Your turn — vertical stripes */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] text-sm font-bold">3</span>
            <h2 className="text-2xl font-semibold">Your Turn: Vertical Stripe Detector</h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            Vertical stripes vary left-to-right, not top-to-bottom. The columns
            alternate bright and dark; every row looks the same. Design a 3×3
            kernel that fires on this.
          </p>
        </div>

        <PredictExercise
          question="What 3×3 kernel detects vertical stripes? The pattern has bright columns on the left and right of any 3-wide window, and a dark column in the middle."
          hint="Think about rotating the horizontal detector 90°. What changes?"
          answer="[1,-2,1, 1,-2,1, 1,-2,1] — left column positive, middle negative, right positive"
          explanation="The columns define the pattern, so the kernel responds along columns. Each row of the kernel is identical: +1 -2 +1. On vertical stripes, every row of the input matches this pattern. On horizontal stripes, rows are uniform (all bright or all dark), so the columns don't vary and the kernel response averages to near zero."
        />

        <TryThis
          commands={[
            `tensor_create("kern_v", [1,-2,1, 1,-2,1, 1,-2,1], [1,1,3,3])`,
            `conv2d_forward("v_stripes", "kern_v", null, 1, 0, "out_v_on_v")`,
            `conv2d_forward("h_stripes", "kern_v", null, 1, 0, "out_v_on_h")`,
            `conv2d_forward("checker",   "kern_v", null, 1, 0, "out_v_on_c")`,
            `tensor_inspect("out_v_on_v")`,
            `tensor_inspect("out_v_on_h")`,
          ]}
          label="Test the vertical detector"
        />

        {/* ================================================================ */}
        {/* STEP 4: Checkerboard */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] text-sm font-bold">4</span>
            <h2 className="text-2xl font-semibold">The Checkerboard Detector</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              This one's harder. Checkerboard varies <em>both</em> horizontally
              and vertically — alternating in every direction. A kernel that
              detects it needs to respond to the specific diagonal alternation
              pattern.
            </p>
            <p>
              The key insight: any 3×3 window in a checkerboard has a fixed
              pattern — the four corners are one color, the four edges are the
              opposite, and the center is the same as the corners.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            `// The checkerboard detector mimics the pattern itself`,
            `// Corner/center = +1 (match bright), edge positions = -1 (match dark)`,
            `tensor_create("kern_c", [1,-1,1, -1,4,-1, 1,-1,1], [1,1,3,3])`,
            `conv2d_forward("checker",   "kern_c", null, 1, 0, "out_c_on_c")`,
            `conv2d_forward("h_stripes", "kern_c", null, 1, 0, "out_c_on_h")`,
            `conv2d_forward("v_stripes", "kern_c", null, 1, 0, "out_c_on_v")`,
            `conv2d_forward("solid",     "kern_c", null, 1, 0, "out_c_on_s")`,
            `tensor_inspect("out_c_on_c")`,
          ]}
          label="Test the checkerboard detector"
        />

        {/* ================================================================ */}
        {/* STEP 5: Build the CNN */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] text-sm font-bold">5</span>
            <h2 className="text-2xl font-semibold">Assemble the Classifier</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              You now have three hand-crafted kernels. A real CNN would have
              these as its first layer weights — learned, not designed. Let's
              initialize a CNN with 4 output channels and run the full forward
              pass to see how feature maps compose into a classification.
            </p>
            <p>
              Note what happens after <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">init_cnn</code>:
              the conv weights start random. The forward pass will produce
              garbage output — that's the point. Compare it to the hand-crafted
              kernels you just built to feel the difference between random and
              structured.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`// What the CNN architecture looks like internally:
// Input:    [1, 1, 8, 8]
// Conv2d:   [1, 4, 6, 6]  (4 filters, no padding → 8-3+1 = 6)
// ReLU:     [1, 4, 6, 6]
// MaxPool:  [1, 4, 3, 3]  (2×2 pool → 6/2 = 3)
// Flatten:  [1, 36]
// Linear:   [1, 4]        (4 classes: h_stripe, v_stripe, checker, solid)`}
        />

        <TryThis
          commands={[
            `init_cnn([`,
            `  {"type":"conv2d","in_channels":1,"out_channels":4,"kernel_size":3,"padding":0},`,
            `  {"type":"relu"},`,
            `  {"type":"max_pool2d","kernel_size":2,"stride":2},`,
            `  {"type":"flatten"},`,
            `  {"type":"linear","in":36,"out":4}`,
            `], "hunter")`,
          ]}
          label="Initialize the Pattern Hunter CNN"
        />

        <TryThis
          commands={[
            `// Run all four patterns through the untrained CNN`,
            `cnn_forward("hunter", "h_stripes")`,
          ]}
          label="Forward pass: horizontal stripes (random weights)"
        />

        <TryThis
          commands={[
            `cnn_forward("hunter", "checker")`,
          ]}
          label="Forward pass: checkerboard (random weights)"
        />

        {/* ================================================================ */}
        {/* STEP 6: The Insight */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] text-sm font-bold">6</span>
            <h2 className="text-2xl font-semibold">The Insight</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              You just did manually what a CNN does automatically during training.
              The difference: training adjusts kernel weights thousands of times,
              nudging them via gradient descent until they reliably fire on the
              right patterns.
            </p>
            <p>
              Your hand-crafted kernels work because you understood the problem.
              A trained CNN's kernels work for the same reason — they've
              implicitly learned the same geometric understanding, just from
              examples instead of reasoning.
            </p>
            <p>
              In a deep CNN, later layers build on top of these early detectors.
              Layer 2 kernels see feature maps (not pixels), so they can detect
              things like "horizontal edge above a vertical edge" — which is the
              corner of a shape. Layer 3 can detect shapes composed of corners.
              Depth = abstraction.
            </p>
          </div>
        </div>

        <InfoCard title="What trained conv weights actually look like" accent="blue">
          <div className="space-y-2">
            <p>
              When you visualize the first-layer kernels of a CNN trained on
              real images (like AlexNet or VGG), you see:
              edge detectors at various angles, color gradients, blob detectors.
              Not random noise — structured, interpretable filters. Exactly like
              the ones you just designed.
            </p>
            <p>
              This isn't a coincidence. The math forces it: to minimize loss on
              natural images, the first layer <em>must</em> learn to detect
              low-level structure. The network re-discovers edge detection, which
              humans independently coded into image processing algorithms in the
              1980s. Gradient descent finds the same solution.
            </p>
          </div>
        </InfoCard>

        {/* ================================================================ */}
        {/* BONUS CHALLENGES */}
        {/* ================================================================ */}
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Bonus Challenges
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <div className="space-y-1">
              <p className="font-medium text-[var(--color-text-primary)]">
                Challenge 1: Design a solid detector
              </p>
              <p>
                What kernel fires strongly on a solid image but weakly on
                everything else? Hint: a solid image has no variation at all —
                every adjacent pixel is the same. What does that mean for a
                kernel that looks for differences?
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-[var(--color-text-primary)]">
                Challenge 2: Max pooling the feature maps
              </p>
              <p>
                Run <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">max_pool2d</code> on
                your <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">out_h_on_h</code> output.
                What does the pooled activation look like? Does it preserve the
                "horizontal stripes were present" information?
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-[var(--color-text-primary)]">
                Challenge 3: Global average pool as a classifier
              </p>
              <p>
                Stack your three detectors as a 3-channel feature map using
                <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">global_avg_pool</code>.
                Each channel represents "how much of pattern X appeared anywhere
                in the image." Can you see how this becomes a feature vector for
                a linear classifier?
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-[var(--color-text-primary)]">
                Challenge 4: Break your own detector
              </p>
              <p>
                Create a slightly noisy horizontal stripe image — flip a few
                pixels to 0 in the bright rows. At what point does your hand-
                crafted detector stop working? A trained CNN handles noise
                because it learns slightly different weights that generalize.
                Try to make your kernel more robust to noise.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* WHAT YOU LEARNED */}
        {/* ================================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-emerald)]">
            What You Just Learned
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A convolution kernel is a <strong>pattern template</strong>. High
              dot product = pattern present. Low = pattern absent.
            </li>
            <li>
              You can design kernels <strong>analytically</strong> by asking
              "what does the pattern look like inside a 3×3 window?" Training
              does the same thing, automatically, from examples.
            </li>
            <li>
              The same kernel applied to different patterns produces <strong>
              different magnitudes</strong> — that's what makes it a feature
              detector.
            </li>
            <li>
              A CNN's conv layer is a bank of these detectors running in
              parallel. The output — the feature map stack — is the network's
              "interpretation" of what's in the image.
            </li>
            <li>
              Pooling <strong>summarizes</strong> the feature map. Global average
              pooling collapses "where" into just "how much" — a natural feature
              vector for a classifier.
            </li>
          </ul>
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-surface-overlay)]">
          <Link
            to="/learn/10"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ← Back to Learn 10: Convolutions
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
