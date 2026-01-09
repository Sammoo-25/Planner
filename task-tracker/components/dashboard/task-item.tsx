import { Task } from "@/types"
import { CheckCircle2, Circle, AlertCircle, Clock, Timer, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
    task: Task
    onComplete: (id: string) => void
    onEdit?: (task: Task) => void
}

export function TaskItem({ task, onComplete, onEdit }: Props) {
    const isDone = task.status === 'Done'
    const isInProgress = task.status === 'In Progress'
    const isTodo = task.status === 'To Do'

    return (
        <div className={cn(
            "group relative p-4 flex items-center justify-between transition-all duration-300 rounded-2xl border",
            "hover:scale-[1.01] hover:shadow-xl",
            isDone
                ? "bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-500/5 dark:border-emerald-500/10 opacity-75"
                : isInProgress
                    ? "bg-blue-50/50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 shadow-lg shadow-blue-500/5"
                    : "bg-white border-stone-100 dark:bg-[#1A1A1E] dark:border-white/5",
            "hover:border-stone-200 dark:hover:border-white/20 dark:hover:bg-[#202025]"
        )}>
            {/* Left accent line for status */}
            <div className={cn(
                "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300",
                isDone ? "bg-emerald-500" : isInProgress ? "bg-blue-500" : "bg-stone-300 dark:bg-zinc-700",
                "group-hover:w-1.5"
            )} />

            <div className="flex items-center gap-4 pl-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onComplete(task.id)
                    }}
                    className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-xl border-2 transition-all duration-300",
                        isDone
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : isInProgress
                                ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-500/20"
                                : "border-stone-300 text-stone-300 hover:border-blue-400 hover:text-blue-400 dark:border-zinc-700 dark:text-zinc-600 dark:hover:border-zinc-500"
                    )}
                >
                    {isDone && <CheckCircle2 className="h-4 w-4" />}
                    {isInProgress && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isTodo && <Circle className="h-4 w-4" />}
                </button>

                <div className="min-w-0">
                    <h3 className={cn(
                        "font-bold text-stone-900 dark:text-white transition-all duration-300 whitespace-pre-wrap break-words",
                        isDone && "line-through opacity-50 font-medium"
                    )}>
                        {task.title.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                            part.match(/(https?:\/\/[^\s]+)/g) ? (
                                <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-500 hover:underline relative z-10"
                                >
                                    {part}
                                </a>
                            ) : (
                                <span key={i}>{part}</span>
                            )
                        )}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-zinc-400 border border-stone-200 dark:border-white/5">
                            {task.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400 dark:text-zinc-500">
                            <Clock className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PriorityBadge priority={task.priority} />

                {/* Percentage Text */}
                {task.subtaskCount && task.subtaskCount > 0 && (task.priority === 'High' || task.priority === 'Critical') && (
                    <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">
                        {Math.round((task.completedSubtaskCount! / task.subtaskCount) * 100)}%
                    </span>
                )}

                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(task)
                        }}
                        className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all duration-200 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                )}
            </div>

            {/* Progress Bar for High/Critical Tasks */}
            {task.subtaskCount && task.subtaskCount > 0 && (task.priority === 'High' || task.priority === 'Critical') && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100 dark:bg-white/5 overflow-hidden rounded-b-2xl">
                    <div
                        className={cn(
                            "h-full transition-all duration-500 ease-out",
                            task.priority === 'Critical' ? "bg-rose-500" : "bg-orange-500"
                        )}
                        style={{ width: `${(task.completedSubtaskCount! / task.subtaskCount) * 100}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
    const variants = {
        Low: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20",
        Medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20",
        High: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10 border-orange-200 dark:border-orange-400/20",
        Critical: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border-rose-200 dark:border-rose-400/20",
    }

    return (
        <span className={cn(
            "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tight border",
            variants[priority]
        )}>
            {priority}
        </span>
    )
}

