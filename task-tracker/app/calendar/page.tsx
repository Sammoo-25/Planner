"use client"

import { useState, useMemo, useEffect } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useSettingsStore } from "@/hooks/use-settings"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { Sidebar } from "@/components/dashboard/sidebar"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu"
import {
    ChevronLeft, ChevronRight, Plus, CheckCircle2, Loader2,
    Circle, ListFilter, CalendarDays
} from "lucide-react"
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
    addMonths, subMonths, isToday, startOfWeek, endOfWeek,
    isBefore, startOfToday
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

const PRIORITY_BAR: Record<string, string> = {
    Critical: 'bg-rose-500',
    High:     'bg-orange-500',
    Medium:   'bg-indigo-500',
    Low:      'bg-slate-300 dark:bg-slate-600',
}

export default function CalendarPage() {
    const { tasks, updateTask, addTask, removeTask } = useTaskStore()
    const { timeZone } = useSettingsStore()
    const { saveQuest, awardTaskXp } = useQuestManager()

    const [currentDate, setCurrentDate] = useState(() => toZonedTime(new Date(), timeZone))
    const [selectedDate, setSelectedDate] = useState(() => toZonedTime(new Date(), timeZone))

    useEffect(() => {
        const z = toZonedTime(new Date(), timeZone)
        setCurrentDate(z)
        setSelectedDate(z)
    }, [timeZone])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewingDate, setViewingDate] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)
    const [sortBy, setSortBy] = useState<SortOption>('Difficulty')

    const monthStart = startOfMonth(currentDate)
    const monthEnd   = endOfMonth(currentDate)
    const startDate  = startOfWeek(monthStart)
    const endDate    = endOfWeek(monthEnd)
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {}
        tasks.forEach(t => {
            const k = format(new Date(t.deadline), 'yyyy-MM-dd')
            if (!map[k]) map[k] = []
            map[k].push(t)
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
            title: "", category: "General", priority: "Medium",
            deadline: format(date, "yyyy-MM-dd'T'12:00:00"),
            status: "To Do"
        } as Task)
        setIsModalOpen(true)
    }

    const saveTask = (taskData: Partial<Task>) => {
        if (editingTask?.id) {
            saveQuest(editingTask, taskData)
        } else {
            addTask({
                title: taskData.title || "New Task",
                category: taskData.category || "General",
                priority: taskData.priority || "Medium",
                deadline: taskData.deadline || new Date().toISOString(),
                status: "To Do"
            } as Task)
        }
        setEditingTask(undefined)
        setIsModalOpen(false)
    }

    const rowCount = Math.ceil(calendarDays.length / 7)

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#07091a] font-sans overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header */}
                <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0d1526] border-b border-slate-200/60 dark:border-slate-800/50">
                    <div>
                        <h1 className="font-semibold text-slate-900 dark:text-white">Calendar</h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''} across all dates
                        </p>
                    </div>

                    {/* Month navigation */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/40">
                        <button
                            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all hover:shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="w-36 text-center text-sm font-semibold text-slate-800 dark:text-slate-200 select-none">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <button
                            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all hover:shadow-sm active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                {/* Calendar */}
                <div className="flex-1 p-4 overflow-hidden">
                    <div className="h-full bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200/60 dark:border-slate-800/50 overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="py-3 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div
                            className="flex-1 grid grid-cols-7 min-h-0"
                            style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
                        >
                            {calendarDays.map((day) => {
                                const dayId = format(day, 'yyyy-MM-dd')
                                const dayTasks = tasksByDate[dayId] || []
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                                const isPast = isBefore(day, startOfToday())
                                const today = isToday(day)
                                const hasTasks = dayTasks.length > 0

                                return (
                                    <button
                                        key={dayId}
                                        onClick={() => { setSelectedDate(day); setViewingDate(true) }}
                                        className={cn(
                                            "group flex flex-col p-2 text-left border-b border-r border-slate-100 dark:border-slate-800/40 transition-colors relative overflow-hidden min-h-0",
                                            today
                                                ? "bg-indigo-50/50 dark:bg-indigo-950/15"
                                                : isCurrentMonth && !isPast
                                                    ? "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                    : "",
                                            !isCurrentMonth && "opacity-25",
                                            isPast && !today && "opacity-40",
                                        )}
                                    >
                                        {/* Date number */}
                                        <span className={cn(
                                            "self-start h-7 w-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 transition-all select-none shrink-0",
                                            today
                                                ? "bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.45)]"
                                                : [
                                                    isCurrentMonth
                                                        ? "text-slate-700 dark:text-slate-300"
                                                        : "text-slate-300 dark:text-slate-700",
                                                    !today && "group-hover:bg-slate-100 dark:group-hover:bg-slate-700/70"
                                                ].join(' ')
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Task indicators */}
                                        {hasTasks && (
                                            <div className="flex-1 flex flex-col gap-0.5 overflow-hidden w-full">
                                                {dayTasks.slice(0, 3).map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className="flex items-center gap-1 min-w-0"
                                                    >
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full shrink-0 transition-transform group-hover:scale-110",
                                                            PRIORITY_DOT[task.priority] ?? 'bg-slate-400'
                                                        )} />
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium leading-none">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                ))}
                                                {dayTasks.length > 3 && (
                                                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold pl-2.5">
                                                        +{dayTasks.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Day Detail Modal */}
                <Dialog open={!!viewingDate} zIndex={60}>
                    <DialogContent
                        onClose={() => setViewingDate(false)}
                        className="w-full sm:max-w-md p-0 overflow-hidden"
                    >
                        {/* Modal header */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-start justify-between pr-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {format(selectedDate, 'EEEE')}
                                        </h3>
                                        {isSelectedDateBeforeToday && (
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                                Past
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {format(selectedDate, 'MMMM d, yyyy')}
                                        {sortedTasks.length > 0 && (
                                            <span className="ml-1 font-semibold text-slate-600 dark:text-slate-400">
                                                · {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sort + task list */}
                        {sortedTasks.length > 0 && (
                            <div className="flex items-center justify-between px-6 pt-3 pb-1">
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tasks</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                                            <ListFilter className="h-3.5 w-3.5" />
                                            Sort
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                            <DropdownMenuRadioItem value="Difficulty">Priority</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Status">Status</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Category">Category</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Title">Alphabetical</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        <div className="px-4 pb-4 max-h-[52vh] overflow-y-auto custom-scrollbar">
                            {sortedTasks.length > 0 ? (
                                <div className="space-y-2 pt-2">
                                    {sortedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setViewingTask(task)}
                                            className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/60 hover:shadow-sm transition-all cursor-pointer"
                                        >
                                            {/* Priority bar */}
                                            <div className={cn("h-full w-0.5 rounded-full self-stretch shrink-0 min-h-[28px]", PRIORITY_BAR[task.priority])} />

                                            {/* Status toggle */}
                                            <button
                                                disabled={isSelectedDateBeforeToday}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (isSelectedDateBeforeToday) return
                                                    const nextStatus = task.status === 'To Do' ? 'In Progress'
                                                        : task.status === 'In Progress' ? 'Done' : 'To Do'
                                                    if (nextStatus === 'Done') awardTaskXp(task)
                                                    updateTask(task.id, { status: nextStatus })
                                                }}
                                                className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                    isSelectedDateBeforeToday ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700" :
                                                        task.status === 'Done' ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_2px_6px_rgba(16,185,129,0.4)]" :
                                                            task.status === 'In Progress' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500" :
                                                                "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                                                )}
                                            >
                                                {task.status === 'Done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {task.status === 'In Progress' && <Loader2 className="h-3 w-3 animate-spin" />}
                                                {task.status === 'To Do' && <Circle className="h-3 w-3 text-slate-300 dark:text-slate-600" />}
                                            </button>

                                            {/* Content */}
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
                                                        "text-[11px] font-semibold",
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
                                <div className="py-10 text-center">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                        <CalendarDays className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No tasks for this day</p>
                                    {!isSelectedDateBeforeToday && (
                                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Add a task below</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-4 pb-5 flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                            <button
                                onClick={() => setViewingDate(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]"
                            >
                                Close
                            </button>
                            {!isSelectedDateBeforeToday && (
                                <button
                                    onClick={() => handleAddNewForDate()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                                >
                                    <Plus className="h-4 w-4" /> Add Task
                                </button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <EditTaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} task={editingTask} onSave={saveTask} onDelete={removeTask} zIndex={70} />
                <TaskDetailsModal
                    open={!!viewingTask}
                    onClose={() => setViewingTask(undefined)}
                    task={viewingTask}
                    zIndex={65}
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

