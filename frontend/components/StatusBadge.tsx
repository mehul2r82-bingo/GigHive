import type { TaskStatus } from '../types';

const config: Record<
  TaskStatus,
  { label: string; classes: string; dot: string }
> = {
  DRAFT: {
    label: "DRAFT",
    classes: "text-gray-400 border-gray-500/30 bg-gray-500/10",
    dot: "bg-gray-400",
  },
  PAYMENT_PENDING: {
    label: "PAYMENT",
    classes: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    dot: "bg-yellow-400",
  },
  OPEN: {
    label: "OPEN",
    classes: "text-green-400 border-green-500/30 bg-green-500/10",
    dot: "bg-green-400",
  },
  ACCEPTED: {
    label: "ACCEPTED",
    classes: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    dot: "bg-cyan-400",
  },
  SUBMITTED: {
    label: "SUBMITTED",
    classes: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    dot: "bg-amber-400",
  },
  COMPLETED: {
    label: "COMPLETED",
    classes: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    dot: "bg-blue-400",
  },
  FAILED: {
    label: "FAILED",
    classes: "text-red-400 border-red-500/30 bg-red-500/10",
    dot: "bg-red-400",
  },
  CANCELLED: {
    label: "CANCELLED",
    classes: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
    dot: "bg-zinc-400",
  },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, classes, dot } = config[status] ?? config.DRAFT

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${classes}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
