import { describe, it, expect } from "vitest";
import { parseResult } from "../../src/lib/result-parser";

describe("parseResult", () => {
  describe("tensor detection", () => {
    it("detects tensor_create output", () => {
      const output = JSON.stringify({
        op: "tensor_create",
        name: "a",
        shape: [2, 2],
        data: [1, 2, 3, 4],
        num_elements: 4,
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("tensor");
    });

    it("detects tensor_inspect output", () => {
      const output = JSON.stringify({
        op: "tensor_inspect",
        name: "a",
        shape: [2, 3],
        strides: [3, 1],
        data: [1, 2, 3, 4, 5, 6],
        num_elements: 6,
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("tensor");
    });

    it("detects tensor_list output", () => {
      const output = JSON.stringify({
        op: "tensor_list",
        count: 2,
        tensors: [
          { name: "a", shape: [2, 2], num_elements: 4 },
          { name: "b", shape: [3, 1], num_elements: 3 },
        ],
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("tensor_list");
    });

    it("detects tensor_get_2d output", () => {
      const output = JSON.stringify({
        op: "tensor_get_2d",
        name: "a",
        indices: [1, 0],
        value: 3.0,
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("tensor_scalar");
    });
  });

  describe("attention detection", () => {
    it("detects attention_forward output", () => {
      const output = JSON.stringify({
        output: { data: [1, 2, 3, 4], shape: [2, 2] },
        attention_weights: { data: [0.5, 0.5, 0.3, 0.7], shape: [2, 2] },
        Q_grad: [0, 0, 0, 0],
        K_grad: [0, 0, 0, 0],
        V_grad: [1, 1, 1, 1],
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("attention");
    });
  });

  describe("mlp detection", () => {
    it("detects mlp_forward output", () => {
      const output = JSON.stringify({
        output: { data: [0.5], shape: [1, 1] },
        input_grad: [0.1, 0.2],
        layers: [
          { layer: 0, w: { shape: [2, 3], data: [], grad: [] }, b: { shape: [1, 3], data: [], grad: [] } },
        ],
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("mlp");
    });
  });

  describe("neuron detection", () => {
    it("detects autograd_neuron output", () => {
      const output = JSON.stringify({
        output: 0.7064,
        output_grad: 1.0,
        bias: { value: 6.88, grad: 0.5 },
        inputs: [{ value: 2, grad: -1.5 }],
        weights: [{ value: -3, grad: 1.0 }],
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("neuron");
    });
  });

  describe("autograd detection", () => {
    it("detects autograd_expr output", () => {
      const output = JSON.stringify({
        values: [
          { name: "a", data: 2, grad: 3 },
          { name: "b", data: 3, grad: 2 },
        ],
      });
      const result = parseResult(output, false);
      expect(result.type).toBe("autograd");
    });
  });

  describe("primitive types", () => {
    it("detects numbers", () => {
      expect(parseResult("42", false).type).toBe("number");
      expect(parseResult("3.14", false).type).toBe("number");
      expect(parseResult("-1", false).type).toBe("number");
    });

    it("detects strings", () => {
      expect(parseResult("hello world", false).type).toBe("string");
    });

    it("detects arrays", () => {
      expect(parseResult("[1,2,3]", false).type).toBe("array");
    });

    it("detects generic objects", () => {
      expect(parseResult('{"key": "value"}', false).type).toBe("object");
    });

    it("detects empty output", () => {
      expect(parseResult("", false).type).toBe("empty");
      expect(parseResult("  ", false).type).toBe("empty");
    });
  });

  describe("error handling", () => {
    it("returns error type when isError is true", () => {
      expect(parseResult("something went wrong", true).type).toBe("error");
    });

    it("returns error even for valid JSON when isError is true", () => {
      const output = JSON.stringify({ shape: [2, 2], data: [1, 2, 3, 4] });
      expect(parseResult(output, true).type).toBe("error");
    });
  });

  describe("edge cases", () => {
    it("handles null JSON", () => {
      expect(parseResult("null", false).type).toBe("object");
    });

    it("handles empty object", () => {
      expect(parseResult("{}", false).type).toBe("object");
    });

    it("handles malformed JSON gracefully", () => {
      expect(parseResult("{invalid json", false).type).toBe("string");
    });
  });
});
