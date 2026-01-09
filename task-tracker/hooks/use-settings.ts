import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    timeZone: string
    setTimeZone: (timeZone: string) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            setTimeZone: (timeZone) => set({ timeZone }),
        }),
        {
            name: 'planner-settings',
        }
    )
)
