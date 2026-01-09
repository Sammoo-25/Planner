"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Check, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useGamification } from "@/hooks/use-gamification"
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

    const { refreshStats, triggerXpNotification } = useGamification()
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

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSubtaskTitle.trim()) return

        setIsAdding(true)
        try {
            const newSubtask = await api.addSubtask(taskId, newSubtaskTitle)
            const updatedSubtasks = [...subtasks, newSubtask]
            setSubtasks(updatedSubtasks)
            setNewSubtaskTitle("")

            // Update parent task count
            updateTask(taskId, {
                subtaskCount: updatedSubtasks.length,
                completedSubtaskCount: updatedSubtasks.filter(st => st.is_completed).length
            })
        } catch (error) {
            console.error("Failed to add subtask:", error)
        } finally {
            setIsAdding(false)
        }
    }

    const toggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus

        // Optimistic update
        const updatedSubtasks = subtasks.map(st =>
            st.id === subtaskId ? { ...st, is_completed: newStatus } : st
        )
        setSubtasks(updatedSubtasks)

        try {
            await api.updateSubtask(subtaskId, { is_completed: newStatus })

            // 1. Sync XP - No immediate XP for subtasks now (Deferred)
            // await refreshStats() 
            // if (newStatus) {
            //    triggerXpNotification(5)
            // } else {
            //     triggerXpNotification(-5)
            // }

            // 2. Sync Progress Bar
            updateTask(taskId, {
                subtaskCount: updatedSubtasks.length,
                completedSubtaskCount: updatedSubtasks.filter(st => st.is_completed).length
            })

        } catch (error) {
            // Revert on error
            setSubtasks(subtasks.map(st =>
                st.id === subtaskId ? { ...st, is_completed: currentStatus } : st
            ))
            console.error("Failed to toggle subtask:", error)
        }
    }

    const deleteSubtask = async (subtaskId: string) => {
        try {
            await api.deleteSubtask(subtaskId)
            const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId)
            setSubtasks(updatedSubtasks)

            // Update parent task count
            updateTask(taskId, {
                subtaskCount: updatedSubtasks.length,
                completedSubtaskCount: updatedSubtasks.filter(st => st.is_completed).length
            })
        } catch (error) {
            console.error("Failed to delete subtask:", error)
        }
    }

    const completedCount = subtasks.filter(st => st.is_completed).length
    const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0

    if (isLoading) return <div className="py-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-dark-400" /></div>

    return (
        <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-900/50 border border-sand-200 dark:border-dark-700 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-dark-500 flex items-center gap-2">
                    <span className="text-orange-500">❖</span> Tactical Steps
                </h3>
                {subtasks.length > 0 && (
                    <span className="text-xs font-mono font-bold text-dark-400 bg-sand-100 dark:bg-dark-800 px-2 py-0.5 rounded-full">
                        {completedCount}/{subtasks.length}
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {subtasks.length > 0 && (
                <div className="h-1.5 w-full bg-sand-200 dark:bg-dark-700 rounded-full mb-4 overflow-hidden">
                    <div
                        className="h-full bg-orange-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="space-y-2 mb-4">
                {subtasks.map(st => (
                    <div key={st.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-dark-800 transition-colors">
                        <button
                            onClick={() => toggleSubtask(st.id, st.is_completed)}
                            className={cn(
                                "h-5 w-5 rounded border flex items-center justify-center transition-all",
                                st.is_completed
                                    ? "bg-orange-500 border-orange-500 text-white"
                                    : "border-sand-400 dark:border-dark-600 hover:border-orange-400"
                            )}
                        >
                            {st.is_completed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <span className={cn(
                            "flex-1 text-sm font-medium transition-all",
                            st.is_completed ? "text-dark-400 line-through decoration-sand-300" : "text-dark-900 dark:text-white"
                        )}>
                            {st.title}
                        </span>
                        <button
                            onClick={() => deleteSubtask(st.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-dark-400 hover:text-red-500 transition-all"
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
                    placeholder="Add a tactical step..."
                    className="flex-1 bg-white dark:bg-dark-800 border border-sand-200 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-dark-400"
                />
                <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim() || isAdding}
                    className="p-1.5 bg-dark-900 dark:bg-white text-white dark:text-dark-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
            </form>
        </div>
    )
}
