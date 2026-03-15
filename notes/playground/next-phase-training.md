# Next Phase: Training & Projects

## The gap

The current system teaches understanding but not building. You can compute gradients but can't use them to train a model. The pieces are all there — they just need a training loop to connect them.

## New MCP tools needed (Rust changes)

### 1. `create_dataset(type, n_samples?)`
```json
// Input
{ "type": "xor" }
// Output
{
  "op": "create_dataset",
  "type": "xor",
  "inputs": { "data": [0,0, 0,1, 1,0, 1,1], "shape": [4, 2] },
  "targets": { "data": [0, 1, 1, 0], "shape": [4, 1] },
  "n_samples": 4
}
```
Built-in datasets: `"and"`, `"or"`, `"xor"`, `"circle"` (100 points), `"spiral"` (200 points).
Stores inputs and targets as named tensors in the store.

### 2. `init_mlp(architecture, name?)`
```json
// Input
{ "architecture": [2, 4, 1], "name": "my_mlp" }
// Output
{
  "op": "init_mlp",
  "name": "my_mlp",
  "architecture": [2, 4, 1],
  "layers": 2,
  "total_params": 17,
  "weight_names": ["my_mlp_w0", "my_mlp_b0", "my_mlp_w1", "my_mlp_b1"]
}
```
Creates weight tensors with random Xavier initialization and stores them in the tensor store. Returns the names so you can inspect them.

### 3. `mse_loss(predicted_name, target_name)`
```json
// Input
{ "predicted": "output", "target": "xor_targets" }
// Output
{
  "op": "mse_loss",
  "loss": 0.2534,
  "gradient": { "data": [...], "shape": [4, 1] }
}
```
Computes mean squared error and its gradient. Standalone tool for understanding; `train_mlp` uses it internally.

### 4. `train_mlp(mlp_name, input_name, target_name, lr, epochs)`
```json
// Input
{ "mlp": "my_mlp", "inputs": "xor_inputs", "targets": "xor_targets", "lr": 0.1, "epochs": 1000 }
// Output
{
  "op": "train_mlp",
  "final_loss": 0.0012,
  "initial_loss": 0.2534,
  "epochs": 1000,
  "loss_history": [0.2534, 0.2401, ..., 0.0012],
  "loss_history_sampled": [0.2534, 0.15, 0.08, 0.03, 0.01, 0.0012]
}
```
Full training loop. Updates weights in-place. Returns sampled loss history for visualization (not all 1000 points — sample every N epochs to keep output small).

### 5. `evaluate_mlp(mlp_name, input_name, target_name?)`
```json
// Input
{ "mlp": "my_mlp", "inputs": "xor_inputs", "targets": "xor_targets" }
// Output
{
  "op": "evaluate_mlp",
  "predictions": { "data": [0.02, 0.98, 0.97, 0.03], "shape": [4, 1] },
  "loss": 0.0012,
  "accuracy": 1.0
}
```
Forward pass only, no gradient update. With optional targets, computes loss and accuracy.

### 6. `mlp_predict(mlp_name, input_data)`
```json
// Input
{ "mlp": "my_mlp", "input": [1, 0] }
// Output
{
  "op": "mlp_predict",
  "input": [1, 0],
  "output": [0.97],
  "prediction": 1
}
```
Single-sample prediction. Convenience tool for testing after training.

## New chapters / project pages

### Project 1: "Train a Neuron to Learn AND"
**Difficulty:** Beginner
**What you build:** A single neuron that learns the AND function (both inputs must be 1)
**Steps:**
1. Create the AND dataset: [[0,0],[0,1],[1,0],[1,1]] → [0,0,0,1]
2. Initialize a neuron with random weights
3. Run 100 training steps, watch the loss decrease
4. Test: does it output ~0 for [0,1] and ~1 for [1,1]?

**Why this matters:** This is the simplest possible thing you can train. If you can do this, you understand the full loop.

