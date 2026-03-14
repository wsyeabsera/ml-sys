import { useEffect, useRef, useCallback } from "react";

interface PendingEval {
  resolve: (result: { value?: unknown; error?: string }) => void;
}

export function useEvalWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingEval>>(new Map());
  const idCounter = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/eval-worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e: MessageEvent) => {
      const { type, id, value, error } = e.data;
      const pending = pendingRef.current.get(id);
      if (!pending) return;

      pendingRef.current.delete(id);
      if (type === "error") {
        pending.resolve({ error });
      } else {
        pending.resolve({ value });
      }
    };

    worker.onerror = (e) => {
      console.error("[eval-worker] Error:", e);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const evaluate = useCallback(
    (code: string): Promise<{ value?: unknown; error?: string }> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve({ error: "Worker not initialized" });
          return;
        }

        const id = String(idCounter.current++);
        pendingRef.current.set(id, { resolve });
        worker.postMessage({ type: "eval", id, code });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            resolve({ error: "Evaluation timed out (10s)" });
          }
        }, 10_000);
      });
    },
    [],
  );

  return { evaluate };
}
