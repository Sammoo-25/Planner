"use client"

import { useState } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TaskItem } from "@/components/dashboard/task-item"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock, Plus, Target, Zap } from "lucide-react"
import { format, addDays, subDays, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Task } from "@/types"
import { useEffect } from "react"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00 to 23:00

export default function PlannerPage() {
    const { tasks, isLoaded, updateTask, addTask, removeTask } = useTaskStore()
    const { saveQuest } = useQuestManager()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [selectedTimeBlock, setSelectedTimeBlock] = useState<string | null>(null) // "09:00"

    const handleDragEnd = (result: any) => {
        const { destination, draggableId } = result
        if (!destination) return

        const newStartTime = destination.droppableId === 'unscheduled' ? null : destination.droppableId
        const deadline = format(currentDate, "yyyy-MM-dd'T'12:00:00.000xxx")

        updateTask(draggableId, {
            startTime: newStartTime,
            deadline
        })
    }

    if (!isLoaded) return null

    const currentDateStr = format(currentDate, 'yyyy-MM-dd')
    const dailyTasks = tasks.filter(t => {
        try {
            return format(new Date(t.deadline), 'yyyy-MM-dd') === currentDateStr
        } catch (e) {
            return false
        }
    })
    const topPriorities = dailyTasks
        .filter(t => t.priority === 'Critical' || t.priority === 'High')
        .slice(0, 3)

    const handleAddTimeBlock = (hour: number) => {
        const timeString = `${hour.toString().padStart(2, '0')}:00`
        setSelectedTimeBlock(timeString)
        setEditingTask({
            title: "",
            category: "Work",
            priority: "Medium",
            deadline: format(currentDate, "yyyy-MM-dd'T'12:00:00.000xxx"),
            status: "To Do",
            startTime: timeString,
            duration: 1
        } as Task)
        setIsModalOpen(true)
    }

    const handleEditTask = (task: Task) => {
        setEditingTask(task)
        setIsModalOpen(true)
    }

    const saveTask = (taskData: Partial<Task>) => {
        const deadline = taskData.deadline || format(currentDate, "yyyy-MM-dd'T'12:00:00.000xxx")

        if (editingTask && editingTask.id) {
            saveQuest(editingTask, { ...taskData, deadline })
        } else {
            const startTime = taskData.startTime || selectedTimeBlock
            addTask({
                title: taskData.title || "New Task",
                category: taskData.category || "General",
                priority: taskData.priority || "Medium",
                deadline,
                status: "To Do",
                startTime,
                duration: taskData.duration || 1
            } as any)
        }
        setIsModalOpen(false)
    }

    return (
        <div className="flex min-h-screen bg-sand-100 font-sans text-dark-900">
            <Sidebar />

            <main className="flex-1 p-8 h-screen overflow-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <header className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 hover:bg-sand-200 rounded-lg">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold">{format(currentDate, 'EEEE')}</h1>
                                <p className="text-dark-500">{format(currentDate, 'MMMM d, yyyy')}</p>
                            </div>
                            <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 hover:bg-sand-200 rounded-lg rotate-180">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Quick settings placeholder */}
                        <div className="hidden md:flex gap-4 text-xs text-dark-500 border border-sand-300 rounded-xl p-3 bg-white shadow-sm">
                            <div className="flex flex-col">
                                <span className="font-black text-[9px] uppercase tracking-widest text-dark-300">Start Time</span>
                                <span className="font-bold">06:00</span>
                            </div>
                            <div className="w-px bg-sand-200" />
                            <div className="flex items-center gap-2">
                                <div className="bg-status-normal/10 p-1.5 rounded-lg text-status-normal">
                                    <Zap className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-[9px] uppercase tracking-widest text-dark-300">Status</span>
                                    <span className="font-bold text-status-normal">War Ready</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-3 h-full pb-20">
                        {/* LEFT COLUMN: Time Grid */}
                        <Card className="lg:col-span-1 h-fit bg-sand-50 dark:bg-dark-800/50 border-none shadow-xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="p-6 border-b border-sand-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
                                <CardTitle className="text-lg flex items-center gap-2 font-black">
                                    <Clock className="h-5 w-5 text-status-normal" />
                                    Daily Deployment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 relative">
                                {/* Live Time Marker */}
                                {isToday(currentDate) && now.getHours() >= 6 && now.getHours() < 24 && (
                                    <div
                                        className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none"
                                        style={{
                                            top: `${(now.getHours() - 6) * 120 + (now.getMinutes() / 60) * 120}px`,
                                            transition: 'top 60s linear'
                                        }}
                                    >
                                        <div className="h-0.5 flex-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Now</div>
                                    </div>
                                )}
                                <div className="divide-y divide-sand-200 dark:divide-dark-700 relative">
                                    {/* Subtle background grid pattern */}
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                                        style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                                    />

                                    {HOURS.map(hour => {
                                        const hourString = hour.toString().padStart(2, '0')
                                        const timeString = `${hourString}:00`
                                        // Match any task starting within this hour (e.g., 08:00, 08:30) and sort by time
                                        const tasksAtHour = dailyTasks
                                            .filter(t => t.startTime && t.startTime.startsWith(hourString + ':'))
                                            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

                                        return (
                                            <Droppable key={hour} droppableId={timeString}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        style={{ height: '120px' }} // Compact height: 120px
                                                        className={cn(
                                                            "flex group transition-all relative border-b border-sand-200 dark:border-dark-700 box-content",
                                                            snapshot.isDraggingOver ? "bg-status-normal/5" : "hover:bg-sand-50/50 dark:hover:bg-dark-900/20"
                                                        )}
                                                    >
                                                        <div className="w-16 border-r border-sand-200 dark:border-dark-700 p-2 text-[10px] font-bold text-dark-300 flex items-start justify-center pt-2 select-none font-mono">
                                                            {timeString}
                                                        </div>
                                                        <div className="flex-1 relative h-full">
                                                            {/* Render Tasks */}
                                                            {tasksAtHour.map((task, index) => {
                                                                // --- 1. Calculate Top Offset (Position) ---
                                                                let topOffsetPercent = 0
                                                                if (task.startTime) {
                                                                    const [_, minutes] = task.startTime.split(':').map(Number)
                                                                    if (!isNaN(minutes)) {
                                                                        topOffsetPercent = (minutes / 60) * 100
                                                                    }
                                                                }

                                                                // --- 2. Calculate Height (Duration) ---
                                                                let heightPixels = 120 // Default 1 hour (matches container height)

                                                                if (task.startTime && task.deadline) {
                                                                    try {
                                                                        const [startH, startM] = task.startTime.split(':').map(Number)
                                                                        const startDate = new Date(currentDate)
                                                                        startDate.setHours(startH, startM, 0, 0)

                                                                        const endDate = new Date(task.deadline)

                                                                        // Calculate difference in hours
                                                                        const diffInMs = endDate.getTime() - startDate.getTime()
                                                                        const diffInHours = diffInMs / (1000 * 60 * 60)

                                                                        // Scale height: 1 hour = 120px
                                                                        if (diffInHours > 0) {
                                                                            heightPixels = diffInHours * 120
                                                                        }
                                                                    } catch (e) {
                                                                        console.error("Error calculating duration", e)
                                                                    }
                                                                }

                                                                return (
                                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                                        {(dragProvided, dragSnapshot) => (
                                                                            <div
                                                                                ref={dragProvided.innerRef}
                                                                                {...dragProvided.draggableProps}
                                                                                {...dragProvided.dragHandleProps}
                                                                                onClick={() => handleEditTask(task)}
                                                                                style={{
                                                                                    ...dragProvided.draggableProps.style,
                                                                                    position: 'absolute', // Absolute positioning for precise time placement
                                                                                    top: `${topOffsetPercent}%`,
                                                                                    left: '4px',
                                                                                    right: '4px',
                                                                                    height: `${heightPixels - 4}px`, // -4px for gap/visual separation
                                                                                    zIndex: dragSnapshot.isDragging ? 100 : 10,
                                                                                }}
                                                                                className={cn(
                                                                                    "transition-all duration-300",
                                                                                    dragSnapshot.isDragging ? "z-50 scale-105 rotate-1 shadow-2xl" : ""
                                                                                )}
                                                                            >
                                                                                <div className={cn(
                                                                                    "rounded-xl shadow-sm hover:shadow-md border transition-all h-full overflow-hidden flex flex-col backdrop-blur-sm",
                                                                                    task.priority === 'Critical' ? "bg-red-500/90 border-red-600 text-white shadow-red-500/10" :
                                                                                        task.priority === 'High' ? "bg-orange-500/90 border-orange-600 text-white shadow-orange-500/10" :
                                                                                            "bg-white/90 dark:bg-dark-700/90 border-sand-300 dark:border-dark-600 text-dark-900 dark:text-white"
                                                                                )}>
                                                                                    {/* Colored Header Strip for very short tasks */}
                                                                                    <div className={cn(
                                                                                        "h-0.5 w-full shrink-0",
                                                                                        task.priority === 'Critical' ? "bg-red-300" :
                                                                                            task.priority === 'High' ? "bg-orange-300" : "bg-status-normal"
                                                                                    )} />

                                                                                    <div className="p-2 flex-1 min-h-0 flex flex-col justify-center">
                                                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                                            <span className="font-bold text-[9px] uppercase tracking-wide opacity-80 truncate">
                                                                                                {task.startTime}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p className="font-bold text-xs truncate leading-none">{task.title}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                )
                                                            })}

                                                            {provided.placeholder}

                                                            {provided.placeholder}

                                                            {provided.placeholder}

                                                            {/* Minimal Add Button (Centered +) */}
                                                            <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
                                                                <button
                                                                    onClick={() => handleAddTimeBlock(hour)}
                                                                    className="h-8 w-8 rounded-full bg-sand-200 dark:bg-dark-700 text-sand-500 dark:text-dark-400 flex items-center justify-center hover:bg-sand-900 hover:text-white dark:hover:bg-white dark:hover:text-dark-900 hover:scale-110 active:scale-95 transition-all pointer-events-auto shadow-sm hover:shadow-lg"
                                                                >
                                                                    <Plus className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Droppable>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* MIDDLE/RIGHT: Priorities & List */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Top 3 Priorities */}
                            <Card className="bg-white dark:bg-dark-800/50 border-none shadow-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="p-6 border-b border-sand-100 dark:border-dark-700">
                                    <CardTitle className="flex items-center gap-2 font-black">
                                        <Target className="h-5 w-5 text-status-high" />
                                        Primary Objectives
                                    </CardTitle>
                                    <CardDescription>Main focus for this deployment.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {[0, 1, 2].map(idx => {
                                            const task = topPriorities[idx]
                                            return (
                                                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-sand-50/50 dark:bg-dark-900/30 border border-sand-100 dark:border-dark-700 border-dashed">
                                                    <span className="font-black text-2xl text-sand-300 dark:text-dark-700 italic">0{idx + 1}</span>
                                                    {task ? (
                                                        <div onClick={() => handleEditTask(task)} className="flex-1 cursor-pointer group">
                                                            <p className="font-bold text-dark-900 dark:text-white group-hover:text-status-normal transition-colors">{task.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-dark-400">{task.category}</span>
                                                                <span className="text-dark-200 dark:text-dark-700">•</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-status-high">{task.priority}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 text-xs font-bold text-dark-300 uppercase tracking-widest italic opacity-50">
                                                            Objective Not Set
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Task List (Unscheduled) */}
                            <Card className="bg-white dark:bg-dark-800/50 border-none shadow-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="p-6 border-b border-sand-100 dark:border-dark-700">
                                    <CardTitle className="font-black flex items-center gap-2 text-status-normal">
                                        <Zap className="h-5 w-5" />
                                        Unscheduled Inbox
                                    </CardTitle>
                                    <CardDescription>Drag and drop to deploy to time slots.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <Droppable droppableId="unscheduled">
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={cn(
                                                    "space-y-3 min-h-[200px] rounded-2xl transition-all p-1",
                                                    snapshot.isDraggingOver ? "bg-status-normal/5 scale-[0.99] border-2 border-dashed border-status-normal/20" : ""
                                                )}
                                            >
                                                {dailyTasks.filter(t => !t.startTime && t.status !== 'Done').map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(dragProvided, dragSnapshot) => (
                                                            <div
                                                                ref={dragProvided.innerRef}
                                                                {...dragProvided.draggableProps}
                                                                {...dragProvided.dragHandleProps}
                                                                className={cn(
                                                                    "transition-all duration-300",
                                                                    dragSnapshot.isDragging ? "rotate-2 scale-105 z-50 shadow-2xl" : ""
                                                                )}
                                                            >
                                                                <TaskItem
                                                                    task={task}
                                                                    onComplete={(id) => saveQuest(task, { status: 'Done' })}
                                                                    onEdit={(t) => handleEditTask(t)}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                {dailyTasks.filter(t => !t.startTime && t.status !== 'Done').length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-16 opacity-30 border-2 border-dashed border-sand-300 dark:border-dark-700 rounded-[2.5rem] bg-sand-50/30 dark:bg-dark-900/10">
                                                        <div className="p-4 bg-white dark:bg-dark-800 rounded-2xl shadow-sm mb-3">
                                                            <Zap className="h-6 w-6 text-sand-300" />
                                                        </div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-center px-6 leading-relaxed">
                                                            Vault Clear<br />
                                                            <span className="text-dark-400 font-bold">All quests deployed to timeline</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DragDropContext>

                <EditTaskModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    task={editingTask}
                    onSave={saveTask}
                    onDelete={removeTask}
                />
            </main>
        </div>
    )
}
