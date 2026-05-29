"use client"

import React, {
    createContext, useContext, useState, useEffect,
    useCallback, useRef, ReactNode
} from "react"
import { PlayerStats, INITIAL_STATS } from "@/types"
import { api } from "@/lib/api"
import { useAuth } from "./AuthContext"

interface GamificationContextType {
    stats: PlayerStats
    addExp: (amount: number) => void
    takeDamage: (amount: number) => void
    heal: (amount: number) => void
    addFocusSession: (taskId: string, minutes: number, xp: number) => void
    updateAvatar: (url: string) => void
    lastXpGain: { amount: number; id: string } | null
    refreshStats: () => Promise<void>
    triggerXpNotification: (amount: number) => void
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

export function GamificationProvider({ children }: { children: ReactNode }) {
    const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS)
    const [lastXpGain, setLastXpGain] = useState<{ amount: number; id: string } | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const { token } = useAuth()

    // Tracks whether the last stats change came from a user action (true)
    // or from fetching remote data (false). Only sync back when from user action.
    const isLocalChange = useRef(false)

    const fetchStats = useCallback(async () => {
        if (!token) return
        try {
            const data = await api.getStats()
            if (data && !data.message) {
                isLocalChange.current = false // mark as remote fetch, don't write back
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
        if (typeof window !== 'undefined') {
            localStorage.removeItem('player-stats')
        }
        if (token) {
            fetchStats()
        } else {
            setStats(INITIAL_STATS)
            setIsLoaded(true)
        }
    }, [token, fetchStats])

    // Sync to backend — ONLY when a local user action changed stats
    useEffect(() => {
        if (!isLoaded || !token || !isLocalChange.current) return

        const payload = {
            level: stats.level,
            current_exp: stats.currentExp,
            max_exp: stats.maxExp,
            health: stats.health,
            avatar_url: stats.avatarUrl,
            total_xp: stats.totalXP,
            focus_total_sessions: stats.focusStats?.totalSessions ?? 0,
            focus_total_minutes: stats.focusStats?.totalMinutes ?? 0
        }
        api.updateStats(payload).catch(err => console.error("Failed to sync stats", err))
    }, [stats, isLoaded, token])

    const refreshStats = fetchStats

    const triggerXpNotification = useCallback((amount: number) => {
        const id = `${Date.now()}-${Math.random()}`
        setLastXpGain({ amount, id })
        setTimeout(() => setLastXpGain(null), 2000)
    }, [])

    const addExp = useCallback((amount: number) => {
        isLocalChange.current = true
        setStats(prev => {
            const todayStr = new Date().toISOString().split('T')[0]
            let newExp = prev.currentExp + amount
            let newLevel = prev.level
            let newMaxExp = prev.maxExp
            const newTotalXP = (prev.totalXP || 0) + Math.max(0, amount)

            const existingHistory = [...(prev.xpHistory || [])]
            const todayIndex = existingHistory.findIndex(h => h.date === todayStr)
            if (todayIndex >= 0) existingHistory[todayIndex].amount += amount
            else existingHistory.push({ date: todayStr, amount })

            if (newExp >= newMaxExp) {
                newExp -= newMaxExp
                newLevel += 1
                newMaxExp = Math.floor(newMaxExp * 1.2)
            }
            if (newExp < 0) newExp = 0

            return { ...prev, level: newLevel, currentExp: newExp, maxExp: newMaxExp, totalXP: newTotalXP, xpHistory: existingHistory }
        })
        triggerXpNotification(amount)
    }, [triggerXpNotification])

    const takeDamage = useCallback((amount: number) => {
        isLocalChange.current = true
        setStats(prev => ({ ...prev, health: Math.max(0, prev.health - amount) }))
    }, [])

    const heal = useCallback((amount: number) => {
        isLocalChange.current = true
        setStats(prev => ({ ...prev, health: Math.min(100, prev.health + amount) }))
    }, [])

    const addFocusSession = useCallback((taskId: string, minutes: number, xp: number) => {
        isLocalChange.current = true
        setStats(prev => ({
            ...prev,
            focusStats: {
                totalSessions: (prev.focusStats?.totalSessions || 0) + 1,
                totalMinutes: (prev.focusStats?.totalMinutes || 0) + minutes,
                history: [
                    { id: Math.random().toString(), taskId, duration: minutes, xpEarned: xp, timestamp: new Date().toISOString() },
                    ...(prev.focusStats?.history || [])
                ]
            }
        }))
        addExp(xp)
    }, [addExp])

    const updateAvatar = useCallback((url: string) => {
        isLocalChange.current = true
        setStats(prev => ({ ...prev, avatarUrl: url }))
    }, [])

    return (
        <GamificationContext.Provider value={{
            stats, addExp, takeDamage, heal, addFocusSession,
            updateAvatar, lastXpGain, refreshStats, triggerXpNotification
        }}>
            {children}
        </GamificationContext.Provider>
    )
}

export function useGamificationContext() {
    const context = useContext(GamificationContext)
    if (context === undefined) throw new Error("useGamificationContext must be used within a GamificationProvider")
    return context
}
