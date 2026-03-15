# REPL Workflow System

Status: **done** (2026-03-15)

## What it is

Pre-scripted multi-step sequences with explanations between steps. No AI needed — just JSON workflows that the REPL executes step by step with text guidance.

Like Quick Start snippets but with narrative between steps, so you learn WHY you're running each command.

## How it works

1. Type `/workflow xor` (or click a button)
2. REPL shows: "Step 1/4: Let's create training data for XOR..."
3. Runs `create_dataset("xor", 4)`, shows result
4. Shows: "Step 2/4: Now we need a network. 2 inputs, 4 hidden neurons, 1 output..."
5. Runs `init_mlp([2, 4, 1], "net")`, shows result
6. Continue through all steps
7. End with a summary of what happened

## Workflows to build

### 1. `xor` — Train XOR from scratch
- Create dataset → init MLP → train → evaluate → predict each input
- Teaches: full training pipeline

### 2. `tensor-basics` — Create and manipulate tensors
- Create → inspect → transpose → reshape → matmul
- Teaches: tensor operations and shapes

### 3. `autograd` — See gradients flow
- Simple expr → add tanh → full neuron
- Teaches: how autograd computes gradients

### 4. `vanishing-gradients` — Watch gradients shrink
- Neuron with small input vs large input
- Shows gradient magnitude difference
- Teaches: why tanh causes vanishing gradients

## Implementation

- Workflows defined as data (array of steps)
- Each step: `{ text: string, command?: string }`
- Steps without commands are just explanations
- REPL detects `/workflow <name>` and enters workflow mode
- Shows step text, waits for user to press "Next" or auto-advances after command completes
- Progress indicator: "Step 2/6"

## Files to change
- `src/lib/workflows.ts` — workflow definitions
- `src/hooks/useRepl.ts` — detect `/workflow` command, manage workflow state
- `src/pages/Playground.tsx` — render workflow step text + progress bar
