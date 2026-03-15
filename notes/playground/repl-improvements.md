# REPL Improvements — Phased Plan

Status: **Phase 1 + 2 done** (2026-03-15)

## The problem

The REPL works but is painful to code in. You have to memorize 28 tool signatures or keep the Tool Reference page open. There's no autocomplete, no inline help, no way to discover tools without leaving the REPL. For a learning platform, this friction kills flow — you spend time looking up syntax instead of thinking about ML.

## Current state

- CodeMirror with JS syntax highlighting, dark theme
- Shift+Enter to run, Up/Down for history, Ctrl+L to clear
- Bracket matching + auto-close brackets
- `autocompletion: false` (explicitly disabled)
- MCP shorthand parser has `TOOL_SCHEMAS` with all 28 tools and their param names — but this data isn't exposed to the editor
- Rich output rendering for 16 result types
- Session persistence in IndexedDB

---

## Phase 1: Autocomplete + Signature Hints ✓ DONE

**Goal:** Never leave the REPL to look up a tool name or its parameters.

### 1a. Tool name autocomplete
- Wire `TOOL_SCHEMAS` keys into CodeMirror's `autocompletion` extension
- Typing `ten` should show `tensor_create`, `tensor_inspect`, `tensor_list`, etc.
- Typing `auto` should show `autograd_expr`, `autograd_neuron`, `autograd_neuron_tensor`
- Group by category (tensor, autograd, training, etc.) if CM supports sections
- Include a one-line description for each tool in the completion popup

### 1b. Signature hints (parameter tooltip)
- When the cursor is inside `tool_name(|)`, show the parameter names from `TOOL_SCHEMAS`
- Example: typing `tensor_create(` shows a tooltip: `(name: string, data: number[], shape: number[])`
- Highlight the current parameter based on comma position
- This is the single highest-impact improvement

### 1c. Cmd+Enter (Mac) as alias for Shift+Enter
- Mac users expect Cmd+Enter. Add it alongside Shift+Enter.

**Files to change:**
- `src/components/playground/ReplInput.tsx` — enable autocompletion, add completion source, add signature hint extension
- `src/lib/mcp-shorthand.ts` — export tool descriptions alongside schemas (or add a `TOOL_DESCRIPTIONS` map)

**Estimated complexity:** Medium. CodeMirror has `autocompletion()` and `@codemirror/autocomplete` — we need a custom `CompletionSource` that reads from `TOOL_SCHEMAS`.

---

## Phase 2: Inline Help + Copy ✓ DONE

**Goal:** Get information without leaving the REPL. Easily grab results.

### 2a. `help` command
- Typing `help` lists all tool categories and tool counts
- Typing `help tensor_create` shows: signature, param types, one-line description, example usage
- Renders as a styled output (not raw text)
- Data source: `TOOL_SCHEMAS` + a new `TOOL_DOCS` map with descriptions and examples

### 2b. Output copy button
- Small copy icon on hover in top-right of each output block
- Copies raw output text (JSON) to clipboard
- Visual feedback: icon changes to checkmark for 1.5s

### 2c. Input copy/re-run
- Click on a previous command (`> tensor_create(...)`) to load it back into the input
- Lets you re-run or modify previous commands without Up-arrowing through history

**Files to change:**
- `src/hooks/useRepl.ts` — handle `help` as a special command (like `clear`)
- `src/components/playground/ReplOutput.tsx` — add copy button
- `src/pages/Playground.tsx` — add click handler on command lines

**Estimated complexity:** Low-medium. `help` is a new output type, copy is a small UI addition.

---

## Phase 3: Better Empty State + Discoverability

**Goal:** New users should see what's available and be able to start with one click.

### 3a. Rich empty state
- Replace the two-line hint with a categorized tool browser:
  - **Tensor Basics:** tensor_create, tensor_inspect, tensor_list
  - **Tensor Ops:** tensor_add, tensor_mul, tensor_matmul, tensor_transpose, tensor_reshape
  - **Autograd:** autograd_expr, autograd_neuron, autograd_neuron_tensor
  - **Neural Networks:** mlp_forward, attention_forward
  - **Training:** create_dataset, init_mlp, train_mlp, evaluate_mlp, mlp_predict
- Each tool name is clickable → inserts template into input
- Disappears once user runs first command (current behavior)

### 3b. Snippet templates
- Common multi-step workflows as one-click templates:
  - "Create and inspect a tensor"
  - "Run a neuron with autograd"
  - "Train XOR from scratch" (full pipeline: dataset → init → train → evaluate)
- Could be a dropdown in the toolbar or part of the empty state

**Files to change:**
- `src/pages/Playground.tsx` — replace empty state JSX
- Possibly a new `src/components/playground/ToolBrowser.tsx`

**Estimated complexity:** Low. Mostly JSX/styling work.

---

## Phase 4: Quality of Life Polish

**Goal:** Small things that make the REPL feel professional.

### 4a. Multiline visual cue
- Show a subtle line count or "multiline" indicator when input has multiple lines
- Maybe show line numbers when >1 line

### 4b. Running time indicator
- Show elapsed time while a command runs (some MCP calls take seconds)
- Show execution time on completed outputs

### 4c. Output collapsing
- Large JSON outputs should be collapsible (click to expand)
- Show first 5 lines + "... N more lines" for long outputs

### 4d. Keyboard shortcuts panel
- Ctrl+/ or ? shows a shortcuts overlay
- Lists all keybindings: Shift+Enter, Cmd+Enter, Up/Down, Ctrl+L, etc.

**Files to change:** Various playground components.

**Estimated complexity:** Low per item.

---

## Priority order

1. **Phase 1** (autocomplete + signatures) — biggest impact, removes the main friction
2. **Phase 2a** (help command) — cheap and useful
3. **Phase 2b** (copy button) — trivial, should've been there from the start
4. **Phase 3a** (rich empty state) — good first impression
5. Everything else as polish

## Decision

Document first, implement Phase 1 next session. Don't over-scope — autocomplete and signature hints alone would transform the REPL experience.
