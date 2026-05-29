"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Task } from "@/types"
import { TaskDetails } from "./task-details"

interface Props {
    open: boolean
    onClose: () => void
    task?: Task
    onEdit?: (task: Task) => void
    zIndex?: number
}

export function TaskDetailsModal({ open, onClose, task, onEdit, zIndex }: Props) {
    if (!task) return null

    return (
        <Dialog open={open} zIndex={zIndex}>
            <DialogContent onClose={onClose} className="sm:max-w-[450px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Task Details</DialogTitle>
                </DialogHeader>
                <TaskDetails task={task} onClose={onClose} onEdit={onEdit} />
            </DialogContent>
        </Dialog>
    )
}
