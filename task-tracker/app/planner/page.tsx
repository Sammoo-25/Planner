"use client"

import { useState, useEffect } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useSettingsStore } from "@/hooks/use-settings"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { Plus, Zap, Target, MoreHorizontal, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
    format,
    addDays,
    subDays,
    isSameDay,
    isToday,
    startOfWeek,
    isBefore,
    startOfToday
} from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { cn } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Task } from "@/types"

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00 to 23:00

export default function PlannerPage() {
    const { tasks, isLoaded, updateTask, addTask, removeTask } = useTaskStore()
    const { timeZone } = useSettingsStore()
    const { saveQuest } = useQuestManager()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        // Initial set
        setNow(toZonedTime(new Date(), timeZone))

        const timer = setInterval(() => {
            setNow(toZonedTime(new Date(), timeZone))
        }, 60000)
        return () => clearInterval(timer)
    }, [timeZone])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [selectedTimeBlock, setSelectedTimeBlock] = useState<string | null>(null)

    // Derived Data
    const currentDateStr = format(currentDate, 'yyyy-MM-dd')
    const weekStart = startOfWeek(currentDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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

    // Handlers
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

    if (!isLoaded) return null

    return (
        <div className="flex h-screen bg-[#FDFDF9] font-sans text-stone-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-full min-w-0">
                {/* Header & Week Nav */}
                <header className="px-8 pt-8 pb-4 shrink-0 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-stone-800 tracking-tight">Daily Deployment</h1>
                            <p className="text-stone-400 font-bold text-sm mt-1">{format(currentDate, 'MMMM yyyy')}</p>
                        </div>

                        {/* Current Date Display */}
                        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-stone-100">
                            <CalendarIcon className="h-4 w-4 text-stone-400" />
                            <span className="font-bold text-stone-700">{format(currentDate, 'EEEE, MMM do')}</span>
                        </div>
                    </div>

                    {/* Weekly Strip */}
                    <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-stone-100">
                        <button onClick={() => setCurrentDate(subDays(currentDate, 7))} className="p-2 hover:bg-stone-50 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex gap-2 lg:gap-4 overflow-x-auto no-scrollbar px-2">
                            {weekDays.map(day => {
                                const active = isSameDay(day, currentDate)
                                const isPast = isBefore(day, startOfToday())
                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => setCurrentDate(day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center h-14 w-14 lg:w-16 rounded-xl transition-all duration-200 border-2",
                                            active
                                                ? "bg-stone-900 border-stone-900 text-white shadow-lg scale-105"
                                                : "bg-transparent border-transparent hover:bg-stone-50 hover:border-stone-100 text-stone-500",
                                            isPast && !active && "opacity-50 grayscale"
                                        )}
                                    >
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-stone-400" : "")}>{format(day, 'EEE')}</span>
                                        <span className="text-xl font-black leading-none">{format(day, 'd')}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-stone-50 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 pt-2 overflow-hidden min-h-0">

                        {/* COLUMN 1: TIMELINE (Scrollable) */}
                        <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-white">
                            {/* Header */}
                            <div className="p-6 pb-2 shrink-0 flex items-center justify-between">
                                <h3 className="font-black text-lg text-stone-800 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-stone-900 animate-pulse" />
                                    Timeline
                                </h3>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">06:00 - 23:00</span>
                            </div>

                            {/* Scrollable Area */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                                {/* Live Time Marker */}
                                {isToday(currentDate) && now.getHours() >= 6 && now.getHours() < 24 && (
                                    <div
                                        className="absolute left-16 right-4 z-20 flex items-center gap-2 pointer-events-none"
                                        style={{
                                            top: `${(now.getHours() - 6) * 100 + (now.getMinutes() / 60) * 100 + 16}px`, // +16 for padding top
                                            transition: 'top 60s linear'
                                        }}
                                    >
                                        <div className="h-px flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        <div className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Now</div>
                                    </div>
                                )}

                                <div className="space-y-4 pb-20"> {/* Bottom padding for scroll space */}
                                    {HOURS.map(hour => {
                                        const hourString = hour.toString().padStart(2, '0')
                                        const timeString = `${hourString}:00`
                                        const tasksAtHour = dailyTasks
                                            .filter(t => t.startTime && t.startTime.startsWith(hourString + ':'))
                                            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

                                        return (
                                            <Droppable key={hour} droppableId={timeString}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        style={{ height: '120px' }} // Fixed height for precise positioning
                                                        className="flex gap-4 group relative border-b border-stone-100" // Added border for grid lines
                                                    >
                                                        {/* Hour Label */}
                                                        <div className="w-12 pt-2 text-right shrink-0">
                                                            <span className="text-xs font-bold text-stone-400 font-mono">{timeString}</span>
                                                        </div>

                                                        {/* Task Slot */}
                                                        <div className={cn(
                                                            "flex-1 relative transition-all duration-300",
                                                            snapshot.isDraggingOver ? "bg-stone-50" : ""
                                                        )}>
                                                            {/* Add Button Placeholder */}
                                                            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                <button
                                                                    onClick={() => handleAddTimeBlock(hour)}
                                                                    className="bg-stone-900 text-white p-1.5 rounded-xl shadow-lg transform hover:scale-110 active:scale-95 transition-all pointer-events-auto"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>

                                                            {tasksAtHour.map((task, index) => {
                                                                // Positioning Logic
                                                                let topOffsetPercent = 0
                                                                if (task.startTime) {
                                                                    const [_, minutes] = task.startTime.split(':').map(Number)
                                                                    if (!isNaN(minutes)) {
                                                                        topOffsetPercent = (minutes / 60) * 100
                                                                    }
                                                                }

                                                                let heightPixels = 120 // Default 1 hr
                                                                if (task.startTime && task.deadline) {
                                                                    try {
                                                                        const [startH, startM] = task.startTime.split(':').map(Number)
                                                                        const startDate = new Date(currentDate)
                                                                        startDate.setHours(startH, startM, 0, 0)
                                                                        const endDate = new Date(task.deadline)
                                                                        const diffInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
                                                                        if (diffInHours > 0) heightPixels = diffInHours * 120
                                                                    } catch (e) {
                                                                        console.error("Error calc duration", e)
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
                                                                                    position: 'absolute',
                                                                                    top: `${topOffsetPercent}%`,
                                                                                    left: '4px',
                                                                                    right: '4px',
                                                                                    height: `${heightPixels - 8}px`, // -8px gap
                                                                                    zIndex: dragSnapshot.isDragging ? 50 : 10
                                                                                }}
                                                                                className={cn(
                                                                                    "group/task cursor-grab active:cursor-grabbing hover:z-20",
                                                                                    dragSnapshot.isDragging && "z-50"
                                                                                )}
                                                                            >
                                                                                <div className={cn(
                                                                                    "rounded-xl p-3 shadow-md border flex flex-col transition-all h-full overflow-hidden",
                                                                                    task.priority === 'Critical' ? "bg-red-50 border-red-100" :
                                                                                        task.priority === 'High' ? "bg-orange-50 border-orange-100" :
                                                                                            "bg-white border-stone-200"
                                                                                )}>
                                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{task.startTime}</span>
                                                                                        {task.priority !== 'Medium' && (
                                                                                            <div className={cn("h-1.5 w-1.5 rounded-full",
                                                                                                task.priority === 'Critical' ? "bg-red-500" : "bg-orange-500"
                                                                                            )} />
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="font-bold text-stone-800 text-xs leading-tight truncate">{task.title}</p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                )
                                                            })}
                                                            {provided.placeholder}
                                                        </div>
                                                    </div>
                                                )}
                                            </Droppable>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2 & 3: Context & Inbox */}
                        <div className="lg:col-span-7 flex flex-col min-h-0 gap-6">

                            {/* Priorities Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48 shrink-0">
                                <div className="bg-stone-900 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl">
                                    <div>
                                        <div className="flex items-center gap-2 text-stone-400 mb-2">
                                            <Target className="h-5 w-5" />
                                            <span className="font-bold uppercase tracking-widest text-xs">Focus</span>
                                        </div>
                                        <h2 className="text-2xl font-black leading-tight">Primary<br />Objectives</h2>
                                    </div>
                                    <div className="flex -space-x-3">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className={cn(
                                                "h-10 w-10 rounded-full border-2 border-stone-900 flex items-center justify-center font-bold text-sm",
                                                topPriorities[i] ? "bg-white text-stone-900" : "bg-stone-800 text-stone-600"
                                            )}>
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm overflow-y-auto no-scrollbar">
                                    <h3 className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-4">Top Priorities</h3>
                                    <div className="space-y-3">
                                        {topPriorities.length > 0 ? topPriorities.map(task => (
                                            <div key={task.id} onClick={() => handleEditTask(task)} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={cn("h-2 w-2 rounded-full shrink-0",
                                                    task.priority === 'Critical' ? "bg-red-500" : "bg-orange-500"
                                                )} />
                                                <span className="font-bold text-stone-700 truncate group-hover:text-stone-900 transition-colors">{task.title}</span>
                                            </div>
                                        )) : (
                                            <p className="text-stone-300 font-bold italic text-sm">No priorities set.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Unscheduled Inbox */}
                            <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-stone-100 border border-stone-100 flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-stone-50 flex items-center justify-between shrink-0">
                                    <h3 className="font-black text-lg text-stone-800 flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                        Quest Inbox
                                    </h3>
                                    <button
                                        onClick={() => handleAddTimeBlock(9)}
                                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2 rounded-xl transition-colors"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
                                    <Droppable droppableId="unscheduled">
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={cn(
                                                    "grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px] transition-all",
                                                    snapshot.isDraggingOver && "opacity-50"
                                                )}
                                            >
                                                {dailyTasks
                                                    .filter(t => !t.startTime && t.status !== 'Done')
                                                    .map((task, index) => (
                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                            {(dragProvided, dragSnapshot) => (
                                                                <div
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                    style={dragProvided.draggableProps.style}
                                                                    className={cn(
                                                                        "group bg-white p-4 rounded-2xl border-2 border-transparent shadow-sm hover:shadow-md hover:border-stone-100 transition-all cursor-grab active:cursor-grabbing",
                                                                        dragSnapshot.isDragging && "shadow-2xl rotate-2 scale-105 z-50"
                                                                    )}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-500">
                                                                            {task.category}
                                                                        </span>
                                                                        <MoreHorizontal className="h-4 w-4 text-stone-300" />
                                                                    </div>
                                                                    <h4 className="font-bold text-stone-800 leading-snug">{task.title}</h4>
                                                                    <div className="mt-2 flex items-center gap-1">
                                                                        {task.priority !== 'Medium' && (
                                                                            <span className={cn("text-[10px] font-bold",
                                                                                task.priority === 'Critical' ? "text-red-500" : "text-orange-500"
                                                                            )}>{task.priority}</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Edit/Complete Actions Overlay */}
                                                                    <div className="mt-3 pt-3 border-t border-stone-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleEditTask(task)}
                                                                            className="flex-1 text-[10px] font-bold bg-stone-50 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => saveQuest(task, { status: 'Done' })}
                                                                            className="flex-1 text-[10px] font-bold bg-stone-900 py-1.5 rounded-lg hover:bg-stone-700 text-white"
                                                                        >
                                                                            Complete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>

                                    {dailyTasks.filter(t => !t.startTime && t.status !== 'Done').length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4">
                                            <Zap className="h-12 w-12 opacity-20" />
                                            <p className="font-bold uppercase tracking-widest text-xs">Inbox Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
