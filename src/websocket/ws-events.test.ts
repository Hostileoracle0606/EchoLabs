import { describe, it, expect } from 'vitest';
import { createWsMessage, serializeWsMessage, parseWsMessage } from './ws-events';

describe('WsEvents', () => {
  it('creates a well-formed WsMessage', () => {
    const msg = createWsMessage('agent:chart', 'session-1', {
      chartSpec: {
        kind: 'metric',
        title: 'Test',
        value: '40%',
      },
    });

    expect(msg.event).toBe('agent:chart');
    expect(msg.sessionId).toBe('session-1');
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(msg.payload).toEqual({
      chartSpec: {
        kind: 'metric',
        title: 'Test',
        value: '40%',
      },
    });
  });

  it('serializes a message to JSON string', () => {
    const msg = createWsMessage('agent:summary', 'session-2', { bullets: [] });
    const serialized = serializeWsMessage(msg);

    expect(typeof serialized).toBe('string');
    const parsed = JSON.parse(serialized);
    expect(parsed.event).toBe('agent:summary');
  });

  it('parses a valid JSON message', () => {
    const json = JSON.stringify({
      event: 'agent:chart',
      sessionId: 's1',
      timestamp: 12345,
      payload: { data: 'test' },
    });

    const parsed = parseWsMessage(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.event).toBe('agent:chart');
    expect(parsed!.sessionId).toBe('s1');
  });

  it('returns null for invalid JSON', () => {
    expect(parseWsMessage('not json at all')).toBeNull();
  });

  it('returns null for JSON missing required fields', () => {
    expect(parseWsMessage(JSON.stringify({ foo: 'bar' }))).toBeNull();
    expect(parseWsMessage(JSON.stringify({ event: 'test' }))).toBeNull();
  });
});
