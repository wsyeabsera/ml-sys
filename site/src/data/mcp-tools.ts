export interface McpTool {
  name: string;
  description: string;
  category: "tensor" | "autograd" | "project";
  params: string[];
}

export const mcpTools: McpTool[] = [
  // Tensor tools
  { name: "tensor_create", description: "Create a named tensor from flat data + shape", category: "tensor", params: ["name", "data", "shape"] },
  { name: "tensor_add", description: "Element-wise addition, store result", category: "tensor", params: ["a", "b", "result"] },
  { name: "tensor_mul", description: "Element-wise multiplication, store result", category: "tensor", params: ["a", "b", "result"] },
  { name: "tensor_matmul", description: "Matrix multiply [M,K] x [K,N] → [M,N]", category: "tensor", params: ["a", "b", "result"] },
  { name: "tensor_get", description: "Get element by N-dim indices using strides", category: "tensor", params: ["name", "indices"] },
  { name: "tensor_get_2d", description: "Get element from 2D tensor by (row, col)", category: "tensor", params: ["name", "row", "col"] },
  { name: "tensor_reshape", description: "Reshape tensor (materializes if non-contiguous)", category: "tensor", params: ["name", "new_shape", "result"] },
  { name: "tensor_transpose", description: "Swap two dimensions (zero-copy)", category: "tensor", params: ["name", "dim0", "dim1", "result"] },
  { name: "tensor_inspect", description: "Return shape, strides, and data as JSON", category: "tensor", params: ["name"] },
  { name: "tensor_list", description: "List all stored tensors", category: "tensor", params: [] },

  // Autograd tools
  { name: "autograd_neuron", description: "Run single neuron: tanh(Σ(xi*wi) + bias)", category: "autograd", params: ["inputs", "weights", "bias"] },
  { name: "autograd_expr", description: "Build custom computation graph from ops", category: "autograd", params: ["values", "ops"] },
  { name: "autograd_neuron_tensor", description: "Run tensor layer: tanh(x @ w + b)", category: "autograd", params: ["x", "w", "b"] },

  // Project tools
  { name: "read_file", description: "Read a project file (path-restricted)", category: "project", params: ["path"] },
  { name: "cargo_exec", description: "Run cargo build or cargo run", category: "project", params: ["subcommand"] },
];

export const categories = [
  { key: "tensor" as const, label: "Tensor Operations", count: 10 },
  { key: "autograd" as const, label: "Autograd", count: 3 },
  { key: "project" as const, label: "Project", count: 2 },
];
