import { useState, useCallback, useRef } from "react";
import { useBridge } from "./useBridge";
import { useEvalWorker } from "./useEvalWorker";
import { isMcpCall, parseMcpCall } from "../lib/mcp-shorthand";

export interface HistoryEntry {
  id: number;
  input: string;
  output: string;
  isError: boolean;
}

export function useRepl() {
  const { status, callTool } = useBridge();
  const { evaluate } = useEvalWorker();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const idRef = useRef(0);

  const execute = useCallback(
    async (input: string) => {
      const code = input.trim();
      if (!code) return;
      if (code === "clear") {
        setHistory([]);
        return;
      }

      setRunning(true);
      setCommandHistory((prev) => [...prev, code]);
      setHistoryIndex(-1);

      let output: string;
      let isError = false;

      if (isMcpCall(code)) {
        // Route to MCP bridge
        if (status !== "connected") {
          output = "Error: Bridge not connected. Start the bridge server with: cd site/bridge && npx tsx server.ts";
          isError = true;
        } else {
          try {
            const { tool, args } = parseMcpCall(code);
            const result = await callTool(tool, args);
            if (result.ok && result.result) {
              output = result.result.content.map((c) => c.text).join("\n");
            } else {
              output = result.error ?? "Unknown error";
              isError = true;
            }
          } catch (err) {
            output = `Parse error: ${err instanceof Error ? err.message : err}`;
            isError = true;
          }
        }
      } else {
        // Route to Web Worker JS eval
        const result = await evaluate(code);
        if (result.error) {
          output = result.error;
          isError = true;
        } else if (result.value === undefined) {
          output = ""; // No output for void results (const x = 5, etc.)
        } else {
          output =
            typeof result.value === "string"
              ? result.value
              : JSON.stringify(result.value, null, 2);
        }
      }

      setHistory((prev) => [
        ...prev,
        { id: idRef.current++, input: code, output, isError },
      ]);
      setRunning(false);
    },
    [status, callTool, evaluate],
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down"): string | null => {
      if (commandHistory.length === 0) return null;

      let newIndex: number;
      if (direction === "up") {
        newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
      } else {
        newIndex =
          historyIndex === -1
            ? -1
            : historyIndex >= commandHistory.length - 1
              ? -1
              : historyIndex + 1;
      }

      setHistoryIndex(newIndex);
      return newIndex === -1 ? "" : commandHistory[newIndex];
    },
    [commandHistory, historyIndex],
  );

  return {
    history,
    running,
    status,
    execute,
    navigateHistory,
  };
}
