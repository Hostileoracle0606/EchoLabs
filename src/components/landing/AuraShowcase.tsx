'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useAuraStore } from '@/lib/stores/aura-store';
import { Aura } from '@/components/aura';
import type { AuraState } from '@/lib/types';

const states: { state: AuraState; label: string; description: string }[] = [
    {
        state: 'idle',
        label: 'Idle',
        description: 'Softly breathing, waiting for you to speak'
    },
    {
        state: 'listening',
        label: 'Listening',
        description: 'Reacting to your voice in real-time'
    },
    {
        state: 'morphing',
        label: 'Morphing',
        description: 'Transforming into a visualization'
    },
    {
        state: 'visualizing',
        label: 'Visualizing',
        description: 'Presenting your data beautifully'
    },
];

export function AuraShowcase() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [activeIndex, setActiveIndex] = useState(0);
    const { setState, setAudioLevel } = useAuraStore();

    // Auto-cycle through states for demo
    useEffect(() => {
        if (!isInView) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % states.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isInView]);

    // Update Aura state when active index changes
    useEffect(() => {
        const currentState = states[activeIndex];
        setState(currentState.state);

        // Simulate audio level for listening state
        if (currentState.state === 'listening') {
            const audioInterval = setInterval(() => {
                setAudioLevel(Math.random() * 0.5 + 0.3);
            }, 100);
            return () => clearInterval(audioInterval);
        } else {
            setAudioLevel(0);
        }
    }, [activeIndex, setState, setAudioLevel]);

    return (
        <section className="section relative overflow-hidden" ref={ref}>
            {/* Background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(10, 10, 15, 0.5) 50%, transparent 100%)',
                }}
            />

            <div className="container-narrow relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="heading-display text-4xl md:text-5xl text-gradient mb-4">
                        Meet The Aura
                    </h2>
                    <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
                        The soul of EchoLens. A living, breathing visual that responds to your voice
                        and transforms into the data your audience needs to see.
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Aura Display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex-1 flex justify-center"
                    >
                        <div className="relative">
                            {/* Glow backdrop */}
                            <div
                                className="absolute inset-0 -z-10"
                                style={{
                                    transform: 'scale(1.2)',
                                    background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                                    filter: 'blur(60px)',
                                }}
                            />
                            <Aura size={350} interactive={false} showLabel={true} />
                        </div>
                    </motion.div>

                    {/* State Selector */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex-1 w-full max-w-md"
                    >
                        <div className="space-y-4">
                            {states.map((item, index) => (
                                <button
                                    key={item.state}
                                    onClick={() => setActiveIndex(index)}
                                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${activeIndex === index
                                            ? 'glass-strong border-[var(--accent-primary)]/30'
                                            : 'hover:bg-white/[0.02]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Indicator */}
                                        <div
                                            className={`w-3 h-3 rounded-full transition-all duration-300 ${activeIndex === index
                                                    ? 'bg-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/50'
                                                    : 'bg-[var(--foreground-subtle)]'
                                                }`}
                                        />

                                        <div className="flex-1">
                                            <h3 className={`font-medium transition-colors duration-300 ${activeIndex === index
                                                    ? 'text-[var(--foreground)]'
                                                    : 'text-[var(--foreground-muted)]'
                                                }`}>
                                                {item.label}
                                            </h3>
                                            <p className="text-sm text-[var(--foreground-subtle)]">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress bar for active state */}
                                    {activeIndex === index && (
                                        <motion.div
                                            className="mt-3 h-0.5 bg-[var(--accent-primary)]/20 rounded-full overflow-hidden"
                                        >
                                            <motion.div
                                                className="h-full bg-[var(--accent-primary)]"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 3, ease: 'linear' }}
                                                key={activeIndex}
                                            />
                                        </motion.div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
