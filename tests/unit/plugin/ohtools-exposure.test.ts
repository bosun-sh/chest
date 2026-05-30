import { describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
import chestApp from "../../../src/ohtools";
import { chestInputSchemas } from "../../../src/plugin/public-schemas";
import { chestToolIds } from "../../../src/plugin/registry";
import { chestCliApp } from "../../../src/workspace/cli-adapter";
import { chestMcpApp } from "../../../src/workspace/mcp-server";
import { createTempDir } from "../../support/temp-dir";

describe("ohtools exposure", () => {
  it("TC-OHT-01: exposes public input schemas for every tool id", () => {
    expect(Object.keys(chestInputSchemas)).toHaveLength(chestToolIds.length);

    for (const toolId of chestToolIds) {
      const schema = chestInputSchemas[toolId as keyof typeof chestInputSchemas];

      expect(schema).toBeTruthy();
      expect(schema.type).toBe("object");
      expect(schema.additionalProperties).toBe(false);
    }
  });

  it("TC-OHT-05: default export exposes the Chest registry and mcp adapter", () => {
    const registry = chestApp.build();

    expect([...registry.tools.keys()].sort()).toEqual([...chestToolIds].sort());
    expect(registry.adapters.has("mcp")).toBe(true);
  });

  it("TC-OHT-05: cli and mcp entrypoints attach their adapters", () => {
    expect(chestCliApp.build().adapters.has("cli")).toBe(true);
    expect(chestMcpApp.build().adapters.has("mcp")).toBe(true);
  });

  it("TC-OHT-02: tool handlers return ToolResult envelopes", async () => {
    const tempRoot = createTempDir("chest-oht");
    await mkdir(tempRoot, { recursive: true });

    const tool = chestApp.build().tools.get("chest.init");
    expect(tool).toBeTruthy();
    if (!tool) {
      throw new Error("Expected chest.init to be registered");
    }

    const result = await tool.run(
      { dir: tempRoot },
      { toolId: "chest.init", metadata: {} },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.created).toHaveLength(4);
      expect(result.data.skipped).toEqual([]);
    }
  });
});
