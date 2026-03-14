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

    useState(() => {
        setHasMounted(true)
    })

    // OR use useEffect which is safer for hydration
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
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    )

    return (
        <div className="flex min-h-screen bg-transparent dark:bg-transparent font-sans text-dark-900 transition-colors relative">
            <div className="relative z-10 flex w-full h-full">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-dark-900 dark:text-white flex items-center gap-3">
                            <Star className="h-8 w-8 text-orange-400 fill-orange-400" />
                            Hero's Log
                        </h1>
                        <p className="text-dark-500 mt-2 font-medium">Your legend, recorded in eternity.</p>
                    </div>

                    <div className="flex bg-white/20 dark:bg-dark-800/20 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm self-start border border-white/20 dark:border-white/10">
                        {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    timeRange === r
                                        ? "bg-dark-900 text-white dark:bg-white dark:text-dark-900 shadow-lg"
                                        : "text-dark-600 hover:text-dark-900 dark:text-dark-300 dark:hover:text-white"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Core Metrics */}
                <div className="grid gap-6 md:grid-cols-4 mb-10">
                    {[
                        { label: "Level", value: stats.level, icon: Trophy, color: "text-orange-500", detail: `Rank: Elite Hero` },
                        { label: "Focus Energy", value: `${stats.focusStats?.totalMinutes || 0}m`, icon: Timer, color: "text-blue-500", detail: `${stats.focusStats?.totalSessions || 0} Sessions` },
                        { label: "Battles Won", value: completedTasksInRange.length, icon: Swords, color: "text-red-500", detail: `In this era` },
                        { label: "Survival Rate", value: `${successRate}%`, icon: Zap, color: "text-emerald-500", detail: "Quest Success" }
                    ].map((m, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between group hover:scale-[1.02] transition-all bg-white/20 dark:bg-dark-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-2xl bg-sand-50 dark:bg-dark-700/50", m.color)}>
                                    <m.icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-dark-300 group-hover:text-dark-500 transition-colors">
                                    {m.label}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-dark-900 dark:text-white tracking-tight">{m.value}</h3>
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-tighter mt-1">{m.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3 mb-10">
                    {/* Tactical Execution Flow */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-[2rem] border border-white/20 dark:border-white/10 shadow-2xl bg-white/20 dark:bg-dark-800/20 backdrop-blur-3xl h-[450px] min-w-0 group">
                        {/* Decorative Background Blurs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                        <div className="p-8 h-full flex flex-col relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black flex items-center gap-2 text-dark-900 dark:text-white">
                                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        Tactical Execution Flow
                                    </h3>
                                    <p className="text-xs font-bold text-dark-400 mt-1 ml-11 uppercase tracking-wide">Volume & Balance Analysis</p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Legend */}
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sand-50 dark:bg-dark-900/50 border border-sand-100 dark:border-dark-700/50">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-bold text-dark-500 uppercase">Work</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sand-50 dark:bg-dark-900/50 border border-sand-100 dark:border-dark-700/50">
                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="text-[10px] font-bold text-dark-500 uppercase">Learning</span>
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
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                backdropFilter: 'blur(8px)',
                                                padding: '12px',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                            }}
                                            itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
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
                    <div className="card-premium p-8 flex flex-col h-[450px] min-w-0 bg-white/20 dark:bg-dark-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl">
                        <h3 className="text-xl font-bold mb-6 text-dark-900 dark:text-white text-center">Hero's Core Potential</h3>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={attributeData}>
                                    <PolarGrid stroke="var(--radar-grid)" strokeOpacity={0.5} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Radar name="Stats" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-center text-dark-400 font-black uppercase tracking-widest mt-4">
                            Balanced growth leads to legendary status.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Productivity Heatmap */}
                    <div className="lg:col-span-2 card-premium p-8 bg-white/20 dark:bg-dark-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                            <CalendarDays className="h-5 w-5 text-green-500" />
                            Daily Battle Intensity
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {heatmapDays.map((d, i) => (
                                <div
                                    key={i}
                                    title={`${format(d.date, 'MMM d')}: ${d.count} quests`}
                                    className={cn(
                                        "h-3.5 w-3.5 rounded-sm transition-all hover:scale-150 cursor-pointer",
                                        d.count === 0 ? "bg-sand-200 dark:bg-dark-700" :
                                            d.count === 1 ? "bg-green-200" :
                                                d.count === 2 ? "bg-green-400" :
                                                    "bg-green-600"
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex justify-center gap-4 mt-6 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                            <span>Peaceful</span>
                            <div className="flex gap-1">
                                <div className="h-3 w-3 rounded-sm bg-sand-200 dark:bg-dark-700" />
                                <div className="h-3 w-3 rounded-sm bg-green-200" />
                                <div className="h-3 w-3 rounded-sm bg-green-400" />
                                <div className="h-3 w-3 rounded-sm bg-green-600" />
                            </div>
                            <span>Warzone</span>
                        </div>
                    </div>

                    {/* Peak Hour */}
                    <div className="card-premium p-8 h-full bg-white/20 dark:bg-dark-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            The Golden Hour
                        </h3>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakHourData}>
                                    <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} />
                                    <Bar dataKey="victories" fill="#eab308" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-center mt-4 text-dark-400 font-bold uppercase tracking-widest leading-loose">
                            Your performance peaks during the early hunts.
                        </p>
                    </div>
                </div>

                {/* Achievement Gallery */}
                <div className="mt-10 mb-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                        Achievement Gallery
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {achievementList.map((a) => (
                            <div
                                key={a.id}
                                className={cn(
                                    "card-premium p-6 border-0 flex flex-col items-center text-center transition-all bg-white/20 dark:bg-dark-800/20 backdrop-blur-xl shadow-xl border-white/20 dark:border-white/10 border",
                                    a.unlocked ? "opacity-100 hover:scale-105" : "opacity-30 grayscale saturate-0"
                                )}
                            >
                                <div className={cn(
                                    "h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-inner",
                                    a.unlocked ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40" : "bg-sand-100 text-dark-400"
                                )}>
                                    <a.icon className="h-8 w-8" />
                                </div>
                                <h4 className="text-sm font-black text-dark-900 dark:text-white mb-1 uppercase tracking-tight">{a.title}</h4>
                                <p className="text-[10px] font-bold text-dark-500 uppercase tracking-tighter leading-tight">{a.desc}</p>
                                {!a.unlocked && (
                                    <div className="mt-4 px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-700 text-[8px] font-black uppercase text-dark-400">Locked</div>
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
