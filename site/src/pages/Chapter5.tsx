import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import CodeBlock from "../components/ui/CodeBlock";
import ComputationGraph3D from "../components/three/ComputationGraph";
import GradientFlow from "../components/viz/GradientFlow";
import { neuronGraph, gradAccumulationGraph } from "../data/autograd-examples";

const opsTable = [
  { op: "add", forward: "c = a + b", backward_a: "grad", backward_b: "grad" },
  { op: "mul", forward: "c = a * b", backward_a: "b * grad", backward_b: "a * grad" },
  { op: "tanh", forward: "c = tanh(a)", backward_a: "(1 - c\u00B2) * grad", backward_b: "—" },
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
            pass, then replay it backwards with the chain rule.
          </motion.p>
        </div>

        {/* What is autograd */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Forward Pass" accent="blue">
            <p>
              Run your computation normally, but secretly record every operation
              in a directed acyclic graph (DAG). Each node stores its value and
              how it was computed.
            </p>
          </InfoCard>
          <InfoCard title="Backward Pass" accent="rose">
            <p>
              Walk the graph in reverse (topological sort). At each node, apply
              the chain rule: multiply the incoming gradient by the local gradient
              of the operation.
            </p>
          </InfoCard>
        </div>

        {/* The Value type */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">The Value Type</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Each node in the graph is a <code>Value</code> — a reference-counted
            pointer to mutable data. <code>Rc</code> handles shared ownership
            (a value can be used in multiple operations), and <code>RefCell</code>{" "}
            allows mutation during the backward pass.
          </p>
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

        {/* Operations table */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Operation Gradients</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Each operation knows its local gradient — the derivative of its output
            with respect to each input. The chain rule multiplies this by the
            incoming gradient.
          </p>
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
        </div>

        {/* 3D Computation Graph */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            The Neuron: Interactive Computation Graph
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            A single neuron: <code>out = tanh(x1*w1 + x2*w2 + b)</code>.
            Step through the forward pass to see values computed, then step
            backward to see gradients flow. Drag to rotate in 3D.
          </p>
          <ComputationGraph3D
            nodes={neuronGraph.nodes}
            edges={neuronGraph.edges}
            title="3D Computation Graph — Single Neuron"
          />
        </div>

        {/* 2D Gradient Flow */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Gradient Accumulation
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            When a value is used in multiple operations, gradients accumulate.
            Here <code>a</code> feeds into both <code>c = a*b</code> and{" "}
            <code>d = c+a</code>. Its gradient is the sum of contributions from
            both paths: <code>b*1 + 1*1 = 3 + 1 = 4</code>.
          </p>
          <GradientFlow
            nodes={gradAccumulationGraph.nodes}
            edges={gradAccumulationGraph.edges}
            title="2D Gradient Flow — Accumulation Example"
          />
        </div>

        {/* TensorValue */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Scaling Up: Tensor-Level Autograd
          </h2>
          <InfoCard title="From Scalars to Tensors" accent="emerald">
            <p>
              The scalar <code>Value</code> tracks gradients for single numbers.{" "}
              <code>TensorValue</code> extends this to multi-dimensional arrays.
              The tricky part is matmul: for <code>C = A @ B</code>, the gradients are{" "}
              <code>dA = grad @ B^T</code> and <code>dB = A^T @ grad</code>.
              This requires transpose — which is why we built zero-copy transpose first.
            </p>
          </InfoCard>
        </div>

        {/* Why Rc<RefCell> */}
        <InfoCard title="Why Rc<RefCell>?" accent="amber">
          <p>
            A computation graph has shared ownership (the same value feeds into
            multiple operations) and needs interior mutability (the backward pass
            writes gradients after construction). <code>Rc&lt;RefCell&gt;</code>{" "}
            solves both — but it's single-threaded only. Real frameworks use{" "}
            <code>Arc&lt;Mutex&gt;</code> for concurrent graphs.
          </p>
        </InfoCard>
      </div>
    </PageTransition>
  );
}
