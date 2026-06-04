"use client"

import React, { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

interface Insight {
    title: string
    description: string
    value?: string
    trend?: "up" | "down" | "stable"
}

interface AnalyticsData {
    productivity_trend: string
    consistency_score: number
    best_category?: string
    worst_category?: string
    level_up_eta_days?: number
    weekly_narrative: string
    actionable_insights: string[]
    insights: Insight[]
}

const TREND_ICON = { up: "↑", down: "↓", stable: "→" }
const TREND_COLOR = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-red-500 dark:text-red-400",
    stable: "text-slate-500 dark:text-slate-400",
}

interface InsightsPanelProps {
    timeRange?: "7d" | "30d" | "all"
}

export function InsightsPanel({ timeRange = "30d" }: InsightsPanelProps) {
    const { token } = useAuth()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(false)

    const loadInsights = useCallback(async () => {
        if (!token) return
        setIsLoading(true)
        setError(false)
        try {
            const result = await api.getAgentInsights(timeRange)
            if (result && !result.fallback) {
                setData(result)
            }
        } catch {
            setError(true)
        } finally {
            setIsLoading(false)
        }
    }, [token, timeRange])

    useEffect(() => {
        loadInsights()
    }, [loadInsights])

    if (isLoading) {
        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🔮</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">AI Insights</span>
                </div>
                <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-4/5" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-3/5" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3" />
                </div>
            </div>
        )
    }

    if (error || !data) return null

    const trendColors = {
        ascending: "text-emerald-600 dark:text-emerald-400",
        steady: "text-slate-600 dark:text-slate-400",
        declining: "text-red-500 dark:text-red-400",
    }
    const trendIcons = { ascending: "↑", steady: "→", declining: "↓" }
    const trendColor = trendColors[data.productivity_trend as keyof typeof trendColors] || trendColors.steady
    const trendIcon = trendIcons[data.productivity_trend as keyof typeof trendIcons] || "→"

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">🔮</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">AI Insights</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${trendColor}`}>
                        {trendIcon} {data.productivity_trend}
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Narrative */}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{data.weekly_narrative}"
                </p>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Consistency</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {Math.round(data.consistency_score * 100)}%
                        </p>
                    </div>
                    {data.level_up_eta_days !== null && data.level_up_eta_days !== undefined && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">Level Up ETA</p>
                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                {data.level_up_eta_days < 1
                                    ? "Today!"
                                    : `${data.level_up_eta_days}d`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Metric cards */}
                {data.insights && data.insights.length > 0 && (
                    <div className="space-y-2">
                        {data.insights.slice(0, 3).map((insight, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{insight.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{insight.description}</p>
                                </div>
                                {insight.trend && (
                                    <span className={`text-sm font-bold shrink-0 ${TREND_COLOR[insight.trend]}`}>
                                        {insight.value || TREND_ICON[insight.trend]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actionable insights */}
                {data.actionable_insights && data.actionable_insights.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Recommendations
                        </p>
                        {data.actionable_insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-indigo-500 text-xs mt-0.5 shrink-0">→</span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{insight}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
