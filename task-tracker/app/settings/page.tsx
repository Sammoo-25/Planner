"use client"

import { useTaskStore } from "@/hooks/use-tasks"
import { useGamification } from "@/hooks/use-gamification"
import { useSettingsStore } from "@/hooks/use-settings"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, RefreshCw, Upload, Camera, Globe } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useState } from "react"

export default function SettingsPage() {
    const { resetData } = useTaskStore()
    const { stats, updateAvatar } = useGamification()
    const { timeZone, setTimeZone } = useSettingsStore()
    const [customUrl, setCustomUrl] = useState("")

    const presets = [
        "/hero-avatar.png",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop",
    ]

    const handleReset = () => {
        if (confirm("Are you sure? This will delete all your current quests and restore the defaults.")) {
            resetData()
            window.location.href = "/"
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex w-full h-full">
            <Sidebar />

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <header className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Settings</h1>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Manage your preferences and data</p>
                </header>

                <div className="p-6 max-w-2xl space-y-4">
                    {/* Avatar */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Camera className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Avatar</h2>
                        </div>
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                                <img src={stats.avatarUrl} alt="Current Avatar" className="h-full w-full object-cover" />
                            </div>

                            <div className="flex-1 space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Preset avatars</p>
                                    <div className="flex flex-wrap gap-2">
                                        {presets.map((url) => (
                                            <button
                                                key={url}
                                                onClick={() => updateAvatar(url)}
                                                className={`h-12 w-12 rounded-lg border-2 transition-all overflow-hidden hover:opacity-90 ${stats.avatarUrl === url ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200 dark:border-slate-700"}`}
                                            >
                                                <img src={url} className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Custom URL</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="https://example.com/avatar.jpg"
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        />
                                        <button
                                            onClick={() => { if (customUrl) { updateAvatar(customUrl); setCustomUrl("") } }}
                                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timezone */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Time Zone</h2>
                        </div>
                        <select
                            value={timeZone}
                            onChange={(e) => setTimeZone(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                            {Intl.supportedValuesOf('timeZone').map((tz) => (
                                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Current: <span className="font-medium text-slate-600 dark:text-slate-300">{timeZone.replace(/_/g, ' ')}</span>
                        </p>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Appearance</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Toggle between light and dark theme</p>
                            </div>
                            <ModeToggle />
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <RefreshCw className="h-4 w-4 text-rose-500" />
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reset Data</h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Clear all tasks and restore defaults. This cannot be undone.
                        </p>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            Reset All Data
                        </button>
                    </div>
                </div>
            </main>
            </div>
        </div>
    )
}
