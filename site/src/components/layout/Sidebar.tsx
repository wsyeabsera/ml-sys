import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";

const learnChapters = [
  { path: "/learn/1", icon: "01", title: "What Are We Building?" },
  { path: "/learn/2", icon: "02", title: "Tensors" },
  { path: "/learn/3", icon: "03", title: "Autograd" },
  { path: "/learn/4", icon: "04", title: "Neural Networks" },
  { path: "/learn/5", icon: "05", title: "Attention" },
  { path: "/learn/6", icon: "06", title: "Model Files" },
  { path: "/learn/7", icon: "07", title: "Transformers" },
  { path: "/learn/8", icon: "08", title: "Running a Real LLM" },
  { path: "/learn/9", icon: "09", title: "Training" },
  { path: "/learn/10", icon: "10", title: "Convolutions" },
];

const playgroundItems = [
  { path: "/playground", title: "REPL", icon: ">_" },
  { path: "/visualize", title: "Visualizer", icon: "~~" },
  { path: "/reference", title: "Tool Reference", icon: "??" },
];

const projectItems = [
  { path: "/projects/and", title: "Train AND Gate", icon: "01" },
  { path: "/projects/xor", title: "The XOR Problem", icon: "02" },
  { path: "/projects/attention", title: "Attention Explorer", icon: "03" },
  { path: "/projects/cnn", title: "Pattern Hunter", icon: "04" },
];

const miscItems = [
  { path: "/misc/mcp-server", title: "The MCP Server", icon: "**" },
];

// Persist collapse state
function useSectionState(key: string, defaultOpen: boolean) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(`sidebar:${key}`);
      return saved !== null ? saved === "true" : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`sidebar:${key}`, String(open));
    } catch { /* ignore */ }
  }, [key, open]);

  return [open, () => setOpen((o) => !o)] as const;
}

// --- Icons ---

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 90 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <path d="M4.5 2.5L7.5 6L4.5 9.5" />
    </motion.svg>
  );
}

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

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// --- Nav link component ---

function SidebarLink({ to, icon, title }: { to: string; icon: string; title: string }) {
  return (
    <NavLink to={to} className="block">
      {({ isActive }) => (
        <motion.div
          className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
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
            {icon}
          </span>
          <span>{title}</span>
        </motion.div>
      )}
    </NavLink>
  );
}

// --- Section header ---

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
    >
      <ChevronIcon open={open} />
      {label}
    </button>
  );
}

// --- Collapsible section ---

function Section({
  label,
  stateKey,
  defaultOpen,
  items,
}: {
  label: string;
  stateKey: string;
  defaultOpen: boolean;
  items: { path: string; icon: string; title: string }[];
}) {
  const [open, toggle] = useSectionState(stateKey, defaultOpen);
  const location = useLocation();

  // Auto-expand when navigating into this section
  useEffect(() => {
    if (!open && items.some((item) => location.pathname.startsWith(item.path))) {
      toggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div>
      <SectionHeader label={label} open={open} onToggle={toggle} />
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-2 space-y-0.5">
              {items.map((item) => (
                <SidebarLink key={item.path} to={item.path} icon={item.icon} title={item.title} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main sidebar ---

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
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        <Section label="Playground" stateKey="playground" defaultOpen={true} items={playgroundItems} />
        <Section label="Learn" stateKey="learn" defaultOpen={true} items={learnChapters} />
        <Section label="Projects" stateKey="projects" defaultOpen={true} items={projectItems} />
        <Section label="Misc" stateKey="misc" defaultOpen={false} items={miscItems} />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-surface-overlay)] space-y-1">
        <NavLink to="/settings" className="block">
          {({ isActive }) => (
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "text-[var(--color-text-primary)] bg-[var(--color-surface-overlay)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]/50"
              }`}
            >
              <SettingsIcon />
              <span>Settings</span>
            </div>
          )}
        </NavLink>
        <div className="flex items-center justify-between px-3 py-1">
          <p className="text-xs text-[var(--color-text-muted)]">Built with Rust + React</p>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
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
      </div>
    </aside>
  );
}
