'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/components/LoginPage';

export default function Home() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="relative min-h-screen overflow-hidden">
            <AnimatePresence mode="wait">
                {showSplash ? (
                    <SplashScreen key="splash" />
                ) : (
                    <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                        <LoginPage />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
