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
        <aside className="hidden w-20 flex-col items-center border-r border-white/20 bg-white/10 backdrop-blur-xl py-8 md:flex dark:bg-black/20 dark:border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
            <Link href="/" className="relative mb-8 group">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative rounded-2xl bg-gradient-to-tr from-stone-900 to-stone-800 p-3.5 text-white shadow-xl shadow-stone-900/20 group-hover:scale-110 group-active:scale-95 transition-all duration-300 dark:from-white dark:to-zinc-200 dark:text-stone-900 dark:shadow-white/10 ring-1 ring-white/10 dark:ring-black/10">
                    <LayoutDashboard className="h-6 w-6" />
                </div>
            </Link>

            <nav className="flex flex-1 flex-col gap-6 mt-4">
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
                            className="group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/10"
                        >
                            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="absolute left-16 hidden rounded-lg bg-stone-900 dark:bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white dark:text-stone-900 transition-all duration-200 z-50 group-hover:block whitespace-nowrap shadow-xl before:absolute before:-left-1 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-inherit before:rotate-45">
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
            "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
            active
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 scale-110"
                : "text-stone-400 dark:text-zinc-500 hover:bg-white/20 hover:text-stone-900 dark:hover:bg-white/10 dark:hover:text-white hover:scale-105"
        )}>
            {active && (
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-md opacity-40 animate-pulse" />
            )}
            <span className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110">{icon}</span>
            <span className="absolute left-16 hidden rounded-lg bg-stone-900 dark:bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white dark:text-stone-900 transition-all duration-200 z-50 group-hover:block whitespace-nowrap shadow-xl before:absolute before:-left-1 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-inherit before:rotate-45">
                {label}
            </span>
        </Link>
    )
}
