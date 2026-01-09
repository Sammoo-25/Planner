"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
    const { setTheme } = useTheme()

    return (
        <div className="flex items-center gap-2 rounded-xl border border-sand-300 bg-sand-200 p-1">
            <button
                onClick={() => setTheme("light")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-500 hover:bg-white hover:text-dark-900 hover:shadow-sm dark:hover:bg-sand-300"
                title="Light Mode"
            >
                <Sun className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-500 hover:bg-white hover:text-dark-900 hover:shadow-sm dark:hover:bg-sand-300"
                title="Dark Mode"
            >
                <Moon className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className="flex h-auto px-2 text-xs font-medium text-dark-500 hover:text-dark-900"
            >
                Auto
            </button>
        </div>
    )
}
