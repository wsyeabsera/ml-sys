/**
 * CodeMirror extensions for the REPL:
 * - Tool name autocomplete from TOOL_SCHEMAS
 * - Signature hints (parameter tooltip) when inside tool_name(...)
 */
import {
  autocompletion,
  type CompletionContext,
  type Completion,
} from "@codemirror/autocomplete";
import {
  StateField,
  type EditorState,
  type Extension,
} from "@codemirror/state";
import { EditorView, showTooltip, type Tooltip } from "@codemirror/view";
import { TOOL_INFO } from "./mcp-shorthand";

// Re-import the schemas (they're not exported, so we reconstruct from TOOL_INFO keys + need param names)
// We'll import TOOL_SCHEMAS via a getter
const TOOL_SCHEMAS: Record<string, string[]> = {
  tensor_create: ["name", "data", "shape"],
  tensor_inspect: ["name"],
  tensor_list: [],
  tensor_add: ["a", "b", "result_name"],
  tensor_mul: ["a", "b", "result_name"],
  tensor_matmul: ["a", "b", "result_name"],
  tensor_transpose: ["name", "dim0", "dim1", "result_name"],
  tensor_reshape: ["name", "new_shape", "result_name"],
  tensor_get: ["name", "indices"],
  tensor_get_2d: ["name", "row", "col"],
  autograd_expr: ["values", "ops", "backward_from"],
  autograd_neuron: ["inputs", "weights", "bias"],
  autograd_neuron_tensor: [
    "input_data", "input_shape",
    "weight_data", "weight_shape",
    "bias_data", "bias_shape",
  ],
  attention_forward: ["seq_len", "d_k", "q_data", "k_data", "v_data"],
  mlp_forward: ["input_data", "input_shape", "layers"],
  create_dataset: ["type", "n_samples"],
  init_mlp: ["architecture", "name"],
  mse_loss: ["predicted", "target"],
  train_mlp: ["mlp", "inputs", "targets", "lr", "epochs"],
  evaluate_mlp: ["mlp", "inputs", "targets"],
  mlp_predict: ["mlp", "input"],
};

/* ------------------------------------------------------------------ */
/* 1. Tool Name Autocomplete                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_BOOST: Record<string, number> = {
  "Tensor Basics": 5,
  "Tensor Ops": 4,
  "Autograd": 3,
  "Neural Networks": 2,
  "Training": 1,
};

const completions: Completion[] = Object.entries(TOOL_INFO).map(
  ([name, info]) => ({
    label: name,
    type: "function",
    detail: info.category,
    info: info.description,
    boost: CATEGORY_BOOST[info.category] ?? 0,
  }),
);

function toolCompletionSource(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return {
    from: word.from,
    options: completions,
    validFor: /^\w*$/,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Signature Hints (tooltip showing param names)                   */
/* ------------------------------------------------------------------ */

interface CallInfo {
  toolName: string;
  paramIndex: number;
  openParenPos: number;
}

/** Parse the current editor state to find if cursor is inside a tool call */
function getCallInfo(state: EditorState): CallInfo | null {
  const pos = state.selection.main.head;
  const text = state.doc.toString();

  // Walk backward from cursor to find the opening paren
  let depth = 0;
  let commaCount = 0;
  let openParenPos = -1;

  for (let i = pos - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ")") depth++;
    else if (ch === "(") {
      if (depth === 0) {
        openParenPos = i;
        break;
      }
      depth--;
    } else if (ch === "," && depth === 0) {
      commaCount++;
    }
    // Handle string literals — skip content inside quotes
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i--;
      while (i >= 0 && text[i] !== quote) {
        if (text[i] === "\\") i--; // skip escaped chars
        i--;
      }
    }
    // Handle array/object nesting
    if (ch === "]" || ch === "}") depth++;
    else if (ch === "[" || ch === "{") {
      if (depth > 0) depth--;
    }
  }

  if (openParenPos < 0) return null;

  // Extract the function name before the paren
  const before = text.slice(0, openParenPos);
  const match = before.match(/(\w+)\s*$/);
  if (!match) return null;

  const toolName = match[1];
  if (!TOOL_SCHEMAS[toolName]) return null;

  return { toolName, paramIndex: commaCount, openParenPos };
}

const signatureTooltipField = StateField.define<readonly Tooltip[]>({
  create: (state) => buildTooltips(state),
  update: (tooltips, tr) => {
    if (tr.docChanged || tr.selection) {
      return buildTooltips(tr.state);
    }
    return tooltips;
  },
  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});

