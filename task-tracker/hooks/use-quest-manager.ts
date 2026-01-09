"use client"

import { useCallback } from "react"
import { useTaskStore } from "./use-tasks"
import { useGamification } from "./use-gamification"
import { Task } from "@/types"

export function useQuestManager() {
    const { updateTask, tasks } = useTaskStore()
    const { addExp, heal } = useGamification()

    const awardTaskXp = useCallback((task: Task) => {
        let amount = 20 // Default
        if (task.priority === "High" || task.priority === "Critical") {
            amount = 50
        } else if (task.priority === "Low") {
            amount = 10
        }

        // Add deferred subtask XP
        if (task.completedSubtaskCount && task.completedSubtaskCount > 0) {
            amount += (task.completedSubtaskCount * 5)
        }

        addExp(amount)
        heal(5) // Small heal on completion
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
            // Deduct XP on undo
            let amount = 20
            if (task.priority === "High" || task.priority === "Critical") {
                amount = 50
            } else if (task.priority === "Low") {
                amount = 10
            }
            if (task.completedSubtaskCount && task.completedSubtaskCount > 0) {
                amount += (task.completedSubtaskCount * 5)
            }
            addExp(-amount)
        }

        updateTask(id, { status: newStatus })
    }, [tasks, updateTask, awardTaskXp, addExp])

    const saveQuest = useCallback((task: Task | undefined, updates: Partial<Task>) => {
        if (task) {
            // Check if it was transition to Done
            const isFinishing = updates.status === 'Done' && task.status !== 'Done'
            updateTask(task.id, updates)
            if (isFinishing) {
                // We need the full task to get priority if it wasn't in updates
                const fullTask = { ...task, ...updates }
                awardTaskXp(fullTask)
            }
        }
        // addTask is still handled in components for simplicity or can be added here
    }, [updateTask, awardTaskXp])

    return { toggleTaskStatus, awardTaskXp, saveQuest }
}
