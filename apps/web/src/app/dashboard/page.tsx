'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import AIChat from '@/components/AIChat';
import ProjectTypes from '@/components/ProjectTypes';
import { User, Sparkles } from 'lucide-react';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(userData));
    }, [router]);

    if (!user) return null;

    return (
        <div className="min-h-screen flex">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 mr-72 p-8">
                <motion.div className="flex justify-between items-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="text-3xl font-black yasmin-text">مرحباً، {user.name}!</h1>
                        <p className="text-white/50 mt-1">500+ وكيل برمجي في انتظار أوامرك</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yasmin-400" />
                            <span className="text-sm text-white/70">Pro Plan</span>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yasmin-600 to-yasmin-800 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </motion.div>

                {activeTab === 'home' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        <ProjectTypes />
                        <AIChat />
                    </motion.div>
                )}

                {activeTab === 'projects' && (
                    <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-2xl font-bold yasmin-text mb-6">مشاريعي</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['لعبة RPG', 'متجر إلكتروني', 'تطبيق تواصل', 'نظام إدارة'].map((project, i) => (
                                <div key={i} className="glass p-6 rounded-2xl hover:border-yasmin-400/50 transition cursor-pointer">
                                    <h3 className="font-bold text-lg">{project}</h3>
                                    <p className="text-white/50 text-sm mt-2">آخر تحديث: منذ 2 ساعة</p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="px-3 py-1 bg-yasmin-500/20 text-yasmin-400 rounded-full text-xs">قيد التطوير</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'subscriptions' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-2xl font-bold yasmin-text mb-6">الاشتراكات</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { name: 'مجاني', price: '0', features: ['3 مشاريع', 'وكيل واحد', 'دعم أساسي'] },
                                { name: 'محترف', price: '99', features: ['مشاريع غير محدودة', '7 وكلاء', 'دعم أولوي', 'نشر تلقائي'] },
                                { name: 'مؤسسي', price: '299', features: ['كل شيء غير محدود', '500+ مبرمج', 'API مخصص', 'دعم 24/7'] },
                            ].map((plan, i) => (
                                <motion.div key={i} className={`glass-card relative ${i === 1 ? 'border-yasmin-400/50' : ''}`}
                                    whileHover={{ scale: 1.02 }}>
                                    {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yasmin-500 rounded-full text-xs font-bold">الأكثر شيوعاً</div>}
                                    <h3 className="text-xl font-bold text-center">{plan.name}</h3>
                                    <div className="text-center my-4">
                                        <span className="text-4xl font-black yasmin-text">${plan.price}</span>
                                        <span className="text-white/50">/شهر</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {plan.features.map((f, j) => (
                                            <li key={j} className="flex items-center gap-2 text-sm text-white/70">
                                                <Sparkles className="w-4 h-4 text-yasmin-400" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className={`w-full mt-6 py-3 rounded-xl font-bold transition ${i === 1 ? 'crystal-btn' : 'silver-btn'}`}>
                                        اختر {plan.name}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-2xl font-bold yasmin-text mb-6">الإعدادات</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 glass rounded-xl">
                                <div><h3 className="font-bold">الوضع الليلي</h3><p className="text-sm text-white/50">تفعيل الوضع الليلي الداكن</p></div>
                                <div className="w-14 h-7 bg-yasmin-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full" /></div>
                            </div>
                            <div className="flex items-center justify-between p-4 glass rounded-xl">
                                <div><h3 className="font-bold">إشعارات الوكلاء</h3><p className="text-sm text-white/50">تلقي إشعارات عند اكتمال المهام</p></div>
                                <div className="w-14 h-7 bg-yasmin-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full" /></div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'deployed' && (
                    <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-2xl font-bold yasmin-text mb-6">المشاريع المستضافة</h2>
                        <div className="space-y-4">
                            {['yasmin-game.com', 'my-store.app', 'chat-app.io'].map((domain, i) => (
                                <div key={i} className="flex items-center justify-between p-4 glass rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                        <div><h3 className="font-bold">{domain}</h3><p className="text-xs text-white/50">يعمل بكفاءة 99.9%</p></div>
                                    </div>
                                    <button className="silver-btn px-4 py-2 text-sm">زيارة</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
