"use client"

import { useCallback } from "react"
import { useTaskStore } from "./use-tasks"
import { useGamification } from "./use-gamification"
import { Task } from "@/types"

/** XP values by priority — single source of truth used by both award and deduct logic */
export function calculateTaskXp(task: Pick<Task, 'priority' | 'completedSubtaskCount'>): number {
    let base = 20
    if (task.priority === 'Critical') base = 75
    else if (task.priority === 'High') base = 50
    else if (task.priority === 'Low') base = 10

    const subtaskBonus = (task.completedSubtaskCount ?? 0) * 5
    return base + subtaskBonus
}

export function useQuestManager() {
    const { updateTask, tasks } = useTaskStore()
    const { addExp, heal } = useGamification()

    const awardTaskXp = useCallback((task: Task) => {
        const amount = calculateTaskXp(task)
        addExp(amount)
        heal(5)
    }, [addExp, heal])

    const toggleTaskStatus = useCallback((id: string) => {
        const task = tasks.find(t => t.id === id)
        if (!task) return

        let newStatus: Task['status'] = 'To Do'

        if (task.status === 'To Do') {
            newStatus = 'In Progress'
        } else if (task.status === 'In Progress') {
            newStatus = 'Done'
            awardTaskXp(task)
        } else if (task.status === 'Done') {
            newStatus = 'To Do'
            addExp(-calculateTaskXp(task)) // deduct same amount that was awarded
        }

        updateTask(id, { status: newStatus })
    }, [tasks, updateTask, awardTaskXp, addExp])

    const saveQuest = useCallback((task: Task | undefined, updates: Partial<Task>) => {
        if (!task) return
        const isFinishing = updates.status === 'Done' && task.status !== 'Done'
        updateTask(task.id, updates)
        if (isFinishing) {
            awardTaskXp({ ...task, ...updates })
        }
    }, [updateTask, awardTaskXp])

    return { toggleTaskStatus, awardTaskXp, saveQuest }
}
