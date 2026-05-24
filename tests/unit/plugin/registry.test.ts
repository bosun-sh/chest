import { describe, expect, it } from "bun:test";
import { chestToolIds } from "../../../src/plugin/registry";
import chestApp from "../../../src/ohtools";

describe("plugin registry", () => {
  it("registers the full Chest tool surface", () => {
    expect(chestToolIds).toHaveLength(20);
    expect(new Set(chestToolIds).size).toBe(20);
    expect(chestToolIds).toContain("chest.init");
    expect(chestApp).toBeTruthy();
  });
});
