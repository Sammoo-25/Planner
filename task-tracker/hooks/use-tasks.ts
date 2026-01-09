import { useTaskContext } from "@/context/TaskContext"

export function useTaskStore() {
    return useTaskContext()
}
