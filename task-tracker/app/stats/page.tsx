"use client"

import { useState, useMemo, useEffect } from "react"
import { useTaskStore } from "@/hooks/use-tasks"
import { useGamification } from "@/hooks/use-gamification"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell
} from "recharts"
import { format, subDays, isSameDay, startOfDay, eachDayOfInterval, isWithinInterval, subMonths } from "date-fns"
import { Trophy, Target, CalendarDays, Zap, TrendingUp, Loader2, Star, Swords, Brain, Heart, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

type TimeRange = '7d' | '30d' | 'all'

export default function StatsPage() {
    const { tasks } = useTaskStore()
    const { stats } = useGamification()
    const [timeRange, setTimeRange] = useState<TimeRange>('7d')
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)
    }, [])


    // --- Data Filtering & Preparation ---

    const filteredRangeDate = useMemo(() => {
        const now = new Date()
        if (timeRange === '7d') return subDays(now, 7)
        if (timeRange === '30d') return subMonths(now, 1)
        return new Date(0) // All time
    }, [timeRange])

    const completedTasksInRange = useMemo(() => {
        return tasks.filter(t =>
            t.status === "Done" &&
            t.completedAt &&
            new Date(t.completedAt) >= filteredRangeDate
        )
    }, [tasks, filteredRangeDate])

    // 1. Tactical Execution Flow (Volume + Category Balance)
    const executionFlowData = useMemo(() => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14
        const interval = Array.from({ length: days }).map((_, i) => subDays(new Date(), (days - 1) - i))

        return interval.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const dayQuests = tasks.filter(t =>
                t.status === 'Done' &&
                t.completedAt &&
                format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr
            )
            return {
                name: format(date, 'MMM d'),
                Work: dayQuests.filter(t => t.category === 'Work').length,
                Health: dayQuests.filter(t => t.category === 'Health').length,
                Learning: dayQuests.filter(t => t.category === 'Learning').length,
                Hobby: dayQuests.filter(t => t.category === 'Hobby').length,
                General: dayQuests.filter(t => t.category === 'General' || (t.category !== 'Work' && t.category !== 'Health' && t.category !== 'Learning' && t.category !== 'Hobby')).length,
            }
        })
    }, [tasks, timeRange])

    // Mission Success Rate
    const successRate = useMemo(() => {
        const total = completedTasksInRange.length + tasks.filter(t => t.status !== 'Done' && t.deadline && new Date(t.deadline) < startOfDay(new Date())).length
        return total === 0 ? 0 : Math.round((completedTasksInRange.length / total) * 100)
    }, [completedTasksInRange, tasks])

    // 2. RPG Attributes Logic (Radar)
    const attributeData = useMemo(() => [
        { subject: 'Willpower', A: tasks.filter(t => t.category === 'Work').length * 10, fullMark: 100 },
        { subject: 'Intellect', A: tasks.filter(t => t.category === 'Learning').length * 10, fullMark: 100 },
        { subject: 'Vitality', A: tasks.filter(t => t.category === 'Health').length * 10, fullMark: 100 },
        { subject: 'Focus', A: (stats.focusStats?.totalSessions || 0) * 15, fullMark: 100 },
        { subject: 'Discipline', A: completedTasksInRange.length * 5, fullMark: 100 },
    ], [tasks, stats.focusStats, completedTasksInRange])

    // 3. Peak Performance (Golden Hour)
    const peakHourData = useMemo(() => {
        const hours = Array.from({ length: 24 }).map((_, i) => ({ hour: i, count: 0 }))
        completedTasksInRange.forEach(t => {
            if (t.completedAt) {
                const h = new Date(t.completedAt).getHours()
                hours[h].count++
            }
        })
        return hours
            .filter(h => h.count > 0 || h.hour % 4 === 0)
            .map(h => ({
                name: `${h.hour}:00`,
                victories: h.count
            }))
    }, [completedTasksInRange])

    // 4. Achievement Logic
    const achievementList = useMemo(() => [
        { id: '1', title: 'Novice Slayer', desc: 'Complete 5 Quests', icon: Trophy, unlocked: (tasks.filter(t => t.status === 'Done').length >= 5) },
        { id: '2', title: 'Focus Master', desc: '10 Focus Sessions', icon: Timer, unlocked: ((stats.focusStats?.totalSessions || 0) >= 10) },
        { id: '3', title: 'Workaholic', desc: '10 Work Quests Done', icon: Brain, unlocked: (tasks.filter(t => t.category === 'Work' && t.status === 'Done').length >= 10) },
        { id: '4', title: 'Early Bird', desc: 'Quest done before 9AM', icon: Zap, unlocked: tasks.some(t => t.completedAt && new Date(t.completedAt).getHours() < 9) },
    ], [tasks, stats.focusStats])

    // 5. Heatmap Logic
    const heatmapDays = useMemo(() => {
        const end = new Date()
        const start = subDays(end, 83) // roughly 12 weeks
        const interval = eachDayOfInterval({ start, end })
        return interval.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const count = tasks.filter(t => t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr).length
            return { date, count }
        })
    }, [tasks])

    if (!hasMounted) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
    )

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors relative">
            <div className="relative z-10 flex w-full h-full">
            <Sidebar />

            <main className="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar">
                <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Statistics</h1>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Track your productivity over time</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start">
                        {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    timeRange === r
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Core Metrics */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    {[
                        { label: "Level", value: stats.level, icon: Trophy, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/50", detail: `Hero Rank` },
                        { label: "Focus Time", value: `${stats.focusStats?.totalMinutes || 0}m`, icon: Timer, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50", detail: `${stats.focusStats?.totalSessions || 0} sessions` },
                        { label: "Completed", value: completedTasksInRange.length, icon: Swords, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50", detail: `In period` },
                        { label: "Success Rate", value: `${successRate}%`, icon: Zap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", detail: "Completion rate" }
                    ].map((m, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", m.bg)}>
                                    <m.icon className={cn("h-5 w-5", m.color)} />
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{m.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{m.value}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{m.detail}</div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3 mb-6">
                    {/* Task Execution Flow */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 h-[400px] min-w-0 overflow-hidden">
                        <div className="p-5 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Task Completion Trend</h3>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <span className="text-[11px] text-slate-400">Work</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                                        <span className="text-[11px] text-slate-400">Learning</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={executionFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorLearning" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorHobby" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                                        <XAxis
                                            dataKey="name"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8', fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8', fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: '#ffffff',
                                                padding: '10px 14px',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                                fontSize: '11px'
                                            }}
                                            cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area type="monotone" dataKey="Work" stackId="1" stroke="#3b82f6" fill="url(#colorWork)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="Health" stackId="1" stroke="#22c55e" fill="url(#colorHealth)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="Learning" stackId="1" stroke="#a855f7" fill="url(#colorLearning)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="Hobby" stackId="1" stroke="#f59e0b" fill="url(#colorHobby)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="General" stackId="1" stroke="#94a3b8" fill="url(#colorGeneral)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Attribute Radar */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-[400px] min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Skill Distribution</h3>
                        </div>
                        <div className="flex-1 min-h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={attributeData}>
                                    <PolarGrid stroke="var(--radar-grid)" strokeOpacity={0.4} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Radar name="Stats" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3 mb-6">
                    {/* Productivity Heatmap */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Activity Heatmap</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {heatmapDays.map((d, i) => (
                                <div
                                    key={i}
                                    title={`${format(d.date, 'MMM d')}: ${d.count} tasks`}
                                    className={cn(
                                        "h-3 w-3 rounded-sm transition-transform hover:scale-125 cursor-pointer",
                                        d.count === 0 ? "bg-slate-100 dark:bg-slate-800" :
                                            d.count === 1 ? "bg-emerald-200 dark:bg-emerald-900" :
                                                d.count === 2 ? "bg-emerald-400 dark:bg-emerald-700" :
                                                    "bg-emerald-600"
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-4 text-[11px] text-slate-400">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="h-3 w-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
                                <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                                <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                                <div className="h-3 w-3 rounded-sm bg-emerald-600" />
                            </div>
                            <span>More</span>
                        </div>
                    </div>

                    {/* Peak Hour */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Peak Hours</h3>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakHourData}>
                                    <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                    <Bar dataKey="victories" fill="#6366f1" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Achievement Gallery */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Achievements</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {achievementList.map((a) => (
                            <div
                                key={a.id}
                                className={cn(
                                    "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col items-center text-center transition-all",
                                    a.unlocked ? "opacity-100" : "opacity-40 grayscale"
                                )}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center mb-3",
                                    a.unlocked ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                )}>
                                    <a.icon className="h-6 w-6" />
                                </div>
                                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">{a.title}</h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{a.desc}</p>
                                {!a.unlocked && (
                                    <div className="mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400">Locked</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            </div>
        </div>
    )
}
