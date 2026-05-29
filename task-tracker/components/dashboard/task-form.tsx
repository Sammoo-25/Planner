"use client"

import { Task } from "@/types"
import { useTaskStore } from "@/hooks/use-tasks"
import { useState, useEffect } from "react"
import { Calendar, Tag, AlertCircle, Clock, Trash2, Save, Timer, Sword, Plus, X } from "lucide-react"
import { useSettingsStore } from "@/hooks/use-settings"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Props {
    task?: Task
    onSave: (task: Partial<Task> & { subtasks?: string[] }) => void
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
        } else {
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

        const isDuplicate = tasks.some(t =>
            t.title.trim().toLowerCase() === formData.title?.trim().toLowerCase() &&
            t.id !== task?.id
        )

        if (isDuplicate) {
            setError("A task with this title already exists.")
            return
        }

        onSave({ ...formData, subtasks })
    }

    const labelClass = "text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
    const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400"

    return (
        <form onSubmit={handleSubmit} className="space-y-5 h-full flex flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-1">

                {/* Title */}
                <div className="space-y-1.5">
                    <label className={labelClass}>Quest Title</label>
                    <textarea
                        autoFocus
                        required
                        rows={3}
                        className={cn(
                            "w-full text-base font-semibold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none text-slate-900 dark:text-slate-100",
                            error && "border-rose-500 dark:border-rose-500 focus:border-rose-500"
                        )}
                        placeholder="e.g. Slay the Bug Dragon"
                        value={formData.title}
                        onChange={e => {
                            setFormData({ ...formData, title: e.target.value })
                            setError("")
                        }}
                    />
                    {error && (
                        <p className="text-sm text-rose-500 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                        </p>
                    )}
                </div>

                {/* Category / Priority / Status */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            <Tag className="h-3 w-3" /> Category
                        </label>
                        <select
                            className={inputClass}
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option>General</option>
                            <option>Work</option>
                            <option>Health</option>
                            <option>Learning</option>
                            <option>Hobby</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            <AlertCircle className="h-3 w-3" /> Priority
                        </label>
                        <select
                            className={inputClass}
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            <Sword className="h-3 w-3" /> Status
                        </label>
                        <select
                            className={inputClass}
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                        >
                            <option>To Do</option>
                            <option>In Progress</option>
                            <option>Done</option>
                        </select>
                    </div>
                </div>

                {/* Subtasks — only during creation for High/Critical */}
                {!task && (formData.priority === 'High' || formData.priority === 'Critical') && (
                    <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900/50">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                                Subtasks
                            </label>
                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                {subtasks.length} added
                            </span>
                        </div>

                        {subtasks.length > 0 && (
                            <div className="space-y-1.5">
                                {subtasks.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-orange-100 dark:border-slate-700">
                                        <span className="text-orange-500 font-bold text-xs">•</span>
                                        <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{step}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSubtask(idx)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                value={subtaskInput}
                                onChange={e => setSubtaskInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddSubtask(e)
                                    }
                                }}
                                placeholder="Add a subtask..."
                                className="flex-1 text-sm bg-white dark:bg-slate-800 border-orange-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={handleAddSubtask}
                                className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit mode subtask hint */}
                {task && (formData.priority === 'High' || formData.priority === 'Critical') && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-lg flex items-center gap-2 border border-blue-200 dark:border-blue-900/50">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Manage subtasks from the Task Details view.
                    </div>
                )}

                {/* Start Time / Duration */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            <Clock className="h-3 w-3" /> Start Time
                        </label>
                        <input
                            type="time"
                            className={inputClass}
                            value={formData.startTime || ""}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            <Timer className="h-3 w-3" /> Duration (hrs)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="24"
                            className={inputClass}
                            value={formData.duration || 1}
                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                        />
                    </div>
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                    <label className={labelClass}>
                        <Calendar className="h-3 w-3" /> Deadline
                    </label>
                    <input
                        type="datetime-local"
                        className={cn(inputClass, "font-mono")}
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

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto shrink-0">
                {task && onDelete && (
                    <button
                        type="button"
                        onClick={() => { onDelete(task.id); onCancel() }}
                        className="flex items-center gap-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-sm font-medium px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                        <Save className="h-4 w-4" /> Save
                    </button>
                </div>
            </div>
        </form>
    )
}
