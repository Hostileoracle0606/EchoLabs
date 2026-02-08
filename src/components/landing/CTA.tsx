'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section className="section relative" ref={ref}>
            <div className="container-narrow">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="relative glass-strong rounded-3xl p-12 md:p-20 text-center overflow-hidden"
                >
                    {/* Background gradient orbs */}
                    <div
                        className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                            filter: 'blur(60px)',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                    <div
                        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                            filter: 'blur(60px)',
                            transform: 'translate(50%, 50%)',
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={isInView ? { scale: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-[var(--accent-tertiary)]" />
                            <span className="text-sm text-[var(--foreground-muted)]">
                                Free for personal use
                            </span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="heading-display text-3xl md:text-5xl text-gradient mb-6"
                        >
                            Ready to transform your presentations?
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-lg text-[var(--foreground-muted)] max-w-xl mx-auto mb-10"
                        >
                            Join thousands of presenters who&apos;ve discovered the magic of
                            AI-powered visual storytelling.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 text-lg">
                                Start for Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/sign-in" className="btn-secondary text-lg">
                                Sign In
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
