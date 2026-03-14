# Visualizer — Rich Interactive Viz for MCP Results

## The problem

The REPL has basic viz (tensor grids, autograd tables). But for complex results — attention weights, MLP activations, computation graphs — it just dumps JSON. The REPL's scrolling output area is wrong for large interactive visualizations.

Meanwhile, the chapters have great viz components (AttentionViz, MLPDiagram, GradientFlow, ComputationGraph3D) — but they only work with hardcoded example data.

## The solution

**Every REPL output gets persisted with a unique ID.** The Visualizer page loads any output by ID and renders the full interactive visualization for it.

## Core design: outputs are stored, not ephemeral

Currently, REPL outputs are ephemeral — stored in React state, lost on refresh. We change this:

**Every output gets stored in IndexedDB with a unique ID:**

```typescript
interface StoredOutput {
  id: string;            // unique ID (nanoid or crypto.randomUUID)
  input: string;         // the command that produced this
  output: string;        // raw output text
  parsed: unknown;       // parsed JSON (if applicable)
  type: ResultType;      // "tensor", "autograd", "attention", etc.
  timestamp: number;
  hasRichViz: boolean;   // true if Visualizer can render this
}
```

**The REPL history entries reference output IDs**, not raw strings. On page load, outputs are loaded from IndexedDB alongside command history.

This means:
- Outputs survive page refresh (not just commands)
- Any output can be opened in the Visualizer by ID
- You can share an output link: `/visualize?outputId=abc123`
- The REPL output area becomes a browsable history of stored results

## How data flows

```
REPL                                    Visualizer
┌──────────────────┐                   ┌─────────────────────┐
│ > attention_      │                   │                     │
│   forward(...)   │                   │  /visualize?        │
│                  │                   │    outputId=abc123  │
│ [compact viz]    │                   │                     │
│ [Open in Viz ↗]──┼── same ID ──────▶│  Loads output from  │
│                  │                   │  IndexedDB by ID    │
│ ID: abc123       │                   │                     │
│ Stored in IDB    │                   │  [Full interactive  │
│                  │                   │   visualization]    │
└──────────────────┘                   └─────────────────────┘
```

**The link is just `/visualize?outputId=abc123`.** The Visualizer reads the ID from the URL, loads the stored output from IndexedDB, detects the viz type, and renders it. No data in the URL, no size limits, instant.

**Also supports paste JSON** — for manually exploring data without going through the REPL.

## Changes to the REPL

### Output storage (lib/output-store.ts)

```typescript
// Store
async function storeOutput(output: StoredOutput): Promise<string>
// Load
async function loadOutput(id: string): Promise<StoredOutput | null>
// List recent
async function listOutputs(limit?: number): Promise<StoredOutput[]>
```

Uses the same IndexedDB database as session storage, but a separate object store.

### History entries get output IDs

```typescript
// Before (ephemeral)
interface HistoryEntry {
  id: number;
  input: string;
  output: string;        // raw text, lost on refresh
  isError: boolean;
}

// After (persistent)
interface HistoryEntry {
  id: number;
  input: string;
  outputId: string;      // references IndexedDB
  output: string;        // still cached in memory for display
  isError: boolean;
}
```

### "Open in Visualizer" link

In `ReplOutput.tsx`, for results that have a rich viz available:

```tsx
{hasRichViz && (
  <Link to={`/visualize?outputId=${outputId}`} className="text-xs text-blue">
    Open in Visualizer ↗
  </Link>
)}
```

Results that get the link:
- `attention_forward` → attention heatmap
- `autograd_expr` → computation graph
- `autograd_neuron` → neuron graph
- `mlp_forward` → MLP layer diagram
- Any tensor result → full tensor explorer (beyond the compact grid)

## What viz to build (priority order)

### 1. Attention Heatmap (attention_forward results)

- Weight matrix as a color heatmap (rows = queries, cols = keys, intensity = weight)
- Q, K, V values shown alongside
- Hover a cell → show exact weight and the value contribution
- Output vector shown below with decomposition (which values contributed)
- Gradients panel (Q_grad, K_grad, V_grad)

**Data shape from MCP:**
```json
{
  "output": { "data": [...], "shape": [seq_len, d_v] },
  "attention_weights": { "data": [...], "shape": [seq_len, seq_len] },
  "Q_grad": [...], "K_grad": [...], "V_grad": [...]
}
```

