"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    CheckSquare, Calendar, BarChart3, Settings, Layout,
    Zap, LogIn, UserPlus, LogOut, Sword
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { ModeToggle } from "@/components/mode-toggle"

const NAV_ITEMS = [
    { href: '/',         icon: CheckSquare, label: 'Dashboard'  },
    { href: '/board',    icon: Layout,      label: 'Board'      },
    { href: '/calendar', icon: Calendar,    label: 'Calendar'   },
    { href: '/planner',  icon: Zap,         label: 'Planner'    },
    { href: '/stats',    icon: BarChart3,   label: 'Statistics' },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white dark:bg-[#0d1526] border-r border-slate-200/60 dark:border-slate-800/60 z-50">
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(99,102,241,0.4)]">
                        <Sword className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight tracking-tight">Life RPG</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight font-medium">Planner</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map(item => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={<item.icon className="h-[17px] w-[17px]" />}
                            label={item.label}
                            active={pathname === item.href}
                        />
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="px-3 py-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                    <div className="px-1">
                        <ModeToggle />
                    </div>

                    <div className="space-y-0.5">
                        {user ? (
                            <>
                                <NavItem
                                    href="/settings"
                                    icon={<Settings className="h-[17px] w-[17px]" />}
                                    label="Settings"
                                    active={pathname === '/settings'}
                                />
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all group"
                                >
                                    <span className="text-slate-400 dark:text-slate-500 group-hover:text-rose-500 transition-colors">
                                        <LogOut className="h-[17px] w-[17px]" />
                                    </span>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <NavItem href="/signin"  icon={<LogIn    className="h-[17px] w-[17px]" />} label="Sign In"        active={pathname === '/signin'}  />
                                <NavItem href="/signup"  icon={<UserPlus className="h-[17px] w-[17px]" />} label="Create Account" active={pathname === '/signup'}  />
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-white/95 dark:bg-[#0d1526]/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/60 px-2 py-1.5">
                {NAV_ITEMS.map(item => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all",
                                active
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className={cn("text-[9px] font-semibold", active && "text-indigo-600 dark:text-indigo-400")}>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}

function NavItem({ icon, label, href, active }: {
    icon: React.ReactNode
    label: string
    href: string
    active?: boolean
}) {
    return (
        <Link
            href={href}
            className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                    ? [
                        "bg-gradient-to-r from-indigo-50 to-violet-50/60 dark:from-indigo-950/40 dark:to-violet-950/20",
                        "text-indigo-700 dark:text-indigo-400",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none",
                      ].join(' ')
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            )}
        >
            {/* Left accent bar for active */}
            {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            )}
            <span className={cn(
                "shrink-0 transition-colors",
                active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
            )}>
                {icon}
            </span>
            {label}
        </Link>
    )
}
