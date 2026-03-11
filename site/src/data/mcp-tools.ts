export interface McpTool {
  name: string;
  description: string;
  category: "tensor" | "autograd" | "gguf" | "project";
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
  { name: "mlp_forward", description: "Run MLP forward+backward: stack of tanh(x@w+b) layers", category: "autograd", params: ["layers", "input"] },
  { name: "attention_forward", description: "Scaled dot-product attention: softmax(QK^T/√d_k)V", category: "autograd", params: ["q", "k", "v"] },

  // GGUF tools
  { name: "gguf_inspect", description: "Inspect a GGUF model file: metadata, architecture, tensor catalog", category: "gguf", params: ["path"] },
  { name: "gguf_load_tensor", description: "Load a tensor from a GGUF file into the tensor store (F32/F16)", category: "gguf", params: ["path", "tensor_name", "store_as?"] },

  // Project tools
  { name: "read_file", description: "Read a project file (path-restricted)", category: "project", params: ["path"] },
  { name: "cargo_exec", description: "Run cargo build or cargo run", category: "project", params: ["subcommand"] },
];

export const categories = [
  { key: "tensor" as const, label: "Tensor Operations", count: 10 },
  { key: "autograd" as const, label: "Autograd", count: 5 },
  { key: "gguf" as const, label: "GGUF", count: 2 },
  { key: "project" as const, label: "Project", count: 2 },
];
