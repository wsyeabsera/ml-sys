/** Parsed JSON success payloads from rs-tensor MCP tools (subset of fields). */

export interface TensorOpResult {
  op: string;
  name?: string;
  result_name?: string;
  shape?: number[];
  data?: number[];
  strides?: number[];
  num_elements?: number;
  value?: number;
  tensors?: string[];
}

export interface CreateDatasetResult {
  op: "create_dataset";
  type: string;
  n_samples: number;
  input_name: string;
  input_shape: number[];
  target_name: string;
  target_shape: number[];
}

export interface InitMlpResult {
  op: "init_mlp";
  name: string;
  architecture: number[];
  layers: number;
  total_params: number;
  weight_names: string[];
}

export interface TrainMlpResult {
  op: "train_mlp";
  mlp: string;
  epochs: number;
  initial_loss: number;
  final_loss: number;
  loss_history_sampled: number[];
  lr: number;
}

export interface LayerDef {
  weights: number[];
  bias: number[];
  in_features: number;
  out_features: number;
}

// --- Tool argument types (mirror server schemas) ---

export interface TensorCreateArgs {
  name: string;
  data: number[];
  shape: number[];
}

export interface TensorBinaryOpArgs {
  a: string;
  b: string;
  result_name: string;
}

export interface TensorMatmulArgs {
  a: string;
  b: string;
  result_name: string;
}

export interface TensorGet2dArgs {
  name: string;
  row: number;
  col: number;
}

export interface TensorGetArgs {
  name: string;
  indices: number[];
}

export interface TensorReshapeArgs {
  name: string;
  new_shape: number[];
  result_name: string;
}

export interface TensorTransposeArgs {
  name: string;
  dim0?: number;
  dim1?: number;
  result_name: string;
}

export interface TensorInspectArgs {
  name: string;
}

export interface ReadFileArgs {
  path: string;
}

export interface CargoExecArgs {
  command: "build" | "run" | string;
}

export interface CreateDatasetArgs {
  type: "and" | "or" | "xor" | "circle" | "spiral" | string;
  n_samples?: number;
}

export interface InitMlpArgs {
  architecture: number[];
  name?: string;
}

export interface MseLossArgs {
  predicted: string;
  target: string;
}

export interface TrainMlpArgs {
  mlp: string;
  inputs: string;
  targets: string;
  lr: number;
  epochs: number;
}

export interface EvaluateMlpArgs {
  mlp: string;
  inputs: string;
  targets?: string;
}

export interface MlpPredictArgs {
  mlp: string;
  input: number[];
}

export interface AutogradNeuronArgs {
  inputs: number[];
  weights: number[];
  bias: number;
}

export interface AutogradNeuronTensorArgs {
  input_data: number[];
  input_shape: number[];
  weight_data: number[];
  weight_shape: number[];
  bias_data: number[];
  bias_shape: number[];
}

export interface AutogradExprArgs {
  values: [string, number][];
  ops: string[][];
  backward_from: string;
}

export interface MlpForwardArgs {
  input_data: number[];
  input_shape: number[];
  layers: LayerDef[];
}

export interface AttentionForwardArgs {
  q_data: number[];
  k_data: number[];
  v_data: number[];
  seq_len: number;
  d_k: number;
  d_v?: number;
}

export interface GgufInspectArgs {
  path: string;
}

export interface GgufLoadTensorArgs {
  path: string;
  tensor_name: string;
  store_as?: string;
}

export interface LlamaLoadArgs {
  path: string;
}

export interface LlamaGenerateArgs {
  prompt?: string;
  token_ids?: number[];
  max_tokens?: number;
  temperature?: number;
}

export type JsonObject = Record<string, unknown>;
