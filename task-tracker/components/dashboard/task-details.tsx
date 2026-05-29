"use client"

import { Task } from "@/types"
import { Calendar, Tag, AlertCircle, Clock, Timer, CheckCircle2, Loader2, Circle, Pencil, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SubtaskSection } from "./subtask-section"

interface Props {
    task: Task
    onClose: () => void
    onEdit?: (task: Task) => void
}

const metaCardClass = "p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
const metaLabelClass = "text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1"

export function TaskDetails({ task, onClose, onEdit }: Props) {
    const isDone = task.status === 'Done'

    return (
        <div className="space-y-5">
            {/* Status badge + Title */}
            <div>
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3",
                    task.status === 'Done'
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : task.status === 'In Progress'
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}>
                    {task.status === 'Done'
                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                        : task.status === 'In Progress'
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Circle className="h-3.5 w-3.5" />}
                    {task.status}
                </span>
                <h2 className={cn(
                    "text-xl font-semibold text-slate-900 dark:text-white leading-tight",
                    isDone && "line-through opacity-60"
                )}>
                    {task.title}
                </h2>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2.5">
                <div className={metaCardClass}>
                    <div className={metaLabelClass}>
                        <Tag className="h-3 w-3" /> Category
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.category}</p>
                </div>

                <div className={metaCardClass}>
                    <div className={metaLabelClass}>
                        <AlertCircle className="h-3 w-3" /> Priority
                    </div>
                    <p className={cn(
                        "text-sm font-medium",
                        task.priority === 'Critical' ? "text-rose-600 dark:text-rose-400" :
                            task.priority === 'High'     ? "text-orange-600 dark:text-orange-400" :
                                                           "text-slate-800 dark:text-slate-200"
                    )}>
                        {task.priority}
                    </p>
                </div>

                <div className={metaCardClass}>
                    <div className={metaLabelClass}>
                        <Clock className="h-3 w-3" /> Start Time
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">
                        {task.startTime || "—"}
                    </p>
                </div>

                <div className={metaCardClass}>
                    <div className={metaLabelClass}>
                        <Timer className="h-3 w-3" /> Duration
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {task.duration ? `${task.duration}h` : "1h"}
                    </p>
                </div>
            </div>

            {/* Deadline */}
            <div className={metaCardClass}>
                <div className={metaLabelClass}>
                    <Calendar className="h-3 w-3" /> Deadline
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">
                    {format(new Date(task.deadline), "PPP 'at' p")}
                </p>
            </div>

            {/* Subtasks — only for High/Critical */}
            {(task.priority === 'High' || task.priority === 'Critical') && (
                <SubtaskSection taskId={task.id} />
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="h-4 w-4" /> Close
                </button>
                {onEdit && (
                    <button
                        onClick={() => onEdit(task)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                        <Pencil className="h-4 w-4" /> Edit
                    </button>
                )}
            </div>
        </div>
    )
}
