import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";
import MLPDiagram from "../components/viz/MLPDiagram";

export default function Chapter6() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 04
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Neural Networks — A For Loop With Dreams
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            A layer is three operations you already know. A neural network is a
            for loop over layers. That's genuinely it. Let's build one.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="The most overhyped for loop in history" accent="emerald">
          <div className="space-y-2">
            <p>
              Here's a neural network in pseudocode:
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2 mt-1">
{`for layer in layers:
    x = tanh(x @ layer.weights + layer.bias)
return x`}
            </pre>
            <p>
              Three lines. Multiply, add, squash. Repeat. The same three
              operations from the autograd chapter, stacked on top of each
              other. The billions of dollars of AI hype? It's this for loop, run
              on very expensive hardware, with very large matrices.
            </p>
            <p>
              Let's understand each piece, then build the whole thing.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: What Does a Weight Matrix Do? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            But First: What Does a Weight Matrix Actually Do?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Before we jump into layer formulas, let's build intuition for
              <em>why</em> neural networks use matrix multiplication. Why not
              some other operation? What's special about <code>x @ W</code>?
            </p>
            <p>
              Think of each <strong>row of W</strong> as a <em>pattern
              detector</em>. When you compute <code>x @ W</code>, each output
              neuron computes a <strong>dot product</strong> between the input
              and one column of W. A dot product measures similarity — how
              much the input "matches" the pattern stored in that weight column.
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`Input:  x = [1.0, 2.0]     (2 features)
Weight: W = [[0.5, -0.3],   (2 inputs → 2 outputs)
             [0.8,  0.1]]

Output neuron 0: 1.0 × 0.5 + 2.0 × 0.8 = 2.1
  → "I'm looking for inputs where feature 0 and feature 1 are both positive"

Output neuron 1: 1.0 × (-0.3) + 2.0 × 0.1 = -0.1
  → "I fire weakly — this input doesn't match my pattern much"`}
            </pre>
            <p>
              High value = "this input matches what I'm looking for."
              Low value = "nah, not my thing." The <strong>bias</strong> shifts
              the threshold for when a neuron "fires" — like adjusting the
              sensitivity. And <strong>tanh</strong> squashes the result so no
              single neuron can dominate with huge values.
            </p>
            <p>
              During training, the network <em>learns</em> what patterns to
              detect by adjusting the weights. It starts with random patterns
              and gradually sculpts them until they're useful for the task.
              Nobody tells it what patterns to look for — it figures that out
              from the data.
            </p>
          </div>
        </div>

        <PredictExercise
          question="If input x = [0, 0, 5] and a weight column w = [1, 1, 0], what's the dot product? What pattern is this weight 'looking for'?"
          hint="Dot product = 0×1 + 0×1 + 5×0. The weight has high values for features 0 and 1."
          answer="Dot product = 0. The weight is looking for patterns where features 0 and 1 are active, but this input only has feature 2 active — no match."
          explanation="The weight [1, 1, 0] acts as a detector for 'features 0 and 1 both present.' Input [0, 0, 5] has neither, so the response is zero despite having a large value in feature 2. The weight doesn't care about feature 2 at all (weight is 0 there). This is how neurons specialize — each weight column 'pays attention' to different input features."
        />

        {/* ============================================================ */}
        {/* SECTION: What is a Layer */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            A Layer: Matmul, Add, Squash
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Now you know <em>why</em> matmul — each neuron detects a pattern.
              A fully-connected layer computes:{" "}
              <code>out = tanh(x @ W + b)</code>. Three operations:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>Matrix multiply</strong> (<code>x @ W</code>) —
                project the input into a new space. If your input has 2 features
                and you want 3 hidden neurons, W is [2, 3].
              </li>
              <li>
                <strong>Bias add</strong> (<code>+ b</code>) — shift the
                result. Without bias, every layer would have to pass through the
                origin. That's unnecessarily constraining.
              </li>
              <li>
                <strong>Nonlinearity</strong> (<code>tanh</code>) — squash
                everything into [-1, 1]. This is the critical ingredient. Without
                it, your entire network collapses into a single matrix multiply.
                More on this in a moment.
              </li>
            </ol>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub struct Layer {
    pub w: TensorValue,  // [in_features, out_features]
    pub b: TensorValue,  // [1, out_features]
}

impl Layer {
    pub fn forward(&self, x: &TensorValue) -> TensorValue {
        let xw = x.matmul(&self.w);   // [batch, out_features]
        let pre = xw.add(&self.b);     // broadcast add
        pre.tanh()                     // squash to [-1, 1]
    }
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: Worked example — single layer */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Let's Trace Through a Layer With Real Numbers
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Input: <code>x = [1.0, 2.0]</code> (shape [1, 2] — one sample, two features).
              Weights: <code>W = [[0.5, -0.3], [0.8, 0.1]]</code> (shape [2, 2] — 2 in, 2 out).
              Bias: <code>b = [0.1, -0.2]</code>.
            </p>
            <p>
              <strong>Step 1: Matmul</strong>
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`x @ W = [1.0, 2.0] @ [[0.5, -0.3],
                       [0.8,  0.1]]
      = [1.0*0.5 + 2.0*0.8,  1.0*(-0.3) + 2.0*0.1]
      = [2.1, -0.1]`}
            </pre>
            <p>
              <strong>Step 2: Bias add</strong>
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`[2.1, -0.1] + [0.1, -0.2] = [2.2, -0.3]`}
            </pre>
            <p>
              <strong>Step 3: Tanh</strong>
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`tanh([2.2, -0.3]) = [0.976, -0.291]`}
            </pre>
            <p>
              That's it. Input [1.0, 2.0] → output [0.976, -0.291]. The layer
              transformed 2 features into 2 different features. Every value is
              now between -1 and 1 thanks to tanh.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'autograd_neuron_tensor([1.0, 2.0], [1, 2], [0.5, -0.3, 0.8, 0.1], [2, 2], [0.1, -0.2], [1, 2])',
          ]}
          label="Run this layer and see values + gradients"
        />

        {/* Exercise: Layer output shape */}
        <PredictExercise
          question="If your input x has shape [1, 4] and W has shape [4, 3], what shape is the output of x @ W + b?"
          hint="Matmul [1,4] × [4,3] gives you [1,?]. What does b's shape need to be?"
          answer="Output shape is [1, 3]. b must be [1, 3] to broadcast."
          explanation="The matmul contracts the inner dimension (4) and produces [1, 3]. The bias b adds element-wise, so it needs to match — [1, 3] or just [3] with broadcasting. The layer transformed 4 features into 3."
        />

        {/* ============================================================ */}
        {/* SECTION: Why Nonlinearity */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Why Tanh? (The Layer Collapse Problem)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              This is the part most tutorials gloss over, but it's actually the
              most interesting bit. Let me show you with actual math why
              nonlinearities matter.
            </p>
            <p>
              <strong>Without tanh</strong>, two layers in a row give you:{" "}
              <code>y = W₂ @ (W₁ @ x)</code>. But matrix multiplication is
              associative:
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`y = W₂ @ (W₁ @ x)
  = (W₂ @ W₁) @ x      ← associativity of matmul
  = W_combined @ x       ← one matrix, one multiply`}
            </pre>
            <p>
              Two layers collapse into one. Stack 100 layers? Still equivalent to
              a single matrix multiply. You could add a million layers and your
              network would be no more expressive than a single layer. All that
              depth buys you absolutely nothing.
            </p>
            <p>
              <strong>With tanh</strong>, this collapse is impossible:
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`y = W₂ @ tanh(W₁ @ x)
  ≠ W_anything @ x       ← can't simplify, tanh is nonlinear`}
            </pre>
            <p>
              Tanh bends the space between layers. Each layer can now learn a
              different nonlinear transformation that builds on the previous one.
              This is <em>literally</em> what makes deep learning deep.
            </p>
          </div>
        </div>

        {/* Exercise: Layer collapse */}
        <PredictExercise
          question="If you have two layers WITHOUT tanh: y = W2 @ (W1 @ x). Is this more powerful than a single layer y = W @ x?"
          hint="Matrix multiplication is associative: A @ (B @ x) = (A @ B) @ x. What does that mean?"
          answer="No! Two linear layers = one linear layer. W2 @ W1 = W_combined. Depth without nonlinearity buys you nothing."
          explanation="This is why nonlinearities are essential, not optional. Without them, a 100-layer network has exactly the same expressive power as a 1-layer network. The tanh (or ReLU) between layers is what makes depth meaningful."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Without nonlinearity" accent="rose">
            <div className="space-y-2">
              <p>
                100 layers = 1 layer. Every composition of linear functions is
                just another linear function. Your network can only learn linear
                boundaries — straight lines through the data. Useless for
                anything interesting.
              </p>
            </div>
          </InfoCard>
          <InfoCard title="With nonlinearity" accent="emerald">
            <div className="space-y-2">
              <p>
                Each layer bends the space differently. Two layers can learn
                curves. Three can learn S-shapes. Enough layers can approximate
                any function you can imagine. That's the universal approximation
                theorem in action.
              </p>
            </div>
          </InfoCard>
        </div>

        <InfoCard title="Fun fact: universal approximation" accent="blue">
          <div className="space-y-2">
            <p>
              A single hidden layer with enough neurons can theoretically
              approximate <em>any</em> continuous function. But "enough" might
              mean millions of neurons for a complex function. Depth lets you get
              the same expressiveness with far fewer parameters — like building
              complex LEGO structures from simple bricks, layer by layer.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Stacking Layers */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The MLP: A For Loop That Learns
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A Multi-Layer Perceptron (MLP) is a list of layers where the
              output of layer <em>i</em> becomes the input to layer <em>i+1</em>.
              The implementation is almost insultingly simple:
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`pub struct MLP {
    pub layers: Vec<Layer>,
}

impl MLP {
    pub fn forward(&self, x: &TensorValue) -> TensorValue {
        let mut current = x.clone();
        for layer in &self.layers {
            current = layer.forward(&current);  // that's it. that's the network.
        }
        current
    }
}`}
        />

        <InfoCard title="Dimension chaining" accent="amber">
          <div className="space-y-2">
            <p>
              Dimensions must chain. If layer 0 maps{" "}
              <code>[batch, 2] → [batch, 3]</code>, then layer 1 must accept
              3 inputs: <code>[batch, 3] → [batch, 1]</code>. The notation{" "}
              <strong>2 → 3 → 1</strong> means "2 inputs, one hidden layer with
              3 neurons, 1 output."
            </p>
            <p>
              If your dimensions don't chain, the matmul will fail with a shape
              mismatch. This is the #1 most common neural network bug. You'll
              make it. Everyone does. The error message will say something about
              inner dimensions, and you'll spend 10 minutes staring at shapes
              before realizing your W is transposed.
            </p>
          </div>
        </InfoCard>

        {/* Exercise: Dimension chaining */}
        <PredictExercise
          question="An MLP has architecture 3 → 5 → 2. How many weight matrices are there? What are their shapes?"
          hint="Each arrow is one layer. Layer 0 maps 3→5, layer 1 maps 5→2."
          answer="2 weight matrices: W0 is [3, 5] and W1 is [5, 2]. Plus biases b0 = [5] and b1 = [2]."
          explanation="The number of layers = number of arrows in the architecture notation. W0 has shape [in_features, out_features] = [3, 5]. The out_features of layer 0 must equal the in_features of layer 1 — that's dimension chaining."
        />

        {/* ============================================================ */}
        {/* SECTION: Worked example — 2-layer network */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tracing a 2→3→1 Network Step by Step
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Let's walk through a complete 2→3→1 MLP with actual numbers.
              Input: <code>[1.0, 2.0]</code>.
            </p>
            <p>
              <strong>Layer 0</strong> (2 inputs → 3 outputs):
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`W0 = [[0.5, -0.3, 0.8],     (shape [2, 3])
      [-0.4, 0.6, -0.2]]
b0 = [0.1, -0.1, 0.2]

matmul:  [1, 2] @ W0 = [0.5+(-0.8), -0.3+1.2, 0.8+(-0.4)]
                      = [-0.3, 0.9, 0.4]
add:     [-0.3, 0.9, 0.4] + [0.1, -0.1, 0.2] = [-0.2, 0.8, 0.6]
tanh:    tanh([-0.2, 0.8, 0.6]) = [-0.197, 0.664, 0.537]`}
            </pre>
            <p>
              <strong>Layer 1</strong> (3 inputs → 1 output):
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`W1 = [[0.7],     (shape [3, 1])
      [-0.5],
      [0.9]]
b1 = [0.0]

matmul:  [-0.197, 0.664, 0.537] @ W1
       = -0.197*0.7 + 0.664*(-0.5) + 0.537*0.9
       = -0.138 - 0.332 + 0.483 = 0.013
add:     0.013 + 0.0 = 0.013
tanh:    tanh(0.013) = 0.013  (tanh of small values ≈ identity)`}
            </pre>
            <p>
              Final output: <strong>≈ 0.013</strong>. The input [1.0, 2.0] got
              transformed through two layers into a single number near zero.
              During training, the network would compare this to the desired
              output, compute the error, and use backprop to adjust all the
              weights.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'mlp_forward([1.0, 2.0], [1, 2], [{"in_features": 2, "out_features": 3, "weights": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2], "bias": [0.1, -0.1, 0.2]}, {"in_features": 3, "out_features": 1, "weights": [0.7, -0.5, 0.9], "bias": [0.0]}])',
          ]}
          label="Verify these numbers in the REPL"
        />

        {/* ============================================================ */}
        {/* SECTION: Gradient Flow */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Backprop: Gradients Flow Backwards Through the Loop
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Remember the chain rule from the autograd chapter? In an MLP, it
              gets applied once per layer, moving right to left. Let's trace it
              for our 2→3→1 network:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>Start at the output:</strong>{" "}
                <code>d(out) = 1.0</code> — the output's gradient with respect
                to itself.
              </li>
              <li>
                <strong>Through Layer 1's tanh:</strong>{" "}
                <code>d(pre₁) = (1 - out²) × 1.0 ≈ 1.0</code> — tanh of
                0.013 is nearly linear, so the gradient barely changes.
              </li>
              <li>
                <strong>Through Layer 1's matmul:</strong> compute{" "}
                <code>d(W₁) = h^T @ d(pre₁)</code> (weight gradients for
                learning) and <code>d(h) = d(pre₁) @ W₁^T</code> (pass
                gradient to layer 0).
              </li>
              <li>
                <strong>Through Layer 0's tanh:</strong>{" "}
                <code>d(pre₀) = (1 - h²) × d(h)</code> — notice this
                multiplies by (1 - h²), which is less than 1. Gradients shrink
                at each tanh.
              </li>
              <li>
                <strong>Through Layer 0's matmul:</strong> compute{" "}
                <code>d(W₀)</code> and <code>d(x)</code>. We now have
                gradients for everything.
              </li>
            </ol>
            <p>
              Each layer produces two things: gradients for its own weights
              (used for learning), and a gradient for its input (passed to the
              layer before it). This is literally why it's called{" "}
              <strong>back-propagation</strong> — gradients propagate backward
              through the layers.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Forward: data flows →" accent="blue">
            <p>
              Input → Layer 0 → Layer 1 → Output. Each layer transforms the
              data. Think of it as a pipeline: raw input goes in, increasingly
              abstract features come out.
            </p>
          </InfoCard>
          <InfoCard title="Backward: gradients flow ←" accent="rose">
            <p>
              Output grad → Layer 1 backward → Layer 0 backward. Each layer
              says "here's how my weights contributed to the error" and passes
              the blame upstream. Very corporate.
            </p>
          </InfoCard>
        </div>

        {/* Exercise: Gradient flow */}
        <PredictExercise
          question="In a 2-layer network, every tanh multiplies the gradient by (1 - value²), which is ≤ 1. After 10 layers of tanh, what happens to the gradients in the first layer?"
          hint="If you multiply a number by something ≤ 1 ten times in a row, what happens?"
          answer="They shrink exponentially — potentially to near zero."
          explanation="This is the vanishing gradient problem. If tanh outputs are near ±1, the gradient factor (1 - value²) is near 0. After many layers, gradients in early layers are effectively zero, so those layers can't learn. This is the main reason modern networks use ReLU (gradient = 1 for positive values) instead of tanh."
        />

        <InfoCard title="The vanishing gradient problem — with real numbers" accent="amber">
          <div className="space-y-2">
            <p>
              Let's make this concrete. Suppose a 5-layer network has these
              tanh outputs at each layer:
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`Layer 5 (output):  tanh output = 0.90 → gradient factor = 1 - 0.81 = 0.19
Layer 4:           tanh output = 0.80 → gradient factor = 1 - 0.64 = 0.36
Layer 3:           tanh output = 0.85 → gradient factor = 1 - 0.72 = 0.28
Layer 2:           tanh output = 0.70 → gradient factor = 1 - 0.49 = 0.51
Layer 1 (input):   tanh output = 0.75 → gradient factor = 1 - 0.56 = 0.44

Total gradient reaching Layer 1:
  0.19 × 0.36 × 0.28 × 0.51 × 0.44 = 0.0043`}
            </pre>
            <p>
              The gradient reaching Layer 1 is <strong>0.43%</strong> of what
              it was at the output. Layer 1 barely learns at all while Layer 5
              learns quickly. In a 20-layer network, this number becomes
              astronomically small — effectively zero.
            </p>
            <p>
              This is the <strong>vanishing gradient problem</strong>. It
              plagued early deep learning and is the main reason modern
              networks use ReLU (gradient = 1 for positive values, 0 for
              negative) instead of tanh. With ReLU, the gradient factor is
              either 1 or 0 — no shrinking. But tanh is great for learning
              because you can <em>see</em> the problem clearly.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Interactive MLP */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            See It: Step Through a Neural Network
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Step through a 2→3→1 MLP. Watch values flow left-to-right in the
              forward pass, then gradients flow right-to-left in the backward
              pass. Green borders = has a value. Red borders = has a gradient.
            </p>
          </div>
        </div>

        <MLPDiagram />

        <TryThis
          commands={[
            'mlp_forward([1.0, 2.0], [1, 2], [{"in_features": 2, "out_features": 3, "weights": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2], "bias": [0.1, -0.1, 0.2]}, {"in_features": 3, "out_features": 1, "weights": [0.7, -0.5, 0.9], "bias": [0.0]}])',
          ]}
          label="Run this 2→3→1 MLP and see all gradients"
        />

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Mini Project: Explore Your Network
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Time to experiment. You're going to poke at a neural network from
              different angles and build intuition for how inputs, weights, and
              gradients relate to each other.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                Run the 2→3→1 MLP with input [1.0, 2.0]. What's the output?
                Look at the weight gradients for each layer — which layer has
                bigger gradients?
              </li>
              <li>
                Change the input to [0.0, 0.0]. What happens to the output
                and gradients? (Hint: the first matmul gives all zeros — only
                bias survives. Think about why.)
              </li>
              <li>
                Try input [10.0, 10.0] — really large values. What happens to
                the tanh outputs? (They'll saturate near ±1.) What happens to
                the gradients? (They'll vanish — tanh has near-zero gradient
                when its input is large.)
              </li>
              <li>
                Try a single layer: just the first layer (2→3) with input
                [1.0, 2.0]. Compare the gradients to the 2-layer version.
                Are they bigger or smaller? Why?
              </li>
              <li>
                Bonus: try a 3-layer network (2→3→3→1). Do the layer 0
                gradients get even smaller? That's the vanishing gradient
                problem in action.
              </li>
            </ol>
          </div>
          <TryThis
            commands={[
              'mlp_forward([1.0, 2.0], [1, 2], [{"in_features": 2, "out_features": 3, "weights": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2], "bias": [0.1, -0.1, 0.2]}, {"in_features": 3, "out_features": 1, "weights": [0.7, -0.5, 0.9], "bias": [0.0]}])',
              'mlp_forward([0.0, 0.0], [1, 2], [{"in_features": 2, "out_features": 3, "weights": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2], "bias": [0.1, -0.1, 0.2]}, {"in_features": 3, "out_features": 1, "weights": [0.7, -0.5, 0.9], "bias": [0.0]}])',
              'mlp_forward([10.0, 10.0], [1, 2], [{"in_features": 2, "out_features": 3, "weights": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2], "bias": [0.1, -0.1, 0.2]}, {"in_features": 3, "out_features": 1, "weights": [0.7, -0.5, 0.9], "bias": [0.0]}])',
            ]}
            label="Start exploring"
          />
        </div>

        {/* ============================================================ */}
        {/* SECTION: What Did the Hidden Layer Learn? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Did the Hidden Layer Actually Learn?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              This is the question most tutorials never answer. You've seen
              data flow through layers and gradients flow backward. But what
              does the hidden layer actually <em>compute</em>? What's the
              "representation" it learns?
            </p>
            <p>
              Think about the XOR problem (you'll build this in Project 2). XOR
              has four inputs: [0,0], [0,1], [1,0], [1,1]. The outputs are 0,
              1, 1, 0. Try to separate "outputs 1" from "outputs 0" with a
              straight line. You can't — the 1s and 0s are diagonally opposite.
            </p>
            <p>
              A single layer can only draw straight lines (linear boundaries).
              So a 1-layer network <em>cannot</em> learn XOR. Full stop.
            </p>
            <p>
              But a 2→2→1 network can. Here's why: the hidden layer
              transforms those 4 input points into a <strong>new coordinate
              system</strong> where XOR <em>becomes</em> linearly separable.
              It remaps the inputs so that the 1s are on one side and the 0s
              are on the other. Then the output layer just draws a straight
              line through the new space.
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`Original inputs:     Hidden layer output:
[0,0] → XOR=0        → [0.1, -0.3]     (bottom-left)
[0,1] → XOR=1        → [0.8,  0.7]     (top-right)
[1,0] → XOR=1        → [0.7,  0.8]     (top-right)
[1,1] → XOR=0        → [0.2,  0.1]     (bottom-left)

Now [0,1] and [1,0] are close together — linearly separable!`}
            </pre>
            <p>
              The hidden layer <em>invented</em> this representation during
              training. Nobody told it "rearrange the points like this." It
              discovered, through gradient descent, that this particular
              transformation makes the output layer's job easy. That's the
              magic of neural networks — they learn their own features.
            </p>
          </div>
        </div>

        <InfoCard title="Deeper = more abstract" accent="emerald">
          <div className="space-y-2">
            <p>
              In bigger networks, each layer builds more abstract features
              on top of the previous layer's output. Layer 1 might detect edges.
              Layer 2 combines edges into shapes. Layer 3 combines shapes
              into objects. Nobody programs these features — the network
              discovers them by trying to minimize the loss. This is why
              it's called "representation learning" — the network learns
              <em>what</em> to look for, not just <em>how</em> to classify.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: One Backward Step in Detail */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            One Backward Step, Fully Traced
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The backprop steps above listed formulas without explanation.
              Let's trace one step in detail so the formulas make sense.
              Focus on Layer 1's matmul: <code>pre₁ = h @ W₁</code> where h
              is the hidden layer output.
            </p>
            <p>
              From the autograd chapter, you know: for <code>C = A @ B</code>,
              the gradient of B is <code>A^T @ grad</code> and the gradient
              of A is <code>grad @ B^T</code>. Let's apply that:
            </p>
            <pre className="font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface-base)] rounded p-2">
{`pre₁ = h @ W₁
  h shape:    [1, 3]   (hidden layer output, 3 neurons)
  W₁ shape:   [3, 1]   (layer 1 weights)
  pre₁ shape: [1, 1]   (output before tanh)

Incoming gradient: d(pre₁) ≈ 1.0  (tanh was nearly linear here)

d(W₁) = h^T @ d(pre₁)
       = [3, 1]^T @ [1, 1]  ← wait, that's wrong. Let me be precise:
       = [-0.197, 0.664, 0.537]^T @ [1.0]
       = [[-0.197],     ← "how much should w[0] change?"
          [ 0.664],     ← "how much should w[1] change?"
          [ 0.537]]     ← "how much should w[2] change?"

d(h) = d(pre₁) @ W₁^T
     = [1.0] @ [0.7, -0.5, 0.9]
     = [0.7, -0.5, 0.9]  ← this gets passed to layer 0`}
            </pre>
            <p>
              See the pattern? <code>d(W₁) = h^T @ grad</code> — the weight
              gradient is the input transposed times the incoming gradient.
              This makes intuitive sense: weights connected to large
              activations (like h[1] = 0.664) get large gradients. Weights
              connected to small activations (like h[0] = -0.197) get small
              gradients. <em>The gradient is proportional to how active the
              input was.</em>
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* WHAT YOU LEARNED */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            What You Just Learned
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A <strong>layer</strong> is <code>tanh(x @ W + b)</code> — three
              operations you already know from the last two chapters.
            </li>
            <li>
              <strong>Nonlinearities</strong> (tanh) prevent layer collapse.
              Without them, 100 layers = 1 layer. With them, each layer bends
              the space differently.
            </li>
            <li>
              An <strong>MLP</strong> is a for loop over layers. The output of
              one becomes the input to the next. Dimensions must chain.
            </li>
            <li>
              <strong>Backpropagation</strong> is the chain rule applied at
              each layer, moving backward. Each tanh multiplies the gradient
              by ≤ 1, which causes gradients to shrink in deeper networks.
            </li>
            <li>
              The <strong>vanishing gradient problem</strong> makes early layers
              learn slowly — gradients shrink to 0.4% after just 5 layers of
              tanh. Modern networks use ReLU to fix this.
            </li>
            <li>
              A <strong>weight matrix</strong> is a set of pattern detectors.
              Each column computes a dot product with the input — high
              value means "this pattern matches."
            </li>
            <li>
              <strong>Hidden layers learn representations</strong> — they
              rearrange the input into a new coordinate system where the
              problem becomes solvable. Nobody programs this; it emerges from
              training.
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* NEXT UP + NAV */}
        {/* ============================================================ */}
        <InfoCard title="Try it yourself" accent="emerald">
          <p>
            Want to train a neural network right now? Open the REPL and
            type <code>/workflow xor</code> to train XOR from scratch, or{" "}
            <code>/workflow vanishing-gradients</code> to see why deep
            networks struggle with tanh.
          </p>
        </InfoCard>

        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Coming up next...
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            MLPs can process fixed-size inputs. But language is a{" "}
            <em>sequence</em> — each word depends on the words before it. How
            does a model decide which parts of the input to pay attention to?
            That's literally the mechanism: <strong>attention</strong>. It's the
            core idea behind every modern language model, and it's built from
            ops you already know.
          </p>
        </div>

        <LearnNav current={4} />
        <ClaudePrompts chapter={4} />
      </div>
    </PageTransition>
  );
}
