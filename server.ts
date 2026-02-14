import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';
import { initWebSocketServer } from './src/websocket/ws-server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  // Attach WS server — it registers its own 'upgrade' handler for /ws
  initWebSocketServer(server);

  server.listen(port, () => {
    console.log(`> Momentum ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server listening on ws://${hostname}:${port}/ws`);
  });
});
