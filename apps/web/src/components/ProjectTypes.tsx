'use client';

import { motion } from 'framer-motion';
import { Gamepad2, Globe, Smartphone, Monitor, ArrowLeft } from 'lucide-react';

const projectTypes = [
    {
        id: 'game',
        title: 'ألعاب',
        description: 'بناء ألعاب ثنائية وثلاثية الأبعاد مع محركات متقدمة',
        icon: Gamepad2,
        color: 'from-purple-600 to-pink-600',
        glow: 'shadow-purple-500/30',
        agents: ['game_dev', 'ux_designer', 'developer'],
    },
    {
        id: 'website',
        title: 'مواقع',
        description: 'مواقع تفاعلية متجاوبة مع SEO وتحسين الأداء',
        icon: Globe,
        color: 'from-blue-600 to-cyan-600',
        glow: 'shadow-blue-500/30',
        agents: ['ux_designer', 'architect', 'developer', 'devops'],
    },
    {
        id: 'mobile',
        title: 'تطبيقات جوال',
        description: 'تطبيقات iOS و Android native و cross-platform',
        icon: Smartphone,
        color: 'from-green-600 to-emerald-600',
        glow: 'shadow-green-500/30',
        agents: ['ux_designer', 'architect', 'developer', 'qa_engineer'],
    },
    {
        id: 'desktop',
        title: 'تطبيقات حاسوب',
        description: 'تطبيقات سطح مكتب لـ Windows, macOS, Linux',
        icon: Monitor,
        color: 'from-orange-600 to-amber-600',
        glow: 'shadow-orange-500/30',
        agents: ['ux_designer', 'architect', 'developer', 'security'],
    },
];

export default function ProjectTypes() {
    return (
        <div className="mb-8">
            <motion.h2 className="text-2xl font-bold mb-6 yasmin-text"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}>
                اختر نوع المشروع
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {projectTypes.map((type, i) => {
                    const Icon = type.icon;
                    return (
                        <motion.div
                            key={type.id}
                            className="glass-card group cursor-pointer relative overflow-hidden hover:border-white/20 transition-all duration-500"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            whileHover={{ scale: 1.03, y: -5 }}
                        >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${type.color} blur-3xl`} />
                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 shadow-lg ${type.glow}`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{type.title}</h3>
                                <p className="text-white/50 text-sm mb-4 leading-relaxed">{type.description}</p>
                                <div className="flex gap-1 mb-4">
                                    {type.agents.map((agent, j) => (
                                        <span key={j} className="px-2 py-1 bg-white/5 rounded-full text-[10px] text-white/40">{agent}</span>
                                    ))}
                                </div>
                                <div className="flex items-center text-yasmin-400 text-sm font-medium group-hover:gap-2 transition-all">
                                    <span>ابدأ البناء</span>
                                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
