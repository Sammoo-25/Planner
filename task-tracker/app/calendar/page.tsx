"use client"

import { useState, useMemo, useEffect } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useSettingsStore } from "@/hooks/use-settings"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Loader2, Circle, ListFilter } from "lucide-react"
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    startOfWeek,
    endOfWeek,
    isBefore,
    startOfToday
} from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { cn } from "@/lib/utils"
import { Task } from "@/types"

export default function CalendarPage() {
    const { tasks, updateTask, addTask, removeTask } = useTaskStore()
    const { timeZone } = useSettingsStore()
    const { saveQuest } = useQuestManager()

    // Initialize with zoned time
    const [currentDate, setCurrentDate] = useState(() => toZonedTime(new Date(), timeZone))
    const [selectedDate, setSelectedDate] = useState(() => toZonedTime(new Date(), timeZone))

    // Update dates when timeZone changes
    useEffect(() => {
        const zonedNow = toZonedTime(new Date(), timeZone)
        setCurrentDate(zonedNow)
        setSelectedDate(zonedNow)
    }, [timeZone])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewingDate, setViewingDate] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)

    // Sorting State
    type SortOption = 'Difficulty' | 'Status' | 'Category' | 'Title'
    const [sortBy, setSortBy] = useState<SortOption>('Difficulty')

    // Calendar Math
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    // Create the full grid of days including padding days from prev/next months
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {}
        tasks.forEach(task => {
            const dateStr = format(new Date(task.deadline), 'yyyy-MM-dd')
            if (!map[dateStr]) map[dateStr] = []
            map[dateStr].push(task)
        })
        return map
    }, [tasks])

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    const tasksForSelectedDate = tasksByDate[selectedDateStr] || []

    const sortedTasks = useMemo(() => {
        return [...tasksForSelectedDate].sort((a, b) => {
            switch (sortBy) {
                case 'Difficulty':
                    const priorityWeight = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 }
                    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
                case 'Status':
                    // Sort: In Progress > To Do > Done
                    const statusWeight = { 'In Progress': 2, 'To Do': 1, 'Done': 0 }
                    return (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0)
                case 'Category':
                    return a.category.localeCompare(b.category)
                case 'Title':
                    return a.title.localeCompare(b.title)
                default:
                    return 0
            }
        })
    }, [tasksForSelectedDate, sortBy])

    const isSelectedDateBeforeToday = isBefore(selectedDate, startOfToday())

    // Handlers
    const handleAddNewForDate = (date: Date = selectedDate) => {
        // Double check safety, though button should be hidden
        if (isBefore(date, startOfToday())) return

        setEditingTask({
            title: "",
            category: "General",
            priority: "Medium",
            // Use local date string construction to avoid timezone shifts when defaulting
            deadline: format(date, "yyyy-MM-dd'T'12:00:00"),
            status: "To Do"
        } as Task)
        setIsModalOpen(true)
    }

    const saveTask = (taskData: Partial<Task>) => {
        if (editingTask && editingTask.id) {
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'bg-red-500'
            case 'High': return 'bg-orange-500'
            case 'Medium': return 'bg-blue-500'
            default: return 'bg-slate-400'
        }
    }

    return (
        <div className="flex min-h-screen bg-transparent font-sans text-stone-900 transition-colors relative">
            <div className="relative z-10 flex w-full h-full">
            <Sidebar />

            <main className="flex-1 p-6 lg:p-10 flex flex-col h-screen overflow-hidden">
                <header className="mb-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-stone-800 tracking-tight">Plan your battles.</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-stone-900 text-white rounded-xl overflow-hidden shadow-lg p-1">
                            <button
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                className="p-2 hover:bg-stone-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="w-40 text-center font-bold text-lg">
                                {format(currentDate, 'MMMM yyyy')}
                            </div>
                            <button
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                className="p-2 hover:bg-stone-700 rounded-lg transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Calendar Grid Container */}
                <div className="flex-1 bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 p-4 transition-colors duration-500 overflow-hidden flex flex-col">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4 px-2">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase pl-3">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 grid-rows-5 gap-3 flex-1 min-h-0">
                        {calendarDays.slice(0, 35).map((day, idx) => { // Force 5 rows for aesthetics or handle dynamic rows
                            const dayId = format(day, 'yyyy-MM-dd')
                            const dayTasks = tasksByDate[dayId] || []
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                            const isPast = isBefore(day, startOfToday())

                            return (
                                <TooltipProvider key={dayId}>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <div
                                                onClick={() => {
                                                    setSelectedDate(day)
                                                    setViewingDate(true)
                                                }}
                                                className={cn(
                                                    "group relative rounded-3xl p-3 flex flex-col justify-between transition-all duration-300 ease-out cursor-pointer border-2",
                                                    isPast
                                                        ? "bg-white/5 border-transparent opacity-60 grayscale hover:opacity-80"
                                                        : isCurrentMonth
                                                            ? "bg-white/20 dark:bg-white/5 backdrop-blur-md border-transparent shadow-sm hover:shadow-xl hover:scale-[1.05] hover:z-20 hover:border-white/40"
                                                            : "bg-transparent border-transparent opacity-50 hover:opacity-100",
                                                    isToday(day) && "ring-2 ring-offset-2 ring-stone-900 dark:ring-white dark:ring-offset-[#18181b] z-10",
                                                )}
                                            >
                                                {/* Date Number */}
                                                <div className="flex justify-between items-start">
                                                    <span className={cn(
                                                        "text-sm font-black",
                                                        isToday(day) ? "text-stone-900 dark:text-white" : "text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white"
                                                    )}>
                                                        {format(day, 'd')}
                                                    </span>
                                                    {/* Plus button on hover */}
                                                    {!isPast && (
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 rounded-full p-1">
                                                            <Plus className="h-3 w-3 text-stone-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Visual Indicators (Text/Dots) - UPDATED */}
                                                <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1 px-1">
                                                    {dayTasks.slice(0, 3).map((task) => (
                                                        <div key={task.id} className="flex items-center gap-1.5 bg-stone-100/50 rounded-sm px-1 py-0.5 max-w-full">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", getPriorityColor(task.priority))} />
                                                            <span className="text-[9px] font-bold text-stone-600 truncate leading-none">
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {dayTasks.length > 3 && (
                                                        <div className="text-[8px] font-bold text-stone-400 pl-1">
                                                            +{dayTasks.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TooltipTrigger>

                                        {/* Hover Content */}
                                        <TooltipContent side="top" className="p-0 border-none bg-transparent shadow-none" sideOffset={15}>
                                            <div className="min-w-[220px] max-w-[260px] p-4 bg-white rounded-2xl shadow-xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="font-bold text-sm text-stone-900">
                                                        {format(day, 'EEEE, MMM do')}
                                                    </h4>
                                                    {dayTasks.length > 0 && <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">{dayTasks.length}</span>}
                                                </div>

                                                {dayTasks.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {dayTasks.map(task => (
                                                            <div
                                                                key={task.id}
                                                                className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setViewingTask(task)
                                                                }}
                                                            >
                                                                <div className={cn("h-2 w-2 rounded-full shrink-0", getPriorityColor(task.priority))} />
                                                                <div className="flex-1 min-w-0 flex flex-col">
                                                                    <span className="text-xs font-bold text-stone-700 truncate">{task.title}</span>
                                                                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{task.category}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] uppercase tracking-widest text-stone-300 font-bold text-center py-2">No active battles</p>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        })}
                    </div>
                </div>

                {/* Day Details Modal */}
                <Dialog open={!!viewingDate}>
                    <DialogContent onClose={() => setViewingDate(false)} className="sm:max-w-md bg-white dark:bg-[#18181b] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-white/10 flex flex-row items-center justify-between">
                            <DialogTitle className="flex items-center gap-3 text-stone-900 dark:text-white font-black text-xl">
                                <CalendarIcon className="h-6 w-6 text-stone-400 dark:text-stone-500" />
                                {format(selectedDate, 'EEEE, MMMM d')}
                                {isSelectedDateBeforeToday && <span className="text-[10px] bg-stone-100 dark:bg-white/10 text-stone-400 dark:text-stone-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Expired</span>}
                            </DialogTitle>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:bg-stone-100 rounded-full transition-colors outline-none">
                                        <ListFilter className="h-5 w-5 text-stone-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Sort Battles By</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                        <DropdownMenuRadioItem value="Difficulty">Difficulty (Priority)</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Status">Status</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Category">Category</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Title">Alphabetical</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </DialogHeader>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {sortedTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setViewingTask(task)}
                                            className="group flex items-center justify-between p-4 rounded-2xl border border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 hover:bg-stone-50 dark:hover:bg-white/10 hover:border-stone-200 dark:hover:border-white/10 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <button
                                                    disabled={isSelectedDateBeforeToday}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (isSelectedDateBeforeToday) return;

                                                        const nextStatus = task.status === 'To Do' ? 'In Progress'
                                                            : task.status === 'In Progress' ? 'Done'
                                                                : 'To Do'

                                                        // Award XP if completing
                                                        if (nextStatus === 'Done') {
                                                            // We might need to call awardTaskXp from useQuestManager if available,
                                                            // but basic status update is requested here.
                                                            // The user didn't explicitly ask for XP hook integration here, closely following visual request.
                                                        }

                                                        updateTask(task.id, { status: nextStatus })
                                                    }}
                                                    className={cn(
                                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                                        isSelectedDateBeforeToday ? "opacity-50 cursor-not-allowed border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-white/5 text-stone-300 dark:text-stone-500" :
                                                            task.status === 'Done' ? "bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-200 dark:shadow-green-900/50" :
                                                                task.status === 'In Progress' ? "bg-blue-100 dark:bg-blue-500/20 border-blue-500 text-blue-500 scale-105 shadow-md shadow-blue-100 dark:shadow-blue-900/30" :
                                                                    "bg-transparent border-stone-300 dark:border-stone-600 text-stone-300 dark:text-stone-600 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-400 dark:hover:text-stone-500 hover:bg-stone-50 dark:hover:bg-white/5"
                                                    )}
                                                >
                                                    {task.status === 'Done' && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                    {task.status === 'In Progress' && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {task.status === 'To Do' && <Circle className="h-4 w-4" />}
                                                </button>
                                                <div>
                                                    <p className={cn("font-extrabold text-stone-900 dark:text-stone-100 text-base", task.status === 'Done' ? "line-through opacity-40" : "")}>{task.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{task.category}</span>
                                                        <span className="text-stone-300">•</span>
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            task.priority === 'Critical' ? "text-red-500" :
                                                                task.priority === 'High' ? "text-orange-500" : "text-stone-400"
                                                        )}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-stone-400 font-medium">No tasks for this day.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-stone-100 dark:border-white/10 flex gap-3">
                            <button
                                onClick={() => setViewingDate(false)}
                                className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-stone-500 dark:text-stone-400 font-bold hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Close
                            </button>
                            {!isSelectedDateBeforeToday && (
                                <button
                                    onClick={() => handleAddNewForDate()}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Quest
                                </button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <EditTaskModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    task={editingTask}
                    onSave={saveTask}
                    onDelete={removeTask}
                    zIndex={70}
                />
                <TaskDetailsModal
                    open={!!viewingTask}
                    onClose={() => setViewingTask(undefined)}
                    task={viewingTask}
                    zIndex={60}
                    onEdit={viewingTask && isBefore(new Date(viewingTask.deadline), startOfToday()) ? undefined : (t) => {
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
