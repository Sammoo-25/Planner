"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Task } from "@/types"
import { TaskForm } from "./task-form"

interface Props {
    open: boolean
    onClose: () => void
    task?: Task
    onSave: (task: Partial<Task> & { subtasks?: string[] }) => void
    onDelete?: (id: string) => void
    zIndex?: number
}

export function EditTaskModal({ open, onClose, task, onSave, onDelete, zIndex }: Props) {
    return (
        <Dialog open={open} zIndex={zIndex}>
            <DialogContent onClose={onClose} className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
                        {task ? "Edit Task" : "New Task"}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <TaskForm
                        task={task}
                        onSave={(data) => { onSave(data); onClose() }}
                        onDelete={onDelete}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
