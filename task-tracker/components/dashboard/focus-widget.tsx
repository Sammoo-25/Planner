"use client"

import { Clock, Target, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
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
                className="group flex items-center gap-4 bg-dark-900 dark:bg-white p-2 pl-4 rounded-2xl shadow-2xl border-none hover:scale-105 transition-all text-white dark:text-dark-900"
            >
                <div className="flex flex-col items-start pr-2 border-r border-white/10 dark:border-dark-900/10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Focusing On</span>
                    <span className="text-xs font-bold truncate max-w-[120px]">{taskName}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black font-mono leading-none">{timeLeft}</span>
                        <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">Remaining</span>
                    </div>
                    <div className="bg-white/10 dark:bg-dark-900/10 p-2 rounded-xl group-hover:bg-status-normal group-hover:text-white transition-colors">
                        <Maximize2 className="h-4 w-4" />
                    </div>
                </div>
            </button>
        </div>
    )
}
