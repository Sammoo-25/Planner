"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = ({
    open,
    children,
    className,
    zIndex = 50
}: {
    open?: boolean
    children: React.ReactNode
    className?: string
    zIndex?: number
}) => {
    if (!open) return null
    return (
        <div
            className={cn("fixed inset-0 flex items-center justify-center p-4", className)}
            style={{
                zIndex,
                background: 'rgba(2, 6, 30, 0.72)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div className="animate-modal-in w-full flex justify-center">
                {children}
            </div>
        </div>
    )
}

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200/70 dark:border-slate-700/40",
            "shadow-[0_32px_72px_rgba(0,0,0,0.14),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_32px_72px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.3)]",
            "min-w-[340px]",
            className
        )}
        {...props}
    >
        {onClose && (
            <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Close</span>
            </button>
        )}
        {children}
    </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-semibold leading-tight tracking-tight text-slate-900 dark:text-white", className)}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

export { Dialog, DialogContent, DialogHeader, DialogTitle }
