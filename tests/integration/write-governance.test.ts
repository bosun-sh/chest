import { describe, expect, it } from "bun:test";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { OKR } from "../../src/okrs/schema";
import { upsertRecord } from "../../src/plugin/record-store";
import { atomicWriteText } from "../../src/shared/atomic-write";
import { createTempDir } from "../support/temp-dir";

const fixtureRoot = join(process.cwd(), "tests/fixtures/governance/valid");
const tempRoot = createTempDir("chest-write");
const storeDir = join(tempRoot, ".chest");
const okrsFile = join(storeDir, "okrs.yaml");

describe("governance write helpers", () => {
  it("updates a copied governance file atomically", async () => {
    await mkdir(tempRoot, { recursive: true });
    const source = join(fixtureRoot, "okrs.yaml");
    const target = join(tempRoot, "okrs.yaml");
    await copyFile(source, target);

    await atomicWriteText(target, '[{"id":"okr-3","objective":"New","keyResults":[{"id":"kr-1","description":"Desc","target":"1"}]}]\n');

    const contents = await readFile(target, "utf8");
    expect(contents).toContain("okr-3");
  });

  it("rejects malformed runtime records before writing", async () => {
    await mkdir(storeDir, { recursive: true });
    await copyFile(join(fixtureRoot, "okrs.yaml"), okrsFile);

    const before = await readFile(okrsFile, "utf8");
    const result = await upsertRecord<OKR>(tempRoot, "okrs", { id: "okr-3" } as unknown as OKR);

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ERR-CHEST-02",
        message: "OKR record failed schema validation.",
        details: {
          file: okrsFile,
          violations: [
            { path: "record.objective", constraint: "required field missing" },
            { path: "record.keyResults", constraint: "required field missing" },
          ],
        },
      },
    });
    expect(await readFile(okrsFile, "utf8")).toBe(before);
  });

  it("cleans up", async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });
});
