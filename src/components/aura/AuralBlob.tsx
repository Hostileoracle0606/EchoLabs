'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders';
import { useEchoLensStore } from '@/store/echolens-store';

/** Smoothed audio levels for lerp interpolation inside the render loop */
const smoothed = { bass: 0, mid: 0, treble: 0, amplitude: 0 };

export function AuralBlobMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uAmplitude: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.ShaderMaterial;

    // Read audio levels from store (non-reactive — no re-render)
    const { bass, mid, treble, amplitude } = useEchoLensStore.getState().audioLevels;

    // Lerp for smooth transitions (lower factor = smoother)
    smoothed.bass += (bass - smoothed.bass) * 0.1;
    smoothed.mid += (mid - smoothed.mid) * 0.1;
    smoothed.treble += (treble - smoothed.treble) * 0.12;
    smoothed.amplitude += (amplitude - smoothed.amplitude) * 0.08;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uBass.value = smoothed.bass;
    material.uniforms.uMid.value = smoothed.mid;
    material.uniforms.uTreble.value = smoothed.treble;
    material.uniforms.uAmplitude.value = smoothed.amplitude;

    // Gentle idle rotation
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.x += 0.001;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
