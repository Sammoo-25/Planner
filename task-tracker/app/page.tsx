"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
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
import { Plus, Sword, ScrollText, Target, Flame, Trophy, ListFilter } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFocus } from "@/context/FocusContext"
import { getHeroRank } from "@/lib/hero-rank-utils"
import { XpNotifier } from "@/components/dashboard/xp-notifier"
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

  // Sorting State
  type SortOption = 'Difficulty' | 'Status' | 'Category' | 'Title'
  const [sortBy, setSortBy] = useState<SortOption>('Difficulty')

  const sortedActiveTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
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
  }, [activeTasks, sortBy])

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
    <div className="flex h-screen bg-transparent font-sans text-stone-900 dark:text-zinc-100 transition-colors duration-300 overflow-hidden relative">
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <XpNotifier />

        <main className="flex-1 flex flex-col p-4 lg:p-6 min-w-0 h-full">
        {/* Modern Hero Hub Header - Dynamic & Vibrant */}
        <div className="shrink-0 relative mb-6 overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/10 bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 group/hero">
          {/* Animated Background Gradients */}
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/20 blur-[100px] group-hover/hero:scale-110 transition-transform duration-1000 origin-center" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-orange-400/20 to-rose-500/20 blur-[100px] group-hover/hero:scale-110 transition-transform duration-1000 origin-center delay-75" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.5),transparent_70%)] mix-blend-overlay pointer-events-none" />

          <div className="relative flex flex-col xl:flex-row items-center gap-6 xl:gap-10">
            {/* Hero Avatar & Info Group */}
            <div className="flex flex-1 items-center gap-6 lg:gap-8 w-full xl:w-auto justify-center xl:justify-start">
              {/* Hero Avatar */}
              <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0 group cursor-pointer z-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-orange-500 blur-xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 animate-pulse" />
                <div className="relative h-full w-full rounded-full border-[6px] border-white/80 dark:border-[#27272a]/80 overflow-hidden bg-stone-100 dark:bg-[#18181b] shadow-2xl">
                  <img
                    src={stats.avatarUrl}
                    alt="Hero Avatar"
                    className="h-full w-full object-cover transform group-hover:scale-125 transition-transform duration-700 hover:rotate-6"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white dark:bg-[#27272a] flex items-center justify-center border-4 border-stone-50 md:border-stone-100 dark:border-[#18181b] shadow-xl transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                  {(() => {
                    const RankIcon = getHeroRank(stats.level).icon;
                    return <RankIcon className="h-5 w-5 text-stone-900 dark:text-yellow-400 drop-shadow-md" />;
                  })()}
                </div>
              </div>

              {/* Hero Info */}
              <div className="text-left z-10">
                <div className="mb-2 flex items-center gap-4">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-950 dark:text-white drop-shadow-sm">
                    {user?.name || (stats.level < 10 ? "Young Traveler" : "Legendary Hero")}
                  </h1>
                  <span className={`px-3 py-1 rounded-full bg-white/80 dark:bg-black/40 border border-stone-200/50 dark:border-white/10 text-[11px] font-black uppercase tracking-widest ${getHeroRank(stats.level).color} shadow-[0_2px_10px_rgba(0,0,0,0.05)] backdrop-blur-md`}>
                    {getHeroRank(stats.level).title}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-stone-600 dark:text-zinc-400 text-base font-bold">
                  <span className="text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-white/10 px-3 py-1 rounded-lg border border-stone-200 dark:border-white/5">LVL {stats.level}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-white/20" />
                  <span className="font-mono tracking-tight text-blue-600 dark:text-blue-400">
                    {stats.currentExp} <span className="text-stone-400 dark:text-zinc-600 font-sans mx-1">/</span> {stats.maxExp} XP
                  </span>
                </div>
                {/* Dynamic XP Bar */}
                <div className="mt-4 h-3 w-56 md:w-80 bg-stone-200/50 dark:bg-black/40 rounded-full overflow-hidden backdrop-blur-md border border-stone-300/50 dark:border-white/10 shadow-inner relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 mix-blend-overlay" />
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] relative overflow-hidden"
                    style={{ width: `${(stats.currentExp / stats.maxExp) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center xl:justify-end gap-4 shrink-0 w-full xl:w-auto z-10">
              <button
                onClick={() => {
                  if (!user) {
                    alert("You must be signed in to create quests!");
                    return;
                  }
                  setEditingTask(undefined);
                  setIsModalOpen(true);
                }}
                className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 dark:from-white dark:to-zinc-200 text-white dark:text-stone-950 px-8 py-4 font-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500 relative z-10" />
                <span className="text-sm tracking-widest uppercase relative z-10">Forge Quest</span>
              </button>
              <button
                onClick={() => document.getElementById('xp-tome')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex items-center justify-center gap-3 rounded-2xl bg-white/80 dark:bg-[#27272a]/80 px-8 py-4 text-stone-700 dark:text-white backdrop-blur-xl border border-stone-200/60 dark:border-white/10 hover:bg-stone-50 dark:hover:bg-[#3f3f46] hover:border-stone-300 dark:hover:border-white/20 transition-all duration-300 hover:scale-105 shadow-lg shadow-stone-200/20 dark:shadow-black/20 w-full sm:w-auto"
              >
                <ScrollText className="h-5 w-5 text-orange-500 group-hover:animate-bounce" />
                <span className="text-sm font-black tracking-widest uppercase text-stone-900 dark:text-white">Tome</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid - Fills remaining height */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

          {/* Main Quest List (Span 2) - SCROLLABLE */}
          <div className="lg:col-span-2 flex flex-col min-h-0 bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 overflow-hidden relative group/list transition-colors duration-500 hover:border-white/40 dark:hover:border-white/20">
            {/* Quest Header */}
            <div className="shrink-0 p-8 pb-4 flex items-center justify-between z-10 border-b border-stone-100 dark:border-white/5">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 dark:from-orange-500/20 dark:to-rose-500/20 flex items-center justify-center shadow-inner group-hover/list:scale-110 transition-transform duration-500">
                  <Sword className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover/list:rotate-12 transition-transform duration-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-950 dark:text-white tracking-tight">
                    Active Quests
                  </h2>
                  <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400 mt-1">Your current trials and tribulations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2.5 bg-stone-100/80 hover:bg-stone-200 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] rounded-xl transition-all duration-300 outline-none group/sort border border-stone-200/50 dark:border-white/5 hover:shadow-md">
                      <ListFilter className="h-5 w-5 text-stone-600 group-hover/sort:text-stone-900 dark:text-zinc-400 dark:group-hover/sort:text-white transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border-stone-200/50 dark:border-white/10 shadow-2xl">
                    <DropdownMenuLabel className="dark:text-white font-black text-xs uppercase tracking-widest opacity-60">Sort Battles By</DropdownMenuLabel>
                    <DropdownMenuSeparator className="dark:bg-white/10 my-2" />
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <DropdownMenuRadioItem value="Difficulty" className="rounded-xl dark:text-zinc-300 dark:focus:bg-[#27272a] focus:bg-stone-100 cursor-pointer font-semibold py-2">Difficulty (Priority)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Status" className="rounded-xl dark:text-zinc-300 dark:focus:bg-[#27272a] focus:bg-stone-100 cursor-pointer font-semibold py-2">Status</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Category" className="rounded-xl dark:text-zinc-300 dark:focus:bg-[#27272a] focus:bg-stone-100 cursor-pointer font-semibold py-2">Category</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Title" className="rounded-xl dark:text-zinc-300 dark:focus:bg-[#27272a] focus:bg-stone-100 cursor-pointer font-semibold py-2">Alphabetical</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#27272a] dark:to-[#18181b] border border-stone-200/50 dark:border-white/5 text-[10px] font-black tracking-widest text-stone-600 dark:text-zinc-300 uppercase shadow-inner">
                  {activeTasks.length} CHALLENGES
                </div>
              </div>
            </div>

            {/* Scrollable List container */}
            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar space-y-4">
              {activeTasks.length > 0 ? (
                sortedActiveTasks.map(task => (
                  <div key={task.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${Math.random() * 200}ms` }}>
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
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-500 dark:text-zinc-500 animate-in fade-in zoom-in duration-700">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 blur-2xl rounded-full animate-pulse" />
                    <div className="relative mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#27272a] dark:to-[#18181b] flex items-center justify-center shadow-xl border border-stone-200/50 dark:border-white/5 rotate-3 hover:rotate-6 transition-transform duration-500 cursor-default">
                      <Trophy className="h-10 w-10 text-stone-400 dark:text-zinc-400 drop-shadow-sm" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-stone-800 dark:text-white mb-3 tracking-tight">Rest processing...</h3>
                  <p className="text-sm font-semibold opacity-70 max-w-[220px] leading-relaxed">All active threats have been neutralized. Enjoy the fleeting peace, Hero.</p>
                </div>
              )}
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#18181b] via-white/80 dark:via-[#18181b]/80 to-transparent pointer-events-none" />
          </div>

          {/* Widgets Column - SCROLLABLE */}
          <div className="flex flex-col gap-6 overflow-y-auto min-h-0 pr-2 custom-scrollbar lg:pl-2 pb-6">

            {/* Quick Maneuvers */}
            <div className="bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl p-7 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 shrink-0 hover:-translate-y-1 transition-all duration-500 group/widget">
              <h3 className="font-black mb-6 text-xs uppercase tracking-widest text-stone-500 dark:text-zinc-400 flex items-center gap-3">
                <Target className="h-4 w-4 text-blue-500" />
                Quick Maneuvers
              </h3>
              <div className="space-y-4">
                <button
                  onClick={openModal}
                  className="w-full text-left p-4 rounded-2xl bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/40 hover:shadow-lg flex items-center gap-5 transition-all duration-300 group/btn border border-white/20 dark:border-white/5 hover:border-blue-200/50 dark:hover:border-blue-500/30 active:scale-[0.98]"
                >
                  <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-xl group-hover/btn:scale-110 group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-all duration-300 shadow-sm">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-stone-900 dark:text-white text-sm mb-1 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">Focus Trance</span>
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">Sharpen your concentration</span>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/stats')}
                  className="w-full text-left p-4 rounded-2xl bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/40 hover:shadow-lg flex items-center gap-5 transition-all duration-300 group/btn border border-white/20 dark:border-white/5 hover:border-orange-200/50 dark:hover:border-orange-500/30 active:scale-[0.98]"
                >
                  <div className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 p-3 rounded-xl group-hover/btn:scale-110 group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-all duration-300 shadow-sm">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-stone-900 dark:text-white text-sm mb-1 group-hover/btn:text-orange-600 dark:group-hover/btn:text-orange-400 transition-colors">Conquests</span>
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">View battle statistics</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tome of Knowledge */}
            <section id="xp-tome" className="bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl p-7 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 shrink-0 hover:-translate-y-1 transition-all duration-500">
              <h2 className="font-black mb-6 text-xs uppercase tracking-widest text-stone-500 dark:text-zinc-400 flex items-center gap-3">
                <ScrollText className="h-4 w-4 text-orange-500" />
                XP Rewards
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/5 hover:scale-[1.02] transition-transform duration-300 cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                    <span className="text-xs font-extrabold text-stone-700 dark:text-zinc-300">High Priority</span>
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 font-black text-sm drop-shadow-sm">50 XP</div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/5 hover:scale-[1.02] transition-transform duration-300 cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <span className="text-xs font-extrabold text-stone-700 dark:text-zinc-300">Standard</span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-black text-sm drop-shadow-sm">20 XP</div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/5 hover:scale-[1.02] transition-transform duration-300 cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-extrabold text-stone-700 dark:text-zinc-300">Focus Session</span>
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-black text-sm drop-shadow-sm">DYN XP</div>
                </div>
              </div>
            </section>

            {/* Victory Log */}
            <section className="bg-white/10 dark:bg-[#18181b]/40 backdrop-blur-3xl p-7 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/40 shrink-0 flex-1 min-h-[250px] flex flex-col hover:-translate-y-1 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black mb-0 text-xs uppercase tracking-widest text-stone-500 dark:text-zinc-400 flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  Victory Log
                </h2>
              </div>
              <div className="grid gap-3 overflow-y-auto flex-1 custom-scrollbar pr-2 max-h-[300px]">
                {completedTasks.length > 0 ? completedTasks.map(task => (
                  <div key={task.id} onClick={() => setViewingTask(task)} className="cursor-pointer opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-[1.02]">
                    <TaskItem task={task} onComplete={() => { }} />
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/10 dark:bg-black/20 rounded-2xl border border-dashed border-white/30 dark:border-white/5">
                    <div className="text-xs font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-widest">No victories yet</div>
                    <p className="text-[10px] text-stone-400/80 dark:text-zinc-600 mt-2">Complete tasks to fill your log.</p>
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
    </div>
  )
}
