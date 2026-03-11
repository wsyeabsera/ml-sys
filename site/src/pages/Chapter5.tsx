import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ChapterNav from "../components/ui/ChapterNav";
import ComputationGraph3D from "../components/three/ComputationGraph";
import GradientFlow from "../components/viz/GradientFlow";
import SimpleGraph from "../components/viz/SimpleGraph";
import { neuronGraph, gradAccumulationGraph } from "../data/autograd-examples";

const opsTable = [
  { op: "add", forward: "c = a + b", backward_a: "grad", backward_b: "grad" },
  { op: "mul", forward: "c = a * b", backward_a: "b * grad", backward_b: "a * grad" },
  { op: "tanh", forward: "c = tanh(a)", backward_a: "(1 - c\u00B2) * grad", backward_b: "\u2014" },
  { op: "matmul", forward: "C = A @ B", backward_a: "grad @ B\u1D40", backward_b: "A\u1D40 @ grad" },
];

export default function Chapter5() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Chapter 05
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            The Autograd Engine
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Teaching the computer to compute its own gradients. Record the forward
            pass, then replay it backwards with the chain rule. This is how every
            modern ML framework — PyTorch, JAX, TensorFlow — trains neural networks.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: What is a Gradient, Actually? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What is a Gradient, Actually?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Before computation graphs and chain rules, let's nail the core
              idea. A gradient tells you:{" "}
              <strong>
                "if I nudge this input a tiny bit, how much does the output
                change?"
              </strong>
            </p>
            <p>
              Take the simplest case: <code>y = 3x</code>. If x = 2, then y = 6.
              If x = 2.001, then y = 6.003. The output changed by 0.003 when we
              nudged the input by 0.001. The ratio is 3 — that's the gradient.
              It's just the slope.
            </p>
            <p>
              Now a slightly harder one: <code>y = x²</code>. If x = 2, y = 4.
              If x = 2.001, y = 4.004001. The gradient ≈ 4 (which is 2x,
              the derivative you'd compute in calculus). At x = 5, the gradient
              would be 10 — same function, different slope at a different point.
            </p>
          </div>
        </div>

        <InfoCard title="Why Gradients Matter for ML" accent="blue">
          <div className="space-y-2">
            <p>
              In machine learning, the "output" is the <strong>loss</strong>{" "}
              (error) — how wrong the model's predictions are. The "inputs" are
              the <strong>weights</strong> — the millions of numbers the model
              uses to compute predictions.
            </p>
            <p>
              Gradients tell us which direction to adjust each weight to reduce
              the error. Weight with a positive gradient? Decrease it. Negative
              gradient? Increase it. The magnitude tells you how much the weight
              matters — big gradient means this weight has a big effect on the
              error.
            </p>
            <p>
              That's gradient descent in one sentence:{" "}
              <strong>compute gradients, then nudge weights in the opposite
              direction.</strong>
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: What's a Computation Graph? */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What's a Computation Graph?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Before we tackle a neuron, let's start with the simplest possible
              example: <code>y = a * b + c</code> where a = 2, b = 3, c = 1.
            </p>
            <p>
              Every computation can be broken into a graph of simple operations.
              Here, there are two operations: one multiply and one add. The
              graph has 5 nodes (3 inputs + 2 operations) and flows left to right.
            </p>
            <p>
              Step through the forward pass to see values computed, then step
              backward to see gradients flow in reverse. <strong>Pay attention
              to the explanation panel below the graph</strong> — it shows the
              exact formula applied at each step.
            </p>
          </div>
        </div>

        <SimpleGraph />

        <InfoCard title="What Just Happened?" accent="emerald">
          <div className="space-y-2">
            <p>
              <strong>Forward:</strong> We computed y = a*b + c = 2*3 + 1 = 7.
              Values flowed left → right.
            </p>
            <p>
              <strong>Backward:</strong> Starting from dy/dy = 1 (the output's
              gradient with respect to itself is always 1), we applied the chain
              rule at each node going right → left:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>add node:</strong> Addition passes the gradient through
                unchanged. Both inputs (mul, c) get gradient = 1.
              </li>
              <li>
                <strong>mul node:</strong> For multiplication, the local
                gradient of <code>a</code> is <code>b</code> (and vice versa).
                So a.grad = b * incoming = 3 * 1 = 3, and b.grad = a *
                incoming = 2 * 1 = 2.
              </li>
            </ul>
            <p>
              That's the entire algorithm. Everything else — neurons, layers,
              transformers — is just bigger graphs with the same two ideas:
              forward computes values, backward propagates gradients.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Topological Sort */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Topological Sort: Why Order Matters
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              You can't compute a node's gradient until you know the gradient of{" "}
              <strong>all nodes that use it</strong>. In{" "}
              <code>y = a*b + c</code>, you must compute the add node's gradient
              before the mul node's, because mul feeds into add.
            </p>
            <p>
              Topological sort gives you a valid ordering — every node comes
              after all its dependents. For the forward pass: inputs first,
              output last. For the backward pass: reverse that order — output
              first, inputs last.
            </p>
            <p>
              In our implementation, this is a standard BFS algorithm (Kahn's
              algorithm). It looks at which nodes have no remaining dependencies
              and processes them first. Simple, but critical — without it,
              you'd compute gradients in the wrong order and get wrong answers.
            </p>
          </div>
        </div>

        <CodeBlock
          lang="rust"
          code={`// Topological sort: process nodes with no remaining parents first
fn topological_sort(nodes: &[Value]) -> Vec<Value> {
    let mut visited = HashSet::new();
    let mut order = Vec::new();

    fn visit(node: &Value, visited: &mut HashSet<Id>, order: &mut Vec<Value>) {
        if visited.contains(&node.id()) { return; }
        visited.insert(node.id());
        for parent in node.parents() {
            visit(parent, visited, order);
        }
        order.push(node.clone()); // parents always come before children
    }

    for node in nodes { visit(node, &mut visited, &mut order); }
    order // forward order: inputs → output
          // backward: just reverse this
}`}
        />

        {/* ============================================================ */}
        {/* SECTION: What Problem Does Autograd Solve? */}
        {/* ============================================================ */}
        <motion.div
          className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-6 transition-colors duration-200"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-semibold mb-3">What Problem Does Autograd Solve?</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              You <em>could</em> compute gradients by hand for{" "}
              <code>y = a*b + c</code>. But a real neural network has millions
              of parameters and hundreds of operations chained together. Writing
              the gradient formulas by hand would be insane — and you'd have to
              redo it every time you changed the architecture.
            </p>
            <p>
              Autograd does it automatically. You write the forward computation
              (the neural network), and it records every operation in a graph.
              Then it walks backward through that graph, applying the chain rule
              at each step. Same algorithm as above, just scaled up.
            </p>
            <p>
              The trick is the <strong>chain rule</strong>: if{" "}
              <code>y = f(g(x))</code>, then{" "}
              <code>dy/dx = dy/dg * dg/dx</code>. Each operation only needs to
              know its own local gradient. Autograd chains them all together.
            </p>
          </div>
        </motion.div>

        {/* Forward / Backward cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Forward Pass" accent="blue">
            <p>
              Run your computation normally, but secretly record every operation
              in a directed acyclic graph (DAG). Each node stores its value and
              how it was computed — like a receipt of every calculation. This is
              what <code>loss.backward()</code> in PyTorch replays.
            </p>
          </InfoCard>
          <InfoCard title="Backward Pass" accent="rose">
            <p>
              Walk the graph in reverse (topological sort). At each node, apply
              the chain rule: multiply the incoming gradient by the local gradient
              of the operation. The incoming gradient is "how much does the final
              output care about this node's value?" The local gradient is "how
              does this operation transform small changes?"
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Value Type */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">The Value Type</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Each node in the graph is a <code>Value</code> — a
              reference-counted pointer to mutable data. Why the indirection?
              Because a value can be used in multiple operations (shared
              ownership via <code>Rc</code>), and the backward pass needs to
              write gradients after the graph is built (interior mutability via{" "}
              <code>RefCell</code>).
            </p>
          </div>
          <CodeBlock
            lang="rust"
            code={`pub struct Value(Rc<RefCell<ValueData>>);

struct ValueData {
    data: f64,           // the computed value
    grad: f64,           // gradient (filled during backward)
    op: Op,              // how this value was created
    label: String,       // for debugging
}

enum Op {
    None,                // leaf node (input/weight)
    Add(Value, Value),   // result of addition
    Mul(Value, Value),   // result of multiplication
    Tanh(Value),         // result of tanh activation
}`}
          />
        </div>

        {/* ============================================================ */}
        {/* SECTION: Operation Gradients */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Operation Gradients</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Each operation knows its own local gradient — the derivative of
              its output with respect to each input. The chain rule multiplies
              this by the incoming gradient (labeled <code>grad</code> below).
            </p>
            <p>
              For example: if <code>c = a * b</code>, then{" "}
              <code>dc/da = b</code>. The chain rule says{" "}
              <code>a.grad += b * incoming_grad</code>. The <code>+=</code> is
              critical — if <code>a</code> feeds into multiple operations, its
              gradient is the <em>sum</em> of all contributions.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--color-surface-overlay)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-raised)]">
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">Op</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">Forward</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">da</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">db</th>
                </tr>
              </thead>
              <tbody>
                {opsTable.map((row) => (
                  <tr key={row.op} className="border-t border-[var(--color-surface-overlay)]">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-amber)]">
                      {row.op}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-primary)]">
                      {row.forward}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-rose)]">
                      {row.backward_a}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-rose)]">
                      {row.backward_b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl space-y-2">
            <p>
              <strong>Why tanh?</strong> The derivative of tanh(x) is{" "}
              <code>1 - tanh(x)²</code>. Since we already computed
              tanh(x) in the forward pass (that's the node's value), we don't
              need x — we just use <code>1 - value²</code>. This is a common
              pattern: operations cache whatever they need for backward.
            </p>
            <p>
              <strong>Why matmul is special:</strong> For{" "}
              <code>C = A @ B</code>, the gradients are{" "}
              <code>dA = grad @ B^T</code> and{" "}
              <code>dB = A^T @ grad</code>. Notice: computing the gradient
              requires transposing the other operand. This is why we built
              zero-copy transpose in Phase 1 — autograd depends on it.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Neuron — Interactive Computation Graph */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            The Neuron: Interactive Computation Graph
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Now let's scale up from <code>y = a*b + c</code> to a real neuron:{" "}
              <code>out = tanh(x1*w1 + x2*w2 + b)</code>. This is the
              fundamental building block of neural networks — two inputs (x1, x2),
              two weights (w1, w2), a bias (b), and a nonlinear activation (tanh).
            </p>
            <p>
              The computation graph has 10 nodes and follows the exact same
              pattern: forward computes values left-to-right, backward propagates
              gradients right-to-left. The explanation panel below the 3D graph
              shows the math at each step.
            </p>
          </div>
          <ComputationGraph3D
            nodes={neuronGraph.nodes}
            edges={neuronGraph.edges}
            title="3D Computation Graph — Single Neuron"
          />

          {/* Step-by-step reference for the neuron graph */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Step-by-Step Reference
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--color-accent-blue)]">Forward Pass</p>
                <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5 font-mono">
                  <li>x1*w1 = 2 * (-3) = -6.00</li>
                  <li>x2*w2 = 0 * 1 = 0.00</li>
                  <li>sum = -6 + 0 = -6.00</li>
                  <li>sum+b = -6 + 6.88 = 0.88</li>
                  <li>out = tanh(0.88) = 0.71</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--color-accent-rose)]">Backward Pass</p>
                <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5 font-mono">
                  <li>d(out) = 1.0 (seed)</li>
                  <li>d(sum+b) = (1-0.71²)*1 = 0.50</li>
                  <li>d(sum), d(b) = 0.50, 0.50</li>
                  <li>d(x1w1), d(x2w2) = 0.50, 0.50</li>
                  <li>x1.grad = w1*0.5 = -1.50</li>
                  <li>w1.grad = x1*0.5 = 1.00</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] italic">
            Blue = inputs/weights. Orange = operations. Green = output. Drag to rotate in 3D.
          </p>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Gradient Accumulation */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            Gradient Accumulation: The += Rule
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              What happens when a value feeds into <em>multiple</em> operations?
              This is common — think of a weight used in multiple layers, or a
              value used twice in the same expression.
            </p>
            <p>
              The rule: <strong>gradients accumulate</strong>. If a value feeds
              into 3 operations, it gets 3 gradient contributions, and we add
              them all up. Why? Because the total effect of nudging{" "}
              <code>a</code> is the sum of its effects through ALL paths to
              the output.
            </p>
          </div>
        </div>

        <InfoCard title="Worked Example: a Used Twice" accent="amber">
          <div className="space-y-2">
            <p>
              Consider <code>d = a*b + a</code> where a=2, b=3:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                c = a*b = 6, then d = c + a = 8
              </li>
              <li>
                <strong>Path 1:</strong> a → c (via mul) → d (via add). Gradient
                contribution: b * 1 = 3
              </li>
              <li>
                <strong>Path 2:</strong> a → d (directly, via add). Gradient
                contribution: 1 * 1 = 1
              </li>
              <li>
                <strong>Total:</strong> a.grad = 3 + 1 = 4
              </li>
            </ul>
            <p>
              Verify: if a = 2.001, then c = 2.001*3 = 6.003, d = 6.003 + 2.001 = 8.004.
              Change in d = 0.004 for a change of 0.001 in a → gradient = 4. Correct!
            </p>
            <p className="mt-1">
              This is why autograd uses <code>+=</code> (accumulate), not{" "}
              <code>=</code> (overwrite). Overwriting would lose the
              contribution from one of the paths.
            </p>
          </div>
        </InfoCard>

        <GradientFlow
          nodes={gradAccumulationGraph.nodes}
          edges={gradAccumulationGraph.edges}
          title="2D Gradient Flow — Accumulation Example"
        />

        {/* ============================================================ */}
        {/* SECTION: From Scalars to Tensors */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            From Scalars to Tensors
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Everything we just learned about scalar autograd scales to
              tensors. The chain rule is the same, but now gradients are
              matrices, not numbers. Element-wise ops (add, mul) are
              straightforward — the same rule applies to every element.
            </p>
            <p>
              The hard one is <strong>matmul</strong>. If C = A @ B, then:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code>dA = grad @ B^T</code> — to get A's gradient, multiply the
                incoming gradient by B transposed
              </li>
              <li>
                <code>dB = A^T @ grad</code> — to get B's gradient, multiply A
                transposed by the incoming gradient
              </li>
            </ul>
          </div>
        </div>

        <InfoCard title="Concrete 2×2 Matmul Gradient Example" accent="emerald">
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[var(--color-text-muted)]">{"// Forward: C = A @ B"}</span>
              <br />
              A = [[1,2],[3,4]] &nbsp; B = [[5,6],[7,8]]
              <br />
              C = [[1*5+2*7, 1*6+2*8], [3*5+4*7, 3*6+4*8]] = [[19,22],[43,50]]
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">{"// Backward: assume grad = [[1,0],[0,1]] (identity)"}</span>
              <br />
              <span className="text-[var(--color-accent-rose)]">dA</span> = grad @ B^T = [[1,0],[0,1]] @ [[5,7],[6,8]] = [[5,7],[6,8]]
              <br />
              <span className="text-[var(--color-accent-rose)]">dB</span> = A^T @ grad = [[1,3],[2,4]] @ [[1,0],[0,1]] = [[1,3],[2,4]]
            </div>
            <p className="text-[var(--color-text-secondary)] font-sans text-sm">
              Notice: computing dA requires <strong>transposing B</strong>, and dB
              requires <strong>transposing A</strong>. This is why zero-copy
              transpose from Phase 1 matters — autograd calls transpose on every
              backward pass through a matmul. If transpose copied data, training
              would be 2x slower.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Why Rc<RefCell>? */}
        {/* ============================================================ */}
        <InfoCard title="Why Rc<RefCell>?" accent="amber">
          <div className="space-y-2">
            <p>
              A computation graph has <strong>shared ownership</strong> (the same
              value feeds into multiple operations) and needs{" "}
              <strong>interior mutability</strong> (the backward pass writes
              gradients after the graph is built).{" "}
              <code>Rc&lt;RefCell&gt;</code> solves both:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <code>Rc</code> = reference counting. Multiple nodes can point
                to the same value without ownership conflicts.
              </li>
              <li>
                <code>RefCell</code> = runtime borrow checking. We can mutate
                the gradient field even though the graph structure is immutable.
              </li>
            </ul>
            <p>
              The tradeoff: <code>Rc&lt;RefCell&gt;</code> is single-threaded
              only. It's not <code>Send</code>, so our MCP server can't store
              autograd graphs across async boundaries. Real frameworks use{" "}
              <code>Arc&lt;Mutex&gt;</code> for concurrent graphs, or avoid
              shared pointers entirely by using arena allocators with integer
              indices. That's a real engineering constraint we'd need to solve at
              scale.
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
              A <strong>gradient</strong> tells you how much the output changes
              when you nudge an input. It's just a slope.
            </li>
            <li>
              <strong>Computation graphs</strong> break expressions into simple
              ops. Forward = compute values. Backward = propagate gradients.
            </li>
            <li>
              <strong>Topological sort</strong> ensures we process nodes in the
              right order — you can't compute a gradient before all downstream
              gradients are known.
            </li>
            <li>
              <strong>Gradient accumulation</strong> (+=) is necessary because a
              value can contribute to the output through multiple paths.
            </li>
            <li>
              <strong>Matmul gradients</strong> require transpose:{" "}
              <code>dA = grad @ B^T</code>, <code>dB = A^T @ grad</code>. This
              is why we built zero-copy transpose.
            </li>
          </ul>
        </div>

        <ChapterNav current={5} />
      </div>
    </PageTransition>
  );
}
