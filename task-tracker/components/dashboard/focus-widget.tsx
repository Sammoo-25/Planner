"use client"

import { Maximize2 } from "lucide-react"
import { useFocus } from "@/context/FocusContext"
import { Task } from "@/types"

interface Props {
    tasks: Task[]
}

export function FocusWidget({ tasks }: Props) {
    const { isModalOpen, isActive, seconds, selectedTaskId, openModal } = useFocus()

    if (isModalOpen || !isActive) return null

    const task = tasks.find(t => t.id === selectedTaskId)
    const taskName = task?.title || "Focus Session"

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const timeLeft = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <button
                onClick={openModal}
                className="group flex items-center gap-3 bg-slate-900 dark:bg-slate-800 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/50 hover:scale-105 active:scale-95 transition-all text-white"
            >
                <div className="flex flex-col items-start pr-3 border-r border-slate-700">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Focusing</span>
                    <span className="text-xs font-semibold truncate max-w-[120px] text-slate-100">{taskName}</span>
                </div>

                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold font-mono tabular-nums text-white">{timeLeft}</span>
                    <div className="bg-slate-700 group-hover:bg-indigo-600 p-1.5 rounded-lg transition-colors">
                        <Maximize2 className="h-3.5 w-3.5" />
                    </div>
                </div>
            </button>
        </div>
    )
}
