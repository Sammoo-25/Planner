"use client"

import { useState, useMemo, useEffect } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useSettingsStore } from "@/hooks/use-settings"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
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

type SortOption = 'Difficulty' | 'Status' | 'Category' | 'Title'

const PRIORITY_DOT: Record<string, string> = {
    Critical: 'bg-rose-500',
    High:     'bg-orange-500',
    Medium:   'bg-indigo-500',
    Low:      'bg-slate-400',
}

export default function CalendarPage() {
    const { tasks, updateTask, addTask, removeTask } = useTaskStore()
    const { timeZone } = useSettingsStore()
    const { saveQuest, awardTaskXp } = useQuestManager()

    const [currentDate, setCurrentDate] = useState(() => toZonedTime(new Date(), timeZone))
    const [selectedDate, setSelectedDate] = useState(() => toZonedTime(new Date(), timeZone))

    useEffect(() => {
        const zonedNow = toZonedTime(new Date(), timeZone)
        setCurrentDate(zonedNow)
        setSelectedDate(zonedNow)
    }, [timeZone])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewingDate, setViewingDate] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)
    const [sortBy, setSortBy] = useState<SortOption>('Difficulty')

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
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
                case 'Difficulty': {
                    const w = { Critical: 3, High: 2, Medium: 1, Low: 0 } as const
                    return (w[b.priority] ?? 0) - (w[a.priority] ?? 0)
                }
                case 'Status': {
                    const w = { 'In Progress': 2, 'To Do': 1, 'Done': 0 } as const
                    return (w[b.status as keyof typeof w] ?? 0) - (w[a.status as keyof typeof w] ?? 0)
                }
                case 'Category': return a.category.localeCompare(b.category)
                case 'Title':    return a.title.localeCompare(b.title)
                default: return 0
            }
        })
    }, [tasksForSelectedDate, sortBy])

    const isSelectedDateBeforeToday = isBefore(selectedDate, startOfToday())

    const handleAddNewForDate = (date: Date = selectedDate) => {
        if (isBefore(date, startOfToday())) return
        setEditingTask({
            title: "",
            category: "General",
            priority: "Medium",
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

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header */}
                <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h1 className="font-semibold text-slate-900 dark:text-white">Calendar</h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">View and manage tasks by date</p>
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
                        <button
                            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="w-36 text-center font-semibold text-sm text-slate-800 dark:text-slate-100">
                            {format(currentDate, 'MMMM yyyy')}
                        </div>
                        <button
                            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                {/* Calendar Grid */}
                <div className="flex-1 bg-white dark:bg-slate-900 m-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2.5 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid — dynamic rows (5 or 6 weeks depending on month) */}
                    <div className="flex-1 grid grid-cols-7 min-h-0" style={{ gridTemplateRows: `repeat(${Math.ceil(calendarDays.length / 7)}, 1fr)` }}>
                        {calendarDays.map((day) => {
                            const dayId = format(day, 'yyyy-MM-dd')
                            const dayTasks = tasksByDate[dayId] || []
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                            const isPast = isBefore(day, startOfToday())

                            return (
                                <TooltipProvider key={dayId}>
                                    <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <div
                                                onClick={() => {
                                                    setSelectedDate(day)
                                                    setViewingDate(true)
                                                }}
                                                className={cn(
                                                    "border-b border-r border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1 cursor-pointer transition-colors duration-100",
                                                    isPast
                                                        ? "opacity-50"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                                                    !isCurrentMonth && "opacity-35",
                                                    isToday(day) && "bg-indigo-50 dark:bg-indigo-950/30 opacity-100"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                                                    isToday(day)
                                                        ? "bg-indigo-600 text-white"
                                                        : "text-slate-700 dark:text-slate-300"
                                                )}>
                                                    {format(day, 'd')}
                                                </span>

                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                    {dayTasks.slice(0, 2).map((task) => (
                                                        <div key={task.id} className="flex items-center gap-1 min-w-0">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority] ?? 'bg-slate-400')} />
                                                            <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate leading-none font-medium">
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {dayTasks.length > 2 && (
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-2.5">
                                                            +{dayTasks.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TooltipTrigger>

                                        {dayTasks.length > 0 && (
                                            <TooltipContent side="top" className="p-0 border-none bg-transparent shadow-none" sideOffset={8}>
                                                <div className="min-w-[200px] max-w-[240px] p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                                                            {format(day, 'EEE, MMM d')}
                                                        </h4>
                                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                                                            {dayTasks.length}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {dayTasks.map(task => (
                                                            <div key={task.id} className="flex items-center gap-2">
                                                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority] ?? 'bg-slate-400')} />
                                                                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{task.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        })}
                    </div>
                </div>

                {/* Day Details Modal */}
                <Dialog open={!!viewingDate}>
                    <DialogContent
                        onClose={() => setViewingDate(false)}
                        className="sm:max-w-md bg-white dark:bg-slate-900 p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl"
                    >
                        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 flex flex-row items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                                <CalendarIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                {format(selectedDate, 'EEEE, MMMM d')}
                                {isSelectedDateBeforeToday && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
                                        Past
                                    </span>
                                )}
                            </DialogTitle>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                        <ListFilter className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                        <DropdownMenuRadioItem value="Difficulty">Priority</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Status">Status</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Category">Category</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Title">Alphabetical</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </DialogHeader>

                        <div className="p-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
                            {sortedTasks.length > 0 ? (
                                <div className="space-y-2">
                                    {sortedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setViewingTask(task)}
                                            className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                                        >
                                            <button
                                                disabled={isSelectedDateBeforeToday}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (isSelectedDateBeforeToday) return
                                                    const nextStatus = task.status === 'To Do' ? 'In Progress'
                                                        : task.status === 'In Progress' ? 'Done'
                                                            : 'To Do'
                                                    if (nextStatus === 'Done') awardTaskXp(task)
                                                    updateTask(task.id, { status: nextStatus })
                                                }}
                                                className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                    isSelectedDateBeforeToday
                                                        ? "opacity-40 cursor-not-allowed border-slate-300 dark:border-slate-600"
                                                        : task.status === 'Done'
                                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                                            : task.status === 'In Progress'
                                                                ? "border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                                                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                                                )}
                                            >
                                                {task.status === 'Done' && <CheckCircle2 className="h-4 w-4" />}
                                                {task.status === 'In Progress' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                {task.status === 'To Do' && <Circle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium text-slate-800 dark:text-slate-200 truncate",
                                                    task.status === 'Done' && "line-through opacity-50"
                                                )}>
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{task.category}</span>
                                                    <span className="text-slate-200 dark:text-slate-700">·</span>
                                                    <span className={cn(
                                                        "text-[11px] font-medium",
                                                        task.priority === 'Critical' ? "text-rose-500" :
                                                            task.priority === 'High' ? "text-orange-500" :
                                                                "text-slate-400 dark:text-slate-500"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <CalendarIcon className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No tasks for this day</p>
                                </div>
                            )}
                        </div>

                        <div className="px-5 pb-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                            <button
                                onClick={() => setViewingDate(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                            {!isSelectedDateBeforeToday && (
                                <button
                                    onClick={() => handleAddNewForDate()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Task
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
    )
}
