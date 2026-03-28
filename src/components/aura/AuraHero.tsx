'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AuralBlobMesh } from './AuralBlob';

export function AuraHero() {
  return (
    <div className="w-full h-full relative">
      {/* CSS radial glow — replaces Bloom which glitches with alpha:true canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 40%, transparent 70%)',
        }}
      />
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.6} />
          <AuralBlobMesh />
        </Suspense>
      </Canvas>
    </div>
  );
}
