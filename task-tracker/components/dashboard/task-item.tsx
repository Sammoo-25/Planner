import { Task } from "@/types"
import { CheckCircle2, Loader2, Pencil, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { isPast } from "date-fns"

interface Props {
    task: Task
    onComplete: (id: string) => void
    onEdit?: (task: Task) => void
}

const PRIORITY_ACCENT: Record<Task['priority'], string> = {
    Critical: 'bg-rose-500',
    High:     'bg-orange-500',
    Medium:   'bg-indigo-500',
    Low:      'bg-slate-300 dark:bg-slate-600',
}

const PRIORITY_BADGE: Record<Task['priority'], string> = {
    Critical: 'text-rose-600   dark:text-rose-400   bg-rose-50   dark:bg-rose-950/50   ring-rose-200/50   dark:ring-rose-800/30',
    High:     'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 ring-orange-200/50 dark:ring-orange-800/30',
    Medium:   'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 ring-indigo-200/50 dark:ring-indigo-800/30',
    Low:      'text-slate-500  dark:text-slate-400  bg-slate-100 dark:bg-slate-800      ring-slate-200/50  dark:ring-slate-700/30',
}

export function TaskItem({ task, onComplete, onEdit }: Props) {
    const isDone      = task.status === 'Done'
    const isInProgress= task.status === 'In Progress'
    const isOverdue   = !isDone && task.deadline && isPast(new Date(task.deadline))

    return (
        <div className={cn(
            "group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150",
            "hover:-translate-y-px",
            isDone
                ? "bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/40 opacity-60"
                : isOverdue
                    ? "bg-rose-50/60 dark:bg-rose-950/15 border-rose-200/60 dark:border-rose-800/30 hover:shadow-[0_4px_12px_rgba(244,63,94,0.12)]"
                    : isInProgress
                        ? "bg-white dark:bg-[#0d1526] border-indigo-200/70 dark:border-indigo-800/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(99,102,241,0.12)]"
                        : "bg-white dark:bg-[#0d1526] border-slate-200/70 dark:border-slate-700/50 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        )}>
            {/* Priority left accent bar */}
            <div className={cn(
                "absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full",
                isDone ? "opacity-0" : PRIORITY_ACCENT[task.priority]
            )} />

            {/* Checkbox */}
            <button
                onClick={(e) => { e.stopPropagation(); onComplete(task.id) }}
                className={cn(
                    "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 active:scale-90",
                    isDone
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_1px_4px_rgba(16,185,129,0.35)]"
                        : isInProgress
                            ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500"
                            : isOverdue
                                ? "border-rose-400 dark:border-rose-500 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                )}
            >
                {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                {isInProgress && <Loader2 className="h-3 w-3 animate-spin" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-sm font-medium leading-snug break-words",
                    isDone
                        ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600"
                        : "text-slate-800 dark:text-slate-100"
                )}>
                    {task.title.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                        part.match(/https?:\/\/[^\s]+/) ? (
                            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-500 hover:text-indigo-600 hover:underline">
                                {part}
                            </a>
                        ) : <span key={i}>{part}</span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md font-medium">
                        {task.category}
                    </span>
                    <span className={cn(
                        "flex items-center gap-1 text-[11px]",
                        isOverdue
                            ? "text-rose-500 dark:text-rose-400 font-semibold"
                            : "text-slate-400 dark:text-slate-500"
                    )}>
                        {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {isOverdue && <span className="ml-0.5">overdue</span>}
                    </span>
                    {(task.subtaskCount ?? 0) > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                            {task.completedSubtaskCount}/{task.subtaskCount} done
                        </span>
                    )}
                </div>

                {/* Subtask progress bar */}
                {(task.subtaskCount ?? 0) > 0 && (task.priority === 'High' || task.priority === 'Critical') && (
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden w-full max-w-[160px]">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500",
                                task.priority === 'Critical' ? "bg-rose-500" : "bg-orange-500"
                            )}
                            style={{ width: `${((task.completedSubtaskCount ?? 0) / (task.subtaskCount ?? 1)) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Right: priority badge + edit */}
            <div className="shrink-0 flex items-center gap-2">
                <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ring-1",
                    PRIORITY_BADGE[task.priority]
                )}>
                    {task.priority}
                </span>
                {onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}
