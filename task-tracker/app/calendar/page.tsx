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
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    addMonths, subMonths, isToday, startOfWeek, endOfWeek,
    isBefore, startOfToday
} from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { cn } from "@/lib/utils"
import { Task } from "@/types"

type SortOption = 'Difficulty' | 'Status' | 'Category' | 'Title'

const PRIORITY_DOT: Record<string, string> = {
    Critical: 'bg-rose-500',
    High:     'bg-orange-400',
    Medium:   'bg-indigo-400',
    Low:      'bg-slate-300 dark:bg-slate-600',
}

const PRIORITY_CHIP_BG: Record<string, string> = {
    Critical: 'bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
    High:     'bg-orange-100/80 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
    Medium:   'bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    Low:      'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
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

    const monthStart   = startOfMonth(currentDate)
    const monthEnd     = endOfMonth(currentDate)
    const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })

    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {}
        tasks.forEach(t => {
            const k = format(new Date(t.deadline), 'yyyy-MM-dd')
            if (!map[k]) map[k] = []
            map[k].push(t)
        })
        return map
    }, [tasks])

    const selectedDateStr        = format(selectedDate, 'yyyy-MM-dd')
    const tasksForSelectedDate   = tasksByDate[selectedDateStr] || []
    const isSelectedBeforeToday  = isBefore(selectedDate, startOfToday())

    // Total tasks in the current month
    const monthTaskCount = useMemo(() => {
        return calendarDays.reduce((n, d) => {
            if (d.getMonth() !== currentDate.getMonth()) return n
            return n + (tasksByDate[format(d, 'yyyy-MM-dd')]?.length ?? 0)
        }, 0)
    }, [calendarDays, tasksByDate, currentDate])

    const sortedTasks = useMemo(() => {
        return [...tasksForSelectedDate].sort((a, b) => {
            switch (sortBy) {
                case 'Difficulty': { const w = { Critical: 3, High: 2, Medium: 1, Low: 0 } as const; return (w[b.priority] ?? 0) - (w[a.priority] ?? 0) }
                case 'Status':     { const w = { 'In Progress': 2, 'To Do': 1, 'Done': 0 } as const; return (w[b.status as keyof typeof w] ?? 0) - (w[a.status as keyof typeof w] ?? 0) }
                case 'Category':   return a.category.localeCompare(b.category)
                case 'Title':      return a.title.localeCompare(b.title)
                default:           return 0
            }
        })
    }, [tasksForSelectedDate, sortBy])

    const handleAddNewForDate = (date: Date = selectedDate) => {
        if (isBefore(date, startOfToday())) return
        setEditingTask({ title: "", category: "General", priority: "Medium", deadline: format(date, "yyyy-MM-dd'T'12:00:00"), status: "To Do" } as Task)
        setIsModalOpen(true)
    }

    const saveTask = (taskData: Partial<Task>) => {
        if (editingTask?.id) { saveQuest(editingTask, taskData) }
        else { addTask({ title: taskData.title || "New Task", category: taskData.category || "General", priority: taskData.priority || "Medium", deadline: taskData.deadline || new Date().toISOString(), status: "To Do" } as Task) }
        setEditingTask(undefined)
        setIsModalOpen(false)
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-[#07091a] dark:via-[#07091a] dark:to-[#060b1f] font-sans overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* ── Header ───────────────────────────────────── */}
                <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#0d1526]/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/40">
                    {/* Month + year */}
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                            {format(currentDate, 'MMMM')}
                        </h1>
                        <span className="text-base font-semibold text-slate-400 dark:text-slate-500 leading-none">
                            {format(currentDate, 'yyyy')}
                        </span>
                        {monthTaskCount > 0 && (
                            <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                                {monthTaskCount} tasks
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Today shortcut */}
                        <button
                            onClick={() => setCurrentDate(toZonedTime(new Date(), timeZone))}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors"
                        >
                            Today
                        </button>

                        {/* Month navigation */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-700/40">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-90">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-90">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Add task */}
                        <button
                            onClick={() => handleAddNewForDate(toZonedTime(new Date(), timeZone))}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(99,102,241,0.35)] active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Task
                        </button>
                    </div>
                </header>

                {/* ── Calendar body ─────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest py-1.5">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells — individual floating cards */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {calendarDays.map((day) => {
                            const dayId          = format(day, 'yyyy-MM-dd')
                            const dayTasks       = tasksByDate[dayId] || []
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                            const isPast         = isBefore(day, startOfToday())
                            const today          = isToday(day)
                            const hasTasks       = dayTasks.length > 0
                            const hasUrgent      = dayTasks.some(t => t.priority === 'Critical')
                            const hasHigh        = dayTasks.some(t => t.priority === 'High')
                            const allDone        = hasTasks && dayTasks.every(t => t.status === 'Done')

                            return (
                                <button
                                    key={dayId}
                                    onClick={() => { setSelectedDate(day); setViewingDate(true) }}
                                    className={cn(
                                        "relative flex flex-col p-2.5 rounded-2xl transition-all duration-200 text-left min-h-[90px] group cursor-pointer",

                                        // Today: gradient hero card
                                        today && [
                                            "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700",
                                            "shadow-[0_8px_24px_rgba(99,102,241,0.45),0_2px_8px_rgba(99,102,241,0.25)]",
                                            "hover:shadow-[0_12px_32px_rgba(99,102,241,0.55),0_4px_12px_rgba(99,102,241,0.3)]",
                                            "hover:-translate-y-1.5 hover:scale-[1.02]",
                                        ].join(' '),

                                        // Urgent tasks: rose glow card
                                        !today && hasUrgent && !isPast && [
                                            "bg-white dark:bg-[#161f33]",
                                            "ring-1 ring-rose-400/40 dark:ring-rose-500/25",
                                            "shadow-[0_2px_8px_rgba(244,63,94,0.10)]",
                                            "hover:shadow-[0_8px_24px_rgba(244,63,94,0.20)]",
                                            "hover:-translate-y-1.5 hover:scale-[1.01]",
                                            "border border-rose-200/40 dark:border-rose-800/30",
                                        ].join(' '),

                                        // All tasks done: emerald tint
                                        !today && allDone && [
                                            "bg-emerald-50/60 dark:bg-emerald-950/15",
                                            "border border-emerald-200/50 dark:border-emerald-800/25",
                                            "hover:-translate-y-1 hover:scale-[1.01]",
                                            "hover:shadow-[0_4px_14px_rgba(16,185,129,0.12)]",
                                        ].join(' '),

                                        // Regular with tasks
                                        !today && hasTasks && !hasUrgent && !allDone && [
                                            "bg-white dark:bg-[#111e35]",
                                            "border border-slate-200/60 dark:border-slate-700/40",
                                            "shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
                                            "hover:shadow-[0_8px_20px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.40)]",
                                            "hover:-translate-y-1.5 hover:scale-[1.01]",
                                        ].join(' '),

                                        // Empty future/present
                                        !today && !hasTasks && !isPast && [
                                            "bg-white/50 dark:bg-[#0d1526]/50",
                                            "border border-slate-100/70 dark:border-slate-800/30",
                                            "hover:bg-white dark:hover:bg-[#111e35]",
                                            "hover:border-slate-200/80 dark:hover:border-slate-700/50",
                                            "hover:-translate-y-1 hover:scale-[1.01]",
                                            "hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)]",
                                        ].join(' '),

                                        // Past — still show subtle hover so they feel interactive
                                        isPast && !today && [
                                            "opacity-45 saturate-50",
                                            "hover:opacity-65 hover:saturate-75",
                                            "hover:-translate-y-0.5 hover:shadow-sm",
                                        ].join(' '),

                                        // Other month
                                        !isCurrentMonth && "!opacity-15",
                                    )}
                                >
                                    {/* Date number */}
                                    <div className="flex items-start justify-between mb-1">
                                        <span className={cn(
                                            "text-sm font-black leading-none select-none",
                                            today
                                                ? "text-white"
                                                : isCurrentMonth
                                                    ? "text-slate-800 dark:text-slate-100"
                                                    : "text-slate-300 dark:text-slate-700"
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Task count badge */}
                                        {hasTasks && !today && (
                                            <span className={cn(
                                                "text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center leading-none shrink-0",
                                                hasUrgent
                                                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                                                    : allDone
                                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                                            )}>
                                                {dayTasks.length}
                                            </span>
                                        )}

                                        {/* Today badge in cell */}
                                        {today && dayTasks.length > 0 && (
                                            <span className="text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full bg-white/25 text-white flex items-center justify-center leading-none">
                                                {dayTasks.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Task chips */}
                                    {hasTasks && (
                                        <div className="flex flex-col gap-0.5 mt-auto overflow-hidden">
                                            {dayTasks.slice(0, 2).map(task => (
                                                <div
                                                    key={task.id}
                                                    className={cn(
                                                        "flex items-center gap-1 px-1.5 py-[3px] rounded-md overflow-hidden",
                                                        today
                                                            ? "bg-white/20"
                                                            : PRIORITY_CHIP_BG[task.priority]
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-1 w-1 rounded-full shrink-0",
                                                        today ? "bg-white" : PRIORITY_DOT[task.priority]
                                                    )} />
                                                    <span className={cn(
                                                        "text-[9px] font-semibold truncate leading-none",
                                                        today ? "text-white" : ""
                                                    )}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                            ))}
                                            {dayTasks.length > 2 && (
                                                <span className={cn(
                                                    "text-[9px] font-bold pl-1.5",
                                                    today ? "text-white/70" : "text-slate-400 dark:text-slate-500"
                                                )}>
                                                    +{dayTasks.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Hover "+" hint on empty future days */}
                                    {!hasTasks && !isPast && !today && isCurrentMonth && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                            <span className="text-slate-300 dark:text-slate-600 text-lg font-light">+</span>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Month legend */}
                    <div className="flex items-center justify-center gap-5 mt-4 mb-1 text-[11px] text-slate-400 dark:text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600" />
                            <span>Today</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-md bg-rose-100 dark:bg-rose-950/60 ring-1 ring-rose-300/50" />
                            <span>Critical</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/15 ring-1 ring-emerald-200/50 dark:ring-emerald-800/25" />
                            <span>All done</span>
                        </div>
                    </div>
                </div>

                {/* ── Day Detail Modal ──────────────────────────── */}
                <Dialog open={!!viewingDate} zIndex={60}>
                    <DialogContent onClose={() => setViewingDate(false)} className="w-full sm:max-w-md p-0 overflow-hidden">

                        {/* Modal header — gradient accent top bar */}
                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-t-2xl" />

                        <div className="px-6 pt-5 pb-4">
                            <div className="flex items-start justify-between pr-8">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {format(selectedDate, 'EEEE')}
                                        </h3>
                                        {isSelectedBeforeToday && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                                Past
                                            </span>
                                        )}
                                        {isToday(selectedDate) && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                                Today
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 dark:text-slate-500">
                                        {format(selectedDate, 'MMMM d, yyyy')}
                                        {sortedTasks.length > 0 && (
                                            <span className="ml-2 font-semibold text-slate-600 dark:text-slate-400">
                                                {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sort bar */}
                        {sortedTasks.length > 0 && (
                            <div className="flex items-center justify-between px-6 pb-2">
                                <div className="flex gap-1.5">
                                    {['Critical', 'High', 'Medium'].map(p => {
                                        const count = sortedTasks.filter(t => t.priority === p).length
                                        if (!count) return null
                                        return (
                                            <span key={p} className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", PRIORITY_CHIP_BG[p])}>
                                                {count} {p}
                                            </span>
                                        )
                                    })}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                                            <ListFilter className="h-3.5 w-3.5" /> Sort
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

                        {/* Task list */}
                        <div className="px-4 max-h-[50vh] overflow-y-auto custom-scrollbar pb-2">
                            {sortedTasks.length > 0 ? (
                                <div className="space-y-2">
                                    {sortedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setViewingTask(task)}
                                            className="group relative flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0d1526] hover:bg-slate-50/80 dark:hover:bg-[#111e35] hover:border-slate-200/80 dark:hover:border-slate-700/60 hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                                        >
                                            {/* Priority left bar */}
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full", PRIORITY_BAR[task.priority])} />

                                            {/* Status toggle */}
                                            <button
                                                disabled={isSelectedBeforeToday}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (isSelectedBeforeToday) return
                                                    const next = task.status === 'To Do' ? 'In Progress' : task.status === 'In Progress' ? 'Done' : 'To Do'
                                                    if (next === 'Done') awardTaskXp(task)
                                                    updateTask(task.id, { status: next })
                                                }}
                                                className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 active:scale-90",
                                                    isSelectedBeforeToday
                                                        ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700"
                                                        : task.status === 'Done'
                                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.45)]"
                                                            : task.status === 'In Progress'
                                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500"
                                                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                                                )}
                                            >
                                                {task.status === 'Done'        && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {task.status === 'In Progress' && <Loader2 className="h-3 w-3 animate-spin" />}
                                                {task.status === 'To Do'       && <Circle className="h-3 w-3 text-slate-300 dark:text-slate-600" />}
                                            </button>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-semibold text-slate-800 dark:text-slate-100 truncate", task.status === 'Done' && "line-through opacity-40")}>
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{task.category}</span>
                                                    <span className="text-slate-200 dark:text-slate-700">·</span>
                                                    <span className={cn(
                                                        "text-[11px] font-bold",
                                                        task.priority === 'Critical' ? "text-rose-500" :
                                                        task.priority === 'High'     ? "text-orange-500" :
                                                        task.priority === 'Medium'   ? "text-indigo-500 dark:text-indigo-400" :
                                                                                       "text-slate-400"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-[#111e35] border border-slate-200/60 dark:border-slate-700/40 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <CalendarDays className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No tasks for this day</p>
                                    {!isSelectedBeforeToday && (
                                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Click Add Task to get started</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-4 pb-5 pt-3 flex gap-2 border-t border-slate-100 dark:border-slate-800/40">
                            <button
                                onClick={() => setViewingDate(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-[0.98]"
                            >
                                Close
                            </button>
                            {!isSelectedBeforeToday && (
                                <button
                                    onClick={() => handleAddNewForDate()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_2px_10px_rgba(99,102,241,0.35)]"
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
                        setViewingTask(undefined); setEditingTask(t); setIsModalOpen(true)
                    }}
                />
            </main>
        </div>
    )
}

