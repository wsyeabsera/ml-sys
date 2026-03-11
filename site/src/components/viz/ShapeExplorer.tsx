import { motion, AnimatePresence } from "framer-motion";
import { useTensorShape } from "../../hooks/useTensorShape";
import { shapeExamples, defaultData } from "../../data/tensor-examples";

const colors = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500",
];

export default function ShapeExplorer() {
  const { elements, shape, setShape, strides } = useTensorShape(defaultData);

  // Build grid representation
  const rows: typeof elements[] = [];
  if (shape.length <= 1) {
    rows.push(elements);
  } else {
    const cols = shape[shape.length - 1];
    for (let i = 0; i < elements.length; i += cols) {
      rows.push(elements.slice(i, i + cols));
    }
  }

  return (
    <div className="space-y-4">
      {/* Shape buttons */}
      <div className="flex flex-wrap gap-2">
        {shapeExamples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setShape(ex.shape)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              JSON.stringify(shape) === JSON.stringify(ex.shape)
                ? "bg-[var(--color-accent-blue)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Grid visualization */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-surface-overlay)] rounded-xl p-6 min-h-[200px] flex items-center justify-center">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {rows.map((row, ri) => (
              <motion.div
                key={`row-${ri}`}
                className="flex gap-2 justify-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: ri * 0.05 }}
              >
                {row.map((el) => (
                  <motion.div
                    key={el.flatIndex}
                    layoutId={`cell-${el.flatIndex}`}
                    className={`w-12 h-12 rounded-lg ${colors[el.flatIndex % colors.length]} flex flex-col items-center justify-center shadow-lg`}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <span className="text-white font-bold text-sm">
                      {el.value}
                    </span>
                    <span className="text-white/60 text-[10px] font-mono">
                      [{el.indices.join(",")}]
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Stride info */}
      <div className="text-sm font-mono text-[var(--color-text-muted)] text-center">
        shape=[{shape.join(",")}] → strides=[{strides.join(",")}]
      </div>
    </div>
  );
}
