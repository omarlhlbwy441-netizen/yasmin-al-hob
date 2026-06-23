'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Sparkles, Zap, Shield } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin ? { email, password } : { email, password, first_name: firstName, last_name: lastName };
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                setError(data.detail || 'حدث خطأ');
            }
        } catch (err) {
            setError('فشل الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0">
                <motion.div className="absolute w-[600px] h-[600px] rounded-full bg-yasmin-600/20 blur-[120px]"
                    animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ top: '10%', left: '10%' }} />
                <motion.div className="absolute w-[500px] h-[500px] rounded-full bg-silver-600/15 blur-[100px]"
                    animate={{ x: [0, -60, 40, 0], y: [0, 50, -30, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    style={{ bottom: '10%', right: '10%' }} />
            </div>

            <motion.div className="absolute top-8 left-8 flex items-center gap-3"
                initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <svg width="50" height="50" viewBox="0 0 200 200" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <path d="M100 20 C60 20 40 50 40 80 C40 110 60 130 70 135 L70 150 L85 150 L85 140 L100 140 L100 150 L115 150 L115 135 C130 130 150 110 150 80 C150 50 130 20 100 20 Z"
                        fill="none" stroke="#10b981" strokeWidth="3"/>
                    <circle cx="75" cy="75" r="6" fill="#10b981"/>
                    <circle cx="125" cy="75" r="6" fill="#10b981"/>
                </svg>
                <div>
                    <h2 className="text-xl font-bold yasmin-text">ياسمين</h2>
                    <p className="text-xs text-white/50">دارك تكنولوجي</p>
                </div>
            </motion.div>

            <motion.div className="glass-strong rounded-3xl p-10 w-full max-w-md relative z-10"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-yasmin-400 to-transparent rounded-full blur-sm" />

                <div className="text-center mb-8">
                    <motion.h1 className="text-3xl font-black mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <span className="yasmin-text">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}</span>
                    </motion.h1>
                    <p className="text-white/50 text-sm">{isLogin ? 'أهلاً بعودتك إلى عالم ياسمين' : 'انضم إلى 500+ مبرمج ذكي'}</p>
                </div>

                <div className="flex justify-center gap-6 mb-8">
                    {[Sparkles, Zap, Shield].map((Icon, i) => (
                        <motion.div key={i} className="w-12 h-12 rounded-xl bg-crystal flex items-center justify-center"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}>
                            <Icon className="w-6 h-6 text-yasmin-400" />
                        </motion.div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-3">
                            <motion.input type="text" placeholder="الاسم الأول" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                className="glass-input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} required />
                            <motion.input type="text" placeholder="الاسم الأخير" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                className="glass-input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} required />
                        </div>
                    )}

                    <motion.input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="glass-input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} required />

                    <motion.div className="relative" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="glass-input pr-12" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </motion.div>

                    {error && <motion.p className="text-red-400 text-sm text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>}

                    <motion.button type="submit" disabled={loading} className="crystal-btn w-full flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {loading ? (
                            <motion.div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                        ) : (
                            <><Sparkles size={20} /> {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}</>
                        )}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-white/50 hover:text-yasmin-400 transition text-sm">
                        {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخول'}
                    </button>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="text-white/30 text-xs">أو</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <motion.button className="silver-btn w-full mt-4 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Zap size={18} /> الدخول كضيف
                </motion.button>
            </motion.div>

            <motion.div className="absolute bottom-8 right-8 text-white/20 text-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <p>© 2024 ياسمين دارك تكنولوجي</p>
                <p className="text-xs mt-1">500+ وكيل برمجي | بناء المستقبل</p>
            </motion.div>
        </div>
    );
}
