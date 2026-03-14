"use client"

import { useTaskStore } from "@/hooks/use-tasks"
import { useGamification } from "@/hooks/use-gamification"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Task } from "@/types"
import { useState } from "react"
import { Plus, Layout, ListTodo, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

export default function BoardPage() {
    const { tasks, updateTask, addTask, removeTask, isLoaded } = useTaskStore()
    const { heal } = useGamification()
    const { toggleTaskStatus, saveQuest, awardTaskXp } = useQuestManager()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)

    const columns = [
        { id: 'To Do', title: 'To Do', icon: ListTodo, color: 'text-slate-500' },
        { id: 'In Progress', title: 'In Progress', icon: Loader2, color: 'text-blue-500' },
        { id: 'Done', title: 'Completed', icon: CheckCircle2, color: 'text-green-500' }
    ]

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

    const handleCompleteTask = (id: string) => {
        toggleTaskStatus(id)
    }

    const saveTask = (taskData: Partial<Task>) => {
        if (editingTask) {
            saveQuest(editingTask, taskData)
        } else {
            addTask({
                id: Math.random().toString(),
                title: taskData.title || "New Quest",
                category: taskData.category || "General",
                priority: taskData.priority || "Medium",
                deadline: taskData.deadline || new Date().toISOString(),
                status: "To Do"
            } as Task)
        }
        setEditingTask(undefined)
        setIsModalOpen(false)
    }

    if (!isLoaded) return null

    return (
        <div className="flex h-screen bg-transparent overflow-hidden font-sans text-stone-900 dark:text-zinc-100 transition-colors relative">
            <div className="relative z-10 flex w-full h-full">
            <Sidebar />

            <main className="flex-1 flex flex-col h-full min-w-0 p-8 overflow-hidden">
                <header className="flex-none mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-3 drop-shadow-sm">
                            <Layout className="h-8 w-8 text-blue-500" />
                            Quest Board
                        </h1>
                        <p className="text-stone-500 font-semibold text-sm mt-1 dark:text-zinc-400">Manage your adventure workflow.</p>
                    </div>
                    <button
                        onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-stone-900 to-stone-950 px-6 py-3 text-white shadow-xl shadow-stone-900/20 hover:scale-105 transition-all dark:from-white dark:to-zinc-200 dark:text-stone-900 dark:shadow-white/10"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-bold">New Quest</span>
                    </button>
                </header>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {columns.map((column: any) => (
                            <div key={column.id} className="flex flex-col min-h-0 bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 overflow-hidden relative transition-colors duration-500 hover:border-white/40 dark:hover:border-white/20">
                                <div className="shrink-0 p-6 pb-4 flex items-center justify-between z-10 border-b border-white/20 dark:border-white/5">
                                    <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-stone-700 dark:text-zinc-300">
                                        <div className={cn("p-2 rounded-xl bg-white/30 dark:bg-white/5 shadow-sm border border-white/40 dark:border-white/5", column.color.replace('text-', 'bg-').replace('500', '500/10'))}>
                                            <column.icon className={cn("h-4 w-4 drop-shadow-sm", column.color, column.id === 'In Progress' && "animate-spin")} />
                                        </div>
                                        {column.title}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {column.id === 'Done' && tasks.filter((t: Task) => t.status === 'Done').length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const doneTasks = tasks.filter((t: Task) => t.status === 'Done');
                                                    doneTasks.forEach((t: Task) => removeTask(t.id));
                                                }}
                                                className="text-[9px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20"
                                                title="Archive All Victories"
                                            >
                                                HARVEST
                                            </button>
                                        )}
                                        <span className="bg-white/30 dark:bg-[#27272a]/50 border border-white/40 dark:border-white/5 text-stone-900 dark:text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-inner">
                                            {tasks.filter((t: Task) => t.status === column.id).length}
                                        </span>
                                    </div>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided: any, snapshot: any) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={cn(
                                                "flex-1 overflow-y-auto custom-scrollbar p-4 pt-4 space-y-4",
                                                snapshot.isDraggingOver ? "bg-white/10 dark:bg-white/5 backdrop-blur-sm" : ""
                                            )}
                                        >
                                            {tasks.filter((t: Task) => t.status === column.id).map((task: Task, index: number) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided: any, snapshot: any) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={cn(
                                                                "transition-all duration-300 transform",
                                                                snapshot.isDragging ? "z-50 scale-105 rotate-2 shadow-2xl" : "rotate-0"
                                                            )}
                                                            onClick={() => setViewingTask(task)}
                                                        >
                                                            <div className={cn(
                                                                "pointer-events-none rounded-2xl transition-all duration-500",
                                                                column.id === 'In Progress' && !snapshot.isDragging && "warzone-glow ring-2 ring-blue-500/10"
                                                            )}>
                                                                <TaskItem
                                                                    task={task}
                                                                    onComplete={(id: string) => handleCompleteTask(id)}
                                                                    onEdit={(t: Task) => { setEditingTask(t); setIsModalOpen(true); }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {tasks.filter((t: Task) => t.status === column.id).length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40 border-2 border-dashed border-white/50 dark:border-white/10 rounded-3xl bg-white/5 dark:bg-white/5 mt-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-zinc-400">Available Slot</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
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
            </main>
            </div>
        </div>
    )
}
