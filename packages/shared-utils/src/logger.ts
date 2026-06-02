import winston from 'winston';

export type Logger = winston.Logger;

/**
 * Create a Winston logger scoped to a service. Format and level are driven by
 * the LOG_FORMAT / LOG_LEVEL environment variables.
 */
export function createLogger(service: string): Logger {
  const isJson = (process.env.LOG_FORMAT ?? 'json') === 'json';

  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    defaultMeta: { service },
    format: isJson
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(
            ({ level, message, timestamp, service: svc }) =>
              `${timestamp} [${svc}] ${level}: ${message}`,
          ),
        ),
    transports: [new winston.transports.Console()],
  });
}
