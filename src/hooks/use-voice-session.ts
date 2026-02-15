'use client';

import { useCallback, useRef, useState } from 'react';

interface UseVoiceSessionOptions {
  sessionId: string;
  callId: string;
  customerId?: string;
  phoneNumber?: string;
  endpointingDelayMs?: number;
  onError?: (error: string) => void;
}

interface UseVoiceSessionReturn {
  isStreaming: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

const TARGET_SAMPLE_RATE = 16000;

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, targetSampleRate: number): Float32Array {
  if (inputSampleRate === targetSampleRate) return buffer;

  const sampleRateRatio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = accum / count;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function floatTo16BitPcm(buffer: Float32Array): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length * 2);
  const view = new DataView(arrayBuffer);

  for (let i = 0; i < buffer.length; i += 1) {
    let sample = buffer[i];
    if (sample > 1) sample = 1;
    if (sample < -1) sample = -1;
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return arrayBuffer;
}

export function useVoiceSession({
  sessionId,
  callId,
  customerId,
  phoneNumber,
  endpointingDelayMs,
  onError,
}: UseVoiceSessionOptions): UseVoiceSessionReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const workletUrlRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupAudio = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (workletUrlRef.current) {
      URL.revokeObjectURL(workletUrlRef.current);
      workletUrlRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: 'voice:stop',
            sessionId,
            timestamp: Date.now(),
            payload: {},
          })
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanupAudio();
    setIsStreaming(false);
  }, [cleanupAudio, sessionId]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: TARGET_SAMPLE_RATE,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = async () => {
        ws.send(
          JSON.stringify({
            event: 'session:start',
            sessionId,
            timestamp: Date.now(),
            payload: {},
          })
        );
        ws.send(
          JSON.stringify({
            event: 'voice:start',
            sessionId,
            timestamp: Date.now(),
            payload: {
              callId,
              customerId,
              phoneNumber,
              endpointingDelayMs,
            },
          })
        );

        const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        const gain = audioContext.createGain();
        gain.gain.value = 0;
        gainNodeRef.current = gain;

        const workletCode = `
class PcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = options.processorOptions?.targetSampleRate || ${TARGET_SAMPLE_RATE};
  }
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || input.length === 0) return true;
    const inputSampleRate = sampleRate;
    const targetSampleRate = this.targetSampleRate;
    let samples = input;
    if (inputSampleRate !== targetSampleRate) {
      const sampleRateRatio = inputSampleRate / targetSampleRate;
      const newLength = Math.round(input.length / sampleRateRatio);
      const resampled = new Float32Array(newLength);
      let offsetResult = 0;
      let offsetBuffer = 0;
      while (offsetResult < resampled.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i += 1) {
          accum += input[i];
          count += 1;
        }
        resampled[offsetResult] = accum / count;
        offsetResult += 1;
        offsetBuffer = nextOffsetBuffer;
      }
      samples = resampled;
    }
    const pcmBuffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(pcmBuffer);
    for (let i = 0; i < samples.length; i += 1) {
      let sample = samples[i];
      if (sample > 1) sample = 1;
      if (sample < -1) sample = -1;
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    this.port.postMessage(pcmBuffer, [pcmBuffer]);
    return true;
  }
}
registerProcessor('pcm-processor', PcmProcessor);
`;

        try {
          const workletUrl = URL.createObjectURL(
            new Blob([workletCode], { type: 'application/javascript' })
          );
          workletUrlRef.current = workletUrl;
          await audioContext.audioWorklet.addModule(workletUrl);
          const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 1,
            processorOptions: { targetSampleRate: TARGET_SAMPLE_RATE },
          });
          workletNode.port.onmessage = (event) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          };
          processorNodeRef.current = workletNode;
          source.connect(workletNode);
          workletNode.connect(gain).connect(audioContext.destination);
        } catch {
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            const downsampled = downsampleBuffer(input, audioContext.sampleRate, TARGET_SAMPLE_RATE);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(floatTo16BitPcm(downsampled));
            }
          };
          processorNodeRef.current = processor;
          source.connect(processor);
          processor.connect(gain).connect(audioContext.destination);
        }

        await audioContext.resume();
        setIsStreaming(true);
      };

      ws.onerror = () => {
        onError?.('Voice WebSocket error');
        stop();
      };

      ws.onclose = () => {
        cleanupAudio();
        setIsStreaming(false);
        wsRef.current = null;
      };
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to start voice session');
      stop();
      throw err;
    }
  }, [callId, customerId, phoneNumber, endpointingDelayMs, sessionId, onError, stop]);

  return { isStreaming, start, stop };
}
