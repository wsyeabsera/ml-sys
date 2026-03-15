import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import PredictExercise from "../components/ui/PredictExercise";
import ProjectNav from "../components/ui/ProjectNav";

export default function ProjectXor() {
  return (
    <PageTransition>
      <div className="space-y-10 max-w-4xl">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-emerald)]">
            Project 02
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            The XOR Problem — Why Depth Matters
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            A single neuron can learn AND. But XOR? You'll watch it fail,
            then fix it by adding a hidden layer — the moment "deep" learning clicks.
          </motion.p>
        </div>

        {/* What XOR is */}
        <InfoCard title="The problem that killed AI (temporarily)" accent="emerald">
          <div className="space-y-2">
            <p>
              XOR: output is 1 when the inputs <em>differ</em>. [0,0]→0,
              [0,1]→1, [1,0]→1, [1,1]→0. A toddler could learn this. A single
              neuron cannot. And in 1969, two MIT professors wrote a book
              proving it.
            </p>
            <p>
              Minsky & Papert's <em>Perceptrons</em> was so devastating that
              funding for neural networks dried up for over a decade. The "AI
              winter." Careers ended. Research labs closed. All because of
              this four-row truth table.
            </p>
            <p>
              The fix was embarrassingly simple: <strong>add one more
              layer</strong>. That's what you're about to do — first watch
              it fail (like it's 1969), then fix it (like it's 1986). You're
              about to speedrun the history of deep learning.
            </p>
          </div>
        </InfoCard>

        {/* Part 1: Watch it fail */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Part 1: Watch a Single Neuron Fail
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              First, let's prove that a 2→1 network (no hidden layers) cannot
              learn XOR. Create the dataset and try training.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'create_dataset("xor")',
            'init_mlp([2, 1], "shallow")',
            'train_mlp("shallow", "xor_inputs", "xor_targets", 0.5, 500)',
            'evaluate_mlp("shallow", "xor_inputs", "xor_targets")',
          ]}
          label="Train a shallow network on XOR"
        />

        <PredictExercise
          question="What accuracy did the shallow network achieve? Why can't it do better?"
          hint="XOR is not linearly separable — you can't draw a single straight line that separates [0,1] and [1,0] from [0,0] and [1,1]."
          answer="About 50% accuracy — basically random guessing. The loss stays high."
          explanation="A single neuron computes tanh(x1*w1 + x2*w2 + b). This is a linear boundary (a line through 2D space). No single line can separate the XOR pattern — the 'on' points [0,1] and [1,0] are on opposite corners. You need at least one hidden layer to bend the decision boundary."
        />

        {/* Part 2: Fix it with depth */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Part 2: Fix It With a Hidden Layer
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Now add a hidden layer: 2→4→1. The hidden layer transforms the
              input into a new representation where XOR <em>is</em> linearly
              separable. That's what deep learning is — learning representations.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'init_mlp([2, 4, 1], "deep")',
            'train_mlp("deep", "xor_inputs", "xor_targets", 0.5, 500)',
            'evaluate_mlp("deep", "xor_inputs", "xor_targets")',
          ]}
          label="Train a deep network on XOR"
        />

        <PredictExercise
          question="What accuracy did the deep network achieve? What's the final loss?"
          hint="With 4 hidden neurons and 500 epochs at lr=0.5, it should learn XOR completely."
          answer="100% accuracy, loss near 0.00. The network learned XOR perfectly."
          explanation="The hidden layer found a representation where XOR becomes separable. With 4 hidden neurons, the network has multiple ways to solve it. This is THE fundamental insight of deep learning: depth creates representations that shallow networks can't."
        />

        {/* Part 3: Test it */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Part 3: Verify It Works
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Test each input to confirm the network learned XOR:
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'mlp_predict("deep", [0, 0])',
            'mlp_predict("deep", [0, 1])',
            'mlp_predict("deep", [1, 0])',
            'mlp_predict("deep", [1, 1])',
          ]}
          label="Test all four XOR inputs"
        />

        {/* What you learned */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            You Just Ended the AI Winter
          </h2>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
            <li>
              <strong>A single neuron draws straight lines.</strong> AND is on one
              side of a line. XOR isn't. No line works. Minsky was right about that.
            </li>
            <li>
              <strong>A hidden layer bends the space.</strong> It transforms the
              input into a new representation where XOR <em>is</em> linearly
              separable. Minsky was wrong about that being useless.
            </li>
            <li>
              <strong>The same training loop works at any depth.</strong> One layer,
              100 layers, doesn't matter. Forward → loss → backward → update.
              The code doesn't change. Only the weights do.
            </li>
            <li>
              You just proved that depth matters — the single most important
              insight in all of deep learning. It took the field 17 years to
              figure this out. It took you about 3 minutes.
            </li>
          </ul>
        </div>

        {/* Bonus */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Bonus Challenges</h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Minimum hidden size:</strong> Try 2→2→1 instead of 2→4→1.
                Does it still learn? What about 2→1→1?
              </li>
              <li>
                <strong>Learning rate experiments:</strong> Try lr=0.01 vs lr=1.0.
                What happens with too low? Too high?
              </li>
              <li>
                <strong>Inspect the learned weights:</strong> Run{" "}
                <code>tensor_inspect("deep_w0")</code>. The hidden layer weights
                encode the transformation that makes XOR separable.
              </li>
              <li>
                <strong>Visualize the training:</strong> Click "Open in Visualizer"
                on the training result to see the loss curve.
              </li>
            </ol>
          </div>
        </div>

        <InfoCard title="Want the automated version?" accent="emerald">
          <p>
            Type <code>/workflow xor</code> in the REPL for a guided
            step-by-step walkthrough that runs all the commands with
            explanations between each step.
          </p>
        </InfoCard>

        <ProjectNav current="xor" />
      </div>
    </PageTransition>
  );
}
