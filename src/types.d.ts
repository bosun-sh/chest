declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};

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
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function join(...parts: string[]): string;
}

declare module "@bosun-sh/ohtools" {
  export class Ohtools {
    constructor();
    tool<Input = unknown, Output = unknown>(
      id: string,
      definition: { description: string; input: unknown; run: (input: Input) => Output },
    ): Ohtools;
    adapter(adapter: unknown): Ohtools;
  }

  export function jsonSchema<T>(schema: T): T;
}

declare module "@bosun-sh/ohtools/adapters/mcp" {
  export function mcpAdapter(): unknown;
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
    not: {
      toContain(expected: unknown): void;
    };
  };
}
