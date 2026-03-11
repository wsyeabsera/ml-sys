pub mod autograd_ops;
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
use crate::autograd::Value;
use crate::tensor::Tensor;
use autograd_ops::{AutogradExprArgs, AutogradNeuronArgs};
use project::{CargoExecArgs, ReadFileArgs};
use tensor_ops::{
    TensorAddArgs, TensorCreateArgs, TensorGet2dArgs, TensorGetArgs, TensorInspectArgs,
    TensorMulArgs, TensorReshapeArgs, TensorTransposeArgs,
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
}
