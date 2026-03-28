'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface AudioLevels {
  bass: number;
  mid: number;
  treble: number;
  amplitude: number;
}

const ZERO_LEVELS: AudioLevels = { bass: 0, mid: 0, treble: 0, amplitude: 0 };

function avg(arr: Uint8Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) sum += arr[i];
  return sum / (end - start);
}

/**
 * Connects to a MediaStream and extracts real-time frequency band data
 * via the Web Audio API AnalyserNode.
 *
 * Returns a `getData()` function that can be called every frame (e.g. inside useFrame)
 * to get the current { bass, mid, treble, amplitude } values (0-1 normalized).
 */
export function useAudioAnalyser(stream: MediaStream | null) {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef(new Uint8Array(128));

  useEffect(() => {
    if (!stream) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256; // 128 frequency bins
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    ctxRef.current = ctx;
    analyserRef.current = analyser;

    return () => {
      analyser.disconnect();
      source.disconnect();
      ctx.close();
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [stream]);

  const getData = useCallback((): AudioLevels => {
    if (!analyserRef.current) return ZERO_LEVELS;

    analyserRef.current.getByteFrequencyData(dataRef.current);
    const d = dataRef.current;

    return {
      bass: avg(d, 0, 10) / 255,       // ~0-350 Hz
      mid: avg(d, 10, 50) / 255,       // ~350 Hz - 3 kHz
      treble: avg(d, 50, 128) / 255,   // ~3 kHz - 22 kHz
      amplitude: avg(d, 0, 128) / 255, // overall
    };
  }, []);

  return getData;
}
