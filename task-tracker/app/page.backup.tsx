"use client"

import { useState, useCallback } from "react"
import { useGamification } from "@/hooks/use-gamification"
import { useTaskStore } from "@/hooks/use-tasks"
import { Sidebar } from "@/components/dashboard/sidebar"
import { PlayerStats } from "@/components/dashboard/player-stats"
import { TaskItem } from "@/components/dashboard/task-item"
import { EditTaskModal } from "@/components/dashboard/edit-task-modal"
import { TaskDetailsModal } from "@/components/dashboard/task-details-modal"
import { Task } from "@/types"
import { Plus, Sword, ScrollText, Target, Flame } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFocus } from "@/context/FocusContext"


export default function Dashboard() {
  const { tasks, addTask, updateTask, removeTask, isLoaded } = useTaskStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined)

  const { openModal } = useFocus()

  const router = useRouter()
  const { addExp, heal, stats } = useGamification()

  // Filter Tasks
  const activeTasks = tasks.filter(t => t.status !== "Done")
  const completedTasks = tasks.filter(t => t.status === "Done")

  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    let newStatus: Task['status'] = 'To Do'

    if (task.status === 'To Do') {
      newStatus = 'In Progress'
    } else if (task.status === 'In Progress') {
      newStatus = 'Done'
      // Reward only on completion
      addExp(task.priority === "High" ? 50 : 20)
      heal(5)
    } else if (task.status === 'Done') {
      newStatus = 'To Do' // Cycling back or maybe 'In Progress'? User said "Start -> In Progress -> Done". Usually reopen usually goes to Todo or In Progress. Let's go to To Do.
    }

    updateTask(id, { status: newStatus })
  }

  const saveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData)
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
    <div className="flex min-h-screen bg-sand-100 font-sans text-dark-900 dark:bg-dark-900 transition-colors">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        {/* ... header ... */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-dark-900 dark:text-white">Adventure Board</h1>
            <p className="text-muted text-sm mt-1 dark:text-dark-500">Ready your quests, hero.</p>
          </div>
          <button
            onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-dark-900 px-6 py-3 text-white shadow-lg shadow-dark-900/20 hover:bg-dark-900/90 hover:scale-105 transition-all dark:bg-white dark:text-dark-900 dark:shadow-white/10"
          >
            <Plus className="h-5 w-5" />
            <span className="font-bold">New Quest</span>
          </button>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Quest List (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            <PlayerStats stats={stats} />

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-dark-900 dark:text-white">
                  <Sword className="h-5 w-5 text-status-high" />
                  Active Quests
                </h2>
              </div>

              <div className="grid gap-3">
                {activeTasks.length > 0 ? (
                  activeTasks.map(task => (
                    <div key={task.id} className="group relative">
                      {/* Added onClick for Viewing Details */}
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
                  <div className="p-12 text-center border-2 border-dashed border-sand-300 rounded-2xl bg-sand-50 dark:bg-dark-800 dark:border-dark-700">
                    <p className="text-dark-500 font-medium">No active quests. The realm is safe... for now.</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 opacity-70 dark:text-white">
                  <ScrollText className="h-5 w-5" />
                  Completed Log
                </h2>
              </div>
              <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
                {completedTasks.length > 0 ? completedTasks.map(task => (
                  <div key={task.id} onClick={() => setViewingTask(task)} className="cursor-pointer">
                    <TaskItem task={task} onComplete={() => { }} />
                  </div>
                )) : (
                  <p className="text-sm text-dark-500 pl-2">No victories recorded yet.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="card-premium p-6">
              <h3 className="font-bold mb-4 text-lg text-dark-900 dark:text-white">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={openModal}
                  className="w-full text-left p-3 rounded-lg hover:bg-sand-100 dark:hover:bg-dark-700 flex items-center gap-3 transition-colors text-dark-900 dark:text-dark-500"
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Focus Mode</span>
                </button>
                <button
                  onClick={() => router.push('/stats')}
                  className="w-full text-left p-3 rounded-lg hover:bg-sand-100 dark:hover:bg-dark-700 flex items-center gap-3 transition-colors text-dark-900 dark:text-dark-500"
                >
                  <div className="bg-orange-100 text-orange-600 p-2 rounded-lg dark:bg-orange-900/30 dark:text-orange-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <span className="font-medium">View Streaks</span>
                </button>
              </div>
            </div>
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
