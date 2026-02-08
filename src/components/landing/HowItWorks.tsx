'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Upload, Mic, BarChart3, ArrowRight } from 'lucide-react';

const steps = [
    {
        icon: Upload,
        title: 'Upload Your Data',
        description: 'Drop in Excel files, CSVs, PDFs, or slide decks. EchoLens pre-parses and indexes everything.',
        color: '#3B82F6',
    },
    {
        icon: Mic,
        title: 'Start Presenting',
        description: 'Speak naturally. Our AI transcribes in real-time with < 300ms latency.',
        color: '#8B5CF6',
    },
    {
        icon: BarChart3,
        title: 'Watch It Come Alive',
        description: 'The Aura listens, understands context, and morphs into stunning visualizations.',
        color: '#F59E0B',
    },
];

export function HowItWorks() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="how-it-works" className="section relative" ref={ref}>
            <div className="container-narrow">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="heading-display text-4xl md:text-5xl text-gradient mb-4">
                        How It Works
                    </h2>
                    <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
                        Three simple steps to transform your presentations forever.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                                className="relative"
                            >
                                <div className="glass-card p-8 h-full">
                                    {/* Step number */}
                                    <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--glass-border)] flex items-center justify-center">
                                        <span className="text-sm font-medium text-[var(--foreground-muted)]">
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Icon */}
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                                        style={{
                                            background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                                            boxShadow: `0 0 40px ${step.color}20`,
                                        }}
                                    >
                                        <step.icon
                                            className="w-8 h-8"
                                            style={{ color: step.color }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold mb-3 text-[var(--foreground)]">
                                        {step.title}
                                    </h3>
                                    <p className="text-[var(--foreground-muted)] leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow between cards (desktop) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                                        <ArrowRight className="w-5 h-5 text-[var(--foreground-subtle)]" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
