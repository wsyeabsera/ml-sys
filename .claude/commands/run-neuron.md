---
description: Run a neuron computation via MCP and walk through the computation graph step by step
---

Run a single neuron forward and backward pass, then walk through the computation graph explaining each gradient.

## MCP tools used
- `autograd_neuron` — run scalar neuron (tanh(sum(xi*wi) + bias)) with full gradient output
- `autograd_neuron_tensor` — run tensor-level layer (tanh(x @ w + b)) with gradient tensors
- `autograd_expr` — for custom expressions if the user wants to modify the graph

## Parameters
- $ARGUMENTS — optional: custom inputs/weights (e.g., "x=[1,2] w=[0.5,-0.3] b=0.1"), or "tensor" to use tensor-level version, or empty for default example

## Behavior
1. If no arguments, use the classic example: x1=2, x2=0, w1=-3, w2=1, b=6.8814
2. Run `autograd_neuron` (or `autograd_neuron_tensor` if "tensor" specified)
3. Display the forward pass result
4. Walk through each gradient, explaining what it means physically
5. Show how gradient descent would update each weight (weight -= learning_rate * grad)
6. If custom values provided, parse them and run with those instead
