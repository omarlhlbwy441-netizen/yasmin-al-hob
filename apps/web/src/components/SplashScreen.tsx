'use client';

import { motion } from 'framer-motion';

export default function SplashScreen() {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-marble"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
        >
            <div className="absolute inset-0 overflow-hidden">
                <motion.div className="absolute w-[800px] h-[800px] rounded-full bg-yasmin-500/10 blur-[100px]"
                    animate={{ x: [0, 100, -50, 0], y: [0, -80, 50, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ top: '10%', left: '20%' }} />
                <motion.div className="absolute w-[600px] h-[600px] rounded-full bg-silver-500/10 blur-[80px]"
                    animate={{ x: [0, -80, 60, 0], y: [0, 60, -40, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ bottom: '10%', right: '20%' }} />
                <motion.div className="absolute w-[400px] h-[400px] rounded-full bg-yasmin-400/15 blur-[60px]"
                    animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>

            <motion.div className="relative z-10 mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}>
                <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    <motion.path d="M100 20 C60 20 40 50 40 80 C40 110 60 130 70 135 L70 150 L85 150 L85 140 L100 140 L100 150 L115 150 L115 135 C130 130 150 110 150 80 C150 50 130 20 100 20 Z"
                        fill="none" stroke="#10b981" strokeWidth="2"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }} />
                    <motion.circle cx="75" cy="75" r="8" fill="#10b981"
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
                    <motion.circle cx="125" cy="75" r="8" fill="#10b981"
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 1.2 }} />
                    <motion.path d="M100 85 L95 100 L105 100 Z" fill="#10b981"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                        <rect x="80" y="115" width="8" height="12" fill="none" stroke="#10b981" strokeWidth="1"/>
                        <rect x="92" y="115" width="8" height="12" fill="none" stroke="#10b981" strokeWidth="1"/>
                        <rect x="104" y="115" width="8" height="12" fill="none" stroke="#10b981" strokeWidth="1"/>
                        <rect x="116" y="115" width="8" height="12" fill="none" stroke="#10b981" strokeWidth="1"/>
                    </motion.g>
                    <motion.path d="M70 25 L50 5 M130 25 L150 5" stroke="#10b981" strokeWidth="3" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
                </svg>
            </motion.div>

            <motion.h1 className="text-6xl md:text-8xl font-black text-center z-10"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1 }}>
                <span className="yasmin-text text-shadow-glow">ياسمين</span>
            </motion.h1>

            <motion.p className="text-2xl md:text-3xl font-light mt-4 silver-text text-shadow-silver z-10"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1 }}>
                دارك تكنولوجي
            </motion.p>

            <motion.div className="mt-12 text-center z-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1 }}>
                <p className="text-lg text-white/60 mb-4">مرحباً بك في عالم الذكاء الاصطناعي البرمجي</p>
                <div className="flex gap-2 justify-center">
                    {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-3 h-3 rounded-full bg-yasmin-400"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
