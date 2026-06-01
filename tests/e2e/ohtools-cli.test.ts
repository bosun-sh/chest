import { describe, expect, it } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createTempDir } from "../support/temp-dir";

const repoRoot = process.cwd();
const tempRoot = createTempDir("chest-e2e");

describe("ohtools cli", () => {
  it("exposes the Chest registry and can initialize a store", async () => {
    await mkdir(tempRoot, { recursive: true });

    const listOutput = execFileSync(
      "bunx",
      ["ohtools", "--app", "src/ohtools.ts", "list"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    const listJson = JSON.parse(listOutput) as {
      ok: boolean;
      data: Array<{ id: string }>;
    };

    expect(listJson.ok).toBe(true);
    expect(listJson.data).toHaveLength(20);
    expect(listJson.data.map((tool) => tool.id)).toContain("chest.init");

    const initOutput = execFileSync(
      "bunx",
      [
        "ohtools",
        "--app",
        "src/ohtools.ts",
        "run",
        "chest.init",
        "--input",
        JSON.stringify({ dir: tempRoot }),
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    const initJson = JSON.parse(initOutput) as {
      ok: boolean;
      data: {
        toolId: string;
        output: {
          ok: boolean;
          data: { created: string[] };
        };
      };
    };

    expect(initJson.ok).toBe(true);
    expect(initJson.data.toolId).toBe("chest.init");
    expect(initJson.data.output.ok).toBe(true);
    expect(initJson.data.output.data.created).toHaveLength(4);
  });

  it("TC-OHT-04: rejects extra input with OHTOOLS_VALIDATION_ERROR", () => {
    const result = spawnSync(
      "bunx",
      [
        "ohtools",
        "--app",
        "src/ohtools.ts",
        "run",
        "chest.init",
        "--input",
        JSON.stringify({ unexpected_field: "x" }),
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(3);

    const parsed = JSON.parse(result.stderr.trim()) as {
      ok: false;
      error: { code: string; message: string };
    };

    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe("OHTOOLS_VALIDATION_ERROR");
    expect(parsed.error.message).toContain("Input does not match JSON Schema");
  });
});
