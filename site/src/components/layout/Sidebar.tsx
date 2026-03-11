import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";

const chapters = [
  { path: "/ch/1", num: 1, title: "Getting Started", icon: "01" },
  { path: "/ch/2", num: 2, title: "What is a Tensor", icon: "02" },
  { path: "/ch/3", num: 3, title: "Phase 1 Recap", icon: "03" },
  { path: "/ch/4", num: 4, title: "The MCP Server", icon: "04" },
  { path: "/ch/5", num: 5, title: "Autograd Engine", icon: "05" },
  { path: "/ch/6", num: 6, title: "Layers & MLPs", icon: "06" },
  { path: "/ch/7", num: 7, title: "Attention", icon: "07" },
  { path: "/ch/8", num: 8, title: "GGUF Model Files", icon: "08" },
  { path: "/ch/9", num: 9, title: "Transformer Blocks", icon: "09" },
  { path: "/ch/10", num: 10, title: "Loading a Real Model", icon: "10" },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Sidebar() {
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[var(--color-surface-raised)] border-r border-[var(--color-surface-overlay)] flex flex-col transition-colors duration-200">
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

      {/* Footer with theme toggle */}
      <div className="p-4 border-t border-[var(--color-surface-overlay)] flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">
          Built with Rust + React
        </p>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </motion.div>
        </button>
      </div>
    </aside>
  );
}
