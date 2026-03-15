import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";
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
            Learn 03
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Autograd — Teaching Machines to Learn From Their Mistakes
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Record the forward pass, replay it backwards with the chain rule,
            and suddenly your computer can compute its own gradients. This is
            how every ML framework trains neural networks.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="The most important idea in all of ML" accent="emerald">
          <div className="space-y-2">
            <p>
              Here's the question that makes machine learning possible: "if I
              wiggle this number a tiny bit, how much does the error change?"
            </p>
            <p>
              That's it. That's a gradient. It's not scary calculus — it's just
              a ratio. Nudge the input by 0.001, see how much the output moves.
              The ratio is the gradient. It's literally just the slope.
            </p>
            <p>
              The magic isn't computing <em>one</em> gradient — that's easy. The
              magic is computing <em>millions</em> of them simultaneously, for
              every weight in a neural network, automatically. That's what
              autograd does. Let's build it.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: What is a Gradient */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Gradients: It's Just Slope
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Take <code>y = 3x</code>. If x = 2, then y = 6. Bump x to 2.001
              and y becomes 6.003. The output moved 3x as much as the input —
              gradient is 3. That's the slope of the line. Thrilling, right?
            </p>
            <p>
              Slightly harder: <code>y = x²</code>. At x = 2, y = 4. At x =
              2.001, y = 4.004001. Gradient ≈ 4 (which is 2x). At x = 5, the
              gradient would be 10. Same function, different slope at different
              points.
            </p>
            <p>
              Now the important part: in ML, the "output" is the{" "}
              <strong>loss</strong> (how wrong the model is), and the "inputs"
              are the <strong>weights</strong> (the knobs the model can turn).
              Gradients tell you which way to turn each knob to make the error
              smaller. Positive gradient? Turn it down. Negative? Turn it up.
              That's gradient descent. Literally the entire training algorithm in
              two sentences.
            </p>
          </div>
        </div>

        {/* Exercise 1: First gradient prediction */}
        <PredictExercise
          question="For y = a * b where a=2, b=3: what is a's gradient? What is b's gradient?"
          hint="The gradient of a in a*b is just b (and vice versa). How much does y change when you nudge a?"
          answer="a.grad = 3, b.grad = 2"
          explanation="If a goes from 2 to 2.001, y goes from 6 to 6.003 — it moved by 0.003, which is b × 0.001. So a's gradient is b = 3. By the same logic, b's gradient is a = 2."
          commands={[
            'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")',
          ]}
          commandLabel="Verify: compute gradients for y = a * b"
        />

        {/* Exercise 2: Add operation */}
        <PredictExercise
          question="Now for y = a * b + c where a=2, b=3, c=1: what is c's gradient?"
          hint="Addition passes gradients through unchanged. If the output gradient is 1, what does each input of + get?"
          answer="c.grad = 1"
          explanation="Addition is simple — both inputs get the same gradient that the output received. Since the output's gradient starts at 1, c gets 1. The add doesn't amplify or diminish the gradient."
          commands={[
            'autograd_expr([["a", 2], ["b", 3], ["c", 1]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"]], "e")',
          ]}
          commandLabel="Verify: compute gradients for y = a*b + c"
        />

        <TryThis
          commands={[
            'autograd_expr([["a", 2], ["b", 3], ["c", 1]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"]], "e")',
          ]}
          label="Compute gradients for y = a*b + c"
        />

        {/* ============================================================ */}
        {/* SECTION: Computation Graphs */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Computation Graphs: Breaking Math Into Tiny Steps
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Take <code>y = a * b + c</code> where a=2, b=3, c=1. That's two
              operations: one multiply and one add. We can draw this as a graph
              — inputs on the left, operations in the middle, output on the
              right.
            </p>
            <p>
              Step through the forward pass to see values computed, then step
              backward to see gradients flow in reverse.{" "}
              <strong>Pay attention to the explanation panel</strong> — it shows
              the exact formula at each step.
            </p>
          </div>
        </div>

        <SimpleGraph />

        <InfoCard title="What just happened in that graph?" accent="emerald">
          <div className="space-y-2">
            <p>
              <strong>Forward:</strong> We computed y = 2*3 + 1 = 7. Values
              flowed left → right. Nothing surprising.
            </p>
            <p>
              <strong>Backward:</strong> Starting from dy/dy = 1 (the output's
              gradient with respect to itself is always 1), we applied the chain
              rule at each node going right → left:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>add:</strong> passes gradient through unchanged. Both
                inputs get gradient = 1.
              </li>
              <li>
                <strong>mul:</strong> gradient of a is b (= 3), gradient of b is
                a (= 2). Multiply by incoming gradient (1).
              </li>
            </ul>
            <p>
              That's the <em>entire</em> algorithm. Forward computes values,
              backward propagates gradients. Neurons, layers, transformers —
              it's all just bigger versions of this.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Chain Rule */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Chain Rule: Why Autograd Actually Works
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              You <em>could</em> compute gradients by hand for{" "}
              <code>y = a*b + c</code>. But a real neural network has millions
              of parameters and hundreds of operations chained together.
              Computing gradients manually would be absolute madness.
            </p>
            <p>
              The chain rule saves us. If <code>y = f(g(x))</code>, then{" "}
              <code>dy/dx = dy/dg × dg/dx</code>. Each operation only needs to
              know its <em>own</em> local gradient. Autograd chains them all
              together by multiplying local gradients along the path from output
              back to input.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Forward Pass" accent="blue">
            <p>
              Run your computation normally, but secretly record every operation
              in a graph. Each node stores its value and how it was computed —
              like a receipt tape. PyTorch's <code>loss.backward()</code> is
              literally "replay this receipt tape in reverse."
            </p>
          </InfoCard>
          <InfoCard title="Backward Pass" accent="rose">
            <p>
              Walk the graph in reverse order. At each node, multiply the
              incoming gradient ("how much does the output care about me?") by
              the local gradient ("how does this operation transform small
              changes?"). Pass the result to the inputs.
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: Operation Gradients Table */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">The Gradient Cheat Sheet</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Each operation has a simple rule for its local gradient. You don't
              need to memorize these — but it helps to see that they're all
              embarrassingly simple:
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
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-amber)]">{row.op}</td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-primary)]">{row.forward}</td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-rose)]">{row.backward_a}</td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-accent-rose)]">{row.backward_b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl space-y-2">
            <p>
              <strong>The += matters:</strong> if a value feeds into multiple
              operations, its gradient is the <em>sum</em> of all contributions.
              Using <code>=</code> instead of <code>+=</code> would silently
              lose gradient contributions. This bug is both easy to make and
              incredibly hard to find.
            </p>
          </div>
        </div>

        {/* Exercise 3: Apply the rules */}
        <PredictExercise
          question="For y = (a + b) * c where a=1, b=2, c=5: what are the gradients of a, b, and c?"
          hint="Work backward: the output gradient is 1. Mul gives c's grad = (a+b) and (a+b)'s grad = c. Then add passes that through to both a and b."
          answer="a.grad = 5, b.grad = 5, c.grad = 3"
          explanation="Step by step: (1) d = a+b = 3, y = d*c = 15. (2) Backward from y: d.grad = c = 5, c.grad = d = 3. (3) Through the add: a.grad = d.grad = 5, b.grad = d.grad = 5. The add just passes the gradient through to both inputs."
          commands={[
            'autograd_expr([["a", 1], ["b", 2], ["c", 5]], [["d", "add", "a", "b"], ["y", "mul", "d", "c"]], "y")',
          ]}
          commandLabel="Verify your answer"
        />

        {/* Exercise 4: Tanh changes everything */}
        <PredictExercise
          question="If y = tanh(x) and x = 0, what is x's gradient? What if x = 100?"
          hint="tanh(0) = 0, so the derivative is 1 - 0² = 1. But tanh(100) ≈ 1, so the derivative is 1 - 1² ≈ 0."
          answer="At x=0: grad = 1.0 (full gradient passes through). At x=100: grad ≈ 0 (gradient vanishes!)"
          explanation="This is the vanishing gradient problem in one example. When tanh saturates (output near ±1), its gradient goes to zero. No gradient = no learning. This is why large values are dangerous — they kill gradient flow."
          commands={[
            'autograd_expr([["x", 0]], [["y", "tanh", "x"]], "y")',
            'autograd_expr([["x", 100]], [["y", "tanh", "x"]], "y")',
          ]}
          commandLabel="Verify: try both x=0 and x=100"
        />

        {/* ============================================================ */}
        {/* SECTION: Neuron */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            A Real Neuron (It's Just a Bigger Graph)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Now let's scale up from <code>y = a*b + c</code> to an actual
              neuron: <code>out = tanh(x1*w1 + x2*w2 + b)</code>. Two inputs,
              two weights, a bias, and a tanh activation. This is the
              fundamental building block of every neural network ever built.
            </p>
            <p>
              The graph has 10 nodes but follows the exact same pattern. Drag to
              rotate in 3D:
            </p>
          </div>
          <ComputationGraph3D
            nodes={neuronGraph.nodes}
            edges={neuronGraph.edges}
            title="3D Computation Graph — Single Neuron"
          />
          <p className="text-xs text-[var(--color-text-muted)] italic">
            Blue = inputs/weights. Orange = operations. Green = output.
          </p>
        </div>

        {/* Exercise 5: Predict the neuron */}
        <PredictExercise
          question="Neuron: out = tanh(x0*w0 + x1*w1 + b) with x0=2, x1=0, w0=-3, w1=1, b=6.88. Which weight has the LARGER gradient magnitude — w0 or w1?"
          hint="w0's gradient depends on x0 (= 2), and w1's gradient depends on x1 (= 0). If the input is zero, can the weight's gradient be nonzero?"
          answer="w0 has the larger gradient. w1's gradient is 0 because x1 = 0."
          explanation="For mul, the gradient of w is x × incoming_grad. Since x1 = 0, w1.grad = 0 × (something) = 0. The weight w1 can't learn at all when its input is zero — there's no signal to learn from. This is why dead inputs are a problem in neural networks."
          commands={[
            'autograd_neuron([2, 0], [-3, 1], 6.88)',
          ]}
          commandLabel="Run the neuron and check"
        />

        <TryThis
          commands={[
            'autograd_neuron([2, 0], [-3, 1], 6.88)',
          ]}
          label="Run this neuron and see all gradients"
        />

        {/* ============================================================ */}
        {/* SECTION: Gradient Accumulation */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            The += Bug That Will Haunt Your Dreams
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              What happens when a value feeds into <em>multiple</em> operations?
              Example: <code>d = a*b + a</code> where a=2, b=3.
            </p>
            <p>
              The variable <code>a</code> contributes to the output through two
              paths. The gradient must be the <em>sum</em> of both
              contributions. If you use <code>=</code> instead of{" "}
              <code>+=</code>, you'll overwrite the first path's gradient with
              the second. Your model will train, but slowly and badly, and
              you'll spend three days wondering why before finding the bug at
              2am. Ask me how I know.
            </p>
          </div>
        </div>

        {/* Exercise 6: Gradient accumulation */}
        <PredictExercise
          question="If d = a*b + a where a=2, b=3, what is a's gradient? (Remember: a is used TWICE.)"
          hint="a contributes through two paths: once through the mul (gradient = b = 3) and once through the add directly (gradient = 1). What's the total?"
          answer="a.grad = 4 (not 3, not 1 — it's the sum of both paths)"
          explanation="Path 1 (a → mul → add): contributes b × 1 = 3. Path 2 (a → add directly): contributes 1 × 1 = 1. Total: 3 + 1 = 4. This is why autograd uses += not =. If you used =, you'd get either 3 or 1 depending on which path was computed last — both wrong."
        />

        <InfoCard title="Worked example: gradient accumulation" accent="amber">
          <div className="space-y-2">
            <p>
              <code>d = a*b + a</code> where a=2, b=3:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Path 1: a → mul → add. Contribution: b × 1 = 3</li>
              <li>Path 2: a → add directly. Contribution: 1 × 1 = 1</li>
              <li><strong>Total: a.grad = 3 + 1 = 4</strong></li>
            </ul>
            <p>
              Verify: if a = 2.001, then d = 2.001×3 + 2.001 = 8.004. Change =
              0.004 for a nudge of 0.001 → gradient = 4. Math checks out.
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
            From Numbers to Matrices (It's the Same Idea)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Everything above used single numbers. Real neural networks use
              tensors (matrices). The good news: the chain rule is identical.
              The only tricky part is <strong>matmul gradients</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                If <code>C = A @ B</code>, then <code>dA = grad @ B^T</code>
              </li>
              <li>
                And <code>dB = A^T @ grad</code>
              </li>
            </ul>
            <p>
              Notice that computing gradients <em>requires transpose</em>.
              Remember how we made transpose zero-copy in the tensors chapter?
              That wasn't just a fun fact — autograd calls transpose on{" "}
              <strong>every single backward pass through a matmul</strong>. If
              transpose copied data, training would be 2x slower.
            </p>
          </div>
        </div>

        <InfoCard title="Concrete 2×2 matmul gradient" accent="emerald">
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[var(--color-text-muted)]">{"// Forward: C = A @ B"}</span>
              <br />
              A = [[1,2],[3,4]] &nbsp; B = [[5,6],[7,8]]
              <br />
              C = [[19,22],[43,50]]
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">{"// Backward: assume grad = identity"}</span>
              <br />
              <span className="text-[var(--color-accent-rose)]">dA</span> = grad @ B^T = [[5,7],[6,8]]
              <br />
              <span className="text-[var(--color-accent-rose)]">dB</span> = A^T @ grad = [[1,3],[2,4]]
            </div>
          </div>
        </InfoCard>

        <InfoCard title="At scale: why Rc<RefCell> isn't enough" accent="amber">
          <div className="space-y-2">
            <p>
              Our autograd uses <code>Rc&lt;RefCell&gt;</code> — shared
              ownership with runtime borrow checking. It works great for
              learning, but it's single-threaded only.
            </p>
            <p>
              Real frameworks use <code>Arc&lt;Mutex&gt;</code> (thread-safe but
              slower) or arena allocators with integer indices (fast but more
              complex). This is a real engineering tradeoff you'd face if you
              were shipping this to production. We're not, so{" "}
              <code>Rc&lt;RefCell&gt;</code> is perfect.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Mini Project: Build Your Own Gradient Calculator
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              You're going to build a computation graph by hand, run forward and
              backward, and verify the gradients make sense. This is exactly
              what PyTorch does under the hood when you call{" "}
              <code>loss.backward()</code> — except PyTorch does it for millions
              of parameters.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                Create the expression <code>y = (a * b) + c</code> with a=2,
                b=-3, c=10, and check the gradients
              </li>
              <li>
                Now try <code>y = tanh(a * b + c)</code> — add a tanh at the
                end and see how the gradients change
              </li>
              <li>
                Run a full neuron with inputs [2, 0], weights [-3, 1], bias 6.88
                and inspect what the backward pass gives you
              </li>
              <li>
                Bonus: change the weights and see how the gradients shift. Which
                weight has the biggest gradient? That's the one the model would
                update the most during training.
              </li>
            </ol>
          </div>
          <TryThis
            commands={[
              'autograd_expr([["a", 2], ["b", -3], ["c", 10]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"]], "e")',
              'autograd_expr([["a", 2], ["b", -3], ["c", 10]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"], ["f", "tanh", "e"]], "f")',
              'autograd_neuron([2, 0], [-3, 1], 6.88)',
            ]}
            label="Start the mini project"
          />
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
              A <strong>gradient</strong> is just a slope — how much the output
              changes when you nudge an input.
            </li>
            <li>
              <strong>Computation graphs</strong> break expressions into simple
              ops. Forward computes values, backward propagates gradients.
            </li>
            <li>
              The <strong>chain rule</strong> lets each operation only care about
              its own local gradient. Autograd chains them together.
            </li>
            <li>
              <strong>Gradient accumulation (+=)</strong> is critical when a
              value feeds into multiple operations. Using = instead of += is
              a silent, devastating bug.
            </li>
            <li>
              <strong>Matmul gradients require transpose</strong> — which is
              why we made transpose zero-copy in the previous chapter.
            </li>
            <li>
              You just built a gradient calculator. That's literally what{" "}
              <code>loss.backward()</code> does.
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* NEXT UP + NAV */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Coming up next...
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You can compute gradients for a single neuron. But a real neural
            network has thousands of neurons organized into <em>layers</em>.
            Next up: stacking neurons into networks, running data through
            multiple layers, and watching gradients flow backward through an
            entire MLP.
          </p>
        </div>

        <LearnNav current={3} />
        <ClaudePrompts chapter={3} />
      </div>
    </PageTransition>
  );
}
