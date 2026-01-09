"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { PlayerStats, INITIAL_STATS } from "@/types"

interface GamificationContextType {
    stats: PlayerStats
    addExp: (amount: number) => void
    takeDamage: (amount: number) => void
    heal: (amount: number) => void
    addFocusSession: (taskId: string, minutes: number, xp: number) => void
    updateAvatar: (url: string) => void
    lastXpGain: { amount: number; id: number } | null
    refreshStats: () => Promise<void>
    triggerXpNotification: (amount: number) => void
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

import { api } from "@/lib/api"
import { useAuth } from "./AuthContext"

export function GamificationProvider({ children }: { children: ReactNode }) {
    const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS)
    const [lastXpGain, setLastXpGain] = useState<{ amount: number; id: number } | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const { token } = useAuth()

    const fetchStats = useCallback(async () => {
        if (!token) return
        try {
            const data = await api.getStats()
            if (data && !data.message) {
                setStats({
                    ...INITIAL_STATS,
                    level: data.level ?? 1,
                    currentExp: data.current_exp ?? 0,
                    maxExp: data.max_exp ?? 100,
                    health: data.health ?? 100,
                    avatarUrl: data.avatar_url ?? "/hero-avatar.png",
                    totalXP: data.total_xp ?? 0,
                    focusStats: {
                        totalSessions: data.focus_total_sessions ?? 0,
                        totalMinutes: data.focus_total_minutes ?? 0,
                        history: []
                    }
                })
            }
            setIsLoaded(true)
        } catch (err) {
            console.error("Failed to fetch stats", err)
            setIsLoaded(true)
        }
    }, [token])

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('player-stats')) {
            localStorage.removeItem('player-stats')
        }
        if (token) {
            fetchStats()
        } else {
            setStats(INITIAL_STATS)
            setIsLoaded(true)
        }
    }, [token, fetchStats])

    // Sync to backend on changes - DEBOUNCED or only if local change?
    // Actually, if we use refreshStats (fetch from backend), we might trigger this effect and send it back.
    // However, the effect dependencies are [stats, isLoaded, token].
    // If stats change from fetch, this effect runs.
    // It calls api.updateStats with the fetched stats.
    // This is a redundant write but harmless if values match.
    useEffect(() => {
        if (isLoaded && token) {
            const backendStats = {
                level: stats.level,
                current_exp: stats.currentExp,
                max_exp: stats.maxExp,
                health: stats.health,
                avatar_url: stats.avatarUrl,
                total_xp: stats.totalXP,
                focus_total_sessions: stats.focusStats?.totalSessions,
                focus_total_minutes: stats.focusStats?.totalMinutes
            }
            // We can prevent loop by checking if meaningful change? 
            // For now, let's leave it as is, or maybe only update if explicitly asked? 
            // The original code synced every state change.
            // If we fetch from backend, we get state, then we sync back same state. Acceptable.
            api.updateStats(backendStats).catch(err => console.error("Failed to sync stats", err))
        }
    }, [stats, isLoaded, token])

    const refreshStats = fetchStats

    const triggerXpNotification = useCallback((amount: number) => {
        const gainId = `${Date.now()}-${Math.random()}`
        setLastXpGain({ amount, id: gainId as any })
        setTimeout(() => setLastXpGain(null), 2000)
    }, [])

    const addExp = useCallback((amount: number) => {
        setStats((prev) => {
            const todayStr = new Date().toISOString().split('T')[0]
            let newExp = prev.currentExp + amount
            let newLevel = prev.level
            let newMaxExp = prev.maxExp
            let newTotalXP = (prev.totalXP || 0) + amount

            const existingHistory = [...(prev.xpHistory || [])]
            const todayIndex = existingHistory.findIndex(h => h.date === todayStr)

            if (todayIndex >= 0) {
                existingHistory[todayIndex].amount += amount
            } else {
                existingHistory.push({ date: todayStr, amount })
            }

            if (newExp >= newMaxExp) {
                newExp -= newMaxExp
                newLevel += 1
                newMaxExp = Math.floor(newMaxExp * 1.2)
            }

            // Allow negative exp but don't drop level (simplification)
            if (newExp < 0) {
                newExp = 0; // prevent negative exp
            }

            return {
                ...prev,
                level: newLevel,
                currentExp: newExp,
                maxExp: newMaxExp,
                totalXP: newTotalXP,
                xpHistory: existingHistory
            }
        })

        triggerXpNotification(amount)
    }, [triggerXpNotification])

    const takeDamage = useCallback((amount: number) => {
        setStats((prev) => ({
            ...prev,
            health: Math.max(0, prev.health - amount),
        }))
    }, [])

    const heal = useCallback((amount: number) => {
        setStats((prev) => ({
            ...prev,
            health: Math.min(100, prev.health + amount),
        }))
    }, [])

    const addFocusSession = useCallback((taskId: string, minutes: number, xp: number) => {
        setStats((prev) => ({
            ...prev,
            focusStats: {
                totalSessions: (prev.focusStats?.totalSessions || 0) + 1,
                totalMinutes: (prev.focusStats?.totalMinutes || 0) + minutes,
                history: [
                    {
                        id: Math.random().toString(),
                        taskId,
                        duration: minutes,
                        xpEarned: xp,
                        timestamp: new Date().toISOString()
                    },
                    ...(prev.focusStats?.history || [])
                ]
            }
        }))
        addExp(xp)
    }, [addExp])

    const updateAvatar = useCallback((url: string) => {
        setStats((prev) => ({
            ...prev,
            avatarUrl: url
        }))
    }, [])

    return (
        <GamificationContext.Provider value={{ stats, addExp, takeDamage, heal, addFocusSession, updateAvatar, lastXpGain, refreshStats, triggerXpNotification }}>
            {children}
        </GamificationContext.Provider>
    )
}

export function useGamificationContext() {
    const context = useContext(GamificationContext)
    if (context === undefined) {
        throw new Error("useGamificationContext must be used within a GamificationProvider")
    }
    return context
}
