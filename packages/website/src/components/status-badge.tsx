type StatusBadgeProps = {
  status: "Now" | "In Progress" | "Coming Soon" | "Research";
};

const STYLE_BY_STATUS: Record<StatusBadgeProps["status"], string> = {
  Now: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "In Progress": "border-indigo-500/40 bg-indigo-500/10 text-indigo-200",
  "Coming Soon": "border-amber-500/40 bg-amber-500/10 text-amber-200",
  Research: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLE_BY_STATUS[status]}`}>{status}</span>;
}
