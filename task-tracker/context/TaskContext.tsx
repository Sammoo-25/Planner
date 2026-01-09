"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Task } from "@/types"

const STORAGE_KEY = "player-tasks"

const INITIAL_TASKS: Task[] = [
    {
        id: "1",
        title: "Complete Project Proposal",
        category: "Work",
        priority: "Critical",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        status: "To Do",
    },
    {
        id: "2",
        title: "Morning Jog (5km)",
        category: "Health",
        priority: "High",
        deadline: new Date().toISOString(),
        status: "To Do",
    }
]

interface TaskContextType {
    tasks: Task[]
    isLoaded: boolean
    addTask: (task: Task & { subtasks?: string[] }) => void
    updateTask: (id: string, updates: Partial<Task>) => void
    removeTask: (id: string) => void
    resetData: () => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

import { api } from "@/lib/api"
import { useAuth } from "./AuthContext"

export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const { token } = useAuth()

    useEffect(() => {
        // Clear legacy cache if it exists (first time run)
        if (localStorage.getItem(STORAGE_KEY)) {
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem('player-stats') // Also clear stats legacy
        }

        if (token) {
            api.getTasks().then(data => {
                if (Array.isArray(data)) {
                    // Map backend fields to frontend Task type
                    const mappedTasks = data.map((t: any) => ({
                        ...t,
                        completedAt: t.completed_at, // Map snake_case to camelCase
                        startTime: t.start_time,
                        duration: t.duration,
                        subtaskCount: parseInt(t.subtask_count || "0"),
                        completedSubtaskCount: parseInt(t.completed_subtask_count || "0")
                    }))
                    setTasks(mappedTasks)
                }
                setIsLoaded(true)
            }).catch(err => {
                console.error("Failed to fetch tasks", err)
                setIsLoaded(true)
            })
        } else {
            // Default empty state for guests
            setTasks([])
            setIsLoaded(true)
        }
    }, [token])

    const mapToBackend = (task: Partial<Task>) => {
        const mapped: any = { ...task };
        if (task.startTime !== undefined) {
            mapped.start_time = task.startTime;
            delete mapped.startTime;
        }
        if (task.completedAt !== undefined) {
            mapped.completed_at = task.completedAt;
            delete mapped.completedAt;
        }
        // Remove any other frontend-only fields or leftover snake_case from previous merges
        delete mapped.start_time_legacy; // just in case
        return mapped;
    };

    const addTask = async (task: Task & { subtasks?: string[] }) => {
        if (!token) {
            console.warn("Guest attempted to add task - ignored");
            return;
        }
        try {
            const mappedData = mapToBackend(task);
            const data = await api.createTask(mappedData);

            // Handle Subtasks if present
            if (task.subtasks && task.subtasks.length > 0) {
                await Promise.all(task.subtasks.map(title => api.addSubtask(data.id, title)));
            }

            const newTask = {
                ...data,
                completedAt: data.completed_at,
                startTime: data.start_time,
                duration: data.duration
            };
            setTasks((prev) => [newTask, ...prev]);
        } catch (err) {
            console.error("Failed to add task", err);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (!token) return;
        try {
            const existingTask = tasks.find(t => t.id === id);
            if (existingTask) {
                const status = updates.status || existingTask.status;
                const isNowDone = status === 'Done' && existingTask.status !== 'Done';

                // Construct clean update object
                const updatePayload: any = {
                    ...existingTask,
                    ...updates
                };

                if (isNowDone) {
                    updatePayload.completedAt = new Date().toISOString();
                }

                const mappedPayload = mapToBackend(updatePayload);
                const data = await api.updateTask(id, mappedPayload);

                const updatedTask = {
                    ...data,
                    completedAt: data.completed_at,
                    startTime: data.start_time,
                    duration: data.duration,
                    subtaskCount: updates.subtaskCount !== undefined ? updates.subtaskCount : existingTask.subtaskCount,
                    completedSubtaskCount: updates.completedSubtaskCount !== undefined ? updates.completedSubtaskCount : existingTask.completedSubtaskCount
                };
                setTasks((prev) => prev.map(t => t.id === id ? updatedTask : t));
            }
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const removeTask = async (id: string) => {
        if (!token) return
        try {
            await api.deleteTask(id)
            setTasks((prev) => prev.filter((t) => t.id !== id))
        } catch (err) {
            console.error("Failed to delete task", err)
        }
    }

    const resetData = () => {
        setTasks([])
    }

    return (
        <TaskContext.Provider value={{ tasks, isLoaded, addTask, updateTask, removeTask, resetData }}>
            {children}
        </TaskContext.Provider>
    )
}

export function useTaskContext() {
    const context = useContext(TaskContext)
    if (context === undefined) {
        throw new Error("useTaskContext must be used within a TaskProvider")
    }
    return context
}
