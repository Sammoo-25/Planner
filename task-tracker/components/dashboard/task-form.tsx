"use client"

import { Task } from "@/types"
import { useTaskStore } from "@/hooks/use-tasks"
import { useState, useEffect } from "react"
import { Calendar, Tag, AlertCircle, Clock, Trash2, Save, Timer, Sword, Plus } from "lucide-react"
import { useSettingsStore } from "@/hooks/use-settings"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { format } from "date-fns"

interface Props {
    task?: Task
    onSave: (task: Partial<Task>) => void
    onDelete?: (id: string) => void
    onCancel: () => void
}

export function TaskForm({ task, onSave, onDelete, onCancel }: Props) {
    const [formData, setFormData] = useState<Partial<Task>>({
        title: "",
        category: "General",
        priority: "Medium",
        deadline: new Date().toISOString(),
        startTime: "",
        duration: 1
    })

    const [subtasks, setSubtasks] = useState<string[]>([])
    const [subtaskInput, setSubtaskInput] = useState("")

    const { tasks } = useTaskStore()
    const { timeZone } = useSettingsStore()
    const [error, setError] = useState("")

    useEffect(() => {
        if (task) {
            setFormData(task)
            // Load existing subtasks if editing?
            // For now, simple creation flow support
        } else {
            // Reset for new task
            setFormData({
                title: "",
                category: "General",
                priority: "Medium",
                deadline: new Date().toISOString(),
                startTime: "",
                duration: 1
            })
            setSubtasks([])
        }
    }, [task])

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault()
        if (subtaskInput.trim()) {
            setSubtasks([...subtasks, subtaskInput.trim()])
            setSubtaskInput("")
        }
    }

    const removeSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation: Check for duplicate titles
        const isDuplicate = tasks.some(t =>
            t.title.trim().toLowerCase() === formData.title?.trim().toLowerCase() &&
            t.id !== task?.id
        )

        if (isDuplicate) {
            setError("A quest with this title already exists!")
            return
        }

        // 1. Save the main task
        // We need to Intercept onSave to handle subtasks
        // But onSave is passed from parent...
        // Let's modify the parent logic or handle it here?
        // The parent (EditTaskModal) calls use-tasks store. 
        // We can't easily wait for the ID here if onSave is void.

        // Actually, we should trust the user provided functionality 
        // OR we need to change how this form works. 
        // Given the constraints, let's assume onSave handles the task creation. 
        // WE CANNOT easily add subtasks here without the new ID.
        // So we will pass the subtasks UP to the parent or handle it differently.

        // WAIT: The prompt asked to "rewrite logic". 
        // I will modify this component to handle the API call directly OR pass the subtasks up.
        // passing 'subtasks' to onSave is cleaner if we modify the interface.

        // Let's modify the interface to accept subtasks in onSave
        onSave({ ...formData, subtasks } as any)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-1">
                {/* Title Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-dark-500">Quest Title</label>
                    <textarea
                        autoFocus
                        required
                        rows={3}
                        className={`w-full text-lg font-semibold bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 focus:ring-2 focus:ring-status-normal rounded-xl px-4 py-3 placeholder:text-dark-500/50 resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="e.g. Slay the Bug Dragon"
                        value={formData.title}
                        onChange={e => {
                            setFormData({ ...formData, title: e.target.value })
                            setError("")
                        }}
                    />
                    {error && <p className="text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Category */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500">
                            <Tag className="h-3 w-3" /> Class
                        </label>
                        <select
                            className="w-full bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 rounded-lg px-3 py-2 text-sm"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option>General</option>
                            <option>Work</option>
                            <option>Health</option>
                            <option>Learning</option>
                        </select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500">
                            <AlertCircle className="h-3 w-3" /> Difficulty
                        </label>
                        <select
                            className="w-full bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 rounded-lg px-3 py-2 text-sm"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                        >
                            <option value="Low">Low (Common)</option>
                            <option value="Medium">Medium (Rare)</option>
                            <option value="High">High (Epic)</option>
                            <option value="Critical">Critical (Legendary)</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500">
                            <Sword className="h-3 w-3" /> Status
                        </label>
                        <select
                            className="w-full bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 rounded-lg px-3 py-2 text-sm"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        >
                            <option>To Do</option>
                            <option>In Progress</option>
                            <option>Done</option>
                        </select>
                    </div>
                </div>

                {/* Subtasks Section for High/Critical (Only during creation) */}
                {!task && (formData.priority === 'High' || formData.priority === 'Critical') && (
                    <div className="space-y-3 p-4 bg-sand-50 dark:bg-dark-800/50 rounded-xl border border-sand-200 dark:border-dark-700 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-dark-500 flex justify-between">
                            <span>Tactical Steps</span>
                            <span className="text-orange-600">{subtasks.length} Steps</span>
                        </label>

                        <div className="space-y-2">
                            {subtasks.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm bg-white dark:bg-dark-900 p-2 rounded-lg border border-sand-200 dark:border-dark-700">
                                    <span className="text-orange-500 font-bold">•</span>
                                    <span className="flex-1 truncate">{step}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSubtask(idx)}
                                        className="text-dark-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={subtaskInput}
                                onChange={e => setSubtaskInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubtask(e);
                                    }
                                }}
                                placeholder="Add a step..."
                                className="flex-1 text-sm bg-white dark:bg-dark-900 border border-sand-200 dark:border-dark-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500/20"
                            />
                            <button
                                type="button"
                                onClick={handleAddSubtask}
                                className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 px-3 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Mode Helper for Subtasks */}
                {task && (formData.priority === 'High' || formData.priority === 'Critical') && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Manage tactical steps in the Quest Details view.
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {/* Time Block */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500">
                            <Clock className="h-3 w-3" /> Start Time
                        </label>
                        <input
                            type="time"
                            className="w-full bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 rounded-lg px-3 py-2 text-sm"
                            value={formData.startTime || ""}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500">
                            <Timer className="h-3 w-3" /> Hours
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="w-full bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 rounded-lg px-3 py-2 text-sm"
                            value={formData.duration || 1}
                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-500">
                        <Calendar className="h-3 w-3" /> Deadline
                    </label>
                    <input
                        type="datetime-local"
                        className="w-full bg-white dark:bg-dark-900 border-sand-300 dark:border-dark-700 rounded-lg px-3 py-2 text-sm font-mono"
                        value={formData.deadline ? format(toZonedTime(new Date(formData.deadline), timeZone), "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={e => {
                            if (e.target.value) {
                                const utcDate = fromZonedTime(e.target.value, timeZone)
                                setFormData({ ...formData, deadline: utcDate.toISOString() })
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-sand-200 dark:border-dark-700 mt-auto">
                {task && onDelete && (
                    <button
                        type="button"
                        onClick={() => { onDelete(task.id); onCancel(); }}
                        className="flex items-center gap-2 text-status-overdue hover:text-red-700 dark:hover:text-red-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-dark-500 hover:text-dark-900 dark:text-sand-300 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-dark-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-dark-900/20 hover:bg-dark-800 hover:scale-105 transition-all dark:bg-white dark:text-dark-900 dark:hover:bg-sand-200"
                    >
                        <Save className="h-4 w-4" /> Save Quest
                    </button>
                </div>
            </div>
        </form>
    )
}
