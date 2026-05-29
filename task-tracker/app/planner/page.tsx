"use client"

import { useState, useEffect } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useSettingsStore } from "@/hooks/use-settings"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
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
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Task } from "@/types"

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00 to 23:00

const PRIORITY_STYLES: Record<string, string> = {
    Critical: "bg-rose-50   dark:bg-rose-950/40   border-rose-200   dark:border-rose-800/60",
    High:     "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60",
    Medium:   "bg-white     dark:bg-slate-800     border-slate-200  dark:border-slate-700",
    Low:      "bg-white     dark:bg-slate-800     border-slate-200  dark:border-slate-700",
}

const PRIORITY_DOT: Record<string, string> = {
    Critical: "bg-rose-500",
    High:     "bg-orange-500",
    Medium:   "bg-indigo-500",
    Low:      "bg-slate-400",
}

export default function PlannerPage() {
    const { tasks, isLoaded, updateTask, addTask, removeTask } = useTaskStore()
    const { timeZone } = useSettingsStore()
    const { saveQuest } = useQuestManager()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        setNow(toZonedTime(new Date(), timeZone))
        const timer = setInterval(() => {
            setNow(toZonedTime(new Date(), timeZone))
        }, 60000)
        return () => clearInterval(timer)
    }, [timeZone])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [selectedTimeBlock, setSelectedTimeBlock] = useState<string | null>(null)

    const currentDateStr = format(currentDate, 'yyyy-MM-dd')
    const weekStart = startOfWeek(currentDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const dailyTasks = tasks.filter(t => {
        try { return format(new Date(t.deadline), 'yyyy-MM-dd') === currentDateStr }
        catch { return false }
    })

    const topPriorities = dailyTasks
        .filter(t => (t.priority === 'Critical' || t.priority === 'High') && t.status !== 'Done')
        .slice(0, 3)

    const handleDragEnd = (result: DropResult) => {
        const { destination, draggableId } = result
        if (!destination) return
        const newStartTime = destination.droppableId === 'unscheduled' ? null : destination.droppableId
        const deadline = format(currentDate, "yyyy-MM-dd'T'12:00:00.000xxx")
        updateTask(draggableId, { startTime: newStartTime ?? undefined, deadline })
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
            addTask({
                title: taskData.title || "New Task",
                category: taskData.category || "General",
                priority: taskData.priority || "Medium",
                deadline,
                status: "To Do",
                startTime: taskData.startTime || selectedTimeBlock || undefined,
                duration: taskData.duration || 1
            } as Task)
        }
        setIsModalOpen(false)
    }

    if (!isLoaded) return null

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-full min-w-0">
                {/* Header & Week Nav */}
                <header className="px-6 pt-5 pb-4 shrink-0 flex flex-col gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-semibold text-slate-900 dark:text-white">Planner</h1>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">{format(currentDate, 'MMMM yyyy')}</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{format(currentDate, 'EEEE, MMM do')}</span>
                        </div>
                    </div>

                    {/* Weekly Strip */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setCurrentDate(subDays(currentDate, 7))}
                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
                            {weekDays.map(day => {
                                const active = isSameDay(day, currentDate)
                                const isPast = isBefore(day, startOfToday())
                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => setCurrentDate(day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center h-12 flex-1 rounded-lg transition-all duration-150 min-w-[40px]",
                                            active
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400",
                                            isPast && !active && "opacity-50"
                                        )}
                                    >
                                        <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{format(day, 'EEE')}</span>
                                        <span className="text-sm font-semibold leading-none mt-0.5">{format(day, 'd')}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentDate(addDays(currentDate, 7))}
                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">

                        {/* Timeline Column */}
                        <div className="lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="px-4 py-3 shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                    Timeline
                                </h3>
                                <span className="text-xs text-slate-400 dark:text-slate-500">06:00 – 23:00</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                                {/* Live Time Marker */}
                                {isToday(currentDate) && now.getHours() >= 6 && now.getHours() < 24 && (
                                    <div
                                        className="absolute left-16 right-4 z-20 flex items-center gap-2 pointer-events-none"
                                        style={{ top: `${(now.getHours() - 6) * 100 + (now.getMinutes() / 60) * 100 + 16}px` }}
                                    >
                                        <div className="h-px flex-1 bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                                        <div className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                            Now
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-0 pb-20">
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
                                                        style={{ height: '100px' }}
                                                        className={cn(
                                                            "flex gap-4 group relative border-b border-slate-100 dark:border-slate-800 transition-colors",
                                                            snapshot.isDraggingOver && "bg-indigo-50 dark:bg-indigo-950/20"
                                                        )}
                                                    >
                                                        <div className="w-12 pt-2 text-right shrink-0">
                                                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono">{timeString}</span>
                                                        </div>

                                                        <div className="flex-1 relative">
                                                            {/* Hover Add Button */}
                                                            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                <button
                                                                    onClick={() => handleAddTimeBlock(hour)}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg shadow-md transform hover:scale-110 active:scale-95 transition-all pointer-events-auto"
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>

                                                            {tasksAtHour.map((task, index) => {
                                                                let topOffsetPercent = 0
                                                                if (task.startTime) {
                                                                    const [, minutes] = task.startTime.split(':').map(Number)
                                                                    if (!isNaN(minutes)) topOffsetPercent = (minutes / 60) * 100
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
                                                                                    height: `${(task.duration || 1) * 100 - 8}px`,
                                                                                    zIndex: dragSnapshot.isDragging ? 50 : 10
                                                                                }}
                                                                                className={cn(
                                                                                    "cursor-grab active:cursor-grabbing",
                                                                                    dragSnapshot.isDragging && "z-50"
                                                                                )}
                                                                            >
                                                                                <div className={cn(
                                                                                    "rounded-lg p-2 border flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow",
                                                                                    PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Medium
                                                                                )}>
                                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono">{task.startTime}</span>
                                                                                        {(task.priority === 'Critical' || task.priority === 'High') && (
                                                                                            <div className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-tight truncate">{task.title}</p>
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

                        {/* Right Panel */}
                        <div className="lg:col-span-7 flex flex-col min-h-0 gap-4">

                            {/* Priorities Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                                <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 text-white flex flex-col justify-between shadow-sm min-h-[120px]">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Target className="h-4 w-4" />
                                            <span className="font-semibold text-xs uppercase tracking-widest">Daily Focus</span>
                                        </div>
                                        <h2 className="text-lg font-bold leading-tight">Top Priorities</h2>
                                    </div>
                                    <div className="flex items-center gap-1 mt-3">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className={cn(
                                                "h-8 w-8 rounded-full border-2 border-slate-700 flex items-center justify-center font-semibold text-xs",
                                                topPriorities[i]
                                                    ? "bg-indigo-600 text-white border-indigo-700"
                                                    : "bg-slate-700 text-slate-500"
                                            )}>
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 overflow-y-auto no-scrollbar">
                                    <h3 className="font-semibold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Critical / High</h3>
                                    <div className="space-y-2.5">
                                        {topPriorities.length > 0 ? topPriorities.map(task => (
                                            <div key={task.id} onClick={() => handleEditTask(task)} className="flex items-center gap-2.5 cursor-pointer group">
                                                <div className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</span>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-400 dark:text-slate-500 italic">No high-priority tasks today.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Unscheduled Inbox */}
                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                                        Unscheduled
                                    </h3>
                                    <button
                                        onClick={() => handleAddTimeBlock(9)}
                                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 p-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <Droppable droppableId="unscheduled">
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={cn(
                                                    "grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[120px] transition-all",
                                                    snapshot.isDraggingOver && "opacity-60"
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
                                                                        "group bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing",
                                                                        dragSnapshot.isDragging && "shadow-xl rotate-1 scale-105 z-50 bg-white dark:bg-slate-800"
                                                                    )}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                                                            {task.category}
                                                                        </span>
                                                                        <MoreHorizontal className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                                                    </div>
                                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug">{task.title}</p>
                                                                    {(task.priority === 'Critical' || task.priority === 'High') && (
                                                                        <div className="mt-2 flex items-center gap-1.5">
                                                                            <div className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
                                                                            <span className={cn("text-[11px] font-semibold",
                                                                                task.priority === 'Critical' ? "text-rose-500" : "text-orange-500"
                                                                            )}>{task.priority}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleEditTask(task)}
                                                                            className="flex-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => saveQuest(task, { status: 'Done' })}
                                                                            className="flex-1 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-700 py-1.5 rounded-lg text-white transition-colors"
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
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-3 py-8">
                                            <Zap className="h-10 w-10 opacity-30" />
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Inbox empty</p>
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
