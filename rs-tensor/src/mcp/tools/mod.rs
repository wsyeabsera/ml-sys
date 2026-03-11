pub mod autograd_ops;
pub mod gguf_ops;
pub mod project;
pub mod tensor_ops;

use std::collections::HashMap;

use rmcp::{
    ErrorData as McpError,
    handler::server::wrapper::Parameters,
    model::*,
    tool, tool_router,
};
use serde_json::json;

use super::TensorServer;
use crate::attention::scaled_dot_product_attention;
use crate::autograd::Value;
use crate::gguf::GgufFile;
use crate::mlp::{Layer, MLP};
use crate::tensor::Tensor;
use crate::tensor_value::TensorValue;
use autograd_ops::{
    AttentionArgs, AutogradExprArgs, AutogradNeuronArgs, AutogradTensorLayerArgs, MlpForwardArgs,
};
use gguf_ops::{GgufInspectArgs, GgufLoadTensorArgs};
use project::{CargoExecArgs, ReadFileArgs};
use tensor_ops::{
    TensorAddArgs, TensorCreateArgs, TensorGet2dArgs, TensorGetArgs, TensorInspectArgs,
    TensorMatmulArgs, TensorMulArgs, TensorReshapeArgs, TensorTransposeArgs,
};

#[tool_router(vis = "pub(crate)")]
impl TensorServer {
    #[tool(description = "Create a named tensor from data and shape. Example: data=[1,2,3,4], shape=[2,2]")]
    async fn tensor_create(
        &self,
        Parameters(args): Parameters<TensorCreateArgs>,
    ) -> Result<CallToolResult, McpError> {
        let expected_len: usize = args.shape.iter().product();
        if args.data.len() != expected_len {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Shape {:?} expects {} elements, got {}",
                args.shape, expected_len, args.data.len()
            ))]));
        }

        let t = Tensor::new(args.data, args.shape.clone());
        let info = format!(
            "Created tensor '{}': shape={:?}, data={:?}",
            args.name, t.shape, t.data
        );
        self.tensors.lock().await.insert(args.name, t);
        Ok(CallToolResult::success(vec![Content::text(info)]))
    }

    #[tool(description = "Add two named tensors and store the result. Shapes must match.")]
    async fn tensor_add(
        &self,
        Parameters(args): Parameters<TensorAddArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        let a = match store.get(&args.a) {
            Some(t) => t,
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Tensor '{}' not found",
                    args.a
                ))]))
            }
        };
        let b = match store.get(&args.b) {
            Some(t) => t,
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Tensor '{}' not found",
                    args.b
                ))]))
            }
        };

        if a.shape != b.shape {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Shape mismatch: {:?} vs {:?}",
                a.shape, b.shape
            ))]));
        }

        let result = a.add(b);
        let info = format!(
            "tensor_add('{}', '{}') -> '{}': shape={:?}, data={:?}",
            args.a, args.b, args.result_name, result.shape, result.data
        );
        drop(store);
        self.tensors.lock().await.insert(args.result_name, result);
        Ok(CallToolResult::success(vec![Content::text(info)]))
    }

    #[tool(description = "Element-wise multiply two named tensors and store the result. Shapes must match.")]
    async fn tensor_mul(
        &self,
        Parameters(args): Parameters<TensorMulArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        let a = match store.get(&args.a) {
            Some(t) => t,
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Tensor '{}' not found",
                    args.a
                ))]))
            }
        };
        let b = match store.get(&args.b) {
            Some(t) => t,
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Tensor '{}' not found",
                    args.b
                ))]))
            }
        };

        if a.shape != b.shape {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Shape mismatch: {:?} vs {:?}",
                a.shape, b.shape
            ))]));
        }

        let result = a.mul(b);
        let info = format!(
            "tensor_mul('{}', '{}') -> '{}': shape={:?}, data={:?}",
            args.a, args.b, args.result_name, result.shape, result.data
        );
        drop(store);
        self.tensors.lock().await.insert(args.result_name, result);
        Ok(CallToolResult::success(vec![Content::text(info)]))
    }

    #[tool(description = "Matrix multiply two 2D tensors: [M,K] x [K,N] -> [M,N]. Inner dimensions must match.")]
    async fn tensor_matmul(
        &self,
        Parameters(args): Parameters<TensorMatmulArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        let a = match store.get(&args.a) {
            Some(t) => t,
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Tensor '{}' not found",
                    args.a
                ))]))
            }
        };
        let b = match store.get(&args.b) {
            Some(t) => t,
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Tensor '{}' not found",
                    args.b
                ))]))
            }
        };

        if a.shape.len() != 2 || b.shape.len() != 2 {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Both tensors must be 2D. Got shapes {:?} and {:?}",
                a.shape, b.shape
            ))]));
        }

        if a.shape[1] != b.shape[0] {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Inner dimensions must match: {}x{} vs {}x{}",
                a.shape[0], a.shape[1], b.shape[0], b.shape[1]
            ))]));
        }

        let result = a.matmul(b);
        let info = format!(
            "matmul('{}' {:?}, '{}' {:?}) -> '{}': shape={:?}, data={:?}",
            args.a, a.shape, args.b, b.shape, args.result_name, result.shape, result.data
        );
        drop(store);
        self.tensors.lock().await.insert(args.result_name, result);
        Ok(CallToolResult::success(vec![Content::text(info)]))
    }

    #[tool(description = "Get a single element from a 2D tensor by (row, col). Returns the value at that position.")]
    async fn tensor_get_2d(
        &self,
        Parameters(args): Parameters<TensorGet2dArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        match store.get(&args.name) {
            Some(t) => match t.get_2d(args.row, args.col) {
                Some(val) => Ok(CallToolResult::success(vec![Content::text(format!(
                    "{}[{}, {}] = {}",
                    args.name, args.row, args.col, val
                ))])),
                None => Ok(CallToolResult::error(vec![Content::text(format!(
                    "Index ({}, {}) out of bounds for shape {:?}",
                    args.row, args.col, t.shape
                ))])),
            },
            None => Ok(CallToolResult::error(vec![Content::text(format!(
                "Tensor '{}' not found",
                args.name
            ))])),
        }
    }

    #[tool(description = "Get a single element by N-dimensional indices. e.g. indices=[1,2] for a 2D tensor.")]
    async fn tensor_get(
        &self,
        Parameters(args): Parameters<TensorGetArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        match store.get(&args.name) {
            Some(t) => match t.get(&args.indices) {
                Some(val) => Ok(CallToolResult::success(vec![Content::text(format!(
                    "{}[{:?}] = {}",
                    args.name, args.indices, val
                ))])),
                None => Ok(CallToolResult::error(vec![Content::text(format!(
                    "Index {:?} out of bounds for shape {:?}",
                    args.indices, t.shape
                ))])),
            },
            None => Ok(CallToolResult::error(vec![Content::text(format!(
                "Tensor '{}' not found",
                args.name
            ))])),
        }
    }

    #[tool(description = "Reshape a tensor to a new shape. Product of new shape must equal the number of elements.")]
    async fn tensor_reshape(
        &self,
        Parameters(args): Parameters<TensorReshapeArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        match store.get(&args.name) {
            Some(t) => match t.reshape(args.new_shape.clone()) {
                Some(result) => {
                    let info = format!(
                        "reshape('{}') {:?} -> '{}' {:?}",
                        args.name, t.shape, args.result_name, result.shape
                    );
                    drop(store);
                    self.tensors.lock().await.insert(args.result_name, result);
                    Ok(CallToolResult::success(vec![Content::text(info)]))
                }
                None => {
                    let current_size: usize = t.data.len();
                    let new_size: usize = args.new_shape.iter().product();
                    Ok(CallToolResult::error(vec![Content::text(format!(
                        "Cannot reshape: {} elements into shape {:?} ({} elements)",
                        current_size, args.new_shape, new_size
                    ))]))
                }
            },
            None => Ok(CallToolResult::error(vec![Content::text(format!(
                "Tensor '{}' not found",
                args.name
            ))])),
        }
    }

    #[tool(description = "Transpose a tensor by swapping two dimensions. Zero-copy: only swaps shape and strides.")]
    async fn tensor_transpose(
        &self,
        Parameters(args): Parameters<TensorTransposeArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        match store.get(&args.name) {
            Some(t) => match t.transpose(args.dim0, args.dim1) {
                Some(result) => {
                    let info = format!(
                        "transpose('{}', dim{}↔dim{}) -> '{}': shape={:?}, strides={:?}",
                        args.name, args.dim0, args.dim1, args.result_name, result.shape, result.strides
                    );
                    drop(store);
                    self.tensors.lock().await.insert(args.result_name, result);
                    Ok(CallToolResult::success(vec![Content::text(info)]))
                }
                None => Ok(CallToolResult::error(vec![Content::text(format!(
                    "Invalid dimensions ({}, {}) for tensor with {} dims",
                    args.dim0, args.dim1, t.shape.len()
                ))])),
            },
            None => Ok(CallToolResult::error(vec![Content::text(format!(
                "Tensor '{}' not found",
                args.name
            ))])),
        }
    }

    #[tool(description = "Inspect a named tensor: shows shape, strides, and data.")]
    async fn tensor_inspect(
        &self,
        Parameters(args): Parameters<TensorInspectArgs>,
    ) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        match store.get(&args.name) {
            Some(t) => Ok(CallToolResult::success(vec![Content::text(
                json!({
                    "name": args.name,
                    "shape": t.shape,
                    "strides": t.strides,
                    "data": t.data,
                    "num_elements": t.data.len(),
                })
                .to_string(),
            )])),
            None => Ok(CallToolResult::error(vec![Content::text(format!(
                "Tensor '{}' not found",
                args.name
            ))])),
        }
    }

    #[tool(description = "List all tensors currently stored in memory.")]
    async fn tensor_list(&self) -> Result<CallToolResult, McpError> {
        let store = self.tensors.lock().await;
        if store.is_empty() {
            return Ok(CallToolResult::success(vec![Content::text(
                "No tensors stored.",
            )]));
        }
        let summary: Vec<String> = store
            .iter()
            .map(|(name, t)| {
                format!(
                    "  {} : shape={:?} ({} elements)",
                    name,
                    t.shape,
                    t.data.len()
                )
            })
            .collect();
        Ok(CallToolResult::success(vec![Content::text(format!(
            "Stored tensors:\n{}",
            summary.join("\n")
        ))]))
    }

    #[tool(description = "Read a file from the project directory (logs, JSON output, source code). Path is relative to rs-tensor/.")]
    async fn read_file(
        &self,
        Parameters(args): Parameters<ReadFileArgs>,
    ) -> Result<CallToolResult, McpError> {
        let base = std::env::current_dir().unwrap_or_default();
        let path = base.join(&args.path);

        if !path.starts_with(&base) {
            return Ok(CallToolResult::error(vec![Content::text(
                "Path must be within the project directory.",
            )]));
        }

        match tokio::fs::read_to_string(&path).await {
            Ok(contents) => Ok(CallToolResult::success(vec![Content::text(contents)])),
            Err(e) => Ok(CallToolResult::error(vec![Content::text(format!(
                "Failed to read '{}': {}",
                args.path, e
            ))])),
        }
    }

    #[tool(description = "Run `cargo build` or `cargo run` and return stdout/stderr. command must be 'build' or 'run'.")]
    async fn cargo_exec(
        &self,
        Parameters(args): Parameters<CargoExecArgs>,
    ) -> Result<CallToolResult, McpError> {
        let subcommand = match args.command.as_str() {
            "build" | "run" => args.command.as_str(),
            _ => {
                return Ok(CallToolResult::error(vec![Content::text(
                    "command must be 'build' or 'run'",
                )]))
            }
        };

        let output = tokio::process::Command::new("cargo")
            .arg(subcommand)
            .current_dir(std::env::current_dir().unwrap_or_default())
            .output()
            .await;

        match output {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout);
                let stderr = String::from_utf8_lossy(&out.stderr);
                let status = if out.status.success() {
                    "success"
                } else {
                    "failed"
                };
                Ok(CallToolResult::success(vec![Content::text(format!(
                    "[{}]\n\n--- stdout ---\n{}\n--- stderr ---\n{}",
                    status, stdout, stderr
                ))]))
            }
            Err(e) => Ok(CallToolResult::error(vec![Content::text(format!(
                "Failed to run cargo: {}",
                e
            ))])),
        }
    }

    // ── Autograd tools ──────────────────────────────────────────

    #[tool(description = "Run a single neuron: out = tanh(sum(inputs[i] * weights[i]) + bias). Returns the output and gradients for all inputs, weights, and bias.")]
    async fn autograd_neuron(
        &self,
        Parameters(args): Parameters<AutogradNeuronArgs>,
    ) -> Result<CallToolResult, McpError> {
        if args.inputs.len() != args.weights.len() {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "inputs length ({}) must match weights length ({})",
                args.inputs.len(),
                args.weights.len()
            ))]));
        }

        // Build the computation graph (all synchronous — no Rc across await)
        let inputs: Vec<Value> = args
            .inputs
            .iter()
            .enumerate()
            .map(|(i, &v)| Value::new(v, &format!("x{}", i)))
            .collect();
        let weights: Vec<Value> = args
            .weights
            .iter()
            .enumerate()
            .map(|(i, &v)| Value::new(v, &format!("w{}", i)))
            .collect();
        let bias = Value::new(args.bias, "b");

        // Forward: sum(xi * wi) + b
        let mut sum = &inputs[0] * &weights[0];
        for i in 1..inputs.len() {
            let prod = &inputs[i] * &weights[i];
            sum = &sum + &prod;
        }
        let pre_activation = &sum + &bias;
        let output = pre_activation.tanh();

        // Backward
        output.backward();

        // Collect results
        let mut results = json!({
            "output": output.data(),
            "output_grad": output.grad(),
            "bias": { "value": bias.data(), "grad": bias.grad() },
        });

        let input_grads: Vec<_> = inputs
            .iter()
            .map(|v| json!({ "value": v.data(), "grad": v.grad() }))
            .collect();
        let weight_grads: Vec<_> = weights
            .iter()
            .map(|v| json!({ "value": v.data(), "grad": v.grad() }))
            .collect();

        results["inputs"] = json!(input_grads);
        results["weights"] = json!(weight_grads);

        Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(&results).unwrap(),
        )]))
    }

    #[tool(description = "Evaluate a custom autograd expression. Define named values, chain operations (add, mul, tanh), then run backward from a specified output. Returns all values with their gradients.")]
    async fn autograd_expr(
        &self,
        Parameters(args): Parameters<AutogradExprArgs>,
    ) -> Result<CallToolResult, McpError> {
        let mut store: HashMap<String, Value> = HashMap::new();

        // Create leaf values
        for (name, data) in &args.values {
            store.insert(name.clone(), Value::new(*data, name));
        }

        // Execute operations
        for op_def in &args.ops {
            if op_def.len() < 3 {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Operation must have at least 3 elements [result, op, arg1], got {:?}",
                    op_def
                ))]));
            }

            let result_name = &op_def[0];
            let op = &op_def[1];
            let arg1_name = &op_def[2];

            let arg1 = match store.get(arg1_name) {
                Some(v) => v.clone(),
                None => {
                    return Ok(CallToolResult::error(vec![Content::text(format!(
                        "Value '{}' not found",
                        arg1_name
                    ))]))
                }
            };

            let result = match op.as_str() {
                "add" => {
                    if op_def.len() < 4 {
                        return Ok(CallToolResult::error(vec![Content::text(
                            "add requires two arguments: [result, \"add\", a, b]".to_string(),
                        )]));
                    }
                    let arg2 = match store.get(&op_def[3]) {
                        Some(v) => v.clone(),
                        None => {
                            return Ok(CallToolResult::error(vec![Content::text(format!(
                                "Value '{}' not found",
                                op_def[3]
                            ))]))
                        }
                    };
                    &arg1 + &arg2
                }
                "mul" => {
                    if op_def.len() < 4 {
                        return Ok(CallToolResult::error(vec![Content::text(
                            "mul requires two arguments: [result, \"mul\", a, b]".to_string(),
                        )]));
                    }
                    let arg2 = match store.get(&op_def[3]) {
                        Some(v) => v.clone(),
                        None => {
                            return Ok(CallToolResult::error(vec![Content::text(format!(
                                "Value '{}' not found",
                                op_def[3]
                            ))]))
                        }
                    };
                    &arg1 * &arg2
                }
                "tanh" => arg1.tanh(),
                _ => {
                    return Ok(CallToolResult::error(vec![Content::text(format!(
                        "Unknown op '{}'. Supported: add, mul, tanh",
                        op
                    ))]))
                }
            };

            store.insert(result_name.clone(), result);
        }

        // Run backward
        match store.get(&args.backward_from) {
            Some(v) => v.backward(),
            None => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Value '{}' not found for backward",
                    args.backward_from
                ))]))
            }
        }

        // Collect all values with gradients
        let mut results: Vec<serde_json::Value> = Vec::new();
        // Show leaf values first, then computed values
        for (name, _) in &args.values {
            if let Some(v) = store.get(name) {
                results.push(json!({
                    "name": name,
                    "data": v.data(),
                    "grad": v.grad(),
                }));
            }
        }
        for op_def in &args.ops {
            let name = &op_def[0];
            if let Some(v) = store.get(name) {
                results.push(json!({
                    "name": name,
                    "data": v.data(),
                    "grad": v.grad(),
                }));
            }
        }

        Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(&json!({ "values": results })).unwrap(),
        )]))
    }

    // ── Tensor-level autograd tools ─────────────────────────────

    #[tool(description = "Run a tensor-level neural network layer: out = tanh(x @ w + b). Returns output and gradients for x, w, and b. Uses TensorValue autograd for matrix operations.")]
    async fn autograd_neuron_tensor(
        &self,
        Parameters(args): Parameters<AutogradTensorLayerArgs>,
    ) -> Result<CallToolResult, McpError> {
        // Validate shapes
        let x_size: usize = args.input_shape.iter().product();
        let w_size: usize = args.weight_shape.iter().product();
        let b_size: usize = args.bias_shape.iter().product();

        if args.input_data.len() != x_size {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Input shape {:?} expects {} elements, got {}",
                args.input_shape, x_size, args.input_data.len()
            ))]));
        }
        if args.weight_data.len() != w_size {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Weight shape {:?} expects {} elements, got {}",
                args.weight_shape, w_size, args.weight_data.len()
            ))]));
        }
        if args.bias_data.len() != b_size {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Bias shape {:?} expects {} elements, got {}",
                args.bias_shape, b_size, args.bias_data.len()
            ))]));
        }

        // Build TensorValues and run forward + backward (all synchronous, no Rc across await)
        let x = TensorValue::new(Tensor::new(args.input_data, args.input_shape), "x");
        let w = TensorValue::new(Tensor::new(args.weight_data, args.weight_shape), "w");
        let b = TensorValue::new(Tensor::new(args.bias_data, args.bias_shape), "b");

        let xw = x.matmul(&w);
        let pre = xw.add(&b);
        let out = pre.tanh();
        out.backward();

        let result = json!({
            "output": {
                "data": out.data().data,
                "shape": out.data().shape,
            },
            "x": {
                "data": x.data().data,
                "shape": x.data().shape,
                "grad": x.grad().data,
            },
            "w": {
                "data": w.data().data,
                "shape": w.data().shape,
                "grad": w.grad().data,
            },
            "b": {
                "data": b.data().data,
                "shape": b.data().shape,
                "grad": b.grad().data,
            },
        });

        Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(&result).unwrap(),
        )]))
    }

    #[tool(description = "Run a multi-layer perceptron (feedforward network) forward pass with backward. Each layer computes tanh(x @ w + b). Returns the output and gradients for all layer weights and biases.")]
    async fn mlp_forward(
        &self,
        Parameters(args): Parameters<MlpForwardArgs>,
    ) -> Result<CallToolResult, McpError> {
        // Validate input
        let x_size: usize = args.input_shape.iter().product();
        if args.input_data.len() != x_size {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Input shape {:?} expects {} elements, got {}",
                args.input_shape, x_size, args.input_data.len()
            ))]));
        }

        if args.layers.is_empty() {
            return Ok(CallToolResult::error(vec![Content::text(
                "MLP must have at least one layer".to_string(),
            )]));
        }

        // Validate each layer's dimensions
        for (i, layer_def) in args.layers.iter().enumerate() {
            let expected_w = layer_def.in_features * layer_def.out_features;
            if layer_def.weights.len() != expected_w {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Layer {} weights: expected {} elements ({}x{}), got {}",
                    i, expected_w, layer_def.in_features, layer_def.out_features, layer_def.weights.len()
                ))]));
            }
            if layer_def.bias.len() != layer_def.out_features {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Layer {} bias: expected {} elements, got {}",
                    i, layer_def.out_features, layer_def.bias.len()
                ))]));
            }
        }

        // Validate layer connectivity
        let first_in = args.layers[0].in_features;
        if args.input_shape.len() == 2 && args.input_shape[1] != first_in {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Input has {} features but first layer expects {}",
                args.input_shape[1], first_in
            ))]));
        }
        for i in 1..args.layers.len() {
            if args.layers[i - 1].out_features != args.layers[i].in_features {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Layer {} outputs {} features but layer {} expects {}",
                    i - 1, args.layers[i - 1].out_features, i, args.layers[i].in_features
                ))]));
            }
        }

        // Build and run the MLP (all synchronous — no Rc across await)
        let layers: Vec<Layer> = args
            .layers
            .iter()
            .enumerate()
            .map(|(i, def)| {
                Layer::new(
                    def.weights.clone(),
                    def.bias.clone(),
                    def.in_features,
                    def.out_features,
                    &format!("L{}", i),
                )
            })
            .collect();

        let mlp = MLP::new(layers);
        let x = TensorValue::new(Tensor::new(args.input_data, args.input_shape), "x");
        let out = mlp.forward(&x);
        out.backward();

        // Collect results
        let mut layer_results = Vec::new();
        for (i, layer) in mlp.layers.iter().enumerate() {
            layer_results.push(json!({
                "layer": i,
                "w": {
                    "shape": layer.w.data().shape,
                    "data": layer.w.data().data,
                    "grad": layer.w.grad().data,
                },
                "b": {
                    "shape": layer.b.data().shape,
                    "data": layer.b.data().data,
                    "grad": layer.b.grad().data,
                },
            }));
        }

        let result = json!({
            "output": {
                "data": out.data().data,
                "shape": out.data().shape,
            },
            "input_grad": x.grad().data,
            "layers": layer_results,
        });

        Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(&result).unwrap(),
        )]))
    }

    // ── Attention tools ─────────────────────────────────────────

    #[tool(description = "Run scaled dot-product attention: softmax(Q @ K^T / sqrt(d_k)) @ V. Returns the output, attention weights, and gradients for Q, K, V.")]
    async fn attention_forward(
        &self,
        Parameters(args): Parameters<AttentionArgs>,
    ) -> Result<CallToolResult, McpError> {
        let d_v = args.d_v.unwrap_or(args.d_k);

        // Validate sizes
        let q_expected = args.seq_len * args.d_k;
        let k_expected = args.seq_len * args.d_k;
        let v_expected = args.seq_len * d_v;

        if args.q_data.len() != q_expected {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "Q: expected {} elements ({}x{}), got {}",
                q_expected, args.seq_len, args.d_k, args.q_data.len()
            ))]));
        }
        if args.k_data.len() != k_expected {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "K: expected {} elements ({}x{}), got {}",
                k_expected, args.seq_len, args.d_k, args.k_data.len()
            ))]));
        }
        if args.v_data.len() != v_expected {
            return Ok(CallToolResult::error(vec![Content::text(format!(
                "V: expected {} elements ({}x{}), got {}",
                v_expected, args.seq_len, d_v, args.v_data.len()
            ))]));
        }

        let q = TensorValue::new(
            Tensor::new(args.q_data, vec![args.seq_len, args.d_k]),
            "Q",
        );
        let k = TensorValue::new(
            Tensor::new(args.k_data, vec![args.seq_len, args.d_k]),
            "K",
        );
        let v = TensorValue::new(
            Tensor::new(args.v_data, vec![args.seq_len, d_v]),
            "V",
        );

        let (output, weights) = scaled_dot_product_attention(&q, &k, &v);

        // Run backward from sum of output to get gradients
        let loss = output.sum();
        loss.backward();

        let result = json!({
            "output": {
                "data": output.data().data,
                "shape": output.data().shape,
            },
            "attention_weights": {
                "data": weights.data().data,
                "shape": weights.data().shape,
            },
            "Q_grad": q.grad().data,
            "K_grad": k.grad().data,
            "V_grad": v.grad().data,
        });

        Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(&result).unwrap(),
        )]))
    }

    // ── GGUF tools ──────────────────────────────────────────────

    #[tool(description = "Inspect a GGUF model file: shows version, metadata, architecture, and lists all tensors with shapes and dtypes.")]
    async fn gguf_inspect(
        &self,
        Parameters(args): Parameters<GgufInspectArgs>,
    ) -> Result<CallToolResult, McpError> {
        let path = std::path::Path::new(&args.path);
        let file = match std::fs::File::open(path) {
            Ok(f) => f,
            Err(e) => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Failed to open '{}': {}",
                    args.path, e
                ))]))
            }
        };

        let reader = std::io::BufReader::new(file);
        let gguf = match GgufFile::parse(reader) {
            Ok(g) => g,
            Err(e) => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Failed to parse GGUF: {}",
                    e
                ))]))
            }
        };

        let summary = gguf.summary();
        let tensors = gguf.list_tensors();

        // Show key metadata
        let mut meta_lines = Vec::new();
        let interesting_keys = [
            "general.architecture",
            "general.name",
            "general.file_type",
            "general.quantization_version",
        ];
        for key in &interesting_keys {
            if let Some(val) = gguf.metadata.get(*key) {
                meta_lines.push(format!("  {}: {:?}", key, val));
            }
        }
        // Also show any architecture-specific keys
        if let Some(arch) = gguf
            .metadata
            .get("general.architecture")
            .and_then(|v| v.as_str())
        {
            for (key, val) in &gguf.metadata {
                if key.starts_with(&format!("{}.", arch)) {
                    meta_lines.push(format!("  {}: {:?}", key, val));
                }
            }
        }

        let tensor_list = if tensors.len() > 50 {
            let mut lines: Vec<String> = tensors.iter().take(25).cloned().collect();
            lines.push(format!("  ... ({} more tensors)", tensors.len() - 50));
            lines.extend(tensors.iter().rev().take(25).rev().cloned());
            lines
        } else {
            tensors
        };

        let result = format!(
            "{}\n\nMetadata:\n{}\n\nTensors ({}):\n{}",
            summary,
            meta_lines.join("\n"),
            tensor_list.len(),
            tensor_list
                .iter()
                .map(|t| format!("  {}", t))
                .collect::<Vec<_>>()
                .join("\n")
        );

        Ok(CallToolResult::success(vec![Content::text(result)]))
    }

    #[tool(description = "Load a tensor from a GGUF file into the tensor store. Supports F32 and F16 tensors (F16 is converted to F32).")]
    async fn gguf_load_tensor(
        &self,
        Parameters(args): Parameters<GgufLoadTensorArgs>,
    ) -> Result<CallToolResult, McpError> {
        let path = std::path::Path::new(&args.path);
        let file = match std::fs::File::open(path) {
            Ok(f) => f,
            Err(e) => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Failed to open '{}': {}",
                    args.path, e
                ))]))
            }
        };

        let reader = std::io::BufReader::new(file);
        let mut gguf = match GgufFile::parse(reader) {
            Ok(g) => g,
            Err(e) => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Failed to parse GGUF: {}",
                    e
                ))]))
            }
        };

        let tensor = match gguf.load_tensor(&args.tensor_name) {
            Ok(t) => t,
            Err(e) => {
                return Ok(CallToolResult::error(vec![Content::text(format!(
                    "Failed to load tensor '{}': {}",
                    args.tensor_name, e
                ))]))
            }
        };

        let store_name = args.store_as.unwrap_or(args.tensor_name.clone());
        let info = format!(
            "Loaded '{}' from GGUF -> '{}': shape={:?}, {} elements",
            args.tensor_name,
            store_name,
            tensor.shape,
            tensor.data.len()
        );
        self.tensors.lock().await.insert(store_name, tensor);

        Ok(CallToolResult::success(vec![Content::text(info)]))
    }
}
