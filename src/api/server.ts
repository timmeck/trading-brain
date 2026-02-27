import http from 'node:http';
import { getLogger } from '../utils/logger.js';
import { getEventBus } from '../utils/events.js';
import type { IpcRouter } from '../ipc/router.js';

export interface ApiServerOptions {
  port: number;
  router: IpcRouter;
  apiKey?: string;
}

export class ApiServer {
  private server: http.Server | null = null;
  private logger = getLogger();
  private sseClients: Set<http.ServerResponse> = new Set();
  private statsTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private options: ApiServerOptions) {}

  start(): void {
    const { port, apiKey } = this.options;

    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

      if (apiKey) {
        const provided = (req.headers['x-api-key'] as string) ?? req.headers.authorization?.replace('Bearer ', '');
        if (provided !== apiKey) {
          this.json(res, 401, { error: 'Unauthorized' });
          return;
        }
      }

      this.handleRequest(req, res).catch((err) => {
        this.logger.error('API error:', err);
        this.json(res, 500, { error: err instanceof Error ? err.message : String(err) });
      });
    });

    this.server.listen(port, () => {
      this.logger.info(`REST API server started on http://localhost:${port}`);
    });

    this.setupSSE();
  }

  stop(): void {
    if (this.statsTimer) { clearInterval(this.statsTimer); this.statsTimer = null; }
    for (const client of this.sseClients) { try { client.end(); } catch { /* ignore */ } }
    this.sseClients.clear();
    this.server?.close();
    this.server = null;
    this.logger.info('REST API server stopped');
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;
    const method = req.method ?? 'GET';

    if (pathname === '/api/v1/health') {
      this.json(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    if (pathname === '/api/v1/events' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
      res.write('data: {"type":"connected"}\n\n');
      this.sseClients.add(res);
      req.on('close', () => this.sseClients.delete(res));
      return;
    }

    if (pathname === '/api/v1/methods' && method === 'GET') {
      const methods = this.options.router.listMethods();
      this.json(res, 200, { methods, rpcEndpoint: '/api/v1/rpc' });
      return;
    }

    if (pathname === '/api/v1/rpc' && method === 'POST') {
      const body = await this.readBody(req);
      if (!body) { this.json(res, 400, { error: 'Empty request body' }); return; }

      const parsed = JSON.parse(body);

      if (Array.isArray(parsed)) {
        const results = parsed.map((call: { method: string; params?: unknown; id?: string | number }) => {
          try {
            const result = this.options.router.handle(call.method, call.params ?? {});
            return { id: call.id, result };
          } catch (err) {
            return { id: call.id, error: err instanceof Error ? err.message : String(err) };
          }
        });
        this.json(res, 200, results);
        return;
      }

      if (!parsed.method) { this.json(res, 400, { error: 'Missing "method" field' }); return; }

      try {
        const result = this.options.router.handle(parsed.method, parsed.params ?? {});
        this.json(res, 200, { result });
      } catch (err) {
        this.json(res, 400, { error: err instanceof Error ? err.message : String(err) });
      }
      return;
    }

    this.json(res, 404, { error: `No route for ${method} ${pathname}` });
  }

  private json(res: http.ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  private setupSSE(): void {
    const bus = getEventBus();
    const eventNames = [
      'trade:recorded', 'synapse:updated', 'rule:learned',
      'chain:detected', 'insight:created', 'calibration:updated',
    ] as const;

    for (const eventName of eventNames) {
      bus.on(eventName, (data: unknown) => {
        this.broadcastSSE({ type: 'event', event: eventName, data });
      });
    }

    this.statsTimer = setInterval(() => {
      if (this.sseClients.size > 0) {
        try {
          const summary = this.options.router.handle('analytics.summary', {});
          this.broadcastSSE({ type: 'stats_update', stats: summary });
        } catch { /* ignore */ }
      }
    }, 30_000);
  }

  private broadcastSSE(data: unknown): void {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try { client.write(msg); } catch { this.sseClients.delete(client); }
    }
  }
}
