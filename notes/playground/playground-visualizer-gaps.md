# Playground ↔ Visualizer Gap Analysis

Status: **All 4 phases done** (2026-03-15)

## The problem

The REPL and Visualizer work well independently, but the connection between them is one-directional and the UX has rough edges that break flow. You go REPL → Visualizer but can't go back. Outputs that should be visualizable aren't. Repeated entries clutter the history.

---

## Phase 1: Clickable Outputs (highest impact, easy) ✓ DONE

**Goal:** Make outputs interactive — click things to do things, instead of retyping.

### 1a. Clickable tensor names in `tensor_list` output
- Each tensor name in the list (`"m"`, `"net_w0"`, etc.) becomes a button
- Clicking auto-runs `tensor_inspect("name")` in the REPL
- Tiny change: just wrap names in `<button>` with an `onInspect` callback

### 1b. "Re-run in REPL" link from Visualizer
- The Visualizer command header shows `train_mlp("net", ...)` — make it clickable
- Clicking navigates to `/playground?commands=<base64>` (same mechanism TryThis uses)
- Lets you modify and re-run from the Visualizer without manually copying

### 1c. Add `prediction` to rich viz types
- Add `"prediction"` to `RICH_VIZ_TYPES` in `output-store.ts`
- Add a simple prediction viz in `VizRenderer`: input → output arrow with values
- Currently predictions show inline but can't be opened in Visualizer

**Files:** `ReplOutput.tsx` (1a), `Visualize.tsx` (1b), `output-store.ts` + `Visualize.tsx` (1c)
**Effort:** Low — each is a small UI change

---

## Phase 2: Better Recent Outputs List (medium impact, easy) ✓ DONE

**Goal:** The Visualizer's recent outputs list should be clean and navigable.

### 2a. Deduplicate recent outputs
- Same command run multiple times shows N identical entries
- Group by command string, show most recent + count: `autograd_expr(...) ×3 — 13h ago`
- Or just show the latest per unique command

### 2b. Type badges on recent outputs
- Replace plain "tensor" / "training" text with the same colored badge pills from ReplOutput
- `training` gets emerald badge, `autograd` gets blue, etc.
- Visual scan becomes instant

### 2c. Filter by type
- Row of filter pills at top: All | Tensor | Autograd | Training | MLP | ...
- Click to filter the list
- Active filter highlighted, "All" is default

**Files:** `Visualize.tsx` (all three)
**Effort:** Low-medium — mostly JSX/state work

---

## Phase 3: Richer Empty States (medium impact, easy) ✓ DONE

**Goal:** First-time users should know what to do on both pages.

### 3a. Visualizer empty state
- Current: "No output to visualize" + one line hint
- New: similar to REPL's rich empty state — show what types of visualizations are available:
  - "Tensor Explorer" — grid/stats view of tensor data
  - "Training History" — loss curves over epochs
  - "Autograd Graph" — computation graph with gradient flow
  - "Attention Heatmap" — token-to-token attention weights
  - "Neuron Graph" — single neuron computation flow
  - "MLP Architecture" — layer diagram with weights
- Each with a small icon/illustration and "Run this in REPL" link
- Links navigate to REPL with pre-filled commands (same as Quick Start snippets)

**Files:** `Visualize.tsx`
**Effort:** Low — JSX/design work

---

## Phase 4: Output Chaining (nice-to-have, more complex) ✓ DONE

**Goal:** Reduce the friction of multi-step workflows.

### 4a. Auto-inspect after tensor_create
- When `tensor_create` succeeds, automatically show the compact tensor viz (like tensor_inspect does)
- Currently tensor_create returns JSON with shape/data but the REPL shows the raw create response, not the grid view
- Could detect `tensor_create` responses and render them with TensorViz

### 4b. Consistent type badges across all REPL output types
- Some outputs (training, evaluation, neuron, mlp, attention, dataset) have colored type badges
- Others (tensor, autograd) don't — they have their own viz but no badge label
- Add a subtle type badge to ALL output types for visual consistency

**Files:** `ReplOutput.tsx`
**Effort:** Low per item

---

## Priority order

1. **Phase 1a** (clickable tensor names) — biggest daily friction for REPL users
2. **Phase 1b** (re-run from Visualizer) — completes the bidirectional flow
3. **Phase 2b** (type badges on recent outputs) — trivial, big visual improvement
4. **Phase 2a** (dedup recent outputs) — reduces clutter
5. **Phase 1c** (prediction viz) — small gap but easy fix
6. **Phase 2c** (filter by type) — useful once you have many outputs
7. **Phase 3a** (visualizer empty state) — good first impression
8. **Phase 4a** (auto-inspect) — nice polish
9. **Phase 4b** (consistent badges) — pure polish

## Decision

Start with Phase 1 (clickable outputs + re-run link + prediction viz) — these directly reduce friction in the learning workflow.
