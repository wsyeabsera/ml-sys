---
description: Walk through a chapter interactively — read the content, run the examples, explain as we go
---

Walk the user through a learning chapter step by step, running every example live with MCP tools.

## MCP tools used
- All tensor tools — for chapter 2 examples
- `autograd_expr`, `autograd_neuron` — for chapter 3 examples
- `mlp_forward` — for chapter 4 examples
- `attention_forward` — for chapter 5 examples

## Parameters
- $ARGUMENTS — the chapter number or name (e.g., "2", "tensors", "autograd", "attention")

## Behavior
1. Read the chapter page from `site/src/pages/` to get the actual content
2. Go section by section through the chapter
3. For each concept, explain it in your own words (don't just read the page back)
4. Run the TryThis examples using MCP tools — show real results
5. At the mini project section, guide the user through each step interactively
6. After each section, pause and ask "Any questions about this before we move on?"
7. At the end, run the mini project together and celebrate what they built
