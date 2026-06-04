"use client"

import React, { useEffect } from "react"
import { useAgent } from "@/context/AgentContext"
import { useAuth } from "@/context/AuthContext"

const TONE_STYLES = {
    encouraging: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
    alert: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    celebratory: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200",
    advisory: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
}

const TONE_ICONS = {
    encouraging: "⚡",
    alert: "⚠️",
    celebratory: "🏆",
    advisory: "🔮",
}

export function CompanionBadge() {
    const { companionData, loadCompanion, openChat } = useAgent()
    const { user, token } = useAuth()

    useEffect(() => {
        if (token && user) {
            loadCompanion()
        }
    }, [token, user, loadCompanion])

    if (!companionData || !user) return null

    const tone = companionData.tone || "advisory"
    const styles = TONE_STYLES[tone]
    const icon = TONE_ICONS[tone]

    return (
        <div
            className={`rounded-xl border p-3 cursor-pointer hover:opacity-90 transition-opacity ${styles}`}
            onClick={openChat}
            title="Click to chat with your advisor"
        >
            <div className="flex items-start gap-2">
                <span className="text-base mt-0.5 shrink-0">{icon}</span>
                <div className="min-w-0">
                    <p className="text-sm leading-snug">{companionData.message}</p>
                    {companionData.suggested_action && (
                        <p className="text-xs mt-1 opacity-70">
                            💡 {companionData.suggested_action}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
