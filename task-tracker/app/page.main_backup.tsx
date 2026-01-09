"use client"

import { useState, useCallback, useEffect } from "react"
import { useGamification } from "@/hooks/use-gamification"
import { useTaskStore } from "@/hooks/use-tasks"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/dashboard/sidebar"
import { PlayerStats } from "@/components/dashboard/player-stats"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Task } from "@/types"
import { Plus, Sword, ScrollText, Target, Flame, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFocus } from "@/context/FocusContext"
import { getHeroRank } from "@/lib/hero-rank-utils"
import { XpNotifier } from "@/components/dashboard/xp-notifier"


export default function Dashboard() {
    const { tasks, addTask, updateTask, removeTask, isLoaded } = useTaskStore()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)

    const { openModal } = useFocus()

    const router = useRouter()
    const { user, logout } = useAuth()

    const { addExp, heal, stats } = useGamification()

    const { toggleTaskStatus, saveQuest } = useQuestManager()

    // Filter Tasks
    const activeTasks = tasks.filter(t => t.status !== "Done")
    const completedTasks = tasks.filter(t => t.status === "Done")

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
        <div className="flex min-h-screen bg-sand-100 font-sans text-dark-900 dark:bg-dark-950 transition-colors">
            <Sidebar />
            <XpNotifier />

            <main className="flex-1 p-8 overflow-auto">
                {/* Modern Hero Hub Header */}
                <div className="relative mb-12 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-8 text-white shadow-2xl dark:border-white/10 dark:from-black dark:via-dark-950 dark:to-black">
                    {/* Background Decorative Element */}
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                        {/* Hero Avatar */}
                        <div className="relative h-40 w-40 flex-shrink-0 group">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-orange-500 blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative h-full w-full rounded-full border-4 border-white/20 overflow-hidden bg-dark-800">
                                <img
                                    src={stats.avatarUrl}
                                    alt="Hero Avatar"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-white dark:bg-dark-800 flex items-center justify-center border-2 border-dark-900 shadow-xl">
                                {(() => {
                                    const RankIcon = getHeroRank(stats.level).icon;
                                    return <RankIcon className="h-6 w-6 text-dark-900 dark:text-yellow-400" />;
                                })()}
                            </div>
                        </div>

                        {/* Hero Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="mb-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-4xl font-black tracking-tight">{user?.name || (stats.level < 10 ? "Young Traveler" : "Legendary Hero")}</h1>
                                <span className={`px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm font-bold uppercase tracking-wider ${getHeroRank(stats.level).color}`}>
                                    {getHeroRank(stats.level).title}
                                </span>
                            </div>
                            <p className="max-w-xl text-blue-100/70 mb-6 italic text-lg line-clamp-2">
                                "The path of greatness is paved with finished quests. Today, we conquer."
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            alert("You must be signed in to create quests!");
                                            return;
                                        }
                                        setEditingTask(undefined);
                                        setIsModalOpen(true);
                                    }}
                                    className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-dark-900 shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                                    <span className="font-bold">Forge New Quest</span>
                                </button>
                                <button
                                    onClick={() => document.getElementById('xp-tome')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-white backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all"
                                >
                                    <ScrollText className="h-5 w-5" />
                                    <span className="font-bold text-sm">Tome of Knowledge</span>
                                </button>
                            </div>
                        </div>

                        {/* Level & XP Mini Widget */}
                        <div className="w-full md:w-64 space-y-4">
                            <div className="glass-premium p-4 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-black uppercase text-blue-200/50">Experience</span>
                                    <span className="font-mono text-sm">{stats.currentExp} / {stats.maxExp}</span>
                                </div>
                                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-1000"
                                        style={{ width: `${(stats.currentExp / stats.maxExp) * 100}%` }}
                                    />
                                </div>
                                <div className="mt-2 text-center">
                                    <span className="text-2xl font-black text-white">LVL {stats.level}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Quest List (Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black flex items-center gap-3 text-dark-900 dark:text-white">
                                    <Sword className="h-6 w-6 text-status-high" />
                                    Active Quests
                                </h2>
                                <div className="px-3 py-1 rounded-lg bg-sand-200 dark:bg-dark-800 text-xs font-bold text-dark-500">
                                    {activeTasks.length} CHALLENGES
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {activeTasks.length > 0 ? (
                                    activeTasks.map(task => (
                                        <div key={task.id} className="group relative">
                                            <div onClick={() => setViewingTask(task)} className="cursor-pointer">
                                                <TaskItem
                                                    task={task}
                                                    onComplete={(id: string) => handleCompleteTask(id)}
                                                    onEdit={(t: Task) => { setEditingTask(t); setIsModalOpen(true); }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-16 text-center border-2 border-dashed border-sand-300 rounded-3xl bg-sand-50/50 dark:bg-dark-900/50 dark:border-dark-800 transition-colors">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-sand-200 dark:bg-dark-800 flex items-center justify-center mb-4">
                                            <Trophy className="h-8 w-8 text-dark-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1">Rest, Hero</h3>
                                        <p className="text-dark-500">All threats have been neutralized. For now.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Tome of Knowledge Section */}
                        <section id="xp-tome" className="glass-premium p-8 rounded-3xl border border-sand-300 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 backdrop-blur-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                                <ScrollText className="h-5 w-5 text-orange-500" />
                                Tome of Knowledge: XP Rewards
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-6">
                                <div className="p-4 rounded-2xl bg-white dark:bg-dark-800 border border-sand-200 dark:border-dark-700 shadow-sm">
                                    <div className="text-status-high font-black text-2xl mb-1">50 XP</div>
                                    <div className="text-sm font-bold text-dark-900 dark:text-white uppercase tracking-tighter">High Priority Quest</div>
                                    <p className="text-xs text-dark-500 mt-2">Critical objectives that test your resolve.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-dark-800 border border-sand-200 dark:border-dark-700 shadow-sm">
                                    <div className="text-blue-500 font-black text-2xl mb-1">20 XP</div>
                                    <div className="text-sm font-bold text-dark-900 dark:text-white uppercase tracking-tighter">Standard Quest</div>
                                    <p className="text-xs text-dark-500 mt-2">Daily tasks that build your character.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-dark-800 border border-sand-200 dark:border-dark-700 shadow-sm">
                                    <div className="text-emerald-500 font-black text-2xl mb-1">DYN XP</div>
                                    <div className="text-sm font-bold text-dark-900 dark:text-white uppercase tracking-tighter">Focus Session</div>
                                    <p className="text-xs text-dark-500 mt-2">Earn XP based on focus duration & intensity.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <div className="glass-premium p-6 rounded-3xl border border-sand-300 dark:border-dark-800 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md shadow-xl">
                            <h3 className="font-black mb-6 text-xl text-dark-900 dark:text-white flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-500" />
                                Quick Maneuvers
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={openModal}
                                    className="w-full text-left p-4 rounded-2xl hover:bg-white dark:hover:bg-dark-800 flex items-center gap-4 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md border border-transparent hover:border-sand-200 dark:hover:border-dark-700 group"
                                >
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="font-bold block text-dark-900 dark:text-white text-sm">Enter Focus Trance</span>
                                        <span className="text-xs text-dark-500">Sharpen your concentration</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => router.push('/stats')}
                                    className="w-full text-left p-4 rounded-2xl hover:bg-white dark:hover:bg-dark-800 flex items-center gap-4 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md border border-transparent hover:border-sand-200 dark:hover:border-dark-700 group"
                                >
                                    <div className="bg-orange-100 text-orange-600 p-3 rounded-xl dark:bg-orange-900/30 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <Flame className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="font-bold block text-dark-900 dark:text-white text-sm">Review Conquests</span>
                                        <span className="text-xs text-dark-500">View your battle statistics</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <section className="glass-premium p-6 rounded-3xl border border-sand-300 dark:border-dark-800 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black flex items-center gap-3 dark:text-white">
                                    <ScrollText className="h-5 w-5 text-dark-400" />
                                    Victory Log
                                </h2>
                            </div>
                            <div className="grid gap-3 opacity-80 hover:opacity-100 transition-opacity max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {completedTasks.length > 0 ? completedTasks.map(task => (
                                    <div key={task.id} onClick={() => setViewingTask(task)} className="cursor-pointer">
                                        <TaskItem task={task} onComplete={() => { }} />
                                    </div>
                                )) : (
                                    <div className="py-8 text-center border-2 border-dashed border-sand-200 dark:border-dark-800 rounded-2xl bg-sand-50/50 dark:bg-dark-950/50">
                                        <p className="text-xs font-bold text-dark-400 uppercase tracking-widest">No scrolls recorded</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <EditTaskModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    task={editingTask}
                    onSave={saveTask}
                    onDelete={removeTask}
                />

                {/* View Details Modal */}
                <TaskDetailsModal
                    open={!!viewingTask}
                    onClose={() => setViewingTask(undefined)}
                    task={viewingTask}
                    onEdit={(t: Task) => {
                        setViewingTask(undefined)
                        setEditingTask(t)
                        setIsModalOpen(true)
                    }}
                />
            </main>
        </div>
    )
}
