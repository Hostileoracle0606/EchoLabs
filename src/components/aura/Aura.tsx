'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AuraCanvas } from './AuraCanvas';
import { useAuraStore } from '@/lib/stores/aura-store';

interface AuraProps {
    size?: number;
    className?: string;
    interactive?: boolean;
    showLabel?: boolean;
}

export function Aura({
    size = 400,
    className = '',
    interactive = true,
    showLabel = false,
}: AuraProps) {
    const { state, audioLevel } = useAuraStore();

    const stateLabels: Record<string, string> = {
        idle: 'Waiting',
        listening: 'Listening',
        morphing: 'Transforming',
        visualizing: 'Presenting',
        collapsing: 'Transitioning',
    };

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Ambient background glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, 
            rgba(59, 130, 246, ${0.1 + audioLevel * 0.1}) 0%, 
            rgba(139, 92, 246, 0.05) 40%, 
            transparent 70%)`,
                }}
            />

            {/* Main Aura Canvas */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <AuraCanvas
                    width={size}
                    height={size}
                    interactive={interactive}
                />
            </motion.div>

            {/* State Label */}
            <AnimatePresence>
                {showLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    >
                        <div className="glass px-4 py-2 rounded-full">
                            <span className="text-sm text-foreground-muted">
                                {stateLabels[state]}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Export simplified version for landing page hero
export function AuraHero({ className = '' }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {/* Extra large ambient glow for landing page */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    transform: 'scale(1.5)',
                    background: `radial-gradient(circle at center, 
            rgba(59, 130, 246, 0.15) 0%, 
            rgba(139, 92, 246, 0.08) 30%, 
            transparent 60%)`,
                    filter: 'blur(40px)',
                }}
            />

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 1.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="animate-float"
            >
                <Aura size={500} interactive={true} />
            </motion.div>
        </div>
    );
}
