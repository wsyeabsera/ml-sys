/**
 * Eval engine — the core logic used by the Web Worker.
 * Extracted here so it can be tested directly without worker message passing.
 */

export function createEvalEngine() {
  const codeHistory: string[] = [];

  function evalCode(code: string): { value: unknown } | { error: string } {
    try {
      const isDeclaration = /^\s*(const|let|var|function|class)\s/.test(code);

      if (isDeclaration) {
        codeHistory.push(code);
        const allCode = codeHistory.join(";\n");
        const fn = new Function(allCode);
        fn();
        return { value: undefined };
      }

      const preamble = codeHistory.join(";\n");
      const body = preamble
        ? `${preamble};\nreturn (${code})`
        : `return (${code})`;

      try {
        const fn = new Function(body);
        return { value: fn() };
      } catch {
        const fallback = preamble ? `${preamble};\n${code}` : code;
        const fn = new Function(fallback);
        return { value: fn() };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  function reset() {
    codeHistory.length = 0;
  }

  return { evalCode, reset };
}
