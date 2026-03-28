import { createWsMessage, serializeWsMessage } from '@/websocket/ws-events';
import type { WsEventType } from '@/types/events';

type Listener = (serializedMessage: string) => void;

const globalForSessionEvents = global as typeof global & {
  echolensSessionListeners?: Map<string, Set<Listener>>;
};

const listeners =
  globalForSessionEvents.echolensSessionListeners || new Map<string, Set<Listener>>();

if (!globalForSessionEvents.echolensSessionListeners) {
  globalForSessionEvents.echolensSessionListeners = listeners;
}

export function subscribeToSessionEvents(sessionId: string, listener: Listener): () => void {
  const existing = listeners.get(sessionId) || new Set<Listener>();
  existing.add(listener);
  listeners.set(sessionId, existing);

  return () => {
    const current = listeners.get(sessionId);
    if (!current) {
      return;
    }
    current.delete(listener);
    if (current.size === 0) {
      listeners.delete(sessionId);
    }
  };
}

export function publishSessionEvent<T>(event: WsEventType, sessionId: string, payload: T): string {
  const serialized = serializeWsMessage(createWsMessage(event, sessionId, payload));
  const directListeners = listeners.get(sessionId);
  const globalListeners = listeners.get('');

  directListeners?.forEach((listener) => listener(serialized));
  globalListeners?.forEach((listener) => listener(serialized));

  return serialized;
}
