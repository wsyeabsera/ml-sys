export interface WorkflowStep {
  text: string;
  command?: string;
}

export interface Workflow {
  name: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  nextLink?: { label: string; path: string };
}

export const WORKFLOWS: Record<string, Workflow> = {
  xor: {
    name: "xor",
    title: "Train XOR From Scratch",
    description: "Build, train, and test a neural network that learns XOR",
    nextLink: { label: "XOR Problem project", path: "/projects/xor" },
    steps: [
      {
        text: "XOR is the classic neural network challenge. A single neuron can't learn it — you need a hidden layer. Let's create the dataset first: 4 input pairs and their XOR outputs.",
        command: 'create_dataset("xor", 4)',
      },
      {
        text: "Now we need a network. 2 inputs (the XOR bits), 4 hidden neurons (enough to find the pattern), 1 output. The weights start random.",
        command: 'init_mlp([2, 4, 1], "net")',
      },
      {
        text: "Training time. We'll run 500 epochs with learning rate 0.5. Each epoch: forward pass → compute loss → backward pass → update weights. Watch the loss drop.",
        command: 'train_mlp("net", "xor_inputs", "xor_targets", 0.5, 500)',
      },
      {
        text: "Did it learn? Let's evaluate on the training data. We want accuracy near 100% and loss near 0.",
        command: 'evaluate_mlp("net", "xor_inputs", "xor_targets")',
      },
      {
        text: "Let's test each input individually. [1, 0] should output ~1 (XOR of 1 and 0 is 1).",
        command: 'mlp_predict("net", [1, 0])',
      },
      {
        text: "[0, 1] should also be ~1.",
        command: 'mlp_predict("net", [0, 1])',
      },
      {
        text: "[1, 1] should be ~0 (XOR of 1 and 1 is 0). This is the hard case — a single layer can't separate this from [0,1] and [1,0].",
        command: 'mlp_predict("net", [1, 1])',
      },
      {
        text: "[0, 0] should be ~0. If all four are correct, the hidden layer successfully found a representation where XOR is linearly separable. That's the magic of neural networks — they learn their own features.",
        command: 'mlp_predict("net", [0, 0])',
      },
    ],
  },

  "tensor-basics": {
    name: "tensor-basics",
    title: "Tensor Basics",
    description: "Create, inspect, and transform tensors",
    nextLink: { label: "Learn 02: Tensors", path: "/learn/2" },
    steps: [
      {
        text: "A tensor is just a multi-dimensional array with a shape. Let's create a 2×3 matrix.",
        command: 'tensor_create("m", [1, 2, 3, 4, 5, 6], [2, 3])',
      },
      {
        text: "Inspect it to see the shape, strides, and layout in memory. Strides tell you how many elements to skip to move along each dimension.",
        command: 'tensor_inspect("m")',
      },
      {
        text: "Transpose swaps dimensions. Our [2,3] becomes [3,2]. Notice: this is zero-copy — it just changes the strides, not the data. This matters because autograd calls transpose on every backward pass.",
        command: 'tensor_transpose("m", 0, 1, "mT")',
      },
      {
        text: "Let's verify the transpose worked. The rows became columns.",
        command: 'tensor_inspect("mT")',
      },
      {
        text: "Reshape changes the logical shape without moving data. Let's flatten our 2×3 into a 6×1 column vector.",
        command: 'tensor_reshape("m", [6, 1], "flat")',
      },
      {
        text: "Now let's do a matrix multiply. Create a second matrix and multiply.",
        command: 'tensor_create("w", [1, 0, 0, 1, 1, 1], [3, 2])',
      },
      {
        text: "m is [2,3], w is [3,2]. The inner dimensions match (3), so m @ w gives us [2,2]. This is the core operation of every neural network layer.",
        command: 'tensor_matmul("m", "w", "result")',
      },
      {
        text: "Check all tensors in the store. You've created, transposed, reshaped, and multiplied — the fundamental operations of ML.",
        command: "tensor_list()",
      },
    ],
  },

  autograd: {
    name: "autograd",
    title: "Autograd: Watching Gradients Flow",
    description: "See how gradients propagate through computation graphs",
    nextLink: { label: "Learn 03: Autograd", path: "/learn/3" },
    steps: [
      {
        text: "Start simple: y = a × b where a=2, b=3. The gradient of a is b (=3) and vice versa. This is because nudging a by 0.001 changes y by b × 0.001.",
        command: 'autograd_expr([["a", 2], ["b", 3]], [["y", "mul", "a", "b"]], "y")',
      },
      {
        text: "Now add more operations: y = a×b + c. Addition passes gradients through unchanged. So c's gradient is 1 — it directly adds to the output.",
        command: 'autograd_expr([["a", 2], ["b", 3], ["c", 1]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"]], "e")',
      },
      {
        text: "Now the interesting part — add tanh at the end: y = tanh(a×b + c). With a=2, b=3, c=1, the input to tanh is 7. Tanh(7) ≈ 1.0, which means the gradient gets crushed to nearly zero.",
        command: 'autograd_expr([["a", 2], ["b", 3], ["c", 1]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"], ["f", "tanh", "e"]], "f")',
      },
      {
        text: "Compare: same expression but with smaller values (a=0.5, b=0.3, c=0.1). Tanh input is 0.25 — not saturated. Gradients flow freely this time.",
        command: 'autograd_expr([["a", 0.5], ["b", 0.3], ["c", 0.1]], [["d", "mul", "a", "b"], ["e", "add", "d", "c"], ["f", "tanh", "e"]], "f")',
      },
      {
        text: "Now a full neuron: out = tanh(x0×w0 + x1×w1 + bias). This is the building block of every neural network. Notice which weight has the larger gradient — that's the one training would update the most.",
        command: "autograd_neuron([2, 0], [-3, 1], 6.88)",
      },
      {
        text: "x1 is 0, so w1's gradient is 0. The neuron can't learn w1 when its input is zero — there's no signal. This is why dead inputs are a real problem in neural networks.",
      },
    ],
  },

  "vanishing-gradients": {
    name: "vanishing-gradients",
    title: "The Vanishing Gradient Problem",
    description: "Watch gradients shrink through layers of tanh",
    nextLink: { label: "Learn 04: Neural Networks", path: "/learn/4" },
    steps: [
      {
        text: "Tanh squashes values to [-1, 1]. Its gradient is (1 - output²), which is always ≤ 1. Let's see what happens with a small input where tanh is nearly linear.",
        command: 'autograd_expr([["x", 0.5]], [["y", "tanh", "x"]], "y")',
      },
      {
        text: "x=0.5, tanh(0.5)≈0.46, gradient ≈ 0.79. Most of the gradient passes through. Now try a larger input.",
        command: 'autograd_expr([["x", 2.0]], [["y", "tanh", "x"]], "y")',
      },
      {
        text: "x=2.0, tanh(2)≈0.96, gradient ≈ 0.07. Only 7% of the gradient survives! Now imagine this happening at EVERY layer.",
        command: 'autograd_expr([["x", 5.0]], [["y", "tanh", "x"]], "y")',
      },
      {
        text: "x=5.0, gradient is essentially 0. The neuron is saturated — it can't learn. In a 10-layer network, even moderate saturation at each layer multiplies to near-zero gradients in early layers.",
      },
      {
        text: "Let's see this in a real neuron. Large weights push the tanh input to extreme values.",
        command: "autograd_neuron([1, 1], [5, 5], 0)",
      },
      {
        text: "The output is near 1.0 (saturated), and the weight gradients are tiny. Now compare with small weights where tanh stays in its linear region.",
        command: "autograd_neuron([1, 1], [0.1, 0.1], 0)",
      },
      {
        text: "Much larger gradients! This is why weight initialization matters — start too large and gradients vanish from day one. Modern networks use ReLU (gradient=1 for positive values) instead of tanh to avoid this entirely.",
      },
    ],
  },
  and: {
    name: "and",
    title: "Train AND Gate",
    description: "The simplest neural network project — learn AND",
    nextLink: { label: "Train AND Gate project", path: "/projects/and" },
    steps: [
      {
        text: "AND is the easiest logic gate to learn: output is 1 only when BOTH inputs are 1. A single neuron can learn this because it's linearly separable.",
        command: 'create_dataset("and", 4)',
      },
      {
        text: "A simple 2→1 network is enough. No hidden layer needed — AND is a straight line in 2D space.",
        command: 'init_mlp([2, 1], "and_net")',
      },
      {
        text: "Train for 200 epochs. This should converge quickly since AND is so simple.",
        command: 'train_mlp("and_net", "and_inputs", "and_targets", 0.5, 200)',
      },
      {
        text: "Let's check accuracy. Should be 100% — if it's not, the learning rate or epochs might need tuning.",
        command: 'evaluate_mlp("and_net", "and_inputs", "and_targets")',
      },
      {
        text: "[1, 1] should be ~1 — both inputs are on.",
        command: 'mlp_predict("and_net", [1, 1])',
      },
      {
        text: "[1, 0] should be ~0 — only one input is on, AND requires both.",
        command: 'mlp_predict("and_net", [1, 0])',
      },
      {
        text: "That's it! AND is trivial for a neural network. The real test is XOR, which requires a hidden layer. Try /workflow xor next.",
      },
    ],
  },
};

export function getWorkflow(name: string): Workflow | null {
  return WORKFLOWS[name] ?? null;
}

export function listWorkflows(): Workflow[] {
  return Object.values(WORKFLOWS);
}
