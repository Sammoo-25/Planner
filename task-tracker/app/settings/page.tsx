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
        <div className="flex min-h-screen bg-sand-100 font-sans text-dark-900">
            <Sidebar />

            <main className="flex-1 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-dark-500">Manage your game data and preferences.</p>
                </header>

                <div className="max-w-2xl space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5 text-blue-500" />
                                Hero Profile
                            </CardTitle>
                            <CardDescription>Customize your hero's appearance in the hub.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="relative h-32 w-32 rounded-full border-4 border-status-normal/20 overflow-hidden shadow-2xl">
                                    <img src={stats.avatarUrl} alt="Current Avatar" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload className="h-8 w-8 text-white" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <p className="text-sm font-black uppercase tracking-widest text-dark-400">Select Preset</p>
                                    <div className="flex flex-wrap gap-3">
                                        {presets.map((url) => (
                                            <button
                                                key={url}
                                                onClick={() => updateAvatar(url)}
                                                className={`h-16 w-16 rounded-xl border-2 transition-all overflow-hidden hover:scale-105 active:scale-95 ${stats.avatarUrl === url ? "border-status-normal ring-2 ring-status-normal/20" : "border-sand-200 dark:border-dark-700"}`}
                                            >
                                                <img src={url} className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-widest text-dark-400">Custom Image URL</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                value={customUrl}
                                                onChange={(e) => setCustomUrl(e.target.value)}
                                                className="flex-1 bg-white dark:bg-dark-900 border-sand-200 dark:border-dark-700"
                                            />
                                            <button
                                                onClick={() => { if (customUrl) updateAvatar(customUrl); setCustomUrl(""); }}
                                                className="px-4 py-2 bg-dark-900 text-white dark:bg-white dark:text-dark-900 rounded-xl font-bold text-sm"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-500" />
                                Regional Settings
                            </CardTitle>
                            <CardDescription>Adjust your time zone to stay in sync with your local time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-dark-400">Time Zone</label>
                                <select
                                    value={timeZone}
                                    onChange={(e) => setTimeZone(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-sand-50 dark:bg-dark-900 border border-sand-200 dark:border-dark-700 font-bold text-dark-900 dark:text-white"
                                >
                                    {Intl.supportedValuesOf('timeZone').map((tz) => (
                                        <option key={tz} value={tz}>
                                            {tz.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-dark-500 mt-2">
                                    Current Selection: <span className="font-bold text-status-normal">{timeZone.replace(/_/g, ' ')}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Appearance Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-sand-100 dark:bg-dark-900/50">
                                <div>
                                    <p className="font-bold">Dark Mode</p>
                                    <p className="text-xs text-dark-400">Toggle dark and light themes</p>
                                </div>
                                <ModeToggle />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Reset Game Data
                            </CardTitle>
                            <CardDescription>
                                Clear all your current quests and restore the initial "New Game" state.
                                This is useful for testing or restarting your journey.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 rounded-lg bg-status-overdue px-4 py-2 text-white hover:bg-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                                Reset Data
                            </button>
                            <p className="mt-2 text-xs text-dark-500">
                                * This action cannot be undone. Your tasks will be replaced with defaults.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="opacity-60">
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Level: {stats.level}</p>
                            <p className="text-sm text-dark-500">Local Player (No cloud sync)</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
