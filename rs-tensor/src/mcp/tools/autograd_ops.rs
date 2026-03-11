use rmcp::schemars;

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct AutogradNeuronArgs {
    /// Input values, e.g. [2.0, 0.0]
    pub inputs: Vec<f32>,
    /// Weights (one per input), e.g. [-3.0, 1.0]
    pub weights: Vec<f32>,
    /// Bias value
    pub bias: f32,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct AutogradExprArgs {
    /// Named scalar values, e.g. [["a", 2.0], ["b", -3.0]]
    pub values: Vec<(String, f32)>,
    /// Operations to execute in order. Each is [result_name, op, arg1, arg2?].
    /// Supported ops: "add", "mul", "tanh".
    /// Examples: ["c", "mul", "a", "b"] or ["d", "tanh", "c"]
    pub ops: Vec<Vec<String>>,
    /// Name of the value to call backward() on
    pub backward_from: String,
}
