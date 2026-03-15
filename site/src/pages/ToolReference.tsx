import { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition";
import TryThis from "../components/ui/TryThis";

const toolGroups = [
  {
    name: "Tensor Basics",
    description: "Create, inspect, and list tensors in the store.",
    tools: [
      {
        name: "tensor_create",
        signature: 'tensor_create(name, data, shape)',
        description: "Create a named tensor from a flat array and shape.",
        example: 'tensor_create("a", [1,2,3,4,5,6], [2,3])',
        args: [
          { name: "name", type: "string", desc: "Name to store the tensor under" },
          { name: "data", type: "number[]", desc: "Flat array of values" },
          { name: "shape", type: "number[]", desc: "Dimensions, e.g. [2,3] for 2 rows, 3 cols" },
        ],
      },
      {
        name: "tensor_inspect",
        signature: 'tensor_inspect(name)',
        description: "Show a tensor's shape, strides, and data.",
        example: 'tensor_inspect("a")',
        args: [
          { name: "name", type: "string", desc: "Name of the tensor to inspect" },
        ],
      },
      {
        name: "tensor_list",
        signature: 'tensor_list()',
        description: "List all tensors currently in the store.",
        example: 'tensor_list()',
        args: [],
      },
    ],
  },
  {
    name: "Tensor Operations",
    description: "Math on tensors — add, multiply, matmul, reshape, transpose.",
    tools: [
      {
        name: "tensor_add",
        signature: 'tensor_add(a, b, result_name)',
        description: "Element-wise addition. Shapes must match.",
        example: 'tensor_add("a", "b", "sum")',
        args: [
          { name: "a", type: "string", desc: "First tensor name" },
          { name: "b", type: "string", desc: "Second tensor name" },
          { name: "result_name", type: "string", desc: "Name for the result" },
        ],
      },
      {
        name: "tensor_mul",
        signature: 'tensor_mul(a, b, result_name)',
        description: "Element-wise multiplication. Shapes must match.",
        example: 'tensor_mul("a", "b", "product")',
        args: [
          { name: "a", type: "string", desc: "First tensor name" },
          { name: "b", type: "string", desc: "Second tensor name" },
          { name: "result_name", type: "string", desc: "Name for the result" },
        ],
      },
      {
        name: "tensor_matmul",
        signature: 'tensor_matmul(a, b, result_name)',
        description: "Matrix multiply: [M,K] x [K,N] → [M,N]. Inner dimensions must match.",
        example: 'tensor_matmul("a", "b", "result")',
        args: [
          { name: "a", type: "string", desc: "First tensor (2D)" },
          { name: "b", type: "string", desc: "Second tensor (2D)" },
          { name: "result_name", type: "string", desc: "Name for the result" },
        ],
      },
      {
        name: "tensor_reshape",
        signature: 'tensor_reshape(name, new_shape, result_name)',
        description: "Reshape a tensor. Total elements must stay the same.",
        example: 'tensor_reshape("a", [3,2], "reshaped")',
        args: [
          { name: "name", type: "string", desc: "Tensor to reshape" },
          { name: "new_shape", type: "number[]", desc: "New dimensions" },
          { name: "result_name", type: "string", desc: "Name for the result" },
        ],
      },
      {
        name: "tensor_transpose",
        signature: 'tensor_transpose(name, dim0, dim1, result_name)',
        description: "Swap two dimensions. Zero-copy — only swaps strides.",
        example: 'tensor_transpose("a", 0, 1, "a_T")',
        args: [
          { name: "name", type: "string", desc: "Tensor to transpose" },
          { name: "dim0", type: "number", desc: "First dimension to swap" },
          { name: "dim1", type: "number", desc: "Second dimension to swap" },
          { name: "result_name", type: "string", desc: "Name for the result" },
        ],
      },
      {
        name: "tensor_get_2d",
        signature: 'tensor_get_2d(name, row, col)',
        description: "Get a single element from a 2D tensor.",
        example: 'tensor_get_2d("a", 1, 2)',
        args: [
          { name: "name", type: "string", desc: "Tensor name" },
          { name: "row", type: "number", desc: "Row index" },
          { name: "col", type: "number", desc: "Column index" },
        ],
      },
    ],
  },
  {
    name: "Autograd",
    description: "Automatic differentiation — compute gradients for any expression.",
    tools: [
      {
        name: "autograd_expr",
        signature: 'autograd_expr(values, ops, backward_from)',
        description: "Build a computation graph, run forward + backward, get all gradients.",
        example: 'autograd_expr([["a", 2], ["b", 3], ["c", 1]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"]], "e")',
        args: [
          { name: "values", type: "[name, value][]", desc: "Leaf values: [[\"a\", 2], [\"b\", 3]]" },
          { name: "ops", type: "[result, op, ...args][]", desc: "Operations: [[\"d\", \"mul\", \"a\", \"b\"]]" },
          { name: "backward_from", type: "string", desc: "Which value to differentiate from" },
        ],
      },
      {
        name: "autograd_neuron",
        signature: 'autograd_neuron(inputs, weights, bias)',
        description: "Run a single neuron: out = tanh(sum(x*w) + b). Returns all gradients.",
        example: 'autograd_neuron([2, 0], [-3, 1], 6.88)',
        args: [
          { name: "inputs", type: "number[]", desc: "Input values" },
          { name: "weights", type: "number[]", desc: "Weight values (same length as inputs)" },
          { name: "bias", type: "number", desc: "Bias value" },
        ],
      },
    ],
  },
  {
    name: "Neural Networks",
    description: "Layers, MLPs, and attention — higher-level building blocks.",
    tools: [
      {
        name: "mlp_forward",
        signature: 'mlp_forward(input_data, input_shape, layers)',
        description: "Run a multi-layer perceptron forward + backward.",
        example: 'mlp_forward([1, 0.5], [1, 2], [{"in_features": 2, "out_features": 2, "weights": [0.1, 0.2, 0.3, 0.4], "bias": [0, 0]}])',
        args: [
          { name: "input_data", type: "number[]", desc: "Flat input values" },
          { name: "input_shape", type: "number[]", desc: "Input shape, e.g. [1, 2]" },
          { name: "layers", type: "object[]", desc: "Array of {in_features, out_features, weights, bias}" },
        ],
      },
      {
        name: "attention_forward",
        signature: 'attention_forward(seq_len, d_k, q_data, k_data, v_data)',
        description: "Run scaled dot-product attention: softmax(QK^T/sqrt(d_k))V.",
        example: 'attention_forward(2, 2, [1,0,0,1], [1,0,0,1], [1,2,3,4])',
        args: [
          { name: "seq_len", type: "number", desc: "Sequence length" },
          { name: "d_k", type: "number", desc: "Key/query dimension" },
          { name: "q_data", type: "number[]", desc: "Query data (seq_len * d_k)" },
          { name: "k_data", type: "number[]", desc: "Key data (seq_len * d_k)" },
          { name: "v_data", type: "number[]", desc: "Value data (seq_len * d_v)" },
        ],
      },
    ],
  },
  {
    name: "Training",
    description: "Create datasets, initialize networks, train with SGD, evaluate, and predict.",
    tools: [
      {
        name: "create_dataset",
        signature: 'create_dataset(type, n_samples?)',
        description: "Create a toy dataset. Stores input and target tensors in the store.",
        example: 'create_dataset("xor")',
        args: [
          { name: "type", type: "string", desc: '"and", "or", "xor", "circle"' },
          { name: "n_samples", type: "number?", desc: "Sample count for circle (default 100)" },
        ],
      },
      {
        name: "init_mlp",
        signature: 'init_mlp(architecture, name?)',
        description: "Initialize an MLP with random Xavier weights. Stores weight tensors.",
        example: 'init_mlp([2, 4, 1], "net")',
        args: [
          { name: "architecture", type: "number[]", desc: "Layer sizes, e.g. [2, 4, 1]" },
          { name: "name", type: "string?", desc: 'Name prefix (default "mlp")' },
        ],
      },
      {
        name: "train_mlp",
        signature: 'train_mlp(mlp, inputs, targets, lr, epochs)',
        description: "Train an MLP using SGD. Returns loss history for visualization.",
        example: 'train_mlp("net", "xor_inputs", "xor_targets", 0.5, 500)',
        args: [
          { name: "mlp", type: "string", desc: "MLP name prefix (from init_mlp)" },
          { name: "inputs", type: "string", desc: "Input tensor name in store" },
          { name: "targets", type: "string", desc: "Target tensor name in store" },
          { name: "lr", type: "number", desc: "Learning rate (e.g. 0.1, 0.5)" },
          { name: "epochs", type: "number", desc: "Number of training epochs" },
        ],
      },
      {
        name: "evaluate_mlp",
        signature: 'evaluate_mlp(mlp, inputs, targets?)',
        description: "Run forward pass without training. Returns predictions, loss, accuracy.",
        example: 'evaluate_mlp("net", "xor_inputs", "xor_targets")',
        args: [
          { name: "mlp", type: "string", desc: "MLP name prefix" },
          { name: "inputs", type: "string", desc: "Input tensor name" },
          { name: "targets", type: "string?", desc: "Target tensor name (for loss/accuracy)" },
        ],
      },
      {
        name: "mlp_predict",
        signature: 'mlp_predict(mlp, input)',
        description: "Single-sample prediction through a trained MLP.",
        example: 'mlp_predict("net", [1, 0])',
        args: [
          { name: "mlp", type: "string", desc: "MLP name prefix" },
          { name: "input", type: "number[]", desc: "Input values for one sample" },
        ],
      },
      {
        name: "mse_loss",
        signature: 'mse_loss(predicted, target)',
        description: "Compute mean squared error and its gradient.",
        example: 'mse_loss("predictions", "xor_targets")',
        args: [
          { name: "predicted", type: "string", desc: "Predicted tensor name" },
          { name: "target", type: "string", desc: "Target tensor name" },
        ],
      },
    ],
  },
];

export default function ToolReference() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  return (
    <PageTransition>
      <div className="max-w-4xl space-y-8">
        <div>
          <p className="text-sm font-mono text-[var(--color-accent-blue)]">
            Reference
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            MCP Tool Reference
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-2xl">
            Every tool available in the REPL playground. Click any example to
            try it. These all run on the rs-tensor Rust backend via the MCP
            protocol.
          </p>
        </div>

        {toolGroups.map((group) => (
          <div key={group.name} className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold">{group.name}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {group.description}
              </p>
            </div>

            <div className="space-y-2">
              {group.tools.map((tool) => {
                const isExpanded = expandedTool === tool.name;
                return (
                  <motion.div
                    key={tool.name}
                    className="border border-[var(--color-surface-overlay)] rounded-lg overflow-hidden"
                    layout
                  >
                    <button
                      onClick={() =>
                        setExpandedTool(isExpanded ? null : tool.name)
                      }
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)]/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-sm font-mono text-[var(--color-accent-blue)]">
                          {tool.name}
                        </code>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {tool.description}
                        </span>
                      </div>
                      <motion.span
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        className="text-[var(--color-text-muted)]"
                      >
                        {">"}
                      </motion.span>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-4 py-3 border-t border-[var(--color-surface-overlay)] space-y-3"
                      >
                        <div className="font-mono text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-base)] rounded p-2">
                          {tool.signature}
                        </div>

                        {tool.args.length > 0 && (
                          <table className="text-xs w-full">
                            <thead>
                              <tr className="text-[var(--color-text-muted)]">
                                <th className="text-left pr-4 pb-1 font-medium">
                                  Arg
                                </th>
                                <th className="text-left pr-4 pb-1 font-medium">
                                  Type
                                </th>
                                <th className="text-left pb-1 font-medium">
                                  Description
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tool.args.map((arg) => (
                                <tr
                                  key={arg.name}
                                  className="border-t border-[var(--color-surface-overlay)]"
                                >
                                  <td className="pr-4 py-1 font-mono text-[var(--color-accent-blue)]">
                                    {arg.name}
                                  </td>
                                  <td className="pr-4 py-1 font-mono text-[var(--color-text-muted)]">
                                    {arg.type}
                                  </td>
                                  <td className="py-1 text-[var(--color-text-secondary)]">
                                    {arg.desc}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        <TryThis
                          commands={[tool.example]}
                          label={`Try ${tool.name}`}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
