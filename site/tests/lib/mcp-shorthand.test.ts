import { describe, it, expect } from "vitest";
import { isMcpCall, parseMcpCall } from "../../src/lib/mcp-shorthand";

describe("isMcpCall", () => {
  it("detects known tool names with parens", () => {
    expect(isMcpCall('tensor_create("a", [1,2], [2])')).toBe(true);
    expect(isMcpCall('tensor_inspect("a")')).toBe(true);
    expect(isMcpCall("tensor_list()")).toBe(true);
    expect(isMcpCall('autograd_expr([["a",2]], [], "a")')).toBe(true);
    expect(isMcpCall("autograd_neuron([1,2], [3,4], 0.5)")).toBe(true);
    expect(isMcpCall("attention_forward(2, 2, [1,0,0,1], [1,0,0,1], [1,2,3,4])")).toBe(true);
  });

  it("rejects JS expressions", () => {
    expect(isMcpCall("2 + 2")).toBe(false);
    expect(isMcpCall("const x = 10")).toBe(false);
    expect(isMcpCall("[1,2,3].map(x => x*2)")).toBe(false);
    expect(isMcpCall("Math.random()")).toBe(false);
  });

  it("rejects tool name without parens", () => {
    expect(isMcpCall("tensor_create")).toBe(false);
    expect(isMcpCall("tensor_inspect")).toBe(false);
  });

  it("rejects assignments that start with tool names", () => {
    expect(isMcpCall("const tensor_create = 5")).toBe(false);
    expect(isMcpCall("let tensor_inspect = true")).toBe(false);
  });

  it("accepts dynamic tool names", () => {
    const dynamic = new Set(["custom_tool"]);
    expect(isMcpCall("custom_tool(123)", dynamic)).toBe(true);
    expect(isMcpCall("unknown_tool(123)", dynamic)).toBe(false);
  });
});

describe("parseMcpCall", () => {
  it("parses tensor_create with positional args", () => {
    const result = parseMcpCall('tensor_create("a", [1,2,3,4], [2,2])');
    expect(result).toEqual({
      tool: "tensor_create",
      args: { name: "a", data: [1, 2, 3, 4], shape: [2, 2] },
    });
  });

  it("parses tensor_inspect", () => {
    const result = parseMcpCall('tensor_inspect("myTensor")');
    expect(result).toEqual({
      tool: "tensor_inspect",
      args: { name: "myTensor" },
    });
  });

  it("parses tensor_list with no args", () => {
    const result = parseMcpCall("tensor_list()");
    expect(result).toEqual({
      tool: "tensor_list",
      args: {},
    });
  });

  it("parses tensor_matmul", () => {
    const result = parseMcpCall('tensor_matmul("a", "b", "c")');
    expect(result).toEqual({
      tool: "tensor_matmul",
      args: { a: "a", b: "b", result_name: "c" },
    });
  });

  it("parses tensor_transpose", () => {
    const result = parseMcpCall('tensor_transpose("m", 0, 1, "m_T")');
    expect(result).toEqual({
      tool: "tensor_transpose",
      args: { name: "m", dim0: 0, dim1: 1, result_name: "m_T" },
    });
  });

  it("parses autograd_neuron", () => {
    const result = parseMcpCall("autograd_neuron([2, 0], [-3, 1], 6.88)");
    expect(result).toEqual({
      tool: "autograd_neuron",
      args: { inputs: [2, 0], weights: [-3, 1], bias: 6.88 },
    });
  });

  it("throws on unknown tool", () => {
    expect(() => parseMcpCall("unknown_tool(123)")).toThrow("Unknown tool");
  });

  it("throws on malformed input", () => {
    expect(() => parseMcpCall("not a tool call")).toThrow();
  });

  it("handles nested arrays", () => {
    const result = parseMcpCall(
      'autograd_expr([["a", 2], ["b", 3]], [["c", "mul", "a", "b"]], "c")'
    );
    expect(result.tool).toBe("autograd_expr");
    expect(result.args.values).toEqual([["a", 2], ["b", 3]]);
    expect(result.args.ops).toEqual([["c", "mul", "a", "b"]]);
    expect(result.args.backward_from).toBe("c");
  });
});
