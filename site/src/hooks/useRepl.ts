import { useState, useCallback, useRef, useEffect } from "react";
import { useBridge } from "./useBridge";
import { useEvalWorker } from "./useEvalWorker";
import { isMcpCall, parseMcpCall, TOOL_INFO } from "../lib/mcp-shorthand";
import {
  loadSession,
  saveSession,
  clearSession,
  generateOutputId,
  storeOutput,
  type StoredOutput,
} from "../lib/db";
import { loadSettings } from "../pages/Settings";
import { parseResult } from "../lib/result-parser";
import { detectHasRichViz } from "../lib/output-store";

export interface HistoryEntry {
  id: number;
  input: string;
  output: string;
  outputId: string | null; // references IndexedDB stored output
  isError: boolean;
  hasRichViz: boolean;
  restored?: boolean;
  durationMs?: number;
}

export function useRepl() {
  const { status, callTool, toolNames, resetMcp: bridgeResetMcp } = useBridge();
  const { evaluate } = useEvalWorker();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const idRef = useRef(0);

  // Load saved session on mount
  useEffect(() => {
    loadSession().then((commands) => {
      if (commands.length > 0) {
        setCommandHistory(commands);
        setHistory(
          commands.map((cmd) => ({
            id: idRef.current++,
            input: cmd,
            output: "",
            outputId: null,
            isError: false,
            hasRichViz: false,
            restored: true,
          })),
        );
      }
    });
  }, []);

  // Persist commands whenever they change
  useEffect(() => {
    if (commandHistory.length > 0) {
      const { maxHistory } = loadSettings();
      saveSession(commandHistory, maxHistory);
    }
  }, [commandHistory]);

  const execute = useCallback(
    async (input: string) => {
      const code = input.trim();
      if (!code) return;

      if (code === "clear") {
        setHistory([]);
        setCommandHistory([]);
        clearSession();
        return;
      }

      // Handle help command
      if (code === "help" || code.startsWith("help ")) {
        const arg = code.slice(5).trim();
        let helpOutput: string;

        if (!arg) {
          // List all tools grouped by category
          const byCategory: Record<string, string[]> = {};
          for (const [name, info] of Object.entries(TOOL_INFO)) {
            (byCategory[info.category] ??= []).push(name);
          }
          const lines = Object.entries(byCategory).map(
            ([cat, tools]) => `${cat}:\n  ${tools.join(", ")}`,
          );
          helpOutput = lines.join("\n\n") + "\n\nType help <tool_name> for details.";
        } else if (TOOL_INFO[arg]) {
          const info = TOOL_INFO[arg];
          helpOutput = `${arg}\n  ${info.description}\n  Category: ${info.category}${info.example ? `\n  Example: ${info.example}` : ""}`;
        } else {
          helpOutput = `Unknown tool: "${arg}". Type help to see all tools.`;
        }

        setCommandHistory((prev) => [...prev, code]);
        setHistory((prev) => [
          ...prev,
          {
            id: idRef.current++,
            input: code,
            output: helpOutput,
            outputId: null,
            isError: false,
            hasRichViz: false,
          },
        ]);
        return;
      }

      setRunning(true);
      setCommandHistory((prev) => [...prev, code]);
      setHistoryIndex(-1);

      const startTime = performance.now();
      let output: string;
      let isError = false;

      if (isMcpCall(code, toolNames)) {
        if (status !== "connected") {
          output =
            "Error: Bridge not connected. Start the bridge server with: cd site/bridge && npx tsx server.ts";
          isError = true;
        } else {
          try {
            const { tool, args } = parseMcpCall(code);
            const result = await callTool(tool, args);
            if (result.ok && result.result) {
              output = result.result.content.map((c) => c.text).join("\n");
              if (result.isToolError) {
                isError = true;
              }
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
        const result = await evaluate(code);
        if (result.error) {
          output = result.error;
          isError = true;
        } else if (result.value === undefined) {
          output = "";
        } else {
          output =
            typeof result.value === "string"
              ? result.value
              : JSON.stringify(result.value, null, 2);
        }
      }

      // Parse result type and store output
      const parsed = parseResult(output, isError);
      const hasRichViz = !isError && detectHasRichViz(output, parsed.type);
      const outputId = generateOutputId();

      let parsedData: unknown = null;
      try {
        parsedData = JSON.parse(output);
      } catch { /* not JSON */ }

      const stored: StoredOutput = {
        id: outputId,
        input: code,
        output,
        parsed: parsedData,
        type: parsed.type,
        timestamp: Date.now(),
        isError,
        hasRichViz,
      };
      storeOutput(stored);

      const durationMs = Math.round(performance.now() - startTime);

      setHistory((prev) => [
        ...prev,
        {
          id: idRef.current++,
          input: code,
          output,
          outputId,
          isError,
          hasRichViz,
          durationMs,
        },
      ]);
      setRunning(false);
    },
    [status, callTool, evaluate, toolNames],
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

  const resetMcp = useCallback(async () => {
    await bridgeResetMcp();
  }, [bridgeResetMcp]);

  return {
    history,
    running,
    status,
    execute,
    navigateHistory,
    resetMcp,
    commandHistory,
  };
}
