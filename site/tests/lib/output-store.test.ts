import { describe, it, expect } from "vitest";
import { detectHasRichViz } from "../../src/lib/output-store";

describe("detectHasRichViz", () => {
  it("returns true for tensor type", () => {
    expect(detectHasRichViz("{}", "tensor")).toBe(true);
  });

  it("returns true for autograd type", () => {
    expect(detectHasRichViz("{}", "autograd")).toBe(true);
  });

  it("returns true for neuron type", () => {
    expect(detectHasRichViz("{}", "neuron")).toBe(true);
  });

  it("returns true for attention type", () => {
    expect(detectHasRichViz("{}", "attention")).toBe(true);
  });

  it("returns true for mlp type", () => {
    expect(detectHasRichViz("{}", "mlp")).toBe(true);
  });

  it("returns false for number type", () => {
    expect(detectHasRichViz("42", "number")).toBe(false);
  });

  it("returns false for string type", () => {
    expect(detectHasRichViz("hello", "string")).toBe(false);
  });

  it("returns false for error type", () => {
    expect(detectHasRichViz("error", "error")).toBe(false);
  });

  it("detects attention by JSON structure", () => {
    const output = JSON.stringify({ attention_weights: { data: [] } });
    expect(detectHasRichViz(output, "object")).toBe(true);
  });

  it("detects MLP by JSON structure", () => {
    const output = JSON.stringify({ layers: [{ w: {} }] });
    expect(detectHasRichViz(output, "object")).toBe(true);
  });

  it("detects neuron by JSON structure", () => {
    const output = JSON.stringify({ output: 0.5, weights: [], inputs: [] });
    expect(detectHasRichViz(output, "object")).toBe(true);
  });

  it("detects autograd by JSON structure", () => {
    const output = JSON.stringify({ values: [{ grad: 1 }] });
    expect(detectHasRichViz(output, "object")).toBe(true);
  });

  it("returns false for plain objects", () => {
    expect(detectHasRichViz('{"key": "value"}', "object")).toBe(false);
  });
});
