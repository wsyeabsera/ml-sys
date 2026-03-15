/**
 * Known MCP tool names and their positional argument schemas.
 * Maps tool_name(arg1, arg2, ...) → { key1: arg1, key2: arg2, ... }
 */
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
  // Training tools
  create_dataset: ["type", "n_samples"],
  init_mlp: ["architecture", "name"],
  mse_loss: ["predicted", "target"],
  train_mlp: ["mlp", "inputs", "targets", "lr", "epochs"],
  evaluate_mlp: ["mlp", "inputs", "targets"],
  mlp_predict: ["mlp", "input"],
};

export const TOOL_NAMES = new Set(Object.keys(TOOL_SCHEMAS));

/**
 * Check if input looks like an MCP tool call.
 * Must start with a known tool name followed by "(".
 * Accepts an optional dynamic set of tool names (from tools/list).
 */
export function isMcpCall(input: string, dynamicTools?: Set<string>): boolean {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\w+)\s*\(/);
  if (!match) return false;
  const name = match[1];
  return TOOL_NAMES.has(name) || (dynamicTools?.has(name) ?? false);
}

/**
 * Parse a shorthand tool call into a structured { tool, args } object.
 * e.g., tensor_create("a", [1,2,3,4], [2,2]) → { tool: "tensor_create", args: { name: "a", data: [...], shape: [...] } }
 */
export function parseMcpCall(input: string): { tool: string; args: Record<string, unknown> } {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\w+)\s*\(([\s\S]*)\)\s*$/);
  if (!match) {
    throw new Error("Not a valid tool call. Expected: tool_name(args...)");
  }

  const tool = match[1];
  const argsStr = match[2].trim();

  const keys = TOOL_SCHEMAS[tool];
  if (!keys) {
    throw new Error(`Unknown tool: ${tool}`);
  }

  // No args
  if (keys.length === 0 || argsStr === "") {
    return { tool, args: {} };
  }

  // Parse positional args as JSON array
  const parsed: unknown[] = JSON.parse(`[${argsStr}]`);

  const args: Record<string, unknown> = {};
  keys.forEach((key, i) => {
    if (i < parsed.length) {
      args[key] = parsed[i];
    }
  });

  return { tool, args };
}
