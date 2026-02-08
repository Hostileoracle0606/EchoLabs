import type { WsEventType, WsMessage } from '@/types/events';

export function createWsMessage<T>(
  event: WsEventType,
  sessionId: string,
  payload: T
): WsMessage<T> {
  return {
    event,
    sessionId,
    timestamp: Date.now(),
    payload,
  };
}

export function serializeWsMessage<T>(message: WsMessage<T>): string {
  return JSON.stringify(message);
}

export function parseWsMessage(data: string): WsMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.event === 'string' && typeof parsed.timestamp === 'number') {
      return parsed as WsMessage;
    }
    return null;
  } catch {
    return null;
  }
}
