'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
    Zap,
    Brain,
    LineChart,
    Users,
    Shield,
    Layers
} from 'lucide-react';

const features = [
    {
        icon: Zap,
        title: 'Real-Time Transcription',
        description: 'Sub-300ms latency speech-to-text powered by Deepgram Nova-2. Every word captured instantly.',
    },
    {
        icon: Brain,
        title: 'AI Context Detection',
        description: 'Gemini 1.5 Pro understands what you\'re saying and surfaces the perfect visualization.',
    },
    {
        icon: LineChart,
        title: 'Dynamic Visualizations',
        description: 'Charts, graphs, KPIs, and tables morph organically from The Aura. No slides needed.',
    },
    {
        icon: Users,
        title: 'Audience Sync',
        description: 'Share a link. Your audience sees exactly what you present, in real-time.',
    },
    {
        icon: Shield,
        title: 'Enterprise Ready',
        description: 'SOC 2 compliant. Your data never trains models. Self-host available.',
    },
    {
        icon: Layers,
        title: 'Any Data Format',
        description: 'Excel, CSV, PDF, PowerPoint — upload anything. We parse and index automatically.',
    },
];

export function Features() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section className="section relative" ref={ref}>
            {/* Background gradient */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.03) 0%, transparent 60%)',
                }}
            />

            <div className="container-narrow relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="heading-display text-4xl md:text-5xl text-gradient mb-4">
                        Built for Presenters
                    </h2>
                    <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
                        Everything you need to deliver captivating, data-rich presentations.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                            className="glass-card p-6 group"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <feature.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
