import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const createTempDir = (prefix: string): string =>
  join(tmpdir(), `${prefix}-${randomUUID()}`);
