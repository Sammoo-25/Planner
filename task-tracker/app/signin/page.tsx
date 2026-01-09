'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.signin(formData);
            if (data.token) {
                login(data.user, data.token);
                router.push('/');
            } else {
                setError(data.message || 'Signin failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-sand-100 dark:bg-dark-900 p-4 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="w-full max-w-[420px] relative z-10">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-status-normal/10 text-status-normal mb-4">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-dark-900 dark:text-white">Welcome Back</h1>
                    <p className="mt-2 text-dark-500 dark:text-dark-400 font-medium">Enter your credentials to access the command center</p>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-xl dark:shadow-none border border-sand-200 dark:border-dark-700 p-8 md:p-10 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-dark-400 dark:text-dark-500 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 text-dark-400 group-focus-within:text-status-normal transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full !pl-12 pr-4 py-3.5 bg-sand-50 dark:bg-dark-900 border-sand-200 dark:border-dark-700 rounded-2xl focus:ring-2 focus:ring-status-normal/20 focus:border-status-normal font-medium transition-all"
                                    placeholder="warrior@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-dark-400 dark:text-dark-500">Password</label>
                                <a href="#" className="text-xs font-bold text-status-normal hover:text-blue-700 transition-colors">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 text-dark-400 group-focus-within:text-status-normal transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full !pl-12 pr-12 py-3.5 bg-sand-50 dark:bg-dark-900 border-sand-200 dark:border-dark-700 rounded-2xl focus:ring-2 focus:ring-status-normal/20 focus:border-status-normal font-medium transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-dark-400 hover:text-status-normal transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-dark-900 dark:bg-status-normal hover:bg-black dark:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-dark-900/20 dark:shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In to HQ
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-sand-200 dark:border-dark-700 text-center">
                        <p className="text-sm font-medium text-dark-500">
                            New recruit?{' '}
                            <Link href="/signup" className="text-status-normal hover:text-blue-700 font-bold hover:underline transition-all">
                                Enlist Now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
