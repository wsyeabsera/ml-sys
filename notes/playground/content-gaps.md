# Content Gap Analysis — 2026-03-15

## Tools that NO chapter or project teaches

These MCP tools exist but aren't mentioned in any learning content:

| Tool | Category | Why it matters |
|------|----------|---------------|
| `tensor_add` | Tensor ops | Basic element-wise addition — used in residual connections |
| `tensor_mul` | Tensor ops | Element-wise multiply — used in gating (SwiGLU) |
| `tensor_reshape` | Tensor ops | Reshape without copying — fundamental operation |
| `tensor_get` | Tensor ops | N-dimensional indexing |
| `mse_loss` | Training | Loss computation — core of training loop |
| `cargo_exec` | Project | Building Rust code |
| `read_file` | Project | Reading source files |

## Chapters that don't reference the tools they teach about

| Chapter | Teaches | Missing tool references |
|---------|---------|----------------------|
| Ch2 (Tensors) | Reshape, add, mul | No `tensor_reshape`, `tensor_add`, `tensor_mul` TryThis buttons |
| Ch7 (Transformers) | RMSNorm, SiLU, RoPE | No runnable examples — these ops aren't exposed as individual MCP tools |
| Ch8 (Running LLM) | Full pipeline | No `llama_load`/`llama_generate` TryThis (needs model file) |
| Ch9 (Transformers) | SwiGLU uses element-wise mul | No `tensor_mul` reference |

## Training tools have no chapter

The 6 new training tools (`create_dataset`, `init_mlp`, `mse_loss`, `train_mlp`, `evaluate_mlp`, `mlp_predict`) are only covered in the 2 project pages. There's no chapter that explains:
- What a loss function is and why MSE works
- What SGD does step by step
- What a training loop looks like
- What learning rate means
- What overfitting is

**Recommendation:** Add a **Chapter 9: Training** (between current "Running a Real LLM" and the projects) that explains the training loop conceptually, with exercises. Currently the learning arc goes:
1-8: Understand ops → Projects: Suddenly training!

There's a conceptual gap — the projects assume you understand training, but no chapter teaches it.

## Projects lack personality

The projects are step-by-step instructions but:
- No humor (chapters have "flat arrays with delusions of grandeur")
- No "why this matters" hooks
- No celebration moments ("you just did what Minsky said was impossible!")
- The XOR project mentions Minsky but doesn't lean into the drama enough
- No "what if" explorations after each step
- Bonus challenges are a flat list, not engaging

## Missing project pages

From the plan, 2 of 4 projects are built:
- ✅ Project 1: Train AND
- ✅ Project 2: XOR Problem
- ❌ Project 3: Tiny Language Model
- ❌ Project 4: Attention Explorer

## Chapter 2 (Tensors) is missing key operations

Ch2 covers create, inspect, transpose, matmul, strides. But doesn't cover:
- `tensor_reshape` — arguably more important than transpose for daily use
- `tensor_add` / `tensor_mul` — element-wise ops used everywhere
- These should have TryThis buttons and exercises

## Action items (priority order)

### 1. Add tensor_reshape, tensor_add, tensor_mul to Chapter 2
Quick win — add TryThis and exercises for these fundamental ops.

### 2. Add a "Training" chapter (Learn 09)
Between current chapter 8 and the projects. Covers:
- What is a loss function (MSE with worked example)
- What is gradient descent (step-by-step with TryThis)
- The training loop (forward → loss → backward → update)
- Learning rate (too high vs too low, with experiments)
- Train AND gate as the in-chapter exercise
This chapter bridges "understand ops" → "can train models"

### 3. Inject personality into projects
Rewrite Project AND and XOR with:
- Funnier hooks and section titles
- "Wait, what?" moments
- Celebration after training succeeds
- More "what if" exploratory prompts
- Historical context (Minsky/Papert drama for XOR)

### 4. Add mse_loss standalone exercise to Chapter 3 or new Chapter 9
The loss function is currently hidden inside `train_mlp`. It deserves its own explanation with a PredictExercise.

### 5. Build remaining 2 projects (lower priority)
- Tiny Language Model (advanced)
- Attention Explorer (intermediate)
