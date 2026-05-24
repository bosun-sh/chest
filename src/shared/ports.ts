export interface Clock {
  now(): Date;
}

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export const consoleLogger: Logger = {
  info: (_message, _context) => void 0,
  warn: (_message, _context) => void 0,
  error: (_message, _context) => void 0,
};
