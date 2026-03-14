# REPL UI and Visualization

## Why REPL, not notebook

We considered four models: REPL, Jupyter notebook, scratchpad with pinned results, and split-pane playground.

REPL wins because:
- **No stale state.** Jupyter's biggest pain is running cells out of order. A REPL is append-only — always in order.
- **Matches how we actually work.** We're experimenting, not writing documents.
- **Simpler to build.** One input, one scrolling output. No cell management.
- **Familiar.** It's a terminal. Everyone knows how a terminal works.

## REPL layout

```
┌──────────────────────────────────────────────────────────┐
│  /playground                              [● Connected]   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Output history (scrolls)                           │  │
│  │                                                     │  │
│  │  > tensor_create("a", [1,2,3,4], [2,2])            │  │
│  │  ┌──────────────────────────────┐                   │  │
│  │  │ Tensor "a" [2×2]            │                   │  │
│  │  │ ┌─────┬─────┐              │                   │  │
│  │  │ │  1  │  2  │              │                   │  │
│  │  │ ├─────┼─────┤              │                   │  │
│  │  │ │  3  │  4  │              │                   │  │
│  │  │ └─────┴─────┘              │                   │  │
│  │  └──────────────────────────────┘                   │  │
│  │                                                     │  │
│  │  > tensor_transpose("a", "a_T")                     │  │
│  │  Transposed "a" → "a_T": shape=[2, 2]              │  │
│  │                                                     │  │
│  │  > 2 + 2                                            │  │
│  │  4                                                  │  │
│  │                                                     │  │
│  │  > const x = [1,2,3]; x.map(n => n * 10)           │  │
│  │  [10, 20, 30]                                       │  │
│  │                                                     │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  > [CodeMirror input]                    [Run ▶]   │  │
│  │    (Shift+Enter to execute)                         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Input behavior

- **Single input area** at the bottom, like a terminal prompt.
- **Multi-line support.** CodeMirror allows multiple lines. Enter adds a newline. **Shift+Enter executes.** Simple, no ambiguity.
- **Auto-detect mode.** No manual toggle:
  - Input starts with a known MCP tool name → route to bridge as MCP call.
  - Anything else → evaluate as JS in the Web Worker.
  - Tool name list fetched from bridge on connect (via `tools/list`), or hardcoded initially.
- **Command history.** Up/Down arrow cycles through previous inputs (when input is empty).
- **Clear.** Type `clear` or Ctrl+L to clear the output history.

## Connection status indicator

Top-right corner of the playground:

| State | Indicator | Behavior |
|-------|-----------|----------|
| Connected | Green dot + "Connected" | Everything works |
| Disconnected | Yellow dot + "Bridge offline — MCP unavailable" | TS eval works, MCP calls show immediate error |
| Reconnecting | Pulsing yellow dot + "Reconnecting..." | Socket.io auto-reconnects |

MCP calls while disconnected return: `"Error: Bridge not connected. Start the bridge server with: cd site/bridge && npx tsx server.ts"`

## Output rendering

Each history entry = the input (shown as `> code`) + the output below it.

The playground receives **structured JSON** from MCP tools (thanks to Phase 0 modifications). Output routing:

| Result type | How detected | Renderer |
|------------|-------------|----------|
| Tensor | JSON has `shape` + `data` fields | **TensorViz** — colored grid with shape badge |
| Autograd graph | JSON has `nodes` + `edges` + `gradients` | **GraphViz** — 2D node/edge graph |
| Number | JS eval returned a number | Large formatted number |
| Array / Object | JS eval returned array/object | Syntax-highlighted JSON |
| String | JS eval returned a string | Plain text |
| Error | Error object from eval or MCP | Red-bordered text |
| Void / undefined | `const x = 5` etc. | No output row shown |

### TensorViz

Reuse rendering logic from existing `ShapeExplorer.tsx`:
- Shape badge (e.g., `[2, 3]`)
- Colored grid of values
- Compact: fits in the REPL output flow
- Clickable to expand if tensor is large (show all data)
- Framer-motion entrance animation

### GraphViz

Reuse patterns from `GradientFlow.tsx` / `SimpleGraph.tsx`:
- 2D node graph (not 3D — needs to be inline-friendly)
- Nodes labeled with values, edges labeled with gradients
- Compact enough to sit in the output history

### Collapsible large outputs

For big tensors (>20 elements) or long JSON, show a collapsed preview with "show more" toggle. Don't let one large result push everything off screen.

## Editor: CodeMirror 6

- `@uiw/react-codemirror` React wrapper
- `@codemirror/lang-javascript` for JS/TS syntax highlighting
- Dark theme matching site CSS variables
- Shift+Enter keybinding to execute
- Placeholder text: "Type an expression or MCP tool call..."
- **Auto-growing height.** Starts as one line, expands as you type multi-line input. Not a fixed tall editor.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Shift+Enter | Execute input |
| Up (when input is empty) | Previous command from history |
| Down (when input is empty) | Next command in history |
| Ctrl+L | Clear output history |
| Escape | Clear current input |

## Session persistence (IndexedDB)

Using IndexedDB via `idb` wrapper.

**What we save:** commands (code inputs) only. Outputs are ephemeral — re-run to regenerate.

```typescript
interface Session {
  id: string;
  name: string;
  commands: string[];
  createdAt: number;
  updatedAt: number;
}
```

- Auto-save commands as you execute them.
- On page load: restore last session's commands in history (greyed out, not re-executed).
- User can re-run individual commands or "Run All" to rebuild state.
- Named sessions are a future feature (for now, just one auto-saved session).

**Why not save outputs:** Outputs depend on runtime state (MCP tensor store, Web Worker scope). Saved outputs would be stale after a restart. Saving just commands is honest — re-run to see results.

## Styling

Match existing site design language:
- Same CSS variables (`--color-surface-raised`, `--color-accent-blue`, etc.)
- Output history background: `--color-surface-base`
- Each output entry: subtle bottom border, padding
- Input area: `--color-surface-raised`, focused border glow
- Running state: pulsing dot next to input
- Error: left red border, `--color-accent-rose` text
- Tensor viz: reuse color palette from existing chapter viz
- Framer-motion for output entry animations
