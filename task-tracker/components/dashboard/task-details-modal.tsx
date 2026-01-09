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
            <DialogContent onClose={onClose} className="sm:max-w-[450px] p-6 bg-white dark:bg-dark-800 border-none shadow-2xl">
                {/* Hidden title for accessibility/structure, visual title is in TaskDetails */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Quest Details</DialogTitle>
                </DialogHeader>

                <TaskDetails
                    task={task}
                    onClose={onClose}
                    onEdit={onEdit}
                />
            </DialogContent>
        </Dialog>
    )
}
