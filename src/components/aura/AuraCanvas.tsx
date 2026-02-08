'use client';

import { useRef, useEffect, useCallback } from 'react';
import { AuraPhysics, ParticleSystem, RippleSystem } from './aura-physics';
import { useAuraStore } from '@/lib/stores/aura-store';
import { COLORS } from '@/lib/types';

interface AuraCanvasProps {
    width?: number;
    height?: number;
    className?: string;
    interactive?: boolean;
}

export function AuraCanvas({
    width = 600,
    height = 600,
    className = '',
    interactive = true,
}: AuraCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const physicsRef = useRef<AuraPhysics | null>(null);
    const particlesRef = useRef<ParticleSystem | null>(null);
    const ripplesRef = useRef<RippleSystem | null>(null);
    const frameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const { state, audioLevel } = useAuraStore();

    // Initialize physics systems
    useEffect(() => {
        physicsRef.current = new AuraPhysics();
        particlesRef.current = new ParticleSystem();
        ripplesRef.current = new RippleSystem();

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    // Update physics state
    useEffect(() => {
        if (physicsRef.current) {
            physicsRef.current.setState(state);
        }
    }, [state]);

    // Update audio level
    useEffect(() => {
        if (physicsRef.current) {
            physicsRef.current.setAudioLevel(audioLevel);
        }
    }, [audioLevel]);

    // Draw gradient for blob fill
    const createGradient = useCallback((
        ctx: CanvasRenderingContext2D,
        centerX: number,
        centerY: number,
        radius: number
    ): CanvasGradient => {
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );

        // Dynamic gradient based on state and audio level
        const intensity = 0.7 + audioLevel * 0.3;

        gradient.addColorStop(0, `rgba(96, 165, 250, ${intensity})`);
        gradient.addColorStop(0.4, `rgba(59, 130, 246, ${intensity * 0.8})`);
        gradient.addColorStop(0.7, `rgba(139, 92, 246, ${intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        return gradient;
    }, [audioLevel]);

    // Draw particles
    const drawParticles = useCallback((
        ctx: CanvasRenderingContext2D,
        particles: ParticleSystem
    ) => {
        for (const p of particles.getParticles()) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(96, 165, 250, ${p.life * 0.8})`;
            ctx.fill();
        }
    }, []);

    // Draw ripples
    const drawRipples = useCallback((
        ctx: CanvasRenderingContext2D,
        ripples: RippleSystem
    ) => {
        for (const r of ripples.getRipples()) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(96, 165, 250, ${r.life * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }, []);

    // Main render loop
    const render = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        const physics = physicsRef.current;
        const particles = particlesRef.current;
        const ripples = ripplesRef.current;

        if (!canvas || !physics || !particles || !ripples) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate delta time
        const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
        lastTimeRef.current = timestamp;

        // Update physics
        physics.update(deltaTime);
        particles.update(deltaTime);
        ripples.update(deltaTime);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        // Draw ambient glow background
        const bgGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 300
        );
        bgGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        bgGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Draw ripples (behind blob)
        drawRipples(ctx, ripples);

        // Generate and draw blob
        const scale = state === 'visualizing' ? 0.5 : 1;
        const points = physics.generateBlobPoints(centerX, centerY, scale);
        const path = physics.generateSVGPath(points);

        // Draw outer glow
        ctx.save();
        ctx.shadowColor = COLORS.primary;
        ctx.shadowBlur = 60 + audioLevel * 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw blob
        const path2D = new Path2D(path);
        ctx.fillStyle = createGradient(ctx, centerX, centerY, 180);
        ctx.fill(path2D);

        ctx.restore();

        // Draw particles (on top)
        drawParticles(ctx, particles);

        // Schedule next frame
        frameRef.current = requestAnimationFrame(render);
    }, [width, height, state, createGradient, drawParticles, drawRipples]);

    // Start render loop
    useEffect(() => {
        frameRef.current = requestAnimationFrame(render);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [render]);

    // Handle clicks for ripple effect (demo/landing page)
    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!interactive || !ripplesRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripplesRef.current.spawn(x, y, 150, COLORS.primary);
        particlesRef.current?.spawn(x, y, 15, COLORS.secondary);
    }, [interactive]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={className}
            onClick={handleClick}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                cursor: interactive ? 'pointer' : 'default',
            }}
        />
    );
}
