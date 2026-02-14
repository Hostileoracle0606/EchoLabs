'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AuraHero } from '@/components/aura';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6 bg-[var(--bg-primary)]">

            {/* Ambient Aura Background */}
            <div className="absolute inset-0 z-0">
                <AuraHero />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center h-full">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 glass px-6 py-2 rounded-full mb-10 select-none"
                >
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span className="text-sm font-medium text-[var(--foreground-muted)] tracking-wide uppercase">
                        AI-Powered Presentation Companion
                    </span>
                </motion.div>

                {/* Tagline */}
                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                    className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-center leading-[0.9] text-[var(--foreground)] mb-12 select-none"
                >
                    Your voice<br />
                    <span className="text-gradient-accent">shapes the room.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="text-2xl md:text-3xl font-light text-[var(--foreground-muted)] max-w-3xl mx-auto mb-16 leading-relaxed"
                >
                    Momentum transforms your pitch into a living visual experience.
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                >
                    <Link
                        href="/app"
                        className="btn-primary inline-flex items-center gap-3 text-xl px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Get Started Free
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
