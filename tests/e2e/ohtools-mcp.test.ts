import { afterAll, describe, expect, it } from "bun:test";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { chestToolIds } from "../../src/plugin/registry";

const repoRoot = process.cwd();
const tempRoot = join("/private/tmp", `chest-mcp-e2e-${Date.now()}`);
const chestRoot = join(tempRoot, ".chest");
const launcherPath = join(repoRoot, "tests/e2e/.launch-mcp.ts");
const fixtureRoot = join(repoRoot, "tests/fixtures/governance/valid");

let transport: StdioClientTransport | undefined;
let client: Client | undefined;

async function prepareLauncher() {
  await mkdir(chestRoot, { recursive: true });

  await Promise.all([
    copyFile(join(fixtureRoot, "definition-of-ready.yaml"), join(chestRoot, "definition-of-ready.yaml")),
    copyFile(join(fixtureRoot, "definition-of-done.yaml"), join(chestRoot, "definition-of-done.yaml")),
    copyFile(join(fixtureRoot, "okrs.yaml"), join(chestRoot, "okrs.yaml")),
    copyFile(join(fixtureRoot, "kpis.yaml"), join(chestRoot, "kpis.yaml")),
  ]);

  const launcherSource = [
    `import { chestMcpApp as app } from "../../src/workspace/mcp-server.ts";`,
    "const registry = app.build();",
    'const adapter = registry.adapters.get("mcp");',
    'if (!adapter) throw new Error("Missing mcp adapter");',
    'const handle = adapter.attach({ registry, runtime: app.runtime.bind(app) });',
    "await handle.start();",
    "const shutdown = async () => {",
    "  await handle.stop?.();",
    "  process.exit(0);",
    "};",
    'process.on("SIGINT", shutdown);',
    'process.on("SIGTERM", shutdown);',
    "await new Promise(() => {});",
    "",
  ].join("\n");

  await writeFile(launcherPath, launcherSource);
}

afterAll(async () => {
  await client?.close();
  await transport?.close();
  await rm(launcherPath, { force: true });
  await rm(tempRoot, { recursive: true, force: true });
});

describe("ohtools mcp", () => {
  it("TC-OHT-03: exposes tools/list and calls chest.validate.ready over stdio", async () => {
    await prepareLauncher();

    transport = new StdioClientTransport({
      command: "bun",
      args: [launcherPath],
      cwd: tempRoot,
      stderr: "pipe",
    });

    client = new Client({ name: "chest-e2e", version: "1.0.0" });
    const stderrChunks: string[] = [];
    transport.stderr?.on("data", (chunk) => stderrChunks.push(String(chunk)));

    try {
      await client.connect(transport);

      const listed = await client.listTools();
      const toolNames = listed.tools.map((tool) => tool.name);
      for (const toolId of chestToolIds) {
        expect(toolNames).toContain(toolId);
      }

      for (const tool of listed.tools.filter((item) => item.name.startsWith("chest."))) {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.additionalProperties).toBe(false);
      }

      const result = await client.callTool({
        name: "chest.validate.ready",
        arguments: {
          plan: "Implement chest init with acceptance criteria and risks.",
        },
      });

      expect(result.content).toHaveLength(1);
      const first = result.content[0];
      expect(first?.type).toBe("text");
      if (first?.type !== "text") {
        throw new Error("Expected chest.validate.ready to return text content");
      }

      const payload = JSON.parse(first.text) as {
        ok: boolean;
        data: { workflow: string; status: string };
      };

      expect(payload.ok).toBe(true);
      expect(payload.data.workflow).toBe("ready");
      expect(["passed", "failed", "needs_review"]).toContain(payload.data.status);
    } catch (error) {
      throw new Error(`MCP stdio launcher failed: ${stderrChunks.join("") || "(no stderr)"}`, {
        cause: error,
      });
    }
  });
});
