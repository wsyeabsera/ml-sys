import { useState } from "react";
import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import LearnNav from "../components/ui/LearnNav";
import TryThis from "../components/ui/TryThis";
import PredictExercise from "../components/ui/PredictExercise";

// ── Inline convolution visualizer ───────────────────────────────────────────
// Shows a 5×5 input, a 3×3 kernel sliding over it, and the output cell being
// computed. The user can click output cells to highlight which input region
// the kernel is "looking at."

const INPUT_5X5 = [
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1],
];

// A horizontal-edge-detecting kernel (Sobel-ish)
const KERNEL_3X3 = [
  [1,  2,  1],
  [0,  0,  0],
  [-1, -2, -1],
];

function computeConvOutput(input: number[][], kernel: number[][]): number[][] {
  const out: number[][] = [];
  for (let oh = 0; oh < 3; oh++) {
    const row: number[] = [];
    for (let ow = 0; ow < 3; ow++) {
      let sum = 0;
      for (let kh = 0; kh < 3; kh++) {
        for (let kw = 0; kw < 3; kw++) {
          sum += input[oh + kh][ow + kw] * kernel[kh][kw];
        }
      }
      row.push(Math.round(sum * 10) / 10);
    }
    out.push(row);
  }
  return out;
}

function ConvViz() {
  const [selected, setSelected] = useState<[number, number]>([0, 0]);
  const [oh, ow] = selected;
  const output = computeConvOutput(INPUT_5X5, KERNEL_3X3);

  const inRegion = (r: number, c: number) =>
    r >= oh && r < oh + 3 && c >= ow && c < ow + 3;

  const cellVal = (v: number) => {
    const abs = Math.abs(v);
    const opacity = Math.min(abs / 2, 1);
    return opacity;
  };

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-4">
      <p className="text-xs text-[var(--color-text-muted)] font-mono">
        Click any output cell to see which input region the kernel is reading
      </p>
      <div className="flex flex-wrap gap-8 items-start">
        {/* Input */}
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Input 5×5</p>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(5, 2rem)" }}>
            {INPUT_5X5.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-mono rounded transition-all ${
                    inRegion(r, c)
                      ? "bg-[var(--color-accent-blue)]/40 border border-[var(--color-accent-blue)] text-[var(--color-accent-blue)] font-bold"
                      : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kernel */}
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Kernel 3×3 (horizontal edge)</p>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(3, 2rem)" }}>
            {KERNEL_3X3.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-8 h-8 flex items-center justify-center text-xs font-mono rounded bg-[var(--color-accent-amber)]/20 border border-[var(--color-accent-amber)]/40 text-[var(--color-accent-amber)]"
                >
                  {val > 0 ? `+${val}` : val}
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] max-w-[9rem]">
            Top row +, bottom row −. Fires on horizontal edges.
          </p>
        </div>

        {/* Output */}
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Output 3×3</p>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(3, 2rem)" }}>
            {output.map((row, r) =>
              row.map((val, c) => {
                const isSelected = r === oh && c === ow;
                const opacity = cellVal(val);
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSelected([r, c])}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-mono rounded transition-all ${
                      isSelected
                        ? "ring-2 ring-[var(--color-accent-blue)] scale-110"
                        : ""
                    }`}
                    style={{
                      background: val > 0
                        ? `rgba(52, 211, 153, ${opacity})`
                        : val < 0
                        ? `rgba(251, 113, 133, ${opacity})`
                        : "var(--color-surface-base)",
                      color: opacity > 0.5 ? "#000" : "var(--color-text-secondary)",
                    }}
                  >
                    {val}
                  </button>
                );
              })
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Green = edge found, red = opposite edge
          </p>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">
        Output [{oh},{ow}] = sum of (highlighted region × kernel) ={" "}
        <span className="font-mono text-[var(--color-accent-blue)]">
          {output[oh][ow]}
        </span>
      </p>
    </div>
  );
}

// ── Main chapter ─────────────────────────────────────────────────────────────

export default function ChapterCnn() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 10
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Convolutions — Sliding Windows With Opinions
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Transformers read sequences. CNNs look at grids. The core operation
            — convolution — is a tiny kernel sliding across an image, asking "is
            this pattern here?" at every position. You've been building toward
            this for ten chapters. Now we go spatial.
          </motion.p>
        </div>

        {/* ================================================================ */}
        {/* HOOK */}
        {/* ================================================================ */}
        <InfoCard title="Why not just use a big MLP?" accent="amber">
          <div className="space-y-2">
            <p>
              You could flatten a 28×28 image into 784 numbers and feed it to an
              MLP. In fact, that's what people did in the 1980s. The problem: a
              fully-connected layer on 784 inputs needs 784 weights <em>per
              neuron</em> — and it treats pixel (0,0) as completely unrelated to
              pixel (0,1). It doesn't know they're neighbors.
            </p>
            <p>
              CNNs solve this with a different bias: <strong>nearby pixels are
              related</strong>, and <strong>the same pattern can appear
              anywhere</strong>. A kernel that detects a horizontal edge doesn't
              need to be retrained for every x,y position. It slides. Same
              weights, every position. That's the trick.
            </p>
          </div>
        </InfoCard>

        {/* ================================================================ */}
        {/* SECTION 1: The Sliding Window */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Sliding Window
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A <strong>kernel</strong> (or filter) is a small matrix — typically
              3×3 or 5×5 — filled with learned weights. Convolution slides this
              kernel across the input image, one position at a time. At each
              position, you compute a dot product: multiply the kernel weights by
              the corresponding input pixels, sum them up. The result is one
              number in the output feature map.
            </p>
            <p>
              The output is called a <strong>feature map</strong>: a 2D grid
              where each cell says "how strongly did the kernel's pattern appear
              at this position?" A high value means the pattern was there. A low
              or negative value means it wasn't.
            </p>
            <p>
              Click around in the visualizer below. The blue region in the input
              is the 3×3 window the kernel is currently reading.
            </p>
          </div>
        </div>

        <ConvViz />

        <PredictExercise
          question="In the visualizer above, the kernel has +1/+2/+1 in the top row and -1/-2/-1 in the bottom row. What does a large positive output at position [0,0] tell you about that region of the input?"
          hint="The kernel fires strongly when the top part of the window is bright (+) and the bottom part is dark (-)."
          answer="There's a horizontal edge there — bright pixels above, dark pixels below."
          explanation="This is a classic Sobel edge detector. Top weights are positive (light triggers them), bottom weights are negative (dark suppresses them). The difference between top and bottom brightness = horizontal edge strength. Convolution is literally just: does this local pattern match my kernel?"
        />

        {/* ================================================================ */}
        {/* SECTION 2: Multiple kernels = multiple feature maps */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            One Kernel = One Feature. You Want Many Features.
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              One kernel detects one kind of pattern. A conv layer usually has
              many kernels — 8, 32, 64, 512 — each one learning to detect
              something different. The output is a stack of feature maps,
              one per kernel. That's the <strong>channel dimension</strong>.
            </p>
            <p>
              Input shape is <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">[N, C_in, H, W]</code> —
              batch size, channels, height, width. Kernel shape is{" "}
              <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">[C_out, C_in, kH, kW]</code>.
              Each of the C_out kernels produces one output channel by convolving
              with all C_in input channels and summing. The output is{" "}
              <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">[N, C_out, H', W']</code>.
            </p>
            <p>
              In our Rust implementation — which you can read right now:
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`// For each output cell (batch, out_channel, out_h, out_w):
for co in 0..c_out {
    for oh in 0..out_h {
        for ow in 0..out_w {
            let mut acc = bias[co];            // start with bias
            for ci in 0..c_in {
                for khi in 0..kh {
                    for kwi in 0..kw {
                        // input pixel at (oh*stride + khi, ow*stride + kwi)
                        // × kernel weight at (co, ci, khi, kwi)
                        acc += input[n, ci, oh+khi, ow+kwi]
                             * kernel[co, ci, khi, kwi];
                    }
                }
            }
            output[n, co, oh, ow] = acc;
        }
    }
}`}
        />

        <InfoCard title="This is the naive implementation — intentionally" accent="blue">
          <p>
            Six nested loops. It's slow. Production libraries use something
            called im2col (reshape the input into a matrix, then do a single big
            matmul). Same result, ~10× faster. But the naive version is what the
            math says. Read this, understand it, <em>then</em> you'll appreciate
            why im2col is clever.
          </p>
        </InfoCard>

        <TryThis
          commands={[
            '// Create a tiny 1-channel 5×5 "image" — checkerboard pattern',
            'tensor_create("img", [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1], [1,1,5,5])',
            '// Create a horizontal-edge kernel',
            'tensor_create("kern", [1,2,1,0,0,0,-1,-2,-1], [1,1,3,3])',
            '// Convolve: 5×5 input, 3×3 kernel, stride=1, pad=0 → 3×3 output',
            'conv2d_forward("img", "kern", null, 1, 0, "feature_map")',
            'tensor_inspect("feature_map")',
          ]}
          label="Run your first conv2d"
        />

        {/* ================================================================ */}
        {/* SECTION 3: Stride and Padding */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Stride and Padding: Controlling Output Size
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              <strong>Stride</strong> controls how far the kernel jumps each
              step. Stride 1 = slide one pixel at a time. Stride 2 = skip every
              other position. Larger stride → smaller output → less compute.
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
{`out_H = (H + 2*padding - kernel_H) / stride + 1

Examples (H=8, kernel=3):
  stride=1, pad=0  → (8 + 0 - 3) / 1 + 1 = 6
  stride=2, pad=0  → (8 + 0 - 3) / 2 + 1 = 3  (roughly half)
  stride=1, pad=1  → (8 + 2 - 3) / 1 + 1 = 8  (same size!)`}
            </pre>
            <p>
              <strong>Padding</strong> adds zeros around the input border before
              convolving. With <code className="font-mono text-xs bg-[var(--color-surface-base)] rounded px-1">padding = kernel_size // 2</code>,
              the output has the same spatial size as the input. This is called
              "same" padding and is what you use when you don't want the feature
              map to shrink.
            </p>
          </div>
        </div>

        <PredictExercise
          question="You have a 28×28 image. You apply a 3×3 conv with stride=1, padding=0. What's the output size?"
          hint="out = (H + 2*pad - kernel) / stride + 1"
          answer="(28 + 0 - 3) / 1 + 1 = 26. Output is 26×26."
          explanation="Every conv without padding shrinks the output by (kernel_size - 1). A 3×3 kernel with no padding loses 2 pixels on each side. With padding=1, you'd get 28×28 out — same size as input. This is why PyTorch defaults to padding=0 but many architectures use padding=kernel//2."
        />

        <TryThis
          commands={[
            '// Same 5×5 image, but now with padding=1',
            '// Output should be the same size as input: 5×5',
            'tensor_create("img2", [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1], [1,1,5,5])',
            'tensor_create("kern2", [1,2,1,0,0,0,-1,-2,-1], [1,1,3,3])',
            'conv2d_forward("img2", "kern2", null, 1, 1, "padded_out")',
            'tensor_inspect("padded_out")',
          ]}
          label="Try padding=1 (same size output)"
        />

        {/* ================================================================ */}
        {/* SECTION 4: Pooling */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Pooling: Throwing Away Information on Purpose
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              After convolution, you usually downsample. The most common way:
              <strong> max pooling</strong>. Take a 2×2 window, keep only the
              maximum value, discard the rest. Move the window by 2. Output is
              half the spatial size.
            </p>
            <p>
              Why throw away information? Two reasons:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Compute:</strong> each pooling step halves H and W. By
                the time you've pooled 3 times in a 224×224 network, you're
                operating on 28×28. That's 64× fewer spatial positions to process.
              </li>
              <li>
                <strong>Translation invariance:</strong> if a feature shifts one
                pixel, the same max often wins in the pool window. The output
                doesn't change. The network becomes less sensitive to exact position.
              </li>
            </ul>
            <p>
              The argmax (which input pixel held the max) is stored during the
              forward pass because the backward pass needs to know where to route
              the gradient. Only the winner gets a gradient; all others get 0.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Max pooling" accent="emerald">
            <div className="space-y-2">
              <p>
                Picks the strongest activation in each window. Works well for
                detecting <em>whether</em> a feature is present somewhere in the
                region. The norm in CNNs for a long time.
              </p>
              <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">{`2×2 window:
[1, 3]   → 3
[5, 2]`}</pre>
            </div>
          </InfoCard>
          <InfoCard title="Average pooling" accent="blue">
            <div className="space-y-2">
              <p>
                Takes the mean. Smoother than max. Used in <em>global</em>
                average pooling at the end of a CNN — reduces the entire spatial
                map to one number per channel.
              </p>
              <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">{`2×2 window:
[1, 3]   → 2.75
[5, 2]`}</pre>
            </div>
          </InfoCard>
        </div>

        <TryThis
          commands={[
            '// Create a 4×4 feature map (1 batch, 1 channel)',
            'tensor_create("fmap", [1,3,2,4,5,6,7,8,9,2,3,1,0,4,5,6], [1,1,4,4])',
            '// 2×2 max pool with stride=2 → 2×2 output',
            'max_pool2d("fmap", 2, 2, "pooled")',
            'tensor_inspect("pooled")',
          ]}
          label="Try max pooling"
        />

        {/* ================================================================ */}
        {/* SECTION 5: Batch Norm */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Batch Normalization: Why Your CNN Trains 10× More Stably
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Deep CNNs have a problem: activations drift. After 20 conv layers,
              the values arriving at layer 21 might be wildly different than what
              layer 21 was initialized expecting. The gradient signal gets
              distorted. Training slows to a crawl or diverges.
            </p>
            <p>
              <strong>Batch normalization</strong> fixes this by normalizing each
              channel's activations across the batch before passing them forward:
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
{`For each channel c:
  μ  = mean(x[:, c, :, :])       // mean over batch + spatial
  σ² = var(x[:, c, :, :])
  x̂  = (x - μ) / √(σ² + ε)      // normalize to zero mean, unit variance
  y  = γ * x̂ + β                  // learnable scale and shift`}
            </pre>
            <p>
              γ (gamma) and β (beta) are learned per channel. This means the
              network can undo normalization if it needs to — it's not forced to
              output zero-mean unit-variance activations, it just <em>starts</em>
              there. The gradient flows more cleanly because each layer sees
              consistent statistics.
            </p>
          </div>
        </div>

        <PredictExercise
          question="Batch norm has gamma=1 and beta=0 by default. What does the output look like then? And why would the network learn to change gamma away from 1?"
          hint="gamma=1 beta=0 means y = x̂. What's x̂?"
          answer="Output is just the normalized x̂: zero mean, unit variance. The network would learn gamma≠1 if a different scale helps the next layer — for example, if the activation function works better with larger inputs."
          explanation="BN starts the network at a 'nice' place — each layer sees unit-variance input regardless of how deep we are. But if the network needs different statistics after seeing data, it learns gamma and beta to shift out of this default. It's a learnable rescaling layer, not a fixed normalization."
        />

        <TryThis
          commands={[
            '// Create a 4D tensor: 1 batch, 2 channels, 2×2 spatial',
            'tensor_create("bn_in", [1,2,3,4, 5,6,7,8], [1,2,2,2])',
            '// Apply batch norm with identity params (gamma=1, beta=0)',
            'batch_norm2d("bn_in", [1.0,1.0], [0.0,0.0], 1e-5, "bn_out")',
            'tensor_inspect("bn_out")',
            '// Now try a different gamma — scale channel 0 by 2x',
            'batch_norm2d("bn_in", [2.0,1.0], [0.0,0.0], 1e-5, "bn_out2")',
            'tensor_inspect("bn_out2")',
          ]}
          label="Explore batch normalization"
        />

        {/* ================================================================ */}
        {/* SECTION 6: Putting It Together */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            A Real CNN: Stacking the Pieces
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A CNN is layers of conv → relu → pool, repeated, then flatten →
              linear layers at the end. Each conv block learns increasingly
              abstract features: early layers detect edges and textures, later
              layers detect shapes and objects.
            </p>
            <p>
              The standard recipe:
            </p>
          </div>
          <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3 text-[var(--color-text-secondary)] max-w-2xl">
{`Input: [N, 1, 8, 8]   (batch, channels, height, width)

Conv2d(1→8, k=3, pad=1) → [N, 8, 8, 8]   same spatial size
ReLU
MaxPool2d(2, stride=2)  → [N, 8, 4, 4]   half size

Conv2d(8→16, k=3, pad=1) → [N, 16, 4, 4]
ReLU
MaxPool2d(2, stride=2)   → [N, 16, 2, 2]

Flatten                  → [N, 64]
Linear(64 → 4)           → [N, 4]         4 classes
Softmax / output`}
          </pre>
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl space-y-2">
            <p>
              Notice the shape evolution. The spatial dims shrink as you go
              deeper. The channel count grows — more kernels = richer features.
              By the time you flatten, you have a fixed-size vector regardless
              of whether the input was 8×8 or 16×16. That vector goes into
              the classifier.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            '// Initialize a CNN: conv(1→8) → relu → pool → flatten → linear(32→4)',
            'init_cnn([',
            '  {"type":"conv2d","in_channels":1,"out_channels":8,"kernel_size":3,"padding":1},',
            '  {"type":"relu"},',
            '  {"type":"max_pool2d","kernel_size":2,"stride":2},',
            '  {"type":"flatten"},',
            '  {"type":"linear","in":32,"out":4}',
            '], "cnn")',
          ]}
          label="Initialize a CNN"
        />

        <TryThis
          commands={[
            '// Create a tiny 8×8 "image" (1 batch, 1 channel)',
            'tensor_create("input_img",',
            '  [1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1,',
            '   1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1],',
            '  [1,1,8,8])',
            '// Run it through the CNN — see all the feature maps',
            'cnn_forward("cnn", "input_img")',
          ]}
          label="Run a forward pass through the CNN"
        />

        {/* ================================================================ */}
        {/* SECTION 7: Flatten and Global Avg Pool */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Flatten vs. Global Average Pooling
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Before the fully-connected classifier, you need to go from 4D
              [N,C,H,W] to 2D [N, features]. Two ways:
            </p>
            <p>
              <strong>Flatten:</strong> literally reshape [N,C,H,W] → [N, C×H×W].
              Keeps all spatial information. But the feature size depends on H and W,
              so you can only accept fixed-size inputs. This is the standard for
              small CNNs.
            </p>
            <p>
              <strong>Global average pooling:</strong> average across H and W for
              each channel → [N, C]. The network is now input-size-agnostic —
              it works on any spatial size. Used in modern architectures like
              ResNet. The trade-off: you lose spatial information (where in the
              image the feature appeared).
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            '// Flatten: [1, 8, 4, 4] → [1, 128]',
            'tensor_create("pre_flat", Array(128).fill(0.5), [1,8,4,4])',
            'flatten_tensor("pre_flat", "flat_out")',
            'tensor_inspect("flat_out")',
            '// Global avg pool: [1, 8, 4, 4] → [1, 8]',
            'global_avg_pool("pre_flat", "gap_out")',
            'tensor_inspect("gap_out")',
          ]}
          label="Compare flatten vs global avg pool"
        />

        {/* ================================================================ */}
        {/* MINI PROJECT TEASER */}
        {/* ================================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Coming Up: Pattern Hunter
          </h2>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              The project for this chapter trains a CNN to classify four types of
              synthetic 8×8 images: horizontal stripes, vertical stripes,
              checkerboard, and solid. No dataset download required — the
              patterns are generated in Rust.
            </p>
            <p>
              Why synthetic data? Because you'll be able to look at the learned
              kernels and understand exactly what they detected. A kernel that
              fires on horizontal stripes has strong positive weights in a
              horizontal band. You can see the learning happen.
            </p>
            <p>
              You'll build the CNN layer by layer, train it, inspect the filters,
              and find the kernel that detects each pattern.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* WHAT YOU LEARNED */}
        {/* ================================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            What You Just Learned
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A <strong>convolution</strong> slides a small kernel across an
              input, computing dot products. The output is a feature map: "how
              much of this pattern is at each position?"
            </li>
            <li>
              Input shape is <strong>[N, C_in, H, W]</strong>. Kernel shape is
              [C_out, C_in, kH, kW]. You get C_out feature maps out.
            </li>
            <li>
              <strong>Stride</strong> controls step size (larger = smaller
              output). <strong>Padding</strong> preserves spatial size (padding =
              kernel//2 → same size in, same size out).
            </li>
            <li>
              <strong>Max pooling</strong> halves spatial dimensions and adds
              translation invariance — nearby features look the same.
            </li>
            <li>
              <strong>Batch norm</strong> normalizes each channel's distribution
              before passing it to the next layer. Training becomes dramatically
              more stable.
            </li>
            <li>
              A CNN chains <strong>conv → relu → pool</strong> blocks, then
              <strong> flattens</strong> (or global avg pools) into a classifier.
              Spatial dims shrink, channels grow, features get more abstract.
            </li>
          </ul>
        </div>

        <LearnNav current={10} />
        <ClaudePrompts chapter={10} />
      </div>
    </PageTransition>
  );
}
