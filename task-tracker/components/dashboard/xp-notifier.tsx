"use client"

import React, { useEffect, useState } from "react"
import { useGamificationContext } from "@/context/GamificationContext"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function XpNotifier() {
    const { lastXpGain } = useGamificationContext()
    const [notifications, setNotifications] = useState<{ amount: number; id: number }[]>([])

    useEffect(() => {
        if (lastXpGain) {
            setNotifications((prev) => {
                // Prevent duplicate additions (e.g. from StrictMode)
                if (prev.find(n => n.id === lastXpGain.id)) return prev
                return [...prev, lastXpGain]
            })

            const timer = setTimeout(() => {
                setNotifications((prev) => prev.filter(n => n.id !== lastXpGain.id))
            }, 2000)

            return () => clearTimeout(timer)
        }
    }, [lastXpGain])

    return (
        <div className="fixed top-24 right-8 z-[100] flex flex-col gap-2 pointer-events-none">
            {notifications.map((notif) => {
                const isPositive = notif.amount > 0
                return (
                    <div
                        key={notif.id}
                        className={cn(
                            "flex items-center gap-2 text-white px-4 py-2 rounded-xl shadow-2xl animate-xp-pop border border-white/20",
                            isPositive
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                                : "bg-gradient-to-r from-red-600 to-orange-600"
                        )}
                    >
                        <Zap className={cn("h-4 w-4 fill-white", !isPositive && "text-white")} />
                        <span className="font-black">
                            {isPositive ? "+" : ""}{notif.amount} XP
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
