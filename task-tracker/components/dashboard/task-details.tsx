"use client"

import { Task } from "@/types"
import { Calendar, Tag, AlertCircle, Clock, Timer, CheckCircle2, Loader2, Circle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SubtaskSection } from "./subtask-section"

interface Props {
    task: Task
    onClose: () => void
    onEdit?: (task: Task) => void
}

export function TaskDetails({ task, onClose, onEdit }: Props) {
    const isDone = task.status === 'Done'

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3",
                        task.status === 'Done'
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : task.status === 'In Progress'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-400"
                    )}>
                        {task.status === 'Done' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                            task.status === 'In Progress' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                                <Circle className="h-3.5 w-3.5" />}
                        {task.status}
                    </span>
                    <h2 className={cn("text-2xl font-bold text-dark-900 dark:text-white leading-tight", isDone && "line-through opacity-70")}>
                        {task.title}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-900/50 border border-sand-200 dark:border-dark-700">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500 mb-1">
                        <Tag className="h-3 w-3" /> Class
                    </div>
                    <p className="font-semibold text-dark-900 dark:text-white">{task.category}</p>
                </div>

                <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-900/50 border border-sand-200 dark:border-dark-700">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500 mb-1">
                        <AlertCircle className="h-3 w-3" /> Difficulty
                    </div>
                    <p className={cn(
                        "font-semibold",
                        task.priority === 'Critical' ? "text-red-600 dark:text-red-400" :
                            task.priority === 'High' ? "text-orange-600 dark:text-orange-400" :
                                "text-dark-900 dark:text-white"
                    )}>{task.priority}</p>
                </div>

                <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-900/50 border border-sand-200 dark:border-dark-700">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500 mb-1">
                        <Clock className="h-3 w-3" /> Start Time
                    </div>
                    <p className="font-semibold text-dark-900 dark:text-white">{task.startTime || "Not set"}</p>
                </div>

                <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-900/50 border border-sand-200 dark:border-dark-700">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500 mb-1">
                        <Timer className="h-3 w-3" /> Duration
                    </div>
                    <p className="font-semibold text-dark-900 dark:text-white">{task.duration ? `${task.duration}h` : "1h"}</p>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-900/50 border border-sand-200 dark:border-dark-700">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500 mb-1">
                    <Calendar className="h-3 w-3" /> Deadline
                </div>
                <p className="font-mono font-semibold text-dark-900 dark:text-white">
                    {format(new Date(task.deadline), "PPP 'at' p")}
                </p>
            </div>

            <div className="flex gap-3 pt-6 mt-auto">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-sand-300 font-bold text-dark-500 hover:bg-sand-100 dark:border-dark-600 dark:text-sand-300 dark:hover:bg-dark-700 transition-colors"
                >
                    Close
                </button>
                {onEdit && (
                    <button
                        onClick={() => onEdit(task)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-dark-900 text-white font-bold hover:bg-dark-800 dark:bg-white dark:text-dark-900 dark:hover:bg-sand-200 shadow-lg shadow-dark-900/10 transition-transform hover:scale-[1.02]"
                    >
                        Edit Quest
                    </button>
                )}
            </div>
            {/* Subtasks Section - Only for High/Critical Quests */}
            {(task.priority === 'High' || task.priority === 'Critical') && (
                <SubtaskSection taskId={task.id} />
            )}

        </div>
    )
}
