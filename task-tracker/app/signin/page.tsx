'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Sword, Zap, Trophy, Target } from 'lucide-react'

const FEATURES = [
    { icon: Zap,    text: 'Earn XP for every completed task' },
    { icon: Trophy, text: 'Level up and unlock hero ranks'   },
    { icon: Target, text: 'Focus sessions with Pomodoro timer' },
]

export default function SignInPage() {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const data = await api.signin(formData)
            if (data.token) {
                login(data.user, data.token)
            } else {
                setError(data.message || 'Sign-in failed. Please check your credentials.')
            }
        } catch {
            setError('Unable to connect. Please check the server is running.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-[#07091a]">
            {/* Left: branding panel (hidden on small screens) */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5" />
                <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-white/5" />
                <div className="absolute top-1/2 right-0 h-40 w-40 rounded-full bg-violet-500/20" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Sword className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-base leading-tight">Life RPG Planner</div>
                            <div className="text-indigo-300 text-xs">Gamify your productivity</div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                        Turn tasks into<br />epic quests
                    </h2>
                    <p className="text-indigo-200 text-sm leading-relaxed">
                        Build habits, level up your character, and conquer your goals — one task at a time.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    {FEATURES.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-indigo-100 text-sm">{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: form panel */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex flex-col items-center mb-8 lg:hidden">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(99,102,241,0.4)]">
                            <Sword className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Life RPG Planner</h1>
                    </div>

                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to continue your journey</p>
                    </div>

                    <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-7">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-800/40">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="email" required autoComplete="email"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 rounded-xl"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 rounded-xl"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.45)] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    <> Sign In <ArrowRight className="h-4 w-4" /> </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
