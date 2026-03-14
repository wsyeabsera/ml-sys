/**
 * Web Worker for evaluating JavaScript expressions.
 * Maintains a persistent scope across executions (like a Jupyter kernel).
 *
 * Messages:
 *   { type: "eval", id: string, code: string }
 *   → { type: "result", id: string, value: unknown }
 *   → { type: "error", id: string, error: string }
 */

// Persistent scope — variables defined in one eval are visible in the next.
// We use Function constructor with a closure over this object.
const scope: Record<string, unknown> = {};

// Build an eval function that has access to the scope
function evalInScope(code: string): unknown {
  // Extract all scope keys as local variables, eval the code, then write back
  const keys = Object.keys(scope);
  const getters = keys.map((k) => `let ${k} = __scope["${k}"];`).join("\n");
  // After eval, write any new or changed variables back to scope
  // We use indirect eval to get the value of the last expression
  const wrapped = `
    ${getters}
    const __result = eval(${JSON.stringify(code)});
    // Capture any new variable assignments (const/let/var name = ...)
    ${keys.map((k) => `__scope["${k}"] = typeof ${k} !== "undefined" ? ${k} : __scope["${k}"];`).join("\n")}
    __result;
  `;

  const fn = new Function("__scope", wrapped);
  return fn(scope);
}

// Alternative simpler approach: use indirect eval with a with() statement
// Actually, let's use the simplest approach that works:
// accumulate code and re-eval everything, or use Function with scope injection.

// Simpler approach: maintain code history and eval in sequence
const codeHistory: string[] = [];

function evalCode(code: string): { value: unknown } | { error: string } {
  try {
    // For variable declarations, add to history so future evals can see them
    const isDeclaration = /^\s*(const|let|var|function|class)\s/.test(code);

    if (isDeclaration) {
      codeHistory.push(code);
      // Eval all history to build up scope, return last result
      const allCode = codeHistory.join(";\n");
      const fn = new Function(allCode);
      fn();
      return { value: undefined };
    }

    // For expressions, eval with all prior declarations as preamble
    const preamble = codeHistory.join(";\n");
    const body = preamble
      ? `${preamble};\nreturn (${code})`
      : `return (${code})`;

    try {
      const fn = new Function(body);
      return { value: fn() };
    } catch {
      // If wrapping in return() fails (e.g. statements), try without return
      const fallback = preamble ? `${preamble};\n${code}` : code;
      const fn = new Function(fallback);
      return { value: fn() };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, id, code } = e.data;

  if (type === "eval") {
    const result = evalCode(code);
    if ("error" in result) {
      self.postMessage({ type: "error", id, error: result.error });
    } else {
      self.postMessage({ type: "result", id, value: serialize(result.value) });
    }
  }

  if (type === "reset") {
    codeHistory.length = 0;
    self.postMessage({ type: "result", id, value: "Scope cleared" });
  }
};

/** Serialize a value for transfer back to the main thread. */
function serialize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "symbol") return value.toString();
  // For objects/arrays, try JSON roundtrip to strip non-transferable stuff
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}
