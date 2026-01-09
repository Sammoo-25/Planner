"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useGamification } from "@/hooks/use-gamification"

interface FocusContextType {
    isActive: boolean
    seconds: number
    workDuration: number
    selectedTaskId: string
    phase: 'work' | 'break'
    isModalOpen: boolean
    notification: { message: string, type: 'victory' | 'rest' } | null

    // Actions
    startFocus: (taskId: string, minutes: number) => void
    toggleTimer: () => void
    resetTimer: () => void
    skipToPhase: (phase: 'work' | 'break') => void
    setWorkDuration: (mins: number) => void
    setSelectedTaskId: (id: string) => void
    openModal: () => void
    closeModal: () => void
    clearNotification: () => void
}

const FocusContext = createContext<FocusContextType | undefined>(undefined)

export function FocusProvider({ children }: { children: React.ReactNode }) {
    const { addFocusSession } = useGamification()

    const [isActive, setIsActive] = useState(false)
    const [seconds, setSeconds] = useState(25 * 60)
    const [workDuration, setWorkDuration] = useState(25)
    const [selectedTaskId, setSelectedTaskId] = useState("")
    const [phase, setPhase] = useState<'work' | 'break'>('work')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [notification, setNotification] = useState<{ message: string, type: 'victory' | 'rest' } | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem("focus-state")
        if (saved) {
            try {
                const data = JSON.parse(saved)
                setIsActive(data.isActive)
                setSeconds(data.seconds)
                setWorkDuration(data.workDuration)
                setSelectedTaskId(data.selectedTaskId)
                setPhase(data.phase)
            } catch (e) {
                console.error("Failed to load focus state", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage
    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem("focus-state", JSON.stringify({
            isActive, seconds, workDuration, selectedTaskId, phase
        }))
    }, [isActive, seconds, workDuration, selectedTaskId, phase, isLoaded])

    const calculatedReward = Math.floor(10 + (workDuration * 0.5))

    useEffect(() => {
        if (!isLoaded) return
        let interval: NodeJS.Timeout | null = null

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(prev => prev - 1)
            }, 1000)
        } else if (seconds <= 0 && isActive) {
            setIsActive(false)
            if (phase === 'work') {
                addFocusSession(selectedTaskId, workDuration, calculatedReward)
                setNotification({ message: "Quest Victory! XP Gained.", type: 'victory' })
                setPhase('break')
                setSeconds(5 * 60)
            } else {
                setNotification({ message: "Rest Over! Ready for Battle?", type: 'rest' })
                setPhase('work')
                setSeconds(workDuration * 60)
            }
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isActive, seconds, phase, addFocusSession, workDuration, calculatedReward, isLoaded, selectedTaskId])

    // Actions
    const skipToPhase = useCallback((newPhase: 'work' | 'break') => {
        setIsActive(false)
        setPhase(newPhase)
        setSeconds(newPhase === 'work' ? workDuration * 60 : 5 * 60)
    }, [workDuration])

    const startFocus = useCallback((taskId: string, minutes: number) => {
        setSelectedTaskId(taskId)
        setWorkDuration(minutes)
        setSeconds(minutes * 60)
        setIsActive(true)
        setPhase('work')
        setIsModalOpen(true)
    }, [])

    const toggleTimer = useCallback(() => setIsActive(prev => !prev), [])

    const resetTimer = useCallback(() => {
        setIsActive(false)
        setSeconds(phase === 'work' ? workDuration * 60 : 5 * 60)
    }, [phase, workDuration])

    const handleSetWorkDuration = useCallback((mins: number) => {
        if (isActive) return
        const val = Math.max(1, Math.min(120, mins))
        setWorkDuration(val)
        // Only update current seconds if we are in the work phase and not active
        if (phase === 'work') {
            setSeconds(val * 60)
        }
    }, [isActive, phase])

    return (
        <FocusContext.Provider value={{
            isActive, seconds, workDuration, selectedTaskId, phase, isModalOpen, notification,
            startFocus, toggleTimer, resetTimer, skipToPhase,
            setWorkDuration: handleSetWorkDuration,
            setSelectedTaskId,
            openModal: () => setIsModalOpen(true),
            closeModal: () => setIsModalOpen(false),
            clearNotification: () => setNotification(null)
        }}>
            {children}
        </FocusContext.Provider>
    )
}

export function useFocus() {
    const context = useContext(FocusContext)
    if (!context) throw new Error("useFocus must be used within a FocusProvider")
    return context
}
