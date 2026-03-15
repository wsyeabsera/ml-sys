import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TryThis from "./TryThis";

interface PredictExerciseProps {
  question: string;
  hint?: string;
  answer: string;
  explanation?: string;
  commands?: string[];
  commandLabel?: string;
}

/**
 * A "predict, then verify" exercise.
 * Shows a question, lets the user think, then reveals the answer with an optional REPL link.
 */
export default function PredictExercise({
  question,
  hint,
  answer,
  explanation,
  commands,
  commandLabel,
}: PredictExerciseProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="border border-[var(--color-surface-overlay)] rounded-xl overflow-hidden">
      {/* Question */}
      <div className="px-5 py-4 bg-[var(--color-surface-raised)]">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">🤔</span>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {question}
            </p>
            {hint && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                Hint: {hint}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reveal button / Answer */}
      {!revealed ? (
        <div className="px-5 py-3 border-t border-[var(--color-surface-overlay)]">
          <button
            onClick={() => setRevealed(true)}
            className="text-sm text-[var(--color-accent-blue)] hover:underline"
          >
            I've thought about it — show me the answer
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-[var(--color-surface-overlay)]"
          >
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">✅</span>
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-[var(--color-accent-emerald)]">
                    {answer}
                  </p>
                  {explanation && (
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {explanation}
                    </p>
                  )}
                </div>
              </div>
              {commands && (
                <TryThis
                  commands={commands}
                  label={commandLabel ?? "Verify in the REPL"}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
