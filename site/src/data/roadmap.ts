export type TaskStatus = "done" | "in-progress" | "planned";

export interface Task {
  label: string;
  status: TaskStatus;
}

export interface Phase {
  num: number;
  title: string;
  status: TaskStatus;
  description: string;
  tasks: Task[];
  readings: string[];
}

export const phases: Phase[] = [
  {
    num: 1,
    title: "Tensor from Scratch",
    status: "done",
    description: "Build a strided N-dimensional array with basic operations.",
    tasks: [
      { label: "Tensor struct with shape + strides", status: "done" },
      { label: "get_2d and N-dim get via strides", status: "done" },
      { label: "Element-wise add and mul", status: "done" },
      { label: "Reshape (with materialization)", status: "done" },
      { label: "Transpose (zero-copy via stride swap)", status: "done" },
      { label: "Matrix multiply (naive triple loop)", status: "done" },
      { label: "MCP server exposing all tensor ops", status: "done" },
    ],
    readings: ["Matrix Calculus for Deep Learning (Parr & Howard)"],
  },
  {
    num: 2,
    title: "Autograd Engine",
    status: "done",
    description:
      "Build computation graphs and automatic differentiation — scalar then tensor-level.",
    tasks: [
      { label: "Scalar Value type with Rc<RefCell>", status: "done" },
      { label: "Forward ops: add, mul, tanh", status: "done" },
      { label: "Topological sort for backward", status: "done" },
      { label: "Gradient computation via chain rule", status: "done" },
      { label: "TensorValue with tensor-level backward", status: "done" },
      { label: "MatMul gradient (grad@b^T, a^T@grad)", status: "done" },
      { label: "MCP tools for autograd", status: "done" },
    ],
    readings: [
      "Karpathy's micrograd video",
      "The Illustrated Transformer (Jay Alammar)",
    ],
  },
  {
    num: 3,
    title: "Tiny Inference Engine",
    status: "in-progress",
    description:
      "Feedforward network, attention mechanism, and GGUF model loading.",
    tasks: [
      { label: "Feedforward layer (MLP)", status: "done" },
      { label: "Scaled dot-product attention", status: "done" },
      { label: "GGUF format loader", status: "done" },
      { label: "Token-by-token generation", status: "planned" },
    ],
    readings: [
      "Attention Is All You Need (Vaswani et al.)",
    ],
  },
  {
    num: 4,
    title: "Follow Curiosity",
    status: "planned",
    description: "Deep dives: SIMD, CUDA, quantization, kernel fusion.",
    tasks: [
      { label: "SIMD-accelerated ops", status: "planned" },
      { label: "CUDA kernel bindings", status: "planned" },
      { label: "Quantization (INT8/INT4)", status: "planned" },
      { label: "Operator fusion", status: "planned" },
    ],
    readings: [],
  },
];
