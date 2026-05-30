import { describe, expect, it } from "bun:test";
import chestApp from "../../../src/ohtools";
import { chestToolIds } from "../../../src/plugin/registry";

describe("plugin registry", () => {
  it("registers the full Chest tool surface", () => {
    expect(chestToolIds).toHaveLength(20);
    expect(new Set(chestToolIds).size).toBe(20);
    expect(chestToolIds).toContain("chest.init");
    expect(chestApp).toBeTruthy();
  });
});
