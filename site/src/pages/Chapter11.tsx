import ClaudePrompts from "../components/ui/ClaudePrompts";
import PageTransition from "../components/layout/PageTransition";
import { motion } from "framer-motion";
import InfoCard from "../components/ui/InfoCard";
import TryThis from "../components/ui/TryThis";
import LearnNav from "../components/ui/LearnNav";
import PredictExercise from "../components/ui/PredictExercise";

export default function Chapter11() {
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Learn 09
          </p>
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Training — Teaching Machines to Actually Learn
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            You know how to compute gradients. But gradients are useless unless
            you actually <em>use</em> them. This is the chapter where your
            networks stop being calculators and start being learners.
          </motion.p>
        </div>

        {/* ============================================================ */}
        {/* HOOK */}
        {/* ============================================================ */}
        <InfoCard title="The missing piece" accent="emerald">
          <div className="space-y-2">
            <p>
              So far you've built: tensors, autograd, layers, attention,
              transformers. You can compute anything and differentiate everything.
              But you've been <em>hand-picking</em> the weights. A real ML model
              has millions of weights — you can't hand-pick those.
            </p>
            <p>
              Training is the answer: show the network examples, measure how
              wrong it is, compute gradients that say "which direction to nudge
              each weight," then nudge. Repeat a few thousand times. The model
              discovers the pattern <strong>by itself</strong>.
            </p>
            <p>
              This is the chapter that connects "I understand the math" to
              "I can make things learn." Five new tools, one loop, and suddenly
              everything clicks.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: The Loss Function */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 1: How Wrong Am I? (The Loss Function)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Before you can improve, you need to measure how bad you are.
              That's what a <strong>loss function</strong> does — it takes the
              model's prediction and the correct answer, and outputs a single
              number: the error.
            </p>
            <p>
              The most common one is <strong>Mean Squared Error (MSE)</strong>:
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
{`MSE = mean((prediction - target)²)

Example: prediction = 0.7, target = 1.0
MSE = (0.7 - 1.0)² = (-0.3)² = 0.09`}
            </pre>
            <p>
              Why squared? Because (1) it makes all errors positive (no
              cancellation between over and under-predictions), and (2) it
              punishes big errors more than small ones. Being off by 0.5 is
              4x worse than being off by 0.25.
            </p>
          </div>
        </div>

        <PredictExercise
          question="If your model predicts [0.2, 0.8] and the targets are [0.0, 1.0], what's the MSE?"
          hint="MSE = mean of squared differences. (0.2-0)² = 0.04, (0.8-1.0)² = 0.04."
          answer="MSE = (0.04 + 0.04) / 2 = 0.04"
          explanation="Both predictions are off by 0.2, so each contributes 0.04 to the squared error. The mean is 0.04. A perfect model would have MSE = 0."
        />

        <PredictExercise
          question="The loss gradient tells you how to change each prediction to reduce the error. For MSE, the gradient is 2*(prediction - target)/n. If prediction = 0.8 and target = 1.0, is the gradient positive or negative?"
          hint="prediction - target = 0.8 - 1.0 = -0.2. What's the sign?"
          answer="Negative (gradient = -0.2). This means: increase the prediction to reduce the error."
          explanation="A negative gradient says 'the prediction is too low.' Gradient descent would push the prediction upward (subtracting a negative = adding). If the prediction were 1.3 (too high), the gradient would be positive, pushing it down."
          commands={[
            'mse_loss("predictions", "targets")',
          ]}
        />

        {/* ============================================================ */}
        {/* SECTION: Gradient Descent */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 2: Which Way to Nudge (Gradient Descent)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              You have the loss. You run backward to get gradients for every
              weight. Now what? The simplest optimizer: <strong>SGD
              (Stochastic Gradient Descent)</strong>.
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-2">
{`new_weight = old_weight - learning_rate × gradient

Example:
  weight = 0.5, gradient = 0.3, lr = 0.1
  new_weight = 0.5 - 0.1 × 0.3 = 0.47`}
            </pre>
            <p>
              That's it. Subtract a fraction of the gradient from each weight.
              The gradient says "moving this direction increases the loss," so
              we move the <em>opposite</em> direction. The learning rate controls
              how big each step is.
            </p>
          </div>
        </div>

        <PredictExercise
          question="Weight = 2.0, gradient = -0.5, learning rate = 0.1. What's the new weight after one SGD step?"
          hint="new = old - lr × gradient = 2.0 - 0.1 × (-0.5)"
          answer="new_weight = 2.0 - 0.1 × (-0.5) = 2.0 + 0.05 = 2.05"
          explanation="The gradient is negative, meaning 'increasing this weight would decrease the loss.' SGD subtracts a negative → adds → weight goes up. The model learned that this weight should be slightly larger."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Learning rate too high" accent="rose">
            <p>
              The model overshoots — it jumps past the optimal value, then
              overcorrects, then overshoots again. Loss oscillates wildly or
              explodes to infinity. If your loss suddenly becomes NaN, your
              learning rate is probably too high.
            </p>
          </InfoCard>
          <InfoCard title="Learning rate too low" accent="amber">
            <p>
              The model barely moves. Loss decreases painfully slowly. You
              might need 100,000 epochs instead of 100. Not wrong, just
              wasteful. Start high, reduce if unstable.
            </p>
          </InfoCard>
        </div>

        {/* ============================================================ */}
        {/* SECTION: The Training Loop */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Step 3: The Loop (Where Learning Happens)
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Training is a loop. The same loop. Every time. For every model.
              For every dataset. For GPT-4 and for your tiny AND gate.
            </p>
            <pre className="font-mono text-xs bg-[var(--color-surface-base)] rounded p-3">
{`for epoch in range(num_epochs):
    prediction = model.forward(input)     # 1. Forward
    loss = mse(prediction, target)        # 2. Compute loss
    gradients = backward(loss)            # 3. Backward
    for weight in model.weights:          # 4. Update
        weight -= lr * weight.gradient
    print(f"Epoch {epoch}: loss = {loss}")  # Watch it decrease!`}
            </pre>
            <p>
              Four steps, repeated. Forward → Loss → Backward → Update. The
              loss should decrease each epoch. If it doesn't, something is
              wrong (learning rate, architecture, or data).
            </p>
          </div>
        </div>

        <InfoCard title="What's an epoch?" accent="blue">
          <p>
            One epoch = one complete pass through all training data. If you have
            4 samples and train for 500 epochs, that's 2000 total forward+backward
            passes. Each epoch, the model sees every example once and adjusts its
            weights. Early epochs show big loss drops. Later epochs show diminishing
            returns — the model is fine-tuning.
          </p>
        </InfoCard>

        {/* ============================================================ */}
        {/* SECTION: Try It */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Let's Train Something Right Now
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Enough theory. Let's train a network to learn the AND function.
              Five commands, from nothing to a trained model:
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'create_dataset("and")',
            'init_mlp([2, 1], "demo")',
            'train_mlp("demo", "and_inputs", "and_targets", 0.5, 200)',
            'evaluate_mlp("demo", "and_inputs", "and_targets")',
            'mlp_predict("demo", [1, 1])',
          ]}
          label="Train AND in 5 commands"
        />

        <PredictExercise
          question="After training, you run mlp_predict('demo', [1, 1]). The AND of 1,1 is 1. Will the prediction be exactly 1.0?"
          hint="The network uses tanh, which outputs between -1 and 1. Can tanh ever output exactly 1?"
          answer="No — it'll be close (like 0.8 or 0.95) but never exactly 1.0. Tanh asymptotically approaches 1."
          explanation="This is normal! We threshold at 0.5 for classification: output > 0.5 → predict 1, else predict 0. The raw output being 0.95 vs 1.0 doesn't matter for accuracy. Real models use sigmoid (0 to 1) instead of tanh (-1 to 1) for binary classification, but tanh works fine for learning."
        />

        {/* ============================================================ */}
        {/* SECTION: Learning Rate Experiments */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            The Learning Rate: Your Most Important Knob
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              The learning rate is the single most important hyperparameter.
              Too high: training explodes. Too low: training crawls. Let's see
              both failure modes live.
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'create_dataset("xor")',
            'init_mlp([2, 4, 1], "fast")',
            'train_mlp("fast", "xor_inputs", "xor_targets", 2.0, 200)',
          ]}
          label="Try lr=2.0 (too high) on XOR"
        />

        <TryThis
          commands={[
            'init_mlp([2, 4, 1], "slow")',
            'train_mlp("slow", "xor_inputs", "xor_targets", 0.01, 200)',
          ]}
          label="Try lr=0.01 (too low) on XOR"
        />

        <PredictExercise
          question="You trained with lr=2.0 and lr=0.01 for 200 epochs each. Which one has lower final loss?"
          hint="lr=2.0 might overshoot and oscillate. lr=0.01 is stable but very slow. 200 epochs might not be enough for either extreme."
          answer="It depends on the initialization, but likely neither works well. lr=2.0 may oscillate or explode, lr=0.01 barely moves. lr=0.5 is the sweet spot for this problem."
          explanation="This is why learning rate tuning matters. In practice, people start with lr=0.001 or 0.01 and adjust. Modern optimizers like Adam adapt the learning rate per-parameter, but understanding SGD gives you the foundation."
          commands={[
            'init_mlp([2, 4, 1], "good")',
            'train_mlp("good", "xor_inputs", "xor_targets", 0.5, 500)',
            'evaluate_mlp("good", "xor_inputs", "xor_targets")',
          ]}
          commandLabel="Try lr=0.5 (just right)"
        />

        {/* ============================================================ */}
        {/* SECTION: What Training Actually Changes */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            What Training Actually Changes
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            <p>
              Training modifies <strong>only the weights and biases</strong>.
              The architecture doesn't change. The data doesn't change. The
              forward pass logic doesn't change. Just the numbers inside the
              weight matrices.
            </p>
            <p>
              Before training: random weights → random output → high loss.
              After training: learned weights → correct output → low loss.
              Same network, different numbers. That's all learning is.
            </p>
            <p>
              You can inspect what the weights look like after training:
            </p>
          </div>
        </div>

        <TryThis
          commands={[
            'tensor_inspect("good_w0")',
            'tensor_inspect("good_w1")',
          ]}
          label="Inspect the learned weights"
        />

        <InfoCard title="What do the weights mean?" accent="blue">
          <div className="space-y-2">
            <p>
              For the XOR problem with a 2→4→1 network: <code>W0</code> (shape
              [2,4]) is the first layer — it transforms 2 inputs into 4 hidden
              features. Each column is one hidden neuron's "recipe" for combining
              the inputs. <code>W1</code> (shape [4,1]) combines those 4 hidden
              features into the final output.
            </p>
            <p>
              The hidden layer has learned to represent XOR in a way that's
              linearly separable. You can't see "XOR" by looking at the numbers
              directly — but the network found a representation that works.
              That's the magic of learned representations.
            </p>
          </div>
        </InfoCard>

        {/* ============================================================ */}
        {/* MINI PROJECT */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/30 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-accent-emerald)]">
            Mini Project: Train OR and Compare
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Train a network on OR (output is 1 if either input is 1) and
              compare it to AND. Which one trains faster? Which needs fewer
              epochs? Can a single neuron (no hidden layer) learn both?
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Create the OR dataset and train a 2→1 network for 200 epochs</li>
              <li>Check the loss curve — how fast does it converge?</li>
              <li>Compare to AND: create AND dataset, train same architecture</li>
              <li>Which has lower final loss? Why? (Hint: OR has 3 positive examples, AND has only 1)</li>
              <li>Bonus: try a 2→4→1 network on OR. Is the hidden layer needed?</li>
            </ol>
          </div>
          <TryThis
            commands={[
              'create_dataset("or")',
              'init_mlp([2, 1], "or_net")',
              'train_mlp("or_net", "or_inputs", "or_targets", 0.5, 200)',
              'evaluate_mlp("or_net", "or_inputs", "or_targets")',
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
              A <strong>loss function</strong> (MSE) measures how wrong the
              model is. Lower loss = better predictions.
            </li>
            <li>
              <strong>SGD</strong> updates weights by subtracting lr × gradient.
              The gradient points toward higher loss, so we go the opposite way.
            </li>
            <li>
              The <strong>training loop</strong> is: forward → loss → backward →
              update. Same loop for every model, every dataset.
            </li>
            <li>
              <strong>Learning rate</strong> controls step size. Too high =
              explodes. Too low = crawls. Start moderate, adjust.
            </li>
            <li>
              Training only changes <strong>weights and biases</strong>. The
              architecture and code stay the same — only the numbers change.
            </li>
            <li>
              You trained a network that <strong>learned from data</strong>.
              No one told it the rule — it discovered the pattern by minimizing
              the loss.
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* NEXT UP + NAV */}
        {/* ============================================================ */}
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Ready for the projects?
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You now understand every piece: tensors, autograd, layers, attention,
            transformers, model files, AND training. Head to the Projects section
            in the sidebar to put it all together — train an AND gate, crack the
            XOR problem, and see why depth matters.
          </p>
        </div>

        <LearnNav current={9} />
        <ClaudePrompts chapter={9} />
      </div>
    </PageTransition>
  );
}
