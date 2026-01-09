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

  const saveTask = (taskData: Partial<Task> & { subtasks?: string[] }) => {
    if (editingTask) {
      saveQuest(editingTask, taskData)
    } else {
      addTask({
        id: Math.random().toString(),
        title: taskData.title || "New Quest",
        category: taskData.category || "General",
        priority: taskData.priority || "Medium",
        deadline: taskData.deadline || new Date().toISOString(),
        status: "To Do",
        subtasks: taskData.subtasks
      } as Task & { subtasks?: string[] })
    }
    setEditingTask(undefined)
    setIsModalOpen(false)
  }

  if (!isLoaded) return null

  return (
    <div className="flex h-screen bg-[#FDFDF9] dark:bg-[#09090b] font-sans text-stone-900 dark:text-zinc-100 transition-colors duration-300 overflow-hidden">
      <Sidebar />
      <XpNotifier />

      <main className="flex-1 flex flex-col p-4 lg:p-6 min-w-0 h-full">
        {/* Modern Hero Hub Header - Compact & Fixed */}
        <div className="shrink-0 relative mb-6 overflow-hidden rounded-[2rem] border border-stone-200 dark:border-white/10 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 dark:from-[#18181b] dark:to-[#09090b] p-6 text-white shadow-2xl shadow-stone-900/20 dark:shadow-black/60">
          {/* Background Decorative Element */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[100px]" />

          <div className="relative flex flex-col xl:flex-row items-center gap-6 xl:gap-8">
            {/* Hero Avatar & Info Group */}
            <div className="flex flex-1 items-center gap-6 w-full xl:w-auto justify-center xl:justify-start">
              {/* Hero Avatar */}
              <div className="relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0 group cursor-pointer">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-orange-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative h-full w-full rounded-full border-4 border-white/10 overflow-hidden bg-stone-900 dark:bg-[#27272a] ring-1 ring-white/20 dark:ring-white/10">
                  <img
                    src={stats.avatarUrl}
                    alt="Hero Avatar"
                    className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-[#27272a] flex items-center justify-center border-2 border-stone-100 dark:border-[#3f3f46] shadow-lg shadow-black/20">
                  {(() => {
                    const RankIcon = getHeroRank(stats.level).icon;
                    return <RankIcon className="h-4 w-4 text-stone-900 dark:text-yellow-400" />;
                  })()}
                </div>
              </div>

              {/* Hero Info */}
              <div className="text-left">
                <div className="mb-1.5 flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{user?.name || (stats.level < 10 ? "Young Traveler" : "Legendary Hero")}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest ${getHeroRank(stats.level).color} backdrop-blur-md`}>
                    {getHeroRank(stats.level).title}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-blue-100/60 dark:text-zinc-400 text-sm font-medium">
                  <span className="text-white dark:text-zinc-200 font-bold">LVL {stats.level}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="font-mono tracking-tight">{stats.currentExp} <span className="text-white/30 dark:text-zinc-600">/</span> {stats.maxExp} XP</span>
                </div>
                {/* XP Bar */}
                <div className="mt-3 h-2 w-48 md:w-64 bg-black/20 dark:bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                    style={{ width: `${(stats.currentExp / stats.maxExp) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions - Integrated into Header */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  if (!user) {
                    alert("You must be signed in to create quests!");
                    return;
                  }
                  setEditingTask(undefined);
                  setIsModalOpen(true);
                }}
                className="group flex items-center gap-2.5 rounded-2xl bg-white text-stone-950 px-6 py-3 font-bold shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-white/10 hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 text-stone-900" />
                <span className="text-sm tracking-tight text-stone-900">Forge Quest</span>
              </button>
              <button
                onClick={() => document.getElementById('xp-tome')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2.5 rounded-2xl bg-white/5 px-6 py-3 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
              >
                <ScrollText className="h-4 w-4 text-orange-200" />
                <span className="text-sm font-bold tracking-tight">Tome</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid - Fills remaining height */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

          {/* Main Quest List (Span 2) - SCROLLABLE */}
          <div className="lg:col-span-2 flex flex-col min-h-0 bg-white dark:bg-[#18181b] rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-2xl shadow-stone-200/50 dark:shadow-black/20 overflow-hidden relative">
            {/* Quest Header */}
            <div className="shrink-0 p-8 pb-4 flex items-center justify-between bg-white dark:bg-[#18181b] z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                  <Sword className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                  Active Quests
                </h2>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-[#27272a] border border-stone-200 dark:border-white/5 text-[10px] font-black tracking-widest text-stone-500 dark:text-zinc-400 uppercase">
                {activeTasks.length} CHALLENGES
              </div>
            </div>

            {/* Scrollable List container */}
            <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar space-y-3">
              {activeTasks.length > 0 ? (
                activeTasks.map(task => (
                  <div key={task.id} className="group relative">
                    <div onClick={() => setViewingTask(task)} className="cursor-pointer transform hover:scale-[1.01] transition-transform duration-200">
                      <TaskItem
                        task={task}
                        onComplete={(id: string) => handleCompleteTask(id)}
                        onEdit={(t: Task) => { setEditingTask(t); setIsModalOpen(true); }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-400 dark:text-zinc-600">
                  <div className="mx-auto w-20 h-20 rounded-3xl bg-stone-50 dark:bg-[#27272a] flex items-center justify-center mb-6 ring-1 ring-stone-900/5 dark:ring-white/5">
                    <Trophy className="h-8 w-8 text-stone-300 dark:text-zinc-500" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">Rest, Hero</h3>
                  <p className="text-sm font-medium opacity-60 max-w-[200px] leading-relaxed">All threats have been neutralized. Enjoy the peace.</p>
                </div>
              )}
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#18181b] to-transparent pointer-events-none" />
          </div>

          {/* Widgets Column - SCROLLABLE */}
          <div className="flex flex-col gap-6 overflow-y-auto min-h-0 pr-1 custom-scrollbar">

            {/* Quick Maneuvers */}
            <div className="bg-white dark:bg-[#18181b] p-6 rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-xl shadow-stone-200/50 dark:shadow-black/20 shrink-0 group hover:border-stone-200 dark:hover:border-white/10 transition-colors duration-300">
              <h3 className="font-black mb-5 text-sm uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-3">
                <Target className="h-4 w-4 text-blue-500" />
                Quick Maneuvers
              </h3>
              <div className="space-y-3">
                <button
                  onClick={openModal}
                  className="w-full text-left p-4 rounded-2xl bg-stone-50 dark:bg-[#27272a] hover:bg-stone-100 dark:hover:bg-[#3f3f46] flex items-center gap-4 transition-all duration-200 group/btn border border-transparent dark:border-white/5 hover:border-stone-200 dark:hover:border-white/10"
                >
                  <div className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl group-hover/btn:scale-110 transition-transform duration-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-stone-900 dark:text-white text-sm mb-0.5">Focus Trance</span>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">Sharpen your concentration</span>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/stats')}
                  className="w-full text-left p-4 rounded-2xl bg-stone-50 dark:bg-[#27272a] hover:bg-stone-100 dark:hover:bg-[#3f3f46] flex items-center gap-4 transition-all duration-200 group/btn border border-transparent dark:border-white/5 hover:border-stone-200 dark:hover:border-white/10"
                >
                  <div className="bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-2.5 rounded-xl group-hover/btn:scale-110 transition-transform duration-300">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-stone-900 dark:text-white text-sm mb-0.5">Conquests</span>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">View battle statistics</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tome of Knowledge */}
            <section id="xp-tome" className="bg-white dark:bg-[#18181b] p-6 rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-xl shadow-stone-200/50 dark:shadow-black/20 shrink-0 group hover:border-stone-200 dark:hover:border-white/10 transition-colors duration-300">
              <h2 className="font-black mb-5 text-sm uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-3">
                <ScrollText className="h-4 w-4 text-orange-500" />
                XP Rewards
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-[#27272a] border border-transparent dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-status-high ring-2 ring-status-high/20" />
                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-300">High Priority</span>
                  </div>
                  <div className="text-status-high font-black text-sm">50 XP</div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-[#27272a] border border-transparent dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-300">Standard</span>
                  </div>
                  <div className="text-blue-500 font-black text-sm">20 XP</div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-[#27272a] border border-transparent dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-300">Focus Session</span>
                  </div>
                  <div className="text-emerald-500 font-black text-sm">DYN XP</div>
                </div>
              </div>
            </section>

            {/* Victory Log */}
            <section className="bg-white dark:bg-[#18181b] p-6 rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-xl shadow-stone-200/50 dark:shadow-black/20 shrink-0 flex-1 min-h-[200px] flex flex-col group hover:border-stone-200 dark:hover:border-white/10 transition-colors duration-300">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-black mb-3 text-sm uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  Victory Log
                </h2>
              </div>
              <div className="grid gap-2 overflow-y-auto flex-1 custom-scrollbar pr-1 max-h-[300px]">
                {completedTasks.length > 0 ? completedTasks.map(task => (
                  <div key={task.id} onClick={() => setViewingTask(task)} className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-200">
                    <TaskItem task={task} onComplete={() => { }} />
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="text-[10px] font-bold text-stone-300 dark:text-zinc-700 uppercase tracking-widest">No victories yet</div>
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
