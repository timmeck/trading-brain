import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { IpcClient } from '../ipc/client.js';
import { getPipeName } from '../utils/paths.js';
import { registerTools } from './tools.js';

function spawnDaemon(): void {
  const entryPoint = path.resolve(import.meta.dirname, '../index.js');
  const child = spawn(process.execPath, [
    '--import', 'tsx',
    entryPoint, 'daemon',
  ], {
    detached: true,
    stdio: 'ignore',
    cwd: path.resolve(import.meta.dirname, '../..'),
  });
  child.unref();
  process.stderr.write(`Trading Brain: Auto-started daemon (PID: ${child.pid})\n`);
}

async function connectWithRetry(ipc: IpcClient, retries: number, delayMs: number): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await ipc.connect();
      return;
    } catch {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw new Error('Could not connect to daemon after retries');
}

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'trading-brain',
    version: '1.0.0',
  });

  const ipc = new IpcClient(getPipeName());

  try {
    await ipc.connect();
  } catch {
    process.stderr.write('Trading Brain: Daemon not running, starting automatically...\n');
    spawnDaemon();
    try {
      await connectWithRetry(ipc, 10, 500);
    } catch {
      process.stderr.write('Trading Brain: Could not connect to daemon after auto-start. Check logs.\n');
      process.exit(1);
    }
  }

  registerTools(server, ipc);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on('SIGINT', () => {
    ipc.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    ipc.disconnect();
    process.exit(0);
  });
}
