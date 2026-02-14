import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { serializeWsMessage, createWsMessage, parseWsMessage } from './ws-events';
import { getVoiceSessionManager } from '@/services/voice/voice-session-manager';
import type { WsEventType } from '@/types/events';

interface ConnectedClient {
  ws: WebSocket;
  sessionId: string | null;
}

// Use global scope to share WSS and Clients map across API routes and server
const globalForWs = global as unknown as {
  wss: WebSocketServer | null;
  clients: Map<WebSocket, ConnectedClient> | null;
};

let wss: WebSocketServer | null = globalForWs.wss || null;
const clients: Map<WebSocket, ConnectedClient> =
  globalForWs.clients || new Map<WebSocket, ConnectedClient>();

if (!globalForWs.clients) {
  globalForWs.clients = clients;
}

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  if (globalForWs.wss) {
    wss = globalForWs.wss;
    return wss as WebSocketServer;
  }

  wss = new WebSocketServer({ noServer: true });
  globalForWs.wss = wss;

  wss.on('connection', (ws: WebSocket) => {
    clients.set(ws, { ws, sessionId: null });

    ws.on('message', async (raw, isBinary) => {
      if (isBinary) {
        const client = clients.get(ws);
        if (client?.sessionId) {
          const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
          await getVoiceSessionManager().handleAudioChunk(client.sessionId, buffer);
        }
        return;
      }

      const msg = parseWsMessage(raw.toString());
      if (!msg) return;

      if (msg.event === 'session:start' && typeof msg.sessionId === 'string') {
        const client = clients.get(ws);
        if (client) {
          client.sessionId = msg.sessionId;
        }
      }

      if (msg.event === 'voice:start') {
        const client = clients.get(ws);
        const sessionId = msg.sessionId || client?.sessionId;
        if (sessionId && typeof msg.payload === 'object') {
          await getVoiceSessionManager().startSession({
            sessionId,
            callId: (msg.payload as any).callId ?? `call-${sessionId}`,
            customerId: (msg.payload as any).customerId,
            phoneNumber: (msg.payload as any).phoneNumber,
          });
        }
      }

      if (msg.event === 'voice:stop') {
        const client = clients.get(ws);
        const sessionId = msg.sessionId || client?.sessionId;
        if (sessionId) {
          await getVoiceSessionManager().stopSession(sessionId);
        }
      }

      if (msg.event === 'voice:interrupt') {
        const client = clients.get(ws);
        const sessionId = msg.sessionId || client?.sessionId;
        if (sessionId) {
          await getVoiceSessionManager().interruptSession(sessionId);
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
  console.log(`[WS] Broadcasting ${event} to session ${sessionId}. WSS exists: ${!!wss}. Clients: ${clients.size}`);
  if (!wss) {
    console.error('[WS] Error: WebSocketServer is not initialized!');
    return;
  }

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
    globalForWs.wss = null;
  }
}
