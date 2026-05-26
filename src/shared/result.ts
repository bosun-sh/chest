import type { ChestErrorCode } from "./error-codes";

export type ToolError = {
  code: ChestErrorCode | "ERR-CHEST-00";
  message: string;
  details?: unknown;
};

export type ToolResult<T> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; error: ToolError };

export const ok = <T>(data: T, warnings?: string[]): ToolResult<T> =>
  warnings?.length ? { ok: true, data, warnings } : { ok: true, data };

export const fail = (
  code: ToolError["code"],
  message: string,
  details?: unknown,
): ToolResult<never> => ({
  ok: false,
  error: details === undefined ? { code, message } : { code, message, details },
});
