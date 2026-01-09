"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number
    max?: number
    indicatorColor?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value, max = 100, indicatorColor = "bg-primary", ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100))

        return (
            <div
                ref={ref}
                className={cn(
                    "relative h-4 w-full overflow-hidden rounded-full bg-sand-300",
                    className
                )}
                {...props}
            >
                <div
                    className={cn("h-full w-full flex-1 transition-all", indicatorColor)}
                    style={{ transform: `translateX(-${100 - percentage}%)` }}
                />
            </div>
        )
    }
)
Progress.displayName = "Progress"

export { Progress }
