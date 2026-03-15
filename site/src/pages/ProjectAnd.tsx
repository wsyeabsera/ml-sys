import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import PredictExercise from "../components/ui/PredictExercise";
import ProjectNav from "../components/ui/ProjectNav";

export default function ProjectAnd() {
  return (
    <PageTransition>
      <div className="space-y-10 max-w-4xl">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-emerald)]">
            Project 01
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Train a Network to Learn AND
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Your first trained neural network. Five commands from nothing to a
            model that learned a function from data.
          </motion.p>
        </div>

        {/* What you'll build */}
        <InfoCard title="What you're building" accent="emerald">
          <div className="space-y-2">
            <p>
              The AND function: both inputs must be 1 for the output to be 1.
              Simple truth table, 4 examples. But here's the thing — you're not
              going to code the logic. You're going to show a neural network the
              examples and let it <strong>figure out the pattern by itself</strong>.
            </p>
            <p>
              By the end, you'll have run the complete training loop: create data →
              initialize weights → train → evaluate → predict. This is the same
              loop that trains GPT-4, just on a tiny problem.
            </p>
          </div>
        </InfoCard>

        {/* Step 1: Understand the problem */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 1: Understand the Problem
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The AND gate has a simple rule:
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--color-surface-overlay)] inline-block">
              <table className="text-sm font-mono">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)]">
                    <th className="px-4 py-2 text-left text-[var(--color-text-muted)]">Input A</th>
                    <th className="px-4 py-2 text-left text-[var(--color-text-muted)]">Input B</th>
                    <th className="px-4 py-2 text-left text-[var(--color-text-muted)]">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {[[0,0,0],[0,1,0],[1,0,0],[1,1,1]].map(([a,b,out], i) => (
                    <tr key={i} className="border-t border-[var(--color-surface-overlay)]">
                      <td className="px-4 py-2">{a}</td>
                      <td className="px-4 py-2">{b}</td>
                      <td className={`px-4 py-2 font-bold ${out ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-text-muted)]"}`}>{out}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Only when BOTH inputs are 1 does the output become 1. A single neuron
              can learn this — it just needs to find the right weights and bias.
            </p>
          </div>
        </div>

        <PredictExercise
          question="Can a single neuron (without hidden layers) learn AND? Think about it — AND is a linear boundary."
          hint="A single neuron computes tanh(x1*w1 + x2*w2 + b). Can you draw a line that separates [1,1] from the other three points?"
          answer="Yes! AND is linearly separable. A single line can separate the [1,1] case from the rest."
          explanation="Unlike XOR (next project), AND doesn't require a hidden layer. A 2→1 architecture is enough. This makes it the perfect first training exercise — it's guaranteed to work."
        />

        {/* Step 2: Create the dataset */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 2: Create the Dataset
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              First, we create the AND dataset. This stores the input/target
              pairs as tensors in the MCP tensor store — ready for training.
            </p>
          </div>
        </div>

        <TryThis
          commands={['create_dataset("and")']}
          label="Create the AND dataset"
        />

        {/* Step 3: Initialize the network */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 3: Initialize the Network
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Now create a tiny network: 2 inputs → 1 output. No hidden layer needed
              for AND. The weights start random — the network knows nothing yet.
            </p>
          </div>
        </div>

        <TryThis
          commands={['init_mlp([2, 1], "and_net")']}
          label="Initialize a 2→1 network"
        />

        <PredictExercise
          question="We initialized with random weights. What do you think the loss will be before any training?"
          hint="Random weights produce random outputs. For binary classification, random guessing gives ~50% accuracy."
          answer="The loss will be around 0.25-0.75 — the network is essentially guessing randomly."
          explanation="MSE loss for random outputs on binary targets averages around 0.5. The exact value depends on the random initialization, but it'll be nowhere near 0."
        />

        {/* Step 4: Train */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 4: Train!
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              This is the moment. We run 200 training epochs with learning rate
              0.5. Each epoch: forward pass → compute loss → backward pass →
              update weights. Watch the loss drop.
            </p>
          </div>
        </div>

        <TryThis
          commands={['train_mlp("and_net", "and_inputs", "and_targets", 0.5, 200)']}
          label="Train for 200 epochs"
        />

        <InfoCard title="What just happened inside" accent="blue">
          <div className="space-y-2">
            <p>
              For each of 200 epochs, the network did this:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Forward: computed tanh(x @ W + b) for all 4 samples</li>
              <li>Loss: computed MSE between predictions and targets</li>
              <li>Backward: computed gradients for W and b</li>
              <li>Update: W -= 0.5 × gradient, b -= 0.5 × gradient</li>
            </ol>
            <p>
              That's gradient descent. The same algorithm that trains billion-parameter
              models, just on a 3-parameter network with 4 training examples.
            </p>
          </div>
        </InfoCard>

        {/* Step 5: Evaluate */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 5: Did It Learn?
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Let's check. Evaluate the network on the training data and see if
              the predictions match the truth table.
            </p>
          </div>
        </div>

        <TryThis
          commands={['evaluate_mlp("and_net", "and_inputs", "and_targets")']}
          label="Evaluate the trained network"
        />

        <PredictExercise
          question="The network outputs values between -1 and 1 (because of tanh). For AND, what should the four outputs look like?"
          hint="Targets are [0, 0, 0, 1]. The network should output something close to those values."
          answer="Something like [-0.9, -0.8, -0.8, 0.9] — negative for 0-targets, positive for the 1-target."
          explanation="Tanh squashes to [-1, 1], not [0, 1]. So 'close to 0' means 'negative' and 'close to 1' means 'positive'. The accuracy metric rounds: output > 0.5 → predict 1, else predict 0."
        />

        {/* Step 6: Test on new inputs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 6: Test It Yourself
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Now test individual inputs. Does [1, 1] give ~1? Does [0, 1] give ~0?
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'mlp_predict("and_net", [1, 1])',
            'mlp_predict("and_net", [0, 1])',
            'mlp_predict("and_net", [1, 0])',
            'mlp_predict("and_net", [0, 0])',
          ]}
          label="Test all four inputs"
        />

        {/* What you built */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            What You Just Built
          </h2>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              In 5 commands, you went from nothing to a trained neural network.
              The network learned AND from just 4 examples — no one told it the
              rule, it discovered the pattern by adjusting its weights to minimize
              the error.
            </p>
            <p>
              This is the core of machine learning: show examples → compute error →
              adjust weights → repeat. Everything else — bigger networks, more data,
              fancier optimizers — is just scaling this up.
            </p>
          </div>
        </div>

        {/* Bonus challenges */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Bonus Challenges</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Train OR instead:</strong> Use <code>create_dataset("or")</code>.
                Does it learn faster or slower than AND? Why?
              </li>
              <li>
                <strong>Try a lower learning rate:</strong> Train with lr=0.01 instead
                of 0.5. How many more epochs does it need?
              </li>
              <li>
                <strong>Inspect the weights:</strong> Use <code>tensor_inspect("and_net_w0")</code>
                to see the learned weights. Can you interpret what they mean?
              </li>
              <li>
                <strong>Try XOR:</strong> Use <code>create_dataset("xor")</code> with a
                2→1 network. It won't work! That's the next project.
              </li>
            </ol>
          </div>
        </div>

        <ProjectNav current="and" />
      </div>
    </PageTransition>
  );
}