function buildTooltips(state: EditorState): readonly Tooltip[] {
  const info = getCallInfo(state);
  if (!info) return [];

  const params = TOOL_SCHEMAS[info.toolName];
  if (!params || params.length === 0) return [];

  return [
    {
      pos: info.openParenPos,
      above: true,
      strictSide: true,
      arrow: true,
      create: () => {
        const dom = document.createElement("div");
        dom.className = "cm-sig-tooltip";

        const nameSpan = document.createElement("span");
        nameSpan.className = "cm-sig-name";
        nameSpan.textContent = info.toolName;
        dom.appendChild(nameSpan);

        dom.appendChild(document.createTextNode("("));

        params.forEach((p, i) => {
          if (i > 0) dom.appendChild(document.createTextNode(", "));
          const span = document.createElement("span");
          span.textContent = p;
          span.className =
            i === info.paramIndex ? "cm-sig-active" : "cm-sig-param";
          dom.appendChild(span);
        });

        dom.appendChild(document.createTextNode(")"));

        // Add description below
        const toolInfo = TOOL_INFO[info.toolName];
        if (toolInfo) {
          const desc = document.createElement("div");
          desc.className = "cm-sig-desc";
          desc.textContent = toolInfo.description;
          dom.appendChild(desc);
        }

        return { dom };
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 3. Tooltip styles                                                  */
/* ------------------------------------------------------------------ */

const tooltipStyles = EditorView.theme({
  // Signature tooltip
  ".cm-tooltip.cm-tooltip-above": {
    borderRadius: "8px",
    border: "1px solid var(--color-surface-overlay)",
    backgroundColor: "var(--color-surface-raised)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
    padding: "8px 12px",
    fontSize: "12px",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    maxWidth: "500px",
    lineHeight: "1.5",
    color: "var(--color-text-primary)",
  },
  ".cm-tooltip-arrow:before": {
    borderTopColor: "var(--color-surface-overlay) !important",
  },
  ".cm-tooltip-arrow:after": {
    borderTopColor: "var(--color-surface-raised) !important",
  },
  ".cm-sig-name": {
    color: "var(--color-accent-blue)",
    fontWeight: "600",
  },
  ".cm-sig-param": {
    color: "var(--color-text-muted)",
  },
  ".cm-sig-active": {
    color: "var(--color-accent-amber)",
    fontWeight: "700",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  ".cm-sig-desc": {
    color: "var(--color-text-secondary)",
    fontSize: "11px",
    marginTop: "6px",
    paddingTop: "6px",
    borderTop: "1px solid var(--color-surface-overlay)",
    fontFamily: "inherit",
  },
  // Autocomplete popup
  ".cm-tooltip.cm-tooltip-autocomplete": {
    border: "1px solid var(--color-surface-overlay) !important",
    backgroundColor: "var(--color-surface-raised) !important",
    borderRadius: "8px !important",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3) !important",
    overflow: "hidden !important",
  },
  ".cm-tooltip-autocomplete > ul": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "12px",
    maxHeight: "250px",
  },
  ".cm-tooltip-autocomplete > ul > li": {
    padding: "5px 10px !important",
    borderBottom: "1px solid color-mix(in srgb, var(--color-surface-overlay) 50%, transparent)",
  },
  ".cm-tooltip-autocomplete > ul > li:last-child": {
    borderBottom: "none",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--color-accent-blue) !important",
    color: "white !important",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionLabel": {
    color: "white !important",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail": {
    color: "rgba(255, 255, 255, 0.7) !important",
  },
  ".cm-completionLabel": {
    color: "var(--color-text-primary)",
    fontWeight: "500",
  },
  ".cm-completionDetail": {
    color: "var(--color-text-secondary)",
    fontStyle: "normal !important",
    marginLeft: "10px",
    fontSize: "11px",
  },
  ".cm-completionInfo": {
    color: "var(--color-text-secondary)",
    padding: "8px 12px !important",
    borderLeft: "1px solid var(--color-surface-overlay) !important",
    backgroundColor: "var(--color-surface-raised) !important",
    fontSize: "12px",
    lineHeight: "1.5",
  },
});

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function replExtensions(): Extension[] {
  return [
    autocompletion({
      override: [toolCompletionSource],
      activateOnTyping: true,
      icons: false,
    }),
    signatureTooltipField,
    tooltipStyles,
  ];
}
