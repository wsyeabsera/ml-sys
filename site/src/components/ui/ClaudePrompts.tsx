import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Prompt {
  label: string;
  command: string;
  description: string;
}

const chapterPrompts: Record<number, Prompt[]> = {
  1: [
    { label: "Walk me through this chapter", command: "/walk-through-chapter 1", description: "Interactive guided tour of Chapter 1" },
    { label: "Quiz me on the basics", command: "/quiz-me chapter 1", description: "Test your understanding of the big picture" },
  ],
  2: [
    { label: "Walk me through tensors", command: "/walk-through-chapter 2", description: "Step through every example with live MCP tools" },
    { label: "Quiz me on tensors", command: "/quiz-me tensors", description: "Can you predict strides? Shapes? Let's find out" },
    { label: "Explain strides deeper", command: "/explain-concept strides", description: "Deep dive into how strides work" },
    { label: "Experiment with shapes", command: "/experiment reshape and transpose", description: "Explore what happens when you reshape and transpose" },
    { label: "Why is transpose zero-copy?", command: "/debug-my-understanding why does transpose not copy data", description: "Understand the stride-swapping trick" },
  ],
  3: [
    { label: "Walk me through autograd", command: "/walk-through-chapter 3", description: "Build a computation graph step by step" },
    { label: "Quiz me on gradients", command: "/quiz-me autograd", description: "Can you predict the gradients?" },
    { label: "Explain the chain rule", command: "/explain-concept chain rule in autograd", description: "Why the chain rule makes autograd possible" },
    { label: "Experiment with expressions", command: "/experiment custom autograd expressions", description: "Build your own computation graphs" },
    { label: "Run a neuron interactively", command: "/run-neuron", description: "Step through a neuron's forward and backward pass" },
  ],
  4: [
    { label: "Walk me through neural networks", command: "/walk-through-chapter 4", description: "Build an MLP from scratch" },
    { label: "Quiz me on layers", command: "/quiz-me neural networks", description: "Test your understanding of layers and MLPs" },
    { label: "Why do we need nonlinearity?", command: "/debug-my-understanding why does removing tanh collapse all layers into one", description: "See layer collapse in action" },
    { label: "Experiment with vanishing gradients", command: "/experiment vanishing gradients in deep networks", description: "Watch gradients shrink through layers" },
  ],
  5: [
    { label: "Walk me through attention", command: "/walk-through-chapter 5", description: "Understand Q, K, V with live examples" },
    { label: "Quiz me on attention", command: "/quiz-me attention", description: "Can you read an attention weight matrix?" },
    { label: "Explain the sqrt(d_k) scaling", command: "/explain-concept why attention divides by sqrt dk", description: "Why this one division makes or breaks training" },
    { label: "Experiment with attention patterns", command: "/experiment attention with different Q K V values", description: "See how different inputs change attention weights" },
  ],
  6: [
    { label: "Walk me through GGUF", command: "/walk-through-chapter 6", description: "Explore a model file structure" },
    { label: "Explain quantization", command: "/explain-concept quantization in GGUF", description: "How 28GB becomes 4GB" },
  ],
  7: [
    { label: "Walk me through transformers", command: "/walk-through-chapter 7", description: "RMSNorm, SiLU, RoPE explained" },
    { label: "Explain RoPE", command: "/explain-concept rotary position embedding", description: "How rotation encodes position" },
    { label: "Why RMSNorm over LayerNorm?", command: "/debug-my-understanding why does LLaMA use RMSNorm instead of LayerNorm", description: "The lazy optimization that works" },
  ],
  8: [
    { label: "Walk me through inference", command: "/walk-through-chapter 8", description: "Follow a token through the full pipeline" },
    { label: "Explain the KV cache", command: "/explain-concept KV cache and why it makes generation fast", description: "Why we cache K and V across steps" },
    { label: "Quiz me on the full pipeline", command: "/quiz-me the complete LLM pipeline", description: "Test your end-to-end understanding" },
  ],
  9: [
    { label: "Walk me through training", command: "/walk-through-chapter 9", description: "Step through the training loop with live examples" },
    { label: "Quiz me on training", command: "/quiz-me training loop SGD loss functions", description: "Do you understand the training pipeline?" },
    { label: "Explain learning rate", command: "/explain-concept learning rate and why it matters", description: "Deep dive into the most important hyperparameter" },
    { label: "Experiment with learning rates", command: "/experiment different learning rates on XOR", description: "See what happens with too high, too low, and just right" },
    { label: "Debug: my loss isn't decreasing", command: "/debug-my-understanding why is my training loss not decreasing", description: "Common training problems and how to fix them" },
  ],
};

export default function ClaudePrompts({ chapter }: { chapter: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const prompts = chapterPrompts[chapter] ?? [];

  if (prompts.length === 0) return null;

  function copyPrompt(command: string) {
    navigator.clipboard.writeText(command);
    setCopied(command);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--color-accent-blue)] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Claude prompts for this chapter"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </motion.button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 w-96 h-full bg-[var(--color-surface-raised)] border-l border-[var(--color-surface-overlay)] shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Claude Prompts</h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Copy a command and run it in Claude Code
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.command}
                      onClick={() => copyPrompt(prompt.command)}
                      className="w-full text-left p-3 rounded-lg border border-[var(--color-surface-overlay)] hover:bg-[var(--color-surface-overlay)]/50 transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {prompt.label}
                        </span>
                        {copied === prompt.command ? (
                          <span className="text-xs text-[var(--color-accent-emerald)]">
                            Copied!
                          </span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-muted)]">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {prompt.description}
                      </p>
                      <code className="text-xs font-mono text-[var(--color-accent-blue)]">
                        {prompt.command}
                      </code>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-[var(--color-surface-overlay)]">
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    These commands run in Claude Code (your terminal). They use
                    the rs-tensor MCP tools to create live examples while
                    explaining concepts.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
