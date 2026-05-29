"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
            {[
                { value: 'light', icon: Sun,     title: 'Light' },
                { value: 'dark',  icon: Moon,    title: 'Dark'  },
                { value: 'system', icon: Monitor, title: 'Auto'  },
            ].map(({ value, icon: Icon, title }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    title={title}
                    className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                        theme === value
                            ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Icon className="h-3.5 w-3.5" />
                </button>
            ))}
        </div>
    )
}
