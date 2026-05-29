"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Task } from "@/types"
import { Play, Pause, RotateCcw, Target, Trophy, X, Coffee, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocus } from "@/context/FocusContext"

interface Props { tasks: Task[] }

export function FocusModal({ tasks }: Props) {
    const {
        isModalOpen, closeModal, isActive, seconds, workDuration, phase, notification,
        selectedTaskId, setSelectedTaskId, toggleTimer, resetTimer, skipToPhase,
        setWorkDuration, clearNotification
    } = useFocus()

    const activeTasks     = tasks.filter(t => t.status !== 'Done')
    const calculatedReward= Math.floor(10 + (workDuration * 0.5))
    const totalSeconds    = phase === 'work' ? workDuration * 60 : 5 * 60
    const progress        = Math.max(0, Math.min(1, seconds / totalSeconds))

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

    // SVG circle math
    const R = 80
    const C = 2 * Math.PI * R
    const offset = C * (1 - progress)

    const isWork  = phase === 'work'
    const accent  = isWork ? 'text-indigo-500' : 'text-emerald-500'
    const accentBg= isWork ? 'from-indigo-500 to-violet-600' : 'from-emerald-500 to-teal-600'

    return (
        <Dialog open={isModalOpen} zIndex={90}>
            <DialogContent
                onClose={closeModal}
                className="w-full sm:max-w-sm p-0 overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center",
                        isWork ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-emerald-50 dark:bg-emerald-950/40"
                    )}>
                        {isWork ? <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <Coffee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                            {isWork ? 'Focus Session' : 'Break Time'}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                            {isWork ? `+${calculatedReward} XP on completion` : '5 minute rest'}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Phase toggle (only when paused) */}
                    {!isActive && (
                        <div className="flex bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/40">
                            {[
                                { value: 'work', label: 'Focus', icon: Zap },
                                { value: 'break', label: 'Break', icon: Coffee },
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => skipToPhase(value as 'work' | 'break')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                                        phase === value
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Timer circle */}
                    <div className="flex items-center justify-center">
                        <div className="relative h-52 w-52">
                            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 200 200">
                                <defs>
                                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={isWork ? "#6366f1" : "#10b981"} />
                                        <stop offset="100%" stopColor={isWork ? "#8b5cf6" : "#0d9488"} />
                                    </linearGradient>
                                </defs>
                                {/* Track */}
                                <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="10"
                                    className="text-slate-100 dark:text-slate-800" />
                                {/* Progress */}
                                <circle
                                    cx="100" cy="100" r={R}
                                    fill="none"
                                    stroke="url(#timerGradient)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={C}
                                    strokeDashoffset={offset}
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>

                            {/* Time display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[2.5rem] font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-none tracking-tight">
                                    {timeDisplay}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                                    {isWork ? 'remaining' : 'rest'}
                                </span>
                                {isActive && (
                                    <div className="flex gap-1 mt-3">
                                        {[0, 1, 2].map(i => (
                                            <div key={i}
                                                className={cn("h-1.5 w-1.5 rounded-full", isWork ? "bg-indigo-400" : "bg-emerald-400")}
                                                style={{ animationDelay: `${i * 0.2}s`, animation: 'pulse 1s ease-in-out infinite' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quest + Duration selectors */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                                Active Quest
                            </label>
                            <select
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                            >
                                {activeTasks.length > 0
                                    ? activeTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)
                                    : <option value="">No active tasks</option>
                                }
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                                Minutes
                            </label>
                            <input
                                type="number" min="1" max="120"
                                disabled={isActive || phase === 'break'}
                                value={workDuration}
                                onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTimer}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] shadow-sm",
                                isActive
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    : `bg-gradient-to-r ${accentBg} text-white hover:opacity-90 shadow-[0_4px_12px_rgba(99,102,241,0.3)]`
                            )}
                        >
                            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                            {isActive ? 'Pause' : 'Start'}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Reset timer"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex items-center justify-between relative">
                    {/* Victory notification */}
                    {notification && (
                        <div className={cn(
                            "absolute inset-x-4 bottom-full mb-3 p-4 rounded-xl flex items-center gap-3 shadow-lg animate-fade-in-up",
                            notification.type === 'victory'
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                        )}>
                            <Trophy className="h-5 w-5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold">{notification.message}</p>
                                {notification.type === 'victory' && (
                                    <p className="text-[11px] opacity-80">+{calculatedReward} XP earned</p>
                                )}
                            </div>
                            <button onClick={clearNotification} className="p-1 hover:bg-white/20 rounded-lg shrink-0 transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span className="font-medium">+{calculatedReward} XP reward</span>
                    </div>
                    <button onClick={closeModal} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                        Minimize
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