### 2. Autograd Graph (autograd_expr results)

- Node graph: leaves on left, output on right
- Nodes colored by gradient magnitude (hot = high gradient)
- Click a node → show value, gradient, and the operation that produced it
- Edges show gradient flow direction

**Data shape from MCP:**
```json
{
  "values": [
    { "name": "a", "data": 2.0, "grad": 3.0 },
    { "name": "d", "data": 6.0, "grad": 1.0 },
    ...
  ]
}
```

**Challenge:** Need the ops list to draw edges. Options:
- Store the original input alongside the output (the ops argument)
- Or enhance autograd_expr to include edges in the output

### 3. MLP Layer Diagram (mlp_forward results)

- Network diagram with actual layer dimensions
- Neurons sized/colored by activation value
- Edges colored by weight gradient magnitude
- Forward view (activations) and backward view (gradients) toggle

**Data shape from MCP:**
```json
{
  "output": { "data": [...], "shape": [...] },
  "input_grad": [...],
  "layers": [
    { "layer": 0, "w": { "shape": [2,3], "data": [...], "grad": [...] }, "b": {...} },
    ...
  ]
}
```

### 4. Neuron Graph (autograd_neuron results)

- Single neuron: inputs → products → sum → bias add → tanh → output
- Each node shows value and gradient
- Step-through animation (forward then backward)

### 5. Tensor Explorer (tensor results)

- Full-featured tensor inspector beyond the compact grid
- 3D view for higher-dimensional tensors (reuse TensorCubes)
- Stride visualization
- Contiguity indicator

## Visualizer page UI

```
┌──────────────────────────────────────────────────────────┐
│  Visualizer                     [Paste JSON] [History ▾] │
│                                                           │
│  Output: "attention_forward(2, 2, ...)"                  │
│  Executed: 2 minutes ago                                  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                   │    │
│  │          [Full interactive visualization]          │    │
│  │                                                   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ▸ Raw data                                               │
│  ▸ Gradients                                              │
└──────────────────────────────────────────────────────────┘
```

- Header shows the command that produced the output + timestamp
- Main area: full interactive viz
- Collapsible panels: raw JSON, gradients, metadata
- "History" dropdown: browse recent outputs (load a different one without going back to REPL)
- "Paste JSON" for manual data input

## Sidebar entry

```
▾ PLAYGROUND
  >_ REPL
  ?? Tool Reference
  📊 Visualizer
```

## Build order

### Phase A — Output persistence + Visualizer page shell
- `output-store.ts` — IndexedDB CRUD for stored outputs
- Update `useRepl` to store outputs with IDs
- Update `HistoryEntry` to include `outputId`
- Create `/visualize` route and page
- "Open in Visualizer" link on complex REPL outputs
- Page shell: load output by ID, show command + timestamp, fallback JSON view
- Paste JSON input
- History dropdown

### Phase B — Attention heatmap
- `AttentionHeatmap.tsx` component
- Color-coded weight matrix
- Q/K/V display alongside
- Hover details

### Phase C — Autograd graph
- `AutogradGraphViz.tsx` component (full graph, not just table)
- Node layout from MCP output
- Gradient coloring
- Click to inspect

### Phase D — MLP diagram with real data
- `MLPLayerViz.tsx` component
- Dynamic layer dimensions
- Activation values and gradient colors

### Phase E — Tensor explorer + neuron graph
- `TensorExplorer.tsx` — full inspector beyond compact grid
- `NeuronGraphViz.tsx` — single neuron computation graph

## File structure

```
site/src/
  pages/
    Visualize.tsx                  # Main visualizer page
  components/visualizer/
    VizRouter.tsx                  # Auto-detect viz type, render right component
    AttentionHeatmap.tsx           # Attention weight matrix heatmap
    AutogradGraphViz.tsx           # Computation graph with gradients
    MLPLayerViz.tsx                # MLP diagram with real data
    NeuronGraphViz.tsx             # Single neuron computation graph
    TensorExplorer.tsx             # Full tensor inspector
    DataInput.tsx                  # Paste JSON textarea
    RawDataPanel.tsx               # Collapsible raw JSON view
    OutputHistory.tsx              # Dropdown to browse recent outputs
  lib/
    output-store.ts                # IndexedDB for stored outputs
```
