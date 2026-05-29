"use client"

import { useState, useMemo } from "react"
import { useGamification } from "@/hooks/use-gamification"
import { useTaskStore } from "@/hooks/use-tasks"
import { useQuestManager, calculateTaskXp } from "@/hooks/use-quest-manager"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Task } from "@/types"
import {
  Plus, Target, Trophy, ListFilter, Star, Zap, Heart,
  CheckCircle2, BarChart3, LogIn, UserPlus, Sword
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFocus } from "@/context/FocusContext"
import { getHeroRank } from "@/lib/hero-rank-utils"
import { XpNotifier } from "@/components/dashboard/xp-notifier"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortOption = 'Difficulty' | 'Status' | 'Category' | 'Title'

const XP_REWARDS = [
  { label: "Critical task", xp: "75 XP", color: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  { label: "High priority", xp: "50 XP", color: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  { label: "Standard task", xp: "20 XP", color: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
  { label: "Focus session", xp: "Dynamic", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
]

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[65px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
        <div className="h-[52px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
        <div className="flex-1 px-6 pt-5 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function GuestState() {
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sword className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Life RPG Planner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            Turn your tasks into quests. Earn XP, level up, and track your productivity like a game.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              Create Free Account
            </Link>
            <Link
              href="/signin"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Task tracking", icon: "✓" },
              { label: "XP & levels", icon: "⚡" },
              { label: "Focus timer", icon: "🎯" },
            ].map(f => (
              <div key={f.label} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { tasks, addTask, removeTask, isLoaded } = useTaskStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)
  const [sortBy, setSortBy] = useState<SortOption>('Difficulty')

  const { openModal } = useFocus()
  const router = useRouter()
  const { user } = useAuth()
  const { stats } = useGamification()
  const { toggleTaskStatus, saveQuest } = useQuestManager()

  const activeTasks = tasks.filter(t => t.status !== "Done")
  const completedTasks = tasks.filter(t => t.status === "Done")

  const sortedActiveTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
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
  }, [activeTasks, sortBy])

  const saveTask = (taskData: Partial<Task> & { subtasks?: string[] }) => {
    if (editingTask) {
      saveQuest(editingTask, taskData)
    } else {
      addTask({
        title: taskData.title || "New Task",
        category: taskData.category || "General",
        priority: taskData.priority || "Medium",
        deadline: taskData.deadline || new Date().toISOString(),
        status: "To Do",
        subtasks: taskData.subtasks,
      } as Task & { subtasks?: string[] })
    }
    setEditingTask(undefined)
    setIsModalOpen(false)
  }

  const xpPercent = Math.min(100, Math.round((stats.currentExp / stats.maxExp) * 100))
  const heroRank = getHeroRank(stats.level)

  if (!isLoaded) return <DashboardSkeleton />
  if (!user) return <GuestState />

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      <Sidebar />
      <XpNotifier />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={stats.avatarUrl}
              alt="Avatar"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                {user.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{heroRank.title}</span>
                <span>·</span>
                <span>Level {stats.level}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setEditingTask(undefined); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </header>

        {/* Stats row */}
        <div className="shrink-0 flex items-center gap-6 px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {/* XP bar */}
          <div className="flex items-center gap-3 min-w-0 flex-1 max-w-sm">
            <div className="shrink-0 h-7 w-7 rounded-md bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">XP</span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                  {stats.currentExp} / {stats.maxExp}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Health */}
          <div className="flex items-center gap-3 min-w-0 flex-1 max-w-sm">
            <div className="shrink-0 h-7 w-7 rounded-md bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Health</span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">{stats.health}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${stats.health < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${stats.health}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Streak</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{stats.streak}d</div>
            </div>
          </div>

          {/* Completed count */}
          <div className="shrink-0 flex items-center gap-2 ml-auto">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{completedTasks.length}</span> done
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main task list */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Active Tasks
                <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">{activeTasks.length}</span>
              </h2>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <ListFilter className="h-3.5 w-3.5" />
                    {sortBy === 'Difficulty' ? 'Priority' : sortBy}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 text-sm">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <DropdownMenuRadioItem value="Difficulty">Priority</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Status">Status</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Category">Category</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Title">Alphabetical</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
              {activeTasks.length > 0 ? (
                sortedActiveTasks.map(task => (
                  <div key={task.id} onClick={() => setViewingTask(task)} className="cursor-pointer">
                    <TaskItem
                      task={task}
                      onComplete={toggleTaskStatus}
                      onEdit={(t) => { setEditingTask(t); setIsModalOpen(true) }}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Trophy className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-1 text-sm">Quest log empty</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[180px] leading-relaxed mb-4">
                    You have no active tasks. Create your first quest to start earning XP.
                  </p>
                  <button
                    onClick={() => { setEditingTask(undefined); setIsModalOpen(true) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <aside className="hidden xl:flex flex-col w-64 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-1">
                <button
                  onClick={openModal}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                    <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Focus Session</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">Earn XP while you work</div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/stats')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">View Stats</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">Track your progress</div>
                  </div>
                </button>
              </div>
            </div>

            {/* XP reference — values now match actual useQuestManager awards */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                XP Rewards
              </h3>
              <div className="space-y-2.5">
                {XP_REWARDS.map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                    <span className={`text-xs font-semibold ${item.color}`}>{item.xp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed tasks */}
            <div className="p-5 flex-1">
              <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Completed ({completedTasks.length})
              </h3>
              {completedTasks.length > 0 ? (
                <div className="space-y-1">
                  {completedTasks.slice(0, 10).map(task => (
                    <div
                      key={task.id}
                      onClick={() => setViewingTask(task)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600 truncate group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-600">No completed tasks yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <EditTaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        onSave={saveTask}
        onDelete={removeTask}
      />

      <TaskDetailsModal
        open={!!viewingTask}
        onClose={() => setViewingTask(undefined)}
        task={viewingTask}
        onEdit={(t) => {
          setViewingTask(undefined)
          setEditingTask(t)
          setIsModalOpen(true)
        }}
      />
    </div>
  )
}
