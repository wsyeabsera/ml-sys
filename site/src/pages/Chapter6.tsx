import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import MLPDiagram from "../components/viz/MLPDiagram";

export default function Chapter6() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 06
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Neural Networks — Layers and MLPs
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Bridging the gap from "autograd computes gradients" to "here's an
            actual neural network." A layer is three operations you already
            know. An MLP is a for-loop over layers.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: What is a Layer? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">What is a Layer?</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A fully-connected layer computes:{" "}
              <code>out = tanh(x @ W + b)</code>. That's it — three operations
              chained together:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <strong>Matrix multiply:</strong> <code>x @ W</code> — project
                the input into a new space
              </li>
              <li>
                <strong>Bias add:</strong> <code>+ b</code> — shift the result
              </li>
              <li>
                <strong>Nonlinearity:</strong> <code>tanh(...)</code> — squash
                into [-1, 1]
              </li>
            </ol>
            <p>
              If <code>x</code> has shape <code>[batch, in_features]</code> and{" "}
              <code>W</code> has shape <code>[in_features, out_features]</code>,
              the output is <code>[batch, out_features]</code>. The layer
              transforms the dimensionality of the data.
            </p>
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
        pre.tanh()                     // element-wise activation
    }
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: Why Nonlinearity? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Why Nonlinearity?</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Without tanh (or ReLU, sigmoid, etc.), stacking layers{" "}
              <strong>collapses to a single matrix multiply</strong>. Here's why:
            </p>
            <p>
              Two linear layers: <code>y = W₂ @ (W₁ @ x)</code>. By
              associativity of matrix multiplication, this equals{" "}
              <code>(W₂ @ W₁) @ x = W_combined @ x</code>. Two layers behave
              identically to one. You could stack 100 layers and it would still
              be equivalent to a single linear transformation.
            </p>
            <p>
              The nonlinearity breaks this collapse. <code>tanh(W₁ @ x)</code>{" "}
              is <em>not</em> a linear function of x, so{" "}
              <code>W₂ @ tanh(W₁ @ x)</code> cannot be reduced to{" "}
              <code>W @ x</code>. This is what makes deep networks more
              expressive than shallow ones — each layer can learn a different
              nonlinear transformation.
            </p>
          </div>
        </div>

        <InfoCard title="The Universal Approximation Theorem" accent="emerald">
          <div className="space-y-2">
            <p>
              A single hidden layer with enough neurons can approximate any
              continuous function. But "enough neurons" might mean millions.
              Depth lets you get the same expressiveness with far fewer
              parameters — deep networks compose features hierarchically,
              building complex representations from simple ones.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Stacking Layers — The MLP */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Stacking Layers: The MLP
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              A Multi-Layer Perceptron (MLP) is just a list of layers where
              the output of layer <em>i</em> feeds into layer <em>i+1</em>.
              That's a for-loop:
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
            current = layer.forward(&current);
        }
        current
    }
}`}
        />

        <InfoCard title="Dimension Chaining" accent="amber">
          <div className="space-y-2">
            <p>
              Dimensions must chain correctly. If layer 0 maps{" "}
              <code>[batch, 2] → [batch, 3]</code>, then layer 1 must accept
              3 inputs: <code>[batch, 3] → [batch, 1]</code>. The output
              features of one layer must equal the input features of the next.
            </p>
            <p>
              A common architecture notation: <strong>2 → 3 → 1</strong> means
              "2 inputs, 3 hidden neurons, 1 output." This requires two
              layers: one with W shape [2,3] and one with W shape [3,1].
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Gradient Flow Through Layers */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Gradient Flow Through Layers
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The chain rule applied N times — that's all backpropagation is.
              For a 2→3→1 network:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                Start at the output: <code>d(out) = 1.0</code>
              </li>
              <li>
                Through tanh: <code>d(pre₁) = (1 - out²) × d(out)</code>
              </li>
              <li>
                Through matmul (layer 1):{" "}
                <code>d(h) = d(pre₁) @ W₁ᵀ</code> and{" "}
                <code>d(W₁) = hᵀ @ d(pre₁)</code>
              </li>
              <li>
                Through tanh: <code>d(pre₀) = (1 - h²) × d(h)</code>
              </li>
              <li>
                Through matmul (layer 0):{" "}
                <code>d(x) = d(pre₀) @ W₀ᵀ</code> and{" "}
                <code>d(W₀) = xᵀ @ d(pre₀)</code>
              </li>
            </ol>
            <p>
              Each layer's backward pass produces two things: (1) gradients for
              its own weights and bias (used for learning), and (2) a gradient
              for its input (passed to the layer before it). This is why the
              algorithm is called <strong>back-propagation</strong> — gradients
              propagate backward through the layers.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Forward: Left → Right" accent="blue">
            <p>
              Data flows through the layers in order. Input → Layer 0 → Layer
              1 → Output. Each layer transforms [batch, in] to [batch, out].
            </p>
          </InfoCard>
          <InfoCard title="Backward: Right → Left" accent="rose">
            <p>
              Gradients flow in reverse. Output grad → Layer 1 backward →
              Layer 0 backward → Input grad. Each layer passes gradients to
              its predecessor.
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Interactive MLP Diagram */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            Try It: Interactive MLP
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Step through a 2→3→1 MLP. Watch activation values flow
              left-to-right in the forward pass, then gradients flow
              right-to-left in the backward pass. Green borders = has a
              value. Red borders = has a gradient.
            </p>
          </div>
        </div>

        <MLPDiagram />

        {/* ============================================================ */}
        {/* SECTION: MLP via MCP */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            MLP via the MCP Server
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The <code>mlp_forward</code> tool runs a full MLP forward and
              backward pass. You provide the input and layer specs (weights,
              biases, dimensions), and it returns the output tensor plus
              gradients for every parameter.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="json"
          code={`// Example: 2 → 3 → 1 MLP
{
  "tool": "mlp_forward",
  "input": {
    "data": [1.0, 2.0],
    "shape": [1, 2]
  },
  "layers": [
    {
      "w": [0.5, -0.3, 0.8, -0.4, 0.6, -0.2],
      "b": [0.1, -0.1, 0.2],
      "in_features": 2,
      "out_features": 3
    },
    {
      "w": [0.7, -0.5, 0.9],
      "b": [0.0],
      "in_features": 3,
      "out_features": 1
    }
  ]
}`}
        />

        <InfoCard title="What the MCP Server Does" accent="blue">
          <div className="space-y-2">
            <p>
              Behind the scenes, the server creates <code>Layer</code> structs,
              builds the <code>MLP</code>, runs <code>mlp.forward(x)</code>,
              then calls <code>output.backward()</code>. It returns:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>The output tensor value</li>
              <li>Gradients for every weight matrix and bias vector</li>
              <li>The intermediate activations (hidden layer outputs)</li>
            </ul>
            <p>
              This is the same autograd engine from Chapter 5 — just with
              more operations chained together.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* Key Takeaways */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-accent-blue)]">
            Key Takeaways
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              A <strong>layer</strong> is{" "}
              <code>tanh(x @ W + b)</code> — matmul, add, nonlinearity.
            </li>
            <li>
              <strong>Nonlinearities</strong> prevent layer collapse. Without
              them, N layers = 1 layer.
            </li>
            <li>
              An <strong>MLP</strong> is a for-loop over layers. Dimensions
              must chain: out_features of layer i = in_features of layer i+1.
            </li>
            <li>
              <strong>Backpropagation</strong> is just the chain rule applied
              at each layer, moving right-to-left. Each layer computes
              gradients for its own parameters and passes gradients upstream.
            </li>
          </ul>
        </div>

        <ChapterNav current={6} />
      </div>
    </PageTransition>
  );
}
