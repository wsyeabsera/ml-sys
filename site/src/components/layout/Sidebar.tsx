import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const chapters = [
  { path: "/ch/1", num: 1, title: "Getting Started", icon: "01" },
  { path: "/ch/2", num: 2, title: "What is a Tensor", icon: "02" },
  { path: "/ch/3", num: 3, title: "Phase 1 Recap", icon: "03" },
  { path: "/ch/4", num: 4, title: "The MCP Server", icon: "04" },
  { path: "/ch/5", num: 5, title: "Autograd Engine", icon: "05" },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[var(--color-surface-raised)] border-r border-[var(--color-surface-overlay)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--color-surface-overlay)]">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
          ml-sys
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Learning ML from scratch
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {chapters.map((ch) => (
          <NavLink
            key={ch.path}
            to={ch.path}
            className="block"
          >
            {({ isActive }) => (
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "text-[var(--color-text-primary)] bg-[var(--color-surface-overlay)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]/50"
                }`}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--color-accent-blue)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="font-mono text-xs text-[var(--color-text-muted)] w-5">
                  {ch.icon}
                </span>
                <span>{ch.title}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-surface-overlay)]">
        <p className="text-xs text-[var(--color-text-muted)]">
          Built with Rust + React
        </p>
      </div>
    </aside>
  );
}
