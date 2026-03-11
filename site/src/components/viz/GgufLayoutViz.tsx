import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Region = "header" | "tensor-info" | "data" | null;

interface Section {
  id: Region & string;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  heightClass: string;
  offset: string;
  details: string[];
}

const SECTIONS: Section[] = [
  {
    id: "header",
    label: "Header + Metadata",
    color: "blue",
    bgClass: "bg-[var(--color-accent-blue)]/15",
    borderClass: "border-[var(--color-accent-blue)]/40",
    textClass: "text-[var(--color-accent-blue)]",
    heightClass: "h-28",
    offset: "0x00",
    details: [
      'Magic: 0x46554747 ("GGUF" in little-endian)',
      "Version: u32 (1, 2, or 3)",
      "Tensor count: u64 (number of tensors in file)",
      "Metadata KV count: u64",
      "Key-value pairs: general.architecture, general.name, llama.context_length, ...",
    ],
  },
  {
    id: "tensor-info",
    label: "Tensor Info Headers",
    color: "amber",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/40",
    textClass: "text-amber-500",
    heightClass: "h-24",
    offset: "varies",
    details: [
      "For each tensor: name (string), n_dims (u32), shape (u64 per dim)",
      "Data type: u32 (F32=0, F16=1, Q4_0=2, Q4_1=3, ...)",
      "Offset: u64 — byte offset within the data blob",
      "Shapes are stored column-major (GGML convention)",
    ],
  },
  {
    id: "data",
    label: "Tensor Data Blob",
    color: "emerald",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/40",
    textClass: "text-emerald-500",
    heightClass: "h-36",
    offset: "aligned",
    details: [
      "Starts at next 32-byte aligned boundary after headers",
      "Raw weight data packed contiguously",
      "Each tensor's offset is relative to this start",
      "F32: 4 bytes/element, F16: 2 bytes/element",
      "Quantized (Q4_0, Q8_0, etc.): packed blocks — smaller but lossy",
    ],
  },
];

function AlignmentBar() {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-1 border-t border-dashed border-[var(--color-text-muted)]/40" />
      <span className="text-[10px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
        32-byte alignment padding
      </span>
      <div className="flex-1 border-t border-dashed border-[var(--color-text-muted)]/40" />
    </div>
  );
}

export default function GgufLayoutViz() {
  const [expanded, setExpanded] = useState<Region>(null);

  const toggle = useCallback(
    (id: Region & string) => {
      setExpanded((prev) => (prev === id ? null : id));
    },
    []
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
        GGUF Binary Layout
      </h4>
      <p className="text-xs text-[var(--color-text-muted)]">
        Click a region to see what's inside.
      </p>

      <div className="space-y-0">
        {SECTIONS.map((section, i) => (
          <div key={section.id}>
            {i === 2 && <AlignmentBar />}
            <motion.button
              onClick={() => toggle(section.id)}
              className={`w-full ${section.heightClass} ${section.bgClass} border ${section.borderClass} ${
                i === 0 ? "rounded-t-xl" : ""
              } ${i === SECTIONS.length - 1 ? "rounded-b-xl" : ""} px-4 flex items-center justify-between cursor-pointer transition-all hover:brightness-110`}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono ${section.textClass} opacity-70`}
                >
                  {section.offset}
                </span>
                <span className={`text-sm font-semibold ${section.textClass}`}>
                  {section.label}
                </span>
              </div>
              <motion.span
                className={`text-xs ${section.textClass}`}
                animate={{ rotate: expanded === section.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                &#9662;
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {expanded === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`${section.bgClass} border-x ${section.borderClass} ${
                      i === SECTIONS.length - 1 ? "border-b rounded-b-xl" : ""
                    } px-5 py-3`}
                  >
                    <ul className="space-y-1.5">
                      {section.details.map((detail, j) => (
                        <li
                          key={j}
                          className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
                        >
                          <span className={`${section.textClass} mt-0.5`}>
                            &bull;
                          </span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Size comparison */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Typical sizes
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-mono font-bold text-[var(--color-accent-blue)]">
              ~1 KB
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Header + Metadata
            </p>
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-amber-500">
              ~10 KB
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Tensor Info
            </p>
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-emerald-500">
              ~4 GB
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Tensor Data (7B model)
            </p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          The data blob dominates — you can read metadata without touching the
          weights.
        </p>
      </div>
    </div>
  );
}