### Project 2: "The XOR Problem — Why Depth Matters"
**Difficulty:** Intermediate
**What you build:** A 2-layer network that learns XOR (which a single neuron can't)
**Steps:**
1. Try training a single neuron on XOR — watch it fail
2. Add a hidden layer (2→2→1) — watch it succeed
3. Visualize what the hidden layer learned (it found a new representation)

**Why this matters:** This is THE classic demonstration of why neural networks need depth. A single neuron can only draw a straight line. XOR needs a curve.

### Project 3: "Build a Tiny Language Model"
**Difficulty:** Advanced
**What you build:** A character-level language model that learns to predict the next character
**Steps:**
1. Create a tiny dataset from a string ("hello world hello world...")
2. Build an embedding + attention + output layer
3. Train it to predict next characters
4. Generate text — watch it go from random to recognizable

**Why this matters:** This is a miniature version of what GPT does. Same architecture, same training, just tiny.

### Project 4: "Attention Pattern Explorer"
**Difficulty:** Intermediate
**What you build:** Train attention to learn simple pattern matching
**Steps:**
1. Create sequences with a pattern (e.g., "copy the first token to the end")
2. Train attention weights to discover the pattern
3. Visualize the attention matrix — see it learn to "look at" the right position

**Why this matters:** You'll see attention weights change during training — from random to meaningful. This is how transformers learn to process language.

## Design decisions

### 1. Training state: in-place weight updates

Weights get modified in-place in the MCP tensor store. `sgd_step("w0", 0.01)` reads the tensor's data and its stored gradient, computes `data[i] -= lr * grad[i]`, and updates the tensor in place. This means:
- No new tensor per step (memory efficient)
- The tensor store becomes mutable during training
- We need to store gradients alongside tensor data in the Rust store

**Rust change needed:** Add a `grad: Option<Vec<f32>>` field to the Tensor struct. After `mlp_forward` with backward, the gradients get written to each weight tensor's `grad` field. Then `sgd_step` reads `grad` and updates `data`.

### 2. Training progress: stream via Socket.io

The bridge already has Socket.io. `train_mlp` will emit progress events during training:

```typescript
// Bridge → Browser (streamed during training)
socket.emit("training_progress", {
  epoch: 42,
  loss: 0.0312,
  accuracy: 0.95,
  total_epochs: 1000,
});
```

The REPL shows a live progress bar / loss readout while training runs. When complete, the full history is returned via the normal ack callback. This means:
- No hanging REPL during long training
- Live feedback on loss decrease
- The bridge needs a new event type for streaming

**Alternative for MVP:** Just run all epochs and return at the end. Add streaming later. Training on toy datasets (4-100 samples) takes milliseconds, so the REPL won't hang noticeably. Stream when we need it.

**Decision: MVP without streaming, add streaming later when needed.**

### 3. Projects: both pages and skills

Project pages at `/projects/xor` etc. with step-by-step instructions, TryThis, PredictExercise. Plus Claude skills like `/project xor` for interactive guided sessions. The page is the reference, the skill is the teacher.

### 4. Loss function: separate from autograd, feeds into MLP backward

The current `mlp_forward` already runs backward and stores gradients. We add a loss function that:
1. Takes the MLP output and the target
2. Computes the loss value (MSE)
3. Computes the gradient of the loss with respect to the output
4. Feeds that gradient into the MLP's backward pass

In practice, we modify `train_mlp` to do this internally:
```
for each epoch:
  output = mlp.forward(input)
  loss = mse(output, target)
  loss_grad = 2 * (output - target) / n  // MSE gradient
  mlp.backward(loss_grad)  // backprop from loss gradient
  update weights
```

The user doesn't need to call loss + backward separately. `train_mlp` handles the full loop. But we also expose `mse_loss` as a standalone tool for understanding.

### 5. Full workflow: the training pipeline

The minimum viable flow in the REPL:

```
// 1. Create a dataset
create_dataset("xor")

// 2. Define the network (weights get initialized)
init_mlp([2, 4, 1])  // new tool: creates weight tensors with random init

// 3. Train
train_mlp("mlp_0", "xor_inputs", "xor_targets", 0.1, 1000)
// Returns: { final_loss, loss_history, epochs }

// 4. Evaluate
evaluate_mlp("mlp_0", "xor_inputs", "xor_targets")
// Returns: { predictions, loss, accuracy }

// 5. Test on new data
mlp_predict("mlp_0", [1, 0])  // → ~1.0 (XOR of 1,0 is 1)
```

This is 5 commands to go from nothing to a trained model. Each step is observable in the Visualizer.

## Implementation order

### Phase 1: Rust training tools
1. Add `grad` field to Tensor struct in rs-tensor
2. Implement `create_dataset` — AND, OR, XOR, circle, spiral
3. Implement `init_mlp` — random weight initialization + tensor store
4. Implement `mse_loss` — loss value + gradient
5. Implement `train_mlp` — full loop: forward → loss → backward → SGD update
6. Implement `evaluate_mlp` — forward only with metrics
7. Implement `mlp_predict` — single sample convenience
8. `cargo test` for all new tools
9. Build and verify via REPL: 5-command training pipeline works end-to-end

### Phase 2: Frontend — parser + viz
1. Update `mcp-shorthand.ts` — add schemas for new tools
2. Update `result-parser.ts` — detect training, dataset, evaluation results
3. Update `output-store.ts` — detectHasRichViz for new types
4. New Visualizer component: `TrainingHistoryViz` — loss curve SVG
5. New Visualizer component: `DatasetViz` — scatter plot for 2D datasets
6. New Visualizer component: `PredictionsViz` — predictions vs targets
7. Update `ReplOutput` — compact summaries for new result types
8. Update `ToolReference` page — add new tools
9. Vitest tests for new parser/detection logic

### Phase 3: Project pages
1. Add `/projects` section to sidebar
2. Create `ProjectNav` component (like LearnNav but for projects)
3. **Project 1: Train AND** — beginner, ~10 steps, PredictExercise throughout
4. **Project 2: XOR Problem** — intermediate, shows why depth matters
5. **Project 3: Tiny Language Model** — advanced, character-level with attention
6. **Project 4: Attention Explorer** — watch attention learn patterns
7. Add Claude skills: `/project and`, `/project xor`, etc.

### Phase 4: Polish
1. Training progress streaming via Socket.io (if needed for larger datasets)
2. Save/load trained models (serialize weights to JSON)
3. "Compare runs" in Visualizer (overlay two loss curves)

## What this enables

After these changes, the learning path becomes:
1. **Learn 01-08** → understand every operation
2. **Projects** → combine operations into trainable systems
3. **Playground** → experiment freely with everything

The projects are the bridge between "I understand the pieces" and "I can build things." Without them, the learning stops at understanding.

## Sidebar structure after projects

```
▾ PLAYGROUND
  >_ REPL
  ~~ Visualizer
  ?? Tool Reference

▾ LEARN
  01-08 (existing chapters)

▾ PROJECTS    ← new
  🔨 Train AND Gate
  🔨 The XOR Problem
  🔨 Tiny Language Model
  🔨 Attention Explorer

▸ MISC
```
