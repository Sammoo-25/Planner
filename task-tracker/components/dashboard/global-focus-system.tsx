"use client"

import { useTaskStore } from "@/hooks/use-tasks"
import { FocusModal } from "./focus-modal"
import { FocusWidget } from "./focus-widget"

export function GlobalFocusSystem() {
    const { tasks, isLoaded } = useTaskStore()

    if (!isLoaded) return null

    return (
        <>
            <FocusModal tasks={tasks} />
            <FocusWidget tasks={tasks} />
        </>
    )
}
