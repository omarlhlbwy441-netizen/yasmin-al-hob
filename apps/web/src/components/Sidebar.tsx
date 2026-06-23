'use client';

import { motion } from 'framer-motion';
import { 
    Home, FolderOpen, Rocket, Settings, CreditCard, 
    LogOut, Gamepad2, Globe, Smartphone, Monitor, ChevronRight 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const menuItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'projects', label: 'المشاريع', icon: FolderOpen },
    { id: 'deployed', label: 'المستضافة', icon: Rocket },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
];

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <motion.aside
            className="sidebar"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
        >
            <div className="flex items-center gap-3 mb-10 px-2">
                <svg width="40" height="40" viewBox="0 0 200 200" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <path d="M100 20 C60 20 40 50 40 80 C40 110 60 130 70 135 L70 150 L85 150 L85 140 L100 140 L100 150 L115 150 L115 135 C130 130 150 110 150 80 C150 50 130 20 100 20 Z"
                        fill="none" stroke="#10b981" strokeWidth="2"/>
                    <circle cx="75" cy="75" r="5" fill="#10b981"/>
                    <circle cx="125" cy="75" r="5" fill="#10b981"/>
                </svg>
                <div>
                    <h2 className="text-lg font-bold yasmin-text">ياسمين</h2>
                    <p className="text-[10px] text-white/40">دارك تكنولوجي</p>
                </div>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item, i) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                isActive 
                                    ? 'bg-yasmin-500/20 text-yasmin-400 border border-yasmin-500/30' 
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            whileHover={{ x: 5 }}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                            {isActive && <ChevronRight className="w-4 h-4 mr-auto" />}
                        </motion.button>
                    );
                })}
            </nav>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="px-2">
                <p className="text-xs text-white/30 mb-3 uppercase tracking-wider">نوع المشروع</p>
                <div className="space-y-2">
                    {[
                        { icon: Gamepad2, label: 'ألعاب', color: 'text-purple-400' },
                        { icon: Globe, label: 'مواقع', color: 'text-blue-400' },
                        { icon: Smartphone, label: 'تطبيقات جوال', color: 'text-green-400' },
                        { icon: Monitor, label: 'تطبيقات حاسوب', color: 'text-orange-400' },
                    ].map((item, i) => (
                        <motion.button
                            key={i}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition"
                            whileHover={{ x: 5 }}
                        >
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            {item.label}
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition"
                >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </motion.aside>
    );
}
