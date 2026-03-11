const styles = {
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  planned: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function Badge({
  status,
}: {
  status: "done" | "in-progress" | "planned";
}) {
  const labels = { done: "Done", "in-progress": "In Progress", planned: "Planned" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
