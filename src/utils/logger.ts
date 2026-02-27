import winston from 'winston';
import path from 'node:path';
import { getDataDir } from './paths.js';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]${metaStr} ${message}`;
});

let loggerInstance: winston.Logger | null = null;

export function createLogger(opts?: { level?: string; file?: string; maxSize?: number; maxFiles?: number }): winston.Logger {
  if (loggerInstance) return loggerInstance;

  const level = opts?.level ?? process.env['TRADING_BRAIN_LOG_LEVEL'] ?? 'info';
  const logFile = opts?.file ?? path.join(getDataDir(), 'trading-brain.log');
  const maxSize = opts?.maxSize ?? 10 * 1024 * 1024;
  const maxFiles = opts?.maxFiles ?? 3;

  const transports: winston.transport[] = [
    new winston.transports.File({
      filename: logFile,
      maxsize: maxSize,
      maxFiles,
      format: combine(timestamp(), logFormat),
    }),
  ];

  if (process.env['NODE_ENV'] !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: combine(colorize(), timestamp(), logFormat),
      })
    );
  }

  loggerInstance = winston.createLogger({ level, transports });
  return loggerInstance;
}

export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}
