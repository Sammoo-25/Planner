import { Task } from "@/types"
import { CheckCircle2, Loader2, Clock, Pencil, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { isAfter, isPast, startOfToday } from "date-fns"

interface Props {
    task: Task
    onComplete: (id: string) => void
    onEdit?: (task: Task) => void
}

export function TaskItem({ task, onComplete, onEdit }: Props) {
    const isDone = task.status === 'Done'
    const isInProgress = task.status === 'In Progress'
    const isOverdue = !isDone && task.deadline && isPast(new Date(task.deadline))

    return (
        <div className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150",
            isDone
                ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-55"
                : isOverdue
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40"
                    : isInProgress
                        ? "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/60 shadow-sm"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
        )}>
            {/* Status indicator bar */}
            <div className={cn(
                "shrink-0 w-0.5 self-stretch rounded-full",
                isDone ? "bg-emerald-400" : isOverdue ? "bg-rose-400" : isInProgress ? "bg-indigo-500" : "bg-transparent"
            )} />

            {/* Checkbox */}
            <button
                onClick={(e) => { e.stopPropagation(); onComplete(task.id) }}
                className={cn(
                    "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                    isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isInProgress
                            ? "border-indigo-400 dark:border-indigo-500 text-indigo-500"
                            : isOverdue
                                ? "border-rose-400 dark:border-rose-500 hover:border-rose-500"
                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                )}
            >
                {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                {isInProgress && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
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
                            <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-500 hover:text-indigo-600 hover:underline"
                            >
                                {part}
                            </a>
                        ) : (
                            <span key={i}>{part}</span>
                        )
                    )}
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/70 px-1.5 py-0.5 rounded-md font-medium">
                        {task.category}
                    </span>
                    <span className={cn(
                        "flex items-center gap-1 text-[11px]",
                        isOverdue ? "text-rose-500 dark:text-rose-400 font-medium" : "text-slate-400 dark:text-slate-500"
                    )}>
                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                        {!isOverdue && <Clock className="h-3 w-3" />}
                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {isOverdue && <span className="ml-0.5">overdue</span>}
                    </span>
                    {(task.subtaskCount ?? 0) > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {task.completedSubtaskCount}/{task.subtaskCount} subtasks
                        </span>
                    )}
                </div>

                {/* Subtask progress bar */}
                {(task.subtaskCount ?? 0) > 0 && (task.priority === 'High' || task.priority === 'Critical') && (
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-full max-w-xs">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500", task.priority === 'Critical' ? "bg-rose-500" : "bg-orange-500")}
                            style={{ width: `${((task.completedSubtaskCount ?? 0) / (task.subtaskCount ?? 1)) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Right section */}
            <div className="shrink-0 flex items-center gap-2">
                <PriorityBadge priority={task.priority} />
                {onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
    const styles: Record<Task['priority'], string> = {
        Low:      "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
        Medium:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
        High:     "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50",
        Critical: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50",
    }
    return (
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap", styles[priority])}>
            {priority}
        </span>
    )
}
