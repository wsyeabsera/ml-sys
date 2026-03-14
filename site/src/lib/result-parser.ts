/**
 * Detect the type of an MCP tool result or JS eval result for viz routing.
 */

export type ResultType =
  | "tensor"
  | "tensor_list"
  | "tensor_scalar"
  | "autograd"
  | "attention"
  | "mlp"
  | "neuron"
  | "number"
  | "array"
  | "object"
  | "string"
  | "error"
  | "empty";

export interface ParsedResult {
  type: ResultType;
  data: unknown;
  raw: string;
}

/**
 * Parse a result string or value into a typed result for rendering.
 */
export function parseResult(output: string, isError: boolean): ParsedResult {
  if (isError) {
    return { type: "error", data: output, raw: output };
  }

  if (!output || output.trim() === "") {
    return { type: "empty", data: null, raw: output };
  }

  // Try to parse as JSON first (MCP tool results are JSON)
  try {
    const parsed = JSON.parse(output);

    if (typeof parsed === "object" && parsed !== null && "op" in parsed) {
      const op = parsed.op as string;

      // Tensor operations with shape + data → tensor viz
      if (
        "shape" in parsed &&
        "data" in parsed &&
        Array.isArray(parsed.shape) &&
        Array.isArray(parsed.data)
      ) {
        return { type: "tensor", data: parsed, raw: output };
      }

      // Tensor get (scalar value)
      if (op === "tensor_get" || op === "tensor_get_2d") {
        return { type: "tensor_scalar", data: parsed, raw: output };
      }

      // Tensor list
      if (op === "tensor_list") {
        return { type: "tensor_list", data: parsed, raw: output };
      }
    }

    // Attention results: has attention_weights
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "attention_weights" in parsed &&
      "output" in parsed
    ) {
      return { type: "attention", data: parsed, raw: output };
    }

    // MLP results: has layers array with weight gradients
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "layers" in parsed &&
      Array.isArray(parsed.layers) &&
      parsed.layers.length > 0 &&
      "w" in parsed.layers[0]
    ) {
      return { type: "mlp", data: parsed, raw: output };
    }

    // Autograd neuron result: has "output" and "weights" and "inputs" and "bias"
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "output" in parsed &&
      "weights" in parsed &&
      "inputs" in parsed &&
      "bias" in parsed &&
      typeof parsed.output === "number"
    ) {
      return { type: "neuron", data: parsed, raw: output };
    }

    // Autograd results: has "values" array with name/data/grad
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "values" in parsed &&
      Array.isArray(parsed.values) &&
      parsed.values.length > 0 &&
      "grad" in parsed.values[0]
    ) {
      return { type: "autograd", data: parsed, raw: output };
    }

    // Autograd tensor layer result (autograd_neuron_tensor): has output + x/w/b
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "output" in parsed &&
      "x" in parsed &&
      "w" in parsed &&
      "b" in parsed
    ) {
      return { type: "autograd", data: parsed, raw: output };
    }

    // Plain number
    if (typeof parsed === "number") {
      return { type: "number", data: parsed, raw: output };
    }

    // Array
    if (Array.isArray(parsed)) {
      return { type: "array", data: parsed, raw: output };
    }

    // Generic object
    return { type: "object", data: parsed, raw: output };
  } catch {
    // Not JSON — plain text or JS eval result
  }

  // Number
  const num = Number(output);
  if (!isNaN(num) && output.trim() !== "") {
    return { type: "number", data: num, raw: output };
  }

  return { type: "string", data: output, raw: output };
}
