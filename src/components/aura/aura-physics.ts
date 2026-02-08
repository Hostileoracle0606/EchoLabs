import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import { AURA_DEFAULTS, type AuraConfig, type AuraState } from '@/lib/types';

// ========================================
// Aura Physics Engine
// ========================================

export class AuraPhysics {
    private noise2D: NoiseFunction2D;
    private config: AuraConfig;
    private time: number = 0;
    private audioLevel: number = 0;
    private targetAudioLevel: number = 0;
    private state: AuraState = 'idle';

    // Number of points around the blob perimeter
    private readonly numPoints: number = 128;

    constructor(config: Partial<AuraConfig> = {}) {
        this.noise2D = createNoise2D();
        this.config = { ...AURA_DEFAULTS, ...config };
    }

    /**
     * Update the physics simulation
     * @param deltaTime Time since last frame in ms
     */
    update(deltaTime: number): void {
        // Advance time for noise animation
        this.time += deltaTime * this.config.breatheSpeed;

        // Smooth audio level transitions
        this.audioLevel += (this.targetAudioLevel - this.audioLevel) * 0.15;
    }

    /**
     * Set the current audio level (0-1)
     */
    setAudioLevel(level: number): void {
        this.targetAudioLevel = Math.max(0, Math.min(1, level));
    }

    /**
     * Set the current Aura state
     */
    setState(state: AuraState): void {
        this.state = state;
    }

    /**
     * Get the current state
     */
    getState(): AuraState {
        return this.state;
    }

    /**
     * Generate blob points for rendering
     * Returns array of {x, y} coordinates for the blob perimeter
     */
    generateBlobPoints(centerX: number, centerY: number, scale: number = 1): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];

        // Calculate dynamic values based on state
        const stateMultipliers = this.getStateMultipliers();
        const effectiveRadius = this.config.baseRadius * scale * stateMultipliers.radius;
        const effectiveDistortion = this.config.distortionAmount * stateMultipliers.distortion;
        const audioInfluence = this.audioLevel * this.config.audioReactivity * stateMultipliers.audio;

        for (let i = 0; i < this.numPoints; i++) {
            const angle = (i / this.numPoints) * Math.PI * 2;

            // Get noise value for this point
            const noiseX = Math.cos(angle) * this.config.noiseScale;
            const noiseY = Math.sin(angle) * this.config.noiseScale;
            const noiseValue = this.noise2D(noiseX + this.time, noiseY + this.time);

            // Calculate radius with noise distortion
            let radius = effectiveRadius;

            // Add organic noise distortion
            radius += noiseValue * effectiveDistortion;

            // Add audio reactivity
            const audioWave = Math.sin(angle * 3 + this.time * 10) * audioInfluence;
            radius += audioWave;

            // Add breathing effect
            const breathe = Math.sin(this.time * 2) * (effectiveRadius * 0.02);
            radius += breathe;

            // Calculate point position
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            points.push({ x, y });
        }

        return points;
    }

    /**
     * Get multipliers based on current state
     */
    private getStateMultipliers(): { radius: number; distortion: number; audio: number } {
        switch (this.state) {
            case 'idle':
                return { radius: 1, distortion: 0.5, audio: 0.3 };
            case 'listening':
                return { radius: 1.05, distortion: 1, audio: 1 };
            case 'morphing':
                return { radius: 1.5, distortion: 1.5, audio: 0.5 };
            case 'visualizing':
                return { radius: 0.3, distortion: 0.2, audio: 0 };
            case 'collapsing':
                return { radius: 0.8, distortion: 0.8, audio: 0.2 };
            default:
                return { radius: 1, distortion: 1, audio: 1 };
        }
    }

    /**
     * Generate smooth SVG path from blob points
     */
    generateSVGPath(points: { x: number; y: number }[]): string {
        if (points.length < 3) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const p3 = points[(i + 2) % points.length];

            // Calculate control points for smooth curve
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }

        path += ' Z';
        return path;
    }

    /**
     * Get the current audio level
     */
    getAudioLevel(): number {
        return this.audioLevel;
    }

    /**
     * Get the current time value
     */
    getTime(): number {
        return this.time;
    }
}

// ========================================
// Particle System for Morph Effects
// ========================================

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private readonly maxParticles: number = 100;

    /**
     * Spawn particles at a position
     */
    spawn(x: number, y: number, count: number = 10, color: string = '#3B82F6'): void {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 1,
                size: Math.random() * 3 + 1,
                color,
            });
        }
    }

    /**
     * Spawn particles along a path (for morph transitions)
     */
    spawnAlongPath(points: { x: number; y: number }[], count: number = 20, color: string = '#3B82F6'): void {
        const step = Math.floor(points.length / count);

        for (let i = 0; i < points.length; i += step) {
            const point = points[i];
            this.spawn(point.x, point.y, 1, color);
        }
    }

    /**
     * Update all particles
     */
    update(deltaTime: number): void {
        const decayRate = deltaTime * 0.002;

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= decayRate;

            return p.life > 0;
        });
    }

    /**
     * Get all active particles
     */
    getParticles(): Particle[] {
        return this.particles;
    }

    /**
     * Clear all particles
     */
    clear(): void {
        this.particles = [];
    }
}

// ========================================
// Ripple Effect System
// ========================================

export interface Ripple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
    color: string;
}

export class RippleSystem {
    private ripples: Ripple[] = [];

    /**
     * Create a new ripple
     */
    spawn(x: number, y: number, maxRadius: number = 100, color: string = '#3B82F6'): void {
        this.ripples.push({
            x,
            y,
            radius: 0,
            maxRadius,
            life: 1,
            color,
        });
    }

    /**
     * Update all ripples
     */
    update(deltaTime: number): void {
        const expandSpeed = deltaTime * 0.2;
        const decayRate = deltaTime * 0.003;

        this.ripples = this.ripples.filter(r => {
            r.radius += expandSpeed;
            r.life -= decayRate;

            return r.life > 0 && r.radius < r.maxRadius;
        });
    }

    /**
     * Get all active ripples
     */
    getRipples(): Ripple[] {
        return this.ripples;
    }

    /**
     * Clear all ripples
     */
    clear(): void {
        this.ripples = [];
    }
}
