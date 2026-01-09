"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, Settings, Layout, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { LogIn, UserPlus, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    return (
        <aside className="hidden w-20 flex-col items-center border-r border-sand-300 bg-sand-100 py-8 md:flex dark:bg-dark-900 dark:border-dark-700">
            <Link href="/" className="mb-8 rounded-xl bg-dark-900 p-3 text-white shadow-lg shadow-dark-900/20 hover:scale-110 transition-transform dark:bg-white dark:text-dark-900 dark:shadow-white/10">
                <LayoutDashboard className="h-6 w-6" />
            </Link>

            <nav className="flex flex-1 flex-col gap-6">
                <NavItem href="/" icon={<CheckSquare />} label="Tasks" active={pathname === '/'} />
                <NavItem href="/board" icon={<Layout />} label="Board" active={pathname === '/board'} />
                <NavItem href="/calendar" icon={<Calendar />} label="Calendar" active={pathname === '/calendar'} />
                <NavItem href="/planner" icon={<Zap />} label="Planner" active={pathname === '/planner'} />
                <NavItem href="/stats" icon={<BarChart3 />} label="Stats" active={pathname === '/stats'} />
            </nav>

            <div className="mt-auto flex flex-col gap-6">
                {user ? (
                    <>
                        <NavItem href="/settings" icon={<Settings />} label="Settings" active={pathname === '/settings'} />
                        <button
                            onClick={logout}
                            className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="absolute left-14 hidden rounded bg-dark-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white transition-all z-50 group-hover:block whitespace-nowrap shadow-xl">
                                Sign Out
                            </span>
                        </button>
                    </>
                ) : (
                    <>
                        <NavItem href="/signin" icon={<LogIn />} label="Sign In" active={pathname === '/signin'} />
                        <NavItem href="/signup" icon={<UserPlus />} label="Sign Up" active={pathname === '/signup'} />
                    </>
                )}
            </div>
        </aside>
    )
}

function NavItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
    return (
        <Link href={href} className={cn(
            "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all",
            active
                ? "sidebar-item-active"
                : "text-dark-500 hover:bg-white dark:hover:bg-dark-800 hover:shadow-sm"
        )}>
            <span className="h-5 w-5">{icon}</span>
            <span className="absolute left-14 hidden rounded bg-dark-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white transition-all z-50 group-hover:block whitespace-nowrap shadow-xl">
                {label}
            </span>
        </Link>
    )
}
