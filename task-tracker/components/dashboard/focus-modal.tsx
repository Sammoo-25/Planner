"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Task } from "@/types"
import { Play, Pause, RotateCcw, Target, Trophy, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocus } from "@/context/FocusContext"

interface Props {
    tasks: Task[]
}

export function FocusModal({ tasks }: Props) {
    const {
        isModalOpen, closeModal, isActive, seconds, workDuration, phase, notification,
        selectedTaskId, setSelectedTaskId, toggleTimer, resetTimer, skipToPhase,
        setWorkDuration, clearNotification
    } = useFocus()

    const activeTasks = tasks.filter(t => t.status !== 'Done')
    const calculatedReward = Math.floor(10 + (workDuration * 0.5))

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60)
        const secs = Math.floor(s % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const totalSeconds = phase === 'work' ? workDuration * 60 : 5 * 60
    const progress = seconds / totalSeconds

    return (
        <Dialog open={isModalOpen}>
            <DialogContent onClose={closeModal} className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-500" />
                        {phase === 'work' ? 'Focus Session' : 'Break Time'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 flex flex-col items-center gap-6">
                    {/* Phase Toggle */}
                    {!isActive && (
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-center border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => skipToPhase('work')}
                                className={cn(
                                    "px-5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    phase === 'work'
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                            >
                                Work
                            </button>
                            <button
                                onClick={() => skipToPhase('break')}
                                className={cn(
                                    "px-5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    phase === 'break'
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                            >
                                Break
                            </button>
                        </div>
                    )}

                    {/* Timer Circle */}
                    <div className="relative h-56 w-56 flex items-center justify-center">
                        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="44"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-slate-100 dark:text-slate-800"
                            />
                            <circle
                                cx="50" cy="50" r="44"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 44}`}
                                strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
                                strokeLinecap="round"
                                className={cn(
                                    "transition-all duration-1000",
                                    phase === 'work' ? "text-indigo-500" : "text-emerald-500"
                                )}
                            />
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-5xl font-bold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                                {formatTime(seconds)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                                {phase === 'work' ? 'Remaining' : 'Break'}
                            </span>
                        </div>
                    </div>

                    {/* Quest & Duration Selectors */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                                Active Quest
                            </label>
                            <select
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                            >
                                {activeTasks.length > 0 ? (
                                    activeTasks.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))
                                ) : (
                                    <option value="">No active tasks</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                                Duration (min)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="120"
                                disabled={isActive || phase === 'break'}
                                value={workDuration}
                                onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={toggleTimer}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95",
                                isActive
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            )}
                        >
                            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isActive ? 'Pause' : 'Start'}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                            title="Reset timer"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex justify-between items-center text-slate-400 dark:text-slate-500 relative">
                    {/* Victory Notification */}
                    {notification && (
                        <div className={cn(
                            "absolute inset-x-0 bottom-full mb-3 mx-6 p-4 rounded-xl flex items-center gap-3 shadow-lg",
                            notification.type === 'victory'
                                ? "bg-orange-500 dark:bg-orange-600 text-white"
                                : "bg-emerald-500 dark:bg-emerald-600 text-white"
                        )}>
                            <Trophy className="h-5 w-5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold">{notification.message}</p>
                                {notification.type === 'victory' && (
                                    <p className="text-[11px] opacity-80">+{calculatedReward} XP earned</p>
                                )}
                            </div>
                            <button
                                onClick={clearNotification}
                                className="p-1 hover:bg-white/20 rounded-lg shrink-0 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            +{calculatedReward} XP on completion
                        </span>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                        Minimize
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
