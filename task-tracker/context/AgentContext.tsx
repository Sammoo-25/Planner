"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { api } from "@/lib/api"

interface Message {
    role: "user" | "assistant"
    content: string
    agentName?: string
    timestamp: Date
}

interface CompanionData {
    message: string
    tone: "encouraging" | "alert" | "celebratory" | "advisory"
    suggested_action?: string
}

interface AgentContextType {
    messages: Message[]
    isChatOpen: boolean
    isLoading: boolean
    companionData: CompanionData | null
    openChat: () => void
    closeChat: () => void
    sendMessage: (text: string) => Promise<void>
    loadCompanion: () => Promise<void>
    clearChat: () => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Greetings, Champion! I'm your Quest Advisor. Ask me what to work on today, say 'plan my day', or ask about your progress.",
            agentName: "companion",
            timestamp: new Date(),
        }
    ])
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [companionData, setCompanionData] = useState<CompanionData | null>(null)

    const openChat = useCallback(() => setIsChatOpen(true), [])
    const closeChat = useCallback(() => setIsChatOpen(false), [])
    const clearChat = useCallback(() => {
        setMessages([{
            role: "assistant",
            content: "Greetings, Champion! How can I guide you today?",
            agentName: "companion",
            timestamp: new Date(),
        }])
    }, [])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return

        const userMsg: Message = { role: "user", content: text, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        try {
            const data = await api.agentChat(text)
            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.response || "Your advisor is momentarily silent. Try again.",
                agentName: data.agent_name,
                timestamp: new Date(),
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "The Oracle is momentarily silent. Your quests await — try again shortly.",
                agentName: "fallback",
                timestamp: new Date(),
            }])
        } finally {
            setIsLoading(false)
        }
    }, [isLoading])

    const loadCompanion = useCallback(async () => {
        try {
            const data = await api.getAgentCompanion()
            setCompanionData(data)
        } catch {
            // Companion is non-critical — fail silently
        }
    }, [])

    return (
        <AgentContext.Provider value={{
            messages, isChatOpen, isLoading, companionData,
            openChat, closeChat, sendMessage, loadCompanion, clearChat,
        }}>
            {children}
        </AgentContext.Provider>
    )
}

export function useAgent() {
    const ctx = useContext(AgentContext)
    if (!ctx) throw new Error("useAgent must be used within AgentProvider")
    return ctx
}
