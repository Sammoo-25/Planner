"use client"

import React, { useRef, useEffect, useState } from "react"
import { useAgent } from "@/context/AgentContext"
import { useAuth } from "@/context/AuthContext"

export function AgentChat() {
    const { messages, isChatOpen, isLoading, openChat, closeChat, sendMessage, clearChat } = useAgent()
    const { user } = useAuth()
    const [input, setInput] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            inputRef.current?.focus()
        }
    }, [messages, isChatOpen])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || isLoading) return
        setInput("")
        await sendMessage(text)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Quick action prompts
    const quickActions = [
        { label: "Today's quests", prompt: "What should I work on today?" },
        { label: "Plan my day", prompt: "Create a schedule for today" },
        { label: "My progress", prompt: "How am I doing this week?" },
        { label: "Habit check", prompt: "Check my habit streaks" },
    ]

    if (!user) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {isChatOpen && (
                <div className="w-80 sm:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    style={{ height: "480px" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-indigo-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm font-semibold text-white">Quest Advisor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearChat}
                                className="text-indigo-200 hover:text-white text-xs transition-colors"
                                title="Clear chat"
                            >
                                Clear
                            </button>
                            <button
                                onClick={closeChat}
                                className="text-indigo-200 hover:text-white transition-colors text-lg leading-none"
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
                                    <div className="flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick actions */}
                    {messages.length <= 1 && (
                        <div className="px-3 pb-1 flex flex-wrap gap-1">
                            {quickActions.map((a) => (
                                <button
                                    key={a.label}
                                    onClick={() => sendMessage(a.prompt)}
                                    disabled={isLoading}
                                    className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your advisor…"
                            disabled={isLoading}
                            className="flex-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors text-sm font-medium"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => isChatOpen ? closeChat() : openChat()}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                title={isChatOpen ? "Close advisor" : "Open quest advisor"}
            >
                <span className="text-xl">{isChatOpen ? "×" : "⚔"}</span>
            </button>
        </div>
    )
}
