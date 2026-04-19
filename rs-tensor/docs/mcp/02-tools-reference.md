# Tools reference (all 36)

Each tool is implemented on `TensorServer` in `rs-tensor/src/mcp/tools/mod.rs`. Argument structs live in `tensor_ops.rs`, `autograd_ops.rs`, `cnn_ops.rs`, `gguf_ops.rs`, `llama_ops.rs`, `training_ops.rs`, `project.rs`.

Unless noted, successes return JSON text in the MCP result; failures return **error** content with a message string.

Convention: **2D matmul** uses row-major flat `data` with `shape [rows, cols]`.

---

## 1. Core tensor (10)

| Tool | Summary |
|------|---------|
| `tensor_create` | `name`, `data: f32[]`, `shape: usize[]` — validates `len(data) == product(shape)`. |
| `tensor_add` | `a`, `b`, `result_name` — same shape. |
| `tensor_mul` | Element-wise multiply; same shape. |
| `tensor_matmul` | 2D only: `[M,K] @ [K,N]`. |
| `tensor_get` | `name`, `indices` — N-D index using tensor layout. |
| `tensor_get_2d` | `name`, `row`, `col`. |
| `tensor_reshape` | `name`, `new_shape`, `result_name`. |
| `tensor_transpose` | `name`, `dim0`, `dim1`, `result_name`. |
| `tensor_inspect` | Full shape, strides, data. |
| `tensor_list` | Lists stored tensors (see [limitations](05-limitations-and-troubleshooting.md) for edge cases). |

---

## 2. Project / build (2)

| Tool | Summary |
|------|---------|
| `read_file` | `path` relative to **`rs-tensor/`** crate root. |
| `cargo_exec` | `command`: **`"build"`** or **`"run"`** only — stdout/stderr returned. |

---

## 3. Datasets & MLP training (6)

| Tool | Summary |
|------|---------|
| `create_dataset` | `type`: `and` \| `or` \| `xor` \| `circle` (optional `n_samples` for circle). Produces `{type}_inputs` and `{type}_targets`. |
| `init_mlp` | `architecture: usize[]` (e.g. `[2,4,1]`), optional `name` prefix for weights. |
| `mse_loss` | `predicted`, `target` tensor names — same element count. |
| `train_mlp` | `mlp` prefix, `inputs`, `targets`, `lr`, `epochs` — full in-process training loop. |
| `evaluate_mlp` | Forward only; optional `targets` for loss/accuracy. |
| `mlp_predict` | Single sample `input: f32[]` through the stored MLP. |

---

## 4. Autograd & MLP forward (4)

| Tool | Summary |
|------|---------|
| `autograd_neuron` | Scalar neuron: `inputs`, `weights`, `bias` — `tanh` + backward. |
| `autograd_expr` | `values`, `ops` (`add`/`mul`/`tanh`), `backward_from`. |
| `autograd_neuron_tensor` | One layer `tanh(x @ w + b)` with explicit shapes. |
| `mlp_forward` | Multi-layer `tanh`; `layers[]` with `weights`, `bias`, `in_features`, `out_features`. |

---

## 5. Attention (1)

| Tool | Summary |
|------|---------|
| `attention_forward` | `q_data`, `k_data`, `v_data`, `seq_len`, `d_k`, optional `d_v` — scaled dot-product attention + backward. |

---

## 6. GGUF (2)

| Tool | Summary |
|------|---------|
| `gguf_inspect` | `path` — metadata + tensor inventory (absolute or relative). |
| `gguf_load_tensor` | `path`, `tensor_name`, optional `store_as` — loads F32/F16 slice into tensor store. |

---

## 7. LLaMA (3)

| Tool | Summary |
|------|---------|
| `llama_load` | `path` to a **Llama-compatible** GGUF — loads weights + vocab into server state. |
| `llama_generate` | `prompt` and/or `token_ids`, `max_tokens`, `temperature` — requires loaded model. |
| `llama_inspect` | Dump config / shapes / vocab sample — requires loaded model. |

---

## 8. CNN (8)

| Tool | Summary |
|------|---------|
| `conv2d_forward` | `input`, `kernel`, optional `bias`, `stride`, `padding`, `result_name` — NCHW. |
| `max_pool2d` | `input`, `kernel_size`, optional `stride`, `result_name`. |
| `avg_pool2d` | Same as max, mean window. |
| `batch_norm2d` | `input`, `gamma`, `beta`, optional `eps`, `result_name`. |
| `flatten_tensor` | 4D → 2D `[N, C*H*W]`. |
| `global_avg_pool` | NCHW → NC. |
| `init_cnn` | Layer spec: `conv2d`, `relu`, `max_pool2d`, `avg_pool2d`, `flatten`, `linear`. |
| `cnn_forward` | `model` name prefix, `input` tensor — walks conv weights then FC weights. |

---

## Typical call chains (for agents)

**XOR toy MLP:** `create_dataset` (xor) → `init_mlp` → `train_mlp` → `evaluate_mlp` / `mlp_predict`.

**Manual CNN:** `tensor_create` (image + kernel + bias) → `conv2d_forward` → `max_pool2d` → …

**Declared CNN:** `init_cnn` → `tensor_create` (input image) → `cnn_forward`.

**LLaMA:** `llama_load` → `llama_generate` → optionally `llama_inspect`.

**GGUF tensor:** `gguf_inspect` → `gguf_load_tensor` → use name in other ops if shapes match.

---

*See [05-limitations-and-troubleshooting.md](05-limitations-and-troubleshooting.md) for `cargo run`, LLaMA metadata, and path pitfalls.*

*Next: [03-resources-and-prompts.md](03-resources-and-prompts.md).*
