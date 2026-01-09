"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Task } from "@/types"
import { TaskForm } from "./task-form"

interface Props {
    open: boolean
    onClose: () => void
    task?: Task
    onSave: (task: Partial<Task>) => void
    onDelete?: (id: string) => void
    zIndex?: number
}

export function EditTaskModal({ open, onClose, task, onSave, onDelete, zIndex }: Props) {
    return (
        <Dialog open={open} zIndex={zIndex}>
            <DialogContent onClose={onClose} className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-dark-800 border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-sand-200 dark:border-dark-700 bg-sand-50/50 dark:bg-dark-900/50">
                    <DialogTitle className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                        {task ? "Edit Quest" : "New Quest"}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <TaskForm
                        task={task}
                        onSave={(data) => { onSave(data); onClose(); }}
                        onDelete={onDelete}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
