'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AuraHero } from '@/components/aura';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '100px 100px',
                    }}
                />
            </div>

            {/* Aura - The Hero Element */}
            <div className="relative z-10 mb-8">
                <AuraHero />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-4xl mx-auto">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8"
                >
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span className="text-sm text-[var(--foreground-muted)]">
                        AI-Powered Presentation Companion
                    </span>
                </motion.div>

                {/* Tagline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="heading-display text-5xl md:text-7xl lg:text-8xl text-balance mb-6"
                >
                    <span className="text-gradient">Your voice</span>
                    <br />
                    <span className="text-gradient-accent">shapes the room.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-xl md:text-2xl text-[var(--foreground-muted)] text-balance max-w-2xl mx-auto mb-12"
                >
                    EchoLens transforms your pitch into a living visual experience.
                    Speak naturally. Watch your data come alive.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 text-lg">
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link href="#how-it-works" className="btn-secondary text-lg">
                        See How It Works
                    </Link>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-6 h-10 rounded-full border-2 border-[var(--foreground-subtle)] p-2"
                >
                    <div className="w-1.5 h-1.5 bg-[var(--foreground-subtle)] rounded-full mx-auto" />
                </motion.div>
            </motion.div>
        </section>
    );
}
