import { Server } from "socket.io";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MCP_BINARY = process.env.MCP_BINARY
  ?? new URL("../../rs-tensor/target/debug/mcp", import.meta.url).pathname;
const MCP_CWD = process.env.MCP_CWD
  ?? new URL("../../rs-tensor", import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 3001);

let mcpClient: Client | null = null;

async function spawnMcp(): Promise<Client> {
  console.log(`[bridge] Spawning MCP: ${MCP_BINARY}`);
  const transport = new StdioClientTransport({
    command: MCP_BINARY,
    cwd: MCP_CWD,
    stderr: "inherit",
  });

  const client = new Client({ name: "playground-bridge", version: "0.1.0" });
  await client.connect(transport);
  console.log("[bridge] MCP connected");
  return client;
}

async function ensureMcp(): Promise<Client> {
  if (!mcpClient) {
    mcpClient = await spawnMcp();
  }
  return mcpClient;
}

// --- Socket.io server ---

const io = new Server(PORT, {
  cors: { origin: "*" },
});

console.log(`[bridge] Socket.io listening on port ${PORT}`);

io.on("connection", async (socket) => {
  console.log(`[bridge] Client connected: ${socket.id}`);

  try {
    await ensureMcp();
    socket.emit("ready");
  } catch (err) {
    console.error("[bridge] Failed to spawn MCP:", err);
    socket.emit("mcp_error", { error: String(err) });
  }

  socket.on("list_tools", async (ack) => {
    try {
      const client = await ensureMcp();
      const result = await client.listTools();
      ack({ ok: true, tools: result.tools.map((t) => t.name) });
    } catch (err) {
      ack({ ok: false, error: String(err) });
    }
  });

  socket.on("mcp_call", async (data, ack) => {
    const { tool, args } = data;
    try {
      const client = await ensureMcp();
      const result = await client.callTool({ name: tool, arguments: args });
      ack({ ok: true, result });
    } catch (err) {
      console.error(`[bridge] Tool call failed (${tool}):`, err);
      ack({ ok: false, error: String(err) });
    }
  });

  socket.on("reset", async (ack) => {
    console.log("[bridge] Resetting MCP...");
    try {
      if (mcpClient) {
        await mcpClient.close();
      }
    } catch { /* ignore close errors */ }
    mcpClient = null;
    try {
      await ensureMcp();
      if (ack) ack({ ok: true });
      socket.emit("ready");
    } catch (err) {
      if (ack) ack({ ok: false, error: String(err) });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[bridge] Client disconnected: ${socket.id}`);
  });
});
