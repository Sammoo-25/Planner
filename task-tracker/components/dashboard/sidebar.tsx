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
            <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex z-50">
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                        <Sword className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">Life RPG</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Planner</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map(item => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={<item.icon className="h-4 w-4" />}
                            label={item.label}
                            active={pathname === item.href}
                        />
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="px-1">
                        <ModeToggle />
                    </div>

                    <div className="space-y-0.5">
                        {user ? (
                            <>
                                <NavItem href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" active={pathname === '/settings'} />
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <NavItem href="/signin"  icon={<LogIn    className="h-4 w-4" />} label="Sign In"        active={pathname === '/signin'}  />
                                <NavItem href="/signup"  icon={<UserPlus className="h-4 w-4" />} label="Create Account" active={pathname === '/signup'}  />
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1 safe-area-bottom">
                {NAV_ITEMS.map(item => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors",
                                active
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-400 dark:text-slate-500"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[9px] font-medium">{item.label}</span>
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            )}
        >
            <span className={cn(
                "shrink-0",
                active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
            )}>
                {icon}
            </span>
            {label}
        </Link>
    )
}
