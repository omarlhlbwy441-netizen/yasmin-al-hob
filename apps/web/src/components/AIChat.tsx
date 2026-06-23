'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    agentName?: string;
    agentIcon?: string;
    agentColor?: string;
}

export default function AIChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const agentResponses = [
                { name: 'المعماري', icon: '🏗️', color: '#3B82F6', text: 'سأقوم بتصميم معمارية قوية لهذا المشروع. هل تفضل Microservices أم Monolith؟' },
                { name: 'المطور', icon: '💻', color: '#8B5CF6', text: 'يمكنني كتابة الكود بـ TypeScript مع Nest.js. هل تحتاج إلى قاعدة بيانات SQL أم NoSQL؟' },
                { name: 'مصمم UX', icon: '🎨', color: '#10B981', text: 'سأصمم واجهة مستخدم سلسة مع Dark Mode. ما الألوان المفضلة لديك؟' },
            ];
            const randomAgent = agentResponses[Math.floor(Math.random() * agentResponses.length)];
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                content: randomAgent.text,
                agentName: randomAgent.name,
                agentIcon: randomAgent.icon,
                agentColor: randomAgent.color,
            };
            setMessages(prev => [...prev, agentMsg]);
            setIsTyping(false);
        }, 2000);
    };

    return (
        <motion.div className="glass-card mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yasmin-600 to-yasmin-800 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">فريق الذكاء الاصطناعي</h2>
                    <p className="text-sm text-white/50">500+ مبرمج في انتظار أوامرك</p>
                </div>
            </div>

            <div className="h-96 overflow-y-auto space-y-4 mb-4 pr-2">
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div className="text-center py-12 text-white/30"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>اكتب وصف مشروعك وسيقوم الوكلاء بتحليله وبنائه</p>
                            <p className="text-sm mt-2">مثال: "أريد لعبة RPG متعددة اللاعبين"</p>
                        </motion.div>
                    )}

                    {messages.map((msg) => (
                        <motion.div key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                msg.role === 'user' ? 'bg-yasmin-600' : 'bg-gradient-to-br'
                            }`} style={msg.role === 'agent' ? { background: `linear-gradient(135deg, ${msg.agentColor}40, ${msg.agentColor}20)` } : {}}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <span className="text-lg">{msg.agentIcon}</span>}
                            </div>
                            <div className={`glass p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-yasmin-500/10' : ''}`}>
                                {msg.agentName && <p className="text-xs font-bold mb-1" style={{ color: msg.agentColor }}>{msg.agentName}</p>}
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-10 h-10 rounded-xl bg-crystal flex items-center justify-center">
                                <Bot className="w-5 h-5 text-yasmin-400" />
                            </div>
                            <div className="glass p-4 rounded-2xl">
                                <div className="flex gap-2">
                                    {[0, 1, 2].map(i => (
                                        <motion.div key={i} className="w-2 h-2 rounded-full bg-yasmin-400"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="صف مشروعك بالتفصيل..."
                    className="glass-input flex-1" />
                <motion.button onClick={handleSend} className="crystal-btn px-6"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Send className="w-5 h-5" />
                </motion.button>
            </div>
        </motion.div>
    );
}
