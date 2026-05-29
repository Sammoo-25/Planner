"use client"

import { useTaskStore } from "@/hooks/use-tasks"
import { useGamification } from "@/hooks/use-gamification"
import { useSettingsStore } from "@/hooks/use-settings"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Trash2, RefreshCw, Camera, Globe, AlertTriangle, Check, X } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const { resetData } = useTaskStore()
    const { stats, updateAvatar } = useGamification()
    const { timeZone, setTimeZone } = useSettingsStore()
    const [customUrl, setCustomUrl] = useState("")
    const [confirmReset, setConfirmReset] = useState(false)
    const router = useRouter()

    const PRESETS = [
        "/hero-avatar.png",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop",
    ]

    const handleApplyCustomUrl = () => {
        const trimmed = customUrl.trim()
        if (!trimmed) return
        // Basic URL validation
        try {
            new URL(trimmed)
            updateAvatar(trimmed)
            setCustomUrl("")
        } catch {
            // invalid URL — ignore silently, input border already shows error via focus styles
        }
    }

    const handleReset = () => {
        resetData()
        setConfirmReset(false)
        router.push('/')
    }

    const sectionClass = "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block"
    const sectionHeaderClass = "flex items-center gap-2 mb-4"
    const sectionTitleClass = "text-sm font-semibold text-slate-700 dark:text-slate-300"

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <header className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Settings</h1>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Manage your preferences and data</p>
                </header>

                <div className="p-6 max-w-2xl space-y-4 pb-20 md:pb-6">

                    {/* Avatar */}
                    <div className={sectionClass}>
                        <div className={sectionHeaderClass}>
                            <Camera className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className={sectionTitleClass}>Profile Avatar</h2>
                        </div>
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={stats.avatarUrl}
                                    alt="Current Avatar"
                                    className="h-full w-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/hero-avatar.png' }}
                                />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className={labelClass}>Preset avatars</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESETS.map((url) => (
                                            <button
                                                key={url}
                                                onClick={() => updateAvatar(url)}
                                                className={`h-12 w-12 rounded-lg border-2 transition-all overflow-hidden hover:opacity-90 relative ${
                                                    stats.avatarUrl === url
                                                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                                                        : "border-slate-200 dark:border-slate-700"
                                                }`}
                                            >
                                                <img src={url} alt="" className="h-full w-full object-cover" />
                                                {stats.avatarUrl === url && (
                                                    <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className={labelClass}>Custom image URL</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            placeholder="https://example.com/avatar.jpg"
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomUrl() }}
                                            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        />
                                        <button
                                            onClick={handleApplyCustomUrl}
                                            disabled={!customUrl.trim()}
                                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timezone */}
                    <div className={sectionClass}>
                        <div className={sectionHeaderClass}>
                            <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className={sectionTitleClass}>Time Zone</h2>
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
                    <div className={sectionClass}>
                        <h2 className={`${sectionTitleClass} mb-4`}>Appearance</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose light, dark, or follow system</p>
                            </div>
                            <ModeToggle />
                        </div>
                    </div>

                    {/* Danger zone — inline confirmation, no browser confirm() */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 p-5">
                        <div className={sectionHeaderClass}>
                            <RefreshCw className="h-4 w-4 text-rose-500" />
                            <h2 className={sectionTitleClass}>Reset Data</h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Permanently deletes all your tasks and resets XP/level. This cannot be undone.
                        </p>

                        {!confirmReset ? (
                            <button
                                onClick={() => setConfirmReset(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-medium transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Reset All Data
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                                <div className="flex items-start gap-3 mb-4">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                                        Are you sure? All tasks and progress will be permanently deleted.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Yes, delete everything
                                    </button>
                                    <button
                                        onClick={() => setConfirmReset(false)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
