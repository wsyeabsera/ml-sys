# Editor and Visualization

## Editor: CodeMirror 6

**Why CodeMirror 6, not Monaco:**
- Monaco is VS Code's editor — 2-3MB gzipped, complex to configure, overkill for short notebook cells.
- CodeMirror 6 is modular (~40KB core + language), first-class JS/TS support, easy React integration, trivial to theme.
- The React wrapper `@uiw/react-codemirror` makes it a single component.

**Dependencies:**
```
@uiw/react-codemirror
@codemirror/lang-javascript    # JS/TS syntax + autocomplete
```

**Key features to enable:**
- JavaScript/TypeScript language support (syntax highlighting, bracket matching)
- Shift+Enter to run the cell (custom keybinding)
- Tab completion (built-in)
- Dark/light theme matching our CSS variables
- Line numbers (optional, maybe off for short cells)
- Placeholder text ("Write TypeScript..." or "Call an MCP tool...")

**Cell type indicator:**
- Visual badge or tab at top-left of each cell: "TS" or "MCP"
- Clicking it toggles the cell type
- Language mode switches accordingly (JS for TS cells, maybe a custom mode for MCP DSL)

## Output rendering

The cell output router decides how to render based on the result:

```
Result arrives as text string
    │
    ├─ Looks like tensor data? → TensorResultViz
    │   (detect: "shape=", or structured JSON with shape/data fields)
    │
    ├─ Looks like autograd graph? → AutogradGraphViz
    │   (detect: "gradient", "backward", or nodes/edges structure)
    │
    ├─ Looks like a number? → Large formatted number
    │
    ├─ Looks like an error? → Red error box
    │
    └─ Anything else → Monospace text block (reuse CodeBlock component)
```

### Tensor visualization

We already have `ShapeExplorer.tsx` in `site/src/components/viz/` which renders tensor grids with shape, strides, and element highlighting. Extract the grid rendering into a shared component that both ShapeExplorer and the playground can use.

For playground output, show:
- Shape badge (e.g., `[2, 3]`)
- A colored grid of values
- Strides if relevant
- Framer-motion entrance animation (keep it consistent with the rest of the site)

### Autograd graph visualization

We have `GradientFlow.tsx` and `SimpleGraph.tsx` for 2D graphs, and `ComputationGraph3D` for 3D. The playground should use the 2D version (simpler, fits in a cell output area).

When `autograd_expr` returns a computation graph with nodes and gradients, parse it and render inline.

### Code output

For plain text/JSON results, reuse the existing `CodeBlock` component with syntax highlighting. This keeps the look consistent.

## Frontend component structure

```
site/src/
  pages/
    Playground.tsx                  # Main page
  components/playground/
    NotebookCell.tsx                # Cell wrapper: editor + toolbar + output
    CellEditor.tsx                  # CodeMirror 6 wrapper
    CellOutput.tsx                  # Output router (picks the right viz)
    CellToolbar.tsx                 # Run button, cell type toggle, delete
    TensorResultViz.tsx             # Tensor shape + data grid
    AutogradGraphViz.tsx            # Computation graph from autograd results
    AddCellButton.tsx               # "+" between cells
  hooks/
    useBridge.ts                    # Socket.io connection to bridge
    useNotebook.ts                  # Cell list state management
  lib/
    bridge-protocol.ts              # Message type definitions
    mcp-dsl.ts                      # Shorthand parser: tensor_create(...) → tool call
    result-parser.ts                # Detect output type for viz routing
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Shift+Enter | Run current cell, move to next |
| Cmd+Enter | Run current cell, stay in place |
| Escape | Deselect cell (move to "command mode") |
| Up/Down (in command mode) | Navigate between cells |
| Cmd+Shift+Enter | Run all cells |

These match Jupyter conventions so the muscle memory transfers.

## Styling

Match the existing site's design language:
- Same CSS variables (`--color-surface-raised`, `--color-accent-blue`, etc.)
- Same border-radius, spacing, shadow patterns
- Cell backgrounds use `--color-surface-raised`
- Running state: subtle blue pulse on the cell border
- Error state: red left border
- Framer-motion for cell add/remove animations (consistent with chapters)

## Route integration

```typescript
// App.tsx — add alongside existing chapter routes
<Route path="/playground" element={<Playground />} />
```

```typescript
// Sidebar — add after the chapters list
{ path: "/playground", title: "Playground" }
```
