import { describe, expect, it } from "bun:test";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { parseYaml } from "../../src/shared/yaml-parse";
import { validateOKRs } from "../../src/okrs/schema";
import { validateKPIs } from "../../src/kpis/schema";
import { validateDoR } from "../../src/dor/schema";
import { validateDoD } from "../../src/dod/schema";
import { loadCollection, readRecord } from "../../src/plugin/record-store";
import type { OKR } from "../../src/okrs/schema";

const fixtureRoot = join(process.cwd(), "tests/fixtures/governance");
const tempRoot = join("/private/tmp", `chest-read-${Date.now()}`);
const storeDir = join(tempRoot, ".chest");
const okrsFile = join(storeDir, "okrs.yaml");

const seedStore = async (fixtureName: "valid" | "missing-keys" | "invalid-yaml") => {
  await mkdir(storeDir, { recursive: true });
  await copyFile(join(fixtureRoot, fixtureName, "okrs.yaml"), okrsFile);
};

describe("governance read helpers", () => {
  it("parses the valid governance fixtures as real YAML", async () => {
    const parsed = parseYaml<unknown[]>(await readFile(join(fixtureRoot, "valid", "okrs.yaml"), "utf8"));
    expect(Array.isArray(parsed)).toBeTruthy();
    expect(parsed).toHaveLength(2);
    expect(validateOKRs(parsed).ok).toBeTruthy();

    const kpis = parseYaml<unknown[]>(await readFile(join(fixtureRoot, "valid", "kpis.yaml"), "utf8"));
    expect(validateKPIs(kpis).ok).toBeTruthy();

    const dor = parseYaml<unknown[]>(await readFile(join(fixtureRoot, "valid", "definition-of-ready.yaml"), "utf8"));
    const dod = parseYaml<unknown[]>(await readFile(join(fixtureRoot, "valid", "definition-of-done.yaml"), "utf8"));
    expect(validateDoR(dor).ok).toBeTruthy();
    expect(validateDoD(dod).ok).toBeTruthy();
  });

  it("throws on invalid YAML with a line number", async () => {
    const file = join(fixtureRoot, "invalid-yaml", "okrs.yaml");
    try {
      parseYaml<unknown[]>(await readFile(file, "utf8"));
      expect.unreachable("expected parseYaml to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error & { line?: number }).line).toBe(3);
    }
  });

  it("returns a missing file diagnostic when the store has not been initialized", async () => {
    const result = await loadCollection<OKR>(tempRoot, "okrs");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "ERR-CHEST-03",
        message: `Governance file not found: ${okrsFile}. Run chest.init to create the governance store.`,
        details: { path: okrsFile },
      },
    });
  });

  it("maps schema violations from parsed governance files", async () => {
    await seedStore("missing-keys");

    const result = await loadCollection<OKR>(tempRoot, "okrs");
    expect(result.ok).toBeFalsy();
    if (result.ok) {
      return;
    }

    expect(result.error).toMatchObject({
      code: "ERR-CHEST-02",
      details: {
        file: okrsFile,
        violations: [
          {
            path: "records[1].objective",
            constraint: "required field missing",
          },
        ],
      },
    });
  });

  it("returns a record not found error for missing ids", async () => {
    await seedStore("valid");

    const result = await readRecord<OKR>(tempRoot, "okrs", "okr-99");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "ERR-CHEST-02",
        message: "OKR with id 'okr-99' not found.",
      },
    });
  });

  it("cleans up temp files", async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });
});
