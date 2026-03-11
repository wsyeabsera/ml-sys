pub mod tools;

use std::sync::Arc;

use rmcp::{
    ErrorData as McpError, ServerHandler,
    handler::server::router::tool::ToolRouter,
    model::*,
    tool, tool_handler, tool_router,
};
use serde_json::json;
use tokio::sync::Mutex;

use crate::tensor::Tensor;
use rmcp::handler::server::wrapper::Parameters;
use tools::project::{CargoExecArgs, ReadFileArgs};
use tools::tensor_ops::{TensorAddArgs, TensorCreateArgs, TensorInspectArgs};

#[derive(Clone)]
pub struct TensorServer {
    tensors: Arc<Mutex<std::collections::HashMap<String, Tensor>>>,
    tool_router: ToolRouter<TensorServer>,
}

#[tool_router]
impl TensorServer {
    pub fn new() -> Self {
        Self {
            tensors: Arc::new(Mutex::new(std::collections::HashMap::new())),
            tool_router: Self::tool_router(),
        }
    }

    // ── Tensor tools ────────────────────────────────────────────

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

    #[tool(description = "Inspect a named tensor: shows shape and data.")]
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

    // ── Project tools ───────────────────────────────────────────

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
}

// ── ServerHandler ───────────────────────────────────────────────────

#[tool_handler]
impl ServerHandler for TensorServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::default(),
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation {
                name: "rs-tensor-mcp".into(),
                title: None,
                version: env!("CARGO_PKG_VERSION").into(),
                description: None,
                icons: None,
                website_url: None,
            },
            instructions: Some(
                "MCP server for the rs-tensor library. \
                 Create, inspect, and operate on tensors. \
                 Read project files and run cargo commands."
                    .to_string(),
            ),
        }
    }
}
