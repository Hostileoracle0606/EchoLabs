import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import WebSocket from 'ws';
import {
  initWebSocketServer,
  broadcast,
  getConnectedClientCount,
  resetWebSocketServer,
} from './ws-server';

let httpServer: HttpServer;
let serverPort: number;

function connectClient(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${serverPort}/ws`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function waitForMessage(ws: WebSocket): Promise<string> {
  return new Promise((resolve) => {
    ws.on('message', (data: Buffer) => {
      resolve(data.toString());
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('WebSocketServer', () => {
  beforeEach(async () => {
    httpServer = createServer();
    initWebSocketServer(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        serverPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterEach(async () => {
    resetWebSocketServer();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it('accepts WebSocket connections', async () => {
    const ws = await connectClient();
    expect(ws.readyState).toBe(WebSocket.OPEN);
    await delay(50);
    expect(getConnectedClientCount()).toBe(1);
    ws.close();
  });

  it('tracks multiple connected clients', async () => {
    const ws1 = await connectClient();
    const ws2 = await connectClient();
    await delay(50);
    expect(getConnectedClientCount()).toBe(2);
    ws1.close();
    ws2.close();
  });

  it('removes client on disconnect', async () => {
    const ws = await connectClient();
    await delay(50);
    expect(getConnectedClientCount()).toBe(1);
    ws.close();
    await delay(50);
    expect(getConnectedClientCount()).toBe(0);
  });

  it('broadcasts messages to all connected clients', async () => {
    const ws1 = await connectClient();
    const ws2 = await connectClient();
    await delay(50);

    const msg1Promise = waitForMessage(ws1);
    const msg2Promise = waitForMessage(ws2);

    broadcast('agent:chart', 'session-1', { mermaidCode: 'pie title Test' });

    const [msg1, msg2] = await Promise.all([msg1Promise, msg2Promise]);
    const parsed1 = JSON.parse(msg1);
    const parsed2 = JSON.parse(msg2);

    expect(parsed1.event).toBe('agent:chart');
    expect(parsed1.payload.mermaidCode).toBe('pie title Test');
    expect(parsed2.event).toBe('agent:chart');

    ws1.close();
    ws2.close();
  });

  it('broadcasts only to clients with matching sessionId', async () => {
    const ws1 = await connectClient();
    const ws2 = await connectClient();
    await delay(50);

    // ws1 joins session-1
    ws1.send(
      JSON.stringify({
        event: 'session:start',
        sessionId: 'session-1',
        timestamp: Date.now(),
        payload: {},
      })
    );
    // ws2 joins session-2
    ws2.send(
      JSON.stringify({
        event: 'session:start',
        sessionId: 'session-2',
        timestamp: Date.now(),
        payload: {},
      })
    );

    await delay(100);

    let ws2Received = false;
    ws2.on('message', () => {
      ws2Received = true;
    });

    const msg1Promise = waitForMessage(ws1);

    broadcast('agent:chart', 'session-1', { test: true });

    const msg1 = await msg1Promise;
    await delay(100);

    expect(JSON.parse(msg1).event).toBe('agent:chart');
    expect(ws2Received).toBe(false);

    ws1.close();
    ws2.close();
  });
});
