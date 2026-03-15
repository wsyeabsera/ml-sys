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

/** Tool descriptions for autocomplete and help */
export const TOOL_INFO: Record<string, { description: string; category: string; example?: string }> = {
  tensor_create:    { category: "Tensor Basics", description: "Create a named tensor with data and shape", example: 'tensor_create("a", [1,2,3,4], [2,2])' },
  tensor_inspect:   { category: "Tensor Basics", description: "Show tensor details (shape, strides, data)", example: 'tensor_inspect("a")' },
  tensor_list:      { category: "Tensor Basics", description: "List all stored tensors", example: "tensor_list()" },
  tensor_add:       { category: "Tensor Ops", description: "Element-wise add two tensors", example: 'tensor_add("a", "b", "c")' },
  tensor_mul:       { category: "Tensor Ops", description: "Element-wise multiply two tensors", example: 'tensor_mul("a", "b", "c")' },
  tensor_matmul:    { category: "Tensor Ops", description: "Matrix multiply two tensors", example: 'tensor_matmul("a", "b", "c")' },
  tensor_transpose: { category: "Tensor Ops", description: "Transpose tensor dimensions (zero-copy)", example: 'tensor_transpose("a", 0, 1, "aT")' },
  tensor_reshape:   { category: "Tensor Ops", description: "Reshape tensor to new dimensions", example: 'tensor_reshape("a", [4, 1], "a_flat")' },
  tensor_get:       { category: "Tensor Ops", description: "Get a single element by indices", example: 'tensor_get("a", [0, 1])' },
  tensor_get_2d:    { category: "Tensor Ops", description: "Get element at [row, col]", example: 'tensor_get_2d("a", 0, 1)' },
  autograd_expr:    { category: "Autograd", description: "Build computation graph and compute gradients", example: 'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")' },
  autograd_neuron:  { category: "Autograd", description: "Run a single neuron with scalar autograd", example: "autograd_neuron([2, 0], [-3, 1], 6.88)" },
  autograd_neuron_tensor: { category: "Autograd", description: "Run a neuron layer with tensor autograd", example: "autograd_neuron_tensor([1, 2], [1, 2], [0.5, -0.3, 0.8, 0.1], [2, 2], [0.1, -0.2], [1, 2])" },
  attention_forward: { category: "Neural Networks", description: "Compute scaled dot-product attention", example: "attention_forward(3, 4, [...], [...], [...])" },
  mlp_forward:      { category: "Neural Networks", description: "Forward pass through an MLP with gradients", example: 'mlp_forward([1, 2], [1, 2], [{...}])' },
  create_dataset:   { category: "Training", description: "Create a training dataset (and, xor, or)", example: 'create_dataset("xor", 4)' },
  init_mlp:         { category: "Training", description: "Initialize an MLP with random weights", example: 'init_mlp([2, 3, 1], "my_mlp")' },
  mse_loss:         { category: "Training", description: "Compute mean squared error loss", example: 'mse_loss("predicted", "target")' },
  train_mlp:        { category: "Training", description: "Train an MLP on data with SGD", example: 'train_mlp("my_mlp", "inputs", "targets", 0.1, 100)' },
  evaluate_mlp:     { category: "Training", description: "Evaluate MLP accuracy on test data", example: 'evaluate_mlp("my_mlp", "inputs", "targets")' },
  mlp_predict:      { category: "Training", description: "Run a single prediction through trained MLP", example: 'mlp_predict("my_mlp", [1, 0])' },
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
