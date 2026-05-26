import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

export const createTempDir = (prefix: string): string =>
  join(tmpdir(), `${prefix}-${randomUUID()}`);
