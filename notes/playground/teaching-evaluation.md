# Teaching Evaluation — Autograd & Neural Networks

## Chapter 3 (Autograd) — Grade: B

### What works well
- Hook is strong: "wiggle this number" demystifies gradients immediately
- The y=3x → y=x² progression is good scaffolding
- Exercises are well-placed after each concept
- The SimpleGraph viz with step-through is excellent

### Critical gaps (student gets lost here)

1. **"gradient = 3" jumps to "gradient descent" in ONE paragraph.** The gradient section goes: "gradient is slope" → "in ML, loss/weights" → "positive gradient? Turn it down. That's gradient descent." This is THREE major concepts crammed into three sentences. A student who just learned what a gradient is now needs to understand loss, weights, AND gradient descent simultaneously.

**Fix:** Split into two sections. First: "gradients as slope" with exercises. Then: "why gradients matter for ML" as a separate section with its own exercises and worked example.

2. **Chain rule is stated but not built up.** The chapter says "if y = f(g(x)), then dy/dx = dy/dg × dg/dx" and expects this to click. For someone who doesn't have calculus background, this is opaque. Where did f and g come from? What's a "composed function"?

**Fix:** Add a concrete worked example: "y = tanh(a * b). Step 1: compute a*b = d. Step 2: compute tanh(d) = y. Going backward: dy/dd = (1-y²). dd/da = b. So dy/da = (1-y²) × b. That's the chain rule — multiply the local gradients along the path."

3. **The gradient table is presented as a cheat sheet but never walked through.** The table shows mul/add/tanh/matmul gradients. But there's no worked example that traces through a multi-step graph using the table entries.

**Fix:** After the table, add a "let's trace through y = tanh(a*b + c) step by step" worked example that explicitly references each table row.

4. **The jump from scalars to tensors is too abrupt.** "Everything we just learned scales to tensors. The chain rule is the same, but now gradients are matrices." This is a HUGE claim made in one sentence.

**Fix:** Show one concrete element-wise example: "for add, the gradient is still 1 for each element. For mul, element [i] of a's gradient is b[i]. It's the scalar rule applied independently to each element."

### Missing depth
- Why does backward start with gradient = 1? This is stated but never explained. ("The output's gradient with respect to itself is always 1" — why?)
- The topological sort section was removed in the rewrite but the concept matters — backward must process nodes in order
- No explanation of why we need a GRAPH vs just computing gradients directly

### Suggested additions
- A "trace through the backward pass by hand" walkthrough for tanh(a*b + c)
- An exercise: "draw the computation graph for this expression" (even on paper)
- A "what happens if we DON'T use autograd" section showing manual gradient computation to motivate why autograd exists

---

## Chapter 4 (Neural Networks) — Grade: B-

### What works well
- The "most overhyped for loop" hook is great
- The pseudocode opening is perfect for demystification
- The worked numerical example (single layer with real numbers) is excellent
- The layer collapse explanation is clear

### Critical gaps

1. **No bridge from "I know autograd" to "now there are layers."** The chapter opens with "a layer is tanh(x @ W + b)" but never says WHY this specific combination. Why matmul? Why not something else? Why does multiplying input by a weight matrix make sense conceptually?

**Fix:** Add a "what does a weight matrix DO?" section. Something like: "Each row of W is a 'detector.' It computes a dot product with the input — high value means 'this input pattern matches what this neuron is looking for.' The bias shifts the threshold. Tanh squashes the result."

2. **The forward pass is clear, but the backward pass is handwaved.** The chapter lists 5 backward steps but each is just a formula. "Through matmul (layer 1): d(h) = d(pre₁) @ W₁ᵀ" — this is correct but unexplained. A student who just learned autograd on scalars now sees matrix gradients with no derivation.

**Fix:** Trace through ONE backward step in detail: "d(W₁) = hᵀ @ d(pre₁). Why? This is the matmul gradient rule from Ch3. h is the input to the matmul, pre₁ is the output, so the gradient of the weight is input-transposed times incoming gradient."

3. **Vanishing gradients are mentioned but the intuition isn't built.** The chapter says "tanh multiplies gradient by (1-value²) which is ≤ 1" but doesn't show a concrete example of gradients shrinking through multiple layers.

**Fix:** Add a concrete example: "Layer 3 tanh output = 0.9. Gradient multiplier = 1 - 0.81 = 0.19. Layer 2 tanh output = 0.8. Multiplier = 0.36. Layer 1: 0.7 → 0.51. Total: 0.19 × 0.36 × 0.51 = 0.035. The gradient reaching layer 1 is just 3.5% of the output gradient."

4. **No "what does the hidden layer LEARN?" discussion.** The chapter shows how to compute with layers but never explains what the hidden representation means conceptually.

**Fix:** After the MLP section, add: "The hidden layer transforms the input into a new representation. For XOR (Project 2), the hidden layer finds a way to represent [0,0], [0,1], [1,0], [1,1] as 4 points where the XOR pattern becomes linearly separable. The network INVENTED this representation during training."

### Missing depth
- Why tanh and not some other function? Brief mention of ReLU but no comparison
- What does "feature" mean in "in_features → out_features"?
- No intuition for what dimensions mean: "2→3→1 means the network compresses 2 inputs into 3 internal features, then compresses to 1 output. Why might you want MORE hidden features than inputs?"

### Suggested additions
- "What does a weight matrix actually do?" intuition section
- One fully traced backward step through a layer (not just formulas)
- A concrete vanishing gradient calculation
- "What did the hidden layer learn?" discussion
- Exercise: "If you change w[0,0] by 0.01, predict how the output changes" (connects back to gradients)

---

## Priority fixes (biggest impact, least effort)

1. **Ch3: Split the gradient→gradient descent paragraph** — 10 minutes, prevents the #1 confusion point
2. **Ch4: Add "what does a weight matrix do?" section** — 20 minutes, builds intuition
3. **Ch3: Add a traced backward example for tanh(a*b + c)** — 15 minutes, makes the algorithm concrete
4. **Ch4: Add concrete vanishing gradient calculation** — 10 minutes, makes abstract problem tangible
5. **Ch4: Add "what did the hidden layer learn?" discussion** — 15 minutes, connects to projects
