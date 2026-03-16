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
            "group relative p-4 lg:p-5 flex items-center justify-between transition-all duration-500 rounded-2xl border",
            "hover:-translate-y-1 hover:shadow-2xl",
            isDone
                ? "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/10 opacity-70 scale-[0.98] blur-[0.5px] hover:blur-none hover:opacity-100"
                : isInProgress
                    ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 dark:from-blue-900/20 dark:to-indigo-900/10 dark:border-blue-500/20 shadow-xl shadow-blue-500/[0.08]"
                    : "bg-white/20 backdrop-blur-md border-white/30 dark:bg-black/20 dark:border-white/10 shadow-lg shadow-black/5 hover:bg-white/30 dark:hover:bg-black/40",
            )}>
            {/* Left accent line for status */}
            <div className={cn(
                "absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full transition-all duration-500",
                isDone ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                       : isInProgress ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                       : "bg-stone-300 dark:bg-zinc-700",
                "group-hover:h-full group-hover:top-0 group-hover:bottom-0 group-hover:w-2"
            )} />

            {/* Background Glow Effect on Hover (In Progress) */}
            {isInProgress && (
                <div className="absolute inset-0 rounded-2xl bg-blue-400/5 dark:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}

            <div className="flex items-center gap-4 pl-3 relative z-10 w-full overflow-hidden">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onComplete(task.id)
                    }}
                    className={cn(
                        "relative flex shrink-0 h-8 w-8 items-center justify-center rounded-xl border-2 transition-all duration-300 overflow-hidden",
                        isDone
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            : isInProgress
                                ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-500/20 dark:text-blue-400 hover:scale-110"
                                : "border-stone-300 text-stone-300 hover:border-blue-400 hover:text-blue-400 hover:scale-110 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)] dark:border-zinc-700 dark:text-zinc-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
                    )}
                >
                    {isDone && (
                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                             <CheckCircle2 className="h-5 w-5" />
                        </div>
                    )}
                    {isInProgress && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isTodo && <Circle className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>

                <div className="min-w-0 flex-1">
                    <h3 className={cn(
                        "font-bold text-base transition-all duration-300 whitespace-pre-wrap break-words",
                        isDone ? "text-stone-500 dark:text-zinc-400 line-through decoration-stone-300 dark:decoration-zinc-600" 
                               : "text-stone-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-500 group-hover:bg-clip-text group-hover:-text-transparent"
                    )}>
                        {task.title.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                            part.match(/(https?:\/\/[^\s]+)/g) ? (
                                <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-500 hover:text-blue-600 hover:underline relative z-10 transition-colors"
                                >
                                    {part}
                                </a>
                            ) : (
                                <span key={i}>{part}</span>
                            )
                        )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="px-2.5 py-1 rounded-md bg-white/30 dark:bg-white/5 text-[10px] font-black uppercase tracking-wider text-stone-600 dark:text-zinc-400 border border-white/40 dark:border-white/5 shadow-sm">
                            {task.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-zinc-400 bg-white/30 dark:bg-white/5 px-2 py-1 rounded-md">
                            <Clock className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 shrink-0">
                {/* Priority Badge */}
                <PriorityBadge priority={task.priority} />

                {/* Percentage Text */}
                {(task.subtaskCount ?? 0) > 0 && (task.priority === 'High' || task.priority === 'Critical') && (
                    <span className="text-xs font-black text-stone-400 dark:text-zinc-500 bg-white/30 dark:bg-[#27272a] px-2 py-1 rounded-lg">
                        {Math.round((task.completedSubtaskCount! / task.subtaskCount!) * 100)}%
                    </span>
                )}

                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(task)
                        }}
                        className="p-2 sm:p-2.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 dark:text-zinc-500 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 outline-none focus:opacity-100 focus:translate-x-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                )}
            </div>

            {/* Progress Bar for High/Critical Tasks */}
            {(task.subtaskCount ?? 0) > 0 && (task.priority === 'High' || task.priority === 'Critical') && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-100/50 dark:bg-white/[0.02] overflow-hidden rounded-b-2xl">
                    <div
                        className={cn(
                            "h-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]",
                            task.priority === 'Critical' ? "bg-rose-500 text-rose-500" : "bg-orange-500 text-orange-500"
                        )}
                        style={{ width: `${(task.completedSubtaskCount! / task.subtaskCount!) * 100}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
    const variants = {
        Low: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-sm shadow-blue-500/10",
        Medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 shadow-sm shadow-amber-500/10",
        High: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 shadow-sm shadow-orange-500/10",
        Critical: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 shadow-sm shadow-rose-500/10 animate-pulse",
    }

    return (
        <span className={cn(
            "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-colors",
            variants[priority]
        )}>
            {priority}
        </span>
    )
}

