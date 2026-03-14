import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { loadSettings } from "../pages/Settings";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface McpResult {
  ok: boolean;
  result?: { content: { type: string; text: string }[] };
  isToolError?: boolean;
  error?: string;
}

export function useBridge() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [toolNames, setToolNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { bridgeUrl } = loadSettings();
    const socket = io(bridgeUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connecting");
    });

    socket.on("ready", () => {
      setStatus("connected");
      // Fetch available tool names for auto-detection
      socket.emit(
        "list_tools",
        (response: { ok: boolean; tools?: string[]; error?: string }) => {
          if (response.ok && response.tools) {
            setToolNames(new Set(response.tools));
          }
        },
      );
    });

    socket.on("mcp_error", () => {
      setStatus("disconnected");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("reconnect_attempt", () => {
      setStatus("connecting");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const callTool = useCallback(
    (tool: string, args: Record<string, unknown>): Promise<McpResult> => {
      return new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve({ ok: false, error: "Bridge not connected" });
          return;
        }
        socket.emit("mcp_call", { tool, args }, (response: McpResult) => {
          resolve(response);
        });
      });
    },
    [],
  );

  const resetMcp = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve();
        return;
      }
      socket.emit("reset", () => {
        resolve();
      });
    });
  }, []);

  return { status, callTool, toolNames, resetMcp };
}
