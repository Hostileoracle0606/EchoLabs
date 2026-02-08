import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { serializeWsMessage, createWsMessage, parseWsMessage } from './ws-events';
import type { WsEventType } from '@/types/events';

interface ConnectedClient {
  ws: WebSocket;
  sessionId: string | null;
}

let wss: WebSocketServer | null = null;
const clients = new Map<WebSocket, ConnectedClient>();

/**
 * Initialize the WebSocket server in `noServer` mode.
 *
 * Why noServer? In dev mode, Next.js uses its own WebSocket for HMR
 * (Hot Module Replacement) on /_next/webpack-hmr. If we attach `ws`
 * directly to the HTTP server via `{ server }`, it intercepts ALL
 * upgrade requests — including HMR — and crashes on invalid frame
 * data. Using `noServer` + manual upgrade handling lets us only
 * accept connections on our `/ws` path.
 */
export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket) => {
    clients.set(ws, { ws, sessionId: null });

    ws.on('message', (raw: Buffer) => {
      const msg = parseWsMessage(raw.toString());
      if (!msg) return;

      if (msg.event === 'session:start' && typeof msg.sessionId === 'string') {
        const client = clients.get(ws);
        if (client) {
          client.sessionId = msg.sessionId;
        }
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      clients.delete(ws);
    });
  });

  // Only handle upgrades for our /ws path; let Next.js handle everything else
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);

    if (pathname === '/ws') {
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit('connection', ws, request);
      });
    }
    // If it's NOT /ws, do nothing — let Next.js handle HMR upgrades
  });

  return wss;
}

export function broadcast<T>(event: WsEventType, sessionId: string, payload: T): void {
  if (!wss) return;

  const message = serializeWsMessage(createWsMessage(event, sessionId, payload));

  for (const [, client] of clients) {
    if (
      client.ws.readyState === WebSocket.OPEN &&
      (client.sessionId === sessionId || client.sessionId === null)
    ) {
      client.ws.send(message);
    }
  }
}

export function broadcastAll<T>(event: WsEventType, payload: T): void {
  if (!wss) return;

  const message = serializeWsMessage(createWsMessage(event, '', payload));

  for (const [, client] of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function getConnectedClientCount(): number {
  return clients.size;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

export function resetWebSocketServer(): void {
  if (wss) {
    for (const [ws] of clients) {
      ws.close();
    }
    clients.clear();
    wss.close();
    wss = null;
  }
}
