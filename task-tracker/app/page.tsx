"use client"

import { useState, useMemo } from "react"
import { useGamification } from "@/hooks/use-gamification"
import { useTaskStore } from "@/hooks/use-tasks"
import { useQuestManager } from "@/hooks/use-quest-manager"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Task } from "@/types"
import {
  Plus, Target, Trophy, ListFilter, Star, Zap, Heart,
  CheckCircle2, BarChart3
} from "lucide-react"
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
        case 'Category':
          return a.category.localeCompare(b.category)
        case 'Title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
  }, [activeTasks, sortBy])

  const saveTask = (taskData: Partial<Task> & { subtasks?: string[] }) => {
    if (editingTask) {
      saveQuest(editingTask, taskData)
    } else {
      addTask({
        id: Math.random().toString(),
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

  if (!isLoaded) return null

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
                {user?.name || "Hero"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{heroRank.title}</span>
                <span>·</span>
                <span>Level {stats.level}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!user) { alert("Sign in to create tasks."); return }
              setEditingTask(undefined)
              setIsModalOpen(true)
            }}
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
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
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
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                  {stats.health}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-700"
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
            {/* List header */}
            <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Active Tasks
                <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                  {activeTasks.length}
                </span>
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

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
              {activeTasks.length > 0 ? (
                sortedActiveTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setViewingTask(task)}
                    className="cursor-pointer"
                  >
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
                  <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-1 text-sm">All clear</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[180px] leading-relaxed">
                    No active tasks. Add one to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <aside className="hidden xl:flex flex-col w-64 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
            {/* Quick actions */}
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

            {/* XP reference */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                XP Rewards
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Critical", xp: "75 XP", color: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
                  { label: "High priority", xp: "50 XP", color: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
                  { label: "Standard", xp: "20 XP", color: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
                  { label: "Focus session", xp: "Dynamic", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
                ].map(item => (
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
                <p className="text-xs text-slate-400 dark:text-slate-600">
                  No completed tasks yet.
                </p>
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
