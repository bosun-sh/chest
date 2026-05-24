declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};

type Buffer = Uint8Array;
declare const Buffer: unknown;

declare module "node:stream" {
  export interface Readable {}
  export interface Writable {}
}

declare module "node:fs" {
  export const constants: {
    W_OK: number;
  };
}

declare module "node:fs/promises" {
  export function access(path: string, mode?: number): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
  export function readdir(
    path: string,
    options?: { withFileTypes?: boolean },
  ): Promise<Array<{ isFile(): boolean; isDirectory(): boolean; name: string }>>;
  export function rename(oldPath: string, newPath: string): Promise<void>;
  export function writeFile(path: string, data: string, encoding?: string): Promise<void>;
}

declare module "node:child_process" {
  export function execFileSync(
    file: string,
    args?: string[],
    options?: { cwd?: string; encoding?: "utf8" | string },
  ): string;
  export function spawnSync(
    file: string,
    args?: string[],
    options?: {
      cwd?: string;
      encoding?: "utf8" | string;
      timeout?: number;
      maxBuffer?: number;
      shell?: boolean;
      windowsHide?: boolean;
    },
  ): {
    status: number | null;
    stdout: string | Uint8Array;
    stderr: string | Uint8Array;
    signal?: string | null;
    error?: Error & { code?: string };
  };
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function join(...parts: string[]): string;
}

declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export const test: typeof it;
  export function expect(value: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toContain(expected: unknown): void;
    toHaveLength(expected: number): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeUndefined(): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeGreaterThan(expected: number): void;
    toMatchObject(expected: unknown): void;
    not: {
      toContain(expected: unknown): void;
    };
    rejects: {
      toMatchObject(expected: unknown): Promise<void>;
    };
  };
}
