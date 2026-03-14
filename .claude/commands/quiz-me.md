---
description: Quiz me on a chapter topic to test understanding — uses MCP tools for interactive questions
---

Quiz the user on a topic from the learning arc. Make it interactive — use MCP tools to create problems they solve.

## MCP tools used
- `tensor_create`, `tensor_inspect`, `tensor_transpose`, `tensor_matmul` — for tensor questions
- `autograd_expr`, `autograd_neuron` — for autograd questions
- `attention_forward` — for attention questions
- `mlp_forward` — for neural network questions

## Parameters
- $ARGUMENTS — the topic (e.g., "tensors", "strides", "autograd", "attention", "chapter 3")

## Behavior
1. Read the relevant chapter page from `site/src/pages/` to understand what was taught
2. Start with an easy question (conceptual), then build to harder ones (computational)
3. For computational questions, set up a problem using MCP tools — e.g., "I just created tensor A with shape [3,2]. What will the strides be?" Then verify with `tensor_inspect`
4. Give encouraging feedback. If wrong, explain why and give a simpler follow-up
5. After 3-5 questions, summarize what they got right and what to review
6. Keep the tone fun and conversational — match the chapter style
