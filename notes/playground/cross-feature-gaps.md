# Cross-Feature Gap Analysis — Chapters ↔ REPL ↔ Visualizer ↔ Projects

Status: **all 11 items done** (2026-03-15)

## Context

We've built a lot of features across the platform today. This analysis looks at how well they connect to each other and where the seams show.

### What exists now
- **9 chapters** with 55+ exercises, 49 TryThis buttons, PredictExercise components
- **REPL** with autocomplete, signatures, help, workflows, snippets, copy, click-to-rerun, collapsible outputs, duration badges, keyboard shortcuts
- **Visualizer** with 7 viz types, deduped recent outputs, type badges, type filter, "Run in REPL" link
- **3 projects** (AND, XOR, Attention Explorer) with guided steps
- **4 workflows** (xor, tensor-basics, autograd, vanishing-gradients) with step-by-step explanations

---

## Phase 1: Chapters → REPL Connection

**Problem:** Chapters have TryThis buttons that open the REPL with commands, but there's no way to go back. If a student runs a TryThis and gets confused, they're stranded.

### 1a. "Back to chapter" link in REPL
- When REPL is opened via TryThis (URL has `commands` param), show a "Back to Chapter N" link
- Needs: pass chapter origin in the URL, e.g. `?commands=...&from=/learn/3`
- Small banner at top: "Running examples from Learn 03: Autograd — [Back to chapter]"

### 1b. Chapters reference workflows
- Chapter 3 (Autograd) should mention: "Want a guided walkthrough? Try `/workflow autograd` in the REPL"
- Chapter 4 (Neural Networks) → `/workflow xor`
- Chapter 2 (Tensors) → `/workflow tensor-basics`
- Add a small callout box at the end of relevant sections

### 1c. PredictExercise "verify" → shows result inline
- Currently PredictExercise has a "Verify in REPL" button that navigates away
- Alternative: run the command inline and show the result without leaving the chapter
- Needs: either embed a mini REPL or use the bridge directly from the chapter page
- **Higher complexity — defer if not worth it**

---

## Phase 2: Projects → Workflows Connection

**Problem:** Projects (AND, XOR, Attention) and Workflows (xor, autograd, etc.) overlap but don't reference each other.

### 2a. Project pages link to workflows
- ProjectXor page should say: "Want to see this automated? Run `/workflow xor` in the REPL"
- ProjectAnd → could add a `/workflow and` workflow
- Helps students who get stuck on projects by showing the full sequence

### 2b. Create workflow for AND gate
- Simple 6-step workflow: create AND dataset → init → train → evaluate → predict
- Mirrors ProjectAnd but with explanations inline
- Currently missing from the 4 workflows

### 2c. Workflow completion → project link
- When a workflow completes, show: "Want to explore further? Try the [XOR Problem project](/projects/xor)"
- Connects the automated experience to the self-guided one

---

## Phase 3: Visualizer ↔ Chapters Connection

**Problem:** Chapters show static diagrams (SimpleGraph, MLPDiagram, etc.) but the Visualizer has richer interactive versions. No connection between them.

### 3a. Chapter viz → "Open in Visualizer" links
- The SimpleGraph in Chapter 3 could have: "See this in the full Visualizer →"
- MLPDiagram in Chapter 4 → link to Visualizer with the same MLP data
- Would need to pre-store the output data and link by outputId, OR generate a paste-JSON link

### 3b. Visualizer → chapter references
- When viewing an autograd result, show: "Learn about autograd in [Chapter 3](/learn/3)"
- When viewing training results: "Learn about training in [Chapter 9](/learn/9)"
- Small "Learn more" link in the viz header, keyed by output type

---

## Phase 4: REPL Help → Chapter/Project Deep Links

**Problem:** `help tensor_create` shows description and example, but doesn't link to where the tool is taught.

### 4a. Help output includes chapter links
- `help autograd_expr` → "Covered in Learn 03: Autograd"
- `help train_mlp` → "Covered in Learn 09: Training"
- `help mlp_forward` → "Covered in Learn 04: Neural Networks"
- Add a `chapter` field to `TOOL_INFO` in `mcp-shorthand.ts`

### 4b. Help output includes related workflows
- `help train_mlp` → "Try `/workflow xor` for a guided example"
- `help autograd_expr` → "Try `/workflow autograd`"
- Add a `workflow` field to `TOOL_INFO`

---

## Phase 5: Workflow → Visualizer Integration

**Problem:** Workflows run commands but don't link to the Visualizer for the outputs.

### 5a. Workflow steps with rich outputs show "Open in Visualizer"
- Currently workflow steps just show the command output
- Training step should show the loss curve link
- Autograd steps should show the graph link
- Already partially works since ReplOutput renders viz links — need to verify all workflow outputs get outputIds

---

## Priority order

1. **1b** (chapters mention workflows) — zero code, just add text to chapters
2. **2c** (workflow completion → project link) — tiny change in workflow end state
3. **3b** (visualizer → chapter links) — small type→chapter map
4. **4a** (help → chapter links) — add field to TOOL_INFO
5. **4b** (help → workflow links) — add field to TOOL_INFO
6. **2b** (AND workflow) — add one more workflow definition
7. **1a** (back to chapter link) — URL param handling
8. **2a** (projects link to workflows) — add text to project pages
9. **5a** (workflow viz links) — verify/fix output storage
10. **3a** (chapter viz → visualizer) — needs data piping, more complex
11. **1c** (inline verify) — highest complexity, defer

## Decision

Items 1-6 are mostly content/data changes (adding text, adding fields). Items 7-9 are small code changes. Items 10-11 are bigger. Start with the content layer (1-6) since they require minimal code and maximum connection.
