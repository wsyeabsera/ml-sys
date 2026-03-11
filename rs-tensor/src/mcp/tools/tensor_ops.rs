use rmcp::schemars;

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct TensorCreateArgs {
    /// Name to store the tensor under
    pub name: String,
    /// Flat array of f32 values
    pub data: Vec<f32>,
    /// Shape dimensions, e.g. [2, 2] for a 2x2 matrix
    pub shape: Vec<usize>,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct TensorAddArgs {
    /// Name of the first tensor
    pub a: String,
    /// Name of the second tensor
    pub b: String,
    /// Name for the result tensor
    pub result_name: String,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct TensorInspectArgs {
    /// Name of the tensor to inspect
    pub name: String,
}
