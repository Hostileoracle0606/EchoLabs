'use client';

import { motion } from 'framer-motion';

export function AuraHero() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-[800px] h-[800px] rounded-full bg-gradient-radial from-violet-500/30 via-blue-500/20 to-transparent blur-3xl mix-blend-screen"
            />
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 blur-2xl"
            />
        </div>
    );
}
