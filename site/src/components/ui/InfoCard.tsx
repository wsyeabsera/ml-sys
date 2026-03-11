import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function InfoCard({
  title,
  children,
  accent = "blue",
}: {
  title: string;
  children: ReactNode;
  accent?: "blue" | "emerald" | "amber" | "rose";
}) {
  const accentColors = {
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
    amber: "border-l-amber-500",
    rose: "border-l-rose-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`bg-[var(--color-surface-raised)] border border-[var(--color-surface-overlay)] border-l-2 ${accentColors[accent]} rounded-lg p-5`}
    >
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
