'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Mail, Lock, User, ArrowRight, Loader2, Sword, Zap, Trophy, Target } from 'lucide-react'

const FEATURES = [
    { icon: Zap,    text: 'Earn XP for every completed task' },
    { icon: Trophy, text: 'Level up and unlock hero ranks'   },
    { icon: Target, text: 'Focus sessions with Pomodoro timer' },
]

export default function SignUpPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const data = await api.signup(formData)
            if (data.token) {
                login(data.user, data.token)
            } else {
                setError(data.message || 'Sign-up failed. Please try again.')
            }
        } catch {
            setError('Unable to connect. Please check the server is running.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-[#07091a]">
            {/* Left: branding */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 p-10 relative overflow-hidden">
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
                        Start your<br />hero journey
                    </h2>
                    <p className="text-indigo-200 text-sm leading-relaxed">
                        Create your account and begin transforming everyday tasks into epic quests.
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

            {/* Right: form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex flex-col items-center mb-8 lg:hidden">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(99,102,241,0.4)]">
                            <Sword className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Life RPG Planner</h1>
                    </div>

                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Free forever. No credit card needed.</p>
                    </div>

                    <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-7">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-800/40">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Your Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <input type="text" required autoComplete="name"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 rounded-xl"
                                        placeholder="Hero name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <input type="email" required autoComplete="email"
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
                                    <input type="password" required minLength={6} autoComplete="new-password"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 rounded-xl"
                                        placeholder="Min. 6 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.45)] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    <> Create Account <ArrowRight className="h-4 w-4" /> </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link href="/signin" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
