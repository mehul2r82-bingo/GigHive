import Link from 'next/link';
import StatusBadge from './StatusBadge';
import type { Task } from '@/types';

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/task/${task.id}`}>
      <div className="group relative bg-forge-surface border border-forge-border hover:border-forge-accent/50 rounded-lg p-5 transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,107,43,0.08)] cursor-pointer overflow-hidden">
        {/* Hover accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forge-accent/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-mono text-forge-text font-semibold text-sm leading-snug group-hover:text-forge-accent transition-colors line-clamp-2">
            {task.title}
          </h3>
          <StatusBadge status={task.status} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          <Meta label="TYPE" value={task.task_type?.toString().toUpperCase()} />
          <Meta label="BAND" value={task.band?.toUpperCase()} />
          <Meta label="MODE" value={task.mode?.toUpperCase()} />
          <Meta
            label="DUE"
            value={
              task.deadline
                ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  }).format(new Date(task.deadline))
                : '—'
            }
/>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-forge-border">
          <span className="font-mono text-forge-accent text-lg font-bold">
            ${Number(task.price).toLocaleString()}
          </span>
          <span className="text-forge-sub text-[11px] font-mono tracking-wider group-hover:text-forge-accent/70 transition-colors">
            VIEW →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-forge-sub text-[9px] font-mono tracking-widest mb-0.5">{label}</p>
      <p className="text-forge-text text-xs font-mono">{value || '—'}</p>
    </div>
  );
}
