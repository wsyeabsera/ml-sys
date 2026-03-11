export default function CodeBlock({
  code,
  lang = "",
}: {
  code: string;
  lang?: string;
}) {
  return (
    <div className="relative group">
      {lang && (
        <span className="absolute top-2 right-3 text-xs text-[var(--color-text-muted)] font-mono">
          {lang}
        </span>
      )}
      <pre className="!bg-[var(--color-surface)] !border-[var(--color-surface-overlay)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
