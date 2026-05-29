"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Check, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useTaskStore } from "@/hooks/use-tasks"

interface Subtask {
    id: string
    title: string
    is_completed: boolean
}

interface Props {
    taskId: string
}

export function SubtaskSection({ taskId }: Props) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    const { updateTask } = useTaskStore()

    useEffect(() => {
        loadSubtasks()
    }, [taskId])

    const loadSubtasks = async () => {
        try {
            const data = await api.getSubtasks(taskId)
            setSubtasks(data)
        } catch (error) {
            console.error("Failed to load subtasks:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const syncParentCount = (updated: Subtask[]) => {
        updateTask(taskId, {
            subtaskCount: updated.length,
            completedSubtaskCount: updated.filter(st => st.is_completed).length
        })
    }

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSubtaskTitle.trim()) return

        setIsAdding(true)
        try {
            const newSubtask = await api.addSubtask(taskId, newSubtaskTitle)
            const updated = [...subtasks, newSubtask]
            setSubtasks(updated)
            setNewSubtaskTitle("")
            syncParentCount(updated)
        } catch (error) {
            console.error("Failed to add subtask:", error)
        } finally {
            setIsAdding(false)
        }
    }

    const toggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        const optimistic = subtasks.map(st =>
            st.id === subtaskId ? { ...st, is_completed: newStatus } : st
        )
        setSubtasks(optimistic)

        try {
            await api.updateSubtask(subtaskId, { is_completed: newStatus })
            syncParentCount(optimistic)
        } catch {
            setSubtasks(subtasks)
        }
    }

    const deleteSubtask = async (subtaskId: string) => {
        try {
            await api.deleteSubtask(subtaskId)
            const updated = subtasks.filter(st => st.id !== subtaskId)
            setSubtasks(updated)
            syncParentCount(updated)
        } catch (error) {
            console.error("Failed to delete subtask:", error)
        }
    }

    const completedCount = subtasks.filter(st => st.is_completed).length
    const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0

    if (isLoading) return (
        <div className="py-4 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
    )

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Subtasks
                </h3>
                {subtasks.length > 0 && (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                        {completedCount} / {subtasks.length}
                    </span>
                )}
            </div>

            {subtasks.length > 0 && (
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="space-y-1">
                {subtasks.map(st => (
                    <div key={st.id} className="group flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <button
                            onClick={() => toggleSubtask(st.id, st.is_completed)}
                            className={cn(
                                "h-4.5 w-4.5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                st.is_completed
                                    ? "bg-indigo-500 border-indigo-500 text-white"
                                    : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                            )}
                            style={{ width: '18px', height: '18px' }}
                        >
                            {st.is_completed && <Check className="h-2.5 w-2.5" />}
                        </button>
                        <span className={cn(
                            "flex-1 text-sm transition-colors",
                            st.is_completed
                                ? "text-slate-400 dark:text-slate-500 line-through"
                                : "text-slate-700 dark:text-slate-300"
                        )}>
                            {st.title}
                        </span>
                        <button
                            onClick={() => deleteSubtask(st.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all rounded"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim() || isAdding}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
            </form>
        </div>
    )
}
