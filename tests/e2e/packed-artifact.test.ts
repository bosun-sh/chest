import { afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTempDir } from "../support/temp-dir";

const repoRoot = process.cwd();
const tempRoot = createTempDir("chest-packed-smoke");
const installRoot = join(tempRoot, "node_modules", "@bosun-sh", "chest");
const helperScript = join(tempRoot, "smoke.ts");
const tempNodeModules = join(tempRoot, "node_modules");

let tarballPath: string | undefined;

afterAll(async () => {
  if (tarballPath) {
    await rm(tarballPath, { force: true });
  }
  await rm(tempRoot, { recursive: true, force: true });
});

describe("packed artifact", () => {
  it(
    "smoke-tests the packed package exports from an installed tarball",
    async () => {
      const build = spawnSync("bun", ["run", "build"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          TMPDIR: tmpdir(),
          XDG_CACHE_HOME: tmpdir(),
          BUN_INSTALL_CACHE_DIR: join(tmpdir(), "bun-cache"),
        },
      });

      expect(build.status).toBe(0);
      if (build.status !== 0) {
        throw new Error(build.stderr || build.stdout || "Failed to build package");
      }

      await mkdir(tempRoot, { recursive: true });
      const pack = spawnSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", tempRoot], {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, npm_config_cache: join(tmpdir(), "chest-npm-cache") },
      });

      if (pack.status !== 0) {
        throw new Error(pack.stderr || pack.stdout || "Failed to create tarball");
      }
      expect(pack.status).toBe(0);
      tarballPath = join(tempRoot, JSON.parse(pack.stdout)[0].filename);

      await cp(join(repoRoot, "node_modules"), tempNodeModules, { recursive: true });
      await mkdir(installRoot, { recursive: true });
      await writeFile(
        join(tempRoot, "package.json"),
        JSON.stringify({ name: "chest-packed-smoke", private: true }, null, 2),
      );

      const extract = spawnSync(
        "tar",
        ["-xzf", tarballPath, "-C", installRoot, "--strip-components=1"],
        {
          encoding: "utf8",
        },
      );

      expect(extract.status).toBe(0);
      if (extract.status !== 0) {
        throw new Error(extract.stderr || extract.stdout || "Failed to extract tarball");
      }

      await writeFile(
        helperScript,
        [
          'import { createChestApp, chestToolIds } from "@bosun-sh/chest";',
          'import { chestCliApp } from "@bosun-sh/chest/cli";',
          'import { chestMcpApp } from "@bosun-sh/chest/mcp";',
          'import chestApp from "@bosun-sh/chest/ohtools";',
          'if (typeof createChestApp !== "function") throw new Error("Missing createChestApp export");',
          'if (!Array.isArray(chestToolIds) || chestToolIds.length !== 20) throw new Error("Unexpected chestToolIds export");',
          'const rootRegistry = createChestApp().build();',
          'if (!rootRegistry.tools.has("chest.init")) throw new Error("Missing chest.init tool");',
          'if (!rootRegistry.adapters.has("mcp")) throw new Error("Missing mcp adapter on createChestApp");',
          'if (!chestApp.build().adapters.has("mcp")) throw new Error("Missing mcp adapter on default ohtools export");',
          'if (!chestCliApp.build().adapters.has("cli")) throw new Error("Missing cli adapter export");',
          'if (!chestMcpApp.build().adapters.has("mcp")) throw new Error("Missing mcp adapter export");',
          'console.log("packed artifact smoke test passed");',
          "",
        ].join("\n"),
      );

      const smoke = spawnSync("bun", [helperScript], {
        cwd: tempRoot,
        encoding: "utf8",
      });

      if (smoke.status !== 0) {
        throw new Error(
          `Packed artifact smoke test failed:\nstdout:\n${smoke.stdout || "(empty)"}\nstderr:\n${smoke.stderr || "(empty)"}`,
        );
      }
      expect(smoke.status).toBe(0);

      const judgeScript = join(tempRoot, "public-judge.ts");
      await cp(join(repoRoot, "tests/fixtures/public-judge.ts"), judgeScript);
      const judge = spawnSync("bun", [judgeScript], { cwd: tempRoot, encoding: "utf8" });
      if (judge.status !== 0) throw new Error(`Packed judge contract failed:\n${judge.stdout}\n${judge.stderr}`);
      expect(judge.status).toBe(0);
      const types = spawnSync("bun", [
        join(repoRoot, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--skipLibCheck",
        "--target", "ES2022", "--module", "ESNext", "--moduleResolution", "Bundler", judgeScript,
      ], { cwd: tempRoot, encoding: "utf8" });
      if (types.status !== 0) throw new Error(`Packed judge declarations failed:\n${types.stdout}\n${types.stderr}`);
      expect(types.status).toBe(0);

      const installedPackageJson = await readFile(join(installRoot, "package.json"), "utf8");
      expect(installedPackageJson).toContain('"name": "@bosun-sh/chest"');
    },
    30000,
  );
});
