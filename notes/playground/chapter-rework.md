# Chapter Rework — Interactive, Fun, Project-Based

## The problem

The current 10 chapters were written before the REPL existed. They're static walls of text with viz sprinkled in. Now that we have a playground connected to real tensor/autograd/attention tools, the chapters feel:

- **Disconnected** — you read about tensors but can't touch them
- **Dry** — no personality, no humor, feels like a textbook
- **No payoff** — you read a chapter and... that's it. No mini project, no "I built something"

## The vision

Each chapter should:
1. **Be fun to read** — personality, wit, "wait that's actually hilarious" moments. Not a textbook.
2. **Have "Try this" buttons** — links that open the REPL with a pre-filled command. You read about matmul, you click "Try this", the REPL has `tensor_create("a", [1,2,3,4], [2,2])` ready to go.
3. **End with a mini project** — by the end of the chapter, you've built something small. "Congratulations, you just built a neuron from scratch." The project uses the REPL.
4. **Be progressive** — each chapter builds on the last. The mini project from Chapter N sets up Chapter N+1.

## "Try this" buttons

A component that links to the REPL with pre-filled commands:

```tsx
<TryThis commands={[
  'tensor_create("a", [1,2,3,4], [2,2])',
  'tensor_create("b", [5,6,7,8], [2,2])',
  'tensor_matmul("a", "b", "result")',
  'tensor_inspect("result")',
]} />
```

When clicked:
- Navigate to `/playground?commands=...` (URL-encoded commands)
- The REPL reads the query params and pre-fills the commands
- User can run them one by one or all at once
- The REPL stays separate — it's not embedded in the chapter

**Important:** The playground has no docs content in it. It's a clean REPL. The chapters link *to* it, not the other way around. The playground doesn't need to know about chapters.

## Chapter structure rework

### What stays (rename/reorganize)

| Current | New | Why keep |
|---------|-----|----------|
| Ch 1: Getting Started | Ch 1: What Are We Building? | Good intro, needs personality injection |
| Ch 2: What is a Tensor | Ch 2: Tensors — Your First Data Structure | Core concept, add "Try this" + mini project |
| Ch 5: Autograd Engine | Ch 3: Teaching Machines to Learn (Autograd) | Core concept, needs to be earlier |
| Ch 6: Layers & MLPs | Ch 4: Stacking Neurons Into Networks | Builds on autograd |
| Ch 7: Attention | Ch 5: The Attention Mechanism | Core transformer concept |
| Ch 8: GGUF Model Files | Ch 6: What's Inside a Model File? | Cool "look inside" chapter |
| Ch 9: Transformer Blocks | Ch 7: Building a Transformer | Ties it all together |
| Ch 10: Loading a Real Model | Ch 8: Running a Real LLM | The payoff — run actual inference |

### What gets moved to Miscellaneous / removed

| Current | Action | Why |
|---------|--------|-----|
| Ch 3: Phase 1 Recap | **Remove** | Meta/planning content, not learning content |
| Ch 4: The MCP Server | **Move to Misc** | Implementation detail, not ML concept. Useful reference but doesn't belong in the learning arc |

### New sidebar structure

```
▾ PLAYGROUND
  >_ REPL

▾ LEARN
  01 What Are We Building?
  02 Tensors
  03 Autograd
  04 Neural Networks
  05 Attention
  06 Model Files
  07 Transformers
  08 Running a Real LLM

▸ MISC
  The MCP Server

⚙ Settings
```

"LEARN" instead of "CHAPTERS" — it's a learning arc, not a book.

## Chapter template

Every chapter follows the same structure:

```
1. Hook (funny/surprising opening — "What if I told you every AI is just multiplication?")
2. The Concept (explain with personality, not textbook voice)
3. Try This (interactive REPL links throughout)
4. The Viz (existing viz components, but with funnier labels/captions)
5. Mini Project (guided build using REPL commands)
6. What You Built (recap — "you just built X from scratch")
7. Next Up (teaser for next chapter)
```

## Mini project ideas per chapter

| Chapter | Mini Project |
|---------|-------------|
| 01 What Are We Building? | No project — just orientation + first REPL command |
| 02 Tensors | Create a 3x3 matrix, reshape it, transpose it, verify strides changed but data didn't |
| 03 Autograd | Build `y = a*b + c`, run backward, verify gradients match hand calculation |
| 04 Neural Networks | Build a neuron, then a 2-layer MLP, watch gradients flow |
| 05 Attention | Run attention on a tiny sequence, see which tokens attend to which |
| 06 Model Files | Inspect a real GGUF file, find the attention weights, check their shapes |
| 07 Transformers | Trace a token through a full transformer block (RMSNorm → Attention → FFN) |
| 08 Running a Real LLM | Load a model and generate text — the whole pipeline |

## Tone guide

- **Conversational, not academic.** "Here's the thing about gradients..." not "A gradient is defined as..."
- **Analogies that stick.** "Tensors are just spreadsheets that got too ambitious."
- **Self-aware humor.** "This is where most tutorials show you a scary equation. We're going to build it instead."
- **Celebrate small wins.** "You just did what PyTorch does under the hood. Except PyTorch does it a billion times faster."
- **Honest about complexity.** "This part is genuinely hard. Let's break it down."

## Implementation plan

### Phase 1: Restructure sidebar + routes
- Rename sidebar sections (LEARN, MISC, PLAYGROUND)
- Move Ch3 (Phase Recap) to misc or delete
- Move Ch4 (MCP Server) to misc
- Renumber remaining chapters
- Update routes in App.tsx

### Phase 2: Add TryThis component
- `<TryThis commands={[...]} label="Try this" />`
- Navigates to `/playground?commands=base64encodedcommands`
- Playground reads query params and pre-fills history
- Style: a subtle button that fits in the chapter flow

### Phase 3: Rewrite chapters one by one
- Start with Chapter 2 (Tensors) — most natural for REPL integration
- Follow the template: hook → concept → try this → viz → mini project → recap
- Inject personality and humor
- Add TryThis buttons throughout
- Each chapter gets a dedicated mini project

### Phase 4: Connect mini projects
- Each mini project's final state becomes the starting point for the next chapter
- "In the last chapter you built X. Now let's add Y."
- Progressive complexity, each chapter assuming you did the previous project
