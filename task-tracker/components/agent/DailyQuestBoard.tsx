"use client"

import React, { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useGamification } from "@/hooks/use-gamification"

interface DailyQuest {
    id: string
    title: string
    description?: string
    category?: string
    xp_reward: number
    is_completed: boolean
    condition_type?: string
}

export function DailyQuestBoard() {
    const { token } = useAuth()
    const { addExp, triggerXpNotification } = useGamification()
    const [quests, setQuests] = useState<DailyQuest[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)

    const loadQuests = useCallback(async () => {
        if (!token) return
        try {
            const data = await api.getDailyQuests()
            if (Array.isArray(data)) {
                setQuests(data)
            }
        } catch {
            // Non-critical — fail silently
        }
    }, [token])

    useEffect(() => {
        loadQuests()
    }, [loadQuests])

    const handleComplete = async (quest: DailyQuest) => {
        if (quest.is_completed) return
        try {
            await api.completeDailyQuest(quest.id)
            setQuests(prev =>
                prev.map(q => q.id === quest.id ? { ...q, is_completed: true } : q)
            )
            addExp(quest.xp_reward)
            triggerXpNotification(quest.xp_reward)
        } catch {
            // Optimistic update failed — reload
            loadQuests()
        }
    }

    if (!token || quests.length === 0) return null

    const completed = quests.filter(q => q.is_completed).length
    const totalXp = quests.filter(q => !q.is_completed).reduce((sum, q) => sum + q.xp_reward, 0)

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        Daily Quests
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {completed}/{quests.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {totalXp > 0 && (
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            +{totalXp} XP available
                        </span>
                    )}
                    <span className="text-slate-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${(completed / quests.length) * 100}%` }}
                        />
                    </div>

                    {quests.map(quest => (
                        <div
                            key={quest.id}
                            className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                                quest.is_completed
                                    ? "opacity-50"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                        >
                            <button
                                onClick={() => handleComplete(quest)}
                                disabled={quest.is_completed}
                                className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                                    quest.is_completed
                                        ? "bg-indigo-500 border-indigo-500"
                                        : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                                }`}
                            >
                                {quest.is_completed && (
                                    <span className="flex items-center justify-center w-full h-full text-white text-xs">✓</span>
                                )}
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium leading-tight ${
                                    quest.is_completed
                                        ? "line-through text-slate-400"
                                        : "text-slate-800 dark:text-slate-200"
                                }`}>
                                    {quest.title}
                                </p>
                                {quest.description && !quest.is_completed && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {quest.description}
                                    </p>
                                )}
                            </div>
                            <span className={`text-xs font-medium shrink-0 ${
                                quest.is_completed
                                    ? "text-slate-400"
                                    : "text-indigo-600 dark:text-indigo-400"
                            }`}>
                                {quest.is_completed ? "✓" : `+${quest.xp_reward} XP`}
                            </span>
                        </div>
                    ))}

                    {completed === quests.length && (
                        <div className="text-center py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            🏆 All daily quests complete!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
