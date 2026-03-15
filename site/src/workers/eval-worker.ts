/**
 * Web Worker for evaluating JavaScript expressions.
 * Maintains a persistent scope across executions (like a Jupyter kernel).
 */

import { createEvalEngine } from "../lib/eval-engine";

const engine = createEvalEngine();

self.onmessage = (e: MessageEvent) => {
  const { type, id, code } = e.data;

  if (type === "eval") {
    const result = engine.evalCode(code);
    if ("error" in result) {
      self.postMessage({ type: "error", id, error: result.error });
    } else {
      self.postMessage({ type: "result", id, value: serialize(result.value) });
    }
  }

  if (type === "reset") {
    engine.reset();
    self.postMessage({ type: "result", id, value: "Scope cleared" });
  }
};

function serialize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "symbol") return value.toString();
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}
