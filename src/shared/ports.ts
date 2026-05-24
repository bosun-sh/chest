import { Context } from "effect";
import { newId } from "./ids";

export interface Clock {
  now(): Date;
  newId(): string;
}

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export const Clock = Context.GenericTag<Clock>("Clock");
export const Logger = Context.GenericTag<Logger>("Logger");

export const systemClock: Clock = {
  now: () => new Date(),
  newId,
};

export const consoleLogger: Logger = {
  info: (_message, _context) => void 0,
  warn: (_message, _context) => void 0,
  error: (_message, _context) => void 0,
};
