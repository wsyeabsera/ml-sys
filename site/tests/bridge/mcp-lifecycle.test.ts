import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { type ChildProcess, spawn } from "node:child_process";
import { io, type Socket } from "socket.io-client";

const BRIDGE_PORT = 3099; // Use a different port to avoid conflicts with running bridge
const BRIDGE_URL = `http://localhost:${BRIDGE_PORT}`;
const MCP_BINARY = new URL("../../../rs-tensor/target/debug/mcp", import.meta.url).pathname;
const MCP_CWD = new URL("../../../rs-tensor", import.meta.url).pathname;

let bridgeProcess: ChildProcess;
let socket: Socket;

function startBridge(): Promise<void> {
  return new Promise((resolve, reject) => {
    bridgeProcess = spawn("npx", ["tsx", "server.ts"], {
      cwd: new URL("../../bridge", import.meta.url).pathname,
      env: {
        ...process.env,
        PORT: String(BRIDGE_PORT),
        MCP_BINARY,
        MCP_CWD,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => reject(new Error("Bridge startup timeout")), 15000);

    // Bridge logs to stdout via console.log
    bridgeProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      if (msg.includes("listening on port")) {
        clearTimeout(timeout);
        setTimeout(resolve, 500);
      }
    });

    bridgeProcess.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString();
      // MCP server logs to stderr
      if (msg.includes("listening on port")) {
        clearTimeout(timeout);
        setTimeout(resolve, 500);
      }
    });

    bridgeProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function connectSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    socket = io(BRIDGE_URL, {
      reconnection: false,
      timeout: 10000,
    });

    const timeout = setTimeout(() => reject(new Error("Socket connection timeout")), 10000);

    socket.on("ready", () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function callTool(tool: string, args: Record<string, unknown>): Promise<{
  ok: boolean;
  result?: { content: { type: string; text: string }[] };
  isToolError?: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    socket.emit("mcp_call", { tool, args }, (response: unknown) => {
      resolve(response as never);
    });
  });
}

describe("bridge server", () => {
  beforeAll(async () => {
    await startBridge();
    await connectSocket();
  }, 20000);

  afterAll(() => {
    socket?.disconnect();
    bridgeProcess?.kill();
  });

  describe("lifecycle", () => {
    it("connects and emits ready", () => {
      expect(socket.connected).toBe(true);
    });
  });

  describe("tool calls", () => {
    it("creates a tensor", async () => {
      const result = await callTool("tensor_create", {
        name: "test_a",
        data: [1, 2, 3, 4],
        shape: [2, 2],
      });
      expect(result.ok).toBe(true);
      expect(result.result?.content[0].text).toContain('"op": "tensor_create"');
      expect(result.result?.content[0].text).toContain('"name": "test_a"');
    });

    it("inspects a tensor", async () => {
      const result = await callTool("tensor_inspect", { name: "test_a" });
      expect(result.ok).toBe(true);
      const json = JSON.parse(result.result!.content[0].text);
      expect(json.shape).toEqual([2, 2]);
      expect(json.data).toEqual([1, 2, 3, 4]);
    });

    it("lists tensors", async () => {
      const result = await callTool("tensor_list", {});
      expect(result.ok).toBe(true);
      const json = JSON.parse(result.result!.content[0].text);
      expect(json.count).toBeGreaterThanOrEqual(1);
    });

    it("does matmul", async () => {
      await callTool("tensor_create", {
        name: "mat_a",
        data: [1, 2, 3, 4],
        shape: [2, 2],
      });
      await callTool("tensor_create", {
        name: "mat_b",
        data: [5, 6, 7, 8],
        shape: [2, 2],
      });
      const result = await callTool("tensor_matmul", {
        a: "mat_a",
        b: "mat_b",
        result_name: "mat_c",
      });
      expect(result.ok).toBe(true);
      const json = JSON.parse(result.result!.content[0].text);
      expect(json.data).toEqual([19, 22, 43, 50]);
    });

    it("runs autograd_neuron", async () => {
      const result = await callTool("autograd_neuron", {
        inputs: [2, 0],
        weights: [-3, 1],
        bias: 6.88,
      });
      expect(result.ok).toBe(true);
      const json = JSON.parse(result.result!.content[0].text);
      expect(json.output).toBeCloseTo(0.7064, 3);
      expect(json.output_grad).toBe(1);
    });

    it("runs attention_forward", async () => {
      const result = await callTool("attention_forward", {
        seq_len: 2,
        d_k: 2,
        q_data: [1, 0, 0, 1],
        k_data: [1, 0, 0, 1],
        v_data: [1, 2, 3, 4],
      });
      expect(result.ok).toBe(true);
      const json = JSON.parse(result.result!.content[0].text);
      expect(json.output.shape).toEqual([2, 2]);
      expect(json.attention_weights.shape).toEqual([2, 2]);
    });
  });

  describe("error handling", () => {
    it("returns error for missing tensor", async () => {
      const result = await callTool("tensor_inspect", { name: "nonexistent" });
      expect(result.ok).toBe(true); // bridge succeeded
      expect(result.isToolError).toBe(true); // but tool reported error
    });

    it("returns error for shape mismatch", async () => {
      const result = await callTool("tensor_create", {
        name: "bad",
        data: [1, 2, 3],
        shape: [5, 5],
      });
      expect(result.ok).toBe(true);
      expect(result.isToolError).toBe(true);
    });

    it("handles invalid tool name", async () => {
      const result = await callTool("nonexistent_tool", {});
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("concurrent calls", () => {
    it("handles 5 rapid calls without mixing responses", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        callTool("tensor_create", {
          name: `concurrent_${i}`,
          data: [i, i + 1, i + 2, i + 3],
          shape: [2, 2],
        })
      );
      const results = await Promise.all(promises);
      results.forEach((result, i) => {
        expect(result.ok).toBe(true);
        const json = JSON.parse(result.result!.content[0].text);
        expect(json.name).toBe(`concurrent_${i}`);
        expect(json.data[0]).toBe(i);
      });
    });
  });

  describe("list_tools", () => {
    it("returns available tools", async () => {
      const result = await new Promise<{ ok: boolean; tools?: string[] }>((resolve) => {
        socket.emit("list_tools", (response: unknown) => {
          resolve(response as never);
        });
      });
      expect(result.ok).toBe(true);
      expect(result.tools).toContain("tensor_create");
      expect(result.tools).toContain("autograd_neuron");
      expect(result.tools).toContain("attention_forward");
      expect(result.tools!.length).toBeGreaterThan(10);
    });
  });
});
