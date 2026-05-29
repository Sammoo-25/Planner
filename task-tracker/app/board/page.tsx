"use client"

import { useTaskStore } from "@/hooks/use-tasks"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Task } from "@/types"
import { useState } from "react"
import { Plus, ListTodo, PlayCircle, CheckCircle2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

const COLUMNS = [
    { id: 'To Do' as const, label: 'To Do', Icon: ListTodo, color: 'text-slate-500', accent: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'In Progress' as const, label: 'In Progress', Icon: PlayCircle, color: 'text-indigo-600 dark:text-indigo-400', accent: 'bg-indigo-50 dark:bg-indigo-950/50' },
    { id: 'Done' as const, label: 'Done', Icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-50 dark:bg-emerald-950/50' },
]

export default function BoardPage() {
    const { tasks, updateTask, addTask, removeTask, isLoaded } = useTaskStore()
    const { toggleTaskStatus, saveQuest, awardTaskXp } = useQuestManager()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatus = destination.droppableId as Task['status']
        const task = tasks.find(t => t.id === draggableId)
        if (task && newStatus === 'Done' && task.status !== 'Done') {
            awardTaskXp(task)
        }
        updateTask(draggableId, { status: newStatus })
    }

    const saveTask = (taskData: Partial<Task>) => {
        if (editingTask) {
            saveQuest(editingTask, taskData)
        } else {
            addTask({
                id: Math.random().toString(),
                title: taskData.title || "New Task",
                category: taskData.category || "General",
                priority: taskData.priority || "Medium",
                deadline: taskData.deadline || new Date().toISOString(),
                status: "To Do",
            } as Task)
        }
        setEditingTask(undefined)
        setIsModalOpen(false)
    }

    if (!isLoaded) return null

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h1 className="font-semibold text-slate-900 dark:text-white">Board</h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Drag tasks between columns to update status</p>
                    </div>
                    <button
                        onClick={() => { setEditingTask(undefined); setIsModalOpen(true) }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Task
                    </button>
                </header>

                {/* Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 overflow-hidden">
                        {COLUMNS.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.id)
                            return (
                                <div key={col.id} className="flex flex-col min-h-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                                    {/* Column header */}
                                    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", col.accent)}>
                                                <col.Icon className={cn("h-3.5 w-3.5", col.color)} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{col.label}</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums">
                                                {colTasks.length}
                                            </span>
                                        </div>
                                        {col.id === 'Done' && colTasks.length > 0 && (
                                            <button
                                                onClick={() => colTasks.forEach(t => removeTask(t.id))}
                                                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                                                title="Clear completed"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Droppable area */}
                                    <Droppable droppableId={col.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={cn(
                                                    "flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar transition-colors duration-150",
                                                    snapshot.isDraggingOver && "bg-slate-100 dark:bg-slate-800/60"
                                                )}
                                            >
                                                {colTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={cn(
                                                                    "transition-all duration-200",
                                                                    snapshot.isDragging && "opacity-90 rotate-1 scale-[1.02]"
                                                                )}
                                                                onClick={() => setViewingTask(task)}
                                                            >
                                                                <TaskItem
                                                                    task={task}
                                                                    onComplete={toggleTaskStatus}
                                                                    onEdit={(t) => { setEditingTask(t); setIsModalOpen(true) }}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {colTasks.length === 0 && (
                                                    <div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                                        <span className="text-xs text-slate-400 dark:text-slate-600">Drop tasks here</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            )
                        })}
                    </div>
                </DragDropContext>

                <EditTaskModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    task={editingTask}
                    onSave={saveTask}
                    onDelete={removeTask}
                />
                <TaskDetailsModal
                    open={!!viewingTask}
                    onClose={() => setViewingTask(undefined)}
                    task={viewingTask}
                    onEdit={(t) => {
                        setViewingTask(undefined)
                        setEditingTask(t)
                        setIsModalOpen(true)
                    }}
                />
            </div>
        </div>
    )
}
