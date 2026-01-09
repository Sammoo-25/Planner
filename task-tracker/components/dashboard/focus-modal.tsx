"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Task } from "@/types"
import { Play, Pause, RotateCcw, Target, Trophy } from "lucide-react"
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

    return (
        <Dialog open={isModalOpen}>
            <DialogContent onClose={closeModal} className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-dark-800 border-none shadow-2xl rounded-3xl">
                <DialogHeader className="px-6 py-4 border-b border-sand-100 dark:border-dark-700 bg-sand-50/50 dark:bg-dark-900/50">
                    <DialogTitle className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-status-normal" />
                        {phase === 'work' ? 'Focus Mode' : 'Rest Phase'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 flex flex-col items-center">
                    {/* Phase Toggle */}
                    {!isActive && (
                        <div className="flex bg-sand-100 dark:bg-dark-900/50 p-1 rounded-2xl mb-8 self-center border border-sand-200 dark:border-dark-700">
                            <button
                                onClick={() => skipToPhase('work')}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    phase === 'work' ? "bg-dark-900 text-white dark:bg-white dark:text-dark-900 shadow-md" : "text-dark-400 hover:text-dark-600"
                                )}
                            >
                                Combat Phase
                            </button>
                            <button
                                onClick={() => skipToPhase('break')}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    phase === 'break' ? "bg-status-normal text-white shadow-md" : "text-dark-400 hover:text-dark-600"
                                )}
                            >
                                Rest Phase
                            </button>
                        </div>
                    )}

                    {/* Timer Circle */}
                    <div className="relative h-64 w-64 flex items-center justify-center mb-0">
                        <svg className="absolute inset-0 h-full w-full -rotate-90">
                            <circle
                                cx="50%" cy="50%" r="48%"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-sand-100 dark:text-dark-700"
                            />
                            <circle
                                cx="50%" cy="50%" r="48%"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray="301.59"
                                strokeDashoffset={301.59 * (1 - seconds / (phase === 'work' ? workDuration * 60 : 5 * 60))}
                                className={cn(
                                    "transition-all duration-1000",
                                    phase === 'work' ? "text-status-normal" : "text-green-500"
                                )}
                            />
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-6xl font-black text-dark-900 dark:text-white font-mono">
                                {formatTime(seconds)}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark-400 mt-2">
                                {phase === 'work' ? 'Until Victory' : 'Regeneration'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8 mt-8">
                        {/* Task Selector */}
                        <div className="flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-dark-400 mb-2 block">Focus Quest</label>
                            <select
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                                className="w-full bg-sand-50 dark:bg-dark-900 border border-sand-200 dark:border-dark-700 rounded-xl px-4 py-3 text-xs font-bold text-dark-900 dark:text-white focus:ring-2 focus:ring-status-normal outline-none transition-all"
                            >
                                {activeTasks.length > 0 ? (
                                    activeTasks.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))
                                ) : (
                                    <option value="">No Active Quests</option>
                                )}
                            </select>
                        </div>

                        {/* Duration Selector */}
                        <div className="w-24">
                            <label className="text-[10px] font-black uppercase tracking-widest text-dark-400 mb-2 block">Set Minutes</label>
                            <input
                                type="number"
                                min="1"
                                max="120"
                                disabled={isActive || phase === 'break'}
                                value={workDuration}
                                onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
                                className="w-full bg-sand-50 dark:bg-dark-900 border border-sand-200 dark:border-dark-700 rounded-xl px-4 py-3 text-xs font-bold text-dark-900 dark:text-white focus:ring-2 focus:ring-status-normal outline-none transition-all disabled:opacity-30"
                                title={phase === 'break' ? "Switch to Combat Phase to edit work duration" : ""}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 w-full">
                        <button
                            onClick={toggleTimer}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95",
                                isActive
                                    ? "bg-sand-100 text-dark-900 hover:bg-sand-200 dark:bg-dark-700 dark:text-white"
                                    : "bg-dark-900 text-white hover:bg-dark-800 dark:bg-white dark:text-dark-900"
                            )}
                        >
                            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isActive ? 'Pause' : 'Commence'}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="bg-sand-100 text-dark-500 p-4 rounded-2xl hover:bg-sand-200 dark:bg-dark-700 dark:text-sand-400 transition-all active:scale-95"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 pt-0 flex justify-between items-center text-dark-400 relative">
                    {/* Victory Notification Popup */}
                    {notification && (
                        <div className={cn(
                            "absolute inset-x-0 bottom-full mb-4 mx-8 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom shadow-xl border-none",
                            notification.type === 'victory' ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                        )}>
                            <Trophy className="h-6 w-6" />
                            <div className="flex-1">
                                <p className="text-xs font-black uppercase tracking-widest">{notification.message}</p>
                                {notification.type === 'victory' && <p className="text-[10px] font-bold opacity-80">+{calculatedReward} XP added to your total</p>}
                            </div>
                            <button onClick={clearNotification} className="p-1 hover:bg-white/20 rounded-lg">
                                <RotateCcw className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-orange-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">+{calculatedReward} XP Reward</span>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-[10px] font-black uppercase tracking-widest hover:text-dark-900 dark:hover:text-white transition-colors"
                    >
                        Minimize
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
